export async function onRequestPost({ request, env }) {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "Content-Type": "application/json" }
    });

  if (!env.GEMINI_API_KEY) {
    return json({ error: "Server is missing GEMINI_API_KEY." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const clean = (s, n) => String(s || "").replace(/[\r\n]+/g, " ").slice(0, n).trim();
  const keywords = clean(body.keywords, 200);
  const level = clean(body.level, 40);
  const location = clean(body.location, 80);
  const date = clean(body.date, 20) || "Anytime";

  if (!keywords || !location) {
    return json({ error: "Please fill in keywords and location." }, 400);
  }

  const prompt = `Use Google Search to find 3 currently open, fully funded academic opportunities.
Keywords: ${keywords}
Level: ${level}
Location: ${location}
Start date: ${date} (if a date is given, prefer positions starting on or after it)

Rules:
- Only include opportunities whose official page you actually found. Never invent URLs.
- Links must start with https://
- Use "Not listed" for anything you could not verify.
- Reply with ONLY a raw JSON array of 3 objects. No markdown, no extra text.
Each object must have exactly these keys:
"title","institution","funding","stipend","deadline","startDate","region","international","contact","keywords","link"
Use YYYY-MM-DD for deadline and startDate when known.`;

  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2 }
        }),
        signal: controller.signal
      }
    );

    const data = await r.json();
    if (data.error) {
      return json({ error: "AI service error: " + data.error.message }, 502);
    }

    const text =
      data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return json({ error: "The AI returned no usable data. Please try again." }, 502);
    }

    let results;
    try {
      results = JSON.parse(match[0]);
    } catch {
      return json({ error: "The AI returned malformed data. Please try again." }, 502);
    }
    if (!Array.isArray(results)) {
      return json({ error: "Unexpected AI response. Please try again." }, 502);
    }

    return json({ results });
  } catch (e) {
    const msg =
      e.name === "AbortError"
        ? "The search took too long. Try fewer keywords and search again."
        : "Search failed. Please try again.";
    return json({ error: msg }, 504);
  } finally {
    clearTimeout(timer);
  }
}