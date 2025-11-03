import https from "https";
import pdf from "pdf-parse";
import axios from "axios";
import fs from 'fs/promises';
import path from 'path';

export const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

export function extractTextFromSelector($, selector) {
    return $(selector).map((i, el) => $(el).text().trim()).get().join(' ').replace(/\s+/g, ' ');
}

export async function extractTextFromPdf(pdfBuffer) {
    try {
        const data = await pdf(pdfBuffer);
        return cleanText(data.text);
    } catch (error) {
        console.error('Error extracting text from PDF:', error.message);
        return null;
    }
}

// A list to store failed URLs
const failedUrls = [];
const FAILED_URLS_PATH = path.join(process.cwd(), 'data', 'failed_urls.json');

/**
 * Fetches content from a URL.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<{data: Buffer|string, contentType: string}>} - The content and its type.
 */
export async function fetchUrlContent(url) {
    const USER_AGENT = 'CampusConnectChatbot/1.0 (+https://gmrit.edu.in/contact)';
    try {
        console.log(`Fetching: ${url}`);
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            httpsAgent: httpsAgent,
            headers: {
                'User-Agent': USER_AGENT
            },
            timeout: 20000
        });

        const contentType = response.headers['content-type'] || '';
        const data = contentType.includes('text/html') ? response.data.toString('utf8') : response.data;
        return { data, contentType };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching ${url}: ${error.message} (Status: ${error.response?.status})`);
        } else {
            console.error(`Unexpected error fetching ${url}:`, error.message);
        }
        failedUrls.push({
            url: url,
            status: error.response?.status || 'network_error',
            message: error.message
        });
        return { data: null, contentType: '' };
    }
}

export async function saveFailedUrls() {
    if (failedUrls.length > 0) {
        await fs.writeFile(FAILED_URLS_PATH, JSON.stringify(failedUrls, null, 2), 'utf8');
        console.log(`⚠️ Saved ${failedUrls.length} failed URLs to ${FAILED_URLS_PATH}`);
    }
}
