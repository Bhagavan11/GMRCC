// src/utils/queryChromaDB.js
import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';
import { generateEmbedding } from '../clients/embeddingClient.js';

dotenv.config();

const CHROMA_PORT = process.env.CHROMA_PORT || '8000';
const COLLECTION_NAME = 'college_knowledge_base';
const CHROMA_HOST = process.env.CHROMA_HOST || `http://localhost:${CHROMA_PORT}`;

export async function queryChromaDB() {
    console.log("--- Starting ChromaDB Query Process ---");

    try {
        const chromaClient = new ChromaClient({ path: CHROMA_HOST });
        const collection = await chromaClient.getCollection({ name: COLLECTION_NAME });
        console.log(`Connected to ChromaDB collection: ${COLLECTION_NAME}`);

        // Example 1: Semantic search for general college information
        console.log("\n--- Querying for general college information ---");
        const queryText1 = "Tell me about GMRIT and its key statistics.";

        const queryEmbedding1 = await generateEmbedding(queryText1); // Generate embedding manually

        const results1 = await collection.query({
            queryEmbeddings: [queryEmbedding1],
            nResults: 5,
            include: ['documents', 'metadatas']
        });

        console.log(`Found ${results1.ids[0]?.length || 0} relevant documents:`);
        results1.documents[0]?.forEach((doc, index) => {
            console.log(`\nDocument #${index + 1}:`);
            console.log(doc);
            console.log("Metadata:", results1.metadatas[0][index]);
        });

        // Example 2: Targeted search with metadata filter
        console.log("\n--- Searching specifically for contact information ---");
        const queryText2 = "What is the address?";
        const queryEmbedding2 = await generateEmbedding(queryText2);

        const filteredResults = await collection.query({
            queryEmbeddings: [queryEmbedding2],
            nResults: 3,
            where: { category: "contact_info" },
            include: ['documents', 'metadatas']
        });

        console.log(`Found ${filteredResults.ids[0]?.length || 0} documents for contact info:`);
        filteredResults.documents[0]?.forEach((doc, index) => {
            console.log(`\nDocument #${index + 1}:`);
            console.log(doc);
            console.log("Metadata:", filteredResults.metadatas[0][index]);
        });

    } catch (mainError) {
        console.error("Error during ChromaDB query process:", mainError);
    }
}

queryChromaDB()
    .then(() => console.log("\nQuery script finished."))
    .catch(err => console.error("\nQuery script failed:", err));
