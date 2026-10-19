import type { CaseDef } from './types'
import { txt, area, ch, fd, cc, sym, sec, at, vitals, date } from './dsl'
import { particulars, pastHistory, familyHistory, personalHistory, envSocio, gpe, closing } from './blocks'

const ENT_SIGNS = ['Cervical lymphadenopathy']

const entCommon = () => [
  pastHistory(['Previous ENT surgery', 'Allergy (rhinitis / atopy)']),
  familyHistory(['Hearing loss in family']),
  personalHistory(),
  envSocio(),
  gpe(ENT_SIGNS),
]

const entClose = () => closing()

const gyn: CaseDef = {
  id: 'obg-gyn', subject: 'obg', title: 'Gynaecology', blurb: 'Menstrual disorders, pain, discharge, mass, infertility, prolapse',
  sections: [
    particulars({ obg: true }),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Irregular cycles', 'Mid-cycle bleeding / spotting', 'Painful menstruation', 'Excessive flow', 'Passage of clots', 'Increased duration of flow', 'Decreased duration of flow', 'Scanty flow', 'Amenorrhoea', 'Pain abdomen', 'Mass per abdomen', 'Mass coming out of vagina', 'Excessive white discharge', 'Foul-smelling discharge', 'Pruritus', 'Lower backache', 'Fatigue', 'Dizziness', 'Painful coitus', 'Inability to conceive', 'Unusual weight gain', 'Bladder symptoms', 'Bowel symptoms'])]),
    sec('hpi', 'History of present illness', [
      sym('cycle', 'Menstrual problem', ['onset', 'duration', 'progression', at('type', 'Pattern', ['Irregular cycles', 'Menorrhagia', 'Polymenorrhoea', 'Oligomenorrhoea', 'Hypomenorrhoea', 'Metrorrhagia', 'Intermenstrual bleeding', 'Postcoital bleeding', 'Postmenopausal bleeding', 'Amenorrhoea'], true), at('clots', 'Clots', ['Passage of clots', 'No clots']), at('dys', 'Pain', ['Painful (dysmenorrhoea)', 'Painless'])]),
      sym('pain', 'Pain abdomen', ['onset', 'duration', 'progression', at('site', 'Site', ['Hypogastrium', 'Right iliac fossa', 'Left iliac fossa', 'Lower back', 'Generalised']), 'nature', 'radiation', 'aggravating', 'relieving', at('rel', 'Relation to cycle', ['Premenstrual', 'During periods', 'Mid-cycle', 'Unrelated'])]),
      sym('mass', 'Mass per abdomen / vagina', ['onset', 'duration', 'progression', at('type', 'Type', ['Lump in the abdomen', 'Mass coming out of vagina (prolapse)', 'Worse on standing / straining']), 'aggravating']),
      sym('discharge', 'Vaginal discharge', ['onset', 'duration', 'amount', at('c', 'Colour', ['White', 'Yellow', 'Green', 'Blood-stained', 'Watery']), 'smell', at('ass', 'Associated', ['Pruritus', 'Dyspareunia', 'Burning micturition', 'Fever', 'Lower abdominal pain'], true)]),
      sym('infert', 'Infertility', ['duration', at('type', 'Type', ['Primary', 'Secondary'])]),
      sym('urinary', 'Bladder / bowel dysfunction', ['onset', 'duration', at('ass', 'Symptoms', ['Frequency', 'Urgency', 'Stress incontinence', 'Urge incontinence', 'Dysuria', 'Retention', 'Constipation', 'Pain on defecation'], true)]),
      fd('also', 'Also ask', ['Fatigue', 'Dizziness', 'Painful coitus', 'Unusual weight gain', 'Hirsutism', 'Galactorrhoea', 'Hot flushes', 'Congenital anomaly diagnosed']),
    ]),
    sec('past', 'Past history', [
      fd('pastHx', 'Past illnesses', ['Similar complaints in the past', 'Diabetes mellitus', 'Hypertension', 'Asthma', 'Tuberculosis', 'Malignancy', 'Thyroid disorder', 'Congenital / chromosomal anomaly', 'Blood transfusion', 'Drug allergy', 'Previous surgery']),
      area('pastNotes', 'Surgery / medical interventions / details'),
    ]),
    sec('menstrual', 'Menstrual history', [
      txt('menarche', 'Age at menarche', { half: true }), txt('lmp2', 'LMP', { half: true }),
      ch('cycleReg', 'Cycle', ['Regular', 'Irregular']), txt('len', 'Cycle length / days of flow', { half: true }),
      txt('pads', 'Pads / cloths per day', { half: true }),
      fd('mF', 'Associated', ['Dysmenorrhoea', 'Passage of clots', 'Premenstrual symptoms']),
    ]),
    sec('marital', 'Marital and obstetric history', [
      txt('married', 'Married since', { half: true }), ch('consang', 'Marriage', ['Non-consanguineous', 'Consanguineous']),
      txt('husband', "Husband's occupation", { half: true }), txt('parity', 'Parity index (G P L A)', { half: true }),
      area('children', 'Children: number, sex, age, immunisation, any antenatal / natal / postnatal complication'),
      ch('contra', 'Contraception', ['None', 'Condoms', 'OCP', 'IUCD', 'Tubal ligation', 'Other']),
    ]),
    familyHistory(),
    personalHistory(),
    envSocio(),
    gpe(),
    sec('abdInsp', 'Abdomen: inspection and palpation', [
      ch('shape', 'Shape', ['Flat', 'Scaphoid', 'Uniformly distended', 'Distended with lower abdominal swelling']),
      fd('inspF', 'Inspection', ['Umbilicus central', 'Umbilicus everted', 'Flanks free', 'Moves with respiration', 'Scars', 'Sinuses', 'Dilated veins', 'Visible mass', 'Hernial orifices normal']),
      fd('palpF', 'Palpation', ['Local rise of temperature', 'Tenderness', 'Guarding', 'Rigidity', 'Palpable lump', 'Palpable liver', 'Palpable spleen', 'Renal angle tender', 'Lump arising from pelvis', 'Can get below the swelling']),
      area('lumpN', 'Lump: size in weeks, border, consistency (cystic / soft / hard), surface, mobility'),
      txt('girth', 'Abdominal girth / SFH measurements'),
    ]),
    sec('abdPerc', 'Percussion, auscultation, other systems', [
      fd('percF', 'Percussion', ['Tympanic note', 'Liver dullness preserved', 'Shifting dullness', 'Fluid thrill', 'Cardiac dullness normal', 'Tidal percussion']),
      fd('auscF', 'Auscultation', ['Bowel sounds heard', 'Venous hum', 'Arterial bruit']),
      area('cvs', 'CVS'), area('rs', 'RS'), area('cns', 'CNS'),
    ]),
    sec('pelvic', 'Pelvic examination', [
      fd('perSpec', 'Per speculum', ['Cervix healthy', 'Cervical erosion', 'Cervical polyp', 'Cervical growth', 'Vaginal discharge', 'Cystocele', 'Rectocele', 'Uterine prolapse (grade)', 'Stress incontinence on cough']),
      fd('perVag', 'Per vaginal', ['Uterus anteverted', 'Uterus retroverted', 'Uterus bulky', 'Uterus mobile', 'Uterus fixed', 'Fornices free', 'Fornix tenderness', 'Adnexal mass', 'Cervical motion tenderness', 'Pouch of Douglas fullness']),
      area('pelvicN', 'Details (size of uterus in weeks, mass description)'),
    ]),
    closing(),
  ],
}

const antenatal: CaseDef = {
  id: 'obg-anc', subject: 'obg', title: 'Obstetrics: antenatal case', blurb: 'Antenatal history, obstetric examination, Leopold manoeuvres',
  sections: [
    sec('particulars', 'Patient particulars', [
      txt('name', 'Name', { half: true }), txt('age', 'Age', { half: true }), txt('education', 'Education', { half: true }), txt('occupation', 'Occupation', { half: true }),
      txt('address', 'Address', { half: true }), txt('lmp', 'LMP', { half: true }), txt('edd', 'EDD', { half: true }), txt('ga', 'Gestational age (weeks + days)', { half: true }),
      txt('parity', 'Parity index (G P L A)', { half: true }), txt('informant', 'Informant', { half: true }), date('doa', 'Date of admission'), date('doe', 'Date of examination'),
    ]),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Amenorrhoea', 'Labour pain', 'Pain abdomen', 'Bleeding per vagina', 'Leaking per vagina', 'Decreased fetal movements', 'Headache', 'Blurring of vision', 'Swelling of feet', 'Vomiting', 'Fever', 'Routine antenatal check-up'])]),
    sec('hpi', 'History of present illness', [
      sym('pain', 'Pain abdomen / labour pain', ['onset', 'duration', 'progression', at('freq', 'Frequency', ['Every 10 minutes', 'Every 5 minutes', 'Every 2 to 3 minutes', 'Irregular']), 'severity']),
      sym('bleed', 'Bleeding per vagina', ['onset', 'duration', 'amount', at('ass', 'Associated', ['Painful', 'Painless', 'Show', 'After coitus'], true)]),
      sym('leak', 'Leaking per vagina', ['onset', 'duration', 'amount', at('c', 'Colour', ['Clear', 'Meconium-stained', 'Blood-stained'])]),
      sym('fm', 'Fetal movements', [at('s', 'Movements', ['Well perceived', 'Decreased', 'Absent']), 'duration']),
      sym('pih', 'Headache / blurring / oedema', [at('ass', 'Symptoms', ['Headache', 'Blurring of vision', 'Epigastric pain', 'Pedal oedema (not relieved by rest)', 'Facial puffiness', 'Convulsions'], true), 'duration']),
    ]),
    sec('t1', 'History of present pregnancy: first trimester', [
      txt('amen', 'Days of amenorrhoea at confirmation', { half: true }), ch('upt', 'Urine pregnancy test', ['Done, positive', 'Not done']),
      ch('conc', 'Conception', ['Spontaneous', 'With fertility treatment']),
      fd('t1', 'First trimester', ['Excessive vomiting', 'Fatigue', 'Fever with rash', 'Swelling behind the ear', 'Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Burning micturition', 'Increased frequency', 'Radiation exposure', 'Regular drug intake', 'Folic acid taken', 'Regular ANC', 'First trimester scan done']),
      area('t1N', 'Weight gain / scan findings / details'),
    ]),
    sec('t2', 'Second trimester', [
      txt('quick', 'Quickening felt at (month)', { half: true }),
      fd('t2', 'Second trimester', ['Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Headache', 'Dizziness', 'Blurring of vision', 'Pedal oedema', 'Excessive vomiting', 'Regular drug intake', 'Calcium and iron taken', 'Regular ANC', 'Anomaly scan done']),
      area('t2N', 'Weight gain / scan findings / details'),
    ]),
    sec('t3', 'Third trimester', [
      ch('fm3', 'Fetal movements', ['Well perceived', 'Decreased', 'Absent']),
      fd('t3', 'Third trimester', ['Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Headache', 'Dizziness', 'Blurring of vision', 'Pedal oedema', 'Burning micturition', 'Increased frequency', 'Fever', 'Calcium and iron taken', 'Regular ANC', 'Third trimester scan done']),
      area('t3N', 'Weight gain / scan findings / details'),
    ]),
    sec('pastOb', 'Past obstetric history', [
      txt('par', 'Parity index', { half: true }),
      area('each', 'Each pregnancy: year, mode and place of delivery, sex, birth weight, complications, NICU, breast feeding, immunisation, present status'),
      fd('compl', 'Previous complications', ['Antenatal complications', 'Abortion', 'Stillbirth', 'Preterm birth', 'Caesarean section', 'Postpartum haemorrhage', 'Gestational diabetes', 'Pre-eclampsia', 'Neonatal complications']),
    ]),
    sec('past', 'Past, menstrual, marital and family history', [
      fd('pastHx', 'Past history', ['Diabetes mellitus', 'Hypertension', 'Asthma', 'Malignancy', 'Tuberculosis', 'Thyroid disorder', 'Previous surgery', 'Drug allergy']),
      txt('menarche', 'Menarche / cycle / flow', { half: true }), txt('married', 'Married since', { half: true }), ch('consang', 'Marriage', ['Non-consanguineous', 'Consanguineous']), txt('husband', "Husband's occupation"),
      fd('famHx', 'Family history', ['Birth defects / chromosomal anomaly', 'Twinning', 'Diabetes', 'Hypertension', 'Asthma', 'Malignancy', 'Tuberculosis']),
    ]),
    personalHistory(), envSocio(),
    sec('gpe', 'General physical examination', [
      ch('consc', 'Patient is', ['Conscious, cooperative, well oriented to time, place and person', 'Drowsy', 'Disoriented']),
      ch('built', 'Built', ['Well built', 'Moderately built', 'Poorly built']), ch('nourish', 'Nourishment', ['Well nourished', 'Moderately nourished', 'Poorly nourished']),
      fd('signs', 'General signs', ['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'Pedal oedema', 'Facial puffiness', 'Lymphadenopathy', 'Varicose veins', 'Thyroid enlargement', 'Breast changes of pregnancy']),
      vitals(), txt('ht', 'Height (cm)', { half: true }), txt('wt', 'Weight (kg)', { half: true }),
    ]),
    sec('abd', 'Abdominal examination: inspection and palpation', [
      ch('shape', 'Shape', ['Uterus enlarged, ovoid', 'Uterus enlarged, transverse', 'Pendulous abdomen']),
      fd('inspF', 'Inspection', ['Umbilicus everted', 'Umbilicus flat', 'Striae gravidarum', 'Linea nigra', 'Scar of previous surgery', 'Hernial orifices normal', 'Dilated veins', 'Fetal movements visible']),
      txt('sfh', 'Symphysio-fundal height (cm) / corresponds to weeks', { half: true }), txt('girth', 'Abdominal girth (cm)', { half: true }),
      fd('palpF', 'Palpation', ['Tenderness', 'Local rise of temperature', 'Uterine contractions palpable', 'Uterine irritability']),
      ch('fundal', 'Fundal grip', ['Breech', 'Head', 'Empty']), ch('lat', 'Lateral grip: back', ['Back on right', 'Back on left', 'Back posterior', 'Not made out']),
      ch('pelvic1', 'First pelvic grip (Pawlik)', ['Head', 'Breech', 'Empty']), ch('pelvic2', 'Second pelvic grip', ['Head engaged', 'Head not engaged (floating)', 'Head partially engaged']),
      ch('lie', 'Lie / presentation', ['Longitudinal, cephalic', 'Longitudinal, breech', 'Transverse', 'Oblique']),
      ch('liquor', 'Liquor', ['Adequate', 'Reduced', 'Excess']),
      area('palpN', 'Notes (estimated fetal weight)'),
    ]),
    sec('ausc', 'Auscultation and systemic examination', [
      txt('fhs', 'Fetal heart sound (rate/min and location)'),
      ch('fhsR', 'FHS', ['Present, regular', 'Present, irregular', 'Absent']),
      area('cvs', 'CVS'), area('rs', 'RS'), area('cns', 'CNS'), area('pv', 'Per vaginal / per speculum (if done)'),
    ]),
    sec('closing', 'Summary and management', [
      area('summary', 'Summary of the case'), area('dx', 'Diagnosis (e.g. G2P1L1 at 38 weeks, cephalic, in labour)'), area('ix', 'Investigations'), area('rx', 'Management'),
    ]),
  ],
}

const ear: CaseDef = {
  id: 'ent-ear', subject: 'ent', title: 'ENT: Ear', blurb: 'Hearing loss, otorrhoea, tinnitus, vertigo, earache',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Hearing loss', 'Tinnitus', 'Dizziness / vertigo', 'Ear discharge', 'Earache', 'Itching in the ear', 'Deformity of the pinna', 'Swelling around the ear', 'Fullness in the ear'])]),
    sec('hpi', 'History of present illness', [
      sym('hearing', 'Hearing loss', ['onset', 'duration', 'progression', at('side', 'Side', ['Right', 'Left', 'Bilateral']), 'trauma', 'associated']),
      sym('pain', 'Earache', ['onset', 'duration', 'progression', 'side', 'nature', 'radiation', 'aggravating', 'relieving', at('ass', 'Associated', ['Throat pain', 'URTI symptoms', 'Discharge', 'Hearing loss'], true)]),
      sym('disch', 'Ear discharge', ['onset', 'duration', 'progression', 'side', at('c', 'Colour', ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged']), 'discharge', 'smell', 'amount', 'aggravating', 'relieving', at('ass', 'Associated', ['URTI symptoms', 'Hearing loss', 'Fever', 'Earache'], true)]),
      sym('tinn', 'Tinnitus', ['onset', 'duration', 'progression', 'side', at('type', 'Type', ['High pitched', 'Low pitched', 'Pulsatile', 'Continuous', 'Intermittent']), 'aggravating', 'relieving']),
      sym('vertigo', 'Vertigo / dizziness', ['onset', 'duration', 'episodes', at('ass', 'Associated', ['Nausea / vomiting', 'Hearing loss', 'Tinnitus', 'Positional', 'Fall'], true)]),
      fd('also', 'Also ask', ['Fever', 'Itching of the ear', 'Throat irritation', 'Swelling of the ear', 'Deformity', 'Throat pain', 'Dysphagia', 'Odynophagia', 'Hoarseness', 'Neck swelling', 'Nasal obstruction', 'Running nose', 'Nasal discharge', 'Cough', 'Watering of eyes', 'Noise exposure', 'Ototoxic drug intake', 'Facial weakness']),
      area('rxHx', 'Treatment history'),
    ]),
    ...entCommon(),
    sec('pinna', 'Ear examination: pinna and mastoid', [
      ch('side', 'Ear examined', ['Right', 'Left', 'Both']),
      fd('pinnaF', 'Pinna and surrounding area', ['Normal size, shape, position', 'Microtia / deformity', 'Redness', 'Swelling', 'Vesicles in concha / groove', 'Scar', 'Ulcer or neoplasm', 'Sinus / fistula', 'Preauricular sinus', 'Raised temperature', 'Thickened tissue', 'Fluctuation', 'Tenderness', 'Tragal tenderness', 'Pinna movement painful', 'Cauliflower ear']),
      fd('mastoidF', 'Mastoid', ['Swelling', 'Obliteration of the retroauricular groove', 'Fistula', 'Scar', 'Tenderness over antrum', 'Tenderness over tip', 'Postaural sinus']),
    ]),
    sec('eac', 'External auditory canal and tympanic membrane', [
      fd('eacF', 'External auditory canal', ['Normal calibre', 'Narrow meatus', 'Wax', 'Debris', 'Discharge', 'Polyp', 'Granulations', 'Exostosis', 'Furuncle', 'Foreign body', 'Meatal wall swelling', 'Sagging of posterosuperior wall', 'Neoplasm', 'Fungal debris']),
      ch('tmColour', 'Tympanic membrane colour', ['Pearly grey', 'Dull', 'Red', 'Yellow / amber', 'Blue (haemotympanum)']),
      ch('tmPos', 'Position', ['Normal', 'Retracted', 'Bulging']),
      fd('tmF', 'Tympanic membrane', ['Intact', 'Central perforation', 'Marginal perforation', 'Attic perforation', 'Total perforation', 'Cone of light present', 'Cone of light absent', 'Mobile on pneumatic otoscopy', 'Restricted mobility', 'Retraction pocket', 'Tympanosclerosis', 'Cholesteatoma flakes', 'Middle ear mucosa congested', 'Middle ear mucosa pale', 'Air-fluid level', 'Bubbles behind TM']),
      area('tmN', 'Perforation site, size, middle ear mucosa, ossicles, Eustachian tube'),
    ]),
    sec('func', 'Functional tests', [
      fd('voice', 'Voice tests', ['Conversational voice heard', 'Whisper heard at 6 m', 'Reduced hearing on right', 'Reduced hearing on left']),
      ch('rinneR', 'Rinne: right', ['Positive', 'Negative', 'False negative']), ch('rinneL', 'Rinne: left', ['Positive', 'Negative', 'False negative']),
      ch('weber', 'Weber', ['Central', 'Lateralised to right', 'Lateralised to left']),
      ch('abc', 'Absolute bone conduction', ['Normal', 'Reduced on right', 'Reduced on left', 'Reduced bilaterally']),
      ch('schw', 'Schwabach', ['Normal', 'Prolonged', 'Shortened']),
      ch('hl', 'Impression', ['Normal hearing', 'Conductive hearing loss', 'Sensorineural hearing loss', 'Mixed hearing loss']),
      fd('vest', 'Vestibular function', ['Spontaneous nystagmus', 'Fistula test positive', 'Dix-Hallpike positive', 'Romberg unsteady', 'Unterberger deviation', 'Gait abnormal']),
      fd('facial', 'Facial nerve', ['Normal', 'Facial palsy (LMN)', 'Facial palsy House-Brackmann grade']),
      area('funcN', 'Notes (audiometry, tympanometry if available)'),
    ]),
    sec('otherENT', 'Nose, throat and systemic examination', [
      area('nose', 'Nose'), area('throat', 'Throat'), area('neck', 'Neck'), area('cns', 'CNS'), area('cvs', 'CVS'), area('rs', 'RS'), area('abd', 'Abdomen'),
    ]),
    entClose(),
  ],
}

const nose: CaseDef = {
  id: 'ent-nose', subject: 'ent', title: 'ENT: Nose and sinuses', blurb: 'Nasal obstruction, discharge, epistaxis, sinusitis, polyps, DNS',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Nasal obstruction', 'Nasal discharge', 'Postnasal drip', 'Sneezing', 'Epistaxis', 'Headache / facial pain', 'Swelling or deformity of the nose', 'Disturbance of smell', 'Snoring', 'Change in voice'])]),
    sec('hpi', 'History of present illness', [
      sym('obst', 'Nasal obstruction', ['onset', 'duration', 'progression', 'side', 'aggravating', 'relieving', 'timing', 'associated']),
      sym('disch', 'Nasal discharge', ['onset', 'duration', 'progression', 'side', 'amount', at('c', 'Colour', ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged']), 'discharge', 'smell', 'timing', 'aggravating', 'relieving', 'associated']),
      sym('pnd', 'Postnasal drip', ['onset', 'duration', 'associated']),
      sym('sneeze', 'Sneezing', ['onset', 'duration', 'progression', at('freq', 'Frequency', ['Occasional', 'Paroxysmal', 'Episodes daily']), 'timing', 'associated']),
      sym('epistaxis', 'Epistaxis', ['onset', 'duration', 'side', 'episodes', 'amount', at('ass', 'Associated', ['Hypertension', 'Trauma', 'Systemic illness', 'Bleeding disorder', 'Anticoagulants', 'Nose picking'], true)]),
      sym('head', 'Headache / facial pain', ['onset', 'duration', at('site', 'Site', ['Frontal', 'Maxillary', 'Periorbital', 'Retro-orbital', 'Vertex']), 'nature', 'aggravating', 'relieving']),
      fd('also', 'Also ask', ['Swelling or deformity of the nose', 'Disturbance of smell', 'Snoring', 'Change in voice (hypo / hypernasality)', 'Dysphagia', 'Congenital anomalies', 'Throat pain', 'Throat irritation', 'Cough', 'Expectoration', 'Earache', 'Ear discharge', 'Hearing loss', 'Tinnitus', 'Trauma to nose', 'Allergy triggers (dust, pollen)']),
      area('rxHx', 'Treatment history'),
    ]),
    ...entCommon(),
    sec('extNose', 'External nose and vestibule', [
      fd('skin', 'Inspection / palpation', ['Skin normal', 'Scar', 'Sinus', 'Swelling or neoplasm', 'Deformity', 'Deviated nose', 'Hump', 'Depressed bridge', 'Saddle nose', 'Bifid / pointed tip', 'Destruction of nose', 'Raised temperature', 'Fixity of skin', 'Tenderness', 'Crepitus']),
      fd('vest', 'Vestibule', ['Furuncle', 'Fissure', 'Crusting', 'Dislocated caudal septum', 'Tumour', 'Normal']),
    ]),
    sec('rhino', 'Anterior and posterior rhinoscopy', [
      ch('side', 'Side', ['Right', 'Left', 'Both']),
      fd('rhinoF', 'Anterior rhinoscopy', ['Septum deviated to right', 'Septum deviated to left', 'Septal spur', 'Septal perforation', 'Septal haematoma', 'Mucosa congested', 'Mucosa pale and boggy', 'Mucosa hypertrophic', 'Inferior turbinate hypertrophy', 'Middle turbinate hypertrophy', 'Mucopus in middle meatus', 'Polyps', 'Mass', 'Crusts', 'Atrophic mucosa', 'Foreign body', 'Bleeding point (Little area)', 'Floor / roof normal']),
      fd('prF', 'Posterior rhinoscopy', ['Postnasal space clear', 'Adenoid hypertrophy', 'Nasopharyngeal mass', 'Choanal polyp', 'Mucopus on posterior end of turbinates']),
      fd('func', 'Functional', ['Nasal patency reduced on right', 'Nasal patency reduced on left', 'Cotton wool test positive', 'Spatula test abnormal', 'Anosmia', 'Hyposmia']),
      area('rhinoN', 'Details'),
    ]),
    sec('sinus', 'Paranasal sinuses', [
      fd('sinF', 'Tenderness / signs', ['Maxillary tenderness (canine fossa)', 'Frontal tenderness', 'Ethmoid tenderness (medial canthus)', 'Cheek swelling', 'Periorbital oedema', 'Proptosis', 'Diplopia', 'Palatal bulge', 'Alveolar tooth involvement', 'Pus in middle meatus', 'Pus in superior meatus', 'Transillumination reduced']),
      area('sinN', 'Notes'),
      area('otherENT', 'Ear, throat and systemic examination'),
    ]),
    entClose(),
  ],
}

const throat: CaseDef = {
  id: 'ent-throat', subject: 'ent', title: 'ENT: Throat and larynx', blurb: 'Sore throat, dysphagia, voice change, tonsils, neck masses',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Sore throat', 'Odynophagia', 'Dysphagia', 'Change in voice', 'Earache', 'Snoring', 'Halitosis', 'Hearing loss', 'Abnormal appearance of throat', 'Neck swelling', 'Stridor / breathing difficulty', 'Trismus'])]),
    sec('hpi', 'History of present illness', [
      sym('sore', 'Sore throat', ['onset', 'duration', 'progression', 'aggravating', 'relieving', 'associated']),
      sym('odyno', 'Odynophagia', ['onset', 'duration', 'progression', 'aggravating', 'relieving', 'associated']),
      sym('dysph', 'Dysphagia', ['onset', 'duration', 'progression', at('rel', 'To', ['Solids', 'Liquids', 'Both']), 'associated']),
      sym('voice', 'Change in voice', ['onset', 'duration', 'progression', at('type', 'Voice', ['Hoarse', 'Weak', 'Muffled (hot potato)', 'Breathy', 'Aphonia', 'Nasal']), 'associated']),
      sym('ear', 'Earache', ['onset', 'duration', 'progression', 'nature', 'aggravating', 'relieving', 'associated']),
      fd('also', 'Also ask', ['Pain', 'Disturbance in salivation', 'Disturbance of taste', 'Trismus', 'Lesion in oral cavity', 'Halitosis', 'Hearing loss', 'Ear discharge', 'Nasal obstruction', 'Nasal discharge', 'Swelling in the neck', 'Fever', 'URTI symptoms', 'Snoring / sleep apnoea', 'Haemoptysis', 'Weight loss', 'Smoking / tobacco / alcohol']),
      area('rxHx', 'Treatment history'),
    ]),
    ...entCommon(),
    sec('oral', 'Oral cavity', [
      fd('lips', 'Lips', ['Swelling', 'Vesicles', 'Ulcers', 'Crusts', 'Scars', 'Cleft lip']),
      fd('buccal', 'Buccal mucosa', ['Normal', 'Colour change', 'Leukoplakia', 'Erythroplakia', 'Submucous fibrosis (bands)', 'Ulcer', 'Candidiasis', 'Lichen planus']),
      fd('gums', 'Gums and teeth', ['Red swollen gums', 'Ulceration', 'Membrane over gums', 'Hyperplasia', 'Growth', 'Loose teeth', 'Dental caries', 'Malocclusion', 'Mandible fracture', 'TMJ abnormality']),
      fd('palate', 'Hard palate', ['Normal', 'Cleft palate', 'Oronasal fistula', 'High arched', 'Bulge', 'Torus palatinus', 'Mass or ulcer']),
      fd('tongue', 'Tongue', ['Normal', 'Large', 'Ulcer', 'Fissure', 'Inability to protrude', 'Bald tongue', 'Deviation on protrusion', 'White thick patch', 'Growth', 'Coated']),
      fd('floor', 'Floor of mouth and retromolar trigone', ['Normal', 'Scar', 'Ulcer', 'Swelling', 'Ranula', 'Sialolith', 'Retromolar trigone lesion']),
    ]),
    sec('oropharynx', 'Oropharynx', [
      ch('tons', 'Tonsils', ['Not enlarged', 'Grade I', 'Grade II', 'Grade III', 'Grade IV (kissing)', 'Absent (tonsillectomy)']),
      fd('tonF', 'Tonsils and pillars', ['Symmetrical', 'Asymmetrical', 'Congested', 'Crypts with debris', 'White or yellow spots', 'Membrane', 'Ulcer', 'Mass', 'Peritonsillar bulge', 'Uvula deviated', 'Pillars congested', 'Pillar ulcer', 'Soft palate oedema', 'Posterior pharyngeal wall granularity', 'Posterior pharyngeal wall bulge', 'Base of tongue lesion', 'Vallecula lesion']),
      area('oroN', 'Notes'),
    ]),
    sec('larynx', 'Indirect laryngoscopy and neck', [
      fd('laryF', 'Larynx / hypopharynx', ['Epiglottis normal', 'Epiglottis oedematous', 'Vocal cords mobile', 'Vocal cord palsy (right)', 'Vocal cord palsy (left)', 'Vocal cord nodules', 'Vocal cord polyp', 'Vocal cord growth', 'Vocal cord oedema', 'Arytenoids congested', 'Pyriform fossa pooling', 'Postcricoid growth', 'Subglottic narrowing']),
      fd('neckF', 'Neck', ['Lymph nodes palpable', 'Level II node', 'Level III node', 'Level V node', 'Nodes hard, fixed', 'Thyroid swelling', 'Laryngeal crepitus lost', 'Neck swelling']),
      area('neckN', 'Neck swelling or node description'),
      area('nose', 'Nose and nasopharynx'), area('earExam', 'Ear'), area('sys', 'Systemic (CNS, CVS, RS, abdomen)'),
    ]),
    entClose(),
  ],
}

export const OBG_CASES: CaseDef[] = [gyn, antenatal]
export const ENT_CASES: CaseDef[] = [ear, nose, throat]
