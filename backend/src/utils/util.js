// src/utils.js
import https from "https";
import pdf from "pdf-parse";
import axios from "axios"; // Import axios here too for fetchUrlContent

export const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Cleans extracted text by removing multiple spaces, newlines, and trimming.
 * @param {string} text - The raw text to clean.
 * @returns {string} The cleaned text.
 */
export function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extracts text from a Cheerio selection.
 * @param {CheerioAPI} $ - Cheerio instance.
 * @param {string} selector - CSS selector.
 * @returns {string} Cleaned text from the selected elements.
 */
export function extractTextFromSelector($, selector) {
    return $(selector).map((i, el) => $(el).text().trim()).get().join(' ').replace(/\s+/g, ' ');
}

/**
 * Extracts text from a PDF buffer.
 * @param {Buffer} pdfBuffer - The buffer containing the PDF data.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 */
export async function extractTextFromPdf(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        return cleanText(data.text);
    } catch (error) {
        console.error('Error extracting text from PDF:', error.message);
        return null;
    }
}

/**
 * Fetches content from a URL.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<{data: Buffer|string, contentType: string}>} - The content and its type.
 */
export async function fetchUrlContent(url) {
    const USER_AGENT = 'CampusConnectChatbot/1.0 (+https://gmrit.edu.in/contact)'; // Identify your scraper
    try {
        console.log(`Fetching: ${url}`);
        const response = await axios.get(url, {
            responseType: 'arraybuffer', // Get as buffer for PDFs, or string for HTML
            httpsAgent: httpsAgent,
            headers: {
                'User-Agent': USER_AGENT
            },
            timeout: 20000 // 20 seconds timeout
        });

        const contentType = response.headers['content-type'] || '';
        const data = contentType.includes('text/html') ? response.data.toString('utf8') : response.data; // Decode HTML
        return { data, contentType };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching ${url}: ${error.message} (Status: ${error.response?.status})`);
        } else {
            console.error(`Unexpected error fetching ${url}:`, error.message);
        }
        return { data: null, contentType: '' };
    }
}