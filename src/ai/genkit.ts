
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit initialization for server-side AI processing.
 * 
 * Note: The API key is securely retrieved from environment variables.
 * This file is intended for use in Server Actions and API routes only.
 */

if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn('Warning: GOOGLE_GENAI_API_KEY is not defined in environment variables.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
