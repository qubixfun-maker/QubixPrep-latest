import type { Audience, GateType } from '@/types/quickcards'

export interface CardFeatureConfig {
  slug: string
  name: string
  description: string
  /** lucide-react icon name, resolved in components/quickcards/icons.ts */
  icon: string
  audience: Audience
  /** Used until the admin saves settings for the feature */
  defaultGate: GateType
  sortOrder: number
  /** Card ID prefixes (letters before the number in the file name, e.g. C7.png -> "C") */
  prefixes: string[]
  /** Label for the feature-specific filter on the student page */
  filterLabel: string
  /** Search tags available for this feature (admin picks from these, students filter by them) */
  tags: string[]
}

// To add a ninth feature, add one entry here. Nothing else needs to change.
export const CARD_FEATURES: CardFeatureConfig[] = [
  {
    slug: 'lab-decoded',
    name: 'Lab Records Decoded',
    description: 'Investigations explained: normal values vs disease patterns.',
    icon: 'FlaskConical',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 1,
    prefixes: ['C', 'K', 'D'],
    filterLabel: 'Test group',
    tags: ['Haematology', 'Biochemistry', 'Liver', 'Kidney', 'Thyroid', 'Endocrine', 'Lipids', 'Cardiac markers', 'Coagulation', 'Urine', 'Serology', 'Microbiology', 'Electrolytes', 'ABG'],
  },
  {
    slug: 'opd-cases',
    name: 'OPD Clinical Reference',
    description: 'Common OPD presentations with investigations and treatment.',
    icon: 'Stethoscope',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 2,
    prefixes: ['O'],
    filterLabel: 'Body system',
    tags: ['Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Neurology', 'Endocrine', 'Renal', 'Dermatology', 'ENT', 'Ophthalmology', 'Paediatrics', 'Obstetrics & Gynaecology', 'Psychiatry', 'Musculoskeletal', 'Infectious disease'],
  },
  {
    slug: 'drug-cards',
    name: '100 Important Drugs',
    description: 'Doses, uses, side effects and common Indian brands.',
    icon: 'Pill',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 3,
    prefixes: ['M'],
    filterLabel: 'Drug class',
    tags: ['Antibiotics', 'Antihypertensives', 'Antidiabetics', 'Analgesics / NSAIDs', 'Cardiac drugs', 'Respiratory', 'GI drugs', 'CNS drugs', 'Anticoagulants', 'Antiepileptics', 'Antimalarials', 'Hormonal', 'Steroids', 'Antifungals / Antivirals', 'Psychiatric drugs'],
  },
  {
    slug: 'emergency-playbook',
    name: 'Emergency and Procedures',
    description: 'Step-by-step emergency management and procedures.',
    icon: 'Siren',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 4,
    prefixes: ['E', 'P'],
    filterLabel: 'Category',
    tags: ['Cardiac', 'Respiratory', 'Neuro', 'Trauma', 'Poisoning', 'Metabolic', 'Obstetric', 'Paediatric', 'Airway', 'Procedure', 'Vascular access'],
  },
  {
    slug: 'counselling-cards',
    name: 'Patient Counselling',
    description: 'What to tell the patient: structured counselling cards.',
    icon: 'MessagesSquare',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 5,
    prefixes: ['PC'],
    filterLabel: 'Topic',
    tags: ['Chronic disease', 'Medication', 'Lifestyle', 'Pregnancy', 'Child health', 'Vaccination', 'Contraception', 'Surgery / Procedure', 'Mental health', 'Breaking bad news'],
  },
  {
    slug: 'surgery-algorithms',
    name: 'Surgery Algorithms',
    description: 'Decision flowcharts for common surgical problems.',
    icon: 'Scissors',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 6,
    prefixes: ['S'],
    filterLabel: 'Region',
    tags: ['Abdomen', 'Trauma', 'Breast', 'Thyroid', 'Vascular', 'Urology', 'Hernia', 'Burns', 'Oncology', 'Paediatric surgery', 'Neurosurgery'],
  },
  {
    slug: 'fluid-cards',
    name: 'Fluid Cards',
    description: 'Fluid choice, rates and correction at a glance.',
    icon: 'Droplets',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 7,
    prefixes: ['F'],
    filterLabel: 'Situation',
    tags: ['Resuscitation', 'Maintenance', 'Paediatric', 'Burns', 'DKA', 'Electrolyte correction', 'Shock', 'Obstetric', 'Renal'],
  },
  {
    slug: 'ecg-cards',
    name: 'ECG Cards',
    description: 'Recognise rhythms and patterns, with criteria.',
    icon: 'Activity',
    audience: 'both',
    defaultGate: 'basic',
    sortOrder: 8,
    prefixes: ['G'],
    filterLabel: 'Rhythm type',
    tags: ['Normal', 'Tachyarrhythmia', 'Bradyarrhythmia', 'Heart blocks', 'Ischaemia / MI', 'Atrial', 'Ventricular', 'Pre-excitation', 'Electrolyte / Drug', 'Pacemaker'],
  },
]

export const FEATURE_BY_SLUG: Record<string, CardFeatureConfig> = Object.fromEntries(
  CARD_FEATURES.map((f) => [f.slug, f])
)

export const FEATURE_BY_PREFIX: Record<string, CardFeatureConfig> = Object.fromEntries(
  CARD_FEATURES.flatMap((f) => f.prefixes.map((p) => [p.toUpperCase(), f] as const))
)

export const SORTED_FEATURES = [...CARD_FEATURES].sort((a, b) => a.sortOrder - b.sortOrder)

export function getFeature(slug: string): CardFeatureConfig | undefined {
  return FEATURE_BY_SLUG[slug]
}
