import axios from "axios";
import * as cheerio from "cheerio";
import { httpsAgent, cleanText, fetchUrlContent } from "../utils/util.js";

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';
export const allDepts = ['cse', 'ece', 'eee', 'civil', 'mech', 'it', 'aiml', 'aids', 'bsh', 'admin', 'hod'];

export async function scrapeFaculty(dept = "admin") {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/facultydirectory.php?dept=${dept}`;

    const { data: directoryHtml, contentType } = await fetchUrlContent(url);
    if (!directoryHtml || !contentType.includes('text/html')) {
        console.warn(`⚠️ Failed to fetch faculty directory for ${dept}.`);
        return [];
    }

    const $ = cheerio.load(directoryHtml);
    const facultyProfiles = $(".faculty_profile_box").map((i, el) => {
        const name = cleanText($(el).find(".name_details h4").text());
        const designation = cleanText($(el).find(".name_details p").map((j, p) => $(p).text()).get().join(' '));
        const profileLink = $(el).find(".more_details a").attr("href");
        const profileUrl = profileLink ? new URL(profileLink, COLLEGE_BASE_URL).href : null;
        
        return { name, designation, profileUrl, dept };
    }).get();

    for (const item of facultyProfiles) {
        if (!item.profileUrl) {
            console.warn(`⚠️ Skipping faculty member ${item.name} due to missing profile URL.`);
            continue;
        }

        const { data: profileHtml, contentType: profileContentType } = await fetchUrlContent(item.profileUrl);
        if (!profileHtml || !profileContentType.includes('text/html')) {
            console.warn(`⚠️ Failed to fetch profile for ${item.name}.`);
            continue;
        }
        
        const $$ = cheerio.load(profileHtml);
        const academicProfileText = cleanText($$('h4:contains("Academic Profile")').closest('div').text());
        const professionalExperienceText = cleanText($$('h4:contains("Professional Experience")').closest('div').text());
        
        const fullContent = `
            Name: ${item.name}
            Designation: ${item.designation}
            Department: ${item.dept}
            Academic Profile: ${academicProfileText}
            Professional Experience: ${professionalExperienceText}
        `.trim();

        if (fullContent.length > 50) {
            documents.push({
                pageContent: fullContent,
                metadata: {
                    title: item.name,
                    category: `faculty_${item.dept}`,
                    source: item.profileUrl,
                    docType: 'faculty_profile_detailed',
                    name: item.name,
                    designation: item.designation,
                    department: item.dept,
                },
            });
        }
    }

    console.log(`✅ Scraped ${documents.length} detailed faculty profiles from ${dept}`);
    return documents;
}

// // Consolidating function, if needed
// export async function scrapeAllFaculty() {
//     const documents = [];
//     for (const dept of allDepts) {
//         const facultyDocs = await scrapeFaculty(dept);
//         documents.push(...facultyDocs);
//     }
//     return documents;
// }



// import { fetchUrlContent, cleanText } from '../utils/util.js';
// import * as cheerio from 'cheerio';

// const IRINS_BASE_URL = 'https://gmrit.irins.org';
// const FACULTY_LIST_URL = 'https://gmrit.irins.org/faculty'; // The general faculty directory page

// // -------------------------------------------------------------------
// // ----------------- Core Faculty Detail Scraper ---------------------
// // -------------------------------------------------------------------

// /**
//  * Scrapes detailed information from an individual faculty profile link.
//  * @param {string} profileUrl - The full URL of the faculty member's profile page (e.g., https://gmrit.irins.org/profile/284410).
//  * @param {string} department - The name of the faculty member's department.
//  * @returns {Promise<Array<Object>>} - An array of structured documents for the faculty member.
//  */
// async function scrapeFacultyProfile(profileUrl, department) {
//     const documents = [];
//     console.log(`-- Scraping detailed profile: ${profileUrl}`);
//     const { data: htmlData } = await fetchUrlContent(profileUrl);

//     if (!htmlData) {
//         console.warn(`⚠️ Failed to fetch profile data for ${profileUrl}`);
//         return [];
//     }
//     const $ = cheerio.load(htmlData);

//     // Try to find name and designation accurately
//     const facultyName = cleanText($('.profile-title h2').text());
//     let designation = cleanText($('i.fa-building-o').parent().text()).replace(facultyName, '').trim();
    
//     // Fallback: If designation includes the name (a common cleaning issue), try to refine it.
//     if (designation.includes(facultyName)) {
//          designation = cleanText($('i.fa-building-o').parent().clone().children().remove().end().text()).trim();
//     }


//     // 1. Extract General Profile Info (Name, Designation, Department, Link)
//     const categoryBase = `faculty_${department.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

//     documents.push({
//         pageContent: `Faculty Name: ${facultyName}, Designation: ${designation}, Department: ${department}. Full Research Profile Link: ${profileUrl}`,
//         metadata: {
//             title: `${facultyName} - General Profile`,
//             category: categoryBase,
//             source: profileUrl,
//             docType: 'faculty_general_info'
//         }
//     });

//     // 2. Extract Expertise Information (e.g., Research Area)
//     const expertiseContent = cleanText($('#expertise_information_panel .profile-body').text());
//     if (expertiseContent.length > 50) {
//         documents.push({
//             pageContent: `${facultyName} Expertise/Research Interests: ${expertiseContent}`,
//             metadata: {
//                 title: `${facultyName} - Expertise`,
//                 category: `${categoryBase}_expertise`,
//                 source: profileUrl + '#expertise_information_panel',
//                 docType: 'faculty_expertise'
//             }
//         });
//     }

//     // 3. Extract Publications/Scholarly Data
//     const publications = [];
//     // Iterate over publication titles/snippets
//     $('#publications_information_panel .profile-body .publication-text').each((i, el) => {
//         const pubTitle = cleanText($(el).find('span').first().text());
//         const pubDetails = cleanText($(el).text()).replace(pubTitle, '').trim();
//         if (pubTitle) publications.push(`${pubTitle}: ${pubDetails}`);
//     });

//     if (publications.length > 0) {
//         documents.push({
//             pageContent: `${facultyName} Publications Summary (${publications.length} found): Top publications include: ${publications.slice(0, 5).join('; ')}... (full list at link)`,
//             metadata: {
//                 title: `${facultyName} - Publications Summary`,
//                 category: `${categoryBase}_publications`,
//                 source: profileUrl + '#publications_information_panel',
//                 docType: 'faculty_publications_summary'
//             }
//         });
//     }

//     // 4. Extract Experience (Employment History)
//     const experienceContent = cleanText($('#experience_information_panel .profile-body').text());
//     if (experienceContent.length > 50) {
//         documents.push({
//             pageContent: `${facultyName} Employment History and Experience: ${experienceContent}`,
//             metadata: {
//                 title: `${facultyName} - Experience`,
//                 category: `${categoryBase}_experience`,
//                 source: profileUrl + '#experience_information_panel',
//                 docType: 'faculty_experience'
//             }
//         });
//     }
    
//     return documents;
// }

// // -------------------------------------------------------------------
// // ----------------- Department Faculty List Scraper -----------------
// // -------------------------------------------------------------------

// /**
//  * Scrapes all faculty members from a single department's IRINS page.
//  * @param {string} deptUrl - The URL for the department's faculty list.
//  * @param {string} departmentName - Clean name of the department.
//  * @returns {Promise<Array<Object>>} - Array of documents for all faculty in the department.
//  */
// async function scrapeDepartmentFaculties(deptUrl, departmentName) {
//     const departmentDocuments = [];
//     console.log(`\n-- Fetching faculty list for: ${departmentName} from ${deptUrl}`);
//     const { data: htmlData } = await fetchUrlContent(deptUrl);

//     if (!htmlData) {
//         console.warn(`⚠️ Failed to fetch department faculty list for ${departmentName}: ${deptUrl}`);
//         return [];
//     }
//     const $ = cheerio.load(htmlData);

//     const facultyProfileLinks = [];

//     // Targetting the link inside the 'View Profile' button, which holds the profile URL.
//     // The link structure is within a container class.
//     $('.cbp-item-wrap a[href*="/profile/"]').each((i, el) => {
//         const link = $(el).attr('href');
//         // Ensure we only process unique links leading to a profile
//         if (link && link.includes('/profile/') && !facultyProfileLinks.includes(link)) {
//             const absoluteLink = new URL(link, IRINS_BASE_URL).href;
//             facultyProfileLinks.push(absoluteLink);
//         }
//     });

//     console.log(`-- Found ${facultyProfileLinks.length} profiles in ${departmentName}.`);
    
//     // Process each faculty profile sequentially 
//     for (const profileLink of facultyProfileLinks) {
//         const profileDocs = await scrapeFacultyProfile(profileLink, departmentName);
//         departmentDocuments.push(...profileDocs);
//     }
    
//     return departmentDocuments;
// }

// // -------------------------------------------------------------------
// // ----------------- Main Entry Point --------------------------------
// // -------------------------------------------------------------------

// /**
//  * Orchestrates the scraping of all faculty research profiles from all departments.
//  */
// export async function scrapeAllFaculty() {
//     console.log(`\n======================================================`);
//     console.log(`🚀 Starting Faculty Research Profile Scraper from IRINS...`);
//     console.log(`======================================================`);

//     const documents = [];
//     const { data: mainHtml } = await fetchUrlContent(FACULTY_LIST_URL);
//     if (!mainHtml) {
//         console.error(`❌ FATAL: Could not fetch the main IRINS faculty page: ${FACULTY_LIST_URL}`);
//         return [];
//     }
//     const $ = cheerio.load(mainHtml);

//     // Get all department links from the left sidebar
//     // Targetting the 'list-group-item list-toggle a[href*="/faculty/index/Department"]' elements based on the screenshot.
//     const departmentLinks = $('li.list-group-item.list-toggle a[href*="/faculty/index/Department"]');

//     const departmentTasks = [];

//     departmentLinks.each((i, el) => {
//         const link = $(el).attr('href');
//         // Remove faculty count (e.g., (27)) from the department name
//         const name = cleanText($(el).text()).replace(/\(\d+\)/g, '').trim(); 
//         if (link && name) {
//             const absoluteLink = new URL(link, IRINS_BASE_URL).href;
//             departmentTasks.push({ url: absoluteLink, name });
//         }
//     });

//     console.log(`Found ${departmentTasks.length} departments to process: ${departmentTasks.map(d => d.name).join(', ')}`);

//     // Process each department one by one
//     for (const dept of departmentTasks) {
//         const deptDocs = await scrapeDepartmentFaculties(dept.url, dept.name);
//         documents.push(...deptDocs);
//     }

//     console.log(`\n======================================================`);
//     console.log(`✅ FINAL TOTAL: Scraped ${documents.length} faculty profile documents.`);
//     console.log(`======================================================`);
//     return documents;
// }
