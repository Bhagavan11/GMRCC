import axios from 'axios';
import * as cheerio from 'cheerio';
import { httpsAgent, cleanText, extractTextFromPdf, fetchUrlContent } from '../utils/util.js';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

function sanitizeHref(href) {
    if (!href) return href;
    let s = href.trim();
    s = s.replace(/^httpss:\/\//i, 'https://');
    s = s.replace(/gmrit\.eedu\.in/gi, 'gmrit.edu.in');
    s = s.replace(/ggmrit\.edu\.in/gi, 'gmrit.edu.in');
    s = s.replace(/gmriit\.edu\.in/gi, 'gmrit.edu.in');
    s = s.replace(/localhosst/gi, 'localhost');
    return s;
}

function buildAbsolute(href, base) {
    try {
        const s = sanitizeHref(href);
        const u = new URL(s, base);
        return u.href;
    } catch (_) { return null; }
}

// Helper function to process a link and create a document
async function createDocumentFromLink(linkItem) {
    const { link, title, category, sourceUrl } = linkItem;
    let textContent = null;
    let docType = '';

    const { data, contentType } = await fetchUrlContent(link);

    if (contentType && contentType.includes('application/pdf')) {
        textContent = await extractTextFromPdf(data);
        docType = 'pdf_document';
    } else if (contentType && contentType.includes('text/html')) {
        const $ = cheerio.load(data);
        $('script, style, header, footer, nav, .sidebar, .menu, .ad').remove();
        textContent = cleanText($('body').text());
        docType = 'html_page';
    }

    if (textContent && textContent.length > 50) {
        return {
            pageContent: textContent,
            metadata: {
                title: title,
                category: category,
                source: link,
                docType: docType,
                sourceUrl: sourceUrl
            }
        };
    }
    return null;
}

// Scrape Examination Results Page
export async function scrapeExamResults() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/examination/results.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    $('a[id^="hyperlink"]').each((i, el) => {
        const linkHref = $(el).attr('href')?.trim();
        const linkText = cleanText($(el).text());
        if (linkHref && linkText) {
            const absoluteLink = buildAbsolute(linkHref, url);
            if (absoluteLink) {
                documents.push({
                    link: absoluteLink,
                    type: 'html_link',
                    pageContent: '',
                    metadata: {
                        title: `Exam Result: ${linkText}`,
                        category: 'examination_results',
                        source: url,
                        docType: 'html_page'
                    }
                });
            }
        }
    });
    console.log(`✅ Scraped ${documents.length} exam result links.`);
    return documents;
}

// Scrape Exam Timetables Page (PDF links)
export async function scrapeExamTimetables() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/examination/timetables.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    
    $('a[href$=".pdf"]').each((i, el) => {
        const linkHref = $(el).attr('href')?.trim();
        const linkText = cleanText($(el).text());
        if (linkHref && linkText) {
            const absoluteLink = buildAbsolute(linkHref, url);
            if (absoluteLink) {
                documents.push({
                    link: absoluteLink,
                    type: 'pdf_link',
                    pageContent: '',
                    metadata: {
                        title: `Exam Timetable: ${linkText}`,
                        category: 'examination_timetables',
                        source: url,
                        docType: 'pdf_document'
                    }
                });
            }
        }
    });
    console.log(`✅ Scraped ${documents.length} exam timetable links.`);
    return documents;
}

// Scrape Notifications Page (PDF links)
export async function scrapeNotifications() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/examination/notifications.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    $('a[href$=".pdf"]').each((i, el) => {
        const linkHref = $(el).attr('href')?.trim();
        const linkText = cleanText($(el).text());
        if (linkHref && linkText) {
            const absoluteLink = buildAbsolute(linkHref, url);
            if (absoluteLink) {
                documents.push({
                    link: absoluteLink,
                    type: 'pdf_link',
                    pageContent: '',
                    metadata: {
                        title: `Notification: ${linkText}`,
                        category: 'college_notifications',
                        source: url,
                        docType: 'pdf_document'
                    }
                });
            }
        }
    });
    console.log(`✅ Scraped ${documents.length} notification links.`);
    return documents;
}

// Scrape Academic Calendars Page (PDFs/Buttons)
export async function scrapeAcademicCalendars() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/examination/academic_calendars.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    $('a[href$=".pdf"]').each((i, el) => {
        const linkHref = $(el).attr('href')?.trim();
        const linkText = cleanText($(el).text());
        if (linkHref && linkText) {
            const absoluteLink = buildAbsolute(linkHref, url);
            if (absoluteLink) {
                documents.push({
                    link: absoluteLink,
                    type: 'pdf_link',
                    pageContent: '',
                    metadata: {
                        title: `Academic Calendar: ${linkText}`,
                        category: 'academic_calendar',
                        source: url,
                        docType: 'pdf_document'
                    }
                });
            }
        }
    });
    console.log(`✅ Scraped ${documents.length} academic calendar links.`);
    return documents;
}

// Scrape direct PDF regulations
export async function scrapeExamRegulations() {
    const documents = [];
    const urls = [
        `${COLLEGE_BASE_URL}/examination/docs/Autonomy_Regulations_Examinations.pdf`,
        `${COLLEGE_BASE_URL}/examination/docs/Transitory_Regulations.pdf`
    ];
    for (const url of urls) {
        documents.push({
            link: url,
            title: `Exam Regulation: ${url.split('/').pop()}`,
            type: 'pdf_link',
            category: 'examination_regulations',
            sourceUrl: url
        });
    }
    console.log(`✅ Found ${documents.length} direct regulation PDFs.`);
    return documents;
}

// Scrape Old Question Papers - This requires a special handler due to different domain/structure
export async function scrapeOldQuestionPapers() {
    const documents = [];
    const url = 'http://115.241.205.5/wbc/exams/downloadexampapers.aspx';
    
    // As per your instruction, we will not extract data from this portal.
    // We will just provide a direct link to the portal for the user.
    documents.push({
        pageContent: "Information about old question papers might require selecting options or using a search function on the dedicated portal. Please visit the link directly: http://115.241.205.5/wbc/exams/downloadexampapers.aspx",
        metadata: {
            title: "Old Question Papers Portal Info",
            category: "old_question_papers",
            source: url,
            docType: "information_text"
        }
    });

    console.log(`✅ Created document for old question papers portal.`);
    return documents;
}

// Scrape Exam Evaluation page
export async function scrapeExamEvaluation() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/examination/index.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    
    // We will extract the alert-primary boxes which contain examination information.
    $('div.alert-primary').each((_, el) => {
        const title = cleanText($(el).find('h5').text());
        const content = cleanText($(el).text());
        if (content.length > 50) {
            documents.push({
                pageContent: content,
                metadata: {
                    title: `Examination Info: ${title || 'Overview'}`,
                    category: 'examination_evaluation',
                    source: url,
                    docType: 'html_page_section'
                }
            });
        }
    });
    
    // We will also extract the grading system table.
    const gradingTable = $('table.table-bordered').text();
    if (gradingTable) {
        documents.push({
            pageContent: `Grading system information: ${cleanText(gradingTable)}`,
            metadata: {
                title: 'Examination Grading System',
                category: 'examination_evaluation',
                source: url,
                docType: 'html_table_content'
            }
        });
    }

    console.log(`✅ Scraped ${documents.length} exam evaluation documents.`);
    return documents;
}


// Consolidate all examination related scrapers
export async function scrapeAllExaminationInfo() {
    const documents = [];

    const results = await scrapeExamResults();
    documents.push(...results);

    const timetables = await scrapeExamTimetables();
    documents.push(...timetables);

    const notifications = await scrapeNotifications();
    documents.push(...notifications);

    const academicCalendars = await scrapeAcademicCalendars();
    documents.push(...academicCalendars);

    const regulations = await scrapeExamRegulations();
    documents.push(...regulations);

    const oldPapers = await scrapeOldQuestionPapers();
    documents.push(...oldPapers);

    const evaluation = await scrapeExamEvaluation();
    if (evaluation) documents.push(evaluation);

    console.log(`✅ Scraped examination info: ${documents.length} items (links/text).`);
    return documents;
}



// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import { httpsAgent, cleanText, extractTextFromPdf, fetchUrlContent } from '../utils/util.js';

// const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

// // -------------------------------------------------------------------
// // -------------------- HELPER FUNCTIONS -----------------------------
// // -------------------------------------------------------------------

// // NOTE: These helper functions are copied/adapted from your provided context
// function sanitizeHref(href) {
//     if (!href) return href;
//     let s = href.trim();
//     s = s.replace(/^httpss:\/\//i, 'https://');
//     s = s.replace(/gmrit\.eedu\.in/gi, 'gmrit.edu.in');
//     s = s.replace(/ggmrit\.edu\.in/gi, 'gmrit.edu.in');
//     s = s.replace(/gmriit\.edu\.in/gi, 'gmrit.edu.in');
//     s = s.replace(/localhosst/gi, 'localhost');
//     return s;
// }

// function buildAbsolute(href, base) {
//     try {
//         const s = sanitizeHref(href);
//         const u = new URL(s, base);
//         return u.href;
//     } catch (_) { return null; }
// }

// /**
//  * Creates two structured document objects from a PDF URL: one for the content and one for the link.
//  * @param {string} url - Absolute URL of the PDF.
//  * @param {string} title - Human-readable title.
//  * @param {string} category - Category for intent classification (e.g., 'timetable_btech_3_1').
//  * @param {string} sourceUrl - The page the link was scraped from.
//  * @returns {Promise<Array<Object>>} - An array of document objects (content + link).
//  */
// async function createPdfDocumentsWithLink(url, title, category, sourceUrl) {
//     const documents = [];

//     // 1. Fetch PDF content and attempt text extraction
//     const { data: pdfBuffer, contentType } = await fetchUrlContent(url);
//     if (!pdfBuffer || !contentType?.includes('application/pdf')) {
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
//                 docType: 'pdf_document',
//                 sourceUrl: sourceUrl
//             }
//         });
//     } else {
//         console.warn(`❗ No substantial text extracted from PDF: ${url}`);
//     }

//     // DOCUMENT 2: A small document to ensure the link is saved and searchable
//     documents.push({
//         pageContent: `Official Document Link: ${title} can be downloaded from this URL: ${url}`,
//         metadata: {
//             title: `${title} Link`,
//             category: category,
//             source: url,
//             docType: 'pdf_link',
//             sourceUrl: sourceUrl
//         }
//     });

//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 1. SCRAPE RESULTS PAGE (LINK ONLY) -------------
// // -------------------------------------------------------------------

// export async function scrapeExamResults() {
//     console.log('🚀 Starting Exam Results Link Scraper...');
//     const documents = [];
//     const url = `${COLLEGE_BASE_URL}/examination/results.php`;
    
//     // We will only extract the main portal link for searchability.
//     // Deep scraping of result portals is often blocked or unreliable.
//     documents.push({
//         pageContent: `The official examination results portal can be accessed here: ${url}. You may need to enter credentials or specific details to view individual results.`,
//         metadata: {
//             title: "Examination Results Portal Link",
//             category: "examination_results",
//             source: url,
//             docType: "portal_link_info"
//         }
//     });

//     console.log(`✅ Scraped 1 exam result portal link document.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 2. SCRAPE TIME TABLES ------------------------
// // -------------------------------------------------------------------

// export async function scrapeExamTimetables() {
//     console.log('🚀 Starting Exam Timetables Scraper...');
//     const documents = [];
//     const url = `${COLLEGE_BASE_URL}/examination/timetables.php`;
//     const { data, contentType } = await fetchUrlContent(url);
//     if (!data || !contentType.includes('text/html')) {
//         console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
//         return [];
//     }
//     const $ = cheerio.load(data);
    
//     const fetchTasks = [];

//     // Target the main table rows containing timetable links and dates
//     $('table.table-bordered tbody tr').each((i, el) => {
//         const linkEl = $(el).find('a[href$=".pdf"]').first();
//         const linkHref = linkEl.attr('href')?.trim();
//         const linkText = cleanText(linkEl.text());
//         const dateText = cleanText($(el).find('td:nth-child(2)').text()); // Assuming Date is in the second TD

//         if (linkHref && linkText) {
//             const absoluteLink = buildAbsolute(linkHref, url);
            
//             // Clean up title and generate category
//             const title = `Exam Timetable: ${linkText.replace(/\s*\(NEW\)\s*/i, '').trim()} - Date: ${dateText}`;
//             const categoryMatch = linkText.match(/(B\.Tech|M\.Tech|MBA|MCA)\s*(.*?)\s*(Reg|Supp)/i);
//             const category = categoryMatch 
//                 ? `timetable_${categoryMatch[1].toLowerCase()}_${categoryMatch[3].toLowerCase()}`
//                 : 'examination_timetables';

//             if (absoluteLink) {
//                 fetchTasks.push(createPdfDocumentsWithLink(absoluteLink, title, category, url));
//             }
//         }
//     });

//     const results = await Promise.all(fetchTasks);
//     results.forEach(pdfDocs => documents.push(...pdfDocs));

//     console.log(`✅ Scraped and processed Exam Timetables: ${documents.length} documents.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 3. SCRAPE ACADEMIC CALENDARS -----------------
// // -------------------------------------------------------------------

// export async function scrapeAcademicCalendars() {
//     console.log('🚀 Starting Academic Calendars Scraper...');
//     const documents = [];
//     const url = `${COLLEGE_BASE_URL}/examination/academic_calendars.php`;
//     const { data, contentType } = await fetchUrlContent(url);
//     if (!data || !contentType.includes('text/html')) {
//         console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
//         return [];
//     }
//     const $ = cheerio.load(data);

//     const fetchTasks = [];

//     // Academic calendars are grouped by year in large blocks. We need to extract the academic year first.
//     $('.panel-heading, .col-md-3').each((i, headerEl) => {
//         const academicYear = cleanText($(headerEl).find('h4, h5').text()).trim().replace('Academic Calendar', '').trim();
        
//         // Find links associated with this header (usually in the next immediate div or container)
//         $(headerEl).nextUntil('.panel-heading, .col-md-3').find('a[href*="/Calendars/Academic"]').each((_, el) => {
//             const linkHref = $(el).attr('href')?.trim();
//             const linkText = cleanText($(el).text()); 
            
//             if (linkHref && linkText) {
//                 const absoluteLink = buildAbsolute(linkHref, url);
                
//                 // Generate informative title and category
//                 const title = `Academic Calendar ${academicYear}: ${linkText.replace('Download', '').trim()}`;
//                 const category = `academic_calendar_${academicYear.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

//                 if (absoluteLink) {
//                     fetchTasks.push(createPdfDocumentsWithLink(absoluteLink, title, category, url));
//                 }
//             }
//         });
//     });

//     const results = await Promise.all(fetchTasks);
//     results.forEach(pdfDocs => documents.push(...pdfDocs));

//     console.log(`✅ Scraped and processed Academic Calendars: ${documents.length} documents.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 4. SCRAPE EXAM REGULATIONS (PDF LINK ONLY) ---
// // -------------------------------------------------------------------

// export async function scrapeExamRegulations() {
//     console.log('🚀 Starting Exam Regulations Scraper (Direct PDF)...');
//     const documents = [];
//     const url = `${COLLEGE_BASE_URL}/examination/docs/Autonomy_Regulations_Examinations.pdf`;
    
//     // Process the direct PDF link to extract content and save link
//     const pdfDocs = await createPdfDocumentsWithLink(url, 'Autonomy Regulations - Examinations', 'examination_regulations', url);
//     documents.push(...pdfDocs);

//     console.log(`✅ Processed 1 core examination regulation PDF.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // -------------------- 5. SCRAPE OLD QUESTION PAPERS (PORTAL LINK) --
// // -------------------------------------------------------------------

// export async function scrapeOldQuestionPapers() {
//     console.log('🚀 Starting Old Question Papers Scraper (Portal Link)...');
//     const documents = [];
//     const url = 'http://115.241.205.5/wbc/index.aspx';
    
//     // We will only provide a direct link and information, as deep scraping is complex.
//     documents.push({
//         pageContent: `To access old question papers, please visit the dedicated online portal. You may need to select the regulation, branch, and semester: ${url}`,
//         metadata: {
//             title: "Old Question Papers Portal Link",
//             category: "old_question_papers_portal",
//             source: url,
//             docType: "portal_link_info"
//         }
//     });

//     console.log(`✅ Created document for old question papers portal.`);
//     return documents;
// }

// // -------------------------------------------------------------------
// // ------------------ CONSOLIDATED EXPORT FUNCTION -------------------
// // -------------------------------------------------------------------

// export async function scrapeAllExaminationInfo() {
//     const documents = [];
    
//     console.log(`\n======================================================`);
//     console.log(`| STARTING ALL EXAMINATION INFO SCRAPERS |`);
//     console.log(`======================================================`);

//     const results = await scrapeExamResults();
//     documents.push(...results);

//     const timetables = await scrapeExamTimetables();
//     documents.push(...timetables);

//     const academicCalendars = await scrapeAcademicCalendars();
//     documents.push(...academicCalendars);

//     const regulations = await scrapeExamRegulations();
//     documents.push(...regulations);

//     const oldPapers = await scrapeOldQuestionPapers();
//     documents.push(...oldPapers);

//     // Placeholder for other minor pages from original code if still needed, otherwise omit:
//     // const notifications = await scrapeNotifications();
//     // documents.push(...notifications);
//     // const evaluation = await scrapeExamEvaluation();
//     // documents.push(...evaluation);

//     console.log(`\n======================================================`);
//     console.log(`✅ FINAL TOTAL: Scraped ${documents.length} examination documents.`);
//     console.log(`======================================================`);
//     return documents;
// }
