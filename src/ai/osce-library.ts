import { getAdminFirestore } from '@/lib/firebase-admin'
import { generateCaseBrief } from '@/ai/osce-live-case'
import { vivaPlan } from '@/ai/osce-engine'
import { getCase } from '@/lib/casepres'
import { examReference } from '@/lib/osce/examref'
import { LIB_SEEDS, type LibSeed } from '@/lib/osce/library'
import type { OsceBrief } from '@/lib/osce/shared'

const COL = 'osceCases'

/** Who the patient must be so that the informant makes sense. */
const PATIENT_HINT: Record<string, string> = {
  Wife: 'The patient must be an adult male; his wife gives the history because he cannot (drowsy, confused or aphasic).',
  Husband: 'The patient must be an adult female; her husband gives the history because she cannot.',
  Mother: 'The patient must be a child or adolescent aged 8 to 16; the mother gives the history.',
  Father: 'The patient must be a child or adolescent aged 8 to 16; the father gives the history.',
  Son: 'The patient must be aged 65 or more; his or her son gives the history because the patient is confused.',
  Daughter: 'The patient must be aged 65 or more; his or her daughter gives the history because the patient is confused.',
  Brother: 'The patient must be a young adult aged 18 to 30; the brother gives the history because the patient is drowsy.',
  Sister: 'The patient must be a young adult aged 18 to 30; the sister gives the history because the patient is drowsy.',
}

function extraFor(seed: LibSeed): string {
  const def = getCase(seed.proformaId)
  const ref = examReference(seed.proformaId)
  return [
    `LIBRARY CASE RULES:`,
    `- This case belongs to the standard case-presentation proforma "${def?.title || seed.proformaId}". The examination findings must use the signs and terms of that proforma and include the classic positive findings of ${seed.topic}, and sensible negatives.`,
    ref ? `EXAMINATION REFERENCE FROM THE PROFORMA:\n${ref}` : '',
    seed.inf ? `- ${PATIENT_HINT[seed.inf.relation] || ''} Write the history as that informant would tell it.` : '',
  ].filter(Boolean).join('\n')
}

export async function readyIds(): Promise<string[]> {
  const snap = await getAdminFirestore().collection(COL).select().get()
  return snap.docs.map((d) => d.id)
}

export async function getOrMake(id: string): Promise<OsceBrief> {
  const seed = LIB_SEEDS.find((s) => s.id === id)
  if (!seed) throw new Error('Unknown library case')
  const ref = getAdminFirestore().collection(COL).doc(id)
  const hit = await ref.get()
  if (hit.exists) return hit.data()!.brief as OsceBrief

  const { brief, error } = await generateCaseBrief(seed.label, seed.topic, extraFor(seed))
  if (!brief) throw new Error(error || 'Could not prepare this case')
  const full: OsceBrief = {
    ...brief,
    topic: seed.topic,
    caseId: seed.id,
    proformaId: seed.proformaId,
    ...(seed.inf ? { informant: seed.inf } : {}),
  }
  try { full.viva = await vivaPlan(full) } catch {}
  try {
    await ref.create({ id: seed.id, subject: seed.subject, topic: seed.topic, proformaId: seed.proformaId, brief: JSON.parse(JSON.stringify(full)), createdAt: Date.now() })
    return full
  } catch {
    // another student prepared it at the same moment: use the stored one so everybody sees the same case
    const again = await ref.get()
    if (again.exists) return again.data()!.brief as OsceBrief
    throw new Error('Could not save this case')
  }
}

/** Prepares up to `limit` cases that are not stored yet (3 at a time). */
export async function seedMissing(limit: number): Promise<{ made: number; failed: number; remaining: number; ready: string[] }> {
  const have = new Set(await readyIds())
  const todo = LIB_SEEDS.filter((s) => !have.has(s.id)).slice(0, limit)
  let made = 0; let failed = 0
  for (let i = 0; i < todo.length; i += 3) {
    const res = await Promise.allSettled(todo.slice(i, i + 3).map((s) => getOrMake(s.id)))
    res.forEach((r) => { if (r.status === 'fulfilled') made++; else failed++ })
  }
  const ready = await readyIds()
  return { made, failed, remaining: LIB_SEEDS.length - ready.length, ready }
}
