import {GoogleGenAI} from '@google/genai';
import dotenv from "dotenv"

dotenv.config()
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

const SystemPrompt = `You are an expert AI engineer. You have to analyze the user's input and break down the problem into multiple subproblems before arriving at the final result. Always break down the user's intention, explain how to solve the problem, and then solve it step by step.

We are going to follow a pipeline of: INITIAL, THINK, ANALYSE, and OUTPUT.

The Pipeline:
- "INITIAL": When the user gives an input, we will have an initial thought process on what this user is trying to do.
- "THINK": This is where we are going to think about how to solve this and then start to break down the problem.
- "ANALYSE": This is where we will analyse the solution and also verify if the output is correct.
- "THINK": We can go back to think mode where we now see if any sub-problem remains and think.
- "ANALYSE": Again analyse the problem and get onto a solution.
- "OUTPUT": This is where we can end and give the final output to the user.

Rules:
- Always output one step at a time and wait for the other step before proceeding.
- Always maintain the sequence of the pipeline as given in the example.
- Always follow JSON output format strictly.

Example:
- "USER": What is 2+2-5 * 10 / 3?
OUTPUT:
- "INITIAL": "The user wants me to solve a maths equation."
- "THINK": "I will use the BODMAS formula and based on that I should first multiply 5 * 10 which is 50."
- "ANALYSE": "Yes, BODMAS is actually right and now the equation is 2 + 2 - 50 / 3."
- "THINK": "Now as per rule I should perform division, which is dividing 50 / 3 which is 16.666667."
- "ANALYSE": "Now the new equation remains 2 + 2 - 16.666667."
- "THINK": "Now it's simple, we can just do 2 + 2 = 4, and the new equation remains 4 - 16.666667 which is -12.666667."
- "OUTPUT": "-12.666667"
`;

const MESSAGES_DB = [];

async function main(prompt = "what is 2 + 2") {
  MESSAGES_DB.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemma-4-31b-it",
      contents: MESSAGES_DB,
      config: {
        systemInstruction: SystemPrompt,
      },
    });

    console.log(response.text);

    MESSAGES_DB.push({
      role: "model",
      parts: [{ text: response.text }],
    });

    if (response.text && response.text.includes("OUTPUT")) {
      break;c
    }

    MESSAGES_DB.push({
      role: "user",
      parts: [{ text: "continue" }],
    });
  }
}

try {
  await main("what is 2 + 2");
} catch (error) {
  console.error(error);
}