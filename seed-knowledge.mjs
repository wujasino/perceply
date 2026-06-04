// Skrypt testowy: wrzuca wiedzę o zmyślonej marce do brand_knowledge.
// Uruchom z katalogu projektu:  node seed-knowledge.mjs
//
// Wymaga w .env:  SUPABASE_URL (lub VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY

import { createClient } from '@supabase/supabase-js';

// === PODMIEŃ NA SWÓJ user_id (UUID z tabeli profiles) ===
const USER_ID = '6d18d50d-a81f-4bf7-8963-5bfef460a8bf';

// === Marka i fakt-pułapka (zmyślone, żeby model nie znał ich z wiedzy ogólnej) ===
const BRAND_NAME = 'TestowaMarka XYZ';
const KNOWLEDGE = `Marka TestowaMarka XYZ to producent zegarków założony w 2019 roku w Grudziądzu.
Ich flagowy model nazywa się "Kwarc-7000" i kosztuje dokładnie 1847 zł.
Oficjalne hasło marki brzmi: "czas plynie wolniej".
Marka sprzedaje wyłącznie online i ma 12 pracowników.`;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VOYAGE_KEY = process.env.VOYAGE_API_KEY;

function chunkText(text, size = 800, overlap = 150) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size).trim());
    if (i + size >= text.length) break;
  }
  return chunks.filter(Boolean);
}

async function embedBatch(inputs) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VOYAGE_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-3.5', input: inputs, input_type: 'document' }),
  });
  if (!res.ok) throw new Error(`Voyage: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function main() {
  if (USER_ID === 'TWOJ-USER-ID') {
    console.error('!! Najpierw podmień USER_ID w skrypcie na swój UUID z tabeli profiles.');
    process.exit(1);
  }
  if (!SUPABASE_URL || !SERVICE_KEY || !VOYAGE_KEY) {
    console.error('!! Brakuje zmiennych w .env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / VOYAGE_API_KEY).');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const chunks = chunkText(KNOWLEDGE);
  console.log(`Liczę embeddingi dla ${chunks.length} fragment(ów)...`);
  const embeddings = await embedBatch(chunks);

  const rows = chunks.map((content, i) => ({
    user_id: USER_ID,
    brand_name: BRAND_NAME,
    content,
    embedding: JSON.stringify(embeddings[i]),
  }));

  const { error } = await supabase.from('brand_knowledge').insert(rows);
  if (error) {
    console.error('Błąd insertu:', error.message);
    process.exit(1);
  }

  console.log(`OK — wstawiono ${rows.length} fragment(ów) dla marki "${BRAND_NAME}".`);
}

main();
