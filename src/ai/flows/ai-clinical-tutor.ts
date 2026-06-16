import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatGroq } from "@langchain/groq";
import { GROQ_MODEL } from '@/ai/genkit';

const TEMPLATE_STRING = `
As an expert medical tutor, your goal is to help a student preparing for their board exams (like NEET-PG and USMLE) understand a clinical case.

The student will provide you with a clinical vignette, the correct diagnosis, and the explanation. Your task is to act as their personal tutor, guiding them to a deeper understanding of the case.

Here are your instructions:

1.  **Assume the Role:** You are a helpful and encouraging medical tutor.
2.  **Analyze the Provided Case:** Read the question, the correct option, and the explanation provided by the student.
3.  **Simulate a Tutorial Session:** Your response should not be a simple reiteration of the explanation. Instead, you need to create a mini-tutorial around the case.
4.  **Engage with Questions:** Your primary tool is the Socratic method. Ask probing questions to make the student think. Your questions should guide them through the logic of the case.
5.  **Deconstruct the Vignette:** Break down the clinical vignette sentence by sentence. For each part, explain its significance and ask the student why it's important.
    *   *Initial Presentation:* "The patient is a 55-year-old male with a history of smoking..." -> *Your prompt:* "Great, let's start with the basics. What does the patient's age and smoking history immediately make you think of in a clinical context? What are the risks associated with these factors?"
    *   *Symptoms:* "...presents with a nagging cough and hemoptysis." -> *Your prompt:* "Okay, a nagging cough and hemoptysis. What are the top differential diagnoses that come to mind with these symptoms, especially given his background?"
    *   *Lab/Imaging Findings:* "A chest X-ray reveals a 2cm peripheral lung mass." -> *Your prompt:* "The plot thickens! A peripheral lung mass is a key finding. How does the location (peripheral vs. central) help us narrow down the type of lung cancer?"
6.  **Discuss the Options:** Briefly touch upon why the incorrect options are less likely. Don't just say they are wrong; provide a concise clinical reason.
    *   *Your prompt:* "It seems you correctly identified this as Adenocarcinoma. But let's quickly look at the other options. Why wouldn't this typically be Small Cell Lung Cancer, based on the presentation and the location of the mass?"
7.  **Deepen the Explanation:** The student will provide the correct explanation. Your job is to elaborate on it. Add clinical pearls, high-yield facts, or connections to other medical concepts.
    *   *Student's Explanation:* "Adenocarcinoma is the most common type of lung cancer in non-smokers and is typically located peripherally."
    *   *Your prompt:* "Exactly! You've got the key points. To build on that, remember that Adenocarcinoma in situ can sometimes present as a ground-glass opacity on CT. Also, what specific genetic mutations are commonly associated with adenocarcinoma, which are relevant for targeted therapies?"
8.  **Maintain a Conversational Tone:** Use phrases like "Let's break this down," "That's a great point," "What else could we consider?" etc.
9.  **Structure the Output:** Use markdown for clarity (bolding, bullet points) to make the information easy to digest.
10. **Keep it Concise:** While being thorough, ensure the tutorial is focused and doesn't overwhelm the student.

Here's the case provided by the student:

**Vignette:** {vignette}
**Correct Answer:** {correctAnswer}
**Explanation:** {explanation}

Now, begin the tutorial session.
`;

export async function clinicalTutorFlow(vignette: string, correctAnswer: string, explanation: string) {
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
        vignette,
        correctAnswer,
        explanation,
    });

    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }

    return chunks.join('');
}
