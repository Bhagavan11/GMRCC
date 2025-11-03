import cron from 'node-cron';
import { startScraping } from './src/scraper.js';
import { uploadChunksToVectorDB } from './src/vector_db_uploader.js';

// Configuration
const CONFIG = {
    // Run at 11:40 AM daily (IST)
    SCHEDULE: '40 11 * * *',
    TIMEZONE: 'Asia/Kolkata',
    RUN_IMMEDIATELY: true
};

// Main scraping function
async function runScrapingJob() {
    const startTime = new Date();
    console.log(`\n=== Starting Scraping Job at ${startTime.toISOString()} ===`);
    
    try {
        // Run the scraper
        console.log('Starting scraping process...');
        const chunks = await startScraping();
        console.log(`Scraping completed. Processed ${chunks.length} chunks.`);
        
        // Upload to vector DB
        console.log('Starting upload to Pinecone...');
        await uploadChunksToVectorDB();
        
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000; // in seconds
        console.log(`\n=== Job completed in ${duration.toFixed(2)} seconds ===`);
        console.log(`Next run scheduled for: ${scheduler.nextDate().toISOString()}\n`);
        
    } catch (error) {
        console.error('Error in scraping job:', error);
    }
}

// Initialize the scheduler
console.log('Initializing Auto-Scraper...');
console.log(`Current time: ${new Date().toISOString()}`);
console.log(`Scheduled time: ${CONFIG.SCHEDULE} (${CONFIG.TIMEZONE})`);
console.log(`Run immediately on start: ${CONFIG.RUN_IMMEDIATELY}\n`);

// Create the cron job
let scheduler;

try {
    // Create the cron job
    scheduler = cron.schedule(
        CONFIG.SCHEDULE,
        () => {
            console.log(`\n=== Scheduled job triggered at ${new Date().toISOString()} ===`);
            runScrapingJob().catch(console.error);
        },
        {
            scheduled: true,
            timezone: CONFIG.TIMEZONE
        }
    );

    // Get the next run time
    const nextRun = new Date();
    const [hours, minutes] = CONFIG.SCHEDULE.split(' ');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If the scheduled time for today has passed, set it for tomorrow
    if (nextRun < new Date()) {
        nextRun.setDate(nextRun.getDate() + 1);
    }

    console.log(`Auto-Scraper initialized. Next run at: ${nextRun.toISOString()}`);
    
    // Run immediately if configured to do so
    if (CONFIG.RUN_IMMEDIATELY) {
        console.log('\n=== Running initial job immediately ===');
        await runScrapingJob();
    }

    // Handle process termination
    process.on('SIGINT', async () => {
        console.log('\nShutting down scheduler...');
        if (scheduler) {
            scheduler.stop();
            console.log('Scheduler stopped.');
        }
        console.log('Goodbye!');
        process.exit(0);
    });

} catch (error) {
    console.error('Failed to initialize scheduler:', error);
    process.exit(1);
}
