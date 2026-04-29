import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiModel = (modelName: string = "gemini-2.0-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};
