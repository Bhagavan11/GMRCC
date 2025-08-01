import CollegeInfo from '../models/CollegeInfo.js';
import Faculty from '../models/Faculty.js';
import { embedText } from '../utils/embedding.js';
import { askGroq } from '../utils/groqClient.js';
import { classifyIntent } from '../utils/intentClassifier.js';
import KnowledgeBase from '../models/KnowledgeBase.js';

export async function queryCollegeBot(req, res) {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    // Step 1: Classify intent using Hugging Face
    // const { label: intent } = await classifyIntent(question);
    // console.log('🔍 Classified Intent:', intent);

    // Step 2: Embed the question
    const queryEmbedding = await embedText(question);
    console.log('🔍 Query embedding generated');

    let results = [];
    let context = '';
    results = await KnowledgeBase.aggregate([
        {
          $vectorSearch: {
            index: 'Knowledge_index',  // ✅ Your actual index name
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 10,
            limit: 3,
          },
        },
      ]);
      context = results.map(r => `${r.title}:\n${r.content}`).join('\n\n');
      console.log('🔍 Vector search results:', results.length,results);

    
    const prompt = `Answer the following question using only the context below.\n\nContext:\n${context}\n\nQuestion: ${question} if the context contains and url please mention them effectivly make sure main gap betwwen links`;
    const answer = await askGroq(prompt);

    res.json({ question, answer, contextUsed: context });
  } catch (err) {
    console.error('❌ Error processing query:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
