import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from '@langchain/qdrant';
import dotenv from "dotenv";

dotenv.config();

async function generateVectorEmbeddingsForFile(filePath) {
    const loader = new PDFLoader(filePath || "./rag/test.pdf");
    const doc = await loader.load(); // already data with pages
    console.log(`Loaded ${doc.length} document pages from PDF.`); // already gives chunked data

    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "gemini-embedding-001",
        apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    });
console.log(doc)
    const vectoreStore = await QdrantVectorStore.fromExistingCollection(
        embeddings, // use this embedding model 
        {
            url: 'http://localhost:6333',
            collectionName: 'chaicode-docs'
        }
    );

    await vectoreStore.addDocuments(doc);
    console.log('All the documents are indexed....');
}

generateVectorEmbeddingsForFile();

