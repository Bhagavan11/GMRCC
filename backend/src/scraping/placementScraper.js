import * as cheerio from 'cheerio';
import { fetchUrlContent, cleanText } from '../utils/util.js';
import { v4 as uuidv4 } from 'uuid';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';
const PLACEMENTS_URL = `${COLLEGE_BASE_URL}/placements.php`;

// -------------------------------------------------------------------
// -------------------- 1. Placement Overview ------------------------
// -------------------------------------------------------------------

/**
 * Scrapes the main placement overview text.
 */
export async function scrapePlacementOverview() {
    console.log('-- Scraping Placement Overview...');
    const documents = [];
    const { data: htmlData } = await fetchUrlContent(PLACEMENTS_URL);
    
    if (!htmlData) {
        console.warn('⚠️ Failed to fetch placement overview page.');
        return [];
    }
    const $ = cheerio.load(htmlData);

    // Target the main introductory text about the T&P Cell (based on image_b0eec7.jpg)
    const overviewText = cleanText($('.container-fluid span:contains("GMRIT\'s Training, Placement and Development Cell")').text());
    
    if (overviewText.length > 100) {
        documents.push({
            pageContent: `Placement Cell Overview: ${overviewText}`,
            metadata: {
                title: 'Placement Cell Overview & Role',
                category: 'placement_overview',
                source: PLACEMENTS_URL,
                docType: 'html_page_section'
            }
        });
    }

    return documents;
}

// -------------------------------------------------------------------
// -------------------- 2. Student Works At (Company Logos/Names) ----
// -------------------------------------------------------------------

/**
 * Scrapes company names from the marquee section (Student works at).
 */
export async function scrapeStudentWorksAt() {
    console.log('-- Scraping Student Works At (Company Names)...');
    const documents = [];
    const { data: htmlData } = await fetchUrlContent(PLACEMENTS_URL);
    if (!htmlData) return [];
    const $ = cheerio.load(htmlData);

    const companies = new Set();

    // Target marquee content where image links are present (based on image_b0eec7.jpg)
    $('.marquee-content img').each((i, el) => {
        const altText = $(el).attr('alt');
        if (altText && altText.toLowerCase() !== 'logo') {
            companies.add(altText.trim());
        }
        // Fallback: Use image URL to guess company name if alt text is generic
        const src = $(el).attr('src');
        if (src) {
            const fileName = src.split('/').pop().split('.')[0];
            // Simple heuristic to clean up file names for company names
            if (fileName.length > 2 && !fileName.includes('logo')) {
                companies.add(fileName.replace(/[-_]/g, ' ').trim());
            }
        }
    });

    if (companies.size > 0) {
        documents.push({
            pageContent: `GMRIT Students are working at companies including: ${Array.from(companies).join(', ')}`,
            metadata: {
                title: 'Top Recruiters List',
                category: 'top_recruiters',
                source: PLACEMENTS_URL,
                docType: 'company_list'
            }
        });
    }

    return documents;
}

// -------------------------------------------------------------------
// -------------------- 3. Outgoing Batch Placements (Detailed Tables) -
// -------------------------------------------------------------------

/**
 * Scrapes the detailed placement table for all available years (e.g., 2025, 2024, 2023).
 */
async function scrapeDetailedBatchPlacements() {
    console.log('-- Scraping Detailed Batch Placements (Tables)...');
    const documents = [];
    const { data: htmlData } = await fetchUrlContent(PLACEMENTS_URL);
    if (!htmlData) return [];
    const $ = cheerio.load(htmlData);
    
    // Target each collapsible button/section for placement years (e.g., 2025, 2024, 2023)
    $('button.collapsible').each((i, buttonEl) => {
        const yearTitle = cleanText($(buttonEl).text()).match(/\d{4}/)?.[0]; // e.g., "2025"
        if (!yearTitle) return;

        // The table is usually the immediate sibling or within the next container of the button
        const tableContainer = $(buttonEl).next('.content').find('table');
        
        if (tableContainer.length === 0) return;

        const placementRecords = [];
        // Extract data from the table body
        tableContainer.find('tbody tr').each((j, rowEl) => {
            const columns = $(rowEl).find('td').map((_, td) => cleanText($(td).text())).get();
            
            // Assuming table structure: [S.NO, ORGANIZATION, STUDENTS PLACED, CTC (Rs. LPA)]
            if (columns.length >= 4) {
                placementRecords.push({
                    organization: columns[1],
                    studentsPlaced: columns[2],
                    ctc: columns[3],
                });
            }
        });

        if (placementRecords.length > 0) {
            // Document 1: Summarize the data for RAG context
            const summary = placementRecords.map(r => `${r.organization} placed ${r.studentsPlaced} with CTC ${r.ctc}`).join('; ');
            documents.push({
                pageContent: `Placement details for ${yearTitle} batch: ${summary}`,
                metadata: {
                    title: `${yearTitle} Major Recruiter Details`,
                    category: `placement_batch_${yearTitle}`,
                    source: PLACEMENTS_URL,
                    docType: 'placement_data_summary'
                }
            });

            // Document 2: Store the structured data itself for detailed query answers
            documents.push({
                pageContent: `Structured placement data for ${yearTitle} batch. Total recruiters: ${placementRecords.length}.`,
                metadata: {
                    title: `${yearTitle} Structured Placement Data`,
                    category: `placement_batch_${yearTitle}_structured`,
                    source: PLACEMENTS_URL,
                    docType: 'placement_data_structured',
                    year: yearTitle,
                    data: JSON.stringify(placementRecords) // Store structured data as JSON string
                }
            });
        }
    });

    return documents;
}


// -------------------------------------------------------------------
// -------------------- 4. Placement History (Charts) ----------------
// -------------------------------------------------------------------

/**
 * Scrapes placement history data, typically found in charts (based on image_b0e003.jpg).
 */
export async function scrapePlacementHistory() {
    console.log('-- Scraping Placement History (Chart Data)...');
    const documents = [];
    const { data: htmlData } = await fetchUrlContent(PLACEMENTS_URL);
    if (!htmlData) return [];
    const $ = cheerio.load(htmlData);
    
    // We target the overall container text which usually includes surrounding stats.
    const historySection = cleanText($('div:contains("Placements History")').closest('.row').text());

    if (historySection.length > 100) {
        documents.push({
            pageContent: `GMRIT Placement History and Trends: ${historySection}`,
            metadata: {
                title: 'GMRIT Placement History & Trends',
                category: 'placement_history',
                source: PLACEMENTS_URL,
                docType: 'html_page_chart_info'
            }
        });
    }
    return documents;
}

// -------------------------------------------------------------------
// -------------------- 5. Placement News ----------------------------
// -------------------------------------------------------------------

/**
 * Scrapes individual placement news items/success stories.
 */
export async function scrapePlacementNews() {
    console.log('-- Scraping Placement News...');
    const documents = [];
    const { data: htmlData } = await fetchUrlContent(PLACEMENTS_URL);
    if (!htmlData) return [];
    const $ = cheerio.load(htmlData);
    
    // Target individual notification containers (based on image_b0dc9e.jpg)
    $('div.notificationContainer').each((i, el) => {
        const company = cleanText($(el).find('h2').first().text());
        const story = cleanText($(el).find('p').text());
        const packageInfo = cleanText($(el).find('h5').text());

        if (company && story) {
            documents.push({
                pageContent: `Placement News: ${company} - Story: ${story} - Package: ${packageInfo}`,
                metadata: {
                    title: `Placement Success: ${company}`,
                    category: 'placement_news',
                    source: PLACEMENTS_URL,
                    docType: 'placement_success_story'
                }
            });
        }
    });

    return documents;
}

// -------------------------------------------------------------------
// -------------------- 6. CDC Team (Contact Details) ----------------
// -------------------------------------------------------------------

/**
 * Scrapes CDC Team contact information.
 */
export async function scrapeCDCTeam() {
    console.log('-- Scraping CDC Team Contact Details...');
    const documents = [];
    const { data: htmlData } = await fetchUrlContent(PLACEMENTS_URL);
    if (!htmlData) return [];
    const $ = cheerio.load(htmlData);

    const teamMembers = [];

    // Target the main profile container for each team member (based on image_b08a61.jpg)
    $('section.profileSection .profileBody').each((i, el) => {
        const name = cleanText($(el).find('h4').text());
        const role = cleanText($(el).find('h5').text());
        const details = cleanText($(el).find('p').text());
        
        if (name && role) {
            teamMembers.push(`Name: ${name}, Role: ${role}, Contact Details: ${details}`);
        }
    });

    if (teamMembers.length > 0) {
        documents.push({
            pageContent: `CDC Team Contact Information: ${teamMembers.join('; ')}`,
            metadata: {
                title: 'CDC Team Contacts',
                category: 'cdc_contacts',
                source: PLACEMENTS_URL,
                docType: 'contact_information'
            }
        });
    }

    return documents;
}

// -------------------------------------------------------------------
// ------------------ CONSOLIDATED EXPORT FUNCTION -------------------
// -------------------------------------------------------------------

export async function scrapeAllPlacementInfo() {
    console.log(`\n======================================================`);
    console.log(`| STARTING ALL PLACEMENT INFO SCRAPERS |`);
    console.log(`======================================================`);
    
    const documents = [];

    documents.push(...await scrapePlacementOverview());
    documents.push(...await scrapeStudentWorksAt());
    documents.push(...await scrapeDetailedBatchPlacements());
    documents.push(...await scrapePlacementHistory());
    documents.push(...await scrapePlacementNews());
    documents.push(...await scrapeCDCTeam());

    console.log(`\n======================================================`);
    console.log(`✅ FINAL TOTAL: Scraped ${documents.length} placement documents.`);
    console.log(`======================================================`);
    return documents;
}
