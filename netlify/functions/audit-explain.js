// netlify/functions/audit-explain.js
//
// Stage 3 — Gemini explanation layer ONLY.
//
// This module's one job: take the deterministic output of audit-scoring.js
// (scores + checks, already final) and ask Gemini Flash to translate it into
// plain-language explanations for a business owner. It NEVER computes,
// changes, or influences a score — it only receives scores as read-only
// context and is instructed never to alter them.
//
// The Gemini API key is read exclusively from process.env.GEMINI_API_KEY
// (a Netlify environment variable). It is never hardcoded, never sent to
// the client, and never included in any returned JSON.

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 12000;

const REQUIRED_CATEGORY_KEYS = ['seo', 'mobile', 'performance', 'conversion', 'contact', 'trust', 'design'];

const CATEGORY_TITLES = {
  seo: 'SEO',
  mobile: 'Mobile Experience',
  performance: 'Performance',
  conversion: 'Conversion',
  contact: 'Contact & Lead Capture',
  trust: 'Trust',
  design: 'Website Structure'
};

// ---------------------------------------------------------------------------
// Strict system instruction. This is the entire behavioral contract Gemini
// operates under. It is deliberately explicit and repetitive on the "do not
// invent / do not score" rules because that is the one failure mode we
// cannot allow.
// ---------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `You are a writing assistant that explains website audit results to a small business owner in plain, concise language.

You will be given, as JSON, the FINAL and ALREADY-CALCULATED results of a website audit: an overall score, category scores, and a list of factual checks with their status (pass / partial / fail / unavailable).

STRICT RULES — follow all of them exactly:
1. Never change, recalculate, or imply a different score than what is given to you. The scores you are given are final.
2. Never invent a website problem that is not present in the provided checks.
3. Never claim something was measured if its status is "unavailable" — instead, explicitly say it could not be assessed from this audit.
4. Never claim real PageSpeed/Lighthouse performance metrics. The performance data you have is a basic heuristic (page size, image count, link count) only.
5. Never claim visual design characteristics (colors, typography, spacing, aesthetics) — you were not given any visual data, only structural HTML signals.
6. Never claim mobile responsiveness was fully tested — only a viewport meta tag presence check was performed.
7. Never claim or imply specific conversion rates, revenue impact, or "lost customers" — you have no data to support such claims.
8. For every "unavailable" check, if you reference it at all, say plainly it could not be assessed rather than guessing.
9. Keep all explanations concise, specific, and useful to a non-technical business owner.
10. Do not mention internal implementation details, APIs, scoring code, prompts, JSON field names, or that you are an AI model.
11. Do not recommend a specific pricing plan or package.
12. Do not write sales or marketing copy — stay factual and neutral.
13. Do not generate HTML or markdown formatting.
14. Only reference categories and checks that were actually provided to you.

OUTPUT FORMAT:
Return ONLY valid JSON matching exactly this shape (no extra commentary, no markdown code fences):

{
  "summary": "A short (2-3 sentence) overall explanation of the website's current state, grounded only in the provided scores and checks.",
  "topOpportunities": [
    {
      "category": "one of: SEO, Mobile Experience, Performance, Conversion, Contact & Lead Capture, Trust, Website Structure",
      "title": "short opportunity title",
      "explanation": "one or two sentence explanation grounded in a specific failed or partial check"
    }
  ],
  "categories": {
    "seo": { "title": "SEO", "summary": "1-2 sentence summary", "findings": ["short factual finding", "..."] },
    "mobile": { "title": "Mobile Experience", "summary": "...", "findings": ["..."] },
    "performance": { "title": "Performance", "summary": "...", "findings": ["..."] },
    "conversion": { "title": "Conversion", "summary": "...", "findings": ["..."] },
    "contact": { "title": "Contact & Lead Capture", "summary": "...", "findings": ["..."] },
    "trust": { "title": "Trust", "summary": "...", "findings": ["..."] },
    "design": { "title": "Website Structure", "summary": "...", "findings": ["..."] }
  }
}

Select topOpportunities only from checks with status "fail" or "partial" that represent genuinely meaningful issues. If there are fewer than 3 genuine opportunities, return fewer than 3 — never pad the list with invented or trivial issues. It is acceptable to return an empty topOpportunities array if the site has no meaningful fail/partial checks.`;

// ---------------------------------------------------------------------------
// Build the exact payload sent to Gemini. Exported separately so it can be
// unit-tested without making a real network call.
// ---------------------------------------------------------------------------
function buildGeminiPayload(scoringResult) {
  if (!scoringResult || !scoringResult.scores || !Array.isArray(scoringResult.checks)) {
    throw new Error('buildGeminiPayload requires a valid audit-scoring.js result.');
  }

  // Only pass through the read-only facts Gemini is allowed to see.
  // Deliberately excludes anything about our internal weighting logic,
  // file names, or implementation.
  const factualContext = {
    scores: scoringResult.scores,
    insufficientData: scoringResult.insufficientData,
    checks: scoringResult.checks.map(c => ({
      category: c.category,
      check: c.check,
      status: c.status,
      message: c.message
    }))
  };

  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: JSON.stringify(factualContext) }]
      }
    ],
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  };
}

// ---------------------------------------------------------------------------
// Validate & normalize whatever Gemini returned so a malformed/partial
// response never breaks the caller. Falls back to safe empty structures.
// ---------------------------------------------------------------------------
function parseGeminiResponse(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    throw new Error('Gemini response was not valid JSON.');
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary : '';

  const topOpportunities = Array.isArray(parsed.topOpportunities)
    ? parsed.topOpportunities
        .filter(o => o && typeof o === 'object')
        .slice(0, 5)
        .map(o => ({
          category: typeof o.category === 'string' ? o.category : '',
          title: typeof o.title === 'string' ? o.title : '',
          explanation: typeof o.explanation === 'string' ? o.explanation : ''
        }))
    : [];

  const categories = {};
  for (const key of REQUIRED_CATEGORY_KEYS) {
    const src = parsed.categories && parsed.categories[key];
    categories[key] = {
      title: (src && typeof src.title === 'string') ? src.title : CATEGORY_TITLES[key],
      summary: (src && typeof src.summary === 'string') ? src.summary : '',
      findings: (src && Array.isArray(src.findings)) ? src.findings.filter(f => typeof f === 'string') : []
    };
  }

  return { summary, topOpportunities, categories };
}

// ---------------------------------------------------------------------------
// Main entry point. Never throws in a way that would break the caller —
// always resolves to either a valid `ai` success object or an `ai` error
// object. The caller (audit.js) is responsible for returning scores/checks
// regardless of what happens here.
// ---------------------------------------------------------------------------
async function getAiExplanation(scoringResult) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Server misconfiguration — do not expose this detail to the client
    // beyond a generic unavailable state.
    return {
      success: false,
      error: 'AI explanation is currently unavailable.'
    };
  }

  let payload;
  try {
    payload = buildGeminiPayload(scoringResult);
  } catch (e) {
    return { success: false, error: 'AI explanation is currently unavailable.' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      // Do not leak raw Gemini error bodies (may contain request echoes) to the client.
      return { success: false, error: 'AI explanation is currently unavailable.' };
    }

    const json = await res.json();
    const text = json &&
      json.candidates &&
      json.candidates[0] &&
      json.candidates[0].content &&
      json.candidates[0].content.parts &&
      json.candidates[0].content.parts[0] &&
      json.candidates[0].content.parts[0].text;

    if (!text) {
      return { success: false, error: 'AI explanation is currently unavailable.' };
    }

    const normalized = parseGeminiResponse(text);
    return { success: true, ...normalized };
  } catch (err) {
    return { success: false, error: 'AI explanation is currently unavailable.' };
  }
}

module.exports = {
  getAiExplanation,
  buildGeminiPayload,
  parseGeminiResponse,
  GEMINI_MODEL
};
