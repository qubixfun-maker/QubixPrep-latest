import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization for server-side AI processing.
 * 
 * Explicitly draws the API key from environment variables (GOOGLE_GENAI_API_KEY or GEMINI_API_KEY).
 * Forces the use of the Gemini 2.5 Flash model for efficient processing.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }),
  ],
  model: 'googleai/gemini-2.5-flash', 
});