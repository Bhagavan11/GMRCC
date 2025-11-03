import * as cheerio from 'cheerio';
import { fetchUrlContent, cleanText } from '../utils/util.js';

const COLLEGE_BASE_URL = 'https://gmrit.edu.in';

/**
 * Scrapes all current ranking achievements from the homepage and ranking pages.
 * Tries multiple approaches to find ranking information.
 */
export async function scrapeCurrentRankings() {
    console.log('🚀 Starting Rankings Scraper...');
    const documents = [];
    const urls = [
        `${COLLEGE_BASE_URL}/index.php`,
        `${COLLEGE_BASE_URL}/rankings.php`,
        `${COLLEGE_BASE_URL}/achievements.php`
    ];

    for (const url of urls) {
        try {
            console.log(`📡 Fetching rankings from: ${url}`);
            const { data } = await fetchUrlContent(url);
            if (!data) continue;
            
            const $ = cheerio.load(data);
            let foundRankings = false;

            // 1. Try multiple possible selectors for ranking cards
            const cardSelectors = [
                'div[class*="ranking"]',
                'div[class*="rank"]',
                'div[class*="achieve"]',
                '.card',
                '.panel',
                '.box'
            ];

            for (const selector of cardSelectors) {
                $(selector).each((i, el) => {
                    const $el = $(el);
                    const text = cleanText($el.text());
                    
                    // Look for ranking indicators in the text
                    if (text.match(/rank|ranking|rated|award|achievement|nba|naac|nirf|india today|times|outlook/i)) {
                        const title = $el.find('h1, h2, h3, h4, h5, h6, strong').first().text().trim() || 'Ranking Information';
                        const content = cleanText(text);
                        
                        if (content.length > 20) {  // Ensure we have meaningful content
                            documents.push({
                                pageContent: content,
                                metadata: {
                                    title: title,
                                    category: 'college_ranking',
                                    source: url,
                                    docType: 'ranking_info',
                                    scrapedAt: new Date().toISOString()
                                }
                            });
                            foundRankings = true;
                        }
                    }
                });
                
                if (foundRankings) break; // Stop if we found rankings with this selector
            }

            // 2. If no cards found, try to extract from tables
            if (!foundRankings) {
                $('table').each((i, table) => {
                    const $table = $(table);
                    const headers = [];
                    const rows = [];
                    
                    // Get headers
                    $table.find('th').each((i, th) => {
                        headers.push(cleanText($(th).text()));
                    });
                    
                    // Get rows
                    $table.find('tr').each((i, tr) => {
                        const row = [];
                        $(tr).find('td').each((j, td) => {
                            row.push(cleanText($(td).text()));
                        });
                        if (row.length > 0) rows.push(row);
                    });
                    
                    if (rows.length > 0) {
                        const content = [
                            headers.join(' | '),
                            ...rows.map(row => row.join(' | '))
                        ].join('\n');
                        
                        documents.push({
                            pageContent: content,
                            metadata: {
                                title: 'Ranking Data Table',
                                category: 'college_ranking',
                                source: url,
                                docType: 'ranking_table',
                                scrapedAt: new Date().toISOString(),
                                rowCount: rows.length
                            }
                        });
                        foundRankings = true;
                    }
                });
            }
            
            console.log(`✅ Found ${foundRankings ? 'some' : 'no'} rankings on ${url}`);
            
        } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error.message);
        }
    }

    // If no rankings found, add a placeholder
    if (documents.length === 0) {
        documents.push({
            pageContent: 'No ranking information could be found on the website.',
            metadata: {
                title: 'Ranking Information - Not Found',
                category: 'college_ranking',
                source: COLLEGE_BASE_URL,
                docType: 'ranking_info',
                scrapedAt: new Date().toISOString(),
                note: 'No ranking information could be found using automated methods.'
            }
        });
    }

    console.log(`✅ Scraped ${documents.length} ranking documents from all sources.`);
    return documents;
}

export async function scrapeAllRankingInfo() {
    try {
        const documents = await scrapeCurrentRankings();
        
        console.log('\n======================================================');
        console.log(`✅ FINAL TOTAL: Scraped ${documents.length} Ranking documents.`);
        console.log('======================================================');
        
        return documents;
    } catch (error) {
        console.error('❌ Error in scrapeAllRankingInfo:', error);
        return [{
            pageContent: 'Error occurred while scraping ranking information.',
            metadata: {
                title: 'Ranking Information - Error',
                category: 'college_ranking',
                source: COLLEGE_BASE_URL,
                docType: 'ranking_info',
                error: error.message,
                scrapedAt: new Date().toISOString()
            }
        }];
    }
}
