// src/models/CollegeInfo.js
import mongoose from 'mongoose';

const collegeInfoSchema = new mongoose.Schema({
  type: String,
  title: String,
  content: String,
  embedding: {
    type: [Number],
    index: true, // Required for Atlas Vector Search
  },
});

export default mongoose.model('CollegeInfo', collegeInfoSchema);
