// scraping/collegeInfoScraper.js
import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function cleanText($, selector) {
  return $(selector).map((i, el) => $(el).text().trim()).get().join(' ').replace(/\s+/g, ' ');
}

export async function scrapeAboutPage() {
  const { data } = await axios.get('https://gmrit.edu.in/about.php', { httpsAgent });
  const $ = cheerio.load(data);
  const aboutText = cleanText($, '.description.mx-2 p');

  return {
    title: 'About GMRIT',
    content: aboutText,
    category: 'college_info'
  };
}

export async function scrapeAchievements() {
  const { data } = await axios.get('https://gmrit.edu.in/newAbout.php', { httpsAgent });
  const $ = cheerio.load(data);

  return [
    {
      title: 'Rankings',
      content: $('h5:contains("Rankings")').next('p').text().trim(),
      category: 'ranking'
    },
    {
      title: 'Accreditations',
      content: $('h5:contains("Accreditations")').next('p').text().trim(),
      category: 'accreditation'
    },
    {
      title: 'Placements',
      content: $('h5:contains("Placements")').next('p').text().trim(),
      category: 'placement'
    }
  ];
}

export async function scrapeResearchCell() {
  const { data } = await axios.get('https://gmrit.edu.in/researchcell.php', { httpsAgent });
  const $ = cheerio.load(data);
  const content = cleanText($, '.container');

  return {
    title: 'Research & Development Cell',
    content,
    category: 'research'
  };
}
export async function scrapePlacement() {
  const url = 'https://gmrit.edu.in/nb_placements.php';
  const { data } = await axios.get(url, { httpsAgent });
  const $ = cheerio.load(data);

  const placements = [];

  $('table tbody tr').each((_, row) => {
    const linkTag = $(row).find('a');
    const dateTd = $(row).find('td').last();

    const title = cleanText(linkTag.text());
    const link = linkTag.attr('href')?.trim();
    const date = cleanText(dateTd.text());

    if (title && link) {
      placements.push({ title, link, date });
    }
  });

  return {
    title: "Placement Info",
    content: placements,
    category: "placement",
  };
}
export async function scrapeDepartment(code) {
  const { data } = await axios.get(`https://gmrit.edu.in/department.php?code=${code}`, { httpsAgent });
  const $ = cheerio.load(data);
  const deptName = $('h1').first().text().trim();
  const content = cleanText($, '.container');

  return {
    title: deptName,
    content,
    category: 'department'
  };
}

export async function scrapeCollegeInfo() {
  const about = await scrapeAboutPage();
  const achievements = await scrapeAchievements();
  const research = await scrapeResearchCell();
  const departments = await Promise.all(['cse', 'it', 'ece', 'eee', 'mech'].map(scrapeDepartment));

  return [about, ...achievements, research, ...departments];
}
