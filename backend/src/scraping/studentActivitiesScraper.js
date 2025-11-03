import { fetchUrlContent, cleanText, extractTextFromPdf } from '../utils/util.js';
import * as cheerio from 'cheerio';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

// Helper function to scrape a specific club or professional body page
async function scrapeClubOrBodyPage(url, category, title) {
    const documents = [];
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${title} page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    // Extract Overview/Mission
    const overviewText = cleanText($('div.col-md-8 p').first().text());
    if (overviewText.length > 50) {
        documents.push({
            pageContent: `Overview of ${title}: ${overviewText}`,
            metadata: {
                title: `${title} Overview`,
                category: category,
                source: url,
                docType: 'html_page_section'
            }
        });
    }
    
    // Extract Objectives (from list items)
    const objectivesText = $('h5:contains("Objectives")').next('ul').find('li').map((i, el) => cleanText($(el).text())).get().join('; ');
    if (objectivesText) {
        documents.push({
            pageContent: `${title} Objectives: ${objectivesText}`,
            metadata: {
                title: `${title} Objectives`,
                category: category,
                source: url,
                docType: 'html_page_section'
            }
        });
    }

    // Extract Coordinators from tables
    const coordinators = [];
    $('h5:contains("Coordinators")').next('div').find('table tbody tr').each((i, el) => {
        const role = cleanText($(el).find('td:nth-child(1)').text());
        const name = cleanText($(el).find('td:nth-child(2)').text());
        const email = cleanText($(el).find('td:nth-child(3)').text());
        if (role && name) {
            coordinators.push(`Role: ${role}, Name: ${name}, Email: ${email}`);
        }
    });

    if (coordinators.length > 0) {
        documents.push({
            pageContent: `${title} Coordinators: ${coordinators.join('; ')}`,
            metadata: {
                title: `${title} Coordinators`,
                category: category,
                source: url,
                docType: 'html_table_content'
            }
        });
    }
    
    console.log(`✅ Scraped detailed info for ${title}.`);
    return documents;
}

// Helper to scrape a generic HTML page.
async function scrapeGenericHtmlPage(url, category, title) {
    const documents = [];
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    const mainContent = cleanText($('.container').text());
    if (mainContent.length > 50) {
        documents.push({
            pageContent: `General Information: ${mainContent}`,
            metadata: {
                title: title,
                category: category,
                source: url,
                docType: 'html_page'
            }
        });
    }
    console.log(`✅ Scraped generic HTML page.`);
    return documents;
}

async function createPdfDocument(url, title, category) {
    const { data: pdfBuffer, contentType } = await fetchUrlContent(url);
    if (!pdfBuffer || !contentType.includes('application/pdf')) {
        console.warn(`⚠️ Could not fetch or parse PDF from ${url}`);
        return null;
    }
    const textContent = await extractTextFromPdf(pdfBuffer);
    if (!textContent || textContent.length < 50) {
        console.warn(`❗ No substantial text extracted from PDF: ${url}`);
        return null;
    }

    return {
        link: url,
        title: title,
        type: 'pdf_link',
        category: category,
        pageContent: textContent,
        metadata: {
            title: title,
            category: category,
            source: url,
            docType: 'pdf_document'
        }
    };
}

export async function scrapeHostels() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/hostels.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for hostel page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    const mainContent = cleanText($('.container').text());
    if (mainContent.length > 50) {
        documents.push({
            pageContent: `Hostel Information: ${mainContent}`,
            metadata: {
                title: 'Hostel Facilities and Information',
                category: 'hostel_info',
                source: url,
                docType: 'html_page'
            }
        });
    }
    console.log(`✅ Scraped hostel information.`);
    return documents;
}

export async function scrapeTechMag() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/techmag.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    const mainContent = cleanText($('.container').text());
    if (mainContent) {
        documents.push({
            pageContent: mainContent,
            metadata: {
                title: 'Tech Magazine Overview',
                category: 'tech_magazine',
                source: url,
                docType: 'html_page_overview'
            }
        });
    }

    $('a[href$=".pdf"]').each((i, el) => {
        const link = $(el).attr('href');
        const title = cleanText($(el).text()) || `Tech Magazine Issue ${i+1}`;
        if (link) {
            const absoluteLink = new URL(link, url).href;
            documents.push({
                link: absoluteLink,
                title: `Tech Magazine: ${title}`,
                type: 'pdf_link',
                category: 'tech_magazine_issue',
                sourceUrl: url
            });
        }
    });
    console.log(`✅ Scraped TechMag info: ${documents.length} items.`);
    return documents;
}

export async function scrapeStudentCouncil() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/studentActivities/studentcouncil.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for student council page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    const mainContent = cleanText($('.container').text());
    if (mainContent) {
        documents.push({
            pageContent: mainContent,
            metadata: {
                title: 'Student Council',
                category: 'student_council',
                source: url,
                docType: 'html_page'
            }
        });
    }
    console.log(`✅ Scraped student council information.`);
    return documents;
}

export async function scrapeITPolicyForStudents() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/PDFs/student_activities/it_policy_for_students.pdf`;
    const pdfDocument = await createPdfDocument(url, 'IT Policy for Students', 'student_policy');
    if (pdfDocument) documents.push(pdfDocument);
    return documents;
}

export async function scrapeStudentIncentives() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/documents/student_incentives.pdf`;
    const pdfDocument = await createPdfDocument(url, 'Student Incentives', 'student_incentives');
    if (pdfDocument) documents.push(pdfDocument);
    return documents;
}

export async function scrapeCommunityRadio() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/studentActivities/communityRadio.php?type=Extension_Activities`, 'nss_extension_activities', 'Community Radio');
}


// New scraper to get the list of professional bodies and then scrape each one
export async function scrapeProfessionalBodies() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/studentActivities/studentActivityPage.php?type=Professional_Bodies`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for professional bodies page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    const professionalBodyLinks = $('a[href*="studentActivities/csi.php"], a[href*="studentActivities/iste.php"]').get();
    
    for (const el of professionalBodyLinks) {
        const link = $(el).attr('href');
        const title = cleanText($(el).text());
        if (link && title) {
            const absoluteLink = new URL(link, url).href;
            const bodyDocs = await scrapeClubOrBodyPage(absoluteLink, 'professional_bodies', title);
            documents.push(...bodyDocs);
        }
    }
    return documents;
}

// New scraper to get the list of student clubs and then scrape each one
export async function scrapeStudentClubs() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/studentActivities/studentActivityPage.php?type=Student_Clubs`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for student clubs page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    const studentClubLinks = $('a[href*="studentActivities/womenEmpowermentClub.php"], a[href*="studentActivities/codingClub.php"]').get();

    for (const el of studentClubLinks) {
        const link = $(el).attr('href');
        const title = cleanText($(el).text());
        if (link && title) {
            const absoluteLink = new URL(link, url).href;
            const clubDocs = await scrapeClubOrBodyPage(absoluteLink, 'student_clubs', title);
            documents.push(...clubDocs);
        }
    }
    return documents;
}


// Consolidate all new scrapers
export async function scrapeAllStudentRelatedInfo() {
    const documents = [];

    const hostels = await scrapeHostels();
    documents.push(...hostels);

    const techMagItems = await scrapeTechMag();
    documents.push(...techMagItems);

    const studentCouncil = await scrapeStudentCouncil();
    documents.push(...studentCouncil);
    
    // Scrape all professional bodies in detail
    const professionalBodies = await scrapeProfessionalBodies();
    documents.push(...professionalBodies);

    // Scrape all student clubs in detail
    const studentClubs = await scrapeStudentClubs();
    documents.push(...studentClubs);

    const itPolicy = await scrapeITPolicyForStudents();
    documents.push(...itPolicy);

    const studentIncentives = await scrapeStudentIncentives();
    documents.push(...studentIncentives);

    const communityRadio = await scrapeCommunityRadio();
    documents.push(...communityRadio);

    console.log(`✅ Scraped student-related information: ${documents.length} documents.`);
    return documents;
}









// import { fetchUrlContent, cleanText, extractTextFromPdf } from '../utils/util.js';
// import * as cheerio from 'cheerio';

// const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

// // -------------------------------------------------------------------
// // ----------------- Core PDF/Link Helper Function -------------------
// // -------------------------------------------------------------------

// /**
//  * Creates a structured document object from a PDF URL, including full text extraction.
//  * It always returns two documents: one for the full text, and one for the link itself.
//  * @param {string} url - Absolute URL of the PDF.
//  * @param {string} title - Human-readable title.
//  * @param {string} category - Category for intent classification (e.g., 'AR_UG_2023').
//  * @returns {Promise<Array<Object>>} - An array of document objects (content + link).
//  */
// async function createPdfDocuments(url, title, category) {
//     const documents = [];

//     // 1. Fetch PDF content and attempt text extraction
//     const { data: pdfBuffer, contentType } = await fetchUrlContent(url);
//     if (!pdfBuffer || !contentType.includes('application/pdf')) {
//         console.warn(`⚠️ Could not fetch or parse PDF from ${url}`);
//         return [];
//     }
    
//     const textContent = await extractTextFromPdf(pdfBuffer);
    
//     if (textContent && textContent.length > 50) {
//         // DOCUMENT 1: The full content for RAG
//         documents.push({
//             pageContent: textContent,
//             metadata: {
//                 title: title,
//                 category: category,
//                 source: url,
//                 docType: 'pdf_document'
//             }
//         });
//     } else {
//         console.warn(`❗ No substantial text extracted from PDF: ${url}`);
//     }

//     // DOCUMENT 2: A small document to ensure the link is saved and searchable
//     // This chunk is essential for the bot to provide the PDF link when asked.
//     documents.push({
//         pageContent: `Official Document Link: ${title} can be downloaded from this URL: ${url}`,
//         metadata: {
//             title: `${title} Link`,
//             category: category,
//             source: url,
//             docType: 'pdf_link'
//         }
//     });

//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 1. ACADEMIC REGULATIONS SCRAPER --------------------
// // -------------------------------------------------------------------

// export async function scrapeAcademicRegulations() {
//     console.log('🚀 Starting Academic Regulations Scraper...');
//     const documents = [];
//     const url = `${COLLEGE_BASE_URL}/academic_regulations.php`;
//     const { data, contentType } = await fetchUrlContent(url);
//     if (!data || !contentType.includes('text/html')) {
//         console.warn(`⚠️ Could not fetch or parse HTML for regulations page: ${url}`);
//         return [];
//     }
//     const $ = cheerio.load(data);

//     // Target the specific section that contains the list of regulations links
//     // Based on the screenshot, they are typically in a primary content column.
//     const regulationsContainer = $('div.container').find('a[href*="/examination/doc/Autonomy_Regulations_"]').get();

//     const fetchTasks = [];

//     for (const el of regulationsContainer) {
//         const link = $(el).attr('href');
//         const title = cleanText($(el).text()); 
        
//         if (link && title) {
//             const absoluteLink = new URL(link, COLLEGE_BASE_URL).href;
            
//             // Generate a clean category for intent classification (e.g., AR_UG_2023, AR_PG_2021)
//             let category;
//             const yearMatch = title.match(/\((\d{4})\)/);
//             const programType = title.includes('UG') ? 'UG' : title.includes('PG') ? 'PG' : 'Misc';
//             const year = yearMatch ? yearMatch[1] : 'Unknown';
//             category = `academic_regulation_${programType}_${year}`;

//             fetchTasks.push(createPdfDocuments(absoluteLink, title, category));
//         }
//     }

//     const results = await Promise.all(fetchTasks);
//     results.forEach(pdfDocs => documents.push(...pdfDocs));

//     console.log(`✅ Scraped and processed Academic Regulations: ${documents.length} documents.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 2. SYLLABI SCRAPER ---------------------------
// // -------------------------------------------------------------------

// export async function scrapeSyllabi() {
//     console.log('🚀 Starting Syllabi Scraper...');
//     const syllabusLinks = [
//         { dept: 'cse', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_CSE_Syllabus_AR23.pdf' },
//         { dept: 'cse', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_CSE_Syllabus_AR21.pdf' },
//         { dept: 'it', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_IT_Syllabus_AR23.pdf' },
//         { dept: 'it', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/Open_Electives_Syllabus_AR21.pdf', titleOverride: 'B.Tech IT/Open Electives Syllabus (AR21)' },
//         { dept: 'aids', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_AIDS_Syllabus_AR23.pdf' },
//         { dept: 'aids', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_AIDS_Syllabus_AR21.pdf' },
//         { dept: 'aiml', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_AIML_Syllabus_AR23.pdf' },
//         { dept: 'aiml', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_AIML_Syllabus_AR21.pdf' },
//         { dept: 'eee', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_EEE_Syllabus_AR23.pdf' },
//         { dept: 'eee', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_EEE_Syllabus_AR21.pdf' },
//         { dept: 'civil', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_Civil_Syllabus_AR23.pdf' },
//         { dept: 'civil', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_Civil_Syllabus_AR21.pdf' },
//         { dept: 'ece', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_ECE_Syllabus_AR23.pdf' },
//         { dept: 'ece', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_ECE_Syllabus_AR21.pdf' },
//         { dept: 'mechanical', ar: 'AR23', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_Mech_Syllabus_AR23.pdf' },
//         { dept: 'mechanical', ar: 'AR21', url: 'https://gmrit.edu.in/PDFs/curriculum/B.Tech_Mech_Syllabus_AR21.pdf' },
//         { dept: 'minors', ar: 'AR20', url: 'https://gmrit.edu.in/PDFs/curriculum/Minor_courses_AR20.pdf' },
//     ];

//     const documents = [];
//     const fetchTasks = [];

//     for (const { dept, ar, url, titleOverride } of syllabusLinks) {
//         const title = titleOverride || `B.Tech Syllabus - ${dept.toUpperCase()} (${ar})`;
//         const category = `syllabus_${dept}_${ar.toLowerCase()}`;
//         fetchTasks.push(createPdfDocuments(url, title, category));
//     }

//     const results = await Promise.all(fetchTasks);
//     results.forEach(pdfDocs => documents.push(...pdfDocs));

//     console.log(`✅ Scraped and processed Syllabi: ${documents.length} documents.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 3 & 4. MISC DOCS SCRAPER ---------------------
// // -------------------------------------------------------------------

// export async function scrapeMiscStudentDocs() {
//     console.log('🚀 Starting Miscellaneous Student Docs Scraper (Holidays & Payments)...');
//     const documents = [];
    
//     // 1. List of Holidays (PDF)
//     const holidaysUrl = 'https://gmrit.edu.in/examination/calendars/List%20of%20Holidays%202025.pdf';
//     const holidaysDocs = await createPdfDocuments(holidaysUrl, 'List of Holidays 2025', 'academic_calendar_holidays');
//     documents.push(...holidaysDocs);

//     // 2. Online Payments (HTML)
//     const paymentsUrl = 'https://gmrit.edu.in/payments/';
//     const { data: htmlData } = await fetchUrlContent(paymentsUrl);
    
//     if (htmlData) {
//         const $ = cheerio.load(htmlData);
//         // Scrape the main content (assuming payments info is in a main text block)
//         const mainContent = cleanText($('.container').text());
        
//         documents.push({
//             pageContent: `Online Payment Information: ${mainContent}. The direct payment portal is at ${paymentsUrl}`,
//             metadata: {
//                 title: 'Online Payment Portal',
//                 category: 'fee_payment',
//                 source: paymentsUrl,
//                 docType: 'html_page_info'
//             }
//         });
//     }

//     console.log(`✅ Scraped miscellaneous documents: ${documents.length} documents.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // ------------------ CONSOLIDATED EXPORT FUNCTION -------------------
// // -------------------------------------------------------------------

// export async function scrapeAllStudentRelatedInfo() {
//     const documents = [];
    
//     // Scrape Academic Regulations
//     const academicRegulations = await scrapeAcademicRegulations();
//     documents.push(...academicRegulations);
    
//     // Scrape Syllabi
//     const syllabi = await scrapeSyllabi();
//     documents.push(...syllabi);
    
//     // Scrape Holidays and Payments
//     const miscDocs = await scrapeMiscStudentDocs();
//     documents.push(...miscDocs);
    
//     console.log(`\n======================================================`);
//     console.log(`✅ FINAL TOTAL: Scraped ${documents.length} CORE student documents.`);
//     console.log(`======================================================`);
//     return documents;
// }

