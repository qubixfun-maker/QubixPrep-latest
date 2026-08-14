export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

type QuestionInput = { index: number; text: string }
type ImageInput = { filename: string; base64: string; mimeType: string }

async function matchOneImage(groq: Groq, image: ImageInput, questions: QuestionInput[]): Promise<number[]> {
  const questionList = questions.map(q => `${q.index}: ${q.text.slice(0, 200)}`).join('\n')

  const prompt = `You are matching a medical diagram/photo to the exam questions it illustrates.

FILENAME (may hint at content, e.g. "q3_zn_stain.jpg"): ${image.filename}

QUESTIONS IN THIS SECTION (index: text):
${questionList}

TASK: Look at the image. Decide which question(s) this image is relevant to as a supporting diagram/photo. An image can match MORE THAN ONE question if it's generally relevant to several (e.g. a bacterial morphology chart could support both a "classify bacteria" question and a "differentiate cocci/bacilli" question). If the image doesn't clearly match any question, return an empty array.

Respond with ONLY a JSON array of matching question indices, e.g. [2] or [0,4] or []. No commentary, no markdown fences.`

  const response = await groq.chat.completions.create({
    model: 'llama-3.2-90b-vision-preview',
    max_tokens: 200,
    temperature: 0.1,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
          { type: 'text', text: prompt },
        ],
      } as any,
    ],
  })

  const raw = response.choices[0]?.message?.content || '[]'
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed)) return parsed.filter((n: any) => Number.isInteger(n) && n >= 0 && n < questions.length)
    return []
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const { images, questions } = await req.json() as { images: ImageInput[]; questions: QuestionInput[] }
    if (!images?.length || !questions?.length) {
      return NextResponse.json({ error: 'Missing images or questions' }, { status: 400 })
    }

    const results: { imageIndex: number; matchedQuestionIndices: number[] }[] = []
    for (let i = 0; i < images.length; i++) {
      try {
        const matched = await matchOneImage(groq, images[i], questions)
        results.push({ imageIndex: i, matchedQuestionIndices: matched })
      } catch (e: any) {
        console.warn(`[match-images] image ${i} failed:`, e.message)
        results.push({ imageIndex: i, matchedQuestionIndices: [] })
      }
      if (i < images.length - 1) await new Promise(r => setTimeout(r, 400))
    }

    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
