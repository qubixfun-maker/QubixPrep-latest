export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const maxDuration = 300; // 5 minutes timeout for large PDFs

async function extractClinicalData(
  buffer: Buffer,
  pageNum: number
): Promise<any[]> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const base64 = buffer.toString('base64');
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      max_tokens: 3000,
      temperature: 0.1, // Low temperature for factual extraction
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
              text: `You are a medical MCQ extraction engine. Analyze this page from a board-review PDF.

EXTRACT ALL medical content exactly as written. Return a JSON array only.

RULES:
1. Identify QUESTIONS (e.g., "Question 42:"):
{
  "question_number": number,
  "question_text": "full text",
  "option_a": "text",
  "option_b": "text",
  "option_c": "text",
  "option_d": "text",
  "has_image": boolean,
  "correct_answer": null,
  "explanation": null
}

2. Identify SOLUTIONS (e.g., "Solution to Question 42:"):
{
  "question_number": number,
  "correct_answer": "a" | "b" | "c" | "d",
  "explanation": "full reasoning",
  "question_text": null
}

Return ONLY valid JSON. If page is blank, return [].`,
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
    console.error(`Vision AI Failure [Page ${pageNum}]:`, e);
    return [];
  }
}

async function renderPageToBuffer(
  pdf: any,
  pageNum: number,
  createCanvas: any
): Promise<Buffer | null> {
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR accuracy

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context,
      viewport,
      intent: 'display'
    }).promise;

    return canvas.toBuffer('image/jpeg', { quality: 0.9 });
  } catch (e) {
    console.error(`Render Error [Page ${pageNum}]:`, e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbank-upload-'));

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const subject = formData.get('subject') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing critical data: file or user ID' }, { status: 400 });
    }

    // Load pdfjs and canvas dynamically to ensure server-side compatibility
    const { createCanvas } = await import('@napi-rs/canvas');
    // Using the legacy build for better Node.js compatibility
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
    
    // Explicitly disable worker to avoid path resolution errors in serverless/cloud environments
    pdfjs.GlobalWorkerOptions.workerSrc = false;

    const arrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjs.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Create tracking entry in Supabase
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

    if (qbankError) throw new Error(`Database Error: ${qbankError.message}`);

    const questionsMap: Record<number, any> = {};
    const BATCH_SIZE = 5;

    // Process pages in batches to respect Vision API rate limits and memory
    for (let i = 1; i <= numPages; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE - 1, numPages);
      const batchPromises = [];

      for (let pageNum = i; pageNum <= batchEnd; pageNum++) {
        batchPromises.push(renderPageToBuffer(pdf, pageNum, createCanvas));
      }

      const pageBuffers = await Promise.all(batchPromises);

      const extractions = await Promise.all(
        pageBuffers.map((buffer, idx) =>
          buffer ? extractClinicalData(buffer, i + idx) : Promise.resolve([])
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

        // Logic to merge questions and solutions if they are on separate pages
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
          // If we already have a partial explanation, append to it
          questionsMap[qNum].explanation = questionsMap[qNum].explanation 
            ? `${questionsMap[qNum].explanation}\n\n${item.explanation}` 
            : item.explanation;
        }
      });

      // Throttling to prevent 429 errors from Groq
      if (i + BATCH_SIZE <= numPages) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const finalQuestions = Object.values(questionsMap)
      .filter((q: any) => q.question_text && q.question_text.length > 5)
      .sort((a: any, b: any) => a.question_number - b.question_number);

    if (finalQuestions.length === 0) {
       throw new Error('Vision AI could not identify any clinical cases in this document. Please check the PDF format.');
    }

    // Batch insert into database
    const { error: insertError } = await supabase
      .from('pdf_questions')
      .insert(finalQuestions);

    if (insertError) throw new Error(`Supabase Storage Error: ${insertError.message}`);

    // Update bank status
    await supabase
      .from('pdf_qbanks')
      .update({ status: 'ready', total_questions: finalQuestions.length })
      .eq('id', qbank.id);

    return NextResponse.json({
      success: true,
      qbankId: qbank.id,
      count: finalQuestions.length,
    });
  } catch (error: any) {
    console.error('PDF Extraction Pipeline Failure:', error?.message);
    return NextResponse.json({ error: error.message || 'Critical extraction failure' }, { status: 500 });
  } finally {
    // Cleanup temporary directory
    try {
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Extraction Cleanup Error:', e);
    }
  }
}
