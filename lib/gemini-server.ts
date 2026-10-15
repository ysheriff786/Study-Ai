import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Allowed non-deprecated models from system skill:
// gemini-3.1-flash-lite, gemini-flash-latest, gemini-3.8-flash
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export async function callGeminiWithFallback(
  promptOrContents: string | any[],
  config?: Record<string, any>
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = getGeminiClient();

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: promptOrContents,
        config: config || {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      const errMsg = err?.message || '';
      // Check if it's 429 quota exhaustion or model issue
      const isQuotaError = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      if (isQuotaError) {
        // Quietly advance to next candidate model
        continue;
      }
      // For any other unexpected error, also try next model
      continue;
    }
  }

  return null;
}
