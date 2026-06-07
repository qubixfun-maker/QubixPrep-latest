import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit initialization for server-side AI processing.
 * 
 * The API key is explicitly passed from GOOGLE_GENAI_API_KEY in the environment.
 * This ensures the key is handled securely on the server and never exposed to the client.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Using gemini-2.5-flash for clinical reasoning tasks
  model: 'googleai/gemini-2.5-flash',
});
