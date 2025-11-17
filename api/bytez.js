// api/bytez.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array in body" });
    }

    // Use model from body if provided, otherwise default
    const modelId = model || "Qwen/Qwen3-4B";

    // Bytez expects:
    // - header "Authorization": "BYTEZ_KEY" (literal per example)
    // - header "provider-key": your actual key
    const providerKey = process.env.BYTEZ_PROVIDER_KEY;
    if (!providerKey) {
      return res.status(500).json({ error: "Server missing BYTEZ_PROVIDER_KEY env variable" });
    }

    const apiResp = await fetch(`https://api.bytez.com/models/v2/${modelId}`, {
      method: "POST",
      headers: {
        "Authorization": "BYTEZ_KEY",
        "provider-key": providerKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages
      })
    });

    const text = await apiResp.text();
    // try to parse JSON, otherwise return raw text
    try {
      const json = JSON.parse(text);
      if (!apiResp.ok) {
        return res.status(apiResp.status).json({ error: json });
      }
      return res.status(200).json(json);
    } catch (e) {
      // not JSON
      if (!apiResp.ok) {
        return res.status(apiResp.status).json({ error: text });
      }
      return res.status(200).send(text);
    }
  } catch (err) {
    console.error("api/bytez error:", err);
    return res.status(500).json({ error: err.message });
  }
}
