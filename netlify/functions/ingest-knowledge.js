import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_ANON_KEY, VOYAGE_API_KEY } = process.env;
const MAX_CHARS = 50000; // limit wejścia, żeby nie wrzucić ogromnego tekstu

// Dzieli tekst na nakładające się fragmenty (lepszy recall przy wyszukiwaniu)
function chunkText(text, size = 800, overlap = 150) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size).trim());
    if (i + size >= text.length) break;
  }
  return chunks.filter(Boolean);
}

// Jeden request do Voyage dla wszystkich fragmentów naraz.
// input_type: "document" — bo zapisujemy wiedzę (przy wyszukiwaniu użyjemy "query").
async function embedBatch(inputs) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3.5",
      input: inputs,
      input_type: "document",
    }),
  });
  if (!res.ok) throw new Error(`Voyage: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export async function handler(event) {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const token = event.headers.authorization?.replace("Bearer ", "");
    if (!token) return { statusCode: 401, body: "Brak tokenu autoryzacji" };

    const { brandName, text } = JSON.parse(event.body || "{}");
    if (!brandName || !text)
      return { statusCode: 400, body: "Wymagane: brandName i text" };
    if (text.length > MAX_CHARS)
      return { statusCode: 413, body: `Tekst za długi (max ${MAX_CHARS} znaków)` };

    // Klient w kontekście użytkownika — RLS sam ustawi user_id (default auth.uid())
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const chunks = chunkText(text);
    if (chunks.length === 0)
      return { statusCode: 400, body: "Brak treści do zapisania" };

    const embeddings = await embedBatch(chunks);

    const rows = chunks.map((content, i) => ({
      brand_name: brandName,
      content,
      embedding: JSON.stringify(embeddings[i]), // pgvector oczekuje formatu '[...]'
    }));

    const { error } = await supabase.from("brand_knowledge").insert(rows);
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ inserted: rows.length }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

