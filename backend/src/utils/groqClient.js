// utils/groqClient.js
import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function askGroq(prompt) {
    console.log('🔍 Asking Groq with prompt:', prompt);
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL,
      messages: [
        { 
          role: 'system', 
          content: `You are a helpful assistant that provides information about GMR Institute of Technology. 
          - Always format links using markdown syntax: [link text](https://example.com)
          - Never use HTML tags like <a> or HTML entities
          - If you need to include a URL, make it a clickable markdown link
          - Use clear and descriptive link text
          - Only use the provided college information to answer questions` 
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

