'use server';
/**
 * @fileOverview An AI agent that generates multiple-choice quizzes and flashcards from a given medical study topic.
 *
 * - generateQuizAndFlashcards - A function that handles the generation process.
 * - GenerateQuizAndFlashcardsInput - The input type for the generateQuizAndFlashcards function.
 * - GenerateQuizAndFlashcardsOutput - The return type for the generateQuizAndFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizAndFlashcardsInputSchema = z.object({
  studyTopic: z
    .string()
    .describe('The medical study topic for which to generate quizzes and flashcards.'),
});
export type GenerateQuizAndFlashcardsInput = z.infer<
  typeof GenerateQuizAndFlashcardsInputSchema
>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The question for the multiple-choice quiz.'),
  options: z
    .array(z.string())
    .describe('An array of multiple-choice options for the question.'),
  correctAnswer: z
    .string()
    .describe('The correct answer from the provided options.'),
  explanation: z
    .string()
    .describe('An explanation for why the chosen answer is correct.'),
});

const FlashcardSchema = z.object({
  front: z.string().describe('The concept or question on the front of the flashcard.'),
  back: z.string().describe('The answer or explanation on the back of the flashcard.'),
});

const GenerateQuizAndFlashcardsOutputSchema = z.object({
  quizzes: z
    .array(QuizQuestionSchema)
    .describe('An array of generated multiple-choice quiz questions.'),
  flashcards: z
    .array(FlashcardSchema)
    .describe('An array of generated flashcards.'),
});
export type GenerateQuizAndFlashcardsOutput = z.infer<
  typeof GenerateQuizAndFlashcardsOutputSchema
>;

export async function generateQuizAndFlashcards(
  input: GenerateQuizAndFlashcardsInput
): Promise<GenerateQuizAndFlashcardsOutput> {
  return generateQuizAndFlashcardsFlow(input);
}

const generateQuizAndFlashcardsPrompt = ai.definePrompt({
  name: 'generateQuizAndFlashcardsPrompt',
  input: {schema: GenerateQuizAndFlashcardsInputSchema},
  output: {schema: GenerateQuizAndFlashcardsOutputSchema},
  prompt: `You are an expert medical educator specializing in creating study materials for MBBS and NEET-PG students.

Your task is to generate relevant multiple-choice questions (MCQs) and flashcards based on the provided medical study topic.

Generate 5-7 MCQs and 5-7 flashcards. Ensure the questions and flashcards are challenging, comprehensive, and cover important concepts related to the topic.

Study Topic: {{{studyTopic}}}`,
});

const generateQuizAndFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateQuizAndFlashcardsFlow',
    inputSchema: GenerateQuizAndFlashcardsInputSchema,
    outputSchema: GenerateQuizAndFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await generateQuizAndFlashcardsPrompt(input);
    return output!;
  }
);
