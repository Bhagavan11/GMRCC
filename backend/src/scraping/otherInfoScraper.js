import axios from 'axios';
import * as cheerio from 'cheerio';
import { httpsAgent, cleanText, fetchUrlContent } from '../utils/util.js';

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

// Helper to extract text from a specific section given its heading
function extractSectionContent($, headingText) {
    const headingElement = $(`h4:contains("${headingText}"), h5:contains("${headingText}"), h3:contains("${headingText}")`);
    if (headingElement.length > 0) {
        let content = headingElement.next('div, p').text() || headingElement.closest('div').text();
        if (!content || cleanText(content).length < 50) {
            const tabPaneId = headingElement.closest('.tab-pane').attr('id');
            if (tabPaneId) {
                content = $(`#${tabPaneId}`).text();
            }
        }
        return cleanText(content);
    }
    return '';
}

// Helper to extract PDF links from a specific section
function extractPdfLinks($, sectionSelector, categoryPrefix, sourceUrl) {
    const links = [];
    const seen = new Set();
    $(sectionSelector).find('a[href$=".pdf"]').each((i, el) => {
        const linkHref = $(el).attr('href');
        const linkText = cleanText($(el).text());
        if (!linkHref) return;
        const absoluteLink = buildAbsolute(linkHref, sourceUrl);
        if (!absoluteLink || seen.has(absoluteLink)) return;
        seen.add(absoluteLink);
        const title = `${categoryPrefix}: ${linkText || absoluteLink.split('/').pop()}`;
        links.push({
            link: absoluteLink,
            type: 'pdf_link',
            pageContent: '',
            metadata: {
                title,
                category: categoryPrefix,
                source: sourceUrl,
                docType: 'pdf_document'
            }
        });
    });
    return links;
}

export async function scrapeEvents() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/nb_events.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for events page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    // Target rows in the event table
    $('table.table tbody tr').each((i, el) => {
        const title = cleanText($(el).find('td:nth-child(2)').text()); // Assuming title is in second column
        const date = cleanText($(el).find('td:nth-child(3)').text()); // Assuming date is in third column
        const brochureLink = $(el).find('a:contains("Brochure")').attr('href');

        let eventContent = `Event: ${title}, Date: ${date}.`;
        if (brochureLink) {
            const abs = buildAbsolute(brochureLink, url);
            if (abs) {
                eventContent += ` Brochure: ${abs}`;
                documents.push({
                    link: abs,
                    type: 'pdf_link',
                    pageContent: '',
                    metadata: {
                        title: `Event Brochure: ${title}`,
                        category: 'college_events_brochure',
                        source: url,
                        docType: 'pdf_document'
                    }
                });
            }
        }
        
        if (title.length > 10) { // Ensure meaningful event
            documents.push({
                pageContent: eventContent,
                metadata: {
                    title: `Event: ${title}`,
                    category: 'college_events',
                    source: url,
                    docType: 'event_listing',
                    eventDate: date
                }
            });
        }
    });
    console.log(`✅ Scraped ${documents.length} event documents.`);
    return documents;
}

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
    console.log(`✅ Scraped hostel information.`);
    return documents;
}

export async function scrapeContactInfo() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/contact.php`; // Assuming a contact page exists
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for contact page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    const address = cleanText($('.address-section').text() || $('address').text());
    const phone = cleanText($('.phone-section').text() || $('[href^="tel:"]').first().text());
    const email = cleanText($('.email-section').text() || $('[href^="mailto:"]').first().text());

    const contactContent = `Contact Information: Address: ${address}, Phone: ${phone}, Email: ${email}`;
    if (contactContent.length > 50) {
        documents.push({
            pageContent: contactContent,
            metadata: {
                title: 'GMRIT Contact Information',
                category: 'contact_info',
                source: url,
                docType: 'html_page'
            }
        });
    }
    console.log(`✅ Scraped contact information.`);
    return documents;
}

export async function scrapePhysicalResources() {
    const documents = [];

    // Scrape Labs
    const labsUrl = `${COLLEGE_BASE_URL}/labs.php`;
    const { data: labsHtml, contentType: labsContentType } = await fetchUrlContent(labsUrl);
    if (labsHtml && labsContentType.includes('text/html')) {
        const $ = cheerio.load(labsHtml);
        $('table').each((i, table) => {
            const tableTitle = cleanText($(table).prev('h4, h3').text() || `Lab Table ${i + 1}`);
            const tableContent = cleanText($(table).text());
            if (tableContent.length > 50) {
                documents.push({
                    pageContent: `Lab Information - ${tableTitle}: ${tableContent}`,
                    metadata: {
                        title: `Lab: ${tableTitle}`,
                        category: 'resources_labs',
                        source: labsUrl,
                        docType: 'html_table_content'
                    }
                });
            }
        });
    } else {
        console.warn(`⚠️ Could not fetch or parse HTML for labs page: ${labsUrl}`);
    }

    // Scrape Library
    const libraryUrl = `${COLLEGE_BASE_URL}/library.php`;
    const { data: libraryHtml, contentType: libraryContentType } = await fetchUrlContent(libraryUrl);
    if (libraryHtml && libraryContentType.includes('text/html')) {
        const $ = cheerio.load(libraryHtml);
        const libraryContent = cleanText($('.container').text());
        if (libraryContent.length > 50) {
            documents.push({
                pageContent: `Library Information: ${libraryContent}`,
                metadata: {
                    title: 'GMRIT Library',
                    category: 'resources_library',
                    source: libraryUrl,
                    docType: 'html_page'
                }
            });
        }
    } else {
        console.warn(`⚠️ Could not fetch or parse HTML for library page: ${libraryUrl}`);
    }
    
    console.log(`✅ Scraped physical resources (labs, library).`);
    return documents;
}

export async function scrapeDownloadables() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/index.php#notifications`; // Assuming download links are here

    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for downloadables page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    // Target common download sections or specific links
    // This is a generic approach; you might need to refine selectors for each page.
    $('a[href*=".pdf"], a[href*=".doc"], a[href*=".docx"], a[href*=".xlsx"]').each((i, el) => {
        const linkHref = $(el).attr('href')?.trim();
        const linkText = cleanText($(el).text());
        
        // Filter out irrelevant links like images, or nav links
        if (linkHref && linkText && !linkHref.includes('images/') && linkText.length > 5) {
            const absoluteLink = buildAbsolute(linkHref, url);
            if (absoluteLink) {
                documents.push({
                    link: absoluteLink,
                    type: 'download_link',
                    pageContent: '',
                    metadata: {
                        title: `Downloadable: ${linkText}`,
                        category: 'downloadables',
                        source: url,
                        docType: absoluteLink.endsWith('.pdf') ? 'pdf_document' : 'file_download'
                    }
                });
            }
        }
    });

    console.log(`✅ Scraped ${documents.length} downloadable links.`);
    return documents;
}

export async function scrapeAlumniInfo() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/alumni.php`; // Assuming an alumni page exists
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for alumni page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    const mainContent = cleanText($('.container').text());
    if (mainContent.length > 50) {
        documents.push({
            pageContent: `Alumni Information: ${mainContent}`,
            metadata: {
                title: 'GMRIT Alumni Information',
                category: 'alumni_info',
                source: url,
                docType: 'html_page'
            }
        });
    }
    console.log(`✅ Scraped alumni information.`);
    return documents;
}

// NEW FUNCTION: Scrape rankings/accreditations from homepage notification marquee
export async function scrapeHomepageRankings() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/index.php`; // Homepage URL
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for homepage: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    // Target the specific marquee notification divs
    $('div.link-notification.scroll-marquee-tag').each((i, el) => {
        const textContent = cleanText($(el).text());
        if (textContent.length > 20) { // Ensure it's a meaningful entry
            documents.push({
                pageContent: `GMRIT Ranking/Achievement: ${textContent}`,
                metadata: {
                    title: `Homepage Ranking/Achievement ${i + 1}`,
                    category: 'ranking_achievement_homepage', // New specific category
                    source: url,
                    docType: 'html_marquee_content'
                }
            });
        }
    });
    console.log(`✅ Scraped ${documents.length} homepage ranking/achievement entries.`);
    return documents;
}

// NEW FUNCTION: Scrape key statistics from homepage "Current Info" section
export async function scrapePaymentDetails() {
    const documents = [];
    const url = 'https://gmrit.edu.in/payments/';
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for payment page: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    
    const paymentContent = cleanText($('.container').text());
    if (paymentContent.length > 50) {
        documents.push({
            pageContent: `Payment Information: ${paymentContent}`,
            metadata: {
                title: 'GMRIT Online Payment Details',
                category: 'payment_info',
                source: url,
                docType: 'html_page'
            }
        });
    }
    console.log(`✅ Scraped payment information.`);
    return documents;
}
export async function scrapeHomepageKeyStats() {
    const documents = [];
    const url = `${COLLEGE_BASE_URL}/index.php`; // Homepage URL
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for homepage: ${url}`);
        return [];
    }
    const $ = cheerio.load(data);

    // Target the highlight-info boxes
    $('.highlight-info').each((i, el) => {
        const value = cleanText($(el).find('.counter').text());
        const label = cleanText($(el).find('h3').text());
        if (value && label) {
            documents.push({
                pageContent: `GMRIT Key Statistic: ${label}: ${value}`,
                metadata: {
                    title: `Homepage Statistic: ${label}`,
                    category: 'college_stats_homepage', // New specific category
                    source: url,
                    docType: 'html_key_statistic',
                    statistic_name: label,
                    statistic_value: value
                }
            });
        }
    });
    console.log(`✅ Scraped ${documents.length} homepage key statistics.`);
    return documents;
}


// Consolidate all new scrapers
export async function scrapeAllOtherInfo() {
    const documents = [];

    const events = await scrapeEvents();
    documents.push(...events);

    const hostelInfo = await scrapeHostelInfo();
    documents.push(...hostelInfo);

    const contactInfo = await scrapeContactInfo();
    documents.push(...contactInfo);

    const resources = await scrapePhysicalResources();
    documents.push(...resources);

    const downloadables = await scrapeDownloadables();
    documents.push(...downloadables);

    const alumniInfo = await scrapeAlumniInfo();
    documents.push(...alumniInfo);
    
    const homepageRankings = await scrapeHomepageRankings();
    documents.push(...homepageRankings);

    const homepageKeyStats = await scrapeHomepageKeyStats(); // CALL THE NEW FUNCTION
    documents.push(...homepageKeyStats);

    const paymentDetails = await scrapePaymentDetails();
    documents.push(...paymentDetails);

    console.log(`✅ Scraped all other general information: ${documents.length} documents.`);
    return documents;
}
