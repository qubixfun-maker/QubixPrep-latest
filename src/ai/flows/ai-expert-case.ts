'use server';
import { callAI } from '@/ai/genkit';
import type { ClinicalCase } from '@/ai/flows/ai-case-generator';

// Expert Ward Round cases: 9 stages, two ordering procedures, a mid-case complication and counselling.
const SETTINGS = ['emergency', 'opd', 'ward', 'icu', 'ot', 'labour', 'community', 'paeds', 'forensic'];
const REGIONS = ['chest', 'abdomen', 'head', 'limb', 'skin', 'eye', 'ear', 'throat', 'pelvis', 'general'];
const RHYTHMS = ['sinus', 'af', 'st-elevation', 'vt', 'brady', 'tachy'];
const LOOKS = ['comfortable', 'distressed', 'breathless', 'drowsy', 'in-pain'];
const MODALITIES = ['xray', 'ct', 'usg', 'ecg'];

function buildPrompt(subject: string, topic: string, setting?: string): string {
  return `You are a senior consultant building an EXPERT-level interactive "Ward Round" case for final-year MBBS, interns and NEET-PG/INI-CET aspirants in India. Use Indian context (names, places, drugs, doses, NHM/ICMR/Indian guidelines). This must be HARD: distractors are plausible, the right answer needs real reasoning, and the case contains a mid-course complication.

Subject: ${subject}
Topic: ${topic}
${setting ? `Setting: ${setting}` : ''}

Build ONE patient case as EXACTLY 9 stages in this order:
1 history (choice) 2 examination (choice) 3 investigation (choice, with lab values and/or a scan) 4 procedure (SEQUENCE: a bedside/diagnostic procedure relevant to this case, e.g. lumbar puncture, pleural tap, central line, ascitic tap, ABG, intubation, chest drain, catheterisation, FAST scan, cricothyroidotomy, NG tube, BLS/ACLS) 5 diagnosis (choice) 6 management (choice, initial treatment; time-critical) 7 complication (choice: a dramatic deterioration or a pitfall develops; time-critical) 8 procedure (SEQUENCE: a therapeutic or resuscitation procedure) 9 counselling (choice: disposition, counselling, consent, referral, public-health or medicolegal step).

CHOICE stages: 4 or 5 options, exactly ONE "optimal". Outcomes: optimal (points 10), acceptable (3-6), unsafe (-8 to -12, could harm or miss the diagnosis), wrong (0). Every option has "finding": what the player sees after choosing it (brief and unhelpful for wrong ones; clinically rich with numbers for optimal ones). Option "feedback" explains the reasoning in 1-2 sentences.

SEQUENCE stages: give "steps": 5 to 7 short strings in the CORRECT order (a real procedure with consent, asepsis, positioning, landmark, technique, confirmation, aftercare as appropriate), plus "feedback" (why order matters / key safety point) and "finding" (what happens when it is done correctly).

Investigation options may carry optional "labs" (array of {"name","value","unit","ref","flag"} where flag is "H","L","N" or "C" for critical) and/or "scan" ({"modality":"${MODALITIES.join('|')}","title":"e.g. Chest X-ray PA","caption":"report-style finding","lesion":{"x":0-100,"y":0-100,"r":4-18}}). Only include "scan" when an image really fits the investigation; "lesion" marks the abnormal area (omit for a normal scan).

Stages 6 and 7 get "timeLimit" (seconds, 25-40). Stage 7 also gets "alert": {"title":"short dramatic alarm e.g. 'SpO2 falling'", "text":"1-2 sentence description of what suddenly happens"}.

Respond ONLY with valid JSON, no markdown, no trailing commas:
{
  "title": "short NON-revealing title e.g. '45-year-old with chest pain'",
  "difficulty": "expert",
  "stem": "2-4 sentences: age, sex, presenting complaint, context. No diagnosis hint.",
  "patient": { "name": "Indian name", "age": 45, "ageUnit": "years", "sex": "M", "occupation": "short", "place": "city/village" },
  "setting": "one of: ${SETTINGS.join(' | ')}",
  "region": "one of: ${REGIONS.join(' | ')}",
  "appearance": "one of: ${LOOKS.join(' | ')}",
  "vitals": { "hr": 110, "bp": "100/60", "rr": 22, "temp": 37.2, "spo2": 94 },
  "rhythm": "one of: ${RHYTHMS.join(' | ')}",
  "stages": [
    { "id": "stage-1", "type": "history", "prompt": "...", "options": [ { "id": "opt-1", "label": "...", "outcome": "optimal", "points": 10, "feedback": "...", "finding": "..." } ] },
    { "id": "stage-4", "type": "procedure", "kind": "sequence", "prompt": "Arrange the steps of ...", "steps": ["...", "..."], "feedback": "...", "finding": "..." }
  ],
  "finalDiagnosis": "...",
  "consultantNote": "2-3 sentences, friendly senior consultant voice, summarising the ideal approach",
  "keyLearnings": ["4-6 concise points"],
  "pitfalls": ["3 common mistakes"],
  "flashcards": [{ "front": "...", "back": "..." }]
}

Rules: stage types must be exactly: history, examination, investigation, procedure, diagnosis, management, complication, procedure, counselling. Option ids unique within a stage. NO SPOILERS in title/stem. Medically accurate. 4-6 flashcards. Output complete valid JSON, do not truncate.`;
}

const num = (v: any, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
const pick = (v: any, list: string[], d: string) => (typeof v === 'string' && list.includes(v.toLowerCase()) ? v.toLowerCase() : d);
const TYPES = ['history', 'examination', 'investigation', 'procedure', 'diagnosis', 'management', 'complication', 'procedure', 'counselling'];

function normalize(p: any, topic: string, setting?: string): ClinicalCase | null {
  if (!Array.isArray(p.stages) || p.stages.length < 8) return null;
  const v = p.vitals || {};
  p.vitals = { hr: num(v.hr, 88), bp: typeof v.bp === 'string' ? v.bp : '120/80', rr: num(v.rr, 16), temp: num(v.temp, 37), spo2: num(v.spo2, 98) };
  p.setting = pick(p.setting, SETTINGS, setting && SETTINGS.includes(setting) ? setting : 'ward');
  p.region = pick(p.region, REGIONS, 'general');
  p.rhythm = pick(p.rhythm, RHYTHMS, 'sinus');
  p.appearance = pick(p.appearance, LOOKS, 'distressed');
  const pt = p.patient || {};
  p.patient = { name: pt.name || 'Patient', age: num(pt.age, 40), ageUnit: pt.ageUnit || 'years', sex: pt.sex === 'F' ? 'F' : 'M', occupation: pt.occupation || '', place: pt.place || '' };
  let seq = 0;
  const stages: any[] = [];
  for (let i = 0; i < p.stages.length; i++) {
    const s = p.stages[i];
    const type = TYPES.includes(s.type) ? s.type : TYPES[i] || 'management';
    if (s.kind === 'sequence' || Array.isArray(s.steps)) {
      const steps = (s.steps || []).map((x: any) => String(x)).filter(Boolean).slice(0, 8);
      if (steps.length < 4) return null;
      seq++;
      stages.push({ id: s.id || `stage-${i + 1}`, type: 'procedure', kind: 'sequence', prompt: s.prompt || 'Arrange the steps in the correct order', steps, feedback: s.feedback || '', finding: s.finding || '' });
      continue;
    }
    const opts = (s.options || []).map((o: any, j: number) => {
      const out: any = { id: o.id || `opt-${j + 1}`, label: String(o.label || ''), outcome: ['optimal', 'acceptable', 'unsafe', 'wrong'].includes(o.outcome) ? o.outcome : 'wrong', points: num(o.points, 0), feedback: o.feedback || '', finding: o.finding || '' };
      if (Array.isArray(o.labs)) out.labs = o.labs.slice(0, 14).map((l: any) => ({ name: String(l.name || ''), value: String(l.value ?? ''), unit: String(l.unit || ''), ref: String(l.ref || ''), flag: ['H', 'L', 'N', 'C'].includes(l.flag) ? l.flag : 'N' }));
      if (o.scan && MODALITIES.includes(String(o.scan.modality).toLowerCase())) {
        const lz = o.scan.lesion;
        out.scan = { modality: String(o.scan.modality).toLowerCase(), title: String(o.scan.title || ''), caption: String(o.scan.caption || '') };
        if (lz && Number.isFinite(Number(lz.x)) && Number.isFinite(Number(lz.y))) out.scan.lesion = { x: Math.max(8, Math.min(92, num(lz.x, 50))), y: Math.max(8, Math.min(92, num(lz.y, 50))), r: Math.max(4, Math.min(18, num(lz.r, 9))) };
      }
      return out;
    }).filter((o: any) => o.label);
    if (opts.length < 3 || opts.filter((o: any) => o.outcome === 'optimal').length !== 1) return null;
    const st: any = { id: s.id || `stage-${i + 1}`, type, prompt: s.prompt || '', options: opts };
    if (Number.isFinite(Number(s.timeLimit)) && Number(s.timeLimit) > 0) st.timeLimit = Math.max(15, Math.min(60, Number(s.timeLimit)));
    if (s.alert && (s.alert.title || s.alert.text)) st.alert = { title: String(s.alert.title || 'Alarm'), text: String(s.alert.text || '') };
    stages.push(st);
  }
  if (seq < 2) return null;
  p.stages = stages;
  p.difficulty = 'expert';
  p.topic = topic;
  return p as ClinicalCase;
}

export async function generateExpertCase(input: { subject: string; topic: string; setting?: string }): Promise<{ case?: ClinicalCase; error?: string }> {
  try {
    const raw = await callAI([{ role: 'user', content: buildPrompt(input.subject, input.topic, input.setting) }], 14000);
    if (!raw) return { error: 'Empty response from AI model' };
    let clean = raw.replace(/```json|```/g, '').trim();
    const a = clean.indexOf('{'), b = clean.lastIndexOf('}');
    if (a !== -1 && b > a) clean = clean.slice(a, b + 1);
    const c = normalize(JSON.parse(clean), input.topic, input.setting);
    if (!c) return { error: 'AI response failed validation (stages/options/sequences)' };
    return { case: c };
  } catch (e: any) {
    return { error: e.message || 'Unknown error during expert case generation' };
  }
}
