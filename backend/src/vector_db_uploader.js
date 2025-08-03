// src/vector_db_uploader.js

import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
// --- CORRECT IMPORT ---
// This imports the shared embedding logic from the new file we're creating.
import { loadEmbeddingModelPipeline, generateEmbedding } from './clients/embeddingClient.js';
// --- END CORRECT IMPORT ---

dotenv.config();

// Configuration for ChromaDB client
const CHROMA_HOST = process.env.CHROMA_HOST || 'http://localhost:8000';
const COLLECTION_NAME = 'college_knowledge_base';


// Main Upload Function
export async function uploadChunksToVectorDB() {
    console.log("--- Starting Vector DB Upload Process ---");

    try {
        await loadEmbeddingModelPipeline(); // Ensure the embedding model is loaded

        const chromaClient = new ChromaClient({ path: CHROMA_HOST });

        console.log(`Attempting to delete existing collection: ${COLLECTION_NAME}`);
        try {
            await chromaClient.deleteCollection({ name: COLLECTION_NAME });
            console.log(`Collection ${COLLECTION_NAME} deleted successfully.`);
        } catch (error) {
            if (error.constructor.name === 'ChromaNotFoundError' || (error.message && error.message.includes('404'))) {
                console.warn(`Collection ${COLLECTION_NAME} not found, proceeding with creation.`);
            } else {
                console.error(`Error deleting collection ${COLLECTION_NAME}:`, error);
                throw error;
            }
        }

        const collection = await chromaClient.getOrCreateCollection({
            name: COLLECTION_NAME,
            // This is the correct structure for 'chromadb' JS client's embeddingFunction
            embeddingFunction: {
                generate: async (texts) => {
                    const embeddedTexts = [];
                    for (const text of texts) {
                        embeddedTexts.push(await generateEmbedding(text));
                    }
                    return embeddedTexts;
                }
            },
        });
        console.log(`Connected to ChromaDB collection: ${COLLECTION_NAME}`);

        const chunksFilePath = path.join(process.cwd(), 'data', 'scraped_chunks.json');
        const rawChunks = await fs.readFile(chunksFilePath, 'utf8');
        const scrapedChunks = JSON.parse(rawChunks);
        console.log(`Loaded ${scrapedChunks.length} chunks from ${chunksFilePath}`);

        const documentsToAdd = [];
        const metadatasToAdd = [];
        const idsToAdd = [];

        for (const chunk of scrapedChunks) {
            if (!chunk.pageContent || !chunk.metadata || !chunk.metadata.docId) {
                 console.warn(`Skipping ill-formed chunk: ${JSON.stringify(chunk)}`);
                 continue;
            }
            const metadataToStore = { ...chunk.metadata };
            idsToAdd.push(`${chunk.metadata.docId}-${chunk.metadata.chunkIndex}`);
            documentsToAdd.push(chunk.pageContent);
            metadatasToAdd.push(metadataToStore);
        }

        console.log(`Attempting to add ${documentsToAdd.length} documents to ChromaDB.`);

        await collection.add({
            documents: documentsToAdd,
            metadatas: metadatasToAdd,
            ids: idsToAdd,
        });

        const count = await collection.count();
        console.log(`--- Vector DB Upload Process Completed. Total documents in collection: ${count} ---`);

    } catch (mainError) {
        console.error("Error during Vector DB upload process:", mainError);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    uploadChunksToVectorDB()
        .then(() => console.log("Vector DB uploader finished running directly."))
        .catch(err => console.error("Vector DB uploader failed when run directly:", err));
}