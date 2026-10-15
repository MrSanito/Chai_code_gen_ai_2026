
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const RiskSchema = z.object({
  title: z.string().describe("The actual title of the risk"),
  tags: z.array(z.string()).min(3).max(4)
    .describe("3-4 tags for this risk"),
  score: z.number().min(0).max(5)
    .describe("Risk score out of 5"),
});

// Multiple risks, not just one
const OutputSchema = z.array(RiskSchema);

const outputSchema = z.toJSONSchema(OutputSchema);

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: `
Extract all risks from the following document.

Document:
Our company recently launched a new software platform.
The platform relies on several third-party APIs that may experience downtime.
In addition, we are storing customer data in the cloud, and there are strict
regulatory requirements regarding data privacy and protection.
Some features are still in beta and could potentially introduce bugs
that affect user experience.

Return all identified risks.

Return a JSON array of risks.
Each item must contain:
- title: string
- tags: array of 3-4 strings
- score: number between 0 and 5

Do not use fields named "risk" or "description".
`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: outputSchema,
    },
  });

  console.log(response.text)
  if (!response.text) {
    throw new Error("Gemini returned an empty response");
  }


  const result = OutputSchema.parse(JSON.parse(response.text));

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
