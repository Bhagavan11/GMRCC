import Admissions from '../models/Admissions.js';
import { scrapeAdmissions } from '../scraping/admissionsScraper.js';
import https from 'https';
import { embedText } from '../utils/embedding.js';
import KnowledgeBase from '../models/KnowledgeBase.js';

// For dev SSL bypass
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// POST: Scrape → Embed → Save All Categories at Once
export const fetchAndSaveAdmissionsInfo = async (req, res) => {
  try {
    await KnowledgeBase.deleteMany({}); // Clear existing records
    const scrapedData = await scrapeAdmissions(httpsAgent);
    console.log('scrapped data',scrapedData)
    if (!scrapedData || scrapedData.length === 0) {
      return res.status(404).json({ message: 'No admissions data scraped.' });
    }

    const embeddedData = await Promise.all(
      scrapedData.map(async (item) => {
        const fullText = `${item.title ? item.title + ': ' : ''}${item.content}`;
        const embedding = await embedText(fullText);
        return {
          ...item,
          content: fullText,
          embedding,
        };
      })
    );

    // Clear existing records by category
    const categories = [...new Set(embeddedData.map((d) => d.category))];
    for (const cat of categories) {
      await Admissions.deleteMany({ category: cat });
    }

    const inserted = await Admissions.insertMany(embeddedData);

    res.status(201).json({
      message: 'Admissions data scraped, embedded, and saved successfully.',
      totalInserted: inserted.length,
    });
  } catch (err) {
    console.error('❌ Error during admissions scraping/embedding:', err.message);
    res.status(500).json({ error: 'Failed to process admissions data' });
  }
};

// GET: Fetch by category (e.g., admission, scholarship, cutoff, campus)
export const getAdmissions = async (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    const data = await Admissions.find({ category });
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching admissions data:', err.message);
    res.status(500).json({ error: 'Failed to fetch admissions info' });
  }
};
