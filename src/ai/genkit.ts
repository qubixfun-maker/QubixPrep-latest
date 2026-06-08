
import { genkit } from 'genkit';
import { groq } from 'genkitx-groq';

/**
 * Genkit initialization for Groq AI processing.
 * 
 * Uses the Groq API key from environment variables.
 * Defaults to llama-3.3-70b-versatile for high-performance medical analysis.
 */
const apiKey = process.env.GROQ_API_KEY;

export const ai = genkit({
  plugins: [
    groq({ apiKey: apiKey }),
  ],
  model: 'groq/llama-3.3-70b-versatile', 
});
