// // src/scripts/embedCollegeInfo.js
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import { pipeline } from '@xenova/transformers';
// import CollegeInfo from '../models/CollegeInfo.js';

// dotenv.config();

// // Connect to MongoDB
// await mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// // Load embedding pipeline
// const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');


// async function generateEmbedding(text) {
//   const output = await embedder(text, { pooling: 'mean', normalize: true });
//   return Array.from(output.data); // Convert typed array to normal array
// }

// async function embedAndSave() {
//   const data = await CollegeInfo.find({});

//   for (let doc of data) {
//     const fullText = `${doc.title}. ${doc.content}`;
//     const embedding = await generateEmbedding(fullText);

//     doc.embedding = embedding;
//     await doc.save();
//     console.log(`✅ Embedded and saved: ${doc.title}`);
//   }

//   console.log('✅ All documents embedded and updated.');
//   mongoose.disconnect();
// }

// embedAndSave().catch((err) => {
//   console.error('❌ Error embedding data:', err);
//   mongoose.disconnect();
// });
