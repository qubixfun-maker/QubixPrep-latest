import type { CaseDef } from './types'
import { txt, area, ch, fd, sym, sec, at } from './dsl'
import { mk } from './cases-util'

const anaemia = mk({
  id: 'med-anaemia', subject: 'medicine', title: 'Anaemia and blood disorders', blurb: 'Fatigue, pallor, bleeding, jaundice; includes transfusion assessment', medicineClosing: true,
  complaints: ['Easy fatigability', 'Weakness', 'Breathlessness on exertion', 'Palpitations', 'Giddiness', 'Pallor noticed', 'Bleeding', 'Pedal oedema', 'Fever', 'Yellowish discolouration of eyes', 'Bone pain', 'Headache', 'Loss of weight', 'Craving to eat mud or ice'],
  hpi: [
    sym('fatigue', 'Fatigue / weakness', ['onset', 'duration', 'progression', 'aggravating', 'relieving']),
    sym('dyspnoea', 'Breathlessness on exertion', ['onset', 'duration', 'progression', at('grade', 'Grade', ['Grade 1 (on heavy exertion)', 'Grade 2 (on climbing stairs)', 'Grade 3 (on walking on level ground)', 'Grade 4 (at rest)'])]),
    sym('palp', 'Palpitations', ['onset', 'duration', 'episodes', 'aggravating']),
    sym('giddy', 'Giddiness', ['onset', 'duration', 'episodes', at('ass', 'Associated with', ['Postural change', 'Tinnitus', 'Syncope', 'Headache'], true)]),
    sym('bleed', 'Bleeding', ['onset', 'duration', 'episodes', at('site', 'Site', ['Haematemesis', 'Melaena', 'Fresh blood per rectum (piles)', 'Menorrhagia', 'Epistaxis', 'Gum bleeding', 'Haematuria', 'Easy bruising', 'Post-traumatic prolonged bleeding'], true), 'amount']),
    sym('jaundice', 'Jaundice', ['onset', 'duration', 'episodes', at('ass', 'Associated with', ['Dark urine', 'Pale stools', 'Abdominal pain', 'Fever with chills', 'Episodic worsening'], true)]),
    sym('pica', 'Pica (craving for mud, ice, starch)', ['duration']),
    sym('fever', 'Fever', ['onset', 'duration', 'progression', at('ass', 'Associated with', ['Recurrent infections', 'Sore throat', 'Mouth ulcers', 'Night sweats'], true)]),
    sym('bone', 'Bone pain', ['onset', 'duration', 'site', 'progression']),
    sym('neuro', 'Tingling / numbness / unsteady gait', ['onset', 'duration', 'progression', at('part', 'Part involved', ['Hands', 'Feet', 'Both'], true)]),
    sym('worm', 'Worm infestation / dietary deficiency', ['duration', at('ass', 'Details', ['Pure vegetarian diet', 'Poor intake of iron-rich food', 'Passing worms in stool', 'Barefoot walking', 'Excess tea intake'], true)]),
  ],
  middle: [
    sec('transfusion', 'Transfusion history', [
      fd('txHx', 'History', ['Previous blood transfusion', 'Frequent transfusions (monthly or more)', 'Reaction to previous transfusion', 'On iron therapy', 'On vitamin B12 or folic acid', 'On chelation therapy']),
      area('txN', 'Number of units, last transfusion, response'),
    ]),
  ],
  pastExtra: ['Peptic ulcer disease', 'Piles', 'Chronic kidney disease', 'Malaria', 'Chronic infection', 'Previous Hb value'],
  familyExtra: ['Anaemia', 'Thalassaemia', 'Sickle cell disease', 'Bleeding disorder'],
  gpeExtra: ['Glossitis', 'Angular stomatitis', 'Platonychia', 'Frontal bossing', 'Knuckle pigmentation', 'Petechiae or purpura', 'Sternal tenderness', 'Bone tenderness', 'Leg ulcers', 'Gum hypertrophy', 'Premature greying', 'Cervical nodes'],
  exam: [
    sec('haem', 'Haematological and abdominal examination', [
      fd('haemF', 'Findings', ['Palpable spleen', 'Palpable liver', 'Lymph nodes palpable', 'Ecchymoses', 'Mucosal bleeding', 'Jaundice (haemolytic)', 'Bony deformities', 'Per rectal: piles or growth', 'Per rectal: melaena']),
      area('haemN', 'Spleen / liver size (cm below costal margin), lymph node sites'),
    ]),
    sec('cvs', 'Cardiovascular examination', [
      fd('cvsF', 'Findings', ['Tachycardia', 'Collapsing pulse', 'Raised JVP', 'Apex beat displaced', 'Systolic murmur', 'S3 gallop', 'Basal crepitations']),
      area('cvsN', 'Details'),
    ]),
    sec('neuro', 'Neurological examination (B12 deficiency)', [
      fd('neuroF', 'Findings', ['Sensory loss (vibration and position)', 'Ankle jerk absent', 'Plantar extensor', 'Ataxic gait', 'Romberg positive', 'Spastic gait']),
    ]),
    sec('txPlan', 'Transfusion assessment', [
      fd('txF', 'Decision factors', ['Hb below 7 g/dl', 'Symptomatic anaemia', 'Cardiac failure (give slowly with diuretic)', 'Active bleeding', 'Compensated chronic anaemia (avoid transfusion)', 'Pregnancy with severe anaemia']),
      area('txPlanN', 'Hb value, blood product, volume, rate, premedication'),
    ]),
  ],
})

const fever = mk({
  id: 'med-fever', subject: 'medicine', title: 'Fever / infectious disease', blurb: 'Fever of acute or prolonged duration, typhoid, malaria, dengue, PUO', medicineClosing: true,
  complaints: ['Fever', 'Chills and rigors', 'Headache', 'Body aches', 'Rash', 'Cough', 'Burning micturition', 'Yellowish discolouration of eyes', 'Abdominal pain', 'Vomiting', 'Loose stools', 'Joint pain', 'Bleeding', 'Altered sensorium', 'Sore throat', 'Night sweats', 'Loss of weight'],
  hpi: [
    sym('fever', 'Fever', ['onset', 'duration', 'progression', at('grade', 'Grade', ['Low grade', 'Moderate', 'High grade']), at('pattern', 'Pattern', ['Continuous', 'Intermittent', 'Remittent', 'Step-ladder rise', 'Evening rise', 'Saddle-back', 'Relapsing (every 2 or 3 days)']), at('ass', 'Associated with', ['Chills and rigors', 'Profuse sweating', 'Night sweats', 'Relief with paracetamol', 'Fever-free intervals'], true)]),
    sym('head', 'Headache / body aches', ['onset', 'duration', at('ass', 'Associated with', ['Retro-orbital pain', 'Myalgia', 'Arthralgia', 'Photophobia', 'Neck stiffness'], true)]),
    sym('rash', 'Rash', ['onset', 'duration', at('site', 'Site', ['Trunk', 'Face', 'Limbs', 'Palms and soles', 'Generalised'], true), at('type', 'Type', ['Maculopapular', 'Petechial', 'Vesicular', 'Rose spots', 'Urticarial'])]),
    sym('resp', 'Cough / sore throat', ['onset', 'duration', at('type', 'Type', ['Dry', 'Productive', 'Haemoptysis', 'With breathlessness', 'With chest pain'], true)]),
    sym('urine', 'Urinary symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Burning micturition', 'Increased frequency', 'Loin pain', 'Reduced urine output', 'High-coloured urine', 'Cloudy urine'], true)]),
    sym('gi', 'Abdominal symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Abdominal pain', 'Vomiting', 'Loose stools', 'Constipation', 'Loss of appetite', 'Jaundice'], true)]),
    sym('bleed', 'Bleeding manifestations', ['onset', 'duration', at('site', 'Site', ['Gum bleeding', 'Epistaxis', 'Petechiae', 'Haematemesis', 'Melaena', 'Haematuria'], true)]),
    sym('neurosx', 'Neurological symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Altered sensorium', 'Seizures', 'Neck stiffness', 'Photophobia', 'Delirium'], true)]),
    sym('wt', 'Weight loss / night sweats', ['onset', 'duration', 'progression']),
    sym('joint', 'Joint pain', ['onset', 'duration', at('part', 'Joints', ['Small joints', 'Large joints', 'Migratory', 'Multiple'], true)]),
  ],
  middle: [
    sec('exposure', 'Exposure and epidemiological history', [
      fd('expF', 'Exposure', ['Mosquito bites or stagnant water nearby', 'Contaminated food or water', 'Outside food', 'Contact with TB patient', 'Contact with similar illness in family or community', 'Animal or rodent exposure', 'Walking in flood water', 'Tick, mite or insect bite', 'Travel to endemic area', 'Sexual exposure', 'Recent hospitalisation or surgery', 'Intravenous drug use', 'Unvaccinated for typhoid or hepatitis']),
      area('expN', 'Details (place, dates)'),
    ]),
  ],
  pastExtra: ['Typhoid', 'Malaria', 'Dengue', 'Rheumatic heart disease', 'Immunosuppression or HIV', 'Recent antibiotic use'],
  gpeExtra: ['Rash', 'Eschar', 'Conjunctival suffusion', 'Relative bradycardia', 'Neck stiffness', 'Oral thrush', 'Petechiae', 'Cervical nodes enlarged', 'Splenomegaly', 'Calf muscle tenderness'],
  exam: [
    sec('focus', 'Search for the focus of fever', [
      fd('focusF', 'Findings', ['Throat congested', 'Tonsillar exudate', 'Rose spots', 'Coated tongue', 'Hepatomegaly (tender)', 'Splenomegaly', 'Renal angle tenderness', 'Crepitations', 'Systolic murmur (new)', 'Osler nodes', 'Splinter haemorrhages', 'Meningeal signs', 'Skin abscess or cellulitis', 'Dental focus', 'Hess tourniquet test positive (dengue)', 'Lymph nodes (matted)', 'Bone or joint tenderness']),
      area('focusN', 'Details'),
    ]),
    sec('other', 'Other systems', [area('cvs', 'CVS'), area('rs', 'Respiratory system'), area('abd', 'Abdomen'), area('cns', 'CNS')]),
  ],
})

const diabetes = mk({
  id: 'med-diabetes', subject: 'medicine', title: 'Diabetes mellitus and endocrine', blurb: 'Polyuria, polydipsia, diabetic foot, neuropathy, complications, thyroid symptoms', medicineClosing: true,
  complaints: ['Increased urine output', 'Increased thirst', 'Increased hunger', 'Loss of weight', 'Fatigue', 'Blurring of vision', 'Non-healing ulcer', 'Tingling or numbness of feet', 'Burning sensation of feet', 'Recurrent infections', 'Giddiness or sweating', 'Chest pain', 'Swelling of feet', 'Neck swelling', 'Weight gain'],
  hpi: [
    sym('poly', 'Polyuria / nocturia', ['onset', 'duration', 'progression', at('ass', 'Associated with', ['Nocturia', 'Bed wetting'], true)]),
    sym('polydip', 'Polydipsia', ['onset', 'duration', 'progression']),
    sym('polyph', 'Polyphagia', ['onset', 'duration']),
    sym('wt', 'Weight loss', ['onset', 'duration', 'progression']),
    sym('vision', 'Visual symptoms', ['onset', 'duration', 'progression', at('type', 'Type', ['Blurring', 'Floaters', 'Sudden loss', 'Difficulty in night vision'], true)]),
    sym('neuro', 'Neuropathic symptoms', ['onset', 'duration', 'progression', at('part', 'Distribution', ['Feet', 'Hands and feet (glove and stocking)', 'Thigh pain (amyotrophy)'], true), at('type', 'Type', ['Tingling', 'Numbness', 'Burning', 'Shooting pain', 'Cramps'], true)]),
    sym('ulcer', 'Foot ulcer / infection', ['onset', 'duration', 'progression', 'site', at('ass', 'Associated with', ['Discharge', 'Foul smell', 'Fever', 'Painless', 'Trauma or new footwear'], true)]),
    sym('hypo', 'Hypoglycaemic symptoms', ['onset', 'episodes', at('ass', 'Symptoms', ['Sweating', 'Tremors', 'Palpitations', 'Hunger', 'Confusion', 'Loss of consciousness'], true), at('trig', 'Related to', ['Skipped meal', 'Insulin dose', 'Oral drug', 'Exercise'], true)]),
    sym('dka', 'Symptoms of ketoacidosis', ['onset', 'duration', at('ass', 'Symptoms', ['Vomiting', 'Abdominal pain', 'Rapid deep breathing', 'Drowsiness', 'Fruity breath', 'Recent infection', 'Missed insulin'], true)]),
    sym('macro', 'Cardiovascular and vascular symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Chest pain', 'Breathlessness', 'Claudication', 'Transient weakness or stroke'], true)]),
    sym('infect', 'Recurrent infections', ['duration', at('ass', 'Type', ['Boils or skin infections', 'Urinary tract infection', 'Pruritus vulvae or balanitis', 'Tuberculosis', 'Fungal infection'], true)]),
    sym('autonomic', 'Autonomic symptoms', ['duration', at('ass', 'Symptoms', ['Postural dizziness', 'Erectile dysfunction', 'Diarrhoea or constipation', 'Early satiety (gastroparesis)', 'Gustatory sweating'], true)]),
    sym('thyroid', 'Thyroid symptoms', ['duration', at('ass', 'Symptoms', ['Heat intolerance', 'Cold intolerance', 'Palpitations', 'Weight gain', 'Hair loss', 'Constipation', 'Neck swelling', 'Menstrual irregularity'], true)]),
  ],
  middle: [
    sec('dmdetails', 'Diabetes details', [
      txt('dmDur', 'Duration of diabetes', { half: true }),
      ch('dmRx', 'Treatment', ['Diet and exercise only', 'Oral hypoglycaemic agents', 'Insulin', 'Oral drugs and insulin']),
      area('dmDrugs', 'Drugs, doses, last HbA1c, home glucose readings'),
      ch('dmComp', 'Compliance with treatment', ['Good', 'Irregular', 'Poor']),
      fd('dmKnown', 'Known complications', ['Retinopathy', 'Nephropathy', 'Neuropathy', 'Diabetic foot', 'Ischaemic heart disease', 'Stroke', 'Peripheral arterial disease']),
    ]),
  ],
  pastExtra: ['Gestational diabetes', 'Pancreatitis', 'Steroid use', 'Hospital admission for DKA', 'Hospital admission for hypoglycaemia'],
  familyExtra: ['Diabetes in parents', 'Thyroid disease'],
  gpeExtra: ['Acanthosis nigricans', 'Skin tags', 'Necrobiosis lipoidica', 'Fungal skin infection', 'Goitre', 'Moon facies', 'Purple striae', 'Buffalo hump', 'Xanthelasma', 'Lipohypertrophy at injection sites', 'Acetone smell in breath'],
  exam: [
    sec('foot', 'Diabetic foot examination', [
      fd('footF', 'Findings', ['Dry cracked skin', 'Callus', 'Foot ulcer', 'Charcot foot', 'Hammer toes', 'Loss of hair on the leg', 'Dorsalis pedis pulse absent', 'Posterior tibial pulse absent', 'Cold foot', 'Monofilament sensation lost', 'Vibration sense lost', 'Ankle jerk absent', 'Pin-prick sensation lost', 'Nail changes (fungal)']),
      area('footN', 'Ulcer site, size, depth, Wagner grade'),
    ]),
    sec('comp', 'Examination for complications', [
      fd('compF', 'Findings', ['Postural hypotension', 'Resting tachycardia', 'Hypertension', 'Diabetic retinopathy on fundus', 'Cataract', 'Carotid bruit', 'Pedal oedema', 'Foul smelling infected wound', 'Kussmaul breathing', 'Signs of dehydration']),
      area('compN', 'Details'),
    ]),
    sec('other', 'Other systems', [area('cvs', 'CVS'), area('rs', 'Respiratory system'), area('abd', 'Abdomen'), area('thy', 'Thyroid / neck')]),
  ],
})

const renal = mk({
  id: 'med-renal', subject: 'medicine', title: 'Renal system', blurb: 'Oedema, oliguria, haematuria, nephrotic and nephritic syndromes, CKD', medicineClosing: true,
  complaints: ['Puffiness of face', 'Swelling of legs', 'Decreased urine output', 'Frothy urine', 'Blood in urine', 'Burning micturition', 'Loin pain', 'Breathlessness', 'Nausea or vomiting', 'Loss of appetite', 'Itching', 'Hiccups', 'Drowsiness', 'Headache', 'Abdominal distension'],
  hpi: [
    sym('puff', 'Facial puffiness', ['onset', 'duration', 'progression', at('time', 'Timing', ['Worse in the morning', 'Present throughout the day'])]),
    sym('oedema', 'Pedal oedema', ['onset', 'duration', 'progression', at('ext', 'Extent', ['Both feet', 'Up to the legs', 'Up to the thighs', 'Generalised (anasarca)']), at('type', 'Type', ['Pitting', 'Non-pitting'])]),
    sym('oliguria', 'Decreased urine output', ['onset', 'duration', 'progression', at('amt', 'Amount', ['Reduced', 'Less than 400 ml per day', 'No urine (anuria)'])]),
    sym('frothy', 'Frothy urine', ['onset', 'duration']),
    sym('haem', 'Haematuria', ['onset', 'duration', 'episodes', at('type', 'Type', ['Painless', 'Painful', 'Initial', 'Terminal', 'Total', 'Cola or tea coloured', 'With clots'], true)]),
    sym('dysuria', 'Burning micturition / frequency', ['onset', 'duration', at('ass', 'Associated with', ['Fever with chills', 'Suprapubic pain', 'Hesitancy', 'Poor stream', 'Incomplete emptying'], true)]),
    sym('loin', 'Loin pain', ['onset', 'duration', 'side', 'nature', 'radiation']),
    sym('uraemia', 'Uraemic symptoms', ['onset', 'duration', 'progression', at('ass', 'Symptoms', ['Nausea or vomiting', 'Loss of appetite', 'Itching', 'Hiccups', 'Metallic taste', 'Insomnia', 'Restless legs', 'Muscle cramps', 'Drowsiness'], true)]),
    sym('dyspnoea', 'Breathlessness', ['onset', 'duration', 'progression', at('ass', 'Associated with', ['Orthopnoea', 'Paroxysmal nocturnal dyspnoea', 'Cough with frothy sputum', 'Chest pain'], true)]),
    sym('htn', 'Symptoms of hypertension', ['onset', 'duration', at('ass', 'Symptoms', ['Headache', 'Blurring of vision', 'Giddiness', 'Seizures'], true)]),
    sym('preced', 'Preceding illness', ['duration', at('ass', 'History of', ['Sore throat', 'Skin infection', 'Diarrhoeal illness', 'Drug intake (NSAIDs, aminoglycosides)', 'Snake bite or wasp sting', 'Contrast exposure'], true)]),
  ],
  pastExtra: ['Kidney stones', 'Recurrent urinary tract infection', 'Chronic kidney disease', 'Dialysis', 'Kidney transplant', 'NSAID or herbal drug use', 'Congenital renal disease'],
  familyExtra: ['Kidney disease', 'Polycystic kidney disease'],
  gpeExtra: ['Facial puffiness', 'Periorbital oedema', 'Sacral oedema', 'Anasarca', 'Uraemic frost', 'Scratch marks', 'Pericardial rub', 'Flapping tremors', 'Skin pigmentation', 'Terry nails', 'Kussmaul respiration', 'Hypertensive retinopathy', 'Muehrcke lines'],
  exam: [
    sec('abdo', 'Abdominal and renal examination', [
      fd('abdoF', 'Findings', ['Ascites', 'Palpable kidney', 'Bilateral ballotable kidneys', 'Renal angle tenderness', 'Renal artery bruit', 'Palpable bladder', 'Enlarged prostate (per rectal)', 'Hepatomegaly']),
      area('abdoN', 'Details (size, side, bimanual palpation)'),
    ]),
    sec('systems', 'Cardiorespiratory and neurological examination', [
      fd('sysF', 'Findings', ['Raised JVP', 'Pericardial rub', 'S3 gallop', 'Basal crepitations', 'Pleural effusion', 'Hypertension', 'Asterixis', 'Seizures or altered sensorium']),
      area('sysN', 'Details'),
    ]),
    sec('access', 'Dialysis access', [fd('accF', 'Findings', ['AV fistula', 'Dialysis catheter', 'Thrill over fistula', 'Peritoneal dialysis catheter']), area('accN', 'Site and details')]),
  ],
})

const rheum = mk({
  id: 'med-rheum', subject: 'medicine', title: 'Rheumatology (joints and connective tissue)', blurb: 'Rheumatoid arthritis, SLE, spondyloarthritis, gout, osteoarthritis', medicineClosing: true,
  complaints: ['Joint pain', 'Morning stiffness', 'Joint swelling', 'Fever', 'Skin rash', 'Photosensitivity', 'Oral ulcers', 'Hair loss', 'Dryness of eyes or mouth', 'Colour change of fingers in cold', 'Back pain', 'Muscle weakness', 'Difficulty in daily activities', 'Pleuritic chest pain', 'Swelling of feet'],
  hpi: [
    sym('joint', 'Joint pain', ['onset', 'duration', 'progression', at('part', 'Joints', ['Small joints of hands', 'Wrists', 'Elbows', 'Shoulders', 'Hips', 'Knees', 'Ankles', 'Great toe', 'Spine', 'Sacroiliac joints'], true), at('pat', 'Pattern', ['Symmetrical', 'Asymmetrical', 'Migratory', 'Additive', 'Episodic', 'Acute single joint attacks']), 'aggravating', 'relieving']),
    sym('stiff', 'Morning stiffness', ['duration', at('len', 'Lasting', ['Less than 30 minutes', 'More than 1 hour', 'Several hours']), at('rel', 'Relieved by', ['Activity', 'Rest', 'NSAIDs'], true)]),
    sym('swell', 'Joint swelling', ['onset', 'duration', at('ass', 'Associated with', ['Warmth', 'Redness', 'Deformity', 'Nodules', 'Restricted movement'], true)]),
    sym('rash', 'Skin rash / photosensitivity', ['onset', 'duration', at('type', 'Type', ['Butterfly rash on cheeks', 'Photosensitive rash', 'Psoriatic plaques', 'Purpuric rash', 'Skin tightening'], true)]),
    sym('mucosal', 'Oral ulcers / dryness', ['onset', 'duration', at('ass', 'Symptoms', ['Painless oral ulcers', 'Dry eyes', 'Dry mouth', 'Genital ulcers', 'Red painful eye'], true)]),
    sym('raynaud', 'Raynaud phenomenon', ['onset', 'duration', at('col', 'Colour change', ['White', 'Blue', 'Red', 'Triphasic'], true)]),
    sym('back', 'Back pain', ['onset', 'duration', 'progression', at('inf', 'Features', ['Inflammatory (night pain, morning stiffness)', 'Improves with exercise', 'Alternating buttock pain', 'Mechanical'], true)]),
    sym('constit', 'Constitutional symptoms', ['duration', at('ass', 'Symptoms', ['Fever', 'Weight loss', 'Fatigue', 'Anorexia'], true)]),
    sym('muscle', 'Muscle weakness', ['onset', 'duration', at('ass', 'Associated with', ['Difficulty climbing stairs', 'Difficulty combing hair', 'Muscle pain', 'Dysphagia'], true)]),
    sym('organ', 'Systemic involvement', ['duration', at('ass', 'Symptoms', ['Pleuritic chest pain', 'Breathlessness', 'Swelling of feet or frothy urine', 'Seizures or psychosis', 'Abdominal pain', 'Pregnancy loss'], true)]),
    sym('gout', 'Acute gout-like attacks', ['onset', 'episodes', at('ass', 'Triggers', ['Alcohol', 'Red meat', 'Diuretics', 'Surgery or infection'], true)]),
  ],
  pastExtra: ['Rheumatic fever', 'Psoriasis', 'Inflammatory bowel disease', 'Urethritis or diarrhoea before arthritis', 'Recurrent miscarriages', 'Long-term steroid use', 'Drug intake (hydralazine, isoniazid)'],
  familyExtra: ['Rheumatoid arthritis', 'Lupus', 'Ankylosing spondylitis', 'Gout', 'Psoriasis'],
  gpeExtra: ['Malar rash', 'Discoid lesions', 'Oral ulcers', 'Alopecia', 'Livedo reticularis', 'Psoriatic plaques', 'Nail pitting', 'Sclerodactyly', 'Digital ulcers', 'Rheumatoid nodules', 'Heliotrope rash', 'Gottron papules', 'Tophi'],
  exam: [
    sec('joints', 'Joint examination', [
      fd('jointF', 'Findings', ['Symmetrical small joint swelling', 'Warmth', 'Joint tenderness', 'Effusion', 'Squeeze test positive', 'Ulnar deviation', 'Swan-neck deformity', 'Boutonniere deformity', 'Z deformity of thumb', "Heberden's nodes", "Bouchard's nodes", 'Joint crepitus', 'Restricted range of movement', 'Flexion deformity', 'Dactylitis']),
      area('jointN', 'Joints involved (right/left) with findings'),
    ]),
    sec('spine', 'Spine and sacroiliac examination', [
      fd('spineF', 'Findings', ['Loss of lumbar lordosis', 'Schober test reduced', 'Chest expansion reduced', 'Sacroiliac tenderness', 'FABER test positive', 'Occiput-wall distance increased', 'Enthesitis (heel pain)']),
    ]),
    sec('systemic', 'Systemic features', [
      fd('sysF', 'Findings', ['Uveitis or scleritis', 'Dry eyes (Schirmer reduced)', 'Splenomegaly', 'Lymphadenopathy', 'Pleural effusion', 'Pericardial rub', 'Proximal muscle weakness', 'Hypertension and oedema (lupus nephritis)', 'Neuropathy', 'Vasculitic skin lesions']),
      area('sysN', 'Details'),
    ]),
  ],
})

const poison = mk({
  id: 'med-poison', subject: 'medicine', title: 'Poisoning and envenomation', blurb: 'Organophosphate, snake bite, sedatives, paracetamol, corrosives', medicineClosing: true, noMenstrual: true,
  complaints: ['Ingestion of poison', 'Snake or insect bite', 'Vomiting', 'Excessive salivation', 'Sweating', 'Breathlessness', 'Altered sensorium', 'Muscle twitching', 'Drooping of eyelids', 'Local swelling', 'Bleeding', 'Abdominal pain', 'Seizures', 'Loss of consciousness'],
  hpi: [
    sym('vomit', 'Vomiting / abdominal pain', ['onset', 'duration', at('ass', 'Associated with', ['Haematemesis', 'Burning in mouth and chest', 'Diarrhoea', 'Garlic-like smell'], true)]),
    sym('musc', 'Muscarinic symptoms', ['onset', at('ass', 'Symptoms', ['Excessive salivation', 'Sweating', 'Lacrimation', 'Frequent urination', 'Loose stools', 'Cough with wheeze'], true)]),
    sym('nic', 'Nicotinic and CNS symptoms', ['onset', at('ass', 'Symptoms', ['Muscle twitching', 'Weakness', 'Difficulty breathing', 'Seizures', 'Confusion', 'Drowsiness', 'Coma'], true)]),
    sym('snake', 'Snake or insect bite', ['onset', 'site', at('ass', 'Symptoms', ['Local pain and swelling', 'Bleeding from bite site', 'Drooping eyelids', 'Difficulty swallowing', 'Breathing difficulty', 'Bleeding from gums', 'Reduced urine output', 'Blisters'], true)]),
    sym('drug', 'Sedative or drug overdose symptoms', ['onset', at('ass', 'Symptoms', ['Drowsiness', 'Slurred speech', 'Slow breathing', 'Low blood pressure', 'Hypothermia'], true)]),
    sym('corr', 'Corrosive ingestion symptoms', ['onset', at('ass', 'Symptoms', ['Burning mouth and throat', 'Difficulty swallowing', 'Hoarseness', 'Chest or abdominal pain', 'Drooling'], true)]),
  ],
  middle: [
    sec('poison', 'Poison details', [
      ch('agent', 'Type of poison', ['Organophosphate / carbamate pesticide', 'Organochlorine', 'Rodenticide (zinc phosphide, anticoagulant)', 'Aluminium phosphide', 'Paracetamol', 'Sedative or hypnotic (benzodiazepine, barbiturate)', 'Opioid', 'Kerosene or hydrocarbon', 'Corrosive (acid or alkali)', 'Methanol or alcohol', 'Plant poison (oleander, datura)', 'Neurotoxic snake bite', 'Vasculotoxic snake bite', 'Scorpion or insect sting', 'Unknown']),
      txt('agentName', 'Name of compound', { half: true }), txt('qty', 'Quantity (estimated)', { half: true }),
      ch('route', 'Route', ['Ingestion', 'Inhalation', 'Skin contact', 'Injection', 'Bite or sting']),
      ch('intent', 'Circumstance', ['Accidental', 'Intentional self-harm', 'Occupational', 'Suspected homicidal', 'Unknown']),
      txt('timeSince', 'Time since exposure', { half: true }), txt('firstAid', 'First aid taken before arrival', { half: true }),
      fd('prehosp', 'Before arrival', ['Vomiting induced', 'Gastric lavage done elsewhere', 'Atropine given elsewhere', 'Tourniquet applied', 'Incision made on bite site', 'Traditional treatment taken']),
      area('medicolegal', 'Medicolegal aspects (police intimation, informant, container brought)'),
    ]),
  ],
  pastExtra: ['Previous poisoning attempt', 'Psychiatric illness', 'Substance use disorder', 'Liver disease'],
  gpeExtra: ['Garlic odour of breath', 'Pinpoint pupils', 'Dilated pupils', 'Excessive salivation', 'Lacrimation', 'Profuse sweating', 'Fasciculations', 'Bradycardia', 'Bronchorrhoea', 'Fang marks', 'Local swelling', 'Ptosis', 'Bleeding gums', 'Burns around the mouth', 'Dry flushed skin'],
  exam: [
    sec('tox', 'Toxidrome and organ assessment', [
      fd('toxF', 'Findings', ['Wheeze and crepitations', 'Muscle fasciculations', 'Weakness of neck flexion', 'Respiratory muscle weakness', 'Hypotension', 'Arrhythmia', 'Seizures', 'Coma', 'Hepatic tenderness', 'Oral or pharyngeal burns']),
      area('toxN', 'GCS, pupils, secretions, severity grade'),
    ]),
    sec('bite', 'Bite site and envenomation signs', [
      fd('biteF', 'Findings', ['Two fang marks', 'Swelling extending up the limb', 'Blisters or necrosis', 'Local bleeding', 'Ptosis', 'Ophthalmoplegia', 'Bulbar palsy', 'Respiratory paralysis', '20-minute whole blood clotting test abnormal', 'Haematuria or oliguria']),
      area('biteN', 'Site, extent of swelling (cm), time course'),
    ]),
  ],
})

export const MEDICINE2_CASES: CaseDef[] = [anaemia, fever, diabetes, renal, rheum, poison]
