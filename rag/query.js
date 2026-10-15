import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const client = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash",
  apiKey,
});
 

async function query(userQuery) {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey,
  });
// vector store 
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: "http://localhost:6333",
    collectionName: "chaicode-docs",
  });
// only retrieve top 5 results

  const retriever = vectorStore.asRetriever({ k: 5 });

  // actual search 
  const results = await retriever.invoke(userQuery);
  console.log(`results done `)

  const context = results
    .map((e) => `Page ${e.metadata?.loc?.pageNumber ?? "unknown"}:\n${e.pageContent}`)
    .join("\n\n");

  const SYSTEM_PROMPT = `
You are an expert in answering user queries based only on the provided context.
Do not answer anything beyond what is provided.
Answer briefly and mention the page number where the content is available.

Context:
${context}
`;

console.log(`llm searching....`)

  const response = await client.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userQuery },
  ]);

   console.log(`llm search result...`)

  console.log(response.content);
}

query("what is one to one model");