// scraping/facultyScraper.js
import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function scrapeFaculty(dept = "admin") {
  const url = `https://gmrit.edu.in/facultydirectory.php?dept=${dept}`;
  const { data } = await axios.get(url, { httpsAgent });
  const $ = cheerio.load(data);

  const faculty = [];

  const facultyProfiles = $(".faculty_profile_box").map((i, el) => {
    const name = $(el).find(".name_details h4").text().trim();
    const desig1 = $(el).find(".name_details p").eq(0).text().replace(/\u00a0/g, " ").trim();
    const desig2 = $(el).find(".name_details p").eq(1).text().replace(/\u00a0/g, " ").trim();
    const designation = `${desig1} ${desig2}`.trim();

    const img = $(el).find(".photo img").attr("src")?.replace("~", "");
    const imageUrl = img ? `https://gmrit.edu.in${img}` : "";

    const profileLink = $(el).find(".more_details a").attr("href") || "";
    const profileUrl = profileLink ? `https://gmrit.edu.in/${profileLink}` : "";

    return { name, designation, imageUrl, profileUrl, dept };
  }).get();

  for (const item of facultyProfiles) {
    let profileText = "";

    if (item.profileUrl) {
      try {
        const { data: profileHtml } = await axios.get(item.profileUrl, { httpsAgent });
        const $$ = cheerio.load(profileHtml);
        profileText = $$.text().replace(/\s+/g, " ").trim(); // Flatten all text
      } catch (err) {
        console.warn(`⚠️ Failed to fetch profile: ${item.profileUrl}`);
      }
    }

    const fullText = `
      Name: ${item.name}
      Designation: ${item.designation}
      Department: ${item.dept}
      Profile URL: ${item.profileUrl}
      Image URL: ${item.imageUrl}
      Details: ${profileText}
    `.trim();

    faculty.push({
      name: item.name,
      designation: item.designation,
      department: item.dept,
      title: item.name,
      category: `faculty_${item.dept}`,
      content: fullText,
      imageUrl: item.imageUrl,
      profileUrl: item.profileUrl,
    });
  }

  console.log(`✅ Scraped ${faculty.length} faculty from ${dept}`);
  return faculty;
}
