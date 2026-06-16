import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatGroq } from "@langchain/groq";
import { GROQ_MODEL } from '@/ai/genkit';

const TEMPLATE_STRING = `
As an expert medical education analyst, your task is to provide a detailed performance breakdown to a student who has just completed a test.

The student will provide you with a list of their results, including the topic of each question and whether they answered it correctly.

Your analysis should be structured, insightful, and encouraging. Follow these steps:

1.  **Start with a Positive and Encouraging Tone:** Begin by congratulating the student on completing the test.
2.  **Identify Areas of Strength:** List the topics where the student performed well (answered most questions correctly). Frame this as "Concepts Mastered" or "Strong Areas."
3.  **Pinpoint Areas for Improvement:** Identify the topics where the student struggled. Frame this constructively as "Areas for Focused Review" or "Opportunities for Growth."
4.  **Provide Actionable Insights:** For each area needing improvement, suggest a brief, high-yield action plan. This could be reviewing a specific pathway, understanding a drug mechanism, or focusing on differential diagnoses.
5.  **Offer a Concluding Summary:** End with a motivational summary and suggest next steps, like creating a study plan based on this feedback.
6.  **Use Markdown for Clarity:** Structure your response with headings, bullet points, and bold text to make it easy to read.

**Student's Test Results:**

\`\`\`json
{results}
\`\`\`

Now, generate the performance analysis.
`;

interface TestResult {
    topic: string;
    isCorrect: boolean;
    question: string;
}

export async function analyzeTestPerformance(results: TestResult[]) {
    const prompt = PromptTemplate.fromTemplate(TEMPLATE_STRING);

    const model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: GROQ_MODEL
    });

    const chain = RunnableSequence.from([
        prompt,
        model,
        new StringOutputParser(),
    ]);

    const stream = await chain.stream({
        results: JSON.stringify(results, null, 2),
    });

    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return chunks.join('');
}
