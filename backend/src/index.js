import { startScraping } from './scraper_new.js';
import { uploadChunksToVectorDB } from './vector_db_uploader.js';

console.log("--- index.js: File started execution. ---");

// Run the scraper job
async function runScraperJob() {
    console.log(`[${new Date().toISOString()}] Starting data ingestion job...`);
    try {
        const runScraping = false; // Enable scraping
        let chunks = [];

        if (runScraping) {
            console.log(`[${new Date().toISOString()}] Scraping process initiated...`);
            console.log(`[${new Date().toISOString()}] Running scraping process...`);
            chunks = await startScraping();
            console.log(`[${new Date().toISOString()}] Scraping job completed. ${chunks.length} chunks generated.`);
        }

        console.log(`[${new Date().toISOString()}] Starting upload to Pinecone...`);
        await uploadChunksToVectorDB();
        console.log(`[${new Date().toISOString()}] Upload to Pinecone completed.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Data ingestion job failed:`, error);
    }
}

console.log(`[${new Date().toISOString()}] Application started.`);

// Run the scraper job
runScraperJob().catch(error => {
    console.error(`[${new Date().toISOString()}] Error in scraper job:`, error);
    process.exit(1);
});