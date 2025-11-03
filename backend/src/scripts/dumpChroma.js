import fs from "fs";
import path from "path";
import { ChromaClient } from "chromadb";

// ✅ same connection code you already use
const client = new ChromaClient({
  path: "http://localhost:8000", // don’t change this if your chroma runs locally
});

async function dumpChroma() {
  try {
    const collection = await client.getCollection({
      name: "college_knowledge_base",
    });

    console.log("Connected to collection:", collection.name);

    let allDocs = [];
    let offset = 0;
    const batchSize = 1000; // process in batches

    while (true) {
      const results = await collection.get({
        limit: batchSize,
        offset,
      });

      if (!results || !results.documents || results.documents.length === 0) {
        break; // stop when no more records
      }

      results.documents.forEach((doc, idx) => {
        const meta = results.metadatas[idx] || {};
        const id = results.ids[idx];
        allDocs.push(
          `ID: ${id}\nMetadata: ${JSON.stringify(meta)}\nContent:\n${doc}\n\n---\n`
        );
      });

      console.log(`Fetched batch with ${results.documents.length} records`);
      offset += batchSize;
    }

    console.log(`\n✅ Total records fetched: ${allDocs.length}`);

    // save to TXT file
    const filePath = path.resolve("chroma_dump.txt");
    fs.writeFileSync(filePath, allDocs.join("\n"), "utf-8");

    console.log(`\n📂 Data saved to: ${filePath}`);
  } catch (err) {
    console.error("❌ Error dumping Chroma:", err);
  }
}

dumpChroma();
