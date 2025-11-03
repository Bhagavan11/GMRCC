import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Pinecone client
export const initPinecone = async () => {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_INDEX) {
        throw new Error('Pinecone environment variables not set. Please check your .env file.');
    }

    try {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT,
        });
        
        return pinecone;
    } catch (error) {
        console.error('Error initializing Pinecone:', error);
        throw error;
    }
};

/**
 * Uploads documents to Pinecone with embeddings
 * @param {Array} documents - Array of document objects with pageContent and metadata
 * @param {string} namespace - Optional namespace in Pinecone
 * @returns {Promise<Object>} - Result of the upsert operation
 */
export const uploadToPinecone = async (documents, namespace = 'default') => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        console.warn('No documents provided for Pinecone upload');
        return { success: false, message: 'No documents provided' };
    }

    try {
        const pinecone = await initPinecone();
        const indexName = process.env.PINECONE_INDEX;
        
        // Initialize embeddings
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'text-embedding-ada-002'
        });

        // Create or get index
        const indexes = await pinecone.listIndexes();
        const indexExists = indexes.some(index => index.name === indexName);
        
        if (!indexExists) {
            console.log(`Creating new Pinecone index: ${indexName}`);
            await pinecone.createIndex({
                name: indexName,
                dimension: 1536, // OpenAI embedding dimension
                metric: 'cosine'
            });
            
            // Wait for index to be ready
            await new Promise(resolve => setTimeout(resolve, 60000));
        }

        // Upload documents with embeddings
        console.log(`Uploading ${documents.length} documents to Pinecone...`);
        
        await PineconeStore.fromDocuments(
            documents,
            embeddings,
            {
                pineconeIndex: pinecone.Index(indexName),
                namespace,
                textKey: 'text',
            }
        );

        console.log('✅ Successfully uploaded documents to Pinecone');
        return { 
            success: true, 
            documentCount: documents.length,
            namespace,
            index: indexName
        };
    } catch (error) {
        console.error('Error uploading to Pinecone:', error);
        return { 
            success: false, 
            error: error.message,
            stack: error.stack
        };
    }
};

/**
 * Deletes all vectors from a Pinecone namespace
 * @param {string} namespace - Namespace to clear
 * @returns {Promise<Object>} - Result of the delete operation
 */
export const clearPineconeNamespace = async (namespace = 'default') => {
    try {
        const pinecone = await initPinecone();
        const index = pinecone.Index(process.env.PINECONE_INDEX);
        
        await index.namespace(namespace).deleteAll();
        
        console.log(`✅ Successfully cleared namespace '${namespace}' in Pinecone`);
        return { success: true, namespace };
    } catch (error) {
        console.error('Error clearing Pinecone namespace:', error);
        return { 
            success: false, 
            error: error.message,
            stack: error.stack
        };
    }
};
