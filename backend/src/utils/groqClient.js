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
        { role: 'system', content: 'You are a helpful assistant that answers only using the provided college info.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content.trim();
}
