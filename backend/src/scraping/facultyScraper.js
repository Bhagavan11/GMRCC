// src/scrapers/facultyScraper.js
import axios from "axios";
import * as cheerio from "cheerio";
import { httpsAgent, cleanText } from "../utils/util.js"; // Corrected path to util.js

const COLLEGE_BASE_URL = 'https://gmrit.edu.in'; // Define here or pass as param

export const allDepts = ['cse', 'ece', 'eee', 'civil', 'mech', 'it', 'aiml', 'aids', 'bsh', 'admin', 'hod'];

export async function scrapeFaculty(dept = "admin") {
  const url = `${COLLEGE_BASE_URL}/facultydirectory.php?dept=${dept}`;
  let data;
  try {
    const response = await axios.get(url, { httpsAgent });
    data = response.data;
  } catch (error) {
    console.warn(`⚠️ Failed to fetch faculty page for ${dept}: ${error.message}`);
    return [];
  }

  const $ = cheerio.load(data);
  const faculty = [];

  const facultyProfiles = $(".faculty_profile_box").map((i, el) => {
    const name = $(el).find(".name_details h4").text().trim();
    const desig1 = cleanText($(el).find(".name_details p").eq(0).text());
    const desig2 = cleanText($(el).find(".name_details p").eq(1).text());
    const designation = `${desig1} ${desig2}`.trim();

    const img = $(el).find(".photo img").attr("src"); // Get raw src
    // Use URL constructor for robust path resolution
    const imageUrl = img ? new URL(img, COLLEGE_BASE_URL).href : "";

    const profileLink = $(el).find(".more_details a").attr("href"); // Get raw href
    // Use URL constructor for robust path resolution
    const profileUrl = profileLink ? new URL(profileLink, COLLEGE_BASE_URL).href : "";

    return { name, designation, imageUrl, profileUrl, dept };
  }).get();

  for (const item of facultyProfiles) {
    let profileText = "";
    const effectiveSourceUrl = item.profileUrl || url; // Determine the actual source for this document

    if (item.profileUrl) {
      try {
        const { data: profileHtml } = await axios.get(item.profileUrl, { httpsAgent });
        const $$ = cheerio.load(profileHtml);
        profileText = cleanText($$('body').text()); // Or more specific selectors if available
      } catch (err) {
        console.warn(`⚠️ Failed to fetch faculty profile: ${item.profileUrl}`);
      }
    }

    const fullContent = `
      Name: ${item.name}
      Designation: ${item.designation}
      Department: ${item.dept}
      Profile URL: ${item.profileUrl}
      Image URL: ${item.imageUrl}
      Details: ${profileText}
    `.trim();

    // Storing as a document for LangChain
    faculty.push({
      pageContent: fullContent,
      metadata: {
        title: item.name,
        category: `faculty_${item.dept}`,
        source: effectiveSourceUrl, // Use the resolved URL as the source
        docType: 'faculty_profile',
        name: item.name,
        designation: item.designation,
        department: item.dept,
        imageUrl: item.imageUrl,
      },
    });
  }

  console.log(`✅ Scraped ${faculty.length} faculty from ${dept}`);
  return faculty;
}