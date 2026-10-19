import type { CaseDef, Section } from './types'
import { txt, area, ch, fd, cc, sym, sec, at, vitals } from './dsl'
import { particulars, envSocio } from './blocks'

const pPast = (): Section =>
  sec('past', 'Past and treatment history', [
    fd('pastHx', 'Past history', ['Similar illness in the past', 'Previous hospital admissions', 'Recurrent respiratory infections', 'Tuberculosis contact', 'Seizures', 'Major surgery', 'Blood transfusion', 'Drug allergy', 'Food allergy']),
    area('pastNotes', 'Details of past illness, treatment history and medications'),
  ])

const birth = (): Section =>
  sec('birth', 'Birth history', [
    txt('motherAge', 'Mother\'s age during pregnancy', { half: true }),
    ch('anc', 'Antenatal care', ['Registered, regular ANC', 'Registered, irregular ANC', 'Unregistered']),
    fd('ancF', 'Antenatal', ['TT 2 doses taken', 'IFA / calcium taken', 'Folic acid taken', 'Fever with rash', 'Drug intake', 'Radiation exposure', 'Hypertension / pre-eclampsia', 'Gestational diabetes', 'Bleeding per vagina', 'Major illness']),
    ch('mode', 'Mode of delivery', ['Normal vaginal', 'Caesarean section', 'Assisted (forceps / vacuum)']),
    ch('place', 'Place of delivery', ['Hospital', 'Home (trained dai)', 'Home (untrained)', 'PHC / CHC']),
    ch('term', 'Gestation', ['Term', 'Preterm', 'Post-term']),
    txt('bw', 'Birth weight (g)', { half: true }),
    fd('natal', 'At birth', ['Cried immediately', 'Delayed cry', 'Needed resuscitation', 'NICU stay', 'Neonatal jaundice', 'Neonatal sepsis', 'Seizures', 'Breast fed within 1 hour', 'Meconium passed within 24 h', 'Congenital anomaly']),
    ch('post', 'Postnatal period', ['Uneventful', 'Eventful']),
    area('birthN', 'Details of any complication'),
  ])

const immun = (): Section =>
  sec('immun', 'Immunisation and developmental history', [
    ch('imm', 'Immunisation', ['Fully immunised for age', 'Partially immunised', 'Not immunised']),
    fd('immF', 'Vaccines', ['BCG scar present', 'OPV', 'Pentavalent / DPT', 'Rotavirus', 'Measles / MR', 'PCV', 'Hepatitis B', 'Vitamin A given', 'Optional vaccines given', 'Immunisation card available']),
    area('immN', 'Missed vaccines'),
    ch('gm', 'Gross motor', ['As per age', 'Delayed']), ch('fm', 'Fine motor', ['As per age', 'Delayed']),
    ch('lang', 'Language', ['As per age', 'Delayed']), ch('soc', 'Social and adaptive', ['As per age', 'Delayed']),
    txt('school', 'School standard (if above 5 years)', { half: true }),
    area('devN', 'Milestones attained (age in months): social smile, neck holding, sitting, standing, walking, words'),
  ])

const nutr = (): Section =>
  sec('nutrition', 'Nutritional history', [
    ch('bf', 'Breast feeding', ['Exclusive for 6 months', 'Not exclusive', 'Never breast fed', 'Still breast fed']),
    fd('bfF', 'Feeding', ['Pre-lacteal feed given', 'Top feed / formula', 'Cow / buffalo milk', 'Complementary feeding started at 6 months', 'Complementary feeding delayed', 'Family pot diet']),
    txt('bfDur', 'Breast feeding continued up to', { half: true }), txt('cfStart', 'Complementary food started at (months)', { half: true }),
    area('preDiet', '24 hour recall: before illness (meal, food, kcal, protein)'),
    area('illDiet', '24 hour recall: during illness'),
    txt('dailyKcal', 'Requirement vs intake (kcal, protein, deficit)'),
  ])

const famPaed = (): Section =>
  sec('family', 'Family history', [
    ch('consang', 'Marriage', ['Non-consanguineous', 'Consanguineous']),
    txt('father', 'Father: age, occupation, education', { half: true }), txt('mother', 'Mother: age, occupation, education', { half: true }),
    txt('sibs', 'Siblings (number, ages, school)', { half: true }),
    fd('famHx', 'Family history of', ['Similar illness', 'Diabetes mellitus', 'Hypertension', 'Tuberculosis', 'Asthma / allergy', 'Epilepsy', 'Genetic / congenital disease', 'Infectious disease at home']),
    area('famN', 'Details'),
  ])

const anthro = (): Section =>
  sec('anthro', 'Anthropometry', [
    txt('wt', 'Weight (kg)', { half: true }), txt('ht', 'Height / length (cm)', { half: true }), txt('hc', 'Head circumference (cm)', { half: true }),
    txt('chestC', 'Chest circumference (cm)', { half: true }), txt('mac', 'Mid-arm circumference (cm)', { half: true }), txt('bmi', 'BMI', { half: true }),
    txt('usls', 'Upper segment : lower segment', { half: true }), txt('span', 'Arm span (cm)', { half: true }),
    ch('growth', 'WHO growth chart', ['Within normal range (median +/-2 SD)', 'Below -2 SD (underweight / stunted / wasted)', 'Below -3 SD (severe)', 'Above +2 SD', 'Above +3 SD']),
    area('growthN', 'Percentile / SD score and comment'),
  ])

const gpePaed = (): Section =>
  sec('gpe', 'General physical examination', [
    ch('act', 'General condition', ['Active, playful', 'Irritable', 'Lethargic', 'Drowsy', 'Unconscious']),
    ch('nourish', 'Nutritional status', ['Well nourished', 'Mildly malnourished', 'Moderately malnourished', 'Severely malnourished']),
    fd('signs', 'General signs', ['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'Oedema (pedal / facial)', 'Lymphadenopathy', 'Dehydration', 'Sunken eyes', 'Skin pinch goes back slowly', 'Dyspnoea', 'Dysmorphic features', 'Hair changes', 'Angular stomatitis', 'Bitot spots', 'Rickets signs', 'Skin lesions', 'Raised JVP']),
    area('gpeN', 'Details of any positive finding'),
    vitals('vitals', true),
  ])

const paedClose = (): Section =>
  sec('closing', 'Summary, diagnosis and plan', [
    area('summary', 'Summary of the case'), area('provDx', 'Provisional diagnosis'), area('ddx', 'Differential diagnosis'), area('ix', 'Investigations'), area('rx', 'Treatment / management'),
  ])

const git: CaseDef = {
  id: 'paed-git', subject: 'paediatrics', title: 'Gastrointestinal system (paediatrics)', blurb: 'Vomiting, diarrhoea, jaundice, abdominal pain, distension',
  sections: [
    particulars({ paeds: true }),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Vomiting', 'Nausea', 'Yellowish discolouration of eyes / skin', 'Decreased urine output', 'Distension of abdomen', 'Facial puffiness', 'Pain abdomen', 'Constipation', 'Fever', 'Diarrhoea', 'Dysentery', 'Melaena', 'Decreased appetite', 'Haematemesis'])]),
    sec('hpi', 'History of present illness', [
      sym('pain', 'Pain abdomen', ['onset', 'duration', 'progression', at('site', 'Site', ['Epigastric', 'Periumbilical', 'Right iliac fossa', 'Right hypochondrium', 'Hypogastric', 'Generalised']), 'nature', 'radiation', 'aggravating', 'relieving']),
      sym('vomit', 'Vomiting', ['onset', 'duration', 'episodes', at('type', 'Type', ['Bilious', 'Non-bilious', 'Projectile', 'Blood-stained', 'Feculent', 'After feeds']), 'aggravating', 'relieving']),
      sym('diarr', 'Diarrhoea', ['onset', 'duration', 'episodes', 'amount', at('stool', 'Stool', ['Watery', 'Rice-water', 'Mucoid', 'Blood-stained', 'Foul smelling', 'Greasy']), at('ass', 'Associated', ['Fever', 'Vomiting', 'Abdominal pain', 'Thirst', 'Reduced urine', 'Lethargy'], true)]),
      sym('jaundice', 'Jaundice', ['onset', 'duration', 'progression', at('ass', 'Associated', ['Dark urine', 'Pale stools', 'Pruritus', 'Fever', 'Abdominal pain', 'Bleeding tendency'], true)]),
      sym('dist', 'Abdominal distension', ['onset', 'duration', 'progression', at('ass', 'Associated', ['Facial puffiness', 'Pedal oedema', 'Reduced urine', 'Vomiting', 'Constipation'], true)]),
      sym('urine', 'Decreased urine output / puffiness', ['onset', 'duration', 'progression', at('ass', 'Associated', ['Haematuria', 'Frothy urine', 'Dysuria', 'Facial puffiness', 'Hypertension symptoms'], true)]),
      sym('const', 'Constipation', ['onset', 'duration', 'progression']),
      sym('fever', 'Fever', ['onset', 'duration', 'progression', 'grade']),
      sym('melaena', 'Melaena / haematemesis / dysentery', ['onset', 'duration', 'episodes', 'amount']),
      fd('also', 'Also ask', ['Decreased appetite', 'Weight loss', 'Sunken eyes', 'Excessive thirst', 'Contaminated water or food', 'Contact with similar cases', 'Worm infestation', 'Pica']),
    ]),
    pPast(), birth(), immun(), nutr(), famPaed(), envSocio(), anthro(), gpePaed(),
    sec('abd', 'Abdominal examination', [
      ch('shape', 'Shape', ['Flat', 'Scaphoid', 'Distended', 'Pot belly']),
      fd('abdF', 'Findings', ['Umbilicus everted', 'Visible peristalsis', 'Dilated veins', 'Tenderness', 'Guarding', 'Rigidity', 'Rebound tenderness', 'Hepatomegaly', 'Splenomegaly', 'Palpable mass', 'Ballotable kidney', 'Shifting dullness', 'Fluid thrill', 'Bowel sounds normal', 'Bowel sounds sluggish / absent', 'Hernial orifices normal', 'Anal tag / fissure']),
      area('abdN', 'Liver span / spleen size / mass description'),
      area('pr', 'Per rectal examination'),
      area('other', 'Other systems (CVS, RS, CNS)'),
    ]),
    paedClose(),
  ],
}

const nutrition: CaseDef = {
  id: 'paed-nutrition', subject: 'paediatrics', title: 'Nutritional disorder', blurb: 'Failure to thrive, malnutrition (SAM / MAM), rickets, anaemia',
  sections: [
    particulars({ paeds: true }),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Inability to gain weight', 'Failure to thrive', 'Weight loss', 'Poor appetite', 'Swelling of feet / face', 'Recurrent diarrhoea', 'Recurrent respiratory infections', 'Skin lesions', 'Delayed milestones', 'Bowed legs', 'Weakness'])]),
    sec('hpi', 'History of present illness', [
      sym('wtGain', 'Failure to gain weight', ['onset', 'duration', 'progression']),
      sym('vomit', 'Vomiting', ['onset', 'duration', 'episodes']),
      sym('diarr', 'Diarrhoea', ['onset', 'duration', 'episodes', 'progression']),
      sym('dist', 'Abdominal distension', ['onset', 'duration']),
      sym('ear', 'Ear discharge', ['onset', 'duration']),
      sym('skin', 'Skin lesions', ['onset', 'duration', 'site']),
      sym('rti', 'Recurrent respiratory tract infections', ['duration', 'episodes']),
      sym('urine', 'Oliguria / polyuria', ['onset', 'duration']),
      fd('also', 'Also ask', ['Poor appetite', 'Refusal of feeds', 'Chronic cough', 'Contact with tuberculosis', 'Worm infestation', 'Pallor / easy fatigue', 'Night blindness', 'Delayed dentition', 'Delayed closure of fontanelle', 'Developmental delay']),
    ]),
    pPast(), birth(), immun(), nutr(), famPaed(), envSocio(), anthro(), gpePaed(),
    sec('sam', 'Nutritional assessment', [
      fd('nutF', 'Signs', ['Visible severe wasting', 'Bilateral pitting oedema', 'Marasmus appearance', 'Kwashiorkor appearance', 'MUAC below 11.5 cm', 'MUAC 11.5 to 12.5 cm', 'Weight-for-height below -3 SD', 'Hair thin / sparse / flag sign', 'Skin flaky paint dermatosis', 'Muscle wasting', 'Loss of subcutaneous fat', 'Old man facies', 'Baggy pants']),
      fd('vit', 'Micronutrient deficiency signs', ['Vitamin A: Bitot spots', 'Vitamin A: xerosis', 'Vitamin D: rachitic rosary', 'Vitamin D: frontal bossing', 'Vitamin D: widened wrists', 'Vitamin D: bow legs / knock knees', 'Vitamin D: Harrison sulcus', 'Vitamin C: bleeding gums', 'B complex: angular stomatitis', 'B complex: glossitis', 'Iron: pallor, koilonychia', 'Iodine: goitre', 'Zinc: acrodermatitis']),
      ch('class', 'Classification', ['Normal', 'Moderate acute malnutrition', 'Severe acute malnutrition (non-complicated)', 'Severe acute malnutrition (complicated)', 'Stunting', 'Underweight', 'Overweight / obese']),
      ch('iaps', 'IAP / Gomez grade', ['Grade I', 'Grade II', 'Grade III', 'Grade IV']),
      area('nutN', 'Notes'),
    ]),
    sec('sys', 'Systemic examination', [
      area('cvs', 'CVS'), area('rs', 'Respiratory system'), area('abd', 'Abdomen (hepatomegaly, distension)'), area('cns', 'CNS (apathy, irritability, tone)'),
    ]),
    paedClose(),
  ],
}

const newborn: CaseDef = {
  id: 'paed-newborn', subject: 'paediatrics', title: 'Newborn', blurb: 'Neonatal jaundice, sepsis, respiratory distress, prematurity',
  sections: [
    sec('particulars', 'Patient particulars', [
      txt('baby', 'Baby of', { half: true }), txt('name', 'Name', { half: true }),
      txt('dob', 'Date of birth', { half: true }), txt('age', 'Age (days)', { half: true }),
      ch('sex', 'Sex', ['Male', 'Female']),
      txt('ga', 'Gestational age (weeks)', { half: true }), txt('lmp', 'LMP', { half: true }), txt('edd', 'EDD', { half: true }),
      txt('bw', 'Weight of baby (g)', { half: true }),
      ch('agaType', 'Weight for gestational age', ['Appropriate for gestational age (AGA)', 'Small for gestational age (SGA)', 'Large for gestational age (LGA)']),
      ch('period', 'Period', ['Early neonatal (0 to 7 days)', 'Late neonatal (8 to 28 days)']),
      ch('mode', 'Mode of delivery', ['Normal vaginal', 'Caesarean section', 'Assisted']), ch('place', 'Place of delivery', ['Hospital', 'Home', 'PHC / CHC']),
      txt('address', 'Address of mother', { half: true }), txt('mAge', 'Age of mother', { half: true }), txt('parity', 'Parity index', { half: true }),
      txt('informant', 'Informant', { half: true }), ch('reliability', 'Reliability', ['Reliable', 'Fairly reliable', 'Unreliable']),
    ]),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Delayed / not passed meconium', 'Not passed urine', 'Yellowish discolouration of skin / eyes', 'Fever', 'Involuntary movements / seizures', 'Poor feeding', 'Fast breathing', 'Bluish discolouration', 'Lethargy', 'Vomiting', 'Abdominal distension', 'Umbilical discharge', 'Skin lesions'])]),
    sec('hpi', 'History of present illness', [
      sym('jaundice', 'Jaundice', ['onset', 'duration', 'progression', at('extent', 'Extent', ['Face', 'Upto chest', 'Upto abdomen', 'Upto palms and soles'])]),
      sym('resp', 'Respiratory distress', ['onset', 'duration', 'progression', at('ass', 'Associated', ['Grunting', 'Chest indrawing', 'Cyanosis', 'Nasal flaring'], true)]),
      sym('feed', 'Poor feeding / lethargy', ['onset', 'duration', 'progression']),
      sym('seizure', 'Seizures', ['onset', 'duration', 'episodes', at('type', 'Type', ['Subtle', 'Tonic', 'Clonic', 'Myoclonic'])]),
      sym('fever', 'Fever / hypothermia', ['onset', 'duration', 'progression']),
      sym('meconium', 'Delayed meconium / urine', ['onset', 'duration']),
      fd('also', 'Other', ['Admitted to NICU', 'Umbilical discharge', 'Skin pustules', 'Vomiting', 'Abdominal distension', 'Excessive crying', 'Bleeding']),
      area('rxHx', 'Treatment history'),
    ]),
    sec('antenatal', 'Antenatal history', [
      ch('conc', 'Conception', ['Spontaneous', 'Fertility treatment']),
      fd('t1', 'First trimester', ['Fever with rash', 'Excessive vomiting', 'Drug intake', 'Radiation exposure', 'Bleeding per vagina', 'Leaking per vagina', 'Urinary tract infection', 'Folic acid taken', 'Regular ANC', 'Scan done']),
      fd('t2', 'Second trimester', ['Headache', 'Fever with rash', 'Swelling behind ear', 'Pedal oedema', 'Blurring of vision', 'Bleeding / leaking per vagina', 'Pain abdomen', 'Iron and calcium taken', 'Scan done']),
      fd('t3', 'Third trimester', ['Hypertension / pre-eclampsia', 'Gestational diabetes', 'Premature rupture of membranes', 'Reduced fetal movements', 'Fever', 'Antenatal steroids given', 'Iron and calcium taken', 'Scan done']),
      area('anteN', 'Details (quickening, weight gain, scan findings, blood group, infection screen)'),
    ]),
    sec('natal', 'Natal and postnatal history', [
      fd('natalF', 'Natal', ['Cried immediately', 'Delayed cry', 'Resuscitation needed', 'Meconium-stained liquor', 'Prolonged labour', 'Cord clamped immediately', 'Meconium passed within 24 h', 'Urine passed within 48 h']),
      ch('apgar', 'APGAR', ['Normal (7 to 10)', 'Low (4 to 6)', 'Very low (0 to 3)', 'Not known']),
      fd('post', 'Postnatal', ['NICU admission', 'Breast feeding initiated early', 'Jaundice', 'Fever', 'Umbilical discharge', 'Respiratory distress', 'Immunised (BCG, OPV, Hep B)']),
      area('natalN', 'Details'),
    ]),
    sec('family', 'Family and socio-economic history', [
      ch('consang', 'Marriage', ['Non-consanguineous', 'Consanguineous']), txt('sibs', 'Siblings and their health'),
      fd('famHx', 'Family history', ['Neonatal deaths', 'Jaundice in siblings', 'Genetic disease', 'Diabetes', 'Hypertension', 'Tuberculosis']),
      txt('ses', 'Socio-economic class and housing'),
    ]),
    sec('exam', 'General examination', [
      ch('act', 'Activity', ['Active', 'Lethargic', 'Irritable', 'Floppy']),
      fd('signs', 'Signs', ['Pallor', 'Icterus (Kramer zone)', 'Cyanosis', 'Respiratory distress', 'Grunting', 'Chest indrawing', 'Nasal flaring', 'Hypothermia', 'Fever', 'Dehydration', 'Oedema', 'Dysmorphism', 'Skin pustules', 'Umbilical discharge', 'Birth injuries (cephalhaematoma, caput)']),
      txt('hr', 'Heart rate', { half: true }), txt('rr', 'Respiratory rate', { half: true }), txt('temp', 'Temperature', { half: true }), txt('spo2', 'SpO2', { half: true }), txt('crt', 'Capillary refill', { half: true }),
      txt('wt', 'Weight (g)', { half: true }), txt('len', 'Length (cm)', { half: true }), txt('hc', 'Head circumference (cm)', { half: true }),
      txt('ballard', 'Gestational age by Ballard / New Ballard score'),
      fd('head', 'Head to toe', ['Anterior fontanelle full', 'Anterior fontanelle sunken', 'Sutures overriding', 'Cleft lip / palate', 'Choanal atresia', 'Clavicle fracture', 'Spine defects', 'Anal opening patent', 'Genitalia abnormal', 'Hip click (Ortolani, Barlow)', 'Single palmar crease']),
    ]),
    sec('sys', 'Systemic examination', [
      area('rs', 'Respiratory system (Downes / Silverman score)'), area('cvs', 'CVS'), area('abd', 'Abdomen (umbilicus, liver, spleen, bowel sounds)'),
      fd('cns', 'CNS', ['Moro reflex normal', 'Rooting reflex present', 'Sucking reflex present', 'Grasp reflex present', 'Tone normal', 'Hypotonia', 'Hypertonia', 'Seizure activity', 'Bulging fontanelle', 'Cry weak', 'High-pitched cry']),
      area('cnsN', 'Notes'),
    ]),
    paedClose(),
  ],
}

const cns: CaseDef = {
  id: 'paed-cns', subject: 'paediatrics', title: 'Central nervous system (paediatrics)', blurb: 'Seizures, altered sensorium, weakness, meningitis, cerebral palsy',
  sections: [
    particulars({ paeds: true }),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Altered sensorium', 'Inability to use the limbs', 'Paucity of movements', 'Convulsions', 'Fever', 'Headache', 'Vomiting', 'Neck stiffness', 'Delayed milestones', 'Abnormal gait', 'Squint / visual problem', 'Speech problem', 'Behavioural changes', 'Head size abnormality'])]),
    sec('hpi', 'History of present illness', [
      fd('onsetF', 'Onset', ['Acute', 'Subacute', 'Chronic', 'Paroxysmal', 'Following sleep', 'While playing', 'Following fever', 'Following trauma']),
      ch('course', 'Course', ['Progressive', 'Static', 'Improving']),
      sym('fever', 'Fever', ['onset', 'duration', 'progression', 'grade']),
      sym('conv', 'Convulsions', ['onset', 'duration', 'episodes', at('type', 'Type', ['Generalised tonic-clonic', 'Focal', 'Febrile', 'Infantile spasms', 'Absence']), at('post', 'After attack', ['Postictal sleep', 'Todd paralysis', 'Incontinence'], true)]),
      sym('loc', 'Altered sensorium / unconsciousness', ['onset', 'duration', 'progression', at('ass', 'Associated', ['Loss of orientation', 'Behavioural change', 'Not recognising parents', 'Not playing, eating or sleeping well'], true)]),
      sym('motor', 'Weakness / limb problems', ['onset', 'duration', 'progression', at('part', 'Part involved', ['Right side', 'Left side', 'Both lower limbs', 'All four limbs'], true), at('ass', 'Features', ['Stiffness', 'Flaccidity', 'Wasting', 'Difficulty walking', 'Difficulty in buttoning'], true)]),
      sym('cranial', 'Cranial nerve symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Visual dysfunction', 'Diplopia / squint', 'Difficulty eating', 'Dribbling of saliva', 'Deviation of angle of mouth', 'Inability to close the eyes', 'Hearing loss / vertigo', 'Nasal twang', 'Dysphagia'], true)]),
      sym('sensory', 'Sensory symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Loss of sensation', 'Numbness', 'Tingling'], true)]),
      sym('cereb', 'Cerebellar symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Ataxia', 'Titubation', 'Nystagmus', 'Staccato speech', 'Intention tremor', 'Change in handwriting', 'Swaying while walking'], true)]),
      fd('also', 'Also ask', ['Headache', 'Vomiting', 'Neck stiffness', 'Photophobia', 'Head injury', 'Cough / cold', 'Ear discharge', 'Loss of memory', 'Emotional disturbance', 'Sleep disturbance', 'Handedness changed']),
    ]),
    pPast(), birth(), immun(), nutr(), famPaed(), envSocio(), anthro(), gpePaed(),
    sec('hmf', 'Higher mental functions and cranial nerves', [
      ch('lvl', 'Level of consciousness', ['Alert', 'Drowsy', 'Stuporous', 'Comatose']), txt('gcs', 'GCS / AVPU', { half: true }),
      fd('hmfF', 'Findings', ['Recognises parents', 'Oriented', 'Speech normal', 'Attention normal', 'Cognitive delay']),
      fd('cnF', 'Cranial nerves abnormal', ['Squint', 'Ptosis', 'Pupil abnormal', 'Papilloedema', 'Nystagmus', 'Facial palsy', 'Hearing loss', 'Palatal weakness', 'Tongue deviation']),
      area('cnN', 'Details'),
    ]),
    sec('motor', 'Motor and sensory system', [
      ch('tone', 'Tone', ['Normal', 'Hypotonia', 'Spasticity', 'Rigidity']),
      txt('power', 'Power (limb-wise)', { half: true }),
      fd('motF', 'Findings', ['Wasting', 'Fasciculations', 'Hemiplegic gait', 'Diplegic (scissoring) gait', 'Ataxic gait', 'Waddling gait', "Gowers' sign", 'Pseudohypertrophy of calves', 'Involuntary movements', 'Plantar extensor', 'Deep reflexes exaggerated', 'Deep reflexes diminished', 'Clonus', 'Sensory loss', 'Cerebellar signs positive']),
      fd('primitive', 'Primitive reflexes', ['Moro persistent', 'ATNR persistent', 'Palmar grasp persistent', 'Parachute absent']),
      area('motN', 'Details'),
    ]),
    sec('mening', 'Meningeal signs and skull', [
      fd('menF', 'Findings', ['Neck stiffness', "Kernig's sign", "Brudzinski's sign", 'Bulging fontanelle', 'Sutural diastasis', 'Macrocephaly', 'Microcephaly', 'Skull swelling', 'Spine deformity', 'Tuft of hair / dimple over spine', 'Neurocutaneous markers']),
      area('other', 'Other systems (CVS, RS, abdomen)'),
    ]),
    paedClose(),
  ],
}

const resp: CaseDef = {
  id: 'paed-resp', subject: 'paediatrics', title: 'Respiratory system (paediatrics)', blurb: 'Cough, fever, fast breathing, wheeze, pneumonia, asthma',
  sections: [
    particulars({ paeds: true }),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Cough', 'Fever', 'Difficulty in breathing', 'Fast breathing', 'Wheeze', 'Noisy breathing / stridor', 'Chest pain', 'Cyanosis', 'Poor feeding', 'Failure to thrive', 'Recurrent respiratory infections'])]),
    sec('hpi', 'History of present illness', [
      sym('cough', 'Cough', ['onset', 'duration', 'progression', at('type', 'Type', ['Dry', 'Productive', 'Paroxysmal', 'Whooping', 'Barking', 'Post-tussive vomiting']), 'aggravating', 'relieving', 'timing']),
      sym('fever', 'Fever', ['onset', 'duration', 'progression', 'grade', at('ass', 'Associated', ['Chills', 'Rash', 'Night sweats'], true)]),
      sym('breath', 'Difficulty in breathing', ['onset', 'duration', 'progression', at('ass', 'Features', ['Fast breathing', 'Chest indrawing', 'Grunting', 'Nasal flaring', 'Orthopnoea', 'Paroxysmal nocturnal dyspnoea'], true), 'aggravating', 'relieving']),
      sym('wheeze', 'Wheeze', ['onset', 'duration', 'episodes', 'timing', 'aggravating', 'relieving', at('ass', 'Triggers', ['Dust', 'Cold air', 'Exercise', 'Smoke', 'Viral infections', 'Food'], true)]),
      sym('pain', 'Chest pain', ['onset', 'duration', 'nature', 'aggravating']),
      sym('feed', 'Feeding difficulty', ['onset', 'duration', at('ass', 'Features', ['Breaks feed for breath', 'Sweating during feeds', 'Poor weight gain'], true)]),
      fd('also', 'Also ask', ['Choking episode (foreign body)', 'Contact with tuberculosis', 'Cyanosis', 'Recurrent chest infections', 'Allergy (eczema, rhinitis)', 'Sibling with asthma', 'Smoke exposure', 'Joint pain', 'Squatting / cyanotic spells']),
    ]),
    pPast(), birth(), immun(), nutr(), famPaed(), envSocio(), anthro(), gpePaed(),
    sec('rsExam', 'Respiratory examination: inspection and palpation', [
      txt('rr', 'Respiratory rate (/min)', { half: true }), txt('spo2', 'SpO2 (%)', { half: true }),
      fd('inspF', 'Inspection', ['Fast breathing', 'Nasal flaring', 'Grunting', 'Stridor', 'Subcostal retractions', 'Intercostal retractions', 'Suprasternal retractions', 'Head bobbing', 'Cyanosis', 'Pectus carinatum', 'Pectus excavatum', "Harrison's sulcus", 'Chest asymmetry', 'Reduced movement on one side', 'Hyperinflated chest']),
      fd('palpF', 'Palpation', ['Trachea central', 'Trachea shifted', 'Apex beat displaced', 'Tactile fremitus increased', 'Tactile fremitus decreased', 'Chest expansion reduced']),
      area('inspN', 'Notes'),
    ]),
    sec('rsExam2', 'Percussion and auscultation', [
      fd('percF', 'Percussion', ['Resonant', 'Hyper-resonant', 'Dull', 'Stony dull', 'Liver dullness displaced']),
      ch('bs', 'Breath sounds', ['Vesicular, normal', 'Vesicular, diminished', 'Bronchial', 'Absent']),
      fd('adv', 'Added sounds', ['Fine crepitations', 'Coarse crepitations', 'Rhonchi', 'Wheeze', 'Pleural rub', 'Prolonged expiration']),
      area('auscN', 'Areas involved'),
      area('other', 'Other systems (CVS, abdomen, CNS)'),
    ]),
    paedClose(),
  ],
}

const cvs: CaseDef = {
  id: 'paed-cvs', subject: 'paediatrics', title: 'Cardiovascular system (paediatrics)', blurb: 'Congenital heart disease, rheumatic heart disease, heart failure',
  sections: [
    particulars({ paeds: true }),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Cough', 'Fever', 'Difficulty in breathing', 'Increased precordial activity', 'Failure to thrive', 'Cyanosis', 'Recurrent lower respiratory tract infections', 'Joint pains', 'Exercise intolerance', 'Chest pain', 'Swelling of feet / face', 'Syncope'])]),
    sec('hpi', 'History of present illness', [
      sym('cough', 'Cough', ['onset', 'duration', 'progression', 'aggravating', 'relieving', 'timing']),
      sym('breath', 'Difficulty in breathing', ['onset', 'duration', 'progression', at('ass', 'Features', ['Orthopnoea', 'Platypnoea', 'Trepopnoea', 'Paroxysmal nocturnal dyspnoea', 'Sweating during feeds', 'Breaks feeds for breath'], true), 'aggravating', 'relieving']),
      sym('cyan', 'Cyanosis', ['onset', 'duration', 'progression', at('ass', 'Features', ['At birth', 'On crying', 'On exertion', 'Squatting episodes', 'Cyanotic spells'], true)]),
      sym('chestpain', 'Chest pain', ['onset', 'duration', 'nature', 'radiation', 'aggravating']),
      sym('joint', 'Joint pains', ['onset', 'duration', at('ass', 'Pattern', ['Fleeting (migratory)', 'Large joints', 'Swelling', 'Fever'], true)]),
      sym('fever', 'Fever / sore throat', ['onset', 'duration', 'progression']),
      sym('fttf', 'Failure to thrive / feeding difficulty', ['onset', 'duration', 'progression']),
      fd('also', 'Also ask', ['Recurrent chest infections', 'Squatting', 'Delayed milestones', 'Syncope on exertion', 'Chorea movements', 'Skin rash', 'Dental procedure recently', 'Facial puffiness / pedal oedema', 'Reduced urine output']),
    ]),
    pPast(), birth(), immun(), nutr(), famPaed(), envSocio(), anthro(), gpePaed(),
    sec('markers', 'Markers and peripheral signs', [
      fd('mk', 'Look for', ['Down syndrome features', 'Turner features', 'Marfanoid habitus', 'Dysmorphism', 'Cyanosis (central)', 'Clubbing', 'Arthritis', 'Erythema marginatum', 'Subcutaneous nodules', 'Chorea', 'Splinter haemorrhages', 'Janeway lesions', 'Osler nodes', 'Oedema', 'Raised JVP', 'Tender hepatomegaly', 'Prominent precordium']),
      txt('pulse', 'Pulse (rate, rhythm, volume, character, femoral)', { half: true }), txt('bp', 'BP (four limbs)', { half: true }),
      area('mkN', 'Details'),
    ]),
    sec('cvsExam', 'Precordial examination', [
      fd('inspF', 'Inspection / palpation', ['Precordial bulge', 'Visible apex beat', 'Apex beat displaced', 'Left parasternal heave', 'Thrill', 'Palpable P2', 'Hyperdynamic precordium']),
      fd('sounds', 'Heart sounds', ['S1 normal', 'S1 loud', 'S2 single', 'P2 loud', 'Wide fixed splitting', 'S3 gallop', 'Ejection click', 'Muffled sounds']),
      fd('murmur', 'Murmurs', ['Systolic murmur', 'Diastolic murmur', 'Continuous murmur', 'Pansystolic', 'Ejection systolic', 'Mid-diastolic', 'Radiating to axilla', 'Radiating to back', 'Pericardial rub']),
      area('murmurN', 'Describe murmur (area, grade, radiation)'),
      area('other', 'Chest (crepitations), abdomen (hepatomegaly), CNS'),
    ]),
    paedClose(),
  ],
}

export const PAED_CASES: CaseDef[] = [git, nutrition, newborn, cns, resp, cvs]
