import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization for server-side AI processing.
 * 
 * The API key is retrieved from GOOGLE_GENAI_API_KEY in .env.
 * This file uses the 'googleAI' plugin which is the current standard for Genkit 1.x.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  // We don't log the key for security, but we alert that it's missing.
  console.error('CRITICAL: GOOGLE_GENAI_API_KEY is not defined in the environment.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  // Using gemini-2.5-flash for clinical reasoning tasks
  model: 'googleai/gemini-2.5-flash',
});
