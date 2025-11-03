import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';  // Import XLSX
import { getCategoryDisplayName, saveNewCategories } from '../config/categories.js';
import { generateEmbedding } from '../clients/embeddingClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Initialize Pinecone
const pineconeApiKey = process.env.PINECONE_API_KEY || "pcsk_2sGW3u_JYXfEvRqEDEeaxYvrvtGuciDPY9ERSMx29wz5oNpPW87u6PkS6Zs67QChuqdq7W";
const pinecone = new Pinecone({ apiKey: pineconeApiKey });
const indexName = process.env.PINECONE_INDEX || 'gmrit-bot';
const index = pinecone.index(indexName);

async function getIndexStats() {
  try {
    const stats = await index.describeIndexStats();
    console.log('\n📊 Current Index Statistics:');
    console.log(`- Total Vectors: ${stats.totalVectorCount}`);
    console.log(`- Dimensions: ${stats.dimension}`);
    console.log(`- Index Fullness: ${stats.indexFullness || 'N/A'}`);
    if (stats.namespaces) {
      console.log('\n📂 Namespace Counts:');
      Object.entries(stats.namespaces).forEach(([namespace, { vectorCount }]) => {
        console.log(`  - ${namespace}: ${vectorCount} vectors`);
      });
    }
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error.message);
    return null;
  }
}

function normalizeCategory(rawCategory) {
  if (!rawCategory || typeof rawCategory !== 'string') return 'general';
  return rawCategory
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function processAndUpload() {
  const uploadStats = {
    totalFiles: 0,
    totalRecords: 0,
    files: {},
    categories: new Set(),
  };

  try {
    const statsBefore = await getIndexStats();
    const files = await fs.readdir(UPLOADS_DIR);
    const excelFiles = files.filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    );

    if (excelFiles.length === 0) {
      console.log('No Excel files found in uploads directory');
      return;
    }

    console.log(`Found ${excelFiles.length} Excel file(s) to process`);

    for (const file of excelFiles) {
      const filePath = path.join(UPLOADS_DIR, file);
      const targetDir = path.join(UPLOADS_DIR, 'processed');
      const failedDir = path.join(UPLOADS_DIR, 'failed');

      try {
        console.log(`\n📂 Processing file: ${file}`);
        const buffer = await fs.readFile(filePath);
        
        console.log('🔨 Processing Excel data...');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (data.length <= 1) {
          console.log('⚠️ No data found in file');
          await moveFile(filePath, failedDir);
          continue;
        }

        const headers = data[0].map(h => h || '');
        const rows = data.slice(1);
        const category = path.basename(file, path.extname(file)).toLowerCase();
        
        console.log(`📊 Found ${rows.length} rows to process...`);
        const vectors = [];
        
        for (const row of rows) {
          try {
            const rowText = row
              .map((cell, index) => 
                cell ? `${headers[index] || `Column${index+1}`}: ${cell}` : ''
              )
              .filter(Boolean)
              .join('\n');
              
            if (!rowText.trim()) continue;

            const embedding = await generateEmbedding(rowText);
            
vectors.push({
  id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  values: embedding,
  metadata: {
    text: rowText,
    source: file,
    category,
    rowData: JSON.stringify(
      Object.fromEntries(
        headers.map((header, i) => [header, String(row[i] || '')])
      )
    )
  }
});
          } catch (error) {
            console.error('Error processing row:', error.message);
          }
        }

        if (vectors.length === 0) {
          throw new Error('No valid vectors generated from file');
        }

        console.log(`🚀 Uploading ${vectors.length} vectors in batches of 50...`);
        for (let i = 0; i < vectors.length; i += 50) {
          const batch = vectors.slice(i, i + 50);
          await index.upsert(batch);
          process.stdout.write(`\r  Uploaded ${Math.min(i + 50, vectors.length)}/${vectors.length} records...`);
        }
        console.log('\n✅ Successfully uploaded', vectors.length, 'records');

        uploadStats.files[file] = {
          status: 'success',
          records: vectors.length,
        };
        uploadStats.totalFiles++;
        uploadStats.totalRecords += vectors.length;
        uploadStats.categories.add(category);

        await fs.mkdir(targetDir, { recursive: true });
        const processedPath = path.join(targetDir, `${Date.now()}_${file}`);
        await fs.rename(filePath, processedPath);
        console.log(`📦 Moved to: ${processedPath}`);

      } catch (error) {
        console.error(`\n❌ Error processing ${file}:`, error.message);
        if (!uploadStats.files[file]) uploadStats.files[file] = {};
        uploadStats.files[file].status = 'failed';
        uploadStats.files[file].error = error.message;

        await fs.mkdir(failedDir, { recursive: true });
        const failedPath = path.join(failedDir, `${Date.now()}_${file}`);
        await fs.rename(filePath, failedPath);
        console.log(`⚠️  Moved failed file to: ${failedPath}`);
      }
    }

    console.log('\n📊 Final Statistics:');
    console.log('='.repeat(50));
    console.log(`📂 Total Files Processed: ${uploadStats.totalFiles}`);
    console.log(`📝 Total Records Uploaded: ${uploadStats.totalRecords}`);

    const statsAfter = await getIndexStats();
    if (statsBefore && statsAfter) {
      const recordsAdded = statsAfter.totalVectorCount - (statsBefore.totalVectorCount || 0);
      console.log(`\n📈 Total Vectors in Index: ${statsAfter.totalVectorCount} (+${recordsAdded})`);
    }

    return { success: true, ...uploadStats };

  } catch (error) {
    console.error('\n❌ Fatal error in processAndUpload:', error);
    return { success: false, error: error.message, stack: error.stack };
  }
}

async function moveFile(source, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, path.basename(source));
  await fs.rename(source, targetPath);
  return targetPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processAndUpload().catch(console.error);
}

export { processAndUpload };