import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  name: String,
  designation: String,
  department: String,
  email: String,
  phone: String,
  imageUrl: String,
  profileUrl: String,

  // 🔥 embedding-related fields
  content: String, // Full string content to embed (e.g., "Dr. XYZ is a professor in...")
  embedding: {
    type: [Number], // array of floats
    index: true,
    required: false
  }
}, { timestamps: true });

// Atlas Vector Index on 'embedding' required for semantic search

export default mongoose.model('Faculty', facultySchema);
