// src/utils/embedding.js
import { pipeline } from '@xenova/transformers';

let embedder = null;

// Split text into manageable chunks
function chunkText(text, maxWords = 250) {
  const words = text.split(' ');
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
}

export async function embedText(text) {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  const chunks = chunkText(text);
  const embeddings = [];

  for (const chunk of chunks) {
    const output = await embedder(chunk, { pooling: 'mean', normalize: true });
    embeddings.push(output.data);
  }

  // Average all chunk embeddings
  const avg = new Array(embeddings[0].length).fill(0);
  for (const vec of embeddings) {
    for (let i = 0; i < vec.length; i++) {
      avg[i] += vec[i];
    }
  }
  for (let i = 0; i < avg.length; i++) {
    avg[i] /= embeddings.length;
  }

  return Array.from(avg);
}
