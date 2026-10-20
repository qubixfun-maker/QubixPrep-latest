import type { CaseDef, Section } from './types'
import { txt, area, ch, fd, sym, sec, at } from './dsl'
import { mk } from './cases-util'

const ASA = ['ASA I: healthy patient', 'ASA II: mild systemic disease', 'ASA III: severe systemic disease', 'ASA IV: constant threat to life', 'ASA V: moribund, not expected to survive without surgery', 'ASA VI: brain-dead organ donor']

/** Airway assessment block used in most anaesthesia cases. */
const airway = (): Section[] => [
  sec('airway', 'Airway assessment', [
    ch('mall', 'Mallampati grade', ['Class I: soft palate, uvula and pillars seen', 'Class II: soft palate and uvula seen', 'Class III: soft palate and base of uvula seen', 'Class IV: hard palate only seen']),
    fd('airF', 'Findings (present = abnormal)', ['Mouth opening less than 3 cm (inter-incisor gap)', 'Thyromental distance less than 6.5 cm', 'Sternomental distance less than 12.5 cm', 'Neck extension limited', 'Short thick neck', 'Receding mandible', 'Prominent upper incisors (buck teeth)', 'Upper lip bite test: class III', 'Loose, broken or missing teeth', 'Dentures or crowns', 'Macroglossia', 'Beard', 'Large tonsils', 'Neck mass or goitre', 'Previous neck surgery or radiotherapy', 'Stridor or hoarseness', 'Temporomandibular joint restriction']),
    area('airN', 'Mouth opening (cm), thyromental distance (cm), neck movements, prediction of ease of laryngoscopy and intubation'),
  ]),
]

const pac = mk({
  id: 'an-pac', subject: 'anaesthesiology', title: 'Pre-anaesthetic check-up (PAC)', blurb: 'History, airway, systemic examination, ASA grading, fasting and anaesthetic plan',
  complaints: ['Swelling needing surgery', 'Abdominal pain', 'Fracture', 'Hernia', 'Gallstones', 'Cataract', 'Uterine problem', 'Prostate problem', 'Trauma', 'Planned elective surgery', 'Emergency surgery'],
  hpi: [
    sym('indic', 'Surgical problem', ['onset', 'duration', 'progression', at('urg', 'Urgency', ['Elective', 'Urgent', 'Emergency'])]),
    sym('exer', 'Exercise tolerance', ['duration', at('met', 'Capacity', ['Can climb two flights of stairs without stopping (4 METs or more)', 'Walks on level ground only', 'Breathless on dressing', 'Breathless at rest'])]),
    sym('chest', 'Chest pain', ['onset', 'duration', 'nature', at('ass', 'Features', ['On exertion', 'Relieved by rest', 'At rest', 'Previous MI'], true)]),
    sym('dyspn', 'Breathlessness / cough', ['onset', 'duration', 'progression', at('ass', 'Features', ['Orthopnoea', 'Wheeze', 'Productive cough', 'Recent respiratory infection', 'Smoker\'s cough'], true)]),
    sym('palp', 'Palpitations / syncope', ['onset', 'episodes', at('ass', 'Features', ['Syncope', 'Irregular pulse', 'Dizziness'], true)]),
    sym('bleed', 'Bleeding tendency', ['duration', at('ass', 'Features', ['Easy bruising', 'Prolonged bleeding after cuts', 'Heavy periods', 'Bleeding after dental extraction', 'Family bleeding disorder', 'On anticoagulants or antiplatelets'], true)]),
    sym('reflux', 'Reflux / aspiration risk', ['duration', at('ass', 'Features', ['Heartburn', 'Hiatus hernia', 'Pregnancy', 'Intestinal obstruction', 'Recent meal', 'Obesity', 'Diabetic gastroparesis'], true)]),
    sym('osa', 'Sleep apnoea features', ['duration', at('ass', 'STOP-BANG', ['Snoring', 'Tired in the day', 'Observed apnoea', 'High blood pressure', 'BMI over 35', 'Neck circumference over 40 cm'], true)]),
    sym('dental', 'Dental / neck problems', ['duration', at('ass', 'Features', ['Loose teeth', 'Dentures', 'Limited mouth opening', 'Limited neck movement', 'Cervical spine disease'], true)]),
    sym('neuro', 'Neurological / other history', ['duration', at('ass', 'History', ['Epilepsy', 'Stroke', 'Myasthenia gravis', 'Muscular dystrophy', 'Psychiatric illness'], true)]),
  ],
  middle: [
    sec('surgery', 'Proposed surgery and anaesthetic history', [
      txt('proc', 'Proposed procedure', { half: true }), txt('surgeon', 'Surgeon and date of surgery', { half: true }),
      ch('plan', 'Anaesthesia planned', ['General anaesthesia', 'Spinal anaesthesia', 'Epidural anaesthesia', 'Regional nerve block', 'Local anaesthesia with sedation', 'Combined general and regional'], true),
      fd('prevAn', 'Previous anaesthesia', ['Previous general anaesthesia', 'Previous spinal anaesthesia', 'Difficult intubation previously', 'Postoperative nausea and vomiting', 'Prolonged apnoea (pseudocholinesterase deficiency)', 'Malignant hyperthermia in self or family', 'Allergic reaction to anaesthetic drugs', 'Awareness under anaesthesia', 'Postoperative ICU stay']),
      fd('drugs', 'Current drugs', ['Antihypertensives', 'ACE inhibitor or ARB', 'Beta-blocker', 'Antiplatelet drugs (aspirin, clopidogrel)', 'Anticoagulants (warfarin, heparin)', 'Metformin', 'Insulin', 'Oral steroids', 'Bronchodilators', 'Herbal medicines', 'Sedatives or antidepressants', 'Oral contraceptive pills']),
      fd('allergy', 'Allergies', ['Latex allergy', 'Antibiotic allergy', 'Drug allergy (specify)', 'Egg or soy allergy', 'Asthma triggers']),
      area('drugN', 'Drug names, doses and which to continue or stop before surgery'),
    ]),
    sec('fasting', 'Fasting and consent', [
      txt('lastMeal', 'Time of last solid meal', { half: true }), txt('lastFluid', 'Time of last clear fluid', { half: true }),
      ch('npo', 'Fasting status', ['Adequately fasted (6 h solids, 2 h clear fluids)', 'Not adequately fasted', 'Full stomach (emergency)']),
      fd('conF', 'Consent', ['Informed consent for anaesthesia taken', 'Risks explained', 'Blood transfusion consent', 'High-risk consent']),
    ]),
  ],
  pastExtra: ['Previous anaesthesia problems', 'Bleeding disorder', 'Sickle cell disease', 'Anaemia', 'Obstructive sleep apnoea', 'Smoking'],
  familyExtra: ['Anaesthetic problems', 'Malignant hyperthermia', 'Pseudocholinesterase deficiency', 'Bleeding disorders'],
  gpeExtra: ['Obesity (BMI above 30)', 'Short neck', 'Poor nutrition', 'Dehydration'],
  exam: [
    ...airway(),
    sec('sys', 'Systemic examination', [
      fd('sysF', 'Findings', ['Hypertension', 'Irregular pulse', 'Cardiac murmur', 'Raised JVP', 'Basal crepitations', 'Wheeze', 'Reduced air entry', 'Scoliosis or spinal deformity', 'Local infection at the proposed block site', 'Poor venous access', 'Hepatomegaly', 'Ascites', 'Pregnancy']),
      area('sysN', 'Details'),
    ]),
    sec('inv', 'Investigations reviewed', [
      fd('ixF', 'Done and reviewed', ['Haemoglobin', 'Blood sugar', 'Urea and creatinine', 'Serum electrolytes', 'ECG', 'Chest X-ray', 'Coagulation profile (PT/INR, aPTT)', 'Blood grouping and cross-match', 'Liver function tests', 'Viral markers (HIV, HBsAg, HCV)', 'Urine routine', 'Echocardiography', 'Pulmonary function tests']),
      area('ixN', 'Abnormal results and further tests advised'),
    ]),
    sec('asa', 'ASA grade and anaesthetic plan', [
      ch('asaG', 'ASA physical status', ASA),
      ch('asaE', 'Emergency modifier', ['E: emergency surgery', 'Elective']),
      area('planN', 'Anaesthetic technique, premedication, airway plan, monitoring, post-operative analgesia and destination (ward, HDU, ICU)'),
    ]),
  ],
})

const comorbid = mk({
  id: 'an-comorbid', subject: 'anaesthesiology', title: 'High-risk patient (cardiac, respiratory, diabetes)', blurb: 'Pre-operative assessment of ischaemic heart disease, hypertension, asthma/COPD, diabetes, renal disease',
  complaints: ['Chest pain', 'Breathlessness', 'Palpitations', 'Cough', 'Poor exercise tolerance', 'Swelling of feet', 'Giddiness', 'Wheeze', 'Increased urination', 'Fatigue', 'Planned surgery in a known cardiac or diabetic patient'],
  hpi: [
    sym('ang', 'Angina / ischaemic heart disease', ['onset', 'duration', 'progression', at('ass', 'Features', ['Stable angina', 'Unstable angina', 'Previous myocardial infarction', 'Previous PCI or CABG', 'Silent ischaemia in a diabetic'], true)]),
    sym('hf', 'Heart failure', ['onset', 'duration', at('ass', 'Features', ['Orthopnoea', 'Paroxysmal nocturnal dyspnoea', 'Pedal oedema', 'Reduced effort tolerance'], true), at('nyha', 'NYHA class', ['Class I', 'Class II', 'Class III', 'Class IV'])]),
    sym('htn', 'Hypertension', ['duration', at('ass', 'Features', ['Controlled on drugs', 'Poorly controlled', 'Target organ damage', 'Headache', 'Visual disturbance'], true)]),
    sym('valve', 'Valvular / rhythm disorder', ['duration', at('ass', 'Features', ['Rheumatic heart disease', 'Atrial fibrillation', 'Pacemaker', 'Prosthetic valve on anticoagulants', 'Heart block'], true)]),
    sym('asthma', 'Asthma / COPD', ['onset', 'duration', at('ass', 'Features', ['Wheeze', 'Night cough', 'Frequent exacerbations', 'Recent steroids', 'Recent respiratory infection', 'Oxygen requirement', 'Smoking'], true)]),
    sym('dm', 'Diabetes mellitus', ['duration', at('ass', 'Features', ['On oral drugs', 'On insulin', 'Poor control', 'Hypoglycaemic episodes', 'Autonomic neuropathy', 'Nephropathy', 'Gastroparesis'], true)]),
    sym('renal', 'Renal disease', ['duration', at('ass', 'Features', ['Chronic kidney disease', 'On dialysis', 'Hyperkalaemia', 'Anaemia', 'Fluid restriction'], true)]),
    sym('liver', 'Liver disease', ['duration', at('ass', 'Features', ['Cirrhosis', 'Ascites', 'Coagulopathy', 'Encephalopathy', 'Varices'], true)]),
    sym('thyroid', 'Thyroid / endocrine', ['duration', at('ass', 'Features', ['Hyperthyroidism', 'Hypothyroidism', 'Long-term steroid use (adrenal suppression)', 'Phaeochromocytoma'], true)]),
    sym('exer', 'Functional capacity', ['duration', at('met', 'Capacity', ['Less than 4 METs (poor)', '4 to 7 METs (moderate)', 'More than 7 METs (good)'])]),
  ],
  middle: [
    sec('risk', 'Risk stratification', [
      fd('rcri', 'Revised Cardiac Risk Index factors', ['High-risk surgery (intraperitoneal, intrathoracic, vascular)', 'History of ischaemic heart disease', 'History of heart failure', 'History of cerebrovascular disease', 'Insulin-treated diabetes', 'Serum creatinine above 2 mg/dl']),
      txt('surg', 'Proposed surgery', { half: true }), txt('rcriS', 'RCRI score', { half: true }),
      fd('stopDrugs', 'Drug plan', ['Continue beta-blocker', 'Continue statin', 'Hold ACE inhibitor / ARB on the morning of surgery', 'Hold metformin 24 to 48 hours before', 'Hold oral hypoglycaemic agents on the day', 'Insulin dose adjusted', 'Continue inhalers up to surgery', 'Stop clopidogrel 5 to 7 days before', 'Stop warfarin 5 days before with bridging', 'Stress-dose steroids planned']),
    ]),
  ],
  pastExtra: ['Myocardial infarction', 'Coronary stenting', 'CABG', 'Stroke', 'COPD', 'Chronic kidney disease', 'Liver disease', 'Obstructive sleep apnoea'],
  familyExtra: ['Heart disease', 'Diabetes', 'Anaesthetic problems'],
  gpeExtra: ['Raised JVP', 'Tachypnoea', 'Central cyanosis', 'Pedal oedema', 'Peripheral neuropathy', 'Obesity (BMI above 30)'],
  exam: [
    ...airway(),
    sec('cvsx', 'Cardiovascular and respiratory examination', [
      fd('cvF', 'Findings', ['Irregular pulse', 'Bradycardia', 'Tachycardia', 'Hypertension', 'Postural hypotension', 'S3 gallop', 'Murmur: aortic stenosis', 'Murmur: mitral', 'Basal crepitations', 'Wheeze', 'Reduced breath sounds', 'Hyperinflated chest', 'Carotid bruit']),
      fd('testF', 'Bedside tests', ['Breath-holding time less than 20 seconds', 'Match-blowing test positive (cannot blow out a match)', 'Single breath count less than 20', 'Cannot climb two flights of stairs', 'Allen test abnormal (radial artery)']),
      area('cvN', 'Details'),
    ]),
    sec('inv', 'Special investigations', [
      fd('ixF', 'Findings', ['ECG: ischaemic changes', 'ECG: left ventricular hypertrophy', 'ECG: atrial fibrillation', 'Echocardiography: ejection fraction below 40%', 'Echocardiography: severe aortic stenosis', 'Chest X-ray: cardiomegaly', 'Chest X-ray: hyperinflation', 'Blood sugar uncontrolled', 'HbA1c above 8%', 'Potassium above 5.5', 'Creatinine above 2', 'Hb below 8', 'PFT: obstructive pattern', 'ABG: hypercapnia']),
      area('ixN', 'Values and optimisation advised'),
    ]),
    sec('asa', 'Risk grading and plan', [
      ch('asaG', 'ASA physical status', ASA),
      ch('level', 'Postoperative destination', ['Ward', 'High dependency unit', 'ICU with ventilation', 'Day care']),
      area('planN', 'Optimisation, choice of technique, monitoring (ECG, invasive BP, CVP), drugs to avoid, postoperative plan'),
    ]),
  ],
})

const difficult = mk({
  id: 'an-airway', subject: 'anaesthesiology', title: 'Airway assessment and difficult airway', blurb: 'LEMON, Mallampati, predictors of difficult laryngoscopy, plan A-B-C-D, rapid sequence induction',
  complaints: ['Snoring', 'Neck swelling', 'Hoarseness of voice', 'Difficulty opening the mouth', 'Stiff neck', 'Facial trauma', 'Burns of the face and neck', 'Difficulty swallowing', 'Previous difficult intubation', 'Noisy breathing', 'Obesity'],
  hpi: [
    sym('prev', 'Previous difficult airway', ['duration', at('ass', 'History', ['Difficult intubation', 'Failed intubation', 'Awake fibreoptic intubation done', 'Tracheostomy', 'Emergency front-of-neck access', 'Dental damage'], true)]),
    sym('snore', 'Snoring / obstructive sleep apnoea', ['duration', at('ass', 'Features', ['Loud snoring', 'Witnessed apnoea', 'Daytime sleepiness', 'Morning headache', 'On CPAP'], true)]),
    sym('voice', 'Voice / stridor', ['onset', 'duration', 'progression', at('ass', 'Features', ['Hoarseness', 'Stridor', 'Dyspnoea on lying flat', 'Dysphagia', 'Drooling'], true)]),
    sym('neck', 'Neck disease', ['onset', 'duration', at('ass', 'Features', ['Goitre', 'Neck mass', 'Previous neck surgery', 'Previous radiotherapy', 'Cervical spine disease', 'Rheumatoid arthritis', 'Ankylosing spondylitis', 'Neck trauma with collar'], true)]),
    sym('jaw', 'Jaw / mouth problems', ['onset', 'duration', at('ass', 'Features', ['Limited mouth opening (trismus)', 'Temporomandibular joint disease', 'Oral cancer', 'Submucous fibrosis', 'Ludwig angina', 'Jaw fracture'], true)]),
    sym('trauma', 'Trauma / burns', ['onset', at('ass', 'Features', ['Facial fractures', 'Inhalational burns', 'Neck burns with contracture', 'Cervical spine injury', 'Blood in the airway'], true)]),
    sym('obes', 'Obesity / pregnancy', ['duration', at('ass', 'Features', ['BMI over 35', 'Short neck', 'Pregnancy', 'Reflux'], true)]),
    sym('syn', 'Congenital / syndromic features', ['duration', at('ass', 'Features', ['Down syndrome', 'Pierre Robin sequence', 'Treacher Collins syndrome', 'Klippel-Feil syndrome', 'Acromegaly'], true)]),
    sym('dental', 'Dental status', ['duration', at('ass', 'Features', ['Loose teeth', 'Prominent upper teeth', 'Dentures', 'Missing teeth', 'Bridges or crowns'], true)]),
    sym('sched', 'Urgency and aspiration risk', ['onset', at('ass', 'Features', ['Emergency surgery', 'Full stomach', 'Bowel obstruction', 'Pregnancy', 'Reflux disease'], true)]),
  ],
  middle: [
    sec('lemon', 'LEMON assessment', [
      fd('lemonF', 'Present = abnormal', ['Look externally: obesity, small mouth, facial trauma', 'Evaluate 3-3-2: mouth opening less than 3 fingers', 'Evaluate 3-3-2: mandibular length less than 3 fingers', 'Evaluate 3-3-2: thyromental distance less than 2 fingers', 'Mallampati class III or IV', 'Obstruction: epiglottitis, abscess, tumour, foreign body', 'Neck mobility reduced']),
      area('lemonN', 'Overall prediction of difficulty'),
    ]),
  ],
  pastExtra: ['Obstructive sleep apnoea', 'Goitre or thyroid surgery', 'Neck radiotherapy', 'Facial trauma', 'Cervical spine disease', 'Rheumatoid arthritis'],
  familyExtra: ['Anaesthetic problems', 'Difficult intubation'],
  gpeExtra: ['Obesity (BMI above 35)', 'Short thick neck', 'Stridor', 'Hoarse voice', 'Facial asymmetry'],
  exam: [
    ...airway(),
    sec('devices', 'Airway plan', [
      fd('planF', 'Plan', ['Pre-oxygenation / high-flow nasal oxygen', 'Ramped position for obese patient', 'Videolaryngoscope', 'Bougie available', 'Supraglottic airway as rescue (Plan B)', 'Awake fibreoptic intubation', 'Rapid sequence induction', 'Cricoid pressure', 'Front-of-neck access kit ready', 'Tracheostomy under local anaesthesia', 'Senior help called', 'Difficult airway cart in theatre']),
      area('planN', 'Plan A, B, C and D with who does what (Difficult Airway Society algorithm)'),
    ]),
    sec('asa', 'Risk grade', [ch('asaG', 'ASA physical status', ASA)]),
  ],
})

const regional = mk({
  id: 'an-regional', subject: 'anaesthesiology', title: 'Regional anaesthesia and post-operative pain', blurb: 'Spinal, epidural and nerve blocks: assessment, complications, post-dural puncture headache, pain scoring',
  complaints: ['Back pain after spinal anaesthesia', 'Headache after spinal anaesthesia', 'Numbness not wearing off', 'Weakness of legs', 'Low blood pressure after the block', 'Nausea and vomiting', 'Difficulty passing urine', 'Post-operative pain', 'Itching after epidural opioid', 'Shivering', 'Breathlessness after block'],
  hpi: [
    sym('block', 'Block performed', ['onset', at('type', 'Type', ['Subarachnoid (spinal) block', 'Epidural block', 'Combined spinal-epidural', 'Brachial plexus block', 'Femoral / fascia iliaca block', 'Caudal block', 'Peripheral nerve block'], true), at('ass', 'Technique', ['Single attempt', 'Multiple attempts', 'Blood in needle', 'Paraesthesia during insertion', 'Ultrasound guided'], true)]),
    sym('pdph', 'Headache', ['onset', 'duration', 'progression', at('ass', 'Features', ['Worse sitting or standing', 'Relieved on lying flat', 'Neck stiffness', 'Photophobia', 'Tinnitus'], true), at('time', 'Started', ['Within 24 hours', '2 to 5 days after the block'])]),
    sym('back', 'Back pain / neurological symptoms', ['onset', 'duration', at('ass', 'Features', ['Local back pain', 'Radicular pain', 'Numbness in legs', 'Leg weakness', 'Saddle numbness', 'Bladder or bowel dysfunction'], true)]),
    sym('hypot', 'Hypotension / bradycardia', ['onset', at('ass', 'Features', ['Dizziness', 'Nausea', 'Sweating', 'Bradycardia', 'Loss of consciousness'], true)]),
    sym('high', 'High block features', ['onset', at('ass', 'Features', ['Breathlessness', 'Weak arms', 'Difficulty speaking', 'Hypotension', 'Unconsciousness', 'Bradycardia'], true)]),
    sym('toxic', 'Local anaesthetic toxicity', ['onset', at('ass', 'Features', ['Perioral numbness', 'Metallic taste', 'Tinnitus', 'Muscle twitching', 'Seizures', 'Arrhythmia', 'Cardiac arrest'], true)]),
    sym('pain', 'Post-operative pain', ['onset', 'duration', 'site', at('sc', 'Pain score (VAS)', ['1 to 3 mild', '4 to 6 moderate', '7 to 10 severe']), at('ass', 'Features', ['Breakthrough pain', 'Pain on movement', 'Pain at rest', 'Poor sleep'], true)]),
    sym('ponv', 'Nausea and vomiting', ['onset', 'duration', at('ass', 'Risk factors', ['Female', 'Non-smoker', 'History of PONV', 'Opioid use', 'Motion sickness'], true)]),
    sym('urine', 'Urinary retention', ['onset', 'duration', at('ass', 'Features', ['Unable to pass urine', 'Suprapubic discomfort', 'Needs catheterisation'], true)]),
    sym('inf', 'Infection / haematoma', ['onset', at('ass', 'Features', ['Fever', 'Severe back pain', 'Red tender site', 'Progressive leg weakness', 'On anticoagulants'], true)]),
  ],
  middle: [
    sec('details', 'Block details', [
      txt('site', 'Level of puncture (e.g. L3-L4)', { half: true }), txt('drug', 'Drug and dose (e.g. 0.5% bupivacaine heavy 3 ml)', { half: true }),
      txt('needle', 'Needle gauge and type', { half: true }), txt('adj', 'Adjuvants (fentanyl, clonidine, morphine)', { half: true }),
      fd('conF', 'Pre-block check', ['Informed consent', 'Coagulation checked (INR, platelets)', 'No anticoagulant within recommended interval', 'No infection at puncture site', 'IV access and monitors attached', 'Resuscitation equipment ready', 'Preloading / coloading done']),
    ]),
  ],
  pastExtra: ['Previous spinal anaesthesia', 'Back surgery', 'Neurological disease', 'Bleeding disorder', 'Anticoagulant use', 'Chronic headache'],
  familyExtra: ['Anaesthetic problems', 'Bleeding disorder'],
  gpeExtra: ['Hypotension', 'Bradycardia', 'Shivering', 'Pallor and sweating', 'Respiratory distress'],
  exam: [
    sec('spine', 'Spine examination (before the block)', [
      fd('spineF', 'Findings (present = abnormal)', ['Scoliosis', 'Kyphosis', 'Obesity: landmarks difficult', 'Local infection or sepsis', 'Previous back surgery scar', 'Sacral dimple or hairy patch', 'Spinal tenderness']),
      area('spineN', 'Landmarks: Tuffier line (L4 spinous process), level chosen'),
    ]),
    sec('blockEx', 'Assessment of the block', [
      fd('blockF', 'Findings', ['Sensory level T10 (umbilicus)', 'Sensory level T4 (nipple line)', 'Sensory level above T4 (high block)', 'Motor block: Bromage 0 (no block)', 'Motor block: Bromage 1 (cannot raise extended leg)', 'Motor block: Bromage 2 (cannot flex knee)', 'Motor block: Bromage 3 (cannot move ankle)', 'Sensory block patchy / unilateral', 'Block failed', 'Loss of cold sensation (ice test)', 'Absent pin-prick sensation']),
      area('blockN', 'Sensory level on both sides by cold or pin-prick; Bromage score; time of onset and regression'),
    ]),
    sec('comp', 'Complications', [
      fd('compF', 'Findings', ['Hypotension (BP drop over 20%)', 'Bradycardia', 'Post-dural puncture headache', 'Total spinal', 'High spinal with respiratory depression', 'Nausea and vomiting', 'Urinary retention', 'Local anaesthetic toxicity', 'Epidural haematoma', 'Epidural abscess', 'Nerve injury', 'Backache', 'Transient neurological symptoms', 'Pruritus (opioid)', 'Shivering', 'Respiratory depression (opioid)']),
      area('compN', 'Management done: fluids, vasopressor, atropine, lipid emulsion, blood patch'),
    ]),
    sec('painSec', 'Post-operative pain assessment', [
      ch('vas', 'Visual analogue scale', ['0 (no pain)', '1 to 3 (mild)', '4 to 6 (moderate)', '7 to 10 (severe)']),
      fd('painF', 'Analgesia plan', ['Paracetamol', 'NSAID', 'Opioid (tramadol, morphine)', 'Epidural analgesia', 'Patient-controlled analgesia', 'Peripheral nerve block / catheter', 'Wound infiltration', 'Multimodal analgesia', 'Antiemetic given']),
      area('painN', 'Drugs, doses, sedation score and adverse effects'),
    ]),
    sec('asa', 'Risk grade', [ch('asaG', 'ASA physical status', ASA)]),
  ],
})

const icu = mk({
  id: 'an-icu', subject: 'anaesthesiology', title: 'Critical care: shock and respiratory failure', blurb: 'ABCDE assessment, types of shock, respiratory failure, oxygen therapy, ventilation, CPR',
  complaints: ['Sudden breathlessness', 'Low blood pressure', 'Fever with shivering', 'Altered sensorium', 'Reduced urine output', 'Bleeding', 'Vomiting and loose stools', 'Chest pain', 'Cold clammy skin', 'Cardiac arrest', 'Post-operative deterioration', 'Poisoning'],
  hpi: [
    sym('onset', 'Presentation', ['onset', 'duration', 'progression', at('ass', 'Setting', ['Post-operative', 'Trauma', 'Sepsis', 'Cardiac event', 'Poisoning', 'Burns', 'Pregnancy-related', 'Anaphylaxis'], true)]),
    sym('resp', 'Respiratory distress', ['onset', 'duration', at('ass', 'Features', ['Rapid breathing', 'Use of accessory muscles', 'Cough with frothy sputum', 'Wheeze', 'Cyanosis', 'Unable to speak full sentences'], true)]),
    sym('shock', 'Features of shock', ['onset', at('ass', 'Features', ['Dizziness', 'Cold sweaty skin', 'Rapid thready pulse', 'Confusion', 'Low urine output', 'Collapse'], true)]),
    sym('sepsis', 'Source of infection', ['onset', at('ass', 'Source', ['Pneumonia', 'Urinary tract', 'Abdominal', 'Skin and soft tissue', 'Central line', 'Meningitis', 'Surgical wound', 'Unknown'], true)]),
    sym('bleed', 'Bleeding / fluid loss', ['onset', at('ass', 'Loss', ['Haematemesis or melaena', 'Trauma with bleeding', 'Post-partum haemorrhage', 'Vomiting and diarrhoea', 'Burns', 'Third-space loss'], true)]),
    sym('cardiac', 'Cardiac cause', ['onset', at('ass', 'Features', ['Chest pain', 'Previous heart disease', 'Palpitations', 'Raised JVP', 'Pulmonary oedema'], true)]),
    sym('neuro', 'Neurological status', ['onset', at('ass', 'Features', ['Drowsiness', 'Seizures', 'Head injury', 'Stroke', 'Coma'], true)]),
    sym('allergy', 'Allergic trigger', ['onset', at('ass', 'Trigger', ['Drug injection', 'Insect sting', 'Food', 'Contrast', 'Latex', 'Blood transfusion'], true)]),
    sym('renal', 'Organ dysfunction', ['onset', at('ass', 'Features', ['Oliguria', 'Jaundice', 'Bleeding tendency', 'Hypoglycaemia', 'Lactic acidosis'], true)]),
    sym('prior', 'Prior treatment', ['duration', at('ass', 'Done', ['Oxygen given', 'IV fluids given', 'Antibiotics given', 'Intubated elsewhere', 'CPR performed'], true)]),
  ],
  middle: [
    sec('abcde', 'Primary survey (ABCDE)', [
      fd('airwayF', 'A: Airway', ['Airway patent', 'Obstructed airway (snoring, stridor)', 'Secretions or vomit in the airway', 'Cervical spine protection needed']),
      fd('breathF', 'B: Breathing', ['Respiratory rate above 30', 'Respiratory rate below 8', 'SpO2 below 90% on air', 'Accessory muscle use', 'Cyanosis', 'Bilateral crepitations', 'Reduced air entry (effusion / pneumothorax)', 'Wheeze', 'Tracheal deviation']),
      fd('circF', 'C: Circulation', ['Systolic BP below 90 mmHg', 'Tachycardia above 120', 'Capillary refill above 2 seconds', 'Cold clammy peripheries', 'Warm vasodilated peripheries', 'Raised JVP', 'Flat neck veins', 'Muffled heart sounds', 'Oliguria (below 0.5 ml/kg/h)']),
      fd('disF', 'D: Disability', ['GCS below 9', 'Pupils unequal', 'Pupils pinpoint', 'Hypoglycaemia', 'Seizure activity']),
      fd('expF', 'E: Exposure', ['Hypothermia', 'Fever', 'Rash or petechiae', 'Wounds / bleeding', 'Burns']),
    ]),
  ],
  pastExtra: ['Heart failure', 'COPD', 'Cirrhosis', 'Chronic kidney disease', 'Immunosuppression', 'HIV', 'Recent surgery', 'Central venous catheter'],
  familyExtra: ['Heart disease', 'Anaesthetic problems'],
  gpeExtra: ['Cold clammy skin', 'Mottled skin', 'Central cyanosis', 'Sunken eyes', 'Poor skin turgor', 'Skin rash', 'Hypothermia'],
  exam: [
    sec('shockType', 'Type of shock', [
      fd('shockF', 'Findings', ['Hypovolaemic: flat veins, cold extremities', 'Cardiogenic: raised JVP, pulmonary oedema', 'Septic / distributive: warm extremities, bounding pulse', 'Anaphylactic: urticaria, wheeze, angioedema', 'Obstructive: tamponade, tension pneumothorax, pulmonary embolism', 'Neurogenic: bradycardia with hypotension']),
      area('shockN', 'Pulse, BP, MAP, CVP, lactate, urine output'),
    ]),
    sec('rfail', 'Respiratory failure', [
      fd('rfF', 'Findings', ['Type 1 failure: PaO2 below 60 mmHg with normal PaCO2', 'Type 2 failure: PaCO2 above 50 mmHg', 'Respiratory acidosis', 'Respiratory alkalosis', 'Metabolic acidosis', 'Lactate above 2 mmol/L', 'P/F ratio below 300 (ARDS)', 'Flail chest', 'Pleural effusion', 'Pneumothorax']),
      area('rfN', 'ABG values: pH, PaO2, PaCO2, HCO3, lactate, P/F ratio'),
    ]),
    sec('support', 'Resuscitation and organ support', [
      fd('supF', 'Done', ['High-flow oxygen', 'Bag-valve-mask ventilation', 'Endotracheal intubation', 'Non-invasive ventilation (BiPAP / CPAP)', 'Mechanical ventilation', 'IV fluid bolus (crystalloid)', 'Blood transfusion', 'Vasopressor (noradrenaline)', 'Inotrope (dobutamine)', 'Antibiotics within 1 hour', 'Central venous line', 'Arterial line', 'Intercostal drain', 'Needle decompression', 'Adrenaline IM (anaphylaxis)', 'Defibrillation', 'CPR in progress', 'Urinary catheter', 'Dialysis / CRRT']),
      area('supN', 'Ventilator settings (mode, tidal volume 6 ml/kg, PEEP, FiO2) and drug doses'),
    ]),
    sec('score', 'Severity scoring', [
      fd('scoF', 'Findings', ['qSOFA 2 or more', 'SOFA score raised', 'APACHE II high', 'GCS below 8', 'MEWS 5 or more']),
      area('scoN', 'Scores and prognosis'),
    ]),
  ],
})

export const ANAES_CASES: CaseDef[] = [pac, comorbid, difficult, regional, icu]
