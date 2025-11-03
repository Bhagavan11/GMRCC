import * as cheerio from 'cheerio';
import { fetchUrlContent, cleanText, extractTextFromPdf } from '../utils/util.js';
import { v4 as uuidv4 } from 'uuid';


const COLLEGE_BASE_URL = 'https://gmrit.edu.in';
const IRINS_URL = 'https://gmrit.irins.org/';


// Scrape payments page
export async function scrapePayments() {
    const documents = [];
    const paymentsUrl = `${COLLEGE_BASE_URL}/payments/`;
    
    const { data: paymentsHtml, contentType: paymentsContentType } = await fetchUrlContent(paymentsUrl);
    if (paymentsHtml && paymentsContentType.includes('text/html')) {
        const $ = cheerio.load(paymentsHtml);
        const paymentsContent = cleanText($('.container').text());
        documents.push({
            pageContent: `Online Payments Information: ${paymentsContent}`,
            metadata: {
                title: 'Online Payments Information',
                category: 'payments_info',
                source: paymentsUrl,
                docType: 'html_page'
            }
        });
    }

    return documents;
}

// Scrape IRINS data
export async function scrapeIRINS() {
    const documents = [];
    const irinsUrl = `https://gmrit.irins.org/`;
    
    const { data: irinsHtml, contentType: irinsContentType } = await fetchUrlContent(irinsUrl);
    if (irinsHtml && irinsContentType.includes('text/html')) {
        const $ = cheerio.load(irinsHtml);
        const irinsContent = cleanText($('body').text());
        documents.push({
            pageContent: `IRINS Research Profile: ${irinsContent}`,
            metadata: {
                title: 'IRINS Research Profile',
                category: 'research',
                source: irinsUrl,
                docType: 'html_page'
            }
        });
    }

    return documents;
}

// Scrape PG programs
export async function scrapePGPrograms() {
    const documents = [];
    const pgOverviewUrl = `${COLLEGE_BASE_URL}/pgOverview.php`;
    
    const { data: pgHtml, contentType: pgContentType } = await fetchUrlContent(pgOverviewUrl);
    if (!pgHtml || !pgContentType.includes('text/html')) {
        console.warn(`⚠️ Failed to fetch PG programs page: ${pgOverviewUrl}`);
        return [];
    }

    const $ = cheerio.load(pgHtml);
    
    const overviewText = cleanText($('.container').first().text());
    documents.push({
        pageContent: `PG Programs Overview: ${overviewText}`,
        metadata: {
            title: 'PG Programs Overview',
            category: 'pg_programs_overview',
            source: pgOverviewUrl,
            docType: 'html_page'
        }
    });

    const programLinks = [];
    $('div.mycard-title a').each((i, el) => {
        const linkHref = $(el).attr('href');
        const linkText = cleanText($(el).text());
        if (linkHref && linkText) {
            programLinks.push({ link: new URL(linkHref, pgOverviewUrl).href, title: linkText });
        }
    });

    for (const program of programLinks) {
        const { data: programHtml, contentType: programContentType } = await fetchUrlContent(program.link);
        if (programHtml && programContentType.includes('text/html')) {
            const $$ = cheerio.load(programHtml);
            const programTitle = cleanText($$('h1').first().text());
            const programContent = cleanText($$('.container').text());
            
            documents.push({
                pageContent: `PG Program: ${programTitle}. ${programContent}`,
                metadata: {
                    title: `PG Program: ${programTitle}`,
                    category: 'pg_program',
                    source: program.link,
                    docType: 'html_page_section'
                }
            });
        }
    }
    
    return documents;
}

// Scrape results links
export async function scrapeResultsLink() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/examination/results.php`;
    
    documents.push({
        pageContent: `Results are available on the official examination portal.`,
        metadata: {
            title: 'Examination Results',
            category: 'examination_results',
            source: url,
            docType: 'html_page',
            link: url
        }
    });

    return documents;
}

// Scrape hostels information
export async function scrapeHostelInfo() {
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

    return documents;
}

// Scrape academic regulations
export async function scrapeAcademicRegulations() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/academic_regulations.php`;
    
    documents.push({
        pageContent: `Academic Regulations: The official academic regulations are available at the following link.`,
        metadata: {
            title: 'Academic Regulations',
            category: 'academic_regulations',
            source: url,
            docType: 'html_page',
            link: url
        }
    });

    return documents;
}


export async function scrapeAllAdditionalInfo() {
    const documents = [];
    
    documents.push(...await scrapePayments());
    documents.push(...await scrapeIRINS());
    documents.push(...await scrapePGPrograms());
    documents.push(...await scrapeResultsLink());
    documents.push(...await scrapeHostelInfo());
    documents.push(...await scrapeAcademicRegulations());
    
    return documents;
}
