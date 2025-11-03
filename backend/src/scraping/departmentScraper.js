import axios from 'axios';
import * as cheerio from 'cheerio';
import { httpsAgent, cleanText, fetchUrlContent } from '../utils/util.js';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

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
        let absoluteLink = null;
        try {
            const u = new URL(linkHref, sourceUrl);
            if (u.hostname.includes('gmrit.eedu.in')) {
                u.hostname = 'gmrit.edu.in';
            }
            absoluteLink = u.href;
        } catch (_) {
            return; // skip malformed
        }
        if (seen.has(absoluteLink)) return; // dedupe
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

export async function scrapeDepartmentDetails(deptCode) {
    const documents = [];
    const departmentUrl = `${COLLEGE_BASE_URL}/department.php?code=${deptCode}`;

    const { data: deptHtml, contentType } = await fetchUrlContent(departmentUrl);
    if (!deptHtml || !contentType.includes('text/html')) {
        console.warn(`⚠️ Failed to fetch department page for ${deptCode}.`);
        return [];
    }

    const $ = cheerio.load(deptHtml);
    const deptName = cleanText($('h1').first().text());

    // 1. Overview/About (Main content area)
    const overviewContent = cleanText($('.container').first().text());
    if (overviewContent.length > 100) {
        documents.push({
            pageContent: `Department of ${deptName} Overview: ${overviewContent}`,
            metadata: {
                title: `${deptName} Overview`,
                category: `department_info_${deptCode}`,
                source: departmentUrl,
                docType: 'html_page_overview',
                departmentCode: deptCode
            }
        });
    }

    // 2. Vision
    const visionContent = extractSectionContent($, 'Vision');
    if (visionContent) {
        documents.push({
            pageContent: `Vision of ${deptName}: ${visionContent}`,
            metadata: {
                title: `${deptName} Vision`,
                category: `department_vision_${deptCode}`,
                source: departmentUrl,
                docType: 'html_page_section',
                departmentCode: deptCode
            }
        });
    }

    // 3. Mission
    const missionContent = extractSectionContent($, 'Mission');
    if (missionContent) {
        documents.push({
            pageContent: `Mission of ${deptName}: ${missionContent}`,
            metadata: {
                title: `${deptName} Mission`,
                category: `department_mission_${deptCode}`,
                source: departmentUrl,
                docType: 'html_page_section',
                departmentCode: deptCode
            }
        });
    }

    // 4. Head of the Department (HOD) Info
    const hodName = cleanText($('.hod-details h4').text());
    const hodDesignation = cleanText($('.hod-details p').text());
    const hodMessage = cleanText($('h5:contains("Head of the Department")').next('p').text());
    if (hodName) {
        documents.push({
            pageContent: `Head of Department (${deptName}): Name: ${hodName}, Designation: ${hodDesignation}. Message: ${hodMessage}`,
            metadata: {
                title: `${deptName} HOD: ${hodName}`,
                category: `department_hod_${deptCode}`,
                source: departmentUrl,
                docType: 'html_page_section',
                departmentCode: deptCode,
                hodName: hodName
            }
        });
    }

    // 5. Program Outcomes (POs) & Program Specific Outcomes (PSOs)
    const poPsoContent = extractSectionContent($, 'Program Outcomes (POs) & Program Specific Outcomes (PSOs)');
    if (poPsoContent) {
        documents.push({
            pageContent: `${deptName} Program Outcomes (POs) and Program Specific Outcomes (PSOs): ${poPsoContent}`,
            metadata: {
                title: `${deptName} POs & PSOs`,
                category: `department_po_pso_${deptCode}`,
                source: departmentUrl,
                docType: 'html_page_section',
                departmentCode: deptCode
            }
        });
    }

    // 6. Highlights / Achievements (from the Highlights section)
    const highlightsContent = extractSectionContent($, 'Highlights');
    if (highlightsContent) {
        documents.push({
            pageContent: `${deptName} Highlights: ${highlightsContent}`,
            metadata: {
                title: `${deptName} Highlights`,
                category: `department_highlights_${deptCode}`,
                source: departmentUrl,
                docType: 'html_page_section',
                departmentCode: deptCode
            }
        });
    }
    
    // 7. Syllabus (PDF links) - Corrected selector
    const syllabusLinks = extractPdfLinks($, 'h1:contains("Download Regular Syllabus") ~ div', `syllabus_${deptCode}`, departmentUrl);
    documents.push(...syllabusLinks);
    if (syllabusLinks.length > 0) {
        console.log(`Found ${syllabusLinks.length} syllabus PDF links for ${deptName}.`);
    } else {
        console.warn(`❗ No direct syllabus PDF links found for ${deptName}.`);
    }

    // 8. Newsletter (PDF links) - Corrected selector
    const newsletterLinks = extractPdfLinks($, 'h1:contains("Newsletter") ~ div', `newsletter_${deptCode}`, departmentUrl);
    documents.push(...newsletterLinks);
    if (newsletterLinks.length > 0) {
        console.log(`Found ${newsletterLinks.length} newsletter PDF links for ${deptName}.`);
    }

    // 9. Open Electives Syllabus (PDF links) - Corrected selector
    const openElectivesLinks = extractPdfLinks($, 'h1:contains("Open Electives Syllabus") ~ div', `open_electives_${deptCode}`, departmentUrl);
    documents.push(...openElectivesLinks);
    if (openElectivesLinks.length > 0) {
        console.log(`Found ${openElectivesLinks.length} open electives PDF links for ${deptName}.`);
    }

    console.log(`✅ Scraped ${documents.length} detailed documents for ${deptName} department.`);
    return documents;
}

// Consolidating function to scrape all departments
export async function scrapeAllDepartments() {
    const documents = [];
    const deptCodes = ['cse', 'ece', 'eee', 'civil', 'mech', 'it', 'aiml', 'aids', 'bsh'];
    for (const code of deptCodes) {
        const deptDocs = await scrapeDepartmentDetails(code);
        documents.push(...deptDocs);
    }
    return documents;
}


// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import { httpsAgent, cleanText, fetchUrlContent } from '../utils/util.js';

// const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

// // Helper to extract text from a specific section given its heading
// function extractSectionContent($, headingText) {
//     const headingElement = $(`h4:contains("${headingText}"), h5:contains("${headingText}"), h3:contains("${headingText}")`);
//     if (headingElement.length > 0) {
//         // Try to find content in the immediate next element (p, div, ul)
//         let content = headingElement.next('div, p, ul').text();
        
//         // Fallback 1: If the immediate sibling is empty, try the parent container's text
//         if (!content || cleanText(content).length < 20) {
//              content = headingElement.parent().text();
//         }
        
//         // Fallback 2: Check if it's within a tab pane
//         if (!content || cleanText(content).length < 20) {
//             const tabPaneId = headingElement.closest('.tab-pane').attr('id');
//             if (tabPaneId) {
//                 content = $(`#${tabPaneId}`).text();
//             }
//         }
//         return cleanText(content);
//     }
//     return '';
// }

// // Helper to extract PDF links from a specific section
// function extractPdfLinks($, sectionSelector, categoryPrefix, sourceUrl) {
//     const links = [];
//     const seen = new Set();
//     $(sectionSelector).find('a[href$=".pdf"]').each((i, el) => {
//         const linkHref = $(el).attr('href');
//         const linkText = cleanText($(el).text());
//         if (!linkHref) return;
//         let absoluteLink = null;
//         try {
//             const u = new URL(linkHref, sourceUrl);
//             if (u.hostname.includes('gmrit.eedu.in')) {
//                 u.hostname = 'gmrit.edu.in';
//             }
//             absoluteLink = u.href;
//         } catch (_) {
//             return; // skip malformed
//         }
//         if (seen.has(absoluteLink)) return; // dedupe
//         seen.add(absoluteLink);
//         const title = `${categoryPrefix}: ${linkText || absoluteLink.split('/').pop()}`;
//         links.push({
//             link: absoluteLink,
//             type: 'pdf_link',
//             pageContent: '',
//             metadata: {
//                 title,
//                 category: categoryPrefix,
//                 source: sourceUrl,
//                 docType: 'pdf_document'
//             }
//         });
//     });
//     return links;
// }

// export async function scrapeDepartmentDetails(deptCode) {
//     const documents = [];
//     const departmentUrl = `${COLLEGE_BASE_URL}/department.php?code=${deptCode}`;

//     const { data: deptHtml, contentType } = await fetchUrlContent(departmentUrl);
//     if (!deptHtml || !contentType?.includes('text/html')) {
//         console.warn(`⚠️ Failed to fetch department page for ${deptCode}.`);
//         return [];
//     }

//     const $ = cheerio.load(deptHtml);
//     const deptName = cleanText($('h1').first().text());

//     // Base Category
//     const baseCategory = `department_${deptCode}`;

//     // ------------------- 1. Overview/About -------------------
//     // Targeting the main content area (excluding navigation and footer)
//     const overviewContainer = $('.container').first();
//     const overviewContent = cleanText(overviewContainer.text());
    
//     if (overviewContent.length > 100) {
//         documents.push({
//             pageContent: `Department of ${deptName} Overview: ${overviewContent}`,
//             metadata: {
//                 title: `${deptName} Overview`,
//                 category: `${baseCategory}_info`,
//                 source: departmentUrl,
//                 docType: 'html_page_overview',
//                 departmentCode: deptCode
//             }
//         });
//     }

//     // ------------------- 2. Vision and Mission -------------------
//     const visionContent = extractSectionContent($, 'Vision');
//     const missionContent = extractSectionContent($, 'Mission');

//     if (visionContent || missionContent) {
//         documents.push({
//             pageContent: `Department of ${deptName} Vision: ${visionContent}. Mission: ${missionContent}`,
//             metadata: {
//                 title: `${deptName} Vision & Mission`,
//                 category: `${baseCategory}_vision_mission`,
//                 source: departmentUrl,
//                 docType: 'html_page_section',
//                 departmentCode: deptCode
//             }
//         });
//     }

//     // ------------------- 3. HOD Info -------------------
//     const hodName = cleanText($('.hod-details h4').text());
//     const hodDesignation = cleanText($('.hod-details p').text());
//     const hodMessage = cleanText($('h5:contains("Head of the Department")').next('p').text());
    
//     if (hodName) {
//         documents.push({
//             pageContent: `Head of Department (${deptName}): Name: ${hodName}, Designation: ${hodDesignation}. Message: ${hodMessage}`,
//             metadata: {
//                 title: `${deptName} HOD: ${hodName}`,
//                 category: `${baseCategory}_hod`,
//                 source: departmentUrl,
//                 docType: 'html_page_section',
//                 departmentCode: deptCode,
//                 hodName: hodName
//             }
//         });
//     }

//     // ------------------- 4. PEOs & POs/PSOs -------------------
//     const peoPsoContainer = $('h3:contains("Program Educational Objectives")').closest('.row, .container');
    
//     // Program Educational Objectives (PEOs)
//     const peoContent = extractSectionContent($, 'Program Educational Objectives');
//     if (peoContent) {
//          documents.push({
//             pageContent: `${deptName} Program Educational Objectives (PEOs): ${peoContent}`,
//             metadata: {
//                 title: `${deptName} PEOs`,
//                 category: `${baseCategory}_peo`,
//                 source: departmentUrl,
//                 docType: 'html_page_section',
//                 departmentCode: deptCode
//             }
//         });
//     }

//     // Program Outcomes (POs) & Program Specific Outcomes (PSOs)
//     const poPsoContent = extractSectionContent($, 'Program Specific Outcomes');
//     if (poPsoContent) {
//         documents.push({
//             pageContent: `${deptName} Program Outcomes (POs) and Program Specific Outcomes (PSOs): ${poPsoContent}`,
//             metadata: {
//                 title: `${deptName} POs & PSOs`,
//                 category: `${baseCategory}_po_pso`,
//                 source: departmentUrl,
//                 docType: 'html_page_section',
//                 departmentCode: deptCode
//             }
//         });
//     }
    
//     // ------------------- 5. Highlights / Achievements (Placements, Research) -------------------
//     // Targeting the Highlights section (e.g., max package, placements %, research stats)
//     const highlightsContainer = $('.highlightsContainer').first();
//     const highlightsContent = cleanText(highlightsContainer.text());
    
//     // Fallback: If highlights are not in the .highlightsContainer, extract from the general 'Highlights' heading
//     const genericHighlights = extractSectionContent($, 'Highlights');

//     if (highlightsContent.length > 50) {
//         documents.push({
//             pageContent: `${deptName} Highlights (Placements/Research/Achievements): ${highlightsContent}`,
//             metadata: {
//                 title: `${deptName} Highlights & Achievements`,
//                 category: `${baseCategory}_highlights`,
//                 source: departmentUrl,
//                 docType: 'html_page_highlights',
//                 departmentCode: deptCode
//             }
//         });
//     } else if (genericHighlights) {
//         documents.push({
//             pageContent: `${deptName} Highlights: ${genericHighlights}`,
//             metadata: {
//                 title: `${deptName} Highlights`,
//                 category: `${baseCategory}_highlights`,
//                 source: departmentUrl,
//                 docType: 'html_page_highlights_generic',
//                 departmentCode: deptCode
//             }
//         });
//     }


//     // ------------------- 6. Syllabus, Newsletter, Open Electives (PDF Links) -------------------
    
//     // Syllabus (PDF links) - Targeting links in the main content area for 'Syllabus'
//     const syllabusLinks = extractPdfLinks($, '.container', `syllabus_${deptCode}`, departmentUrl);
//     documents.push(...syllabusLinks);
//     if (syllabusLinks.length > 0) {
//         console.log(`Found ${syllabusLinks.length} syllabus PDF links for ${deptName}.`);
//     }

//     // Newsletter (PDF links) - Targeting links in the main content area for 'Newsletter'
//     const newsletterLinks = extractPdfLinks($, '.container', `newsletter_${deptCode}`, departmentUrl);
//     documents.push(...newsletterLinks);
//     if (newsletterLinks.length > 0) {
//         console.log(`Found ${newsletterLinks.length} newsletter PDF links for ${deptName}.`);
//     }

//     // Open Electives Syllabus (PDF links) - Targeting links in the main content area for 'Open Electives'
//     const openElectivesLinks = extractPdfLinks($, '.container', `open_electives_${deptCode}`, departmentUrl);
//     documents.push(...openElectivesLinks);
//     if (openElectivesLinks.length > 0) {
//         console.log(`Found ${openElectivesLinks.length} open electives PDF links for ${deptName}.`);
//     }


//     console.log(`✅ Scraped ${documents.length} detailed documents for ${deptName} department.`);
//     return documents;
// }

// // Consolidating function to scrape all departments
// export async function scrapeAllDepartments() {
//     console.log(`\n======================================================`);
//     console.log(`| STARTING ALL DEPARTMENT DETAILS SCRAPERS |`);
//     console.log(`======================================================`);
    
//     const documents = [];
//     const deptCodes = ['cse', 'ece', 'eee', 'civil', 'mech', 'it', 'aiml', 'aids'];
    
//     for (const code of deptCodes) {
//         const deptDocs = await scrapeDepartmentDetails(code);
//         documents.push(...deptDocs);
//     }
    
//     console.log(`\n======================================================`);
//     console.log(`✅ FINAL TOTAL: Scraped ${documents.length} department details documents.`);
//     console.log(`======================================================`);
//     return documents;
// }
