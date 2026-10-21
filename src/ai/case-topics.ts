// 100 curated Ward Round cases. Format: group | topic | difficulty (e/m/h) | setting
const RAW = `
Medicine|Inferior wall STEMI|m|emergency
Medicine|Unstable angina / NSTEMI|m|emergency
Medicine|Acute left ventricular failure with pulmonary oedema|m|emergency
Medicine|Atrial fibrillation with rapid ventricular response|m|emergency
Medicine|Infective endocarditis|h|ward
Medicine|Rheumatic mitral stenosis|m|opd
Medicine|Hypertensive emergency|m|emergency
Medicine|Acute pulmonary embolism|h|emergency
Medicine|Acute severe asthma|e|emergency
Medicine|COPD acute exacerbation|m|ward
Medicine|Pulmonary tuberculosis|e|opd
Medicine|Community-acquired pneumonia|e|ward
Medicine|Upper GI bleed from oesophageal varices|h|emergency
Medicine|Acute pancreatitis|m|emergency
Medicine|Cirrhosis with hepatic encephalopathy|h|ward
Medicine|Acute viral hepatitis|e|opd
Medicine|Ischaemic stroke|m|emergency
Medicine|Acute bacterial meningitis|m|emergency
Medicine|Status epilepticus|m|emergency
Medicine|Guillain-Barre syndrome|h|ward
Medicine|Diabetic ketoacidosis|m|emergency
Medicine|Graves disease with thyrotoxicosis|e|opd
Medicine|Addisonian crisis|h|emergency
Medicine|Acute kidney injury (pre-renal)|m|ward
Medicine|Nephrotic syndrome in an adult|m|ward
Medicine|Hyperkalaemia with ECG changes|m|emergency
Medicine|Severe falciparum malaria|m|ward
Medicine|Dengue with warning signs|e|ward
Surgery|Acute appendicitis|e|emergency
Surgery|Adhesive small bowel obstruction|m|emergency
Surgery|Perforated duodenal ulcer|m|emergency
Surgery|Acute calculous cholecystitis|e|emergency
Surgery|Carcinoma head of pancreas with obstructive jaundice|h|opd
Surgery|Strangulated inguinal hernia|m|emergency
Surgery|Carcinoma breast|m|opd
Surgery|Solitary thyroid nodule|m|opd
Surgery|Acute limb ischaemia|h|emergency
Surgery|Blunt abdominal trauma with splenic injury|h|emergency
Surgery|Tension pneumothorax|m|emergency
Surgery|Carcinoma rectum|m|opd
Surgery|Major burns (40% TBSA)|m|emergency
Surgery|Diabetic foot with gas gangrene|m|ward
Obstetrics & Gynaecology|Eclampsia|m|labour
Obstetrics & Gynaecology|Postpartum haemorrhage|m|labour
Obstetrics & Gynaecology|Ruptured ectopic pregnancy|m|emergency
Obstetrics & Gynaecology|Placenta praevia|m|labour
Obstetrics & Gynaecology|Gestational diabetes mellitus|e|opd
Obstetrics & Gynaecology|Obstructed labour|h|labour
Obstetrics & Gynaecology|Abruptio placentae|m|labour
Obstetrics & Gynaecology|Polycystic ovary syndrome|e|opd
Obstetrics & Gynaecology|Carcinoma cervix|m|opd
Obstetrics & Gynaecology|Pelvic inflammatory disease|e|opd
Paediatrics|Acute diarrhoea with severe dehydration in a child|e|paeds
Paediatrics|Bronchiolitis in an infant|e|paeds
Paediatrics|Simple febrile seizure|e|paeds
Paediatrics|Kawasaki disease|h|paeds
Paediatrics|Neonatal jaundice|m|paeds
Paediatrics|Severe acute malnutrition|m|paeds
Paediatrics|Tetralogy of Fallot with a cyanotic spell|h|paeds
Paediatrics|Acute rheumatic fever|m|paeds
Paediatrics|Post-streptococcal glomerulonephritis|m|paeds
Paediatrics|Infantile hypertrophic pyloric stenosis|m|paeds
Emergency & Toxicology|Organophosphate poisoning|e|emergency
Emergency & Toxicology|Neurotoxic snakebite|m|emergency
Emergency & Toxicology|Paracetamol overdose|m|emergency
Emergency & Toxicology|Anaphylaxis|e|emergency
Emergency & Toxicology|Heat stroke|m|emergency
Emergency & Toxicology|Carbon monoxide poisoning|m|emergency
Emergency & Toxicology|Head injury with extradural haematoma|h|emergency
Emergency & Toxicology|Cardiac arrest with ventricular fibrillation|m|icu
Orthopaedics|Fracture neck of femur in the elderly|m|emergency
Orthopaedics|Supracondylar fracture of the humerus in a child|m|paeds
Orthopaedics|Septic arthritis of the knee|m|ward
Orthopaedics|Compartment syndrome|h|emergency
ENT|Epistaxis|e|emergency
ENT|Acute otitis media with mastoiditis|m|opd
ENT|Foreign body aspiration in a child|m|emergency
Ophthalmology|Acute angle-closure glaucoma|m|emergency
Ophthalmology|Central retinal artery occlusion|h|emergency
Ophthalmology|Corneal ulcer|e|opd
Dermatology|Borderline tuberculoid leprosy|m|opd
Dermatology|Stevens-Johnson syndrome|h|ward
Dermatology|Scabies|e|opd
Psychiatry|Acute mania|m|ward
Psychiatry|Alcohol withdrawal with delirium tremens|m|ward
Psychiatry|Major depressive disorder|e|opd
Psychiatry|First-episode schizophrenia|m|opd
Community Medicine|Measles outbreak investigation|m|community
Community Medicine|Cholera outbreak in a village|m|community
Community Medicine|Rabies post-exposure prophylaxis|e|community
Forensic Medicine|Ante-mortem hanging|m|forensic
Forensic Medicine|Acute alcohol intoxication (medicolegal case)|e|emergency
Forensic Medicine|Grievous hurt - wound examination and injury certificate|m|forensic
Anaesthesia|Malignant hyperthermia|h|ot
Anaesthesia|High spinal block with hypotension|m|ot
Haematology|Iron deficiency anaemia|e|opd
Haematology|Sickle cell crisis|m|emergency
Haematology|Acute lymphoblastic leukaemia in a child|m|ward
Haematology|Immune thrombocytopenia|m|ward
Haematology|Chronic myeloid leukaemia|m|opd
`;

export type CaseTopic = { id: string; group: string; topic: string; difficulty: 'easy' | 'medium' | 'hard'; setting: string };
const D: Record<string, 'easy' | 'medium' | 'hard'> = { e: 'easy', m: 'medium', h: 'hard' };

export const CASE_TOPICS: CaseTopic[] = RAW.trim().split('\n').map((line, i) => {
  const [group, topic, d, setting] = line.split('|');
  return { id: 'ward-' + String(i + 1).padStart(3, '0'), group, topic, difficulty: D[d] || 'medium', setting };
});
