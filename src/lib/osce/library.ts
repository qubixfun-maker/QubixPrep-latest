export type LibSeed = {
  id: string
  subject: string
  label: string
  proformaId: string
  topic: string
  inf?: { relation: string; gender: 'Male' | 'Female' }
}

export const LIB_SUBJECTS: { key: string; label: string }[] = [
  { key: 'medicine', label: 'Medicine' },
  { key: 'surgery', label: 'Surgery' },
  { key: 'paediatrics', label: 'Paediatrics' },
  { key: 'obg', label: 'Obstetrics & Gynaecology' },
  { key: 'ent', label: 'ENT' },
  { key: 'orthopaedics', label: 'Orthopaedics' },
  { key: 'psychiatry', label: 'Psychiatry' },
  { key: 'dermatology', label: 'Dermatology' },
  { key: 'ophthalmology', label: 'Ophthalmology' },
  { key: 'anaesthesiology', label: 'Anaesthesiology' },
]

/** Informant relations used by some cases (the patient cannot give the history). */
const FEMALE_REL = new Set(['Wife', 'Mother', 'Daughter', 'Sister'])

type Row = [proformaId: string, topic: string, informant?: string]

const GROUPS: { subject: string; label: string; rows: Row[] }[] = [
  { subject: 'medicine', label: 'Medicine', rows: [
    ['med-git', 'Cirrhosis of liver with ascites'],
    ['med-git', 'Hepatic encephalopathy in chronic liver disease', 'Wife'],
    ['med-git', 'Peptic ulcer disease with upper GI bleed'],
    ['med-git', 'Amoebic liver abscess'],
    ['med-cns', 'Ischaemic stroke with right hemiparesis and aphasia', 'Wife'],
    ['med-cns', 'Parkinson disease'],
    ['med-cns', 'Guillain-Barre syndrome'],
    ['med-rs', 'Pulmonary tuberculosis'],
    ['med-rs', 'Chronic obstructive pulmonary disease'],
    ['med-rs', 'Bronchial asthma'],
    ['med-rs', 'Pleural effusion'],
    ['med-cvs', 'Rheumatic mitral stenosis'],
    ['med-cvs', 'Congestive cardiac failure'],
    ['med-cvs', 'Infective endocarditis'],
    ['med-anaemia', 'Iron deficiency anaemia'],
    ['med-anaemia', 'Chronic myeloid leukaemia'],
    ['med-fever', 'Enteric fever'],
    ['med-fever', 'Malaria'],
    ['med-diabetes', 'Type 2 diabetes mellitus with diabetic foot'],
    ['med-diabetes', 'Diabetic ketoacidosis', 'Mother'],
    ['med-renal', 'Chronic kidney disease'],
    ['med-renal', 'Nephrotic syndrome'],
    ['med-rheum', 'Rheumatoid arthritis'],
    ['med-poison', 'Organophosphate poisoning', 'Brother'],
  ] },
  { subject: 'surgery', label: 'Surgery', rows: [
    ['sur-varicose', 'Varicose veins of the lower limb'],
    ['sur-scrotal', 'Hydrocele'],
    ['sur-scrotal', 'Varicocele'],
    ['sur-lump', 'Lipoma'],
    ['sur-lump', 'Sebaceous cyst'],
    ['sur-breast', 'Fibroadenoma of the breast'],
    ['sur-breast', 'Carcinoma of the breast'],
    ['sur-ulcer', 'Venous ulcer'],
    ['sur-ulcer', 'Trophic ulcer'],
    ['sur-thyroid', 'Multinodular goitre'],
    ['sur-thyroid', 'Solitary nodule of the thyroid'],
    ['sur-abdomen', 'Acute appendicitis'],
    ['sur-abdomen', 'Intestinal obstruction'],
    ['sur-abdomen', 'Gallstones with acute cholecystitis'],
    ['sur-hernia', 'Inguinal hernia'],
    ['sur-pvd', 'Peripheral arterial disease (Buerger disease)'],
  ] },
  { subject: 'paediatrics', label: 'Pediatrics', rows: [
    ['paed-git', 'Acute gastroenteritis with dehydration'],
    ['paed-git', 'Intussusception'],
    ['paed-nutrition', 'Severe acute malnutrition (marasmus)'],
    ['paed-nutrition', 'Nutritional rickets'],
    ['paed-newborn', 'Neonatal jaundice'],
    ['paed-newborn', 'Neonatal sepsis'],
    ['paed-cns', 'Febrile seizures'],
    ['paed-cns', 'Pyogenic meningitis'],
    ['paed-cns', 'Cerebral palsy'],
    ['paed-resp', 'Pneumonia in a child'],
    ['paed-resp', 'Bronchial asthma in a child'],
    ['paed-cvs', 'Ventricular septal defect'],
    ['paed-cvs', 'Acute rheumatic fever'],
    ['paed-cvs', 'Tetralogy of Fallot'],
  ] },
  { subject: 'obg', label: 'Obstetrics & Gynecology', rows: [
    ['obg-gyn', 'Fibroid uterus'],
    ['obg-gyn', 'Uterine prolapse'],
    ['obg-gyn', 'Ovarian cyst'],
    ['obg-gyn', 'Abnormal uterine bleeding (menorrhagia)'],
    ['obg-gyn', 'Polycystic ovarian syndrome'],
    ['obg-gyn', 'Carcinoma of the cervix'],
    ['obg-anc', 'Pre-eclampsia'],
    ['obg-anc', 'Gestational diabetes mellitus'],
    ['obg-anc', 'Placenta previa'],
    ['obg-anc', 'Severe anaemia in pregnancy'],
  ] },
  { subject: 'ent', label: 'ENT', rows: [
    ['ent-ear', 'Chronic suppurative otitis media (tubotympanic)'],
    ['ent-ear', 'Otosclerosis'],
    ['ent-nose', 'Deviated nasal septum with chronic sinusitis'],
    ['ent-nose', 'Nasal polyposis'],
    ['ent-throat', 'Chronic tonsillitis'],
    ['ent-throat', 'Carcinoma of the larynx'],
  ] },
  { subject: 'orthopaedics', label: 'Orthopedics', rows: [
    ['ortho-fracture', 'Fracture shaft of femur'],
    ['ortho-fracture', 'Colles fracture'],
    ['ortho-fracture', 'Supracondylar fracture of the humerus in a child'],
    ['ortho-joint', 'Osteoarthritis of the knee'],
    ['ortho-spine', 'Lumbar disc prolapse'],
    ['ortho-spine', 'Pott spine (tuberculosis of the spine)'],
    ['ortho-osteo', 'Chronic osteomyelitis'],
    ['ortho-tumour', 'Osteosarcoma'],
    ['ortho-tumour', 'Giant cell tumour of bone'],
    ['ortho-nerve', 'Radial nerve palsy (wrist drop)'],
  ] },
  { subject: 'psychiatry', label: 'Psychiatry', rows: [
    ['psy-depression', 'Major depressive disorder'],
    ['psy-mania', 'Bipolar disorder, current episode mania'],
    ['psy-schizo', 'Schizophrenia'],
    ['psy-anxiety', 'Obsessive compulsive disorder'],
    ['psy-alcohol', 'Alcohol dependence syndrome with withdrawal'],
    ['psy-organic', 'Delirium in an elderly patient', 'Son'],
  ] },
  { subject: 'dermatology', label: 'Dermatology', rows: [
    ['derm-papulosq', 'Psoriasis'],
    ['derm-eczema', 'Scabies'],
    ['derm-bullous', 'Pemphigus vulgaris'],
    ['derm-leprosy', 'Borderline tuberculoid leprosy'],
    ['derm-pigment', 'Vitiligo'],
  ] },
  { subject: 'ophthalmology', label: 'Ophthalmology', rows: [
    ['eye-red', 'Corneal ulcer'],
    ['eye-gradual', 'Senile cataract'],
    ['eye-sudden', 'Rhegmatogenous retinal detachment'],
    ['eye-lid', 'Chalazion'],
    ['eye-squint', 'Concomitant convergent squint'],
  ] },
  { subject: 'anaesthesiology', label: 'Anaesthesiology', rows: [
    ['an-pac', 'Pre-anaesthetic check-up for laparoscopic cholecystectomy'],
    ['an-comorbid', 'Hypertensive diabetic patient posted for surgery'],
    ['an-airway', 'Anticipated difficult airway'],
    ['an-regional', 'Spinal anaesthesia for caesarean section'],
  ] },
]

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

export const LIB_SEEDS: LibSeed[] = GROUPS.flatMap((g) =>
  g.rows.map(([proformaId, topic, rel]) => ({
    id: `${proformaId}-${slug(topic)}`,
    subject: g.subject,
    label: g.label,
    proformaId,
    topic,
    ...(rel ? { inf: { relation: rel, gender: (FEMALE_REL.has(rel) ? 'Female' : 'Male') as 'Male' | 'Female' } } : {}),
  })),
)
