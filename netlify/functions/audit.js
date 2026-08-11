// netlify/functions/audit.js
//
// Orchestrates the full audit pipeline:
//   1. Validate the submitted URL
//   2. Fetch the homepage server-side (Stage 1)
//   3. Extract factual signals from the HTML (Stage 1)
//   4. Run the deterministic scoring engine (Stage 2 — audit-scoring.js)
//   5. Send the resulting scores/checks (read-only) to Gemini for plain-
//      language explanations (Stage 3 — audit-explain.js)
//   6. Return scores + checks + AI explanations together
//
// Scores ALWAYS come from audit-scoring.js and are never touched by step 5.
// If Gemini fails or is unavailable, the function still returns the full
// deterministic audit — only the `ai` field reflects the failure.

const { scoreAudit } = require('./audit-scoring.js');
const { getAiExplanation } = require('./audit-explain.js');

const FETCH_TIMEOUT_MS = 8000; // keep well under Netlify's function time limit
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB safety cap on how much HTML we read

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { success: false, error: 'Method not allowed. Use POST.' }, headers);
  }

  // ---- Parse & validate input -------------------------------------------------
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return respond(400, { success: false, error: 'Invalid JSON body.' }, headers);
  }

  const rawUrl = (body.url || '').toString().trim();
  if (!rawUrl) {
    return respond(400, { success: false, error: 'Missing "url" field.' }, headers);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch (e) {
    return respond(400, { success: false, error: 'That is not a valid URL.' }, headers);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return respond(400, { success: false, error: 'URL must use http or https.' }, headers);
  }

  // Reject obviously invalid / local / private targets to avoid abuse
  // (basic guard — not exhaustive SSRF protection, but blocks the easy cases)
  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  const isPrivateIp = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(hostname);
  if (blockedHosts.includes(hostname) || isPrivateIp) {
    return respond(400, { success: false, error: 'That URL is not allowed.' }, headers);
  }

  // ---- Fetch the homepage server-side -----------------------------------------
  let html = '';
  let fetchOk = false;
  let httpStatus = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(parsedUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // identify ourselves honestly; some sites block unknown/empty UAs
        'User-Agent': 'WebCraftAuditBot/1.0 (+https://webcraft.example.com)'
      }
    });
    clearTimeout(timeout);

    httpStatus = res.status;

    if (!res.ok) {
      return respond(200, {
        success: false,
        url: rawUrl,
        error: `Site responded with HTTP ${res.status}.`
      }, headers);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return respond(200, {
        success: false,
        url: rawUrl,
        error: 'That URL did not return an HTML page.'
      }, headers);
    }

    // Read body with a size cap so a huge page can't blow up the function
    const reader = res.body ? res.body.getReader() : null;
    if (reader) {
      let received = 0;
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        if (received > MAX_BODY_BYTES) break;
        chunks.push(value);
      }
      html = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8');
    } else {
      html = await res.text();
    }

    fetchOk = true;
  } catch (err) {
    const message = err.name === 'AbortError'
      ? 'The site took too long to respond (timeout).'
      : 'Could not reach that website.';
    return respond(200, { success: false, url: rawUrl, error: message }, headers);
  }

  if (!fetchOk) {
    return respond(200, { success: false, url: rawUrl, error: 'Unknown fetch failure.' }, headers);
  }

  // ---- Parse the HTML for factual signals --------------------------------------
  let data;
  try {
    data = extractSignals(html, parsedUrl);
  } catch (err) {
    return respond(500, {
      success: false,
      url: rawUrl,
      error: 'Failed to parse the page content.'
    }, headers);
  }

  // ---- Stage 2: deterministic scoring -------------------------------------------
  let scoringResult;
  try {
    scoringResult = scoreAudit(data);
  } catch (err) {
    return respond(500, {
      success: false,
      url: rawUrl,
      error: 'Failed to score the audit data.'
    }, headers);
  }

  // ---- Stage 3: Gemini explanations (never touches scores) ----------------------
  // getAiExplanation never throws — it always resolves to a success or error shape.
  const ai = await getAiExplanation(scoringResult);

  return respond(200, {
    success: true,
    url: rawUrl,
    scores: scoringResult.scores,        // from audit-scoring.js — final, untouched
    insufficientData: scoringResult.insufficientData,
    checks: scoringResult.checks,        // from audit-scoring.js — final, untouched
    ai                                    // { success, summary, topOpportunities, categories } or { success:false, error }
  }, headers);
};

function respond(statusCode, payload, headers) {
  return { statusCode, headers, body: JSON.stringify(payload) };
}

// ---- Extraction helpers -------------------------------------------------------

function stripTags(str) {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractSignals(html, pageUrl) {
  const pageHost = pageUrl.hostname.replace(/^www\./, '');

  // --- title ---
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleText = titleMatch ? stripTags(titleMatch[1]) : '';

  // --- meta description (attribute order can vary) ---
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  let metaDescription = null;
  for (const tag of metaTags) {
    const isDescription = /name\s*=\s*["']description["']/i.test(tag);
    if (isDescription) {
      const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);
      metaDescription = contentMatch ? contentMatch[1].trim() : '';
      break;
    }
  }

  // --- viewport meta ---
  const viewportDetected = metaTags.some(tag => /name\s*=\s*["']viewport["']/i.test(tag));

  // --- headings ---
  const h1Matches = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Texts = h1Matches.map(h => stripTags(h.replace(/<h1\b[^>]*>/i, '').replace(/<\/h1>/i, '')));
  const h2Matches = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi) || [];

  // --- images ---
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  let withAlt = 0;
  let withoutAlt = 0;
  for (const tag of imgTags) {
    if (/\balt\s*=\s*["']/i.test(tag)) withAlt++;
    else withoutAlt++;
  }

  // --- links ---
  const aTags = html.match(/<a\b[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi) || [];
  let internal = 0;
  let external = 0;
  let contactPageDetected = false;
  let whatsappDetected = false;
  let socialLinksDetected = false;
  const socialDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];

  for (const tag of aTags) {
    const hrefMatch = tag.match(/href\s*=\s*["']([^"']*)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1].trim();
    const lowerHref = href.toLowerCase();

    if (lowerHref.includes('wa.me') || lowerHref.includes('api.whatsapp.com')) {
      whatsappDetected = true;
    }
    if (socialDomains.some(d => lowerHref.includes(d))) {
      socialLinksDetected = true;
    }
    if (/contact/i.test(href) || /contact/i.test(stripTags(tag))) {
      contactPageDetected = true;
    }

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue; // don't count as internal/external page links
    }

    if (/^https?:\/\//i.test(href)) {
      try {
        const linkHost = new URL(href).hostname.replace(/^www\./, '');
        if (linkHost === pageHost) internal++;
        else external++;
      } catch (e) {
        // malformed href, skip
      }
    } else {
      // relative link => internal
      internal++;
    }
  }
  const totalLinks = internal + external;

  // --- phone detection (tel: links OR plausible phone patterns) ---
  const hasTelLink = /href\s*=\s*["']tel:/i.test(html);
  const phonePattern = /(\+?\d[\d\-\.\s\(\)]{7,}\d)/;
  const phoneDetected = hasTelLink || phonePattern.test(stripTags(html));

  // --- email detection (mailto: links OR plausible email pattern in text) ---
  const hasMailtoLink = /href\s*=\s*["']mailto:/i.test(html);
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailDetected = hasMailtoLink || emailPattern.test(html);

  // --- CTA / button detection (heuristic) ---
  const buttonTags = (html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || []).length;
  const ctaWordPattern = /(book( a)? (call|now|demo)|get started|contact us|buy now|sign up|start your project|request a quote|schedule)/i;
  const ctaDetected = buttonTags > 0 || ctaWordPattern.test(stripTags(html));

  return {
    https: pageUrl.protocol === 'https:',
    title: {
      exists: Boolean(titleText),
      text: titleText || null
    },
    metaDescription: {
      exists: metaDescription !== null && metaDescription.length > 0,
      text: metaDescription || null
    },
    h1Count: h1Matches.length,
    h1Text: h1Texts[0] || null,
    h2Count: h2Matches.length,
    images: {
      total: imgTags.length,
      withAlt,
      withoutAlt
    },
    links: {
      total: totalLinks,
      internal,
      external
    },
    phoneDetected,
    emailDetected,
    whatsappDetected,
    contactPageDetected,
    ctaDetected,
    viewportDetected,
    socialLinksDetected,
    pageSizeBytes: Buffer.byteLength(html, 'utf-8')
  };
}
