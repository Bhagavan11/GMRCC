import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCES = [
  {
    url: 'https://www.collegedekho.com/colleges/gmrit-admission',
    category: 'admission'
  },
  {
    url: 'https://www.collegedekho.com/colleges/gmrit-scholarship',
    category: 'scholarship'
  },
  {
    url: 'https://www.collegedekho.com/colleges/gmrit-cutoff',
    category: 'cutoff'
  },
  {
    url: 'https://www.collegedekho.com/colleges/gmrit-campus',
    category: 'campus'
  }
];

export const scrapeAdmissions = async (httpsAgent = null) => {
  const results = [];

  for (const { url, category } of SOURCES) {
    try {
      const response = await axios.get(url, { httpsAgent });
      const $ = cheerio.load(response.data);

      console.log(`Scraping ${url}...`);

      // Most relevant content is under these common containers
      const containers = [
        'div.collegeDetail_classRead_yd_kT',
        'div.latestUpdateCard_cardItems__H_Q3k',
        'div.collegeDetail_overview_Qr159',
        'div.scrollTable', // For tables
        'div.block.box'     // For content blocks like "Campus" page
      ];

      $(containers.join(',')).each((_, container) => {
        const $container = $(container);
        $container.find('h2, h3, p, li, tr').each((_, el) => {
          const tag = $(el).get(0)?.tagName;
          const text = $(el).text().trim();
          if (text.length < 10) return;

          results.push({
            title: tag === 'h2' || tag === 'h3' ? text : null,
            content: text,
            category
          });
        });
      });

    } catch (err) {
      console.error(`❌ Error scraping ${url}:`, err.message);
    }
  }

  return results;
};
