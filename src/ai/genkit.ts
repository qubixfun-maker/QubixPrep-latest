import Groq from 'groq-sdk';

let groqClientInstance: Groq | null = null;

// Lazily initialize the Groq client on first use
export const getGroqClient = () => {
    if (!groqClientInstance) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in environment variables.');
        }
        groqClientInstance = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }
    return groqClientInstance;
};

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
