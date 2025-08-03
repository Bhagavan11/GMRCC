// src/clients/embeddingClient.js

import { pipeline } from '@xenova/transformers';

let embedderPipeline = null; // Will store the loaded model

/**
 * Loads the embedding model pipeline if not already loaded.
 * Uses 'Xenova/all-MiniLM-L12-v2' for high accuracy and self-hosted cost-free embeddings.
 * @returns {Promise<any>} The loaded pipeline.
 */
export async function loadEmbeddingModelPipeline() {
    if (!embedderPipeline) {
        console.log("Loading embedding model: Xenova/all-MiniLM-L12-v2...");
        embedderPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L12-v2');
        console.log("Embedding model loaded successfully.");
    }
    return embedderPipeline;
}

/**
 * Generates an embedding (vector) for a given text.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} An array of numbers representing the embedding.
 */
export async function generateEmbedding(text) {
    if (!embedderPipeline) {
        await loadEmbeddingModelPipeline(); // Ensure model is loaded if not already
    }
    const output = await embedderPipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data); // Convert Float32Array to regular Array
}