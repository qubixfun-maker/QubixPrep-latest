import type { AttrDef, AttrRef, Field, Section } from './types'

export const txt = (id: string, label: string, o: { placeholder?: string; half?: boolean } = {}): Field => ({ t: 'text', id, label, ...o })
export const date = (id: string, label: string, half = true): Field => ({ t: 'date', id, label, half })
export const area = (id: string, label: string, placeholder?: string): Field => ({ t: 'area', id, label, placeholder })
export const ch = (id: string, label: string, options: string[], multi = false): Field => ({ t: 'choice', id, label, options, multi })
export const fd = (id: string, label: string, options: string[]): Field => ({ t: 'findings', id, label, options })
export const cc = (id: string, label: string, options: string[]): Field => ({ t: 'complaints', id, label, options })
export const sym = (id: string, label: string, attrs: AttrRef[]): Field => ({ t: 'symptom', id, label, attrs })
export const vitals = (id = 'vitals', paeds = false): Field => ({ t: 'vitals', id, label: 'Vital signs', paeds })
export const sec = (id: string, title: string, fields: Field[], hint?: string): Section => ({ id, title, fields, hint })

/** A custom attribute with its own options (overrides the shared library entry). */
export const at = (key: string, label: string, options: string[], multi = false): AttrDef => ({ key, label, options, multi })

const DUR = ['1 day', '2 days', '3 days', '5 days', '1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year', 'More than 1 year']

/** Shared attribute library: used when a symptom lists an attribute by key. */
export const ATTRS: Record<string, AttrDef> = {
  duration: { key: 'duration', label: 'Duration', options: DUR },
  onset: { key: 'onset', label: 'Onset', options: ['Sudden', 'Acute', 'Subacute', 'Gradual', 'Insidious', 'Paroxysmal', 'After trauma', 'After food'] },
  progression: { key: 'progression', label: 'Progression', options: ['Progressive', 'Static', 'Improving', 'Intermittent', 'Episodic', 'Relapsing and remitting', 'Rapidly worsening'] },
  severity: { key: 'severity', label: 'Severity', options: ['Mild', 'Moderate', 'Severe'] },
  side: { key: 'side', label: 'Side', options: ['Right', 'Left', 'Bilateral', 'Central'] },
  site: { key: 'site', label: 'Site', options: [] },
  nature: { key: 'nature', label: 'Nature of pain', options: ['Dull aching', 'Sharp', 'Colicky', 'Burning', 'Throbbing', 'Stabbing', 'Gnawing', 'Cramping', 'Pressure / squeezing', 'Pricking'] },
  radiation: { key: 'radiation', label: 'Radiation', options: ['None', 'To the back', 'To the shoulder', 'To the groin', 'To the left arm', 'To the jaw', 'Down the leg', 'To the ear'] },
  aggravating: { key: 'aggravating', label: 'Aggravating factors', options: ['Food', 'Exertion', 'Rest', 'Coughing', 'Movement', 'Lying down', 'Cold', 'Night time', 'Fasting', 'Stress', 'Walking'], multi: true },
  relieving: { key: 'relieving', label: 'Relieving factors', options: ['Rest', 'Medication', 'Antacids', 'Vomiting', 'Change of position', 'Food', 'Warmth', 'Leaning forward', 'Elevating the limb', 'Massage'], multi: true },
  timing: { key: 'timing', label: 'Timing / pattern', options: ['Continuous', 'Intermittent', 'Worse at night', 'Worse in the morning', 'Seasonal', 'Postural', 'Related to meals'] },
  episodes: { key: 'episodes', label: 'Episodes', options: ['Single episode', 'Recurrent', 'Continuous'] },
  amount: { key: 'amount', label: 'Amount', options: ['Scanty', 'Moderate', 'Copious'] },
  colour: { key: 'colour', label: 'Colour', options: [] },
  discharge: { key: 'discharge', label: 'Type', options: ['Serous', 'Mucoid', 'Purulent', 'Seropurulent', 'Blood-stained', 'Watery'] },
  smell: { key: 'smell', label: 'Smell', options: ['Foul smelling', 'Not foul smelling'] },
  trauma: { key: 'trauma', label: 'Trauma', options: ['No history of trauma', 'History of trauma'] },
  associated: { key: 'associated', label: 'Associated symptoms', options: [] },
  grade: { key: 'grade', label: 'Grade', options: [] },
}

export function resolveAttr(a: AttrRef): AttrDef {
  if (typeof a !== 'string') return a
  return ATTRS[a] ?? { key: a, label: a, options: [] }
}
