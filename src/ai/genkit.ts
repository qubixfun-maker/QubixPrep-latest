import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization for server-side AI processing in QubixPrep.
 * 
 * Explicitly passes the API key from environment variables and forces 
 * the use of the Gemini 2.5 Flash model for efficient, free-tier processing.
 */
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: apiKey }),
  ],
  // Explicitly set the default model to a Flash variant
  model: 'googleai/gemini-2.5-flash', 
});