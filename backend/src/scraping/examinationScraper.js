// src/scrapers/examinationScraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { httpsAgent, cleanText, extractTextFromPdf, fetchUrlContent } from '../utils/util.js';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

// Helper function to extract links from a list and handle PDFs
async function processLinkList(url, category, titlePrefix) {
    const documents = [];
    console.log(`Processing list: ${url} for category: ${category}`);

    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    // Look for common list structures, e.g., tables, ul/li, or specific divs
    // This is a generic approach; you might need to refine selectors for each page.
    $('a[href]').each((i, el) => {
        const linkHref = $(el).attr('href')?.trim();
        let linkText = cleanText($(el).text());

        if (linkHref) {
            const absoluteLink = linkHref.startsWith('http') ? linkHref : `${COLLEGE_BASE_URL}/${linkHref}`;

            // Filter out common irrelevant links (e.g., mailto, javascript, generic site links)
            if (absoluteLink.includes('mailto:') || absoluteLink.includes('javascript:') || !absoluteLink.startsWith(COLLEGE_BASE_URL)) {
                return;
            }

            // Heuristic to avoid navigation links from main content area
            if ($(el).closest('nav, header, footer, .sidebar, .menu').length > 0) {
                 return;
            }

            // If the link text is empty, try to get text from parent or sibling
            if (!linkText && $(el).parent().text()) {
                linkText = cleanText($(el).parent().text());
            } else if (!linkText && $(el).siblings().text()) {
                 linkText = cleanText($(el).siblings().text());
            }
            if (!linkText) linkText = `Link ${i+1}`; // Fallback

            if (absoluteLink.endsWith('.pdf')) {
                documents.push({
                    link: absoluteLink,
                    title: `${titlePrefix}: ${linkText}`,
                    type: 'pdf_link',
                    category: category,
                    sourceUrl: url // Source of the link
                });
            } else if (absoluteLink.startsWith(COLLEGE_BASE_URL)) {
                // If it's another internal HTML link, we might want to crawl it later
                // For now, let's just record its existence if it's relevant to the category
                documents.push({
                    link: absoluteLink,
                    title: `${titlePrefix}: ${linkText}`,
                    type: 'html_link',
                    category: category,
                    sourceUrl: url
                });
            }
        }
    });
    console.log(`Found ${documents.length} potential items for ${category}`);
    return documents;
}

// Scrape Examination Results Page
export async function scrapeExamResults() {
    return await processLinkList(`${COLLEGE_BASE_URL}/examination/results.php`, 'examination_results', 'Exam Result');
}

// Scrape Exam Timetables Page (PDF links)
export async function scrapeExamTimetables() {
    return await processLinkList(`${COLLEGE_BASE_URL}/examination/timetables.php`, 'examination_timetables', 'Exam Timetable');
}

// Scrape Notifications Page (PDF links)
export async function scrapeNotifications() {
    return await processLinkList(`${COLLEGE_BASE_URL}/examination/notifications.php`, 'college_notifications', 'Notification');
}

// Scrape Academic Calendars Page (PDFs/Buttons)
export async function scrapeAcademicCalendars() {
    const url = `${COLLEGE_BASE_URL}/examination/academic_calendars.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    const documents = [];

    // Assuming buttons lead to PDFs directly or contain links
    $('a[href$=".pdf"], button[onclick*=".pdf"]').each((i, el) => {
        let pdfLink = $(el).attr('href');
        if (!pdfLink && $(el).attr('onclick')) {
            const match = $(el).attr('onclick').match(/window\.open\('([^']+)'/);
            if (match) pdfLink = match[1];
        }

        if (pdfLink) {
            const absoluteLink = pdfLink.startsWith('http') ? pdfLink : `${COLLEGE_BASE_URL}/${pdfLink}`;
            const title = cleanText($(el).text()) || `Academic Calendar ${i + 1}`;
            documents.push({
                link: absoluteLink,
                title: `Academic Calendar: ${title}`,
                type: 'pdf_link',
                category: 'academic_calendar',
                sourceUrl: url
            });
        }
    });
    console.log(`Found ${documents.length} academic calendars.`);
    return documents;
}

// Scrape direct PDF regulations
export async function scrapeExamRegulations() {
    const urls = [
        `${COLLEGE_BASE_URL}/examination/docs/Autonomy_Regulations_Examinations.pdf`,
        `${COLLEGE_BASE_URL}/examination/docs/Transitory_Regulations.pdf`
    ];
    const documents = [];
    for (const url of urls) {
        documents.push({
            link: url,
            title: `Exam Regulation: ${url.split('/').pop()}`,
            type: 'pdf_link',
            category: 'examination_regulations',
            sourceUrl: url
        });
    }
    console.log(`Found ${documents.length} direct regulation PDFs.`);
    return documents;
}

// Scrape Old Question Papers - This requires a special handler due to different domain/structure
export async function scrapeOldQuestionPapers() {
    const url = 'http://115.241.205.5/wbc/exams/downloadexampapers.aspx';
    let data;
    try {
        // Note: Using http, so no httpsAgent needed unless you face redirection issues
        const response = await axios.get(url);
        data = response.data;
    } catch (error) {
        console.warn(`⚠️ Failed to fetch old question papers page: ${error.message}`);
        return [];
    }
    const $ = cheerio.load(data);
    const documents = [];

    // This page likely has a very specific structure (e.g., dropdowns, form submissions)
    // We'll scrape visible links if any, but a deeper integration might require mimicking form submissions.
    $('a[href]').each((i, el) => {
        const linkHref = $(el).attr('href')?.trim();
        const linkText = cleanText($(el).text());

        if (linkHref && linkText && linkHref.includes('.pdf') && linkHref.startsWith('http')) {
            documents.push({
                link: linkHref,
                title: `Old Question Paper: ${linkText}`,
                type: 'pdf_link',
                category: 'old_question_papers',
                sourceUrl: url
            });
        }
    });

    // If the page requires form submission (e.g., selecting branch, year),
    // you would need to inspect network requests in a browser and
    // replicate those POST requests with axios, then parse the results.
    // For now, this is a basic link extraction.
    if (documents.length === 0) {
        console.warn("❗ No direct PDF links found on Old Question Papers page. This page might require form interaction.");
        documents.push({
          pageContent: "Information about old question papers might require selecting options or using a search function on the dedicated portal. Please visit the link directly: http://115.241.205.5/wbc/exams/downloadexampapers.aspx",
          metadata: {
            title: "Old Question Papers Portal Info",
            category: "old_question_papers_portal",
            source: url,
            docType: "information_text"
          }
        })
    }
    console.log(`Found ${documents.length} old question paper links/info.`);
    return documents;
}

// Scrape Exam Evaluation page
export async function scrapeExamEvaluation() {
    const url = `${COLLEGE_BASE_URL}/examination/index.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return null;
    }
    const $ = cheerio.load(data);
    // Attempt to get main content from the page
    const content = cleanText($('.container').text() || $('body').text());

    if (!content || content.length < 50) { // Check if content is substantial
      console.warn(`❗ No substantial content found on Exam Evaluation page: ${url}`);
      return null;
    }

    return {
        pageContent: content,
        metadata: {
            title: 'Examination Evaluation Information',
            category: 'examination_evaluation',
            source: url,
            docType: 'html_page'
        }
    };
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