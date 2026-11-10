import type { Answers } from '../types'
import { P, A, F, merge, lines } from './kit'
import { child, birthH, immH, nutH, famH, envH, anthro, gpe, cleanSigns } from './paed-kit'

const noAb = F([], ['Umbilicus everted', 'Visible peristalsis', 'Dilated veins', 'Tenderness', 'Guarding', 'Rigidity', 'Rebound tenderness', 'Palpable mass', 'Ballotable kidney', 'Shifting dullness', 'Fluid thrill'])
const pastN = F([], ['Similar illness in the past', 'Previous hospital admissions', 'Tuberculosis contact', 'Seizures', 'Major surgery', 'Blood transfusion', 'Drug allergy', 'Food allergy'])

export const SAMPLES_PAED_A: Record<string, Answers> = {
  'paed-gastro': merge(child('Baby S.', '2 years', 'Female', 'Mother', 'Second'), birthH(), immH(), nutH(), famH(), envH('Upper lower'), {
    cc: { 'Diarrhoea': '3 days', 'Vomiting': '2 days', 'Fever': '2 days', 'Decreased urine output': '1 day' },
    diarr: P({ onset: ['Acute'], duration: ['3 days'], episodes: ['Recurrent'], amount: ['Copious'], stool: ['Watery'], ass: ['Fever', 'Vomiting', 'Thirst', 'Reduced urine', 'Lethargy'] }),
    vomit: P({ onset: ['Acute'], duration: ['2 days'], episodes: ['Recurrent'], type: ['Non-bilious', 'After feeds'] }), fever: P({ onset: ['Acute'], duration: ['2 days'], progression: ['Static'] }),
    pain: A, jaundice: A, dist: A, urine: A, const: A, melaena: A,
    also: F(['Sunken eyes', 'Excessive thirst', 'Contaminated water or food', 'Decreased appetite'], ['Weight loss', 'Contact with similar cases', 'Worm infestation', 'Pica']),
    pastHx: pastN, pastNotes: 'Two earlier episodes of loose stools, managed at home with ORS. Not taking any antibiotics.',
    histS: lines('• 2-year-old girl with watery diarrhoea (about 10 episodes a day) for 3 days, vomiting for 2 days and low-grade fever', '• Thirsty, drinking eagerly, passing less urine, lethargic; no blood in stool', '• Water source is a shared tap; fully immunised including rotavirus'),
    ...anthro('10 kg', '85 cm', '47 cm', '13.5 cm', '13.8', 'Within normal range (median +/-2 SD)', 'Weight 10 kg now; 10.8 kg two weeks ago (about 7 percent loss).'),
    ...gpe('Irritable', 'Well nourished', cleanSigns(['Dehydration', 'Sunken eyes', 'Skin pinch goes back slowly']), '132/min', '', '34/min', '37.9 C', '98% on room air', 'Restless and irritable, drinks eagerly, dry tongue, sunken eyes, skin pinch goes back slowly (less than 2 seconds), capillary refill 2 seconds, no tears on crying.'),
    shape: ['Flat'], abdF: F(['Bowel sounds normal', 'Hernial orifices normal'], ['Tenderness', 'Guarding', 'Rigidity', 'Hepatomegaly', 'Splenomegaly', 'Palpable mass', 'Shifting dullness', 'Visible peristalsis']), abdN: 'Soft, no organomegaly, hyperactive bowel sounds.', pr: 'Not required.',
    summary: 'A 2-year-old fully immunised girl with acute watery diarrhoea, vomiting and fever for 3 days, restless and thirsty with sunken eyes and slow skin pinch, giving some dehydration with no blood in stool.',
    provDx: 'Acute watery diarrhoea with some dehydration (WHO Plan B), probably rotavirus or viral gastroenteritis.', ddx: lines('1. Bacterial diarrhoea or cholera (rice-water stool, severe dehydration)', '2. Dysentery (Shigella, amoebiasis): blood and mucus in stool', '3. Food poisoning, giardiasis, lactose intolerance', '4. Systemic infection (sepsis, UTI, otitis media) causing diarrhoea, intussusception'),
    ix: lines('Clinical diagnosis. Serum electrolytes, urea, creatinine and blood sugar if severe dehydration.', 'Stool routine and culture only for blood in the stool or persistent diarrhoea.', 'Complete blood count; urine routine when fever persists.', 'Blood gas for acidosis in severe cases.'),
    rx: lines('Plan B: low osmolarity ORS 75 mL/kg (750 mL) over 4 hours in small frequent sips, reassess after 4 hours, then Plan A.', 'Zinc 20 mg daily for 14 days, continue breast feeds and normal diet.', 'Antibiotics not routine; treat only dysentery, cholera or associated infection; no antimotility drugs.', 'Counsel on hand washing, safe water, ORS preparation, and danger signs; review in 2 days.'),
  }),

  'paed-hsm': merge(child('Master R.', '6 years', 'Male', 'Mother', 'First'), birthH(), immH(), nutH(), famH(true), envH('Upper lower'), {
    cc: { 'Distension of abdomen': '1 year', 'Yellowish discolouration of eyes / skin': '4 months', 'Fever': '5 days', 'Decreased appetite': '6 months' },
    dist: P({ onset: ['Insidious'], duration: ['1 year'], progression: ['Progressive'], ass: ['Facial puffiness'] }), jaundice: P({ onset: ['Gradual'], duration: ['3 months'], progression: ['Progressive'], ass: ['Dark urine'] }),
    fever: P({ onset: ['Acute'], duration: ['5 days'], progression: ['Static'] }), pain: A, vomit: A, diarr: A, urine: A, const: A, melaena: A,
    also: F(['Decreased appetite', 'Weight loss'], ['Contaminated water or food', 'Pica', 'Worm infestation']),
    pastHx: F(['Previous hospital admissions', 'Blood transfusion'], ['Seizures', 'Major surgery', 'Drug allergy', 'Food allergy']), pastNotes: 'Pallor noticed at 8 months of age, repeated blood transfusions every 3 to 4 weeks since then (last 5 weeks ago); no iron chelation taken regularly.',
    histS: lines('• 6-year-old boy of consanguineous parents with progressive abdominal distension for 1 year and yellowish eyes for 4 months', '• Pallor since infancy, transfusions every 3 to 4 weeks, poor growth and appetite', '• Fever for 5 days, no bleeding'),
    ...anthro('14 kg', '103 cm', '49 cm', '13 cm', '13.2', 'Below -2 SD (underweight / stunted / wasted)', 'Short stature and underweight.'),
    ...gpe('Lethargic', 'Mildly malnourished', cleanSigns(['Pallor', 'Icterus', 'Dysmorphic features', 'Lymphadenopathy']), '110/min', '', '26/min', '38.2 C', '97% on room air', 'Pale and icteric, bossing of the skull and prominent maxilla (chipmunk facies), bronze-tinged skin, no pedal oedema.'),
    shape: ['Distended'], abdF: F(['Hepatomegaly', 'Splenomegaly', 'Bowel sounds normal'], ['Tenderness', 'Shifting dullness', 'Dilated veins', 'Fluid thrill', 'Palpable mass']), abdN: 'Liver palpable 5 cm and spleen 8 cm below the costal margins, both firm and non-tender, spleen with notch, no ascites.', pr: 'Not required.',
    summary: 'A 6-year-old boy of a consanguineous marriage with pallor since infancy, transfusion dependence, jaundice, short stature, chipmunk facies, firm hepatosplenomegaly (spleen 8 cm) and fever.',
    provDx: 'Beta-thalassaemia major with massive splenomegaly, hypersplenism and transfusional iron overload.', ddx: lines('1. Hereditary spherocytosis and other haemolytic anaemias, G6PD deficiency', '2. Chronic liver disease with portal hypertension (extrahepatic portal vein obstruction, Wilson disease)', '3. Storage disorders (Gaucher, Niemann-Pick), leukaemia and lymphoma', '4. Malaria (tropical splenomegaly), kala-azar, chronic infection'),
    ix: lines('CBC (Hb 5.8 g/dL, microcytic hypochromic), peripheral smear (target cells, nucleated red cells), reticulocyte count.', 'Haemoglobin HPLC (HbF raised, HbA absent), parents HPLC.', 'Serum ferritin, LFT (indirect bilirubin), abdomen ultrasound, echo, T2* MRI of heart and liver.', 'Blood culture and malaria test for the fever; HIV, HBsAg, HCV screening.'),
    rx: lines('Regular packed red cell transfusions to keep pre-transfusion Hb 9.5 to 10.5 g/dL (leucodepleted, every 3 to 4 weeks).', 'Iron chelation (deferasirox oral) once ferritin is above 1000 ng/mL; folic acid; vaccination (Hepatitis B, pneumococcal, meningococcal).', 'Splenectomy for hypersplenism or rising transfusion needs after age 5 with post-splenectomy prophylaxis.', 'Definitive: matched sibling bone marrow transplantation; genetic counselling and prenatal diagnosis.'),
  }),

  'paed-nephrotic': merge(child('Master V.', '5 years', 'Male', 'Mother', 'Second'), birthH(), immH(), nutH(), famH(), envH(), {
    cc: { 'Facial puffiness': '10 days', 'Distension of abdomen': '7 days', 'Decreased urine output': '5 days' },
    dist: P({ onset: ['Gradual'], duration: ['1 week'], progression: ['Progressive'], ass: ['Facial puffiness', 'Pedal oedema', 'Reduced urine'] }), urine: P({ onset: ['Gradual'], duration: ['5 days'], progression: ['Static'], ass: ['Frothy urine', 'Facial puffiness'] }),
    fever: A, pain: A, vomit: A, diarr: A, jaundice: A, const: A, melaena: A,
    also: F(['Decreased appetite'], ['Weight loss', 'Contact with similar cases']),
    pastHx: pastN, pastNotes: 'No skin infection, sore throat, haematuria or hypertension. No previous episode of oedema.',
    histS: lines('• 5-year-old boy with puffiness of face for 10 days, followed by pedal oedema and abdominal distension', '• Reduced, frothy urine; no haematuria, fever, rash or joint pain', '• No past or family history of renal disease'),
    ...anthro('20 kg', '108 cm', '50 cm', '15 cm', '17.1', 'Within normal range (median +/-2 SD)', 'Weight increased from 17.5 kg dry weight with oedema.'),
    ...gpe('Active, playful', 'Well nourished', cleanSigns(['Oedema (pedal / facial)']), '96/min', '98/62 mmHg (normal for age)', '24/min', '37.0 C', '98% on room air', 'Periorbital puffiness, pitting pedal oedema, scrotal oedema. No pallor, jaundice or rash. BP normal.'),
    shape: ['Distended'], abdF: F(['Shifting dullness', 'Fluid thrill', 'Bowel sounds normal'], ['Tenderness', 'Hepatomegaly', 'Splenomegaly', 'Palpable mass', 'Rigidity', 'Guarding']), abdN: 'Free fluid in the abdomen, umbilicus flat, no organomegaly, hernial orifices normal.', pr: 'Not required.',
    summary: 'A 5-year-old boy with periorbital, pedal and scrotal oedema, ascites and frothy urine, with normal blood pressure and no haematuria or systemic features.',
    provDx: 'Nephrotic syndrome, first episode, probably minimal change disease.', ddx: lines('1. Acute glomerulonephritis (haematuria, hypertension, oliguria)', '2. Steroid-resistant causes: FSGS, membranous, membranoproliferative GN', '3. Protein-losing enteropathy, hepatic failure, malnutrition, cardiac failure', '4. Secondary nephrotic syndrome: SLE, hepatitis B, HIV'),
    ix: lines('Urine: protein 3+ or more, no RBCs; spot urine protein:creatinine ratio above 2; 24-hour protein above 40 mg/m2/h.', 'Serum albumin below 2.5 g/dL, cholesterol raised, urea, creatinine, electrolytes; C3 normal.', 'Complete blood count, Mantoux, chest X-ray and HIV and hepatitis B screening before steroids.', 'Renal biopsy only for steroid resistance, age below 1 year or above 12, haematuria, or low C3.'),
    rx: lines('Prednisolone 2 mg/kg/day (60 mg/m2) for 6 weeks, then 1.5 mg/kg on alternate days for 6 weeks, tapered.', 'Salt restriction, normal protein diet, diuretics (furosemide) for marked oedema; albumin infusion if refractory.', 'Treat infection promptly; vaccinate with pneumococcal; deworm and calcium with vitamin D.', 'Parents taught urine dipstick monitoring; relapse and steroid dependence managed with levamisole, cyclophosphamide, mycophenolate or rituximab.'),
  }),

  'paed-leukaemia': merge(child('Master A.', '6 years', 'Male', 'Father', 'Second'), birthH(), immH(), nutH(), famH(), envH(), {
    cc: { 'Fever': '3 weeks', 'Decreased appetite': '1 month' },
    fever: P({ onset: ['Insidious'], duration: ['1 month'], progression: ['Relapsing and remitting'] }), pain: A, vomit: A, diarr: A, jaundice: A, dist: A, urine: A, const: A, melaena: A,
    also: F(['Decreased appetite', 'Weight loss'], ['Contaminated water or food', 'Contact with similar cases']),
    pastHx: pastN, pastNotes: 'Progressive pallor and easy fatigue for 1 month, bleeding from gums and petechial spots for 2 weeks, pain in the legs and refusal to walk. No history of radiation or chemicals; no prior transfusion.',
    histS: lines('• 6-year-old boy with low-grade fever for 3 weeks, progressive pallor, easy fatigue and loss of appetite', '• Bleeding gums, petechiae, and bone pain with limp', '• No exposure to radiation, no similar illness in the family'),
    ...anthro('16 kg', '109 cm', '50 cm', '14 cm', '13.5', 'Below -2 SD (underweight / stunted / wasted)', 'Weight loss of 2 kg in 1 month.'),
    ...gpe('Lethargic', 'Mildly malnourished', cleanSigns(['Pallor', 'Lymphadenopathy', 'Skin lesions']), '120/min', '', '28/min', '38.4 C', '98% on room air', 'Severe pallor, petechiae and ecchymoses over the trunk and limbs, bleeding gums, multiple 1 to 2 cm firm non-tender cervical and axillary nodes, sternal tenderness.'),
    shape: ['Distended'], abdF: F(['Hepatomegaly', 'Splenomegaly', 'Bowel sounds normal'], ['Tenderness', 'Palpable mass', 'Shifting dullness']), abdN: 'Liver 4 cm and spleen 3 cm below the costal margin, firm, non-tender, no ascites. Testes normal.', pr: 'Not required.',
    summary: 'A 6-year-old boy with 3 weeks of fever, progressive pallor, bleeding and petechiae, bone pain, generalised lymphadenopathy and hepatosplenomegaly with sternal tenderness.',
    provDx: 'Acute lymphoblastic leukaemia (ALL), to be confirmed by bone marrow examination.', ddx: lines('1. Aplastic anaemia (pancytopenia without organomegaly)', '2. Acute myeloid leukaemia, lymphoma, neuroblastoma with marrow infiltration', '3. Infectious mononucleosis, tuberculosis, viral infection with atypical lymphocytes', '4. ITP, juvenile arthritis (systemic onset), osteomyelitis'),
    ix: lines('CBC and smear: Hb 5.1 g/dL, TLC 62,000 with blasts, platelets 18,000.', 'Bone marrow aspirate and biopsy: over 25 percent lymphoblasts; cytochemistry (MPO negative), immunophenotyping, cytogenetics (BCR-ABL, TEL-AML1).', 'LFT, renal function, uric acid, LDH, electrolytes, coagulation profile, chest X-ray (mediastinal mass), abdominal ultrasound.', 'CSF cytology for CNS involvement, HIV, HBsAg, HCV screening.'),
    rx: lines('Supportive: packed red cells, platelet transfusion, antibiotics for febrile neutropenia, hydration, allopurinol or rasburicase for tumour lysis.', 'Chemotherapy: induction (vincristine, prednisolone, daunorubicin, L-asparaginase, intrathecal methotrexate), consolidation, maintenance with 6-MP and methotrexate for 2 years.', 'CNS prophylaxis with intrathecal chemotherapy; cranial radiotherapy only in selected patients.', 'Counselling, nutrition, infection prevention; bone marrow transplant for high-risk or relapsed disease.'),
  }),

  'paed-malaria': merge(child('Master P.', '8 years', 'Male', 'Mother', 'Third', 'Karwar, Karnataka'), birthH(), immH(), nutH(), famH(), envH('Upper lower', 'Kutcha', 'Open defecation'), {
    cc: { 'Fever': '5 days', 'Decreased appetite': '5 days', 'Vomiting': '2 days' },
    fever: P({ onset: ['Acute'], duration: ['5 days'], progression: ['Relapsing and remitting'] }), vomit: P({ onset: ['Acute'], duration: ['2 days'], episodes: ['Recurrent'], type: ['Non-bilious'] }), pain: A, diarr: A, jaundice: A, dist: A, urine: A, const: A, melaena: A,
    also: F(['Decreased appetite', 'Contact with similar cases'], ['Weight loss', 'Worm infestation']),
    pastHx: pastN, pastNotes: 'High-grade fever with chills and rigors every alternate day, with headache and sweating, relieved temporarily by paracetamol. Neighbours had similar fever; stagnant water around the house during the monsoon.',
    histS: lines('• 8-year-old boy with high fever with chills and rigors, alternate-day pattern, for 5 days with headache and vomiting', '• Decreased appetite and pallor; no cough, burning micturition, rash or altered sensorium', '• Lives in a malaria-endemic coastal area with stagnant water; neighbours with similar fever'),
    ...anthro('22 kg', '120 cm', '51 cm', '15 cm', '15.3', 'Within normal range (median +/-2 SD)'),
    ...gpe('Irritable', 'Mildly malnourished', cleanSigns(['Pallor']), '118/min', '100/64 mmHg', '26/min', '39.4 C', '98% on room air', 'Febrile, flushed, moderate pallor, no icterus, no lymphadenopathy, no rash, no neck stiffness.'),
    shape: ['Flat'], abdF: F(['Splenomegaly', 'Bowel sounds normal'], ['Tenderness', 'Hepatomegaly', 'Palpable mass', 'Shifting dullness']), abdN: 'Soft spleen palpable 3 cm below the left costal margin, no hepatomegaly.', pr: 'Not required.',
    summary: 'An 8-year-old boy from an endemic area with alternate-day high fever with chills and rigors, pallor and a palpable spleen, in the absence of localising signs.',
    provDx: 'Malaria (Plasmodium vivax, probable), uncomplicated.', ddx: lines('1. Falciparum malaria (complicated: cerebral malaria, severe anaemia, ARDS)', '2. Enteric fever, dengue, leptospirosis, scrub typhus', '3. Urinary tract infection, kala-azar, viral fever, tuberculosis', '4. Meningitis, septicaemia'),
    ix: lines('Peripheral blood smear (thick and thin) for malarial parasite, or rapid diagnostic test (PfHRP2, pLDH).', 'CBC (anaemia, thrombocytopenia), blood sugar, LFT, renal function, urine routine.', 'Blood culture and Widal/typhidot, dengue NS1 for fever work-up.', 'G6PD level before primaquine.'),
    rx: lines('P. vivax: chloroquine 25 mg/kg over 3 days (10, 10, 5 mg/kg) plus primaquine 0.25 mg/kg for 14 days after G6PD testing.', 'P. falciparum: artemisinin combination therapy (artesunate with sulfadoxine-pyrimethamine) for 3 days with single-dose primaquine; severe disease needs IV artesunate.', 'Antipyretics, fluids, and iron-folate after recovery; watch for hypoglycaemia and convulsions.', 'Prevention: bed nets, source reduction, repellents, and notification to the programme.'),
  }),
}
