'use server';

import Groq from 'groq-sdk';

const visionClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type VisionAnalysisInput = {
  imageDataUri: string;
  task: 'summarize' | 'quiz' | 'map';
};

export async function analyzeMedicalImage(input: VisionAnalysisInput): Promise<string> {
  const taskInstruction =
    input.task === 'summarize'
      ? 'Provide a high-yield clinical summary of the medical content.'
      : input.task === 'quiz'
      ? 'Generate 3 NEET-PG style MCQs with explanations based on the content.'
      : 'Identify key concepts and their logical connections as a mind map in Markdown.';

  const response = await visionClient.chat.completions.create({
    model: 'llama-3.2-90b-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: input.imageDataUri },
          },
          {
            type: 'text',
            text: `You are a medical OCR specialist. Extract all relevant medical text from this image, then: ${taskInstruction}\n\nOutput in clean Markdown.`,
          },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}
