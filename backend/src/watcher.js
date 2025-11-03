// backend/src/watcher.js
import chokidar from 'chokidar';
import { processAndUpload } from './pinecone/uploader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Watch for new files
const watcher = chokidar.watch(`${UPLOADS_DIR}/*.{xlsx,xls}`, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
});

console.log(`👀 Watching for new Excel files in ${UPLOADS_DIR}...`);

watcher
    .on('add', async (path) => {
        console.log(`\n📥 New file detected: ${path}`);
        try {
            await processAndUpload();
            console.log('✅ Processing complete');
        } catch (error) {
            console.error('❌ Error processing file:', error);
        }
    })
    .on('error', error => console.error('Watcher error:', error));

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down watcher...');
    watcher.close().then(() => process.exit(0));
});