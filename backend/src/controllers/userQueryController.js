import express from "express";
import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbedding } from "../clients/embeddingClient.js";
import { askGroq } from "../utils/groqClient.js";
import { classifyQueryWithLLM } from "../utils/intentClassifier.js";
// import { ChromaClient } from "chromadb"; // Uncomment later if needed

const router = express.Router();

// ----------------- Init Pinecone -----------------
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const INDEX_NAME = "gmrit-bot";
const index = pinecone.index(INDEX_NAME);

// ----------------- Improved Hybrid Search -----------------
async function hybridSearch(query, filter = {}, topK = 30) {
  const queryEmbedding = await generateEmbedding(query);

  const [filteredRes, broadRes] = await Promise.all([
    index
      .query({
        vector: queryEmbedding,
        topK: Math.floor(topK * 0.7),
        includeMetadata: true,
        filter: Object.keys(filter).length ? filter : undefined,
      })
      .catch(() => ({ matches: [] })),
    index
      .query({
        vector: queryEmbedding,
        topK: Math.ceil(topK * 0.3),
        includeMetadata: true,
      })
      .catch(() => ({ matches: [] })),
  ]);

  console.log("filteredRes", filteredRes);
  console.log("broadRes", broadRes);
  const allMatches = [...(filteredRes.matches || []), ...(broadRes.matches || [])];
  if (allMatches.length === 0) return [];

  // Normalize and merge scores
  const normalize = (arr) => {
    if (!arr.length) return arr;
    const max = Math.max(...arr.map((m) => m.score || 0));
    const min = Math.min(...arr.map((m) => m.score || 0));
    return arr.map((m) => ({
      ...m,
      normScore: max === min ? 1 : (m.score - min) / (max - min),
    }));
  };

  const filteredNorm = normalize(filteredRes.matches || []);
  const broadNorm = normalize(broadRes.matches || []);

  const merged = new Map();
  [...filteredNorm, ...broadNorm].forEach((m) => {
    const cur = merged.get(m.id);
    const boost = Object.keys(filter).length ? 1.1 : 1.0; // slight bias for filtered
    const finalScore = m.normScore * boost;
    if (!cur || finalScore > cur.score) {
      merged.set(m.id, { ...m, score: finalScore });
    }
  });

  const sorted = Array.from(merged.values()).sort((a, b) => b.score - a.score);

  // Fallback: if filtered results are too weak (<30%), pull more from broad
  const filteredCount = filteredRes.matches?.length || 0;
  const broadCount = broadRes.matches?.length || 0;
  if (filteredCount < topK * 0.3 && broadCount > 0) {
    sorted.push(...broadRes.matches.slice(0, topK - sorted.length));
  }

  return sorted.slice(0, topK);
}

// ----------------- Helpers -----------------
function deduplicateChunks(chunks) {
  const seen = new Set();
  return chunks.filter((chunk) => {
    const normalized = (chunk.text || "").trim().toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function keywordScore(query, text) {
  if (!query || !text) return 0;
  const qTokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const tTokens = new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  if (qTokens.length === 0) return 0;
  let hits = 0;
  for (const tok of qTokens) if (tTokens.has(tok)) hits++;
  return hits / qTokens.length;
}

// ----------------- POST /query -----------------
router.post("/query", async (req, res) => {
  const userQuery = req.body.userQuery || req.body.query;
  if (!userQuery) {
    return res.status(400).json({ error: "Query parameter is required." });
  }

  console.log(`🧠 User Query: "${userQuery}"`);

  try {
    const queryEmbedding = await generateEmbedding(userQuery);

    const classifiedCategory = await classifyQueryWithLLM(userQuery);
    console.log(`📂 Classified query into category: ${classifiedCategory}`);

    let filter = {};
    if (classifiedCategory !== "none") {
      filter = { category: { $eq: classifiedCategory } };
    } else {
      console.log("⚠️ No category filtering applied. Performing broad search.");
    }

    // ✅ Use improved hybrid search
    const results = await hybridSearch(userQuery, filter, 30);
    // console.log("results:",results)
    if (!results.length) {
      return res.json({ response: "I do not have that information." });
    }

    const retrievedChunks = results.map((match) => ({
      text: match.metadata?.pageContent || match.metadata?.text || "",
      metadata: match.metadata || {},
    }));

    // console.log("retreived chunks",retrievedChunks)

    // Re-score using both semantic + keyword
    const rescored = results.map((m, i) => {
      const text = retrievedChunks[i]?.text || "";
      const kw = keywordScore(userQuery, text);
      const sem = m.score ?? 0;
      const hybrid = 0.7 * sem + 0.3 * kw;
      return { idx: i, hybrid, text, metadata: retrievedChunks[i].metadata };
    });

    rescored.sort((a, b) => b.hybrid - a.hybrid);
    const rerankedChunks = rescored.map((r) => ({
      text: r.text,
      metadata: r.metadata,
    }));

    const uniqueChunks = deduplicateChunks(rerankedChunks);
    const uniqueMetadatas = uniqueChunks.map((c) => c.metadata);

    if (uniqueChunks.length === 0) {
      return res.json({ response: "I do not have that information." });
    }

    const context = uniqueChunks
      .map((chunk, index) => {
        const meta = uniqueMetadatas[index] || {};
        const title = meta.title || "Document";
        const source = meta.source || "Unknown";
        return `(${index + 1}) Title: ${title} | Source: ${source}\n${chunk.text}`;
      })
      .join("\n\n");

    const ragPrompt = `
      You are GMRIT's official chatbot.
      Answer the user's question ONLY using the information in the provided context(chunks).
      Do not use any outside knowledge or make assumptions.

      Rules:
      1. Write in clear, plain text.
      2. Use short paragraphs or bullet points for clarity.
      3. Write important terms in UPPERCASE (e.g., GMRIT).
      4. If the question asks for syllabus, timetable, or any document:
        - Give a short description.
        - List the document link(s) on separate lines and highlight this URL which directly navigates to the link when clicked.
        - Do not show PDF contents.
      5. If the answer is not in the provided content, reply exactly:
        I do not have that information.go through the official website of GMRIT for more information.
      6. Please provide hyperlinks for URLs in blue clickable links.
      7. No HTML tags should appear in responses.
      

      Context:
      ${context}

      User Question: ${userQuery}`;

    const groqResponseRaw = await askGroq(ragPrompt);
    console.log("✅ Groq AI response received.");

    // ----------------- HTML → Markdown -----------------
    function htmlToMarkdownLinks(text) {
      if (!text) return "";
      let out = text.replace(
        /<a\s+[^>]href=["']([^"']+)["'][^>]>(.*?)<\/a>/gi,
        (m, href, label) => {
          const cleanLabel = (label || "").replace(/<[^>]+>/g, "").trim() || href;
          return `[${cleanLabel}](${href})`;
        }
      );
      out = out.replace(/<[^>]+>/g, "");
      out = out.replace(
        /(?<!\]\()(https?:\/\/[\w\-._~:?#@!$&'()*+,;=%/]+)(?!\))/g,
        (m) => `[${m}](${m})`
      );
      return out.trim();
    }

    const sanitized = htmlToMarkdownLinks(groqResponseRaw || "");
    const finalAnswer = sanitized || "I do not have that information.";

    res.json({
      response: finalAnswer,
      source_documents: uniqueMetadatas,
    });
  } catch (error) {
    console.error("❌ Error processing chatbot query:", error);
    res
      .status(500)
      .json({ error: "Failed to process your query.", details: error.message });
  }
});

export default router;
