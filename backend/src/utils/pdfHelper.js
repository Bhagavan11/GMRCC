// utils/pdfHelper.js
import axios from 'axios';
import pdf from 'pdf-parse';

export async function extractTextFromPDF(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const data = await pdf(response.data);
    return data.text.replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.error('❌ Failed to extract PDF:', url, err.message);
    return '';
  }
}
