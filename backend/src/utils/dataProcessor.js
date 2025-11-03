// src/utils/dataProcessor.js

import dotenv from "dotenv";
dotenv.config();

/**
 * Uses an LLM to structure unstructured text into a JSON object.
 * @param {string} rawText - The raw, unstructured text to be processed.
 * @param {string} source - The source URL of the text.
 * @param {string} initialCategory - The initial category identified by the scraper.
 * @returns {Promise<object | null>} A structured JSON object or null if processing fails.
 */
export async function llmStructurizeData(rawText, source, initialCategory) {
    const prompt = `
    You are an expert data processor. Your task is to extract and structure the key information from the provided text into a clean JSON object.
    
    Instructions:
    - Identify the main topic and categorize the content.
    - Extract key entities like names, departments, titles, dates, URLs, and specific numbers.
    - Organize the information into a logical JSON structure.
    - If the text is irrelevant, return an empty JSON object.

    Example Input:
    "Name: Dr. A.Ganapathi Rao Designation: M.Phil., Ph.D. Assistant Professor Department: bsh Profile URL: https://gmrit.edu.in/profile.php?pernumber=52095"

    Example Output:
    {
      "category": "faculty",
      "name": "Dr. A.Ganapathi Rao",
      "designation": "Assistant Professor",
      "department": "bsh",
      "profile_url": "https://gmrit.edu.in/profile.php?pernumber=52095"
    }

    Raw Text:
    "${rawText}"
    `;

    const chatHistory = [{
        role: 'user',
        parts: [{
            text: prompt
        }]
    }];

    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'OBJECT',
                properties: {
                    "category": { "type": "STRING" },
                    "structured_data": { "type": "STRING" },
                    "entities": { "type": "ARRAY", "items": { "type": "OBJECT" } }
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
            return parsedJson;
        }
    } catch (error) {
        console.error('Error structuring data with LLM:', error);
    }
    
    return null;
}
