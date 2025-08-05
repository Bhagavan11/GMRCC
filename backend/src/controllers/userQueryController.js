// src/controllers/userQueryController.js
import express from 'express';
import { ChromaClient } from 'chromadb';
import { generateEmbedding } from '../clients/embeddingClient.js';
import { askGroq } from '../utils/groqClient.js';
// The new import for our semantic classifier
import { classifyQuery } from '../utils/semanticClassifier.js';
import { classifyQueryWithLLM } from '../utils/intentClassifier.js';

// Initialize a new router instance
const router = express.Router();

// Initialize ChromaDB Client (global for reuse)
const CHROMA_HOST = process.env.CHROMA_HOST || 'http://localhost:8000';
const COLLECTION_NAME = 'college_knowledge_base';
let chromaClientInstance = null;
let chromaCollection = null;


async function getChromaCollection() {
    if (!chromaCollection) {
        // Assume the embedder pipeline has been loaded in app.js
        const chromaClient = new ChromaClient({ path: CHROMA_HOST });
        chromaCollection = await chromaClient.getCollection({
            name: COLLECTION_NAME,
            embeddingFunction: {
                generate: async (texts) => {
                    return Promise.all(texts.map(text => generateEmbedding(text)));
                },
            },
        });
    }
    return chromaCollection;
}


// --- Chatbot RAG Query Endpoint with Filtering ---
router.post('/query', async (req, res) => {
    const userQuery = req.body.query;

    if (!userQuery) {
        return res.status(400).json({ error: 'Query parameter is required.' });
    }

    console.log(`🤖 User Query: "${userQuery}"`);

    try {
        const collection = await getChromaCollection();
        
        // Embed the user query
        const queryEmbedding = await generateEmbedding(userQuery);
        console.log('Query embedded.');

        // 1. Classify the user's query using the new LLM classifier
        // const classifiedCategory = await classifyQueryWithLLM(userQuery);
        const classifiedCategory = await classifyQueryWithLLM(userQuery);
        console.log(`Classified query into category: ${classifiedCategory}`);
        // 2. Build the whereFilter based on the classified category
        let whereFilter = {category: classifiedCategory }; // Default to no category
        // if (classifiedCategory !== 'none') {
        //     if (classifiedCategory === 'placement_overview' || classifiedCategory === 'placement_record') {
        //         whereFilter = { category: { '$or': [{ 'category': 'placement_overview' }, { 'category': 'placement_record' }] } };
        //     } else if (classifiedCategory.startsWith('faculty')) {
        //          whereFilter = { category: { '$like': 'faculty_%' } };
        //     } else {
        //         whereFilter = { category: classifiedCategory };
        //     }
        //     console.log(`Query classified into category: '${classifiedCategory}'.`);
        // } else {
        //      console.log("Could not classify query. Performing broad search.");
        // }
        
        // 3. Retrieve relevant chunks from ChromaDB with the new filter
        const queryOptions = {
            queryEmbeddings: [queryEmbedding],
            nResults: 20,
            include: ['documents', 'metadatas']
        };
        
        if (Object.keys(whereFilter).length > 0 && classifiedCategory !== 'none') {
            queryOptions.where = whereFilter;
        }

        const results = await collection.query(queryOptions);

        const relevantChunks = results.documents[0] || [];
        const relevantMetadatas = results.metadatas[0] || [];

        console.log(`Retrieved ${relevantChunks.length} relevant chunks.`);
        if (Object.keys(whereFilter).length > 0) {
            console.log(`(Using filter: ${JSON.stringify(whereFilter)})`);
        }
        console.log('Chunks:', relevantChunks.map(c => c.slice(0, 50) + '...'));

        if (relevantChunks.length === 0) {
            return res.json({ response: "I couldn't find any relevant information in the college database for your query. Please try rephrasing." });
        }

        // 4. Construct the RAG prompt for Groq
        const context = relevantChunks.map((chunk, index) => `Chunk ${index + 1} (Source: ${relevantMetadatas[index].source}):\n"${chunk}"`).join('\n\n');

        const ragPrompt = `
You are a chatbot for GMRIT. Your task is to provide answers exclusively using the content from the "College Information" section. If you cannot find the answer within the provided context, you must respond with "I do not have that information." Do not use any external knowledge. Provide direct and concise answers.

College Information:
${context}

User Question: "${userQuery}"
`;
        console.log('Sending prompt to Groq AI...');

        // 5. Call Groq AI
        const groqResponse = await askGroq(ragPrompt);
        console.log('Groq AI response received.');

        // 6. Return the response
        res.json({ response: groqResponse, source_documents: relevantMetadatas });

    } catch (error) {
        console.error('Error processing chatbot query:', error);
        res.status(500).json({ error: 'Failed to process your query.' });
    }
});

export default router;
