import Faculty from '../models/Faculty.js';
import { scrapeFaculty } from '../scraping/facultyScraper.js';
import https from 'https';
import { embedText } from '../utils/embedding.js';
import KnowledgeBase from '../models/KnowledgeBase.js';

// Create agent that ignores SSL certs (for dev only)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Scrape → Embed → Store
export const fetchAndSaveFacultyInfo = async (req, res) => {
  try {
    const allDepts = ['cse', 'ece', 'eee', 'civil', 'mech', 'it', 'aiml', 'aids', 'bsh', 'admin', 'hod'];
    let totalInserted = 0;

    for (const deptCode of allDepts) {
      // Scrape data
      const scrapedData = await scrapeFaculty(deptCode, httpsAgent);
      if (!scrapedData || scrapedData.length === 0) continue;

      // Clean previous entries from KnowledgeBase for this dept

      // Embed and transform
      const embeddedData = await Promise.all(
        scrapedData.map(async (item) => {
          const fullText = [
            `${item.name} is a ${item.designation} in the ${deptCode} department.`,
            `Email: ${item.email || 'N/A'}.`,
            `Profile: ${item.profileUrl || 'N/A'}.`,
            `Image: ${item.imageUrl || 'N/A'}.`
          ].join(' ');

          const embedding = await embedText(fullText);

          return {
            title: item.name,
            content: fullText,
            embedding,
            category: `faculty_${deptCode}`,
            department: deptCode,
            imageUrl: item.imageUrl,
            profileUrl: item.profileUrl,
          };
        })
      );

      const inserted = await KnowledgeBase.insertMany(embeddedData);
      console.log(`✅ Inserted ${inserted.length} faculty records for ${deptCode}`);
      totalInserted += inserted.length;
    }

    res.status(201).json({
      message: 'Faculty data scraped, embedded, and saved successfully.',
      totalInserted,
    });
  } catch (err) {
    console.error('❌ Error scraping or saving Faculty Info:', err.message);
    res.status(500).json({ error: 'Failed to scrape, embed, or save faculty info' });
  }
};

// GET all faculty by department
export const getFaculty = async (req, res) => {
  try {
    const deptCode = req.params.code.toLowerCase();
    const data = await Faculty.find({ department: deptCode });
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching faculty data:', err.message);
    res.status(500).json({ error: 'Failed to fetch faculty info' });
  }
};
