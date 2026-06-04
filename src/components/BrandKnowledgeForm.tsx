import { useState } from "react";
import { supabase } from "../lib/supabase"; // <-- DOPASUJ ścieżkę do swojego klienta Supabase

interface BrandKnowledgeFormProps {
  brandName: string; // przekazywane ze strony analizy (zmienna stanu z pola marki)
}

export default function BrandKnowledgeForm({ brandName }: BrandKnowledgeFormProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSave() {
    if (!brandName.trim()) {
      setStatus("error");
      setMessage("Najpierw wpisz nazwę marki powyżej.");
      return;
    }
    if (text.trim().length < 20) {
      setStatus("error");
      setMessage("Dodaj trochę więcej treści (min. 20 znaków).");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Musisz być zalogowany.");

      const res = await fetch("/.netlify/functions/ingest-knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ brandName, text }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zapisu.");

      setStatus("ok");
      setMessage(`Zapisano ${result.inserted} fragment(ów) wiedzy.`);
      setText("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Nieznany błąd.");
    }
  }

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        padding: 20,
        marginTop: 16,
      }}
    >
      <label
        style={{
          display: "block",
          color: "#D4A017",
          fontWeight: 600,
          marginBottom: 8,
          fontSize: 14,
        }}
      >
        Wiedza o marce / konkurencji (kontekst dla analizy)
      </label>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 12 }}>
        Wklej opis, pozycjonowanie, fakty o marce. Analiza użyje tego jako
        zweryfikowanego kontekstu zamiast polegać tylko na wiedzy ogólnej modelu.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Np. Marka X to producent... założony w... ich flagowy produkt to..."
        rows={5}
        style={{
          width: "100%",
          background: "#0f0f0f",
          border: "1px solid #2a2a2a",
          borderRadius: 8,
          color: "#eee",
          padding: 12,
          fontSize: 14,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button
          onClick={handleSave}
          disabled={status === "loading"}
          style={{
            background: "#D4A017",
            color: "#0f0f0f",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontWeight: 600,
            cursor: status === "loading" ? "default" : "pointer",
            opacity: status === "loading" ? 0.6 : 1,
          }}
        >
          {status === "loading" ? "Zapisywanie..." : "Zapisz wiedzę"}
        </button>

        {message && (
          <span
            style={{
              fontSize: 13,
              color: status === "ok" ? "#4ade80" : status === "error" ? "#f87171" : "#888",
            }}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
