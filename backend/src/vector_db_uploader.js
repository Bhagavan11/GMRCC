import { pipeline } from '@xenova/transformers';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "pcsk_2sGW3u_JYXfEvRqEDEeaxYvrvtGuciDPY9ERSMx29wz5oNpPW87u6PkS6Zs67QChuqdq7W";

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "gmrit-bot";

let embedderPipeline = null;
async function loadEmbeddingModelPipeline() {
    if (!embedderPipeline) {
        console.log("Loading embedding model: Xenova/all-MiniLM-L12-v2...");
        embedderPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2');
        console.log("Embedding model loaded successfully.");
    }
    return embedderPipeline;
}

async function generateEmbedding(text) {
    if (!embedderPipeline) {
        await loadEmbeddingModelPipeline();
    }
    const output = await embedderPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

export async function uploadChunksToVectorDB() {
    console.log("--- Starting Pinecone Upload Process ---");

    try {
        await loadEmbeddingModelPipeline();

        // Connect to Pinecone
        const client = new Pinecone({ apiKey: PINECONE_API_KEY });
        const index = client.index(PINECONE_INDEX_NAME);

       console.log(`Deleting all existing vectors from index: ${PINECONE_INDEX_NAME}`);
try {
  await index.deleteAll();   // public method
  console.log(`✅ Old data cleared from index: ${PINECONE_INDEX_NAME}`);
} catch (err) {
  console.warn(`⚠️ Could not clear old data: ${err.message}`);
}


        // Step 2: Load scraped chunks
        const chunksFilePath = path.resolve(__dirname, "./data/scraped_chunks.json");
// no need for 'src' here, because scraper.js saves at backend/data

        const rawChunks = await fs.readFile(chunksFilePath, 'utf8');
        const scrapedChunks = JSON.parse(rawChunks);
        console.log(`Loaded ${scrapedChunks.length} chunks from ${chunksFilePath}`);

        // Step 3: Upload in batches
        const BATCH_SIZE = 100; // keep it smaller for Pinecone stability
        const totalChunks = scrapedChunks.length;
        console.log(`Attempting to add ${totalChunks} documents to Pinecone in batches of ${BATCH_SIZE}.`);

        for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
            const batch = scrapedChunks.slice(i, i + BATCH_SIZE);

            const vectors = await Promise.all(
                batch.map(async (chunk) => {
                    const embedding = await generateEmbedding(chunk.pageContent);
                    return {
                        id: `${chunk.metadata.docId}-${chunk.metadata.chunkIndex}`,
                        values: embedding,
                        metadata: { ...chunk.metadata, text: chunk.pageContent },
                    };
                })
            );

            await index.upsert(vectors);
            console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(totalChunks / BATCH_SIZE)} uploaded.`);
        }

        console.log(`--- Pinecone Upload Process Completed. Total documents uploaded: ${totalChunks} ---`);

    } catch (error) {
        console.error("Error during Pinecone upload process:", error);
    }
}

// Allow running this file directly
if (import.meta.url === `file://${process.argv[1]}`) {
    uploadChunksToVectorDB()
        .then(() => console.log("Pinecone uploader finished running directly."))
        .catch(err => console.error("Pinecone uploader failed when run directly:", err));
}
