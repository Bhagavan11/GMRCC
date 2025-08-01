import mongoose from 'mongoose';

const admissionsSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String, // e.g., 'cutoff', 'procedure'
  embedding: {
    type: [Number],
    index: 'vector',
    dimensions: 384,
  },
});

export default mongoose.model('Admissions', admissionsSchema);
 