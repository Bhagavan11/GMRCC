// src/services/intentClassifier.js
import dotenv from 'dotenv';
dotenv.config();
// The valid categories for classification
const VALID_CATEGORIES = [
    'faculty_cse', 
    'faculty_ece',
    'faculty_eee',
    'faculty_civil',
    'faculty_mech',
    'faculty_it',
    'faculty_aiml',
    'faculty_aids',
    'faculty_bsh',
    'faculty_admin',
    'faculty_hod',
    'college_info', 
    'department_info', 
    'college_events', 
    'placement_overview',
    'placement_record',
    'hostel_info', 
    'payments_info', 
    'research', 
    'accreditation', 
    'ranking', 
    'examination_results', 
    'examination_timetables', 
    'college_notifications', 
    'academic_calendar', 
    'examination_regulations', 
    'old_question_papers', 
    'examination_evaluation', 
    'student_activities_overview', 
    'student_council', 
    'professional_bodies', 
    'student_clubs', 
    'nss_extension_activities', 
    'student_policy', 
    'student_incentives', 
];

/**
 * Classifies a user's query into one of the predefined categories using an LLM.
 * @param {string} query - The user's query.
 * @returns {Promise<string>} The classified category or 'none' if no category fits.
 */
export async function classifyQueryWithLLM(query) {
    const chatHistory = [{
        role: 'user',
        parts: [{
            text: `Classify the following user query into one of the following categories: ${VALID_CATEGORIES.join(', ')}. If none of the categories fit, respond with 'none'.\n\nUser Query: "${query}"`
        }]
    }];

    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'OBJECT',
                properties: {
                    "category": { "type": "STRING" }
                }
            }
        }
    };
    
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (jsonString) {
            const parsedJson = JSON.parse(jsonString);
            const classifiedCategory = parsedJson.category;

            if (VALID_CATEGORIES.includes(classifiedCategory)) {
                return classifiedCategory;
            }
        }
    } catch (error) {
        console.error('Error classifying query with LLM:', error);
    }

    return 'none';
}
