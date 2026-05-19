import OpenAI from "openai";

export function getAiClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });
}

export function getAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
