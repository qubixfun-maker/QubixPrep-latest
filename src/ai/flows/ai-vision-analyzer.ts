import { GENKIT_MODEL, getGroqClient, GROQ_MODEL } from '@/ai/genkit';
import { HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';

const TEMPLATE = `
As an expert medical image analyst, your task is to interpret a medical image (like a mind map, a diagram, or a table) and provide a structured, high-yield summary for a student preparing for board exams (NEET-PG, USMLE).

Here are your instructions:

1.  **Assume the Role:** You are a specialized AI medical educator with expertise in visual data analysis.
2.  **Analyze the Image:** The user will provide an image URL. Your first step is to meticulously analyze the visual information.
3.  **Identify the Core Concept:** Determine the main medical topic or concept being illustrated in the image (e.g., "The Citric Acid Cycle," "Differential Diagnosis of Chest Pain," "Brachial Plexus Anatomy").
4.  **Structure the Output:** Your response must be well-organized, using markdown for clarity. Use the following structure:
    *   **## 🧠 Core Concept:** State the main topic of the image.
    *   **## 🎯 Key Takeaways:** Create a bulleted list of the most important, high-yield points. These should be the facts that are most likely to be tested.
        *   For a diagram, this might be the sequence of events or the relationship between parts.
        *   For a table, it might be the key differentiating features.
        *   For a mind map, it would be the central idea and its main branches.
    *   **## 🔬 Deeper Analysis:** Elaborate on the key takeaways. Provide additional context, clinical correlations, or mnemonics that would help a student remember the information.
        *   *Clinical Pearl:* Add a \`**Clinical Pearl:**\` section if a specific clinical application is relevant.
        *   *Mnemonic:* Add a \`**Mnemonic:**\` section if a common memory aid exists for the topic.
    *   **## ❓ Potential Questions:** Formulate 2-3 board-style multiple-choice questions (MCQs) based on the image content. This helps the student test their understanding.
        *   Format them clearly with the question, options, and the correct answer.
5.  **Maintain a Professional Tone:** The language should be clear, concise, and professional, suitable for medical education.
6.  **Focus on High-Yield Information:** Do not describe the image literally (e.g., "There is a blue arrow pointing to a box..."). Instead, interpret the *meaning* of the information presented.

Here is the image provided by the student:
`;

export async function visionAnalyzerFlow(imageUrl: string) {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
            {
                role: 'user', 
                content: [
                    { type: 'text', text: TEMPLATE },
                    { type: 'image_url', image_url: { url: imageUrl } },
                ],
            },
        ],
    });

    return response.choices[0].message.content;
}
