'use server';
/**
 * @fileOverview A Genkit flow for generating interactive mind maps from medical text.
 *
 * - generateMindMap - A function that handles the mind map generation process.
 * - MindMapGeneratorInput - The input type for the generateMindMap function.
 * - MindMapGeneratorOutput - The return type for the generateMindMap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MindMapNodeSchema = z.object({
  id: z.string().describe('Unique identifier for the concept node.'),
  label: z.string().describe('The name or label of the medical concept.'),
});

const MindMapEdgeSchema = z.object({
  source: z.string().describe('The ID of the source node for the relationship.'),
  target: z.string().describe('The ID of the target node for the relationship.'),
  label: z.string().optional().describe('An optional description of the relationship between the two concepts.'),
});

const MindMapGeneratorInputSchema = z.object({
  medicalText: z.string().describe('The medical text or concept description from which to generate the mind map. This can be a summary, a detailed explanation, or a list of topics.'),
});
export type MindMapGeneratorInput = z.infer<typeof MindMapGeneratorInputSchema>;

const MindMapGeneratorOutputSchema = z.object({
  nodes: z.array(MindMapNodeSchema).describe('A list of distinct medical concept nodes in the mind map.'),
  edges: z.array(MindMapEdgeSchema).describe('A list of directed relationships or connections between the medical concept nodes.'),
});
export type MindMapGeneratorOutput = z.infer<typeof MindMapGeneratorOutputSchema>;

export async function generateMindMap(input: MindMapGeneratorInput): Promise<MindMapGeneratorOutput> {
  return aiMindMapGeneratorFlow(input);
}

const aiMindMapGeneratorPrompt = ai.definePrompt({
  name: 'aiMindMapGeneratorPrompt',
  input: { schema: MindMapGeneratorInputSchema },
  output: { schema: MindMapGeneratorOutputSchema },
  prompt: `You are an AI assistant specialized in medical education, tasked with creating clear and concise mind maps from provided medical text.

Your goal is to identify core medical concepts and their interconnections to help students visualize and understand complex information.

From the following medical text, extract the most important medical concepts and the relationships between them. Represent these as a list of 'nodes' and 'edges' in a JSON object.

Each 'node' should have a unique 'id' (a short, unique string identifier) and a 'label' (the concept name).
Each 'edge' should specify a 'source' node 'id', a 'target' node 'id', and optionally a 'label' describing the relationship.

Medical Text: {{{medicalText}}}`,
});

const aiMindMapGeneratorFlow = ai.defineFlow(
  {
    name: 'aiMindMapGeneratorFlow',
    inputSchema: MindMapGeneratorInputSchema,
    outputSchema: MindMapGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await aiMindMapGeneratorPrompt(input);
    if (!output) {
      throw new Error('Failed to generate mind map output.');
    }
    return output;
  }
);
