// UpGive AI Assistant — Vercel serverless function (Google Gemini, free tier).
//
// WHY A SERVER FUNCTION: the AI key must never live in the browser. This runs on
// Vercel's servers, reads the key from an environment variable, and the frontend
// only ever talks to this endpoint — so the key is never exposed.
//
// SETUP (free, no credit card):
//   1. Get a free API key at https://aistudio.google.com/apikey
//   2. Vercel → Project → Settings → Environment Variables → add:
//        GEMINI_API_KEY = <your key>
//      (set it for the "Preview" environment / ai-demo branch for the demo)
//   3. Redeploy.
//   Optional: GEMINI_MODEL to override the model (default below). Pick a current
//   model name from AI Studio if the default ever changes.

// Google retires model names over time, so we try a list in order until one
// works. GEMINI_MODEL (if set) is tried first. "gemini-flash-latest" is an alias
// that always points to a current Flash model, so it should keep working.
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash-lite"];
const modelCandidates = () => {
  const env = process.env.GEMINI_MODEL;
  const list = env ? [env, ...FALLBACK_MODELS] : FALLBACK_MODELS.slice();
  return [...new Set(list)]; // de-dupe, preserve order
};
const apiUrl = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const SYSTEM_PROMPT =
  "You are UpGive's matching assistant. UpGive is a marketplace where companies " +
  "list surplus goods and nonprofits/communities claim them for free or cheap. " +
  "Given a nonprofit's described need and a catalog of available listings, pick the " +
  "listings that best fit, write a short friendly outreach message the nonprofit can " +
  "send to the donor, and give one practical delivery tip. Only recommend listings " +
  "that appear in the catalog, using their exact id. Respond with ONLY valid JSON in " +
  'exactly this shape: {"summary":"one sentence overview","matches":[{"id":"<listing id>",' +
  '"reason":"why it fits, one line"}],"draftMessage":"a warm 3-4 sentence outreach message ' +
  'to the donor","deliveryTip":"one practical sentence"}. If nothing in the catalog fits, ' +
  "return an empty matches array and explain briefly in summary.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: "The AI assistant isn't configured yet (missing GEMINI_API_KEY)." });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const need = typeof body.need === "string" ? body.need.trim() : "";
    if (!need) {
      res.status(400).json({ error: "Please describe what your organization needs." });
      return;
    }

    // Keep the payload small and safe: cap count + trim long fields.
    const items = (Array.isArray(body.catalog) ? body.catalog : []).slice(0, 40).map((l) => ({
      id: l.id,
      title: String(l.title || "").slice(0, 120),
      category: l.category || "",
      city: l.city || "",
      country: l.country || "",
      quantity: l.quantity ?? null,
      free: !l.price,
      summary: String(l.description || "").slice(0, 200),
    }));

    const userMessage =
      "Nonprofit need:\n" + need.slice(0, 2000) +
      "\n\nAvailable listings (JSON):\n" + JSON.stringify(items);

    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        // Disable "thinking" so newer Gemini models respond fast instead of
        // spending many seconds reasoning internally (which caused long hangs).
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    // Try each candidate model until one succeeds, with a per-attempt timeout so
    // a slow model can never hang the request forever.
    let data = null;
    let lastDetail = "";
    for (const model of modelCandidates()) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000); // 12s cap per model
      try {
        const aiRes = await fetch(apiUrl(model, key), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: requestBody,
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (aiRes.ok) { data = await aiRes.json(); break; }
        lastDetail = (await aiRes.text().catch(() => "")) || "";
      } catch (e) {
        clearTimeout(timer);
        lastDetail = e?.name === "AbortError" ? ("Model " + model + " timed out.") : String(e?.message || e);
      }
    }

    if (!data) {
      // Surface the real reason directly in the on-screen message (no devtools needed).
      res.status(502).json({ error: "AI error — " + lastDetail.slice(0, 300) });
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
    } catch {
      res.status(200).json({ summary: "", matches: [], draftMessage: "", deliveryTip: "" });
      return;
    }

    res.status(200).json({
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      matches: Array.isArray(parsed.matches) ? parsed.matches.slice(0, 12) : [],
      draftMessage: typeof parsed.draftMessage === "string" ? parsed.draftMessage : "",
      deliveryTip: typeof parsed.deliveryTip === "string" ? parsed.deliveryTip : "",
    });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong.", detail: String(err?.message || err).slice(0, 300) });
  }
}