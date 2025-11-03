import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME || "gmrit-bot";

if (!PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set. Please add it to your .env file.");
}

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pinecone.index(PINECONE_INDEX);

async function main() {
  // 1. Dummy 384-dim vector
  const sampleVec = Array.from({ length: 384 }, () => Math.random());

  // 2. Upsert
  await index.upsert([
    {
      id: "test-doc-1",
      values: sampleVec,
      metadata: { content: "Hello from GMRIT bot test!" },
    },
  ]);
  console.log("✅ Upserted sample vector!");

  // 3. Query
  const queryRes = await index.query({
    vector: sampleVec,
    topK: 1,
    includeMetadata: true,
  });

  console.log("🔍 Query result:", JSON.stringify(queryRes.matches, null, 2));
}

main().catch((err) => {
  console.error("❌ Error connecting to Pinecone:", err);
  process.exit(1);
});
