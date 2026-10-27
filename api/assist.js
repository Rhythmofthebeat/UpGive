
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

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

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(500).json({ error: "The AI assistant isn't configured yet (missing OPENAI_API_KEY)." });
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

    const aiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: process.env.ASSIST_MODEL || DEFAULT_MODEL,
        temperature: 0.4,
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      res.status(502).json({ error: "The AI service returned an error.", detail: detail.slice(0, 300) });
      return;
    }

    const data = await aiRes.json();
    const text = data?.choices?.[0]?.message?.content || "";

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