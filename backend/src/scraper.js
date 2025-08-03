// src/scraper.js

console.log("--- scraper.js: Script started processing (VERY FIRST LINE). ---");

console.log("--- scraper.js: Attempting to import @langchain/textsplitters ---");
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
console.log("--- scraper.js: @langchain/textsplitters imported. ---");

console.log("--- scraper.js: Attempting to import fs ---");
import fs from 'fs/promises';
console.log("--- scraper.js: fs imported. ---");

console.log("--- scraper.js: Attempting to import path ---");
import path from 'path';
console.log("--- scraper.js: path imported. ---");

import { v4 as uuidv4 } from 'uuid'; // ADD THIS IMPORT FOR UUID GENERATION

console.log("--- scraper.js: Attempting to import facultyScraper (./scraping/facultyScraper.js) ---");
import { allDepts, scrapeFaculty } from './scraping/facultyScraper.js';
console.log("--- scraper.js: facultyScraper imported. ---");

console.log("--- scraper.js: Attempting to import collegeInfoScraper (./scraping/collegeInfoScraper.js) ---");
import { scrapeCollegeInfo } from './scraping/collegeInfoScraper.js';
console.log("--- scraper.js: collegeInfoScraper imported. ---");

console.log("--- scraper.js: Attempting to import examinationScraper (./scraping/examinationScraper.js) ---");
import { scrapeAllExaminationInfo } from './scraping/examinationScraper.js';
console.log("--- scraper.js: examinationScraper imported. ---");

console.log("--- scraper.js: Attempting to import studentActivitiesScraper (./scraping/studentActivitiesScraper.js) ---");
import { scrapeAllStudentRelatedInfo } from './scraping/studentActivitiesScraper.js';
console.log("--- scraper.js: studentActivitiesScraper imported. ---");

console.log("--- scraper.js: Attempting to import utils (./utils/util.js) ---");
import { fetchUrlContent, extractTextFromPdf, cleanText } from './utils/util.js';
console.log("--- scraper.js: utils imported. ---");

console.log("--- scraper.js: Attempting to import cheerio ---");
import * as cheerio from 'cheerio';
console.log("--- scraper.js: cheerio imported. ---");


console.log("--- scraper.js: All initial imports successfully completed. ---");

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';
const processedContentUrls = new Set();
const scrapedDocuments = []; // Final list of documents ready for chunking

/**
 * Handles processing of a generic HTML page that doesn't have a specific scraper.
 * It will extract main text and try to find relevant links to follow.
 * @param {string} url - The URL to fetch.
 * @param {number} depth - Current crawling depth.
 * @param {Set<string>} visitedLinkQueue - Set of URLs to visit
 */
async function processGenericHtml(url, depth, visitedLinkQueue) {
    if (processedContentUrls.has(url)) {
        return;
    }

    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        return;
    }

    const $ = cheerio.load(data);
    $('script, style, header, footer, nav, .sidebar, .menu, .ad').remove();
    const textContent = cleanText($('body').text());

    if (textContent && textContent.length > 50) {
        scrapedDocuments.push({
            pageContent: textContent,
            metadata: {
                title: $('title').text() || 'Generic HTML Page',
                category: 'generic_html',
                source: url,
                docType: 'html_page',
                crawledAt: new Date().toISOString(),
                docId: uuidv4() // Assign a unique ID here
            }
        });
        processedContentUrls.add(url);
    }

    if (depth < MAX_DEPTH) {
        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, url).href;
                    if (absoluteUrl.startsWith('tel:') || absoluteUrl.startsWith('mailto:') || absoluteUrl.startsWith('javascript:')) {
                        return;
                    }
                    if (absoluteUrl.startsWith(COLLEGE_BASE_URL)) {
                        visitedLinkQueue.add(absoluteUrl);
                    }
                } catch (e) {
                    // console.warn(`Invalid URL found: ${href} on ${url}`);
                }
            }
        });
    }
}

/**
 * Handles processing of a direct PDF link.
 * @param {string} url - URL of the PDF.
 * @param {string} title - Title for the document.
 * @param {string} category - Category for the document.
 */
async function processPdfLink(url, title, category) {
    if (processedContentUrls.has(url)) {
        return;
    }
    const { data: pdfBuffer, contentType } = await fetchUrlContent(url);
    if (!pdfBuffer || !contentType.includes('application/pdf')) {
        console.warn(`⚠️ Not a PDF or failed to fetch PDF: ${url}`);
        return;
    }
    const textContent = await extractTextFromPdf(pdfBuffer);
    if (textContent && textContent.length > 50) {
        scrapedDocuments.push({
            pageContent: textContent,
            metadata: {
                title: title,
                category: category,
                source: url,
                docType: 'pdf_document',
                crawledAt: new Date().toISOString(),
                docId: uuidv4() // Assign a unique ID here
            }
        });
        processedContentUrls.add(url);
    }
}


const MAX_DEPTH = 1; // Limit generic crawling depth for efficiency
const CRAWL_INTERVAL_MS = 500; // Delay between requests

/**
 * Main function to start the scraping process.
 * Orchestrates calls to specialized scrapers and performs generic crawling.
 * @returns {Promise<Array<{pageContent: string, metadata: object}>>} - All scraped documents as LangChain Document format.
 */
export async function startScraping() {
    console.log('--- startScraping: Function entered. ---');
    console.log('--- Starting comprehensive data scraping ---');
    scrapedDocuments.length = 0; // Clear previous data
    processedContentUrls.clear(); // Reset processed URLs

    // Step 1: Run specialized scrapers
    console.log('\n--- startScraping: Running specialized scrapers section. ---');

    // Faculty
    for (const dept of allDepts) {
        console.log(`--- startScraping: Scraping faculty for ${dept}. ---`);
        const facultyDocs = await scrapeFaculty(dept);
        facultyDocs.forEach(doc => {
            if (doc && doc.metadata) { // ADDED SAFETY CHECK
                doc.metadata.docId = uuidv4();
            } else {
                console.warn(`⚠️ Faculty scraper returned ill-formed document (missing doc or metadata) for dept ${dept}: ${JSON.stringify(doc)}`);
            }
        });
        scrapedDocuments.push(...facultyDocs);
    }

    // College General Info (About, Achievements, Research, Placements data, Departments)
    console.log(`--- startScraping: Scraping general college info. ---`);
    const collegeInfoDocs = await scrapeCollegeInfo();
    collegeInfoDocs.forEach(doc => {
        if (doc && doc.metadata) { // ADDED SAFETY CHECK
            doc.metadata.docId = uuidv4();
        } else {
            console.warn(`⚠️ College info scraper returned ill-formed document (missing doc or metadata): ${JSON.stringify(doc)}`);
        }
    });
    scrapedDocuments.push(...collegeInfoDocs);

    // Examination Info
    console.log(`--- startScraping: Scraping examination info. ---`);
    const examinationInfoDocs = await scrapeAllExaminationInfo();
    examinationInfoDocs.forEach(doc => {
        if (doc && doc.metadata) { // ADDED SAFETY CHECK
            doc.metadata.docId = uuidv4();
        } else {
            console.warn(`⚠️ Examination info scraper returned ill-formed document (missing doc or metadata): ${JSON.stringify(doc)}`);
        }
    });
    scrapedDocuments.push(...examinationInfoDocs);

    // Student Activities and Other General Info
    console.log(`--- startScraping: Scraping student-related info. ---`);
    const studentRelatedInfoDocs = await scrapeAllStudentRelatedInfo();
    studentRelatedInfoDocs.forEach(doc => {
        if (doc && doc.metadata) { // ADDED SAFETY CHECK
            doc.metadata.docId = uuidv4();
        } else {
            console.warn(`⚠️ Student/General info scraper returned ill-formed document (missing doc or metadata): ${JSON.stringify(doc)}`);
        }
    });
    scrapedDocuments.push(...studentRelatedInfoDocs);


    // Step 2: Handle deferred links (PDFs/HTML that need fetching)
    const deferredLinks = scrapedDocuments.filter(doc => doc.link && (doc.type === 'pdf_link' || doc.type === 'html_link'));
    const initialDocuments = scrapedDocuments.filter(doc => !doc.link);

    scrapedDocuments.length = 0;
    scrapedDocuments.push(...initialDocuments);

    console.log(`\n--- Processing ${deferredLinks.length} identified links for content extraction ---`);
    for (const linkItem of deferredLinks) {
        let textContent = null;
        let docType = '';

        if (linkItem.type === 'pdf_link') {
            const { data: pdfBuffer, contentType } = await fetchUrlContent(linkItem.link);
            if (pdfBuffer && contentType && contentType.includes('application/pdf')) {
                textContent = await extractTextFromPdf(pdfBuffer);
                docType = 'pdf_document';
            }
        } else if (linkItem.type === 'html_link') {
            const { data: htmlContent, contentType } = await fetchUrlContent(linkItem.link);
            if (htmlContent && contentType && contentType.includes('text/html')) {
                const $ = cheerio.load(htmlContent);
                $('script, style, header, footer, nav, .sidebar, .menu, .ad').remove();
                textContent = cleanText($('body').text());
                docType = 'html_page';
            }
        }

        if (textContent && textContent.length > 50) {
            scrapedDocuments.push({
                pageContent: textContent,
                metadata: {
                    ...linkItem.metadata,
                    docId: uuidv4(), // Assign a unique ID to this resolved document
                    source: linkItem.link,
                    docType: docType,
                    crawledAt: new Date().toISOString()
                }
            });
        } else {
            console.warn(`⚠️ Could not extract substantial content from deferred link: ${linkItem.link}`);
        }
        await new Promise(resolve => setTimeout(resolve, CRAWL_INTERVAL_MS)); // Be polite
    }


    console.log(`\n--- Starting text chunking for ${scrapedDocuments.length} documents ---`);
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const finalChunks = [];
    for (const doc of scrapedDocuments) {
        if (doc.pageContent) {
            try {
                const chunks = await textSplitter.splitText(doc.pageContent);
                chunks.forEach((chunk, index) => {
                    finalChunks.push({
                        pageContent: chunk,
                        metadata: {
                            ...doc.metadata,
                            chunkIndex: index,
                            originalContentLength: doc.pageContent.length,
                            totalChunks: chunks.length
                        }
                    });
                });
            } catch (error) {
                console.error(`Error splitting text for document from ${doc.metadata.source || doc.metadata.title}:`, error.message);
            }
        }
    }
    console.log(`Total chunks created: ${finalChunks.length}`);

    const outputDir = path.join(process.cwd(), 'data');
    const outputFilePath = path.join(outputDir, 'scraped_chunks.json');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputFilePath, JSON.stringify(finalChunks, null, 2), 'utf8');
    console.log(`Scraped chunks saved to ${outputFilePath}`);

    return finalChunks;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("--- scraper.js: Running directly block entered. ---");
    startScraping()
        .then(chunks => {
            console.log("\nScraping and chunking complete. Ready for Vector DB insertion.");
        })
        .catch(error => console.error("Scraping process failed:", error));
} else {
    console.log("--- scraper.js: Not running directly, likely imported by another file. ---");
}