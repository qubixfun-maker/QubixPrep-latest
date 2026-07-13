export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient, GROQ_MODEL } from '@/ai/genkit'

const CANONICAL_SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology",
  "Microbiology", "Community Medicine", "Forensic Medicine", "Medicine",
  "Surgery", "Obstetrics & Gynaecology", "Paediatrics", "Psychiatry",
  "Ophthalmology", "ENT", "Orthopaedics", "Radiology", "Anaesthesia", "Dermatology"
]

export async function POST(req: NextRequest) {
  try {
    const { subjects } = await req.json()
    if (!Array.isArray(subjects) || subjects.length === 0) return NextResponse.json({ mapping: {} })

    const unique = [...new Set(subjects.map((s: any) => String(s || '').trim()).filter(Boolean))]
    if (unique.length === 0) return NextResponse.json({ mapping: {} })

    const groq = getGroqClient()
    const prompt = `You are correcting messy medical subject names from a spreadsheet into the exact canonical subject name used in our system.

Canonical subject list (use EXACTLY these strings, character for character):
${CANONICAL_SUBJECTS.join(', ')}

Raw subject values that need mapping (may contain typos, abbreviations, or alternate spellings):
${unique.map((s, i) => `${i + 1}. "${s}"`).join('\n')}

Return ONLY a JSON object mapping each raw value (as the key, exactly as given) to its corrected canonical subject (as the value, exactly matching one of the canonical list above). If a raw value clearly doesn't match any canonical subject, map it to itself unchanged. Do not include markdown formatting or any explanation, only the raw JSON object.`

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.choices[0]?.message?.content ?? '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const mapping = JSON.parse(clean)

    return NextResponse.json({ mapping })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
