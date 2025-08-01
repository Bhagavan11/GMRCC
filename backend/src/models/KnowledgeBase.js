// models/KnowledgeBase.js
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: String,
  content: String,
  category: String, // e.g., 'admissions', 'placements', etc.
  embedding: {
    type: [Number],
    index: 'vector',
    dimensions: 384,
  },
});

export default mongoose.model('KnowledgeBase', schema);
