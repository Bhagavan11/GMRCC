// // import axios from 'axios';
// // import * as cheerio from 'cheerio';
// // import { httpsAgent, cleanText, extractTextFromSelector } from '../utils/util.js';

// // const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

// // export async function scrapeAboutPage() {
// //     const documents = [];
    
// //     // --- Scrape the main 'about' page for general info ---
// //     const aboutUrl = `${COLLEGE_BASE_URL}/about.php`;
// //     let aboutData;
// //     try {
// //         const response = await axios.get(aboutUrl, { httpsAgent });
// //         aboutData = response.data;
// //     } catch (error) {
// //         console.warn(`⚠️ Failed to fetch about page: ${error.message}`);
// //         return [];
// //     }
// //     const $ = cheerio.load(aboutData);
// //     const aboutText = extractTextFromSelector($, '.description p');

// //     if (aboutText) {
// //         documents.push({
// //             pageContent: `About GMRIT: ${aboutText}`,
// //             metadata: {
// //                 title: 'About GMRIT',
// //                 category: 'college_info',
// //                 source: aboutUrl,
// //                 docType: 'html_page_section'
// //             }
// //         });
// //     }

// //     // --- Scrape the 'newAbout' page for Vision, Mission, Rankings, etc. ---
// //     const newAboutUrl = `${COLLEGE_BASE_URL}/newAbout.php`;
// //     let newAboutData;
// //     try {
// //         const response = await axios.get(newAboutUrl, { httpsAgent });
// //         newAboutData = response.data;
// //     } catch (error) {
// //         console.warn(`⚠️ Failed to fetch new about page: ${error.message}`);
// //         return documents;
// //     }
// //     const $$ = cheerio.load(newAboutData);

// //     // Scrape Vision and Mission
// //     const vision = cleanText($$('h4:contains("Vision and Mission")').next('p').text());
// //     if (vision) {
// //         documents.push({
// //             pageContent: `GMRIT Vision and Mission: ${vision}`,
// //             metadata: {
// //                 title: 'GMRIT Vision and Mission',
// //                 category: 'college_info',
// //                 source: newAboutUrl,
// //                 docType: 'html_page_section'
// //             }
// //         });
// //     }
    
// //     // Scrape Key Statistics (Student Strength, Alumni, etc.)
// //     const stats = {};
// //     $$('.highlight-box').each((i, el) => {
// //         const value = cleanText($$(el).find('.counter').text());
// //         const label = cleanText($$(el).find('h3').text());
// //         if (value && label) {
// //             stats[label] = value;
// //         }
// //     });

// //     if (Object.keys(stats).length > 0) {
// //         const statsText = Object.entries(stats).map(([label, value]) => `${label}: ${value}`).join(', ');
// //         documents.push({
// //             pageContent: `GMRIT Key Statistics: ${statsText}`,
// //             metadata: {
// //                 title: 'GMRIT Key Statistics',
// //                 category: 'college_info',
// //                 source: newAboutUrl,
// //                 docType: 'html_page_section',
// //                 stats: stats
// //             }
// //         });
// //     }

// //     // Scrape Rankings
// //     const rankingsText = cleanText($$('h5:contains("Rankings")').next('p').text());
// //     if (rankingsText) {
// //         documents.push({
// //             pageContent: `GMRIT Rankings: ${rankingsText}`,
// //             metadata: {
// //                 title: 'GMRIT Rankings',
// //                 category: 'ranking',
// //                 source: newAboutUrl,
// //                 docType: 'html_page_section'
// //             }
// //         });
// //     }

// //     // Scrape Accreditations
// //     const accreditationsText = cleanText($$('h5:contains("Accreditations")').next('p').text());
// //     if (accreditationsText) {
// //         documents.push({
// //             pageContent: `GMRIT Accreditations: ${accreditationsText}`,
// //             metadata: {
// //                 title: 'GMRIT Accreditations',
// //                 category: 'accreditation',
// //                 source: newAboutUrl,
// //                 docType: 'html_page_section'
// //             }
// //         });
// //     }

// //     console.log(`✅ Scraped about and achievements pages, generated ${documents.length} documents.`);
// //     return documents;
// // }

// // export async function scrapeResearchCell() {
// //     const url = `${COLLEGE_BASE_URL}/researchcell.php`;
// //     let data;
// //     try {
// //         const response = await axios.get(url, { httpsAgent });
// //         data = response.data;
// //     } catch (error) {
// //         console.warn(`⚠️ Failed to fetch research cell page: ${error.message}`);
// //         return null;
// //     }
// //     const $ = cheerio.load(data);
// //     const content = extractTextFromSelector($, '.container');

// //     return {
// //         pageContent: content,
// //         metadata: {
// //             title: 'Research & Development Cell',
// //             category: 'research',
// //             source: url,
// //             docType: 'html_page'
// //         }
// //     };
// // }

// // export async function scrapePlacementData() {
// //     const url = `${COLLEGE_BASE_URL}/nb_placements.php`;
// //     let data;
// //     try {
// //         const response = await axios.get(url, { httpsAgent });
// //         data = response.data;
// //     } catch (error) {
// //         console.warn(`⚠️ Failed to fetch placements data page: ${error.message}`);
// //         return [];
// //     }
// //     const $ = cheerio.load(data);

// //     const placements = [];

// //     // Assuming the placements data is in a table, we'll try to extract each row
// //     $('table tbody tr').each((_, row) => {
// //         const linkTag = $(row).find('a');
// //         const dateTd = $(row).find('td').last();

// //         const title = cleanText(linkTag.text());
// //         const link = linkTag.attr('href')?.trim();
// //         const date = cleanText(dateTd.text());

// //         if (title && link) {
// //             const fullLink = new URL(link, COLLEGE_BASE_URL).href;
// //             // Basic record entry for indexing and browsing
// //             placements.push({
// //                 pageContent: `Placement Record: ${title} - Date: ${date}. Link: ${fullLink}`,
// //                 metadata: {
// //                     title: `Placement Record: ${title}`,
// //                     category: 'placement_record',
// //                     source: fullLink,
// //                     date: date,
// //                     docType: 'placement_record_entry'
// //                 }
// //             });

// //             // Also enqueue as a deferred link for full text extraction
// //             const isPdf = /\.pdf($|\?)/i.test(fullLink);
// //             placements.push({
// //                 link: fullLink,
// //                 type: isPdf ? 'pdf_link' : 'html_link',
// //                 pageContent: '',
// //                 metadata: {
// //                     title: title,
// //                     category: 'placement_stats',
// //                     source: url,
// //                     date: date,
// //                     docType: isPdf ? 'pdf_document' : 'html_page'
// //                 }
// //             });
// //         }
// //     });

// //     console.log(`✅ Scraped ${placements.length} placement records.`);
// //     return placements;
// // }

// // export async function scrapeDepartment(code) {
// //     const url = `${COLLEGE_BASE_URL}/department.php?code=${code}`;
// //     let data;
// //     try {
// //         const response = await axios.get(url, { httpsAgent });
// //         data = response.data;
// //     } catch (error) {
// //         console.warn(`⚠️ Failed to fetch department page for ${code}: ${error.message}`);
// //         return null;
// //     }
// //     const $ = cheerio.load(data);
// //     const deptName = cleanText($('h1').first().text());
// //     // Assuming '.container' holds the main department content. Adjust if needed.
// //     const content = extractTextFromSelector($, '.container');

// //     return {
// //         pageContent: content,
// //         metadata: {
// //             title: deptName,
// //             category: 'department_info',
// //             source: url,
// //             docType: 'html_page',
// //             departmentCode: code
// //         }
// //     };
// // }

// // // Consolidating function
// // export async function scrapeCollegeInfo() {
// //     const documents = [];

// //     const about = await scrapeAboutPage();
// //     documents.push(...about);

// //     const research = await scrapeResearchCell();
// //     if (research) documents.push(research);

// //     const placementsData = await scrapePlacementData();
// //     documents.push(...placementsData);

// //     const departments = await Promise.all(['cse', 'it', 'ece', 'eee', 'mech'].map(scrapeDepartment));
// //     documents.push(...departments.filter(Boolean));

// //     console.log(`✅ Scraped general college info: ${documents.length} documents.`);
// //     return documents;
// // }
// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import { httpsAgent, cleanText, extractTextFromPdf } from '../utils/util.js'; // Assuming extractTextFromSelector is now inside cleanText or provided elsewhere
// // Note: Assuming `extractTextFromSelector` is accessible or its logic is handled by standard Cheerio + cleanText.

// const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

// // -------------------------------------------------------------------
// // -------------------- 1. SCRAPE ABOUT PAGE DETAILS -----------------
// // -------------------------------------------------------------------

// /**
//  * Scrapes detailed information from the newAbout.php page, including
//  * About, Vision/Mission, Founder's Message, Governance, and Achievements.
//  */

// export async function scrapeContactInfo() {
//     console.log('🚀 Starting Contact Info Scraper...');
//     const documents = [];

//     // 1. WhatsApp Contact Link (Direct link provided by user)
//     documents.push({
//         pageContent: `GMRIT Official WhatsApp Contact Number: 9949784378. Use this link to chat directly with the college staff: https://api.whatsapp.com/send/?phone=9949784378`,
//         metadata: {
//             title: 'Official College WhatsApp Contact',
//             category: 'college_contact_whatsapp',
//             source: 'Manual Link/WhatsApp',
//             docType: 'contact_information',
//             phone: '9949784378'
//         }
//     });

//     // 2. General Contact Page (Assuming a page exists for structured info)
//     const generalContactUrl = `${COLLEGE_BASE_URL}/contactus.php`;
//     let data;
//     try {
//         const response = await axios.get(generalContactUrl, { httpsAgent });
//         data = response.data;
//     } catch (error) {
//         console.warn(`⚠️ Failed to fetch general contact page: ${error.message}`);
//         // Return only the WhatsApp document if general page fails
//         return documents;
//     }
    
//     const $ = cheerio.load(data);
    
//     // Attempt to extract key contact details (Address, Phones, Emails)
//     const contactContent = cleanText($('.container').text());
    
//     if (contactContent.length > 100) {
//         documents.push({
//             pageContent: `GMRIT General Contact Details: ${contactContent}`,
//             metadata: {
//                 title: 'GMRIT General Contact Details',
//                 category: 'college_contact_general',
//                 source: generalContactUrl,
//                 docType: 'contact_information'
//             }
//         });
//     }

//     return documents;
// }


// export async function scrapeAboutPage() {
//     console.log('🚀 Starting About Page Scraper...');
//     const documents = [];
//     const newAboutUrl = `${COLLEGE_BASE_URL}/newAbout.php`;
    
//     let newAboutData;
//     try {
//         const response = await axios.get(newAboutUrl, { httpsAgent });
//         newAboutData = response.data;
//     } catch (error) {
//         console.warn(`⚠️ Failed to fetch new about page: ${error.message}`);
//         return documents;
//     }
//     const $$ = cheerio.load(newAboutData);

//     // --- 1. About GMRIT (Main Introduction) ---
//     // Targeting the initial descriptive paragraph next to the image (based on uploaded image_f059fd.jpg)
//     const aboutContainer = $$('div.col-lg-6.col-md-6').first();
//     const aboutText = cleanText(aboutContainer.find('p').first().text());

//     if (aboutText) {
//         documents.push({
//             pageContent: `About GMRIT: ${aboutText}`,
//             metadata: {
//                 title: 'About GMRIT - Introduction',
//                 category: 'college_info',
//                 source: newAboutUrl,
//                 docType: 'html_page_section'
//             }
//         });
//     }

//     // --- 2. Vision and Mission ---
//     // Targeting the specific Vision and Mission blocks (based on uploaded image_f0563a.jpg)
//     const vision = cleanText($$('h4:contains("Vision")').next('p').text());
//     const mission = cleanText($$('h4:contains("Mission")').next('ul').text());

//     if (vision || mission) {
//         documents.push({
//             pageContent: `GMRIT Vision: ${vision}. GMRIT Mission: ${mission}`,
//             metadata: {
//                 title: 'GMRIT Vision and Mission',
//                 category: 'college_vision_mission',
//                 source: newAboutUrl,
//                 docType: 'html_page_section'
//             }
//         });
//     }
    
//     // --- 3. Founder's Message ---
//     // Targeting the founder's message section (based on uploaded image_f052bc.jpg)
//     const founderMessageContainer = $$('.text-center:contains("Founder\'s Message")').nextAll('.row').first();
//     const founderMessageText = cleanText(founderMessageContainer.text());
    
//     if (founderMessageText) {
//         documents.push({
//             pageContent: `Founder's Message (G.M. Rao): ${founderMessageText}`,
//             metadata: {
//                 title: 'Founder\'s Message',
//                 category: 'governance_message',
//                 source: newAboutUrl,
//                 docType: 'html_page_section'
//             }
//         });
//     }

//     // --- 4. Governance - Overview ---
//     // Targeting the Governance section (based on uploaded image_f052bc.jpg)
//     const governanceContainer = $$('h5:contains("Governance - Overview")').closest('.row');
//     const governanceText = cleanText(governanceContainer.text());

//     if (governanceText) {
//         documents.push({
//             pageContent: `GMRIT Governance Overview: ${governanceText}`,
//             metadata: {
//                 title: 'GMRIT Governance Overview',
//                 category: 'governance_info',
//                 source: newAboutUrl,
//                 docType: 'html_page_section'
//             }
//         });
//     }

//     // --- 5. Achievements (Rankings and Accreditations) ---
//     // Targeting Achievements section (based on uploaded image_f04b5d.jpg)
//     const achievementsContainer = $$('h4:contains("Achievements")').closest('.row').next('.row');
    
//     const rankings = cleanText(achievementsContainer.find('h5:contains("Rankings")').next('p').text());
//     const accreditations = cleanText(achievementsContainer.find('h5:contains("Accreditations")').next('p').text());
    
//     if (rankings || accreditations) {
//         documents.push({
//             pageContent: `GMRIT Rankings: ${rankings}. Accreditations: ${accreditations}`,
//             metadata: {
//                 title: 'GMRIT Rankings and Accreditations',
//                 category: 'college_achievements',
//                 source: newAboutUrl,
//                 docType: 'html_page_section'
//             }
//         });
//     }

//     console.log(`✅ Scraped about and achievements pages, generated ${documents.length} documents.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 2. SCRAPE RESEARCH CELL ----------------------
// // -------------------------------------------------------------------

// export async function scrapeResearchCell() {
//     console.log('🚀 Starting Research Cell Scraper...');
//     const url = `${COLLEGE_BASE_URL}/researchcell.php`;
//     let data;
//     try {
//         const response = await axios.get(url, { httpsAgent });
//         data = response.data;
//     } catch (error) {
//         console.warn(`⚠️ Failed to fetch research cell page: ${error.message}`);
//         return null;
//     }
//     const $ = cheerio.load(data);
    
//     // Attempt to extract all main content from the primary container
//     const content = cleanText($('.container').text());

//     if (content.length > 50) {
//         return {
//             pageContent: content,
//             metadata: {
//                 title: 'Research & Development Cell',
//                 category: 'research',
//                 source: url,
//                 docType: 'html_page'
//             }
//         };
//     }
//     return null;
// }

// // -------------------------------------------------------------------
// // -------------------- 3. SCRAPE PLACEMENT DATA ---------------------
// // -------------------------------------------------------------------

// export async function scrapePlacementData() {
//     console.log('🚀 Starting Placement Data Scraper...');
//     const documents = [];
//     const url = `${COLLEGE_BASE_URL}/nb_placements.php`;
//     let data;
//     try {
//         const response = await axios.get(url, { httpsAgent });
//         data = response.data;
//     } catch (error) {
//         console.warn(`⚠️ Failed to fetch placements data page: ${error.message}`);
//         return [];
//     }
//     const $ = cheerio.load(data);

//     // --- Scrape the main overview text/stats ---
//     const overviewText = cleanText($('.container').text());
//     if (overviewText.length > 100) {
//         documents.push({
//             pageContent: `GMRIT Placement Overview and Statistics: ${overviewText}`,
//             metadata: {
//                 title: 'GMRIT Placement Overview',
//                 category: 'placement_overview',
//                 source: url,
//                 docType: 'html_page'
//             }
//         });
//     }

//     // --- Scrape Placement Records (Links/PDFs) ---
//     $('table tbody tr').each((_, row) => {
//         const linkTag = $(row).find('a');
//         const dateTd = $(row).find('td').last();

//         const title = cleanText(linkTag.text());
//         const link = linkTag.attr('href')?.trim();
//         const date = cleanText(dateTd.text());

//         if (title && link) {
//             const fullLink = new URL(link, COLLEGE_BASE_URL).href;
            
//             // 1. Save the record entry (essential for querying by specific company/year)
//             documents.push({
//                 pageContent: `Placement Record Link: ${title} - Date: ${date}. Direct Link: ${fullLink}`,
//                 metadata: {
//                     title: `Placement Record: ${title}`,
//                     category: 'placement_record',
//                     source: fullLink,
//                     date: date,
//                     docType: 'placement_record_link'
//                 }
//             });

//             // 2. Queue for full text extraction if it's a PDF (as PDFs often contain stats)
//             if (/\.pdf($|\?)/i.test(fullLink)) {
//                  documents.push({
//                     link: fullLink,
//                     title: `Placement Stats: ${title}`,
//                     category: 'placement_stats',
//                     source: url,
//                     date: date,
//                     docType: 'pdf_document'
//                 });
//             }
//         }
//     });

//     console.log(`✅ Scraped ${documents.length} placement documents/links.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 4. SCRAPE DEPARTMENT INFO --------------------
// // -------------------------------------------------------------------

// export async function scrapeDepartment(code) {
//     const url = `${COLLEGE_BASE_URL}/department.php?code=${code}`;
//     console.log(`-- Fetching generic info for department: ${code}`);
//     let data;
//     try {
//         const response = await axios.get(url, { httpsAgent });
//         data = response.data;
//     } catch (error) {
//         console.warn(`⚠️ Failed to fetch department page for ${code}: ${error.message}`);
//         return null;
//     }
//     const $ = cheerio.load(data);
//     const deptName = cleanText($('h1').first().text());
    
//     // Extract main content from the department page
//     const content = cleanText($('.container').text());

//     if (content.length > 100) {
//         return {
//             pageContent: content,
//             metadata: {
//                 title: deptName,
//                 category: 'department_info',
//                 source: url,
//                 docType: 'html_page',
//                 departmentCode: code
//             }
//         };
//     }
//     return null;
// }

// // -------------------------------------------------------------------
// // ------------------ CONSOLIDATING EXPORT FUNCTION ------------------
// // -------------------------------------------------------------------

// export async function scrapeCollegeInfo() {
//     console.log(`\n======================================================`);
//     console.log(`| STARTING ALL GENERAL COLLEGE INFO SCRAPERS |`);
//     console.log(`======================================================`);

//     const documents = [];

//     const about = await scrapeAboutPage();
//     documents.push(...about);

//     const research = await scrapeResearchCell();
//     if (research) documents.push(research);

//     const placementsData = await scrapePlacementData();
//     documents.push(...placementsData);

//     const departments = await Promise.all(['cse', 'it', 'ece', 'eee', 'mech'].map(scrapeDepartment));
//     documents.push(...departments.filter(Boolean));
//     const contactInfo = await scrapeContactInfo();
//     documents.push(...contactInfo);
//     console.log(`\n======================================================`);
//     console.log(`✅ FINAL TOTAL: Scraped general college info: ${documents.length} documents.`);
//     console.log(`======================================================`);
//     return documents;
// }


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
