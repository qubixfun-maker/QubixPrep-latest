'use server';

import { getGroqClient, GROQ_MODEL } from '@/ai/genkit';

export type MindMapGeneratorInput = {
  medicalText: string;
};

export type MindMapGeneratorOutput = {
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string; label?: string }[];
};

export async function generateMindMap(input: MindMapGeneratorInput): Promise<MindMapGeneratorOutput> {
  const groqClient = getGroqClient();
  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'user',
        content: `You are a medical education AI. Generate a mind map from the following medical text.

Respond ONLY with a valid JSON object in this exact format, no extra text:
{
  "nodes": [
    { "id": "1", "label": "Concept Name" }
  ],
  "edges": [
    { "source": "1", "target": "2", "label": "relationship" }
  ]
}

Medical Text:
${input.medicalText}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
