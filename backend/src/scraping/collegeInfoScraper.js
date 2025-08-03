// src/scrapers/collegeInfoScraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { httpsAgent, cleanText, extractTextFromSelector } from '../utils/util.js';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

export async function scrapeAboutPage() {
  const url = `${COLLEGE_BASE_URL}/about.php`;
  let data;
  try {
    const response = await axios.get(url, { httpsAgent });
    data = response.data;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch about page: ${error.message}`);
    return null;
  }
  const $ = cheerio.load(data);
  const aboutText = extractTextFromSelector($, '.description.mx-2 p');

  return {
    pageContent: aboutText,
    metadata: {
      title: 'About GMRIT',
      category: 'college_info',
      source: url,
      docType: 'html_page'
    }
  };
}

export async function scrapeAchievements() {
  const url = `${COLLEGE_BASE_URL}/newAbout.php`;
  let data;
  try {
    const response = await axios.get(url, { httpsAgent });
    data = response.data;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch achievements page: ${error.message}`);
    return [];
  }
  const $ = cheerio.load(data);

  const achievements = [];

  const rankingsText = cleanText($('h5:contains("Rankings")').next('p').text());
  if (rankingsText) {
    achievements.push({
      pageContent: rankingsText,
      metadata: {
        title: 'GMRIT Rankings',
        category: 'ranking',
        source: url,
        docType: 'html_section'
      }
    });
  }

  const accreditationsText = cleanText($('h5:contains("Accreditations")').next('p').text());
  if (accreditationsText) {
    achievements.push({
      pageContent: accreditationsText,
      metadata: {
        title: 'GMRIT Accreditations',
        category: 'accreditation',
        source: url,
        docType: 'html_section'
      }
    });
  }

  const placementsText = cleanText($('h5:contains("Placements")').next('p').text());
  if (placementsText) {
    achievements.push({
      pageContent: placementsText,
      metadata: {
        title: 'GMRIT Placements Overview',
        category: 'placement_overview',
        source: url,
        docType: 'html_section'
      }
    });
  }

  return achievements;
}

export async function scrapeResearchCell() {
  const url = `${COLLEGE_BASE_URL}/researchcell.php`;
  let data;
  try {
    const response = await axios.get(url, { httpsAgent });
    data = response.data;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch research cell page: ${error.message}`);
    return null;
  }
  const $ = cheerio.load(data);
  const content = extractTextFromSelector($, '.container');

  return {
    pageContent: content,
    metadata: {
      title: 'Research & Development Cell',
      category: 'research',
      source: url,
      docType: 'html_page'
    }
  };
}

export async function scrapePlacementData() { // Renamed to avoid confusion with placement overview
  const url = `${COLLEGE_BASE_URL}/nb_placements.php`;
  let data;
  try {
    const response = await axios.get(url, { httpsAgent });
    data = response.data;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch placements data page: ${error.message}`);
    return [];
  }
  const $ = cheerio.load(data);

  const placements = [];

  $('table tbody tr').each((_, row) => {
    const linkTag = $(row).find('a');
    const dateTd = $(row).find('td').last();

    const title = cleanText(linkTag.text());
    const link = linkTag.attr('href')?.trim();
    const date = cleanText(dateTd.text());

    if (title && link) {
      const fullLink = link.startsWith('http') ? link : `${COLLEGE_BASE_URL}/${link}`; // Ensure absolute URL
      placements.push({
        pageContent: `Placement Record: ${title} - Date: ${date}. Link: ${fullLink}`,
        metadata: {
          title: `Placement Record: ${title}`,
          category: 'placement_record',
          source: fullLink, // Source is the direct link if available
          date: date,
          docType: 'placement_record_entry'
        }
      });
    }
  });

  console.log(`✅ Scraped ${placements.length} placement records.`);
  return placements;
}

export async function scrapeDepartment(code) {
  const url = `${COLLEGE_BASE_URL}/department.php?code=${code}`;
  let data;
  try {
    const response = await axios.get(url, { httpsAgent });
    data = response.data;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch department page for ${code}: ${error.message}`);
    return null;
  }
  const $ = cheerio.load(data);
  const deptName = cleanText($('h1').first().text());
  // Assuming '.container' holds the main department content. Adjust if needed.
  const content = extractTextFromSelector($, '.container');

  return {
    pageContent: content,
    metadata: {
      title: deptName,
      category: 'department_info',
      source: url,
      docType: 'html_page',
      departmentCode: code
    }
  };
}

// Consolidating function
export async function scrapeCollegeInfo() {
  const documents = [];

  const about = await scrapeAboutPage();
  if (about) documents.push(about);

  const achievements = await scrapeAchievements();
  documents.push(...achievements);

  const research = await scrapeResearchCell();
  if (research) documents.push(research);

  const placementsData = await scrapePlacementData(); // New function
  documents.push(...placementsData);

  const departments = await Promise.all(['cse', 'it', 'ece', 'eee', 'mech'].map(scrapeDepartment));
  documents.push(...departments.filter(Boolean)); // Filter out nulls

  console.log(`✅ Scraped general college info: ${documents.length} documents.`);
  return documents;
}