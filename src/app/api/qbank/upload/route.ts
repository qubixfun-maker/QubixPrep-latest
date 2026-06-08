import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Groq from 'groq-sdk';
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
// In version 4+, the worker is often handled via the legacy/build or standard build
// depending on the environment. We'll use the standard build path.
if (typeof window === 'undefined') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const subject = formData.get('subject') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID' }, { status: 400 });
    }

    // 1. Create entry in pdf_qbanks
    const { data: qbank, error: qbankError } = await supabase
      .from('pdf_qbanks')
      .insert({
        user_id: userId,
        file_name: file.name,
        subject: subject || 'General',
        status: 'processing',
        total_questions: 0
      })
      .select()
      .single();

    if (qbankError) throw qbankError;

    // 2. Load PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const numPages = pdf.numPages;

    let allExtractedData: any[] = [];
    const BATCH_SIZE = 5;

    // 3. Process in batches
    for (let i = 1; i <= numPages; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE - 1, numPages);
      const batchPromises = [];

      for (let j = i; j <= batchEnd; j++) {
        batchPromises.push(processPage(pdf, j));
      }

      const batchResults = await Promise.all(batchPromises);
      allExtractedData = allExtractedData.concat(batchResults.flat());
    }

    // 4. Merge Questions and Solutions by question_number
    const questionsMap: Record<number, any> = {};
    allExtractedData.forEach((item) => {
      if (!item.question_number) return;
      const qNum = item.question_number;
      if (!questionsMap[qNum]) {
        questionsMap[qNum] = {
          qbank_id: qbank.id,
          user_id: userId,
          question_number: qNum,
          question_text: null,
          option_a: null,
          option_b: null,
          option_c: null,
          option_d: null,
          correct_answer: null,
          explanation: null,
          has_image: false
        };
      }

      // If item has question text, it's the question part
      if (item.question_text) {
        questionsMap[qNum] = { ...questionsMap[qNum], ...item };
      } 
      // If item has correct_answer or explanation but no question_text, it's the solution part
      if (item.correct_answer || item.explanation) {
        questionsMap[qNum].correct_answer = item.correct_answer || questionsMap[qNum].correct_answer;
        questionsMap[qNum].explanation = item.explanation || questionsMap[qNum].explanation;
      }
    });

    const finalQuestions = Object.values(questionsMap).filter(q => q.question_text);

    // 5. Save to pdf_questions
    if (finalQuestions.length > 0) {
      const { error: insertError } = await supabase
        .from('pdf_questions')
        .insert(finalQuestions);

      if (insertError) throw insertError;
    }

    // 6. Update qbank status
    await supabase
      .from('pdf_qbanks')
      .update({
        status: 'ready',
        total_questions: finalQuestions.length
      })
      .eq('id', qbank.id);

    return NextResponse.json({ success: true, qbankId: qbank.id, count: finalQuestions.length });

  } catch (error: any) {
    console.error('PDF Processing Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processPage(pdf: any, pageNum: number) {
  try {
    const page = await pdf.getPage(pageNum);
    
    // We attempt text extraction first. If encoding is garbled, 
    // the prompt specifically asks for the visual structure.
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');

    // Note: To fully support vision-based extraction on the server, 
    // we would render the page to a canvas and send the base64 image.
    // Given the constraints, we are providing the text context to the high-reasoning model.
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      messages: [
        {
          role: 'user',
          content: `You are a medical MCQ extractor. Look at this page from a question bank PDF. Extract ALL questions visible on this page exactly as written — do not paraphrase or modify. For each question return a JSON array with objects containing: question_number (integer), question_text (string, exact), option_a, option_b, option_c, option_d (strings, exact text without the a) b) c) d) prefix), correct_answer (null if not visible on this page), explanation (null if not visible on this page), has_image (boolean, true if a clinical image is part of the question). If this page contains solutions instead of questions, extract: question_number, correct_answer (the letter a/b/c/d), and explanation (full explanation text). If the page has neither questions nor solutions, return an empty array. Return ONLY valid JSON, no other text.

          CONTEXT DATA FROM PAGE:
          ${text}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '{"questions": []}';
    const result = JSON.parse(content);
    
    // Accept various JSON shapes the model might return
    if (Array.isArray(result)) return result;
    return result.questions || result.data || result.mcqs || [];
  } catch (e) {
    console.error(`Error processing page ${pageNum}:`, e);
    return [];
  }
}
