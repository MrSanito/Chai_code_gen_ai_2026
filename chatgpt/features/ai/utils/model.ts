import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/** Default Gemini model used when a conversation has no model override. */
export const DEFAULT_CHAT_MODEL = "gemini-3.5-flash";

/**
 * Returns a LangChain ChatGoogleGenerativeAI instance for chat completions.
 *
 * @param modelId - Optional model identifier; falls back to {@link DEFAULT_CHAT_MODEL}.
 */
export function getChatModel(modelId?: string | null) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY or GEMINI_API_KEY environment variable");
  }

  return new ChatGoogleGenerativeAI({
    model: modelId || DEFAULT_CHAT_MODEL,
    temperature: 0.7,
    apiKey,
  });
}