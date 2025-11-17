export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array" });
    }

    const modelId = model || "Qwen/Qwen3-4B";

    const apiKey = process.env.BYTEZ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing BYTEZ_API_KEY env variable" });
    }

    const apiResp = await fetch(`https://api.bytez.com/models/v2/${modelId}`, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const text = await apiResp.text();

    try {
      const json = JSON.parse(text);
      return res.status(apiResp.status).json(json);
    } catch {
      return res.status(apiResp.status).send(text);
    }
  } catch (err) {
    console.error("Bytez API error:", err);
    res.status(500).json({ error: err.message });
  }
}
