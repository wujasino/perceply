const res = await fetch("https://api.voyageai.com/v1/embeddings", { method: "GET" });
console.log("status:", res.status);
console.log("body:", await res.text());