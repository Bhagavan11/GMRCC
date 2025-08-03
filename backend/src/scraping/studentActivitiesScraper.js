// src/scrapers/studentActivitiesScraper.js
import { fetchUrlContent, cleanText, extractTextFromPdf } from '../utils/util.js';
import * as cheerio from 'cheerio';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

async function scrapeGenericHtmlPage(url, category, title) {
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return null;
    }
    const $ = cheerio.load(data);
    // Attempt to get the main content, ignoring header/footer/nav
    $('script, style, header, footer, nav, .sidebar, .menu, .ad').remove();
    const content = cleanText($('body').text()); // Adjust selector if a more specific content area exists

    if (!content || content.length < 50) {
        console.warn(`❗ No substantial content found on ${title} page: ${url}`);
        return null;
    }

    return {
        pageContent: content,
        metadata: {
            title: title,
            category: category,
            source: url,
            docType: 'html_page'
        }
    };
}

async function scrapePdfDocument(url, category, title) {
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
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/hostels.php`, 'hostel_info', 'Hostel Facilities');
}

export async function scrapeTechMag() {
    // This page likely lists issues of a magazine. We might want to parse each issue.
    // For now, we'll get the main page content, or if it lists links to PDFs, we'll handle those.
    // Examine the page structure for actual PDF links within tables/lists.
    const url = `${COLLEGE_BASE_URL}/techmag.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    const documents = [];
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

    // Look for direct PDF links for individual magazine issues
    $('a[href$=".pdf"]').each((i, el) => {
        const link = $(el).attr('href');
        const title = cleanText($(el).text()) || `Tech Magazine Issue ${i+1}`;
        if (link) {
            const absoluteLink = link.startsWith('http') ? link : `${COLLEGE_BASE_URL}/${link}`;
            documents.push({
                link: absoluteLink, // Store as link to be processed by main scraper
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

export async function scrapeStudentActivitiesIndex() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/studentActivities/index.php`, 'student_activities_overview', 'Student Activities Overview');
}

export async function scrapeStudentCouncil() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/studentActivities/studentcouncil.php`, 'student_council', 'Student Council');
}

export async function scrapeProfessionalBodies() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/studentActivities/studentActivityPage.php?type=Professional_Bodies`, 'professional_bodies', 'Professional Bodies');
}

export async function scrapeStudentClubs() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/studentActivities/studentActivityPage.php?type=Student_Clubs`, 'student_clubs', 'Student Clubs');
}

export async function scrapeNSS() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/studentActivities/nss.php?type=Extension_Activities`, 'nss_extension_activities', 'NSS & Extension Activities');
}

export async function scrapeITPolicyForStudents() {
    return await scrapePdfDocument(`${COLLEGE_BASE_URL}/PDFs/student_activities/it_policy_for_students.pdf`, 'student_policy', 'IT Policy for Students');
}

export async function scrapeStudentIncentives() {
    return await scrapePdfDocument(`${COLLEGE_BASE_URL}/documents/student_incentives.pdf`, 'student_incentives', 'Student Incentives');
}

export async function scrapeEvents() {
    const url = `${COLLEGE_BASE_URL}/nb_events.php`;
    const { data, contentType } = await fetchUrlContent(url);
    if (!data || !contentType.includes('text/html')) {
        console.warn(`⚠️ Could not fetch or parse HTML for ${url}`);
        return [];
    }
    const $ = cheerio.load(data);
    const documents = [];

    // Assuming events are listed in a structure like a table or divs
    $('.events_list .event_box').each((i, el) => { // Adjust selector based on actual structure
        const title = cleanText($(el).find('.event_title').text());
        const date = cleanText($(el).find('.event_date').text());
        const description = cleanText($(el).find('.event_description').text());
        const link = $(el).find('a').attr('href'); // If there's a "read more" link

        let eventContent = `Event Title: ${title}\nDate: ${date}\nDescription: ${description}`;
        let eventSource = url;

        if (link) {
          const absoluteLink = link.startsWith('http') ? link : `${COLLEGE_BASE_URL}/${link}`;
          eventContent += `\nRead More: ${absoluteLink}`;
          eventSource = absoluteLink; // Use the specific event link as source
        }

        if (title && description) {
            documents.push({
                pageContent: eventContent,
                metadata: {
                    title: `Event: ${title}`,
                    category: 'college_events',
                    source: eventSource,
                    docType: 'event_details',
                    eventDate: date
                }
            });
        }
    });
    console.log(`✅ Scraped ${documents.length} events.`);
    return documents;
}

export async function scrapeNAAC() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/naac.php`, 'naac_info', 'NAAC Accreditation Information');
}

export async function scrapeNBA() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/nba.php`, 'nba_info', 'NBA Accreditation Information');
}

export async function scrapePaymentsPage() {
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/payments/`, 'payments_info', 'Online Payments Information');
}

export async function scrapePlacementsPageGeneric() { // Different from the data table one
    return await scrapeGenericHtmlPage(`${COLLEGE_BASE_URL}/placements.php`, 'placements_overview', 'Placement Overview Page');
}

export async function scrapeAllStudentRelatedInfo() {
    const documents = [];

    const hostels = await scrapeHostels();
    if (hostels) documents.push(hostels);

    const techMagItems = await scrapeTechMag();
    documents.push(...techMagItems);

    const studentActivitiesIndex = await scrapeStudentActivitiesIndex();
    if (studentActivitiesIndex) documents.push(studentActivitiesIndex);

    const studentCouncil = await scrapeStudentCouncil();
    if (studentCouncil) documents.push(studentCouncil);

    const professionalBodies = await scrapeProfessionalBodies();
    if (professionalBodies) documents.push(professionalBodies);

    const studentClubs = await scrapeStudentClubs();
    if (studentClubs) documents.push(studentClubs);

    const nss = await scrapeNSS();
    if (nss) documents.push(nss);

    const itPolicy = await scrapeITPolicyForStudents();
    if (itPolicy) documents.push(itPolicy);

    const studentIncentives = await scrapeStudentIncentives();
    if (studentIncentives) documents.push(studentIncentives);

    const events = await scrapeEvents();
    documents.push(...events);

    const naac = await scrapeNAAC();
    if (naac) documents.push(naac);

    const nba = await scrapeNBA();
    if (nba) documents.push(nba);

    const payments = await scrapePaymentsPage();
    if (payments) documents.push(payments);

    const placementsGeneric = await scrapePlacementsPageGeneric();
    if (placementsGeneric) documents.push(placementsGeneric);

    console.log(`✅ Scraped student-related and general info: ${documents.length} items.`);
    return documents;
}