import CollegeInfo from '../models/CollegeInfo.js';
import { scrapeCollegeInfo } from '../scraping/collegeInfoScraper.js';
import axios from 'axios';
import https from 'https';
import { embedText } from '../utils/embedding.js'; 
import KnowledgeBase from '../models/KnowledgeBase.js';
// Create an agent that ignores SSL certs (for dev only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
// Save scraped data to DB




// <-- use proper chunked embedding

export const fetchAndSaveCollegeInfo = async (req, res) => {
  try {
    await KnowledgeBase.deleteMany({});


    const allData = await scrapeCollegeInfo();

    const embeddedData = await Promise.all(
      allData.map(async (item) => {
        const fullText = `${item.title}. ${item.content}`;
        const embedding = await embedText(fullText); // <-- uses chunking
        return {
          title: item.title,
          content: item.content,
          embedding,
        };
      })
    );

    const inserted = await KnowledgeBase.insertMany(embeddedData);

    res.status(201).json({
      message: 'College Info scraped, embedded (with chunking), and saved successfully.',
      count: inserted.length,
    });
  } catch (err) {
    console.error('❌ Error scraping or saving College Info:', err.message);
    res.status(500).json({ error: 'Failed to scrape, embed, or save data' });
  }
};
