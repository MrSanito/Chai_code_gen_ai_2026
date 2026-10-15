import {GoogleGenAI} from '@google/genai';
import dotenv from "dotenv"

dotenv.config()
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents:   `
            what is 2 + 8989 equals?
              Examples :
            1. — what is 5 + 4?
               Expected Output: 9 (Nine)
            2. — what is 10 + 10?
               Expected Output: 20 (Twenty)
            3. — what is 2 + 2?
               Expected Output: 4 (Four)

`,
  });
  console.log(response.text);
}

try {
  await main();
} catch (error) {
  console.error(error);
}