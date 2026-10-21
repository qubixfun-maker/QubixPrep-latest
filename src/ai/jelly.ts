import { createHash } from 'crypto'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { osceStream } from '@/ai/osce-ai'
import { personaOf, type Intent, type JellyCtx } from '@/lib/jelly/personas'
import { profileSummary, tierOf, type JellyProfile, type Mode } from '@/lib/jelly/profile'

export type JellyMsg = { role: 'user' | 'jelly'; text: string }
export type JellyEvt = { t: 'meta'; src: 'cache' | 'ai' } | { t: 'd'; x: string } | { t: 'end' }

const cut = (s: unknown, n: number) => String(s ?? '').slice(0, n)

export function cleanCtx(c: any): JellyCtx | null {
  if (!c || c.kind !== 'mcq' || !Array.isArray(c.options)) return null
  const correctIndex = Number(c.correctIndex)
  if (!(correctIndex >= 0 && correctIndex < c.options.length)) return null
  const sel = c.selectedIndex === null || c.selectedIndex === undefined ? null : Number(c.selectedIndex)
  return {
    kind: 'mcq',
    question: cut(c.question, 1500),
    options: c.options.slice(0, 6).map((o: unknown) => cut(o, 300)),
    correctIndex,
    selectedIndex: sel !== null && sel >= 0 && sel < c.options.length ? sel : null,
    explanation: cut(c.explanation, 1500),
    topic: cut(c.topic, 120),
  }
}

export function cleanMsgs(m: any): JellyMsg[] {
  if (!Array.isArray(m)) return []
  return m.slice(-12).map((x: any) => ({ role: x?.role === 'user' ? 'user' as const : 'jelly' as const, text: cut(x?.text, 1200) })).filter((x) => x.text.trim())
}

const L = ['A', 'B', 'C', 'D', 'E', 'F']

function ctxText(c: JellyCtx): string {
  const chose = c.selectedIndex === null || c.selectedIndex === undefined
    ? 'The student has not answered yet.'
    : c.selectedIndex === c.correctIndex ? `The student chose ${L[c.selectedIndex]} (correct).` : `The student chose ${L[c.selectedIndex]} (WRONG).`
  return [
    c.topic ? `Topic: ${c.topic}` : '',
    `QUESTION: ${c.question}`,
    c.options.map((o, i) => `${L[i]}) ${o}`).join('\n'),
    `Correct answer: ${L[c.correctIndex]}) ${c.options[c.correctIndex]}`,
    chose,
    c.explanation ? `Reference explanation: ${c.explanation}` : '',
  ].filter(Boolean).join('\n')
}

const TASK: Record<Exclude<Intent, 'chat'>, string> = {
  explain: `Explain this question. Format exactly:
1) One short opening line in your personality reacting to the student's result (under 14 words).
2) **Why ${'$'}{ANS}:** 2 to 3 sentences linking the key clues to the answer.
3) **Why not the others:** one short line for each tempting wrong option (mention the condition it would suit). If the student picked a wrong option, address that one first.
4) **Pearl:** one high-yield exam fact.
Under 170 words in total.`,
  others: 'For each option other than the correct one, give one short line on why it is wrong and which condition or situation it would be right for. Under 110 words.',
  mnemonic: 'Give one memorable mnemonic or memory hook for the key concept behind this question, then one line on how it maps to the answer. Under 70 words.',
  simple: 'Explain the concept behind this question in very simple language for a first-year student, with one everyday analogy. Under 120 words.',
}

const MODE_RULES: Record<Mode, string> = {
  doubt: '',
  topic: 'MODE: Teach the topic the student names. Structure it clearly for their level, with the high-yield points first, then one short check question at the end.',
  quiz: 'MODE: Quiz. Ask ONE multiple-choice question at a time (options A to D) on the topic the student names, or on their weak areas if they name none. Never reveal the answer before they reply. After they answer: say correct or wrong, explain in 2 lines, show the running score like "Score 2/3", then ask the next question. Keep each message short.',
  viva: 'MODE: Viva. Act as an oral examiner. Ask ONE short viva question at a time on the topic named, getting harder. Judge the answer in one or two lines, give the model answer if it was wrong or the student says they do not know, then ask the next. After 5 questions, give a score out of 5 and the points to revise.',
  cards: 'MODE: Flashcards. The student wants study flashcards, not a quiz. Make 6 high-yield flashcards on the topic named. Each card is exactly two lines: "Q: <short front prompt, a term, a feature or a one-line question>" then "A: <the back: a crisp 1 to 2 line answer with the key fact, value or mechanism>". Put a blank line between cards, no numbering, no bold, no other text between cards. Every answer must be factually correct for Indian MBBS and NEET-PG. After the cards add one line starting "Mnemonic:" with a memorable hook. Nothing else.',
  plan: 'MODE: Study plan. Build a realistic day-by-day plan for the subject and days the student names, using their exam date and weak areas when known. Use a short list, one line per day, with a revision and a practice-question block.',
}

function system(name: string, persona: string, limit: number, profile: JellyProfile, mode: Mode): string {
  const lang = profile.language && profile.language !== 'English'
    ? `\n- Reply in ${profile.language} (its own script), keeping standard medical terms in English.` : ''
  const depth = profile.depth === 'brief' ? 'Keep answers very short.' : profile.depth === 'detailed' ? 'Give fuller, more detailed answers.' : ''
  return `You are Jelly, the AI study companion inside QubixPrep, helping Indian MBBS and NEET-PG students.
PERSONALITY: ${personaOf(persona).style}
Address the student as "${name}".
WHAT YOU KNOW ABOUT THIS STUDENT (use it silently to pitch depth and examples; mention it only when it helps, for example their weak areas or exam date):
${profileSummary(profile)}
RULES:
- Be accurate and exam-focused (standard Indian MBBS and NEET-PG textbooks). If you are not sure, say so instead of guessing.
- Be concise: under ${limit} words unless the student clearly asks for detail or the mode needs more. ${depth} Light markdown only (bold, short lists).
- You are a study aid, not a doctor: give no patient-specific medical advice.${lang}
${MODE_RULES[mode]}`
}

/** Streams Jelly's reply. Explanations of the same question are cached and shared between students of a similar level. */
export async function* jelly(o: {
  intent: Intent; mode: Mode; persona: string; name: string; ctx: JellyCtx | null; messages: JellyMsg[]; ask: string
  profile: JellyProfile; beforeAi?: () => Promise<void>
}): AsyncGenerator<JellyEvt> {
  const c = o.ctx
  const cacheable = !!c && o.intent !== 'chat'
  let key = ''
  if (cacheable && c) {
    const sel = c.selectedIndex === null || c.selectedIndex === undefined ? 'n' : c.selectedIndex === c.correctIndex ? 'c' : `w${c.selectedIndex}`
    key = createHash('sha1').update(`${o.persona}|${o.intent}|${tierOf(o.profile)}|${sel}|${c.correctIndex}|${c.question}|${c.options.join('|')}`).digest('hex')
    try {
      const hit = await getAdminFirestore().collection('jellyCache').doc(key).get()
      if (hit.exists && typeof hit.data()?.text === 'string') {
        yield { t: 'meta', src: 'cache' }; yield { t: 'd', x: hit.data()!.text }; yield { t: 'end' }
        return
      }
    } catch {}
  }

  if (o.beforeAi) await o.beforeAi()
  yield { t: 'meta', src: 'ai' }
  let user: string
  if (o.intent !== 'chat' && c) {
    user = `${ctxText(c)}\n\nTASK: ${TASK[o.intent as Exclude<Intent, 'chat'>].replace('${ANS}', L[c.correctIndex])}`
  } else {
    const hist = o.messages.map((m) => `${m.role === 'user' ? 'Student' : 'Jelly'}: ${m.text}`).join('\n')
    user = `${c ? `The student is currently looking at this question:\n${ctxText(c)}\n\n` : ''}${hist ? `Conversation so far:\n${hist}\n\n` : ''}Student: ${o.ask}`
  }
  const limit = o.intent === 'explain' ? 180 : o.mode === 'doubt' ? 130 : 260
  let full = ''
  for await (const piece of osceStream([{ role: 'system', content: system(o.name, o.persona, limit, o.profile, o.mode) }, { role: 'user', content: user }], 900, 0, 'fast')) {
    full += piece; yield { t: 'd', x: piece }
  }
  yield { t: 'end' }
  if (cacheable && key && full.trim().length > 40) {
    getAdminFirestore().collection('jellyCache').doc(key).set({ text: full.trim(), persona: o.persona, intent: o.intent, t: Date.now() }).catch(() => {})
  }
}
