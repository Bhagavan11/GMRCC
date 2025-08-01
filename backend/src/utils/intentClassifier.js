import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;

// Candidate labels shown to the model
const candidateLabels = [
  'college info',
  'faculty',
];

// Mapping labels to your internal keys
const labelMap = {
  'college info': 'college_info',
  'faculty': 'faculty_info',
};

export async function classifyIntent(userInput) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: userInput,
        parameters: { candidate_labels: candidateLabels },
      }),
    }
  );

  const result = await response.json();

  if (result.error) throw new Error(result.error);

  const topLabel = result.labels[0];
  const score = result.scores[0];

  // Map label to your system's internal intent name
  const mappedIntent = labelMap[topLabel] || 'unknown';

  return { label: mappedIntent, score };
}
