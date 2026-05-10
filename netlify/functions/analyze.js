export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { url } = JSON.parse(event.body);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Analyze this website URL: ${url}. Rate it from 0-100 on these dimensions: authority, sentiment, recency, mentions, accuracy. Respond ONLY with valid JSON like this: {"authority": 75, "sentiment": 60, "recency": 80, "mentions": 45, "accuracy": 70, "trustScore": 66}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  
  try {
    const result = JSON.parse(text);
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to parse response" })
    };
  }
}