// src/index.js
import cron from 'node-cron';
import { startScraping } from './scraper.js'; // Your scraper logic
import { uploadChunksToVectorDB } from './vector_db_uploader.js'; // Import the new uploader

console.log("--- index.js: File started execution. ---");

const SCRAPE_CRON_SCHEDULE = '0 0 * * *'; // Runs daily at midnight (00:00)

async function runScraperJob() {
    console.log(`[${new Date().toISOString()}] Starting scheduled data ingestion job...`);
    try {
        // Configuration: Set to 'true' to run scraping, 'false' to skip for upload-only test
        const runScraping = false; // <<< Set this to false for current test (upload only)

        let chunks = []; // Initialize chunks to an empty array
        if (runScraping) {
            console.log(`[${new Date().toISOString()}] Running scraping process...`);
            chunks = await startScraping();
            console.log(`[${new Date().toISOString()}] Scraping job completed. ${chunks.length} chunks generated.`);
        } else {
            console.log(`[${new Date().toISOString()}] Skipping scraping for this test run (as configured).`);
            // No need to log chunks.length if scraping is skipped and 'chunks' isn't explicitly returned/used here.
        }

        // 2. Upload the scraped chunks to ChromaDB (THIS PART WILL ALWAYS RUN)
        console.log(`[${new Date().toISOString()}] Starting upload to ChromaDB...`);
        await uploadChunksToVectorDB(); // This function will read from scraped_chunks.json
        console.log(`[${new Date().toISOString()}] Upload to ChromaDB completed.`);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Data ingestion job failed:`, error);
    }
}

// Schedule the job
console.log(`--- index.js: Scheduler setup. ---`);
cron.schedule(SCRAPE_CRON_SCHEDULE, () => {
    console.log(`[${new Date().toISOString()}] Triggering scheduled run...`);
    runScraperJob();
});

// Run immediately once when the application starts
console.log("--- index.js: Calling runScraperJob() immediately on startup. ---");
runScraperJob(); // <<< THIS CALL IS UNCOMMENTED TO START THE PROCESS NOW
console.log("--- index.js: Script finished initial setup. ---");