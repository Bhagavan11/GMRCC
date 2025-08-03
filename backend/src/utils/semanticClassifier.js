// src/services/semanticClassifier.js

import { generateEmbedding } from '../clients/embeddingClient.js';
import cosineSimilarity from 'compute-cosine-similarity';

// Define the categories and their descriptive sentences
const CATEGORY_DESCRIPTIONS = {
    'faculty': 'Questions about college faculty, professors, their qualifications, or contact information.',
    'college_info': 'General questions about the college, its founding, location, or history,established .',
    'department_info': 'Questions about specific departments, their programs, or syllabus.',
    'college_events': 'Questions about upcoming or past college events and activities.',
    'placements': 'Questions about college placements, companies, or placement records.',
    'hostel_info': 'Questions about hostel facilities, fees, or regulations.',
    'payments_info': 'Questions about college fee payments, portals, or structures.',
    'research': 'Questions about research and development activities or the research cell.',
    'accreditation': 'Questions about college accreditations like NAAC or NBA.',
    'ranking': 'Questions about the college’s national or state rankings.',
    'examination_results': 'Questions about examination results or result portals.',
    'examination_timetables': 'Questions about exam timetables, schedules, or dates.',
    'college_notifications': 'Questions about general college notifications or circulars.',
    'academic_calendar': 'Questions about the academic calendar or holidays.',
    'examination_regulations': 'Questions about exam regulations or rules.',
    'old_question_papers': 'Questions about old question papers or exam papers portal.',
    'examination_evaluation': 'Questions about exam evaluation or revaluation.',
    'student_activities_overview': 'Questions about student clubs, bodies, or extension activities.',
    'student_council': 'Questions about the student council or student leadership.',
    'professional_bodies': 'Questions about professional student bodies and organizations.',
    'student_clubs': 'Questions about student clubs, their activities, or membership.',
    'nss_extension_activities': 'Questions about NSS and other extension activities.',
    'student_policy': 'Questions about student policies or rules, like the IT policy.',
    'student_incentives': 'Questions about student incentives or awards.',
};

// A cache for the pre-embedded category descriptions
let embeddedDescriptions = null;

/**
 * Initializes and embeds all category descriptions.
 */
async function initializeEmbeddings() {
    if (!embeddedDescriptions) {
        console.log('Initializing category embeddings for semantic classification...');
        const categories = Object.keys(CATEGORY_DESCRIPTIONS);
        const descriptions = Object.values(CATEGORY_DESCRIPTIONS);
        const embeddings = await Promise.all(descriptions.map(desc => generateEmbedding(desc)));

        embeddedDescriptions = {};
        categories.forEach((cat, index) => {
            embeddedDescriptions[cat] = embeddings[index];
        });
        console.log('Category embeddings initialized.');
    }
}


/**
 * Classifies a user's query into one of the predefined categories using semantic search.
 * @param {string} query - The user's query.
 * @returns {Promise<string>} The classified category name or 'none' if confidence is low.
 */
export async function classifyQuery(query) {
    if (!embeddedDescriptions) {
        await initializeEmbeddings();
    }

    const queryEmbedding = await generateEmbedding(query);
    let bestMatchCategory = 'none';
    let highestSimilarity = 0.0;

    for (const category in embeddedDescriptions) {
        if (Object.prototype.hasOwnProperty.call(embeddedDescriptions, category)) {
            const descriptionEmbedding = embeddedDescriptions[category];
            // Compute cosine similarity between query and category description
            const similarity = cosineSimilarity(queryEmbedding, descriptionEmbedding);
            
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatchCategory = category;
            }
        }
    }
    
    // You can set a threshold here if you want to be more strict
    if (highestSimilarity > 0.6) { // A reasonable threshold for a confident match
        console.log(`Classified query into category: '${bestMatchCategory}' with confidence: ${highestSimilarity}`);
        return bestMatchCategory;
    }

    return 'none'; // Default to no category if confidence is low
}

// Ensure embeddings are initialized on startup
initializeEmbeddings();
