import type { CaseDef } from './types'
import { txt, area, ch, fd, cc, sym, sec, at } from './dsl'
import { particulars, pastHistory, familyHistory, personalHistory, menstrualHistory, gpe, closing } from './blocks'

const ABD_SITE = at('site', 'Site', ['Epigastric', 'Right hypochondrium', 'Left hypochondrium', 'Umbilical', 'Right lumbar', 'Left lumbar', 'Right iliac fossa', 'Left iliac fossa', 'Hypogastric', 'Generalised'])

const git: CaseDef = {
  id: 'med-git', subject: 'medicine', title: 'Gastrointestinal system', blurb: 'Abdominal pain, jaundice, vomiting, GI bleeding, ascites',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [
      cc('cc', 'Select the complaints and give the duration', ['Abdominal pain', 'Abdominal distension', 'Abdominal lump', 'Dysphagia', 'Flatulence', 'Nausea / vomiting', 'Haematemesis', 'Diarrhoea', 'Melaena', 'Jaundice', 'Fever', 'Oedema', 'Oliguria', 'Burning sensation']),
    ]),
    sec('hpi', 'History of present illness', [
      sym('pain', 'Abdominal pain', ['onset', 'duration', 'progression', ABD_SITE, 'nature', 'episodes', 'radiation', 'aggravating', 'relieving']),
      sym('dist', 'Abdominal distension', ['onset', 'duration', 'progression', at('assoc', 'Associated with', ['Pain', 'Reduced urine output', 'Pedal oedema', 'Puffiness of face', 'Vomiting'], true), 'aggravating', 'relieving']),
      sym('lump', 'Abdominal lump', ['onset', 'duration', 'progression', ABD_SITE, 'grade', at('surface', 'Surface / edge', ['Smooth', 'Irregular', 'Well-defined edge', 'Ill-defined edge']), at('pain', 'Pain', ['Painful', 'Painless'])]),
      sym('dysphagia', 'Dysphagia', ['onset', 'duration', 'progression', at('rel', 'Relation to food', ['Solids only', 'Liquids only', 'Both solids and liquids', 'Initially solids then liquids']), 'aggravating', 'relieving']),
      sym('flatulence', 'Flatulence', ['duration', at('assoc', 'Associated with', ['Belching', 'Pain', 'Diarrhoea', 'Specific food', 'Food allergy', 'Intestinal parasites'], true)]),
      sym('vomit', 'Vomiting', ['onset', 'duration', 'progression', 'episodes', at('type', 'Type', ['Bilious', 'Non-bilious', 'Blood-stained', 'Food particles', 'Foul smelling', 'Projectile', 'With nausea']), 'amount', 'aggravating', 'relieving']),
      sym('jaundice', 'Jaundice', ['onset', 'duration', 'progression', at('assoc', 'Associated with', ['Pruritus', 'Pale stools', 'Dark urine', 'Abdominal pain', 'Fever', 'Weight loss'], true)]),
      sym('hematemesis', 'Haematemesis', ['onset', 'duration', 'episodes', at('colour', 'Colour', ['Bright red', 'Coffee-ground', 'Dark altered blood']), 'amount']),
      sym('diarrhoea', 'Diarrhoea', ['onset', 'duration', 'progression', 'episodes', 'amount', at('stool', 'Stool', ['Watery', 'Semisolid', 'Blood-stained', 'Mucus-stained', 'Foul smelling', 'With tenesmus', 'With pain'], true), 'aggravating', 'relieving']),
      sym('melaena', 'Melaena', ['onset', 'duration', 'episodes', at('stool', 'Stool', ['Black tarry', 'Sticking to the pan', 'Foul smelling', 'Associated with straining'], true)]),
      sym('fever', 'Fever', ['onset', 'duration', 'progression', at('grade', 'Grade', ['Low grade', 'Moderate', 'High grade']), at('pattern', 'Pattern', ['Continuous', 'Intermittent', 'Remittent']), at('assoc', 'Associated with', ['Chills and rigors', 'Night sweats'], true)]),
      sym('oedema', 'Oedema', ['onset', 'duration', 'progression', 'site', at('type', 'Type', ['Pitting', 'Non-pitting']), 'aggravating', 'relieving']),
      sym('oliguria', 'Oliguria', ['onset', 'duration', at('assoc', 'Associated with', ['Dysuria', 'Haematuria', 'High-coloured urine'], true)]),
    ], 'Mark each symptom Present or Absent; for present ones, choose the details.'),
    pastHistory(),
    sec('drug', 'Drug history', [area('drugHx', 'Drugs taken (NSAIDs, steroids, ATT, alcohol, herbal)'), fd('allergy', 'Allergy', ['Drug allergy', 'Food allergy'])]),
    personalHistory(),
    familyHistory(),
    menstrualHistory(),
    gpe(['Parotid enlargement', 'Spider naevi', 'Gynaecomastia', 'Palmar erythema', 'Flapping tremors', "Dupuytren's contracture", 'Alopecia', 'Testicular atrophy', 'Oral candidiasis', 'Kayser-Fleischer ring']),
    sec('oral', 'Oral cavity', [
      ch('hygiene', 'Oral hygiene', ['Good', 'Poor']),
      fd('oralF', 'Findings', ['Dental caries', 'Dentures', 'Coated tongue', 'Glossitis', 'Angular stomatitis', 'Oral ulcers', 'Pale palate', 'Icteric palate', 'Foul breath', 'Fetor hepaticus', 'Tonsillar enlargement']),
    ]),
    sec('insp', 'Abdomen: inspection', [
      ch('shape', 'Shape', ['Scaphoid', 'Flat', 'Uniformly distended', 'Distended with a localised swelling']),
      ch('flanks', 'Flanks', ['Free', 'Full', 'Bulging']),
      ch('umb', 'Umbilicus', ['Central and inverted', 'Everted', 'Shifted upwards', 'Shifted downwards', 'Discoloured']),
      ch('resp', 'Movement with respiration', ['All quadrants move equally', 'Restricted', 'Absent']),
      fd('inspF', 'Findings', ['Stretched skin', 'Striae', 'Sinuses', 'Nodules', 'Visible mass', 'Dilated veins', 'Caput medusae', 'Visible gastric peristalsis', 'Visible intestinal peristalsis', 'Visible pulsations', 'Scars', 'Pigmentation', 'Hernial orifices bulging']),
      area('inspN', 'Notes (direction of venous flow, location of scars)'),
    ]),
    sec('palp', 'Abdomen: palpation', [
      fd('palpF', 'Findings', ['Local rise of temperature', 'Tenderness', 'Guarding', 'Rigidity', 'Rebound tenderness', 'Palpable liver', 'Palpable spleen', 'Palpable kidney', 'Palpable mass', 'Fluid thrill']),
      area('liver', 'Liver (cm below costal margin, edge, surface, consistency, tenderness, pulsatile?)'),
      area('spleen', 'Spleen (cm below costal margin, direction, notch, surface, consistency)'),
      area('kidney', 'Kidneys / other masses (ballotable, bimanual palpation)'),
    ]),
    sec('percAusc', 'Abdomen: percussion and auscultation', [
      fd('percF', 'Percussion', ['Liver dullness present', 'Liver dullness obliterated', 'Shifting dullness', 'Tidal percussion positive', 'Traube space dull']),
      txt('span', 'Liver span (cm)', { half: true }),
      ch('bowelSounds', 'Bowel sounds', ['Normal', 'Sluggish', 'Absent', 'Exaggerated']),
      fd('auscF', 'Auscultation', ['Venous hum', 'Arterial bruit', 'Succussion splash']),
      area('percN', 'Notes'),
    ]),
    sec('other', 'Other systems', [
      area('cvs', 'CVS'), area('rs', 'Respiratory system'), area('cns', 'CNS'),
    ]),
    closing({ medicine: true }),
  ],
}

const cns: CaseDef = {
  id: 'med-cns', subject: 'medicine', title: 'Central nervous system', blurb: 'Weakness, seizures, headache, speech, gait, sensory loss',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [
      cc('cc', 'Select the complaints and give the duration', ['Weakness of limbs', 'Altered sensorium', 'Loss of consciousness', 'Seizures', 'Headache', 'Vomiting', 'Giddiness / vertigo', 'Slurred speech', 'Difficulty in speech', 'Deviation of angle of mouth', 'Double vision', 'Visual loss', 'Numbness / tingling', 'Involuntary movements', 'Difficulty in walking', 'Memory loss', 'Behavioural changes', 'Bladder / bowel disturbance', 'Fever', 'Neck stiffness']),
    ]),
    sec('hpi', 'History of present illness', [
      sym('weak', 'Weakness of limbs', ['onset', 'duration', 'progression', at('part', 'Part involved', ['Right upper limb', 'Left upper limb', 'Right lower limb', 'Left lower limb', 'Right half of body', 'Left half of body', 'Both lower limbs', 'All four limbs'], true), at('dist', 'Pattern', ['Proximal', 'Distal', 'Proximal and distal']), at('ass', 'Associated', ['Stiffness', 'Flaccidity', 'Wasting', 'Difficulty buttoning', 'Difficulty combing', 'Difficulty climbing stairs', 'Difficulty squatting'], true)]),
      sym('ams', 'Altered sensorium / unconsciousness', ['onset', 'duration', 'progression', at('att', 'Attacks', ['First episode', 'Recurrent']), at('ass', 'Associated', ['Seizure', 'Fever', 'Headache', 'Vomiting', 'Head injury', 'Disorientation', 'Behavioural change'], true)]),
      sym('seizure', 'Seizures', ['onset', 'duration', at('type', 'Type', ['Generalised tonic-clonic', 'Focal', 'Focal with secondary generalisation', 'Absence', 'Myoclonic']), at('aura', 'Aura / warning', ['With aura', 'Without aura']), at('post', 'After the attack', ['Postictal drowsiness', 'Todd paralysis', 'Tongue bite', 'Incontinence', 'Headache'], true), 'episodes']),
      sym('headache', 'Headache', ['onset', 'duration', 'progression', at('site', 'Site', ['Frontal', 'Temporal', 'Occipital', 'Holocranial', 'Unilateral', 'Bilateral']), 'nature', at('ass', 'Associated', ['Nausea / vomiting', 'Photophobia', 'Phonophobia', 'Visual aura', 'Fever', 'Neck stiffness', 'Papilloedema symptoms'], true), 'aggravating', 'relieving']),
      sym('vertigo', 'Giddiness / vertigo', ['onset', 'duration', 'episodes', at('ass', 'Associated', ['Tinnitus', 'Hearing loss', 'Nausea / vomiting', 'Postural trigger', 'Ear discharge'], true)]),
      sym('speech', 'Speech disturbance', ['onset', 'duration', 'progression', at('type', 'Type', ['Dysarthria', 'Expressive aphasia', 'Receptive aphasia', 'Nasal twang', 'Staccato speech', 'Scanning speech'], true)]),
      sym('cranial', 'Cranial nerve symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Loss of smell', 'Visual loss', 'Diplopia', 'Squint', 'Drooping eyelid', 'Facial asymmetry', 'Inability to close the eye', 'Loss of taste', 'Hearing loss', 'Dysphagia', 'Nasal regurgitation', 'Difficulty shrugging shoulders', 'Tongue deviation'], true)]),
      sym('sensory', 'Sensory symptoms', ['onset', 'duration', 'progression', at('part', 'Part involved', ['Hands', 'Feet', 'One side of the body', 'Trunk level', 'Face'], true), at('type', 'Type', ['Total loss', 'Partial loss', 'Increased sensation', 'Tingling', 'Numbness', 'Burning'], true)]),
      sym('cerebellar', 'Cerebellar symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Unsteady gait', 'Swaying while walking', 'Intention tremor', 'Change in handwriting', 'Difficulty with alternating movements', 'Staccato speech'], true)]),
      sym('involuntary', 'Involuntary movements', ['onset', 'duration', at('type', 'Type', ['Resting tremor', 'Intention tremor', 'Chorea', 'Dystonia', 'Myoclonus', 'Tics'], true)]),
      sym('higher', 'Higher mental function', ['onset', 'duration', at('ass', 'Symptoms', ['Memory loss', 'Disorientation', 'Behavioural change', 'Emotional disturbance', 'Sleep disturbance', 'Hallucinations'], true)]),
      sym('sphincter', 'Bladder / bowel', ['onset', 'duration', at('ass', 'Symptoms', ['Urinary retention', 'Urge incontinence', 'Constipation', 'Faecal incontinence'], true)]),
    ]),
    pastHistory(['Head injury', 'Previous seizures', 'Meningitis / encephalitis', 'Atrial fibrillation']),
    personalHistory(),
    familyHistory(['Epilepsy', 'Stroke', 'Neuromuscular disease']),
    menstrualHistory(),
    gpe(),
    sec('hmf', 'Higher mental functions', [
      ch('lvl', 'Level of consciousness', ['Alert', 'Drowsy', 'Stuporous', 'Comatose']),
      txt('gcs', 'GCS (E V M)', { half: true }),
      fd('hmfF', 'Findings', ['Oriented to time', 'Oriented to place', 'Oriented to person', 'Attention intact', 'Memory intact (recent)', 'Memory intact (remote)', 'Judgement intact', 'Speech fluent', 'Comprehension intact', 'Repetition intact', 'Naming intact', 'Dysarthria', 'Aphasia', 'Apraxia', 'Agnosia', 'Neglect']),
      area('hmfN', 'Notes'),
    ]),
    sec('cn', 'Cranial nerves', [
      fd('cnF', 'Cranial nerve findings', ['I Olfaction impaired', 'II Visual acuity reduced', 'II Visual field defect', 'II Pupil reflex abnormal', 'Fundus: papilloedema', 'III IV VI Ptosis', 'III IV VI Squint', 'III IV VI Restricted eye movements', 'Nystagmus', 'V Facial sensation loss', 'V Jaw jerk exaggerated', 'V Corneal reflex absent', 'V Weak mastication', 'VII Facial asymmetry (UMN)', 'VII Facial palsy (LMN)', 'VIII Hearing loss', 'VIII Rinne abnormal', 'VIII Weber lateralised', 'IX X Palatal movement impaired', 'IX X Gag reflex absent', 'IX X Uvula deviated', 'XI Weak SCM / trapezius', 'XII Tongue deviation', 'XII Tongue wasting / fasciculations']),
      area('cnN', 'Details (side, degree)'),
    ]),
    sec('motor', 'Motor system', [
      ch('bulk', 'Bulk', ['Normal', 'Wasting']),
      ch('tone', 'Tone', ['Normal', 'Hypotonia', 'Spasticity (clasp-knife)', 'Rigidity (lead pipe)', 'Cogwheel rigidity']),
      txt('powerRUL', 'Power: right upper limb (MRC 0-5)', { half: true }), txt('powerLUL', 'Power: left upper limb', { half: true }),
      txt('powerRLL', 'Power: right lower limb', { half: true }), txt('powerLLL', 'Power: left lower limb', { half: true }),
      fd('motF', 'Findings', ['Fasciculations', 'Pronator drift', 'Involuntary movements', 'Hemiparetic gait', 'Ataxic gait', 'Spastic gait', 'High-stepping gait', 'Waddling gait', 'Parkinsonian gait']),
      area('motN', 'Notes'),
    ]),
    sec('reflex', 'Reflexes', [
      fd('deep', 'Deep reflexes (present = exaggerated)', ['Biceps exaggerated', 'Triceps exaggerated', 'Supinator exaggerated', 'Knee exaggerated', 'Ankle exaggerated', 'Jaw jerk exaggerated', 'Biceps diminished', 'Triceps diminished', 'Knee diminished', 'Ankle diminished', 'Clonus']),
      fd('superficial', 'Superficial reflexes / plantar', ['Plantar extensor (Babinski positive)', 'Plantar flexor', 'Abdominal reflex absent', 'Cremasteric reflex absent', 'Corneal reflex absent']),
      area('reflexN', 'Notes (grade each reflex, side)'),
    ]),
    sec('sens', 'Sensory system and cerebellum', [
      fd('sensF', 'Sensory', ['Touch impaired', 'Pain impaired', 'Temperature impaired', 'Vibration impaired', 'Joint position sense impaired', 'Romberg positive', 'Stereognosis impaired', 'Graphaesthesia impaired', 'Two-point discrimination impaired', 'Sensory level present']),
      fd('cereb', 'Cerebellar signs', ['Nystagmus', 'Titubation', 'Scanning speech', 'Hypotonia', 'Intention tremor', 'Dysdiadochokinesia', 'Rebound phenomenon', 'Finger-nose incoordination', 'Heel-shin incoordination', 'Past pointing', 'Tandem walking impaired']),
      fd('mening', 'Meningeal signs / skull and spine', ['Neck stiffness', "Kernig's sign", "Brudzinski's sign", 'Skull swelling or deformity', 'Spinal deformity', 'Spinal tenderness']),
      fd('ans', 'Autonomic', ['Orthostatic hypotension', 'Abnormal sweating']),
      area('sensN', 'Notes'),
    ]),
    sec('other', 'Other systems', [area('cvs', 'CVS (carotid bruit, murmurs, rhythm)'), area('rs', 'Respiratory system'), area('abd', 'Abdomen')]),
    closing({ medicine: true }),
  ],
}

const rs: CaseDef = {
  id: 'med-rs', subject: 'medicine', title: 'Respiratory system', blurb: 'Cough, breathlessness, haemoptysis, chest pain, wheeze',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [
      cc('cc', 'Select the complaints and give the duration', ['Cough', 'Expectoration', 'Haemoptysis', 'Breathlessness', 'Chest pain', 'Wheeze', 'Fever', 'Loss of weight', 'Loss of appetite']),
    ]),
    sec('hpi', 'History of present illness', [
      sym('cough', 'Cough', ['onset', 'duration', 'progression', 'episodes', at('type', 'Type', ['Dry', 'Productive', 'Post-tussive vomiting', 'Barking', 'Paroxysmal']), 'aggravating', 'relieving', 'timing']),
      sym('sputum', 'Expectoration', ['onset', 'duration', 'progression', 'amount', at('colour', 'Colour', ['Mucoid', 'Purulent', 'Mucopurulent', 'Frothy', 'Rusty', 'Blood-stained']), at('consistency', 'Consistency', ['Thin', 'Thick', 'Tenacious']), 'smell', 'timing', 'aggravating', 'relieving']),
      sym('hemo', 'Haemoptysis', ['onset', 'duration', 'episodes', at('type', 'Blood', ['Fresh', 'Altered']), 'amount', 'aggravating']),
      sym('dyspnoea', 'Breathlessness', ['onset', 'duration', 'progression', at('nyha', 'Grade (mMRC)', ['Grade 0', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']), at('pos', 'Positional', ['Orthopnoea', 'Platypnoea', 'Trepopnoea', 'Paroxysmal nocturnal dyspnoea'], true), 'timing', 'aggravating', 'relieving', at('wheeze', 'With wheeze', ['With wheeze', 'Without wheeze'])]),
      sym('pain', 'Chest pain', ['onset', 'duration', 'progression', 'side', 'nature', 'radiation', 'episodes', 'aggravating', 'relieving']),
      sym('wheeze', 'Wheeze', ['onset', 'duration', 'progression', 'episodes', 'timing', 'aggravating', 'relieving', at('assoc', 'Associated', ['Skin rash', 'Allergy to dust', 'Allergy to food', 'Allergy to drugs'], true)]),
      sym('fever', 'Fever', ['onset', 'duration', 'progression', at('grade', 'Grade', ['Low grade', 'Moderate', 'High grade']), at('assoc', 'Associated', ['Chills and rigors', 'Night sweats', 'Skin rash'], true), 'timing']),
      sym('wtloss', 'Loss of weight', ['onset', 'duration', 'progression']),
      sym('appetiteLoss', 'Loss of appetite', ['onset', 'duration', 'progression']),
    ]),
    pastHistory(['Recurrent respiratory infections', 'Whooping cough', 'Measles', 'Community-acquired pneumonia', 'Recent hospitalisation', 'ICU admission / mechanical ventilation', 'Major injuries', 'STDs']),
    personalHistory(),
    sec('smoking', 'Smoking, occupational and drug history', [
      txt('smokeType', 'Smoking (type)', { half: true }), txt('packYrs', 'Pack-years / smoking index', { half: true }), txt('alc', 'Alcohol (brand, ml/day)', { half: true }),
      fd('occ', 'Occupational exposure', ['Mines', 'Factories', 'Animal husbandry', 'Farming', 'Construction / dust', 'Biomass fuel exposure']),
      fd('drugs', 'Drug history', ['Penicillin injections', 'ATT taken', 'Anticancer drugs', 'ART', 'Drug allergy']),
    ]),
    familyHistory(),
    menstrualHistory(),
    gpe(['Congenital malformations', 'Dusky cyanosis', 'Neck vein congestion']),
    sec('urt', 'Upper respiratory tract', [
      ch('hyg', 'Oral hygiene', ['Good', 'Poor']),
      fd('urtF', 'Findings', ['Tonsillar enlargement', 'Sinus tenderness', 'Deviated nasal septum', 'Flaring of alae nasi', 'Post-nasal drip', 'Pharyngeal congestion', 'Nasal polyps']),
    ]),
    sec('insp', 'Chest: inspection', [
      ch('shape', 'Shape of chest', ['Normal (elliptical)', 'Barrel shaped', 'Pigeon chest', 'Funnel chest', 'Flat chest', 'Kyphoscoliotic', 'Rachitic rosary']),
      ch('trachea', 'Trachea', ['Central', 'Shifted to the right', 'Shifted to the left']),
      ch('sym', 'Symmetry', ['Symmetrical', 'Right side flattened', 'Left side flattened', 'Right side bulge', 'Left side bulge']),
      fd('inspF', 'Findings', ['Accessory muscles in use', 'Drooping of shoulder', 'Indrawing of intercostal spaces', 'Crowding of ribs', 'Intercostal bulging', 'Scars', 'Sinuses', 'Dilated veins', 'Visible pulsations', 'Reduced movement on right', 'Reduced movement on left']),
      txt('apex', 'Apex beat position', { half: true }),
      area('inspN', 'Notes (areas with reduced movement)'),
    ]),
    sec('palp', 'Chest: palpation', [
      fd('palpF', 'Findings', ['Local rise of temperature', 'Tenderness', 'Tactile vocal fremitus increased', 'Tactile vocal fremitus decreased', 'Tactile vocal fremitus absent', 'Palpable rub', 'Palpable rhonchi', 'Palpable crepitus', 'Trachea deviated', 'Apex beat displaced']),
      txt('exp', 'Chest expansion (cm)', { half: true }), txt('circ', 'Chest circumference (cm)', { half: true }), txt('ap', 'AP / transverse diameter', { half: true }),
      area('palpN', 'Areas involved'),
    ]),
    sec('perc', 'Chest: percussion', [
      fd('percF', 'Note', ['Resonant', 'Hyper-resonant', 'Dull', 'Stony dull', 'Tympanic', 'Liver dullness upper border raised', 'Liver dullness upper border lowered', 'Cardiac dullness obliterated', "Traube's space obliterated"]),
      area('percN', 'Areas involved (supraclavicular, infraclavicular, mammary, axillary, infrascapular, etc.)'),
    ]),
    sec('ausc', 'Chest: auscultation', [
      ch('bs', 'Breath sounds', ['Vesicular, normal intensity', 'Vesicular, diminished', 'Vesicular, increased', 'Bronchial', 'Bronchovesicular', 'Absent']),
      fd('adv', 'Added sounds', ['Fine crepitations', 'Coarse crepitations', 'Post-tussive crepitations', 'Rhonchi', 'Wheeze', 'Pleural rub', 'Amphoric breath sounds', 'Crackles at bases']),
      fd('vr', 'Vocal resonance', ['Increased', 'Decreased', 'Aegophony', 'Bronchophony', 'Whispering pectoriloquy']),
      area('auscN', 'Areas involved and special tests (coin test, succussion splash)'),
    ]),
    sec('other', 'Other systems', [area('cvs', 'CVS (S1 S2, loud P2, murmurs, RV S3)'), area('cns', 'CNS'), area('abd', 'Abdomen (hepatomegaly)')]),
    sec('closing', 'Summary and diagnosis', [
      area('summary', 'Summary of the case'),
      txt('anat', 'Anatomical (side and lobe)'), txt('path', 'Pathology'), txt('etio', 'Aetiology'),
      ch('rf', 'Respiratory failure', ['Present', 'Absent']), ch('cp', 'Cor pulmonale', ['Present', 'Absent']),
      area('ddx', 'Differential diagnosis'), area('ix', 'Investigations'), area('rx', 'Treatment / management'),
    ]),
  ],
}

const cvs: CaseDef = {
  id: 'med-cvs', subject: 'medicine', title: 'Cardiovascular system', blurb: 'Chest pain, breathlessness, palpitations, syncope, oedema',
  sections: [
    particulars(),
    sec('complaints', 'Presenting complaints', [
      cc('cc', 'Select the complaints and give the duration', ['Chest pain', 'Shortness of breath', 'Palpitations', 'Haemoptysis', 'Syncope', 'Swelling of feet', 'Cough', 'Fatigue', 'Fever', 'Cyanotic spells']),
    ]),
    sec('hpi', 'History of present illness', [
      sym('pain', 'Chest pain', ['onset', 'duration', 'progression', 'site', 'nature', 'radiation', 'episodes', at('ass', 'Associated with', ['Sweating', 'Nausea', 'Vomiting', 'Breathlessness'], true), 'aggravating', 'relieving']),
      sym('sob', 'Breathlessness', ['onset', 'duration', 'progression', at('nyha', 'NYHA grade', ['Grade I', 'Grade II', 'Grade III', 'Grade IV']), at('pos', 'Positional', ['Orthopnoea', 'Platypnoea', 'Trepopnoea', 'Paroxysmal nocturnal dyspnoea'], true), 'aggravating', 'relieving']),
      sym('palp', 'Palpitations', ['onset', 'duration', 'progression', at('rhythm', 'Rhythm', ['Regular', 'Irregular']), at('when', 'Occurs', ['At rest', 'On exertion']), at('nyha', 'NYHA grade', ['Grade I', 'Grade II', 'Grade III', 'Grade IV']), 'aggravating', 'relieving']),
      sym('hemo', 'Haemoptysis', ['onset', 'duration', 'episodes', at('type', 'Blood', ['Fresh', 'Altered']), 'amount']),
      sym('syncope', 'Syncope', ['onset', 'duration', 'episodes', at('rel', 'Relation to exertion', ['On exertion', 'At rest', 'On standing', 'No relation']), 'aggravating', 'relieving']),
      sym('oedema', 'Swelling of feet', ['onset', 'duration', 'site', at('type', 'Type', ['Dependent', 'Sacral', 'Facial puffiness']), at('time', 'Time of day', ['Evening worse', 'Morning worse', 'Constant']), 'aggravating', 'relieving']),
      sym('general', 'General symptoms', [at('ass', 'Symptoms', ['Loss of appetite', 'Right hypochondrial pain', 'Weight loss', 'Fatigue', 'Fever', 'Cyanotic spells', 'Oliguria'], true), 'duration']),
    ]),
    sec('past', 'Past history', [
      fd('pastHx', 'Cardiac and systemic history', ['CCF symptoms (anorexia, pedal oedema, orthopnoea)', 'Rheumatic fever (sore throat, fleeting joint pain)', 'Taking penicillin prophylaxis', 'Infective endocarditis risk (dental / GI / GU procedure)', 'Congenital heart disease', 'Diabetes mellitus', 'Hypertension', 'Asthma', 'Pulmonary tuberculosis', 'Unprotected sex', 'CAD', 'COPD', 'CVA', 'Malignancy']),
      area('pastNotes', 'Details'),
    ]),
    personalHistory(),
    familyHistory(['Congenital heart disease', 'Ischaemic heart disease', 'Sudden cardiac death', 'Sickle cell disease']),
    sec('treat', 'Treatment history', [area('rxHx', 'Treatment received so far (drugs, surgery, chemotherapy)'), fd('allergy', 'Allergy', ['Drug allergy / reaction'])]),
    menstrualHistory(),
    gpe(['Central cyanosis', 'Peripheral cyanosis', 'Pandigital clubbing', 'Unilateral pedal oedema', 'Significant lymphadenopathy']),
    sec('markers', 'Markers of cardiac disease', [
      fd('mk', 'Look for', ['Dwarfism', 'Gigantism', 'Low-set ears', 'Hypertelorism', 'Mongoloid facies', 'High-arched palate', 'Webbed neck', 'Kyphoscoliosis', 'Chest wall deformity', 'Syndactyly / polydactyly', 'Arachnodactyly', 'Simian crease', 'Rocker-bottom feet', 'Sandal gap', 'Arthritis', 'Erythema marginatum', 'Subcutaneous nodules', "Sydenham's chorea", 'Splinter haemorrhages', "Osler's nodes", 'Roth spots', 'Janeway lesions', 'Splenomegaly', 'Arcus senilis', 'Xanthelasma', 'Xanthomas', 'Nicotine staining', 'Marfanoid habitus']),
      area('mkN', 'Details'),
    ]),
    sec('pulse', 'Pulse and blood pressure', [
      txt('rate', 'Pulse rate (/min)', { half: true }),
      ch('rhythm', 'Rhythm', ['Regular', 'Regularly irregular', 'Irregularly irregular']),
      ch('volume', 'Volume', ['Normal', 'Low volume', 'High volume']),
      ch('char', 'Character', ['Normal', 'Collapsing (water hammer)', 'Pulsus alternans', 'Pulsus paradoxus', 'Anacrotic / slow rising', 'Bisferiens']),
      fd('pulseF', 'Findings', ['Radio-radial delay', 'Radio-femoral delay', 'Apex-pulse deficit', 'Thickened vessel wall', 'All peripheral pulses felt']),
      txt('bp', 'Blood pressure (mmHg)', { half: true }), fd('bpF', 'BP findings', ["Hill's sign positive", 'Postural drop', 'Differential BP in arms']),
      txt('rr', 'Respiratory rate', { half: true }), txt('temp', 'Temperature', { half: true }),
    ]),
    sec('neck', 'Neck and chest inspection', [
      ch('jvp', 'JVP', ['Not raised', 'Raised', 'Prominent a wave', 'Prominent v wave', 'Cannon waves', 'Kussmaul sign']),
      txt('jvpCm', 'JVP (cm above sternal angle)', { half: true }),
      fd('neckF', 'Findings', ['Carotid pulsation prominent', 'Carotid bruit', 'Trachea shifted', 'Thyroid enlargement', 'Precordial bulge', 'Chest wall deformity', 'Dilated veins', 'Scars / sinuses', 'Visible apical impulse', 'Parasternal pulsation', 'Pulmonary pulsation', 'Epigastric pulsation', 'Suprasternal pulsation']),
      txt('apex', 'Apical impulse (site, character)'),
    ]),
    sec('palp', 'Palpation', [
      fd('palpF', 'Findings', ['Apex beat displaced', 'Apex beat heaving', 'Apex beat tapping', 'Left parasternal heave', 'Thrill present', 'Palpable P2', 'Palpable S2', 'Hepatomegaly (congestive)']),
      area('palpN', 'Apex beat position and character; thrill location and timing'),
    ]),
    sec('ausc', 'Auscultation', [
      fd('sounds', 'Heart sounds', ['S1 normal', 'S1 loud', 'S1 soft', 'S2 normal', 'P2 loud', 'A2 soft', 'Split S2 (wide / fixed)', 'S3 gallop', 'S4 gallop', 'Opening snap', 'Ejection click', 'Pericardial rub']),
      fd('murmur', 'Murmurs', ['Systolic murmur', 'Diastolic murmur', 'Continuous murmur', 'Mitral area', 'Aortic area', 'Pulmonary area', 'Tricuspid area', 'Radiating to axilla', 'Radiating to carotids', 'Increases on inspiration']),
      area('murmurN', 'Describe murmur (timing, grade, character, radiation, manoeuvres)'),
      area('chest', 'Lung bases / other systems (crepitations, effusion, hepatomegaly, ascites)'),
    ]),
    sec('closing', 'Summary and diagnosis', [
      area('summary', 'Summary of the case'),
      txt('anat', 'Anatomical diagnosis'), txt('etio', 'Aetiological diagnosis'), txt('func', 'Functional diagnosis (NYHA)'),
      area('prov', 'Provisional diagnosis'), area('ddx', 'Differential diagnosis'), area('ix', 'Investigations'), area('rx', 'Treatment / management'),
    ]),
  ],
}

export const MEDICINE_CASES: CaseDef[] = [git, cns, rs, cvs]
