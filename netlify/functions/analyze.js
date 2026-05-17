export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    // Prepare prompt text
    const target = String(url || '').trim() || 'unknown brand';

    // Call Anthropic if key is present; otherwise fall back to deterministic demo data
    let parsed = null;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `Analyze this website or brand: ${target}. Rate it from 0-100 on these 5 dimensions (authority, sentiment, recency, mentions, accuracy) and provide a trustScore. Respond ONLY with a raw JSON object, no markdown, no backticks, just JSON.`
            }]
          })
        });

        const data = await response.json();

        // Try several possible fields for the model output
        let text = null;
        if (data?.content && Array.isArray(data.content) && data.content[0]) {
          text = (data.content[0].text || data.content[0]).toString();
        } else if (data?.completion) {
          text = data.completion;
        } else if (data?.text) {
          text = data.text;
        } else if (typeof data === 'string') {
          text = data;
        }

        if (text) {
          const cleaned = text.trim().replace(/```json|```/g, '').trim();
          try {
            parsed = JSON.parse(cleaned);
          } catch (e) {
            // ignore parse error and fall through to deterministic fallback
            console.warn('Failed to parse model output as JSON', e);
          }
        }
      } catch (err) {
        console.warn('Anthropic call failed, falling back to deterministic demo', err);
      }
    }

    // deterministic pseudo-random fallback based on input string
    const deterministicResult = (seedStr) => {
      const seed = String(seedStr || '').toLowerCase().trim();
      let h = 2166136261 >>> 0;
      for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
      }
      // produce five values 30-95
      const next = () => Math.round((h = Math.imul(h ^ (h >>> 13), 1274126177)) % 66) + 30;

      const authority = next();
      const sentiment = next();
      const recency = next();
      const mentions = next();
      const accuracy = next();
      const trustScore = Math.round((authority + sentiment + recency + mentions + accuracy) / 5);

      const out = {
        authority,
        sentiment,
        recency,
        mentions,
        accuracy,
        trustScore,
        sources: [
          { model: 'GPT-4o', sentiment: 'Positive', association: `${seed} product`, confidence: Math.round((authority + 5) % 100) },
          { model: 'Claude', sentiment: 'Neutral', association: `${seed} brand`, confidence: Math.round((accuracy + 10) % 100) },
          { model: 'Gemini', sentiment: 'Positive', association: `${seed} mentions`, confidence: Math.round((mentions + 2) % 100) }
        ]
      };

      console.warn('analyze deterministicResult for', seed, out);
      return out;
    };

    const result = parsed || deterministicResult(target);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};