
'use server';
/**
 * @fileOverview Multimodal Vision analysis powered by Groq Llama 3.2 Vision.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VisionAnalysisInputSchema = z.object({
  imageDataUri: z.string().describe("The medical screenshot as a data URI (base64)."),
  task: z.enum(['summarize', 'quiz', 'map']).describe("The analysis task to perform on the extracted text."),
});
export type VisionAnalysisInput = z.infer<typeof VisionAnalysisInputSchema>;

export async function analyzeMedicalImage(input: VisionAnalysisInput) {
  return aiVisionFlow(input);
}

const aiVisionFlow = ai.defineFlow(
  {
    name: 'aiVisionFlow',
    inputSchema: VisionAnalysisInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await ai.generate({
      model: 'groq/llama-3.2-90b-vision-preview',
      prompt: [
        { media: { url: input.imageDataUri, contentType: 'image/jpeg' } },
        { text: `You are a medical OCR specialist. 
                First, extract all the relevant medical text from this screenshot. 
                Then, perform the following task: ${input.task}. 
                
                If task is 'summarize', provide a high-yield clinical summary.
                If task is 'quiz', generate 3 USMLE-style MCQs with explanations.
                If task is 'map', identify key concepts and their logical connections.
                
                Output your response in clean, professional Markdown.` }
      ]
    });
    return text;
  }
);
