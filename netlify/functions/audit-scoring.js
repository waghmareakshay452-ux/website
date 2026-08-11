// netlify/functions/audit-scoring.js
//
// Stage 2 — Scoring engine only.
//
// Takes the factual `data` object produced by netlify/functions/audit.js
// (Stage 1) and returns deterministic category scores + an overall score,
// plus a list of individual check results.
//
// This module does NOT call any external API and does NOT use Gemini.
// Same input -> same output, always. No randomness, no network calls.
//
// Design principle: we only score what the Stage-1 fetch can actually
// measure from raw homepage HTML. Anything we cannot reliably measure
// (real visual design quality, actual mobile rendering, real performance
// metrics, actual conversion rate, testimonials/reviews, "about us" content)
// is marked "unavailable" rather than guessed. Unavailable checks are
// excluded from the scoring denominator for that category, and if an
// entire category has no available checks, that category score is
// returned as null with a note — it is dropped from the overall weighted
// average rather than silently defaulting to some number.

// ---------------------------------------------------------------------------
// OVERALL SCORE WEIGHTS
// ---------------------------------------------------------------------------
// These weights only apply across categories that actually produced a score.
// If a category is unavailable, remaining weights are renormalized to sum
// to 1 so the overall score stays meaningful rather than being dragged down
// by categories we couldn't measure.
const CATEGORY_WEIGHTS = {
  seo: 0.20,
  mobile: 0.15,
  performance: 0.15,
  conversion: 0.15,
  contact: 0.15,
  trust: 0.10,
  design: 0.10
};
// Rationale: SEO and the lead-generation categories (conversion/contact)
// carry the most weight because they're both reliably measurable from HTML
// and directly tied to whether the site brings in business. Mobile and
// performance are weighted next since they're partially measurable.
// Trust and design carry the least weight because our HTML-only signals
// for them are the weakest / most indirect.

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// Builds one check result. `earned`/`max` are in point-space for that check.
// `points` mirrors the example in the spec (negative = points lost).
function makeCheck(category, check, status, earned, max, message) {
  return {
    category,
    check,
    status, // 'pass' | 'partial' | 'fail' | 'unavailable'
    earned: status === 'unavailable' ? null : round1(earned),
    max: status === 'unavailable' ? null : max,
    points: status === 'unavailable' ? 0 : round1(earned - max), // delta, matches spec example semantics
    message
  };
}

// Rolls up a list of checks into a 0-100 category score.
// Unavailable checks are excluded from the denominator entirely.
function scoreCategory(checks) {
  const usable = checks.filter(c => c.status !== 'unavailable');
  if (usable.length === 0) {
    return { score: null, insufficientData: true };
  }
  const totalMax = usable.reduce((sum, c) => sum + c.max, 0);
  const totalEarned = usable.reduce((sum, c) => sum + c.earned, 0);
  if (totalMax === 0) {
    return { score: null, insufficientData: true };
  }
  const score = clamp(Math.round((totalEarned / totalMax) * 100), 0, 100);
  return { score, insufficientData: false };
}

// ---------------------------------------------------------------------------
// Category check builders
// Each takes the Stage-1 `data` object and returns an array of check results.
// ---------------------------------------------------------------------------

function checkSeo(data) {
  const checks = [];

  // Title exists (20 pts)
  const titleExists = Boolean(data.title && data.title.exists);
  checks.push(makeCheck('SEO', 'Title tag exists', titleExists ? 'pass' : 'fail',
    titleExists ? 20 : 0, 20,
    titleExists ? 'Page has a title tag.' : 'Page title is missing.'));

  // Title reasonable length (10 pts) — only meaningful if title exists
  if (titleExists) {
    const len = (data.title.text || '').length;
    const ideal = len >= 15 && len <= 60;
    const tooShortOrLong = len > 0 && !ideal;
    const status = ideal ? 'pass' : (tooShortOrLong ? 'partial' : 'fail');
    const earned = ideal ? 10 : (tooShortOrLong ? 5 : 0);
    checks.push(makeCheck('SEO', 'Title length is reasonable', status, earned, 10,
      ideal ? `Title length (${len} characters) is in a reasonable range.`
            : `Title is ${len} characters — outside the typical 15–60 character range.`));
  } else {
    checks.push(makeCheck('SEO', 'Title length is reasonable', 'unavailable', 0, 10,
      'Cannot evaluate title length — no title was found.'));
  }

  // Meta description exists (20 pts)
  const metaExists = Boolean(data.metaDescription && data.metaDescription.exists);
  checks.push(makeCheck('SEO', 'Meta description exists', metaExists ? 'pass' : 'fail',
    metaExists ? 20 : 0, 20,
    metaExists ? 'Meta description is present.' : 'Meta description is missing.'));

  // H1 exists (15 pts)
  const h1Count = typeof data.h1Count === 'number' ? data.h1Count : 0;
  const h1Exists = h1Count > 0;
  checks.push(makeCheck('SEO', 'H1 heading exists', h1Exists ? 'pass' : 'fail',
    h1Exists ? 15 : 0, 15,
    h1Exists ? 'Page has an H1 heading.' : 'No H1 heading was found on the page.'));

  // H1 count is reasonable — i.e. exactly 1 (10 pts)
  if (h1Exists) {
    const oneH1 = h1Count === 1;
    checks.push(makeCheck('SEO', 'H1 count is reasonable', oneH1 ? 'pass' : 'partial',
      oneH1 ? 10 : 4, 10,
      oneH1 ? 'Page has exactly one H1 heading.' : `Page has ${h1Count} H1 headings — typically one H1 per page is recommended.`));
  } else {
    checks.push(makeCheck('SEO', 'H1 count is reasonable', 'unavailable', 0, 10,
      'Cannot evaluate H1 count — no H1 was found.'));
  }

  // Image alt coverage (15 pts) — only meaningful if there are images
  const imgTotal = data.images ? data.images.total : 0;
  if (imgTotal > 0) {
    const withAlt = data.images.withAlt || 0;
    const ratio = withAlt / imgTotal;
    const status = ratio >= 0.9 ? 'pass' : (ratio > 0 ? 'partial' : 'fail');
    checks.push(makeCheck('SEO', 'Images have alt text', status, ratio * 15, 15,
      `${withAlt} of ${imgTotal} images have alt text (${Math.round(ratio * 100)}%).`));
  } else {
    checks.push(makeCheck('SEO', 'Images have alt text', 'unavailable', 0, 15,
      'No images were found to evaluate.'));
  }

  // HTTPS enabled (10 pts)
  const https = Boolean(data.https);
  checks.push(makeCheck('SEO', 'HTTPS enabled', https ? 'pass' : 'fail',
    https ? 10 : 0, 10,
    https ? 'Site is served over HTTPS.' : 'Site is not served over HTTPS.'));

  return checks;
}

function checkMobile(data) {
  const checks = [];

  // Viewport meta tag exists (this is the one thing we can reliably detect)
  const viewport = Boolean(data.viewportDetected);
  checks.push(makeCheck('Mobile', 'Viewport meta tag present', viewport ? 'pass' : 'fail',
    viewport ? 100 : 0, 100,
    viewport ? 'Viewport meta tag is present, which is required for responsive rendering.'
              : 'No viewport meta tag was found — the page likely will not render responsively on mobile.'));

  // Explicitly-unavailable check, included so the report is honest about
  // what a full mobile audit would need but we did not measure.
  checks.push(makeCheck('Mobile', 'Responsive layout behavior', 'unavailable', 0, 0,
    'Actual responsive rendering (how the layout adapts on real mobile screens) cannot be determined from raw HTML alone — this would require CSS/rendering analysis not performed in this MVP.'));

  return checks;
}

function checkPerformance(data) {
  const checks = [];

  // Page size (40 pts) — tiered
  const bytes = typeof data.pageSizeBytes === 'number' ? data.pageSizeBytes : null;
  if (bytes !== null) {
    let earned, status, message;
    const kb = bytes / 1024;
    if (kb <= 200) { earned = 40; status = 'pass'; message = `HTML size is ${Math.round(kb)}KB — light.`; }
    else if (kb <= 500) { earned = 30; status = 'pass'; message = `HTML size is ${Math.round(kb)}KB — reasonable.`; }
    else if (kb <= 1024) { earned = 18; status = 'partial'; message = `HTML size is ${Math.round(kb)}KB — on the heavier side.`; }
    else { earned = 8; status = 'fail'; message = `HTML size is ${Math.round(kb)}KB — quite heavy for a homepage.`; }
    checks.push(makeCheck('Performance', 'HTML page size', status, earned, 40, message));
  } else {
    checks.push(makeCheck('Performance', 'HTML page size', 'unavailable', 0, 40, 'Page size could not be determined.'));
  }

  // Image count (30 pts) — tiered heuristic
  const imgTotal = data.images ? data.images.total : null;
  if (imgTotal !== null) {
    let earned, status, message;
    if (imgTotal <= 10) { earned = 30; status = 'pass'; message = `${imgTotal} images detected — light.`; }
    else if (imgTotal <= 25) { earned = 20; status = 'partial'; message = `${imgTotal} images detected — moderate.`; }
    else { earned = 10; status = 'fail'; message = `${imgTotal} images detected — high image count can slow page load.`; }
    checks.push(makeCheck('Performance', 'Image count', status, earned, 30, message));
  } else {
    checks.push(makeCheck('Performance', 'Image count', 'unavailable', 0, 30, 'Image count could not be determined.'));
  }

  // Link/resource count (30 pts) — tiered heuristic
  const linkTotal = data.links ? data.links.total : null;
  if (linkTotal !== null) {
    let earned, status, message;
    if (linkTotal <= 50) { earned = 30; status = 'pass'; message = `${linkTotal} links detected — reasonable.`; }
    else if (linkTotal <= 150) { earned = 18; status = 'partial'; message = `${linkTotal} links detected — on the higher side.`; }
    else { earned = 8; status = 'fail'; message = `${linkTotal} links detected — very high link count.`; }
    checks.push(makeCheck('Performance', 'Link count', status, earned, 30, message));
  } else {
    checks.push(makeCheck('Performance', 'Link count', 'unavailable', 0, 30, 'Link count could not be determined.'));
  }

  return checks;
}

function checkConversion(data) {
  const checks = [];

  const cta = Boolean(data.ctaDetected);
  checks.push(makeCheck('Conversion', 'Call-to-action detected', cta ? 'pass' : 'fail',
    cta ? 40 : 0, 40,
    cta ? 'A call-to-action button or link was detected.' : 'No clear call-to-action was detected.'));

  const phone = Boolean(data.phoneDetected);
  checks.push(makeCheck('Conversion', 'Phone number detected', phone ? 'pass' : 'fail',
    phone ? 20 : 0, 20,
    phone ? 'A phone number was detected on the page.' : 'No phone number was detected.'));

  const contactPage = Boolean(data.contactPageDetected);
  checks.push(makeCheck('Conversion', 'Contact page/link detected', contactPage ? 'pass' : 'fail',
    contactPage ? 20 : 0, 20,
    contactPage ? 'A contact page or link was detected.' : 'No contact page or link was detected.'));

  const email = Boolean(data.emailDetected);
  checks.push(makeCheck('Conversion', 'Email contact method detected', email ? 'pass' : 'fail',
    email ? 20 : 0, 20,
    email ? 'An email contact method was detected.' : 'No email contact method was detected.'));

  return checks;
}

function checkContact(data) {
  const checks = [];

  const phone = Boolean(data.phoneDetected);
  checks.push(makeCheck('Contact', 'Phone number detected', phone ? 'pass' : 'fail',
    phone ? 25 : 0, 25,
    phone ? 'Phone number detected.' : 'No phone number detected.'));

  const email = Boolean(data.emailDetected);
  checks.push(makeCheck('Contact', 'Email address detected', email ? 'pass' : 'fail',
    email ? 25 : 0, 25,
    email ? 'Email address detected.' : 'No email address detected.'));

  const contactPage = Boolean(data.contactPageDetected);
  checks.push(makeCheck('Contact', 'Contact page detected', contactPage ? 'pass' : 'fail',
    contactPage ? 20 : 0, 20,
    contactPage ? 'Contact page or link detected.' : 'No contact page or link detected.'));

  const whatsapp = Boolean(data.whatsappDetected);
  checks.push(makeCheck('Contact', 'WhatsApp link detected', whatsapp ? 'pass' : 'fail',
    whatsapp ? 15 : 0, 15,
    whatsapp ? 'WhatsApp contact link detected.' : 'No WhatsApp link detected.'));

  const cta = Boolean(data.ctaDetected);
  checks.push(makeCheck('Contact', 'Lead-capture CTA detected', cta ? 'pass' : 'fail',
    cta ? 15 : 0, 15,
    cta ? 'A lead-capture call-to-action was detected.' : 'No lead-capture call-to-action was detected.'));

  return checks;
}

function checkTrust(data) {
  const checks = [];

  const social = Boolean(data.socialLinksDetected);
  checks.push(makeCheck('Trust', 'Social media links detected', social ? 'pass' : 'fail',
    social ? 50 : 0, 50,
    social ? 'Links to social media profiles were detected.' : 'No social media links were detected.'));

  const contactInfo = Boolean(data.phoneDetected || data.emailDetected);
  checks.push(makeCheck('Trust', 'Contact information present', contactInfo ? 'pass' : 'fail',
    contactInfo ? 50 : 0, 50,
    contactInfo ? 'Phone or email contact information is present, a basic trust signal.'
                 : 'No phone or email contact information was detected.'));

  // Explicitly unavailable — do NOT invent these.
  checks.push(makeCheck('Trust', 'Testimonials/reviews detected', 'unavailable', 0, 0,
    'Detecting genuine testimonial/review content reliably requires deeper content analysis than this MVP performs — not evaluated.'));
  checks.push(makeCheck('Trust', 'About/business information detected', 'unavailable', 0, 0,
    'Detecting genuine "About" content reliably requires deeper content analysis than this MVP performs — not evaluated.'));

  return checks;
}

function checkDesign(data) {
  // Explicitly structural signals only — NOT a visual design assessment.
  const checks = [];

  const h1Count = typeof data.h1Count === 'number' ? data.h1Count : 0;
  const h1 = h1Count > 0;
  checks.push(makeCheck('Design', 'Has a primary heading (H1)', h1 ? 'pass' : 'fail',
    h1 ? 25 : 0, 25,
    h1 ? 'Page has a primary H1 heading.' : 'No H1 heading found.'));

  const h2Count = typeof data.h2Count === 'number' ? data.h2Count : 0;
  const hierarchy = h1 && h2Count > 0;
  checks.push(makeCheck('Design', 'Heading hierarchy present (H1 + H2)', hierarchy ? 'pass' : 'fail',
    hierarchy ? 25 : 0, 25,
    hierarchy ? 'Page has both H1 and H2 headings, suggesting structured content.'
               : 'Page is missing a clear H1/H2 heading structure.'));

  const cta = Boolean(data.ctaDetected);
  checks.push(makeCheck('Design', 'CTA present as a structural element', cta ? 'pass' : 'fail',
    cta ? 25 : 0, 25,
    cta ? 'A structural call-to-action element was detected.' : 'No structural call-to-action element was detected.'));

  const imgTotal = data.images ? data.images.total : 0;
  const hasImages = imgTotal > 0;
  checks.push(makeCheck('Design', 'Uses imagery', hasImages ? 'pass' : 'fail',
    hasImages ? 25 : 0, 25,
    hasImages ? `Page includes ${imgTotal} image(s).` : 'No images were found on the page.'));

  return checks;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

function scoreAudit(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('scoreAudit requires a Stage-1 audit data object.');
  }

  const checksByCategory = {
    seo: checkSeo(data),
    mobile: checkMobile(data),
    performance: checkPerformance(data),
    conversion: checkConversion(data),
    contact: checkContact(data),
    trust: checkTrust(data),
    design: checkDesign(data)
  };

  const scores = {};
  const insufficientData = {};
  for (const key of Object.keys(checksByCategory)) {
    const { score, insufficientData: insuff } = scoreCategory(checksByCategory[key]);
    scores[key] = score;
    insufficientData[key] = insuff;
  }

  // Weighted overall score, renormalized across categories that actually scored.
  let weightSum = 0;
  let weightedTotal = 0;
  for (const key of Object.keys(CATEGORY_WEIGHTS)) {
    if (scores[key] !== null) {
      weightSum += CATEGORY_WEIGHTS[key];
      weightedTotal += scores[key] * CATEGORY_WEIGHTS[key];
    }
  }
  const overall = weightSum > 0 ? clamp(Math.round(weightedTotal / weightSum), 0, 100) : null;

  // Flatten all checks into one list, matching the spec's example shape,
  // with the extra earned/max fields left in for transparency.
  const checks = Object.values(checksByCategory).flat();

  return {
    scores: {
      overall,
      design: scores.design,
      mobile: scores.mobile,
      performance: scores.performance,
      seo: scores.seo,
      conversion: scores.conversion,
      contact: scores.contact,
      trust: scores.trust
    },
    insufficientData, // { seo: false, mobile: false, ... } — true means category had zero usable checks
    weights: CATEGORY_WEIGHTS,
    checks
  };
}

module.exports = { scoreAudit, CATEGORY_WEIGHTS };

