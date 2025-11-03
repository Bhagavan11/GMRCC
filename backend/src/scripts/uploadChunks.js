import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) {
  throw new Error("PINECONE_API_KEY is not set. Please add it to your .env file.");
}
const pinecone = new Pinecone({ apiKey });

const indexName = process.env.PINECONE_INDEX_NAME || "gmrit-bot";
const index = pinecone.index(indexName);

const embedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L12-v2"
);

const chunksPath = path.resolve(__dirname, "../../data/scraped_chunks.json");
if (!fs.existsSync(chunksPath)) {
  console.error("❌ Chunks file not found:", chunksPath);
  process.exit(1);
}
const chunks = JSON.parse(fs.readFileSync(chunksPath, "utf-8"));

// ---- Helper: batch into groups of N ----
function batchArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const BATCH_SIZE = 50; // recommended: 50–100
const chunkBatches = batchArray(chunks, BATCH_SIZE);

for (let batchIndex = 0; batchIndex < chunkBatches.length; batchIndex++) {
  const batch = chunkBatches[batchIndex];

  const vectors = [];
  for (const chunk of batch) {
    const embedding = await embedder(chunk.pageContent, {
      pooling: "mean",
      normalize: true,
    });
    const vector = Array.from(embedding.data || embedding[0][0]);

    const id = `${chunk.metadata.docId}-${chunk.metadata.chunkIndex}`;
    vectors.push({
      id,
      values: vector,
      metadata: { ...chunk.metadata, text: chunk.pageContent },
    });
  }

  try {
    await index.upsert(vectors);
    console.log(`✅ Uploaded batch ${batchIndex + 1}/${chunkBatches.length}`);
  } catch (err) {
    console.error(`❌ Failed batch ${batchIndex + 1}:`, err.message);
  }
}

console.log("🎉 All chunks uploaded in batches!");
