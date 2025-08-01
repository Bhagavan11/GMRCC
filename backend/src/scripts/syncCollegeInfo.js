// // scripts/syncCollegeInfo.js
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import { scrapeCollegeInfo } from '../scraping/collegeInfoScraper.js';
// import { embedText } from '../utils/embedding.js';
// import CollegeInfo from '../models/CollegeInfo.js';

// dotenv.config();

// export default async function syncCollegeInfo() {
//   // if (mongoose.connection.readyState === 0) {
//   //   await mongoose.connect(process.env.MONGO_URI);
//   //   console.log('✅ Connected to MongoDB');
//   // }

//   // console.log('🔄 Scraping college content...');
//   const documents = await scrapeCollegeInfo();

//   await CollegeInfo.deleteMany({});
//   console.log('🧹 Old content cleared.');

//   const withEmbeddings = [];

//   for (const doc of documents) {
//     console.log(`🔍 Embedding: ${doc.title}`);
//     const embedding = await embedText(doc.content);
//     withEmbeddings.push({ ...doc, embedding });
//   }

//   await CollegeInfo.insertMany(withEmbeddings);
//   console.log('✅ Scraped, embedded, and saved to DB!');
// }

// // ✅ Run it directly
// syncCollegeInfo()
//   .then(() => {
//     console.log('✅ Done');
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error('❌ Error:', err);
//     process.exit(1);
//   });
