import * as cheerio from 'cheerio';
import { fetchUrlContent, cleanText, extractTextFromPdf } from '../utils/util.js';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

/**
 * Helper function to create documents from a PDF URL, including full text extraction.
 * It returns two documents: one for the full text, and one for the link itself.
 */
async function createPdfDocuments(url, title, category) {
    const documents = [];

    // 1. Fetch PDF content and attempt text extraction
    const { data: pdfBuffer, contentType } = await fetchUrlContent(url);
    if (!pdfBuffer || !contentType.includes('application/pdf')) {
        console.warn(`⚠️ Could not fetch or parse PDF from ${url}`);
        return [];
    }
    
    const textContent = await extractTextFromPdf(pdfBuffer);
    
    if (textContent && textContent.length > 50) {
        // DOCUMENT 1: The full content for RAG
        documents.push({
            pageContent: textContent,
            metadata: {
                title: title,
                category: category,
                source: url,
                docType: 'pdf_document'
            }
        });
    } else {
        console.        console.log(`❗ No substantial text extracted from PDF for: ${title}`);
    }

    // DOCUMENT 2: A small document to ensure the link is saved and searchable
    documents.push({
        pageContent: `Official Document Link: ${title} can be downloaded from this URL: ${url}`,
        metadata: {
            title: `${title} Link`,
            category: category,
            source: url,
            docType: 'pdf_link'
        }
    });

    return documents;
}


// -------------------------------------------------------------------
// -------------------- 1 & 2. Overview and RDC Scraper --------------------
// -------------------------------------------------------------------

export async function scrapeResearchOverview() {
    console.log('🚀 Starting Research Overview Scraper...');
    const documents = [];

    // 1. Main Research Page Overview
    const researchUrl = `${COLLEGE_BASE_URL}/research.php`;
    let { data } = await fetchUrlContent(researchUrl);
    if (data) {
        let $ = cheerio.load(data);
        const overviewContent = cleanText($('.container').first().text());
        if (overviewContent.length > 100) {
             documents.push({
                pageContent: `Research Department Overview: ${overviewContent}`,
                metadata: {
                    title: 'Research Department Overview',
                    category: 'research_overview',
                    source: researchUrl,
                    docType: 'html_page_overview'
                }
            });
        }
    }

    // 2. R&D Cell Details (Vision, Mission, etc.)
    const rdcUrl = `${COLLEGE_BASE_URL}/researchcell.php`;
    ({ data } = await fetchUrlContent(rdcUrl));
    if (data) {
        let $ = cheerio.load(data);
        const rdcContent = cleanText($('.container').first().text());
        if (rdcContent.length > 100) {
             documents.push({
                pageContent: `Research and Development Cell (RDC) Details: ${rdcContent}`,
                metadata: {
                    title: 'Research and Development Cell (RDC)',
                    category: 'research_rdc',
                    source: rdcUrl,
                    docType: 'html_page_overview'
                }
            });
        }
    }
    
    return documents;
}

// -------------------------------------------------------------------
// -------------------- 3. Faculty Publications Scraper --------------------
// -------------------------------------------------------------------

export async function scrapeFacultyPublications() {
    console.log('🚀 Starting Faculty Publications Scraper...');
    const documents = [];
    
    const publicationLinks = [
        { dept: 'cse', url: 'https://gmrit.edu.in/PDFs/research/pp_cse.pdf' },
        { dept: 'aiml/aids', url: 'https://gmrit.edu.in/PDFs/research/pp_aimlaids.pdf' },
        { dept: 'civil', url: 'https://gmrit.edu.in/PDFs/research/pp_civil.pdf' },
        { dept: 'eee', url: 'https://gmrit.edu.in/PDFs/research/pp_eee.pdf' },
        { dept: 'ece', url: 'https://gmrit.edu.in/PDFs/research/pp_ece.pdf' },
        { dept: 'mech', url: 'https://gmrit.edu.in/PDFs/research/pp_mech.pdf' },
        { dept: 'it', url: 'https://gmrit.edu.in/PDFs/research/pp_it.pdf' },
        { dept: 'bsh', url: 'https://gmrit.edu.in/PDFs/research/pp_bsh.pdf' },
    ];
    
    const fetchTasks = [];
    for (const { dept, url } of publicationLinks) {
        const title = `Faculty Publications - ${dept.toUpperCase()}`;
        const category = `research_publications_${dept.replace(/[^a-z0-9]/g, '_')}`;
        fetchTasks.push(createPdfDocuments(url, title, category));
    }

    const results = await Promise.all(fetchTasks);
    results.forEach(pdfDocs => documents.push(...pdfDocs));

    return documents;
}

// -------------------------------------------------------------------
// -------------------- 4. Research Projects Scraper --------------------
// -------------------------------------------------------------------

export async function scrapeResearchProjects() {
    console.log('🚀 Starting Research Projects Scraper...');
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/research-projects.php`;
    const { data } = await fetchUrlContent(url);
    if (!data) return [];
    
    const $ = cheerio.load(data);
    
    // Targetting the tables in the "Ongoing Projects" and "Completed Projects" sections
    $('table.table-responsive.table-bordered tbody tr').each((i, el) => {
        const columns = $(el).find('td').map((_, td) => cleanText($(td).text())).get();
        
        // Assuming the columns are consistent across projects table:
        // [SL.No, Title, Funding Agency, PI & Co-PI, Objectives, Cost (Lakhs)]
        if (columns.length >= 6) {
            const projectDetails = {
                title: columns[1],
                fundingAgency: columns[2],
                piCoPi: columns[3],
                objectives: columns[4],
                cost: columns[5],
                projectType: $(el).closest('section').find('h2').text().includes('Ongoing') ? 'Ongoing' : 'Completed'
            };
            
            documents.push({
                pageContent: `Research Project (${projectDetails.projectType}): Title: ${projectDetails.title}. Funding: ${projectDetails.fundingAgency}. PI/Co-PI: ${projectDetails.piCoPi}. Objectives: ${projectDetails.objectives}. Cost: ${projectDetails.cost} Lakhs.`,
                metadata: {
                    title: `Research Project: ${projectDetails.title}`,
                    category: `research_projects_${projectDetails.projectType.toLowerCase()}`,
                    source: url,
                    docType: 'research_project_data',
                    cost: projectDetails.cost
                }
            });
        }
    });

    return documents;
}

// -------------------------------------------------------------------
// -------------------- 5. Grants Received Scraper --------------------
// -------------------------------------------------------------------

export async function scrapeGrantsReceived() {
    console.log('🚀 Starting Grants Received Scraper...');
    const url = `${COLLEGE_BASE_URL}/PDFs/research/grants_received.pdf`;
    
    // We rely on the PDF content extraction for this critical list
    return createPdfDocuments(url, 'Grants Received by Faculty', 'research_grants_received');
}

// -------------------------------------------------------------------
// -------------------- 6. Patents Scraper ----------------------------
// -------------------------------------------------------------------

export async function scrapePatents() {
    console.log('🚀 Starting Patents Scraper...');
    const documents = [];
    const mainUrl = `${COLLEGE_BASE_URL}/patents.php`;
    const { data } = await fetchUrlContent(mainUrl);
    if (!data) return [];
    
    const $ = cheerio.load(data);
    const patentLinks = [];

    // Find year-wise links for patent details (based on image_0a8f42.png)
    $('a[href*="research_patents_"]').each((i, el) => {
        const link = $(el).attr('href');
        const year = cleanText($(el).text()).match(/\d{4}/)?.[0];
        if (link && year) {
            const absoluteLink = new URL(link, mainUrl).href;
            patentLinks.push({ url: absoluteLink, year });
        }
    });

    // Scrape each year's table
    for (const linkItem of patentLinks) {
        const { data: patentData } = await fetchUrlContent(linkItem.url);
        if (patentData) {
            const $$ = cheerio.load(patentData);
            
            // Target the main table containing patent information (image_0a3d0b.jpg)
            $$('table.table-hover.table-bordered tbody tr').each((i, el) => {
                const columns = $$(el).find('td').map((_, td) => cleanText($$(td).text())).get();
                // Columns: [S.NO., INVENTOR NAME, BRANCH, PATENT TITLE, PATENT NUMBER]
                if (columns.length >= 5) {
                    const patentDetail = {
                        inventor: columns[1],
                        branch: columns[2],
                        title: columns[3],
                        number: columns[4]
                    };
                    
                    documents.push({
                        pageContent: `Patent Filed in ${linkItem.year}: Title: ${patentDetail.title}. Inventor: ${patentDetail.inventor}. Branch: ${patentDetail.branch}. Patent Number: ${patentDetail.number}.`,
                        metadata: {
                            title: `Patent: ${patentDetail.title} (${linkItem.year})`,
                            category: `research_patent_${linkItem.year}`,
                            source: linkItem.url,
                            docType: 'patent_record',
                            inventor: patentDetail.inventor,
                            branch: patentDetail.branch
                        }
                    });
                }
            });
        }
    }
    
    return documents;
}

// -------------------------------------------------------------------
// ------------------ CONSOLIDATED EXPORT FUNCTION -------------------
// -------------------------------------------------------------------

export async function scrapeAllResearchInfo() {
    const documents = [];
    
    documents.push(...await scrapeResearchOverview());
    documents.push(...await scrapeFacultyPublications());
    documents.push(...await scrapeResearchProjects());
    documents.push(...await scrapeGrantsReceived());
    documents.push(...await scrapePatents());

    console.log(`\n======================================================`);
    console.log(`✅ FINAL TOTAL: Scraped ${documents.length} Research & Development documents.`);
    console.log(`======================================================`);
    return documents;
}
