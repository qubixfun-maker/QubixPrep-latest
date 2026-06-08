import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 300; // 5 minutes timeout

export async function POST(req: NextRequest) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbank-'));

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const subject = formData.get('subject') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID' }, { status: 400 });
    }

    // Load pdfjs-dist and canvas dynamically
    const { createCanvas } = await import('canvas');
    // Using the legacy build which is more compatible with Node.js environments
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
    
    // Disable worker for server-side environments to avoid path/import issues
    pdfjs.GlobalWorkerOptions.workerSrc = false;

    const arrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjs.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true, // Speeds up loading in server environments
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Create qbank entry
    const { data: qbank, error: qbankError } = await supabase
      .from('pdf_qbanks')
      .insert({
        user_id: userId,
        file_name: file.name,
        subject: subject || 'General',
        status: 'processing',
        total_questions: 0,
      })
      .select()
      .single();

    if (qbankError) throw new Error(`Supabase QBank Error: ${qbankError.message}`);

    const questionsMap: Record<number, any> = {};
    const BATCH_SIZE = 5;

    for (let i = 1; i <= numPages; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE - 1, numPages);
      const batch = [];

      for (let pageNum = i; pageNum <= batchEnd; pageNum++) {
        batch.push(renderPageToBase64(pdf, pageNum, createCanvas));
      }

      const base64Images = await Promise.all(batch);

      const extractions = await Promise.all(
        base64Images.map((b64, idx) =>
          b64 ? extractFromImage(b64, i + idx) : Promise.resolve([])
        )
      );

      extractions.flat().forEach((item: any) => {
        if (!item?.question_number) return;
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
            has_image: false,
          };
        }

        // Merge logic: only overwrite if data is present (don't overwrite with nulls)
        if (item.question_text) {
          questionsMap[qNum].question_text = item.question_text;
          questionsMap[qNum].option_a = item.option_a;
          questionsMap[qNum].option_b = item.option_b;
          questionsMap[qNum].option_c = item.option_c;
          questionsMap[qNum].option_d = item.option_d;
          questionsMap[qNum].has_image = item.has_image || false;
        }
        if (item.correct_answer) {
          questionsMap[qNum].correct_answer = item.correct_answer;
        }
        if (item.explanation) {
          questionsMap[qNum].explanation = item.explanation;
        }
      });

      // Throttle for API rate limits
      if (i + BATCH_SIZE <= numPages) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    const finalQuestions = Object.values(questionsMap)
      .filter((q: any) => q.question_text && q.question_text.length > 5)
      .sort((a: any, b: any) => a.question_number - b.question_number);

    if (finalQuestions.length === 0) {
       throw new Error('No clinical cases could be extracted from this PDF. Please check the format.');
    }

    // Insert in chunks of 50 for database stability
    for (let i = 0; i < finalQuestions.length; i += 50) {
      const { error: insertError } = await supabase
        .from('pdf_questions')
        .insert(finalQuestions.slice(i, i + 50));
      if (insertError) throw new Error(`Supabase Insert Error: ${insertError.message}`);
    }

    await supabase
      .from('pdf_qbanks')
      .update({ status: 'ready', total_questions: finalQuestions.length })
      .eq('id', qbank.id);

    return NextResponse.json({
      success: true,
      qbankId: qbank.id,
      totalPages: numPages,
      count: finalQuestions.length,
    });
  } catch (error: any) {
    console.error('PDF Extraction Pipeline Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during PDF extraction' }, { status: 500 });
  } finally {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Cleanup Error:', e);
    }
  }
}

async function renderPageToBase64(
  pdf: any,
  pageNum: number,
  createCanvas: any
): Promise<string | null> {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport,
      intent: 'display'
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  } catch (e) {
    console.error(`Rendering Failure Page ${pageNum}:`, e);
    return null;
  }
}

async function extractFromImage(
  base64: string,
  pageNum: number
): Promise<any[]> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
            {
              type: 'text',
              text: `You are a medical MCQ extractor. Look at this page from a clinical question bank PDF.

Extract ALL medical content exactly as written. Return a JSON array only, no other text.

Extraction Rules:
1. If this page has QUESTIONS (labeled "Question N:"):
{
  "question_number": integer,
  "question_text": "exact text",
  "option_a": "text only",
  "option_b": "text only",
  "option_c": "text only",
  "option_d": "text only",
  "has_image": boolean (true if image is part of question),
  "correct_answer": null,
  "explanation": null
}

2. If this page has SOLUTIONS (labeled "Solution to Question N:"):
{
  "question_number": integer,
  "correct_answer": "a" or "b" or "c" or "d",
  "explanation": "full text",
  "question_text": null,
  "option_a": null,
  "option_b": null,
  "option_c": null,
  "option_d": null,
  "has_image": false
}

Return ONLY a valid JSON array. If the page is blank or irrelevant, return [].`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || '[]';
    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Vision API Failure Page ${pageNum}:`, e);
    return [];
  }
}
