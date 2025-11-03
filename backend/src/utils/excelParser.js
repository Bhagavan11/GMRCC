// backend/src/utils/excelParser.js
import * as XLSX from 'xlsx';
import { generateEmbedding } from '../clients/embeddingClient.js';

/**
 * Parse Excel buffer into sheets with rows
 * @param {Buffer} buffer - Excel file buffer
 * @returns {Object} Object with sheet names as keys and arrays of rows as values
 */
export function parseExcel(buffer) {
    try {
        const workbook = XLSX.read(buffer, { 
            type: 'buffer',
            cellDates: true,
            cellNF: false,
            cellText: false
        });

        return workbook.SheetNames.reduce((acc, sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            acc[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            return acc;
        }, {});
    } catch (error) {
        console.error('Error parsing Excel file:', error);
        throw new Error('Failed to parse Excel file');
    }
}

/**
 * Process Excel data into chunks with proper category handling
 * @param {Object} sheets - Object with sheet data from parseExcel
 * @param {string} defaultCategory - Default category if not specified in data
 * @returns {Object} Object with categories and their chunks
 */
export function processExcelData(sheets, defaultCategory = 'general') {
    const result = {
        categories: new Set(),
        chunks: []
    };

    for (const [sheetName, rows] of Object.entries(sheets)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;

        // Get headers (first row)
        const headers = rows[0] ? Object.keys(rows[0]) : [];
        
        // Process each row as a separate chunk
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;

            // Extract category from row or use sheet name or default
            const category = (row.category || sheetName || defaultCategory)
                .toString()
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');

            // Create chunk content
            const content = headers
                .filter(header => header !== 'category' && row[header])
                .map(header => `${header}: ${row[header]}`)
                .join('\n');

            if (!content.trim()) continue;

            // Add to results
            result.categories.add(category);
            result.chunks.push({
                id: `excel-${category}-${sheetName}-${i}`,
                content,
                metadata: {
                    source: 'excel',
                    category,
                    sheet: sheetName,
                    row: i + 1,
                    ...Object.fromEntries(
                        Object.entries(row).filter(([key]) => key !== 'content')
                    )
                }
            });
        }
    }

    // Convert Set to array for final output
    result.categories = Array.from(result.categories);
    return result;
}

/**
 * Convert Excel chunks to vector format for Pinecone
 * @param {Array} chunks - Array of chunk objects from processExcelData
 * @returns {Promise<Array>} Array of vector objects ready for Pinecone
 */
export async function chunksToVectors(chunks) {
    const vectors = [];
    
    for (const chunk of chunks) {
        try {
            const embedding = await generateEmbedding(chunk.content);
            
            vectors.push({
                id: chunk.id,
                values: embedding,
                metadata: {
                    ...chunk.metadata,
                    text: chunk.content,
                    processedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
        }
    }

    return vectors;
}

/**
 * Main function to process Excel file to vectors
 * @param {Buffer} buffer - Excel file buffer
 * @param {string} defaultCategory - Default category if not specified in data
 * @returns {Promise<Object>} Object containing vectors and categories
 */
export async function excelToVectors(buffer, defaultCategory = 'general') {
    const sheets = parseExcel(buffer);
    const { chunks, categories } = processExcelData(sheets, defaultCategory);
    const vectors = await chunksToVectors(chunks);
    
    return {
        vectors,
        categories,
        totalChunks: chunks.length,
        processedAt: new Date().toISOString()
    };
}