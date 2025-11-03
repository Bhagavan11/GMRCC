import * as cheerio from 'cheerio';
import { fetchUrlContent, cleanText } from '../utils/util.js';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';
const STUDENT_ACTIVITIES_BASE_URL = `${COLLEGE_BASE_URL}/studentActivities/`;

// Helper to scrape a generic club or body page (like csi.php)
async function scrapeClubOrBodyPage(url, bodyName, categoryPrefix) {
    const documents = [];
    console.log(`-- Scraping detailed page for: ${bodyName}`);
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${bodyName} page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    // --- 1. Overview and Objectives ---
    const overviewContent = cleanText($('h2:contains("Overview")').next('p, div').text() || $('h1:contains("Overview")').next('p, div').text());
    const objectivesList = $('h3:contains("Objectives")').next('ul').find('li').map((i, el) => cleanText($(el).text())).get();
    
    if (overviewContent.length > 50 || objectivesList.length > 0) {
        documents.push({
            pageContent: `${bodyName} Overview: ${overviewContent}. Objectives: ${objectivesList.join('; ')}`,
            metadata: {
                title: `${bodyName} Overview & Objectives`,
                category: `${categoryPrefix}_overview`,
                source: url,
                docType: 'html_page_section'
            }
        });
    }

    // --- 2. Faculty Coordinator Details ---
    const facultyCoordinators = [];
    // Target the specific section that holds the faculty coordinator details
    $('h3:contains("Faculty Coordinators")').nextUntil('h3').each((i, el) => {
        const name = cleanText($(el).find('p:contains("Name")').text().split(':')[1]);
        const mail = cleanText($(el).find('p:contains("Mail")').text().split(':')[1]);
        const mobile = cleanText($(el).find('p:contains("Mobile")').text().split(':')[1]);
        if (name) facultyCoordinators.push(`Name: ${name}, Email: ${mail}, Mobile: ${mobile}`);
    });
    
    // Fallback if details are in a different container (used in image_a5a067.jpg for text block)
    if (facultyCoordinators.length === 0) {
        const facultySection = $('h3:contains("Faculty Coordinators")').next('div.row, div.col-md-6').text();
        if (facultySection) {
             facultyCoordinators.push(cleanText(facultySection));
        }
    }


    if (facultyCoordinators.length > 0) {
        documents.push({
            pageContent: `${bodyName} Faculty Coordinators: ${facultyCoordinators.join(' | ')}`,
            metadata: {
                title: `${bodyName} Faculty Contacts`,
                category: `${categoryPrefix}_faculty_contacts`,
                source: url,
                docType: 'contact_information'
            }
        });
    }

    // --- 3. Student Coordinators Details (Table extraction - handling JNTU number mismatch) ---
    const studentCoordinators = [];
    const studentTable = $('h3:contains("Student Coordinators")').next('table').find('tbody tr');
    
    studentTable.each((i, el) => {
        const columns = $(el).find('td').map((_, td) => cleanText($(td).text())).get();
        // Assuming table columns are: [SL No, JNTU Number, Name, Mail] or similar
        // Based on screenshot, columns[1] is JNTU Number/Name, columns[2] is Mail/JNTU Number
        // We will prioritize columns[2] for name and columns[3] for mail for safety, or use columns[1] and columns[2]
        
        // Robust extraction based on typical table structure
        const jntuNum = columns.length > 1 ? columns[1] : '';
        const name = columns.length > 2 ? columns[2] : jntuNum; 
        const mail = columns.length > 3 ? columns[3] : ''; 
        
        if (name && mail) {
            // Note: We use the most reliable text for name and email, and log the possible JNTU number
            studentCoordinators.push(`Name: ${name}, JNTU/Roll: ${jntuNum}, Email: ${mail}`);
        } else if (columns.length > 0) {
            // Fallback for messy data
             studentCoordinators.push(columns.join(', '));
        }
    });

    if (studentCoordinators.length > 0) {
        documents.push({
            pageContent: `${bodyName} Student Coordinators/Team: ${studentCoordinators.join(' | ')}`,
            metadata: {
                title: `${bodyName} Student Contacts`,
                category: `${categoryPrefix}_student_contacts`,
                source: url,
                docType: 'contact_information'
            }
        });
    }

    // --- 4. List of Events ---
    const eventLinks = [];
    $('h3:contains("List of Events")').next('table').find('tbody tr').each((i, el) => {
        const linkTag = $(el).find('a').first();
        const link = linkTag.attr('href');
        const title = cleanText(linkTag.text());
        const date = cleanText($(el).find('td').last().text());
        
        if (link && title) {
            const absoluteLink = new URL(link, url).href;
            eventLinks.push(`Event: ${title}, Year: ${date}, Link: ${absoluteLink}`);
        }
    });

    if (eventLinks.length > 0) {
        documents.push({
            pageContent: `${bodyName} Recent Events: ${eventLinks.join('; ')}`,
            metadata: {
                title: `${bodyName} Event History`,
                category: `${categoryPrefix}_events`,
                source: url,
                docType: 'event_history'
            }
        });
    }
    
    return documents;
}

// -------------------------------------------------------------------
// -------------------- 1. Student Activities Overview ----------------
// -------------------------------------------------------------------

export async function scrapeActivitiesOverview() {
    console.log('🚀 Starting Student Activities Overview Scraper...');
    const documents = [];
    const url = `${STUDENT_ACTIVITIES_BASE_URL}index.php`;
    const { data } = await fetchUrlContent(url);
    if (!data) return [];
    
    const $ = cheerio.load(data);
    
    // Target the primary text area (based on image_a602d7.jpg)
    const overviewSection = cleanText($('div.col-md-9').first().text());
    
    if (overviewSection.length > 100) {
        documents.push({
            pageContent: `Student Activities Overview: ${overviewSection}`,
            metadata: {
                title: 'Student Activities Overview',
                category: 'student_activities_overview',
                source: url,
                docType: 'html_page_overview'
            }
        });
    }
    return documents;
}

// -------------------------------------------------------------------
// -------------------- 2. Student Council Details -------------------
// -------------------------------------------------------------------

export async function scrapeStudentCouncil() {
    console.log('🚀 Starting Student Council Scraper...');
    const documents = [];
    const url = `${STUDENT_ACTIVITIES_BASE_URL}studentcouncil.php`;
    const { data } = await fetchUrlContent(url);
    if (!data) return [];

    const $ = cheerio.load(data);
    
    const councilMembers = [];
    // Target the main table containing council members (based on image_a5ff53.jpg)
    $('#studentcouncil table tbody tr').each((i, el) => {
        const columns = $(el).find('td').map((_, td) => cleanText($(td).text())).get();
        // Assuming columns: [SL.NO, NAME, YEAR/BRANCH/JNTU NO, PHONE]
        
        const role = columns[0] || 'Member'; // First column might be role (President, VP, etc.)
        const name = columns[1] || '';
        const details = columns[2] || ''; // Contains Year/Branch/JNTU No.
        const phone = columns[3] || '';

        if (name) {
            councilMembers.push(`Role: ${role}, Name: ${name}, Details: ${details}, Phone: ${phone}`);
        }
    });

    if (councilMembers.length > 0) {
        documents.push({
            pageContent: `GMRIT Student Council Members: ${councilMembers.join(' | ')}`,
            metadata: {
                title: 'Student Council Contacts & Roles',
                category: 'student_council_contacts',
                source: url,
                docType: 'contact_information'
            }
        });
    }
    return documents;
}

// -------------------------------------------------------------------
// ---------------- 3. Professional Bodies and Clubs -----------------
// -------------------------------------------------------------------

// General function to scrape all professional bodies/clubs from their listing pages
async function scrapeAllListedBodies(listingType, categoryBaseUrl) {
    const documents = [];
    const url = `${STUDENT_ACTIVITIES_BASE_URL}studentActivityPage.php?type=${listingType}`;
    console.log(`🚀 Starting Scraper for listed bodies: ${listingType}`);

    const { data } = await fetchUrlContent(url);
    if (!data) return [];
    const $ = cheerio.load(data);
    
    const bodyLinks = [];
    // Target all 'Visit' buttons/links inside the card layout (based on image_a5fb34.jpg)
    $('div.card-body a:contains("Visit"), div.card-body a:contains("Know More")').each((i, el) => {
        const link = $(el).attr('href');
        const name = cleanText($(el).closest('.card-body').find('.card-title').text());
        if (link && name) {
            const absoluteLink = new URL(link, url).href;
            bodyLinks.push({ url: absoluteLink, name: name.trim() });
        }
    });
    
    // Process each detailed page
    for (const body of bodyLinks) {
        const bodyDocs = await scrapeClubOrBodyPage(body.url, body.name, categoryBaseUrl);
        documents.push(...bodyDocs);
    }

    return documents;
}

export async function scrapeProfessionalBodies() {
    return scrapeAllListedBodies('Professional_Bodies', 'professional_body');
}

export async function scrapeStudentClubs() {
    return scrapeAllListedBodies('Student_Clubs', 'student_club');
}

// -------------------------------------------------------------------
// ------------------ CONSOLIDATED EXPORT FUNCTION -------------------
// -------------------------------------------------------------------

export async function scrapeStudentBodiesInfo() {
    const documents = [];
    
    documents.push(...await scrapeActivitiesOverview());
    documents.push(...await scrapeStudentCouncil());
    documents.push(...await scrapeProfessionalBodies());
    documents.push(...await scrapeStudentClubs()); // Assuming you also want student clubs

    console.log(`\n======================================================`);
    console.log(`✅ FINAL TOTAL: Scraped ${documents.length} Student Activities documents.`);
    console.log(`======================================================`);
    return documents;
}
// ```

// ---

// ### **Integration Instructions for `src/scraper.js`**

// To integrate this new file into your main data flow, follow these two steps in your `src/scraper.js` file:

// **1. Update the Import Statement:**

// Replace the existing line:

// ```javascript
// import { scrapeAllStudentRelatedInfo } from './scraping/studentActivitiesScraper.js';
// ```

// With the new, more clearly named export from the new file:

// ```javascript
// import { scrapeAllStudentActivitiesInfo } from './scraping/studentActivitiesScraper.js'; 
// ```
// *(Note: I kept the file path the same since you named the file in the request as `studentActivitiesScraper.js` earlier, but I renamed the export to be precise.)*

// **2. Update the Function Call:**

// In the `startScraping` function, find the section for Student Activities and replace the old function call with the new one:

// ```javascript
// // OLD CALL:
// // const studentRelatedInfoDocs = await scrapeAllStudentRelatedInfo();

// // NEW CALL:
// const studentRelatedInfoDocs = await scrapeAllStudentActivitiesInfo();
