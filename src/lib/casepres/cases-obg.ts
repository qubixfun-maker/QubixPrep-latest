import type { CaseDef, Section, Field } from './types'
import { txt, area, ch, fd, cc, sym, sec, at, vitals, date } from './dsl'
import { pastHistory, familyHistory, personalHistory, envSocio } from './blocks'

/* The Obstetrics and Gynaecology case sheets follow the college proformas:
   "Gynecology" (OPD) and "Antenatal case record (IPD case record / ward work)". */

const SES = ['Upper', 'Upper middle', 'Lower middle', 'Upper lower', 'Lower']

/* ---------------- shared blocks ---------------- */

const partOP = (): Section =>
  sec('particulars', 'Patient particulars', [
    txt('name', 'Patient name', { half: true }), txt('age', 'Age', { half: true }),
    txt('address', 'Address', { half: true }), txt('occupation', 'Occupation', { half: true }),
    txt('opd', 'OPD No.', { half: true }), date('dor', 'Date of registration'),
    ch('ses', 'S.E. status (Kuppuswamy)', SES),
  ])

const partIP = (extra: Field[] = []): Section =>
  sec('particulars', 'Patient particulars', [
    txt('name', 'Patient name', { half: true }), txt('age', 'Age', { half: true }),
    txt('occupation', 'Occupation', { half: true }), txt('address', 'Address', { half: true }),
    txt('opd', 'OPD No.', { half: true }), txt('ipd', 'IPD No.', { half: true }),
    date('doa', 'Date of admission'), ...extra,
    ch('ses', 'S.E. status (Kuppuswamy)', SES),
  ])

const menstrualGyn = (): Section =>
  sec('menstrual', 'Menstrual history', [
    txt('menarche', 'Age at menarche', { half: true }), date('lmp', 'LMP'),
    txt('pastCycle', 'Past menstrual cycles (days of flow / cycle length, e.g. 4 days / 28 days)', { half: true }),
    ch('pastReg', 'Past cycles', ['Regular', 'Irregular']),
    ch('pastFlow', 'Past flow', ['Scanty', 'Normal', 'Excessive']),
    fd('mF', 'Associated with periods', ['Dysmenorrhoea', 'Passage of clots', 'Premenstrual symptoms', 'Intermenstrual bleeding']),
    txt('meno', 'Menopause (age), if attained', { half: true }),
  ])

const menstrualObs = (): Section =>
  sec('menstrual', 'Menstrual history and dates', [
    txt('menarche', 'Menarche (age)', { half: true }), date('lmp', 'LMP'),
    txt('pastCycle', 'Past menstrual cycles (days of flow / cycle length)', { half: true }),
    ch('pastReg', 'Past cycles', ['Regular', 'Irregular']),
    date('edd', 'EDD (LMP + 9 months + 7 days, Naegele rule)'), date('usgEdd', 'USG EDD'),
    date('corrEdd', 'Corrected EDD'),
    txt('ga', 'Estimated gestational age (weeks + days)', { half: true }), txt('gaUsg', 'GA by USG (weeks + days)', { half: true }),
  ], 'Naegele rule: add 7 days to the LMP date, subtract 3 months (or add 9 months). It assumes a regular 28-day cycle.')

const obstGyn = (): Section =>
  sec('obst', 'Obstetric history', [
    txt('obsP', 'P (para)', { half: true }), txt('obsL', 'L (living)', { half: true }), txt('obsA', 'A (abortions)', { half: true }),
    txt('obsD', 'D (deaths)', { half: true }), txt('obsE', 'E (ectopic)', { half: true }),
    txt('ld', 'LD (date and mode of last delivery)', { half: true }),
    ch('steril', 'Sterilization', ['Not done', 'Tubectomy done', 'Husband has had vasectomy']),
    ch('contra', 'Contraception used', ['None', 'Condoms', 'OCP', 'IUCD', 'Injectable', 'Other']),
    area('children', 'Children: number, sex, age, mode of delivery, any complication'),
  ], 'Leave blank what does not apply, for example for a nulliparous woman.')

const obstANC = (): Section =>
  sec('obst', 'Obstetric history and score', [
    txt('obsG', 'Gravida', { half: true }), txt('obsP', 'Para', { half: true }), txt('obsL', 'Live', { half: true }),
    txt('obsA', 'Abortion', { half: true }), txt('obsD', 'Death', { half: true }), txt('obsE', 'Ectopic', { half: true }),
  ])

const slot = (n: number): Field[] => [
  txt(`pg${n}ant`, `Pregnancy ${n}: antenatal`),
  txt(`pg${n}int`, `Pregnancy ${n}: intrapartum (mode, place, indication, outcome)`),
  txt(`pg${n}pp`, `Pregnancy ${n}: postpartum`),
  txt(`pg${n}age`, `Pregnancy ${n}: age of the child`, { half: true }), txt(`pg${n}sex`, `Pregnancy ${n}: sex`, { half: true }),
]
const pregTable = (): Section =>
  sec('pregTable', 'Previous pregnancies (table)', [...slot(1), ...slot(2), ...slot(3)],
    'One block per earlier pregnancy, as in the proforma table (antenatal, intrapartum, postpartum, age, sex). Leave blank for a primigravida.')

const gpeObg = (extraSigns: string[] = []): Section =>
  sec('gpe', 'General physical examination', [
    ch('built', 'Built', ['Well built', 'Moderately built', 'Poorly built', 'Obese']),
    ch('nourish', 'Nourishment', ['Well nourished', 'Moderately nourished', 'Poorly nourished']),
    fd('signs', 'General signs', ['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'Pedal oedema', 'Facial puffiness', 'Generalised lymphadenopathy', 'Thyroid enlargement', 'Koilonychia', 'Spinal deformity', ...extraSigns]),
    txt('hb', 'Haemoglobin (g/dL), if known', { half: true }),
    area('gpeNotes', 'Details of any positive sign (grade of pallor, site of oedema)'),
    vitals(),
    fd('breast', 'Breasts (right and left)', ['Normal on both sides', 'Lump', 'Nipple retraction', 'Nipple discharge', 'Galactorrhoea', 'Tenderness', 'Axillary nodes', 'Changes of pregnancy']),
  ], 'Height and weight give the BMI automatically. Tap a sign once for PRESENT, again for ABSENT.')

const systemic = (): Section =>
  sec('systemic', 'Systemic examination', [
    fd('sysF', 'Respiratory and cardiovascular', ['RS: bilateral normal vesicular breath sounds heard', 'CVS: S1 and S2 heard, no murmurs']),
    area('sysN', 'Abnormal findings, or CNS if relevant'),
  ])

const abdomenGyn = (): Section =>
  sec('abdomen', 'Per abdomen', [
    ch('shape', 'Shape', ['Flat', 'Scaphoid', 'Uniformly distended', 'Distended with lower abdominal swelling', 'Pendulous']),
    fd('inspF', 'Inspection', ['Umbilicus central', 'Umbilicus inverted', 'Umbilicus everted', 'Symmetrical', 'Moves with respiration', 'Striae gravidarum', 'Scar (tubectomy / LSCS / other)', 'Sinus', 'Dilated veins', 'Visible mass', 'Visible peristalsis']),
    fd('palpSup', 'Palpation: superficial', ['Tenderness', 'Local rise of temperature', 'Guarding', 'Rigidity']),
    fd('palpDeep', 'Palpation: deep', ['Mass palpable', 'Lump arising from pelvis', 'Can get below the swelling', 'Hepatomegaly', 'Splenomegaly', 'Renal angle tenderness', 'Free fluid']),
    area('lumpN', 'Mass: site, size (cm or weeks), shape, surface, margins, consistency, mobility, tenderness'),
    fd('percF', 'Percussion', ['Tympanic note', 'Dull note over the swelling', 'Shifting dullness']),
    fd('auscF', 'Auscultation', ['Normal bowel sounds', 'Sluggish bowel sounds', 'Absent bowel sounds', 'Venous hum', 'Arterial bruit']),
  ])

const vulva = (): Section =>
  sec('vulva', 'Local examination: vulva', [
    fd('vulvaF', 'Vulva', ['Appears healthy', 'Ulceration', 'Swelling', 'Lesions', 'Abnormal discharge', 'Warts', 'Bartholin cyst', 'Leucoplakia', 'Prolapse visible on straining']),
    area('vulvaN', 'Details'),
  ])

const perSpec = (): Section =>
  sec('perSpec', 'Per speculum examination', [
    fd('vagina', 'Vagina', ['Healthy vaginal walls', 'Abnormal discharge', 'Growth', 'Ulcer', 'Septum']),
    fd('cervix', 'Cervix', ['Healthy', 'Erosion / ectropion', 'Cervical polyp', 'Cervical growth', 'Nabothian cysts', 'Cervix bleeds on touch', 'Abnormal discharge', 'Cervicitis']),
    fd('fornF', 'Fornices', ['Healthy', 'Bulging', 'Obliterated']),
    fd('pelvFloor', 'On straining and coughing', ['Cystocele', 'Rectocele', 'Enterocele', 'Uterine prolapse', 'Stress incontinence on cough']),
  ])

const perVaginal = (): Section =>
  sec('pv', 'Per vaginal (bimanual) examination', [
    fd('pvCervix', 'Cervix', ['Healthy', 'Cervix hard', 'Cervix bleeds on touch', 'Cervical motion tenderness', 'Os open', 'Os closed']),
    ch('uterusPos', 'Uterus: position', ['Anteverted', 'Retroverted', 'Axial', 'Not made out']),
    txt('uterusSize', 'Uterus: size (normal / bulky / enlarged to ... weeks)', { half: true }),
    fd('uterusF', 'Uterus: other features', ['Uterus bulky', 'Uterus mobile', 'Uterus fixed', 'Uterine tenderness', 'Uterus firm', 'Uterus soft', 'Uterus globular', 'Uterus irregular surface']),
    fd('fornPV', 'Fornices', ['Fornices free', 'Fornix fullness', 'Fornix tenderness', 'Adnexal mass (right)', 'Adnexal mass (left)', 'Pouch of Douglas fullness', 'Nodularity']),
    area('pvN', 'Details (size of uterus in weeks, mass description, mobility)'),
  ])

const closingObg = (o: { dx: string; rx: string; extra?: Field[] }): Section =>
  sec('closing', 'Summary, diagnosis and plan', [
    area('summary', 'Summary of the case'),
    area('provDx', o.dx),
    area('ddx', 'Differential diagnosis'),
    ...(o.extra || []),
    area('ix', 'Investigations advised'),
    area('rx', o.rx),
  ])

const symptoms = {
  pain: (label = 'Pain abdomen') => sym('pain', label, ['duration', 'onset', 'progression', at('site', 'Site', ['Hypogastrium', 'Right iliac fossa', 'Left iliac fossa', 'Lower back', 'Generalised', 'Epigastrium']), 'nature', 'radiation', 'aggravating', 'relieving', at('rel', 'Relation to cycle', ['Premenstrual', 'During periods', 'Mid-cycle', 'Unrelated'])]),
  fm: () => sym('fm', 'Fetal movements', ['duration', at('s', 'Movements', ['Well perceived', 'Decreased', 'Absent'])]),
  leak: () => sym('leak', 'Leaking per vagina', ['duration', 'amount', at('c', 'Colour', ['Clear', 'Meconium-stained', 'Blood-stained'])]),
  bleedPv: () => sym('bleed', 'Bleeding per vagina', ['duration', 'onset', 'amount', at('ass', 'Associated', ['Painful', 'Painless', 'Passage of clots', 'Passage of tissue', 'Show', 'After coitus'], true)]),
  pih: () => sym('pih', 'Headache / blurring of vision / swelling', ['duration', at('ass', 'Symptoms', ['Headache', 'Blurring of vision', 'Epigastric pain', 'Pedal oedema (not relieved by rest)', 'Facial puffiness', 'Convulsions'], true)]),
}

/* ---------------- shared obstetric examination ---------------- */

const paInspection = (): Section =>
  sec('pa', 'Per abdomen: inspection', [
    ch('shape', 'Shape', ['Distended, ovoid (longitudinal lie)', 'Distended, broader transversely', 'Pendulous abdomen', 'Not distended']),
    fd('inspF', 'Inspection', ['Linea nigra', 'Striae gravidarum', 'Umbilicus everted', 'Umbilicus flat', 'Umbilicus centrally placed', 'Scar of previous surgery', 'Dilated veins', 'Fetal movements visible', 'Hernial orifices normal']),
    fd('auscB', 'Bowel sounds', ['Normal bowel sounds heard']),
  ])

const obsPalpation = (): Section =>
  sec('obsExam', 'Obstetric examination: palpation', [
    txt('uh', 'Uterine height in weeks', { half: true }), txt('sfh', 'SFH (cm)', { half: true }), txt('ag', 'AG (abdominal girth, cm)', { half: true }),
    fd('palpF', 'Palpation', ['Tenderness', 'Uterine contractions palpable', 'Uterine irritability', 'Fetal movements felt', 'Multiple fetal parts felt']),
    ch('fundal', 'Fundal grip', ['Breech (broad, soft, irregular)', 'Head (round, hard, ballotable)', 'Empty']),
    ch('lat', 'Lateral grips', ['Smooth, hard, curved on the left (back); knobby, irregular on the right (limbs)', 'Smooth, hard, curved on the right (back); knobby, irregular on the left (limbs)', 'Back posterior: small parts felt in front', 'Not made out']),
    ch('pelvic1', '1st pelvic grip (Pawlik)', ['Head', 'Breech', 'Empty']),
    ch('pelvic2', '2nd pelvic grip', ['Fingers converge', 'Fingers diverge', 'Parallel']),
    ch('engage', 'Engagement of the head', ['Engaged', 'Not engaged (floating)', 'Partially engaged', 'Ballotable']),
    ch('lie', 'Lie', ['Longitudinal', 'Transverse', 'Oblique']),
    ch('pres', 'Presentation', ['Cephalic', 'Breech', 'Shoulder']),
    ch('liquor', 'Liquor (clinical)', ['Adequate', 'Reduced', 'Excess']),
  ], 'SFH in cm roughly equals the weeks of gestation between 20 and 36 weeks. Converging fingers on the 2nd pelvic grip mean the head is not engaged.')

const obsAuscultation = (): Section =>
  sec('ausc', 'Auscultation and estimated fetal weight', [
    txt('fhs', 'FHS (rate per minute)', { half: true }), ch('fhsR', 'FHS rhythm', ['Regular', 'Irregular', 'Not heard']),
    txt('fhsLoc', 'FHS best heard at (location)', { half: true }),
    txt('efw', "Estimated fetal weight (g), Johnson's formula", { half: true, placeholder: 'e.g. (32 - 12) x 155 = 3100 g' }),
  ], "Johnson's formula: EFW (g) = (SFH in cm minus n) x 155. n = 12 if the head is not engaged, 11 if engaged.")

/* ====================================================================
   OBSTETRICS AND GYNAECOLOGY: built on the comprehensive
   clinical case proforma (Gynaecology, Antenatal, Post-natal) and on the
   topic case presentations in the shared OBG folder.
   ==================================================================== */

const partWA = (kind: 'gyn' | 'anc' | 'pnc'): Section =>
  sec('particulars', 'Patient particulars', [
    txt('name', 'Name', { half: true }), txt('age', 'Age', { half: true }),
    txt('education', 'Education', { half: true }), txt('occupation', 'Occupation', { half: true }),
    txt('address', 'Address', { half: true }),
    ...(kind === 'pnc' ? [
      txt('hname', "Husband's name", { half: true }), txt('hage', "Husband's age", { half: true }),
      txt('hocc', "Husband's education and occupation"),
    ] : []),
    date('doa', 'Date of admission'), date('doe', 'Date of examination'),
    ...(kind === 'pnc' ? [date('dod', 'Date of delivery'), txt('pnd', 'Postnatal day / post-operative day', { half: true })] : []),
    txt('parity', 'Parity index (G P L A)', { half: true }), txt('bloodGrp', 'Blood group and Rh', { half: true }),
  ], kind === 'anc' ? 'Naegele rule for EDD: LMP + 7 days, minus 3 months. BMI is calculated from height and weight in the vital signs.' : undefined)

const maritalWA = (): Section =>
  sec('marital', 'Marital history', [
    txt('married', 'Married since (years)', { half: true }),
    ch('consang', 'Marriage', ['Non-consanguineous', 'Consanguineous']),
    txt('hOccup', "Husband's occupation", { half: true }),
    area('sexH', 'Sexual history (especially in infertility cases)'),
  ])

const persWA = (): Section =>
  sec('persWA', 'Personal history: other items', [
    fd('persF', 'Tap present or absent', ['Vaccination history complete', 'High-risk behaviour', 'Allergy to any drug', 'Allergy to any food', 'Substance abuse']),
  ])

const histSummary = (): Section =>
  sec('histSumm', 'Summary after history', [
    area('histS', 'Summary after history', 'Age, parity, complaint with duration, the key positives and negatives, relevant past and family history'),
  ])

const envWA = (): Section => envSocio()

const abdomenExtras = (): Section =>
  sec('abdExtra', 'Abdomen: measurements and other findings', [
    txt('girth', 'Abdominal girth (cm)', { half: true }), txt('xu', 'Xiphisternum to umbilicus distance (cm)', { half: true }),
    txt('up', 'Umbilicus to pubic symphysis distance (cm)', { half: true }), txt('weeks', 'Lump corresponds to how many weeks', { half: true }),
    fd('extraF', 'Percussion and palpation', ['Tidal percussion positive', 'Fluid thrill positive', 'Cardiac dullness normal', 'Liver dullness normal', 'Can get above the swelling', 'Can get below the swelling', 'Renal angle tenderness', 'Palpable spleen', 'Palpable liver']),
  ])

const WA_CC = [
  'Irregular cycle', 'Mid-cycle bleeding / spotting', 'Painful menstruation', 'Heavy menstrual flow', 'Scanty menstrual flow', 'Passage of clots',
  'Increased duration of menstrual flow', 'Decreased duration of flow', 'Amenorrhoea', 'Postmenopausal bleeding', 'Postcoital bleeding', 'Pain abdomen',
  'Palpable mass per abdomen', 'Mass coming out of vagina / prolapse', 'Excessive white discharge', 'Foul-smelling discharge', 'Pruritus vulvae',
  'Lower backache', 'Fatigue', 'Dizziness', 'Painful coitus', 'Inability to conceive', 'Unusual weight gain', 'Symptoms of bladder dysfunction', 'Symptoms of bowel dysfunction',
]

const WA_ANC_CC = [
  'Came for safe confinement', 'Amenorrhoea', 'Pain abdomen', 'Leaking per vagina', 'Bleeding per vagina', 'Excessive vomiting', 'Fever',
  'Decreased fetal movements', 'Diagnosed to have low haemoglobin', 'Diagnosed to have raised blood sugar', 'Raised BP recording',
  'Headache', 'Blurring of vision', 'Swelling of both lower limbs', 'Breathlessness', 'Routine antenatal check-up',
]

const ancHistories = (): Section[] => [
  sec('t1', 'History of present pregnancy: 1st trimester', [
    txt('amenDays', 'Days of amenorrhoea when pregnancy was confirmed', { half: true }),
    ch('upt', 'Urine pregnancy test', ['Done: positive', 'Not done']),
    ch('conc', 'Conception', ['Spontaneous', 'With fertility treatment']),
    fd('t1F', 'First trimester', ['Dating scan done', 'Folic acid taken', 'Excessive vomiting', 'Fatigue', 'Fever with rash', 'Palpable swelling behind the ear', 'Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Burning micturition', 'Increased frequency of micturition', 'Exposure to radiation', 'Regular drug intake', 'Regular antenatal visits']),
    txt('wt1', 'Weight gain in 1st trimester (kg)', { half: true }), area('t1N', 'Details, scan findings'),
  ]),
  sec('t2', '2nd trimester', [
    txt('quick', 'Quickening felt at (month / weeks)', { half: true }), txt('ancV', 'ANC visits (number, place, booked)', { half: true }),
    ch('td', 'Td / TT vaccine', ['1 dose', '2 doses', 'Booster', 'Not taken']),
    fd('t2F', 'Second trimester', ['Iron and calcium tablets taken', 'Anomaly scan done', 'OGTT / DIPSI done', 'Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Headache', 'Dizziness', 'Blurring of vision', 'Pedal oedema (not relieved by rest)', 'Excessive vomiting', 'Regular drug intake', 'Regular antenatal visits']),
    txt('wt2', 'Weight gain in 2nd trimester (kg)', { half: true }), area('t2N', 'Details, scan and investigation findings'),
  ]),
  sec('t3', '3rd trimester', [
    ch('fm3', 'Fetal movements', ['Well perceived', 'Decreased', 'Absent']),
    fd('t3F', 'Third trimester', ['Iron and calcium tablets taken', 'Growth scan done', 'Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Headache', 'Dizziness', 'Blurring of vision', 'Pedal oedema (not relieved by rest)', 'Burning micturition', 'Increased frequency of micturition', 'Fever', 'Regular antenatal visits']),
    txt('wt3', 'Weight gain in 3rd trimester (kg)', { half: true }), area('t3N', 'Details, scan findings'),
  ]),
]

const ancInvest = (): Section =>
  sec('ixTable', 'Investigations (table)', [
    txt('ixCbc', 'CBC (Hb, platelets)', { half: true }), txt('ixGrp', 'Blood group and Rh', { half: true }),
    txt('ixLft', 'LFT, RFT', { half: true }), txt('ixInf', 'VDRL, HBsAg, HIV', { half: true }),
    txt('ixThy', 'Thyroid profile (TSH)', { half: true }), txt('ixOgtt', 'OGTT / DIPSI (GA, result)', { half: true }),
    txt('ixDate', 'Dating scan (10 to 13 weeks)', { half: true }), txt('ixAnom', 'Anomaly scan (18 to 20 weeks)', { half: true }),
    txt('ixGrow', 'Growth scan + Doppler (GA, result)', { half: true }), txt('ixUrine', 'Urine routine and culture', { half: true }),
    area('ixOther', 'Other investigations, with date, GA and interpretation'),
  ])

/* ---------------- 1. Gynaecology ---------------- */

const gyn: CaseDef = {
  id: 'obg-gyn', subject: 'obg', title: 'Gynaecology case',
  blurb: 'Complete gynaecology case: complaints, menstrual, marital, obstetric, personal and environmental history, abdomen, speculum and bimanual examination',
  sections: [
    partWA('gyn'),
    sec('complaints', 'Chief presenting complaints (in chronological order)', [cc('cc', 'Select the complaints and give the duration', WA_CC)]),
    sec('hpi', 'History of presenting illness', [
      sym('hmb', 'Heavy menstrual flow', ['duration', 'onset', 'progression', at('pads', 'Pads used per day', ['1 to 2', '3 to 4', '5 to 6', '7 to 8', 'More than 8', 'Soaking through at night']), at('clots', 'Clots', ['Passage of clots', 'No clots'])]),
      sym('cycle', 'Irregular cycle', ['duration', 'onset', 'progression', at('type', 'Pattern', ['Irregular cycles', 'Polymenorrhoea', 'Oligomenorrhoea', 'Hypomenorrhoea', 'Metrorrhagia', 'Intermenstrual bleeding', 'Postcoital bleeding'], true)]),
      symptoms.pain(),
      sym('urine', 'Symptoms of bladder dysfunction', ['duration', 'onset', 'progression', at('ass', 'Symptoms', ['Increased frequency', 'Urgency', 'Difficulty in initiating micturition', 'Stress incontinence', 'Urge incontinence', 'Burning micturition', 'Haematuria', 'Retention'], true)]),
      sym('mass', 'Palpable mass per abdomen / mass coming out of vagina', ['duration', 'onset', 'progression', at('type', 'Features', ['Lump in the abdomen', 'Mass coming out of vagina', 'Worse on standing or straining', 'Reduces on lying down'], true), 'aggravating']),
      sym('disch', 'Vaginal discharge', ['duration', 'amount', at('c', 'Colour', ['White', 'Yellow', 'Green', 'Blood-stained', 'Watery']), 'smell', at('ass', 'Associated', ['Pruritus', 'Dyspareunia', 'Burning micturition', 'Fever', 'Lower abdominal pain'], true)]),
      sym('infert', 'Inability to conceive', ['duration', at('type', 'Pattern', ['Primary', 'Secondary'])]),
      fd('neg', 'Also ask: tap present or absent', ['Mid-cycle bleeding / spotting', 'Scanty menstrual flow', 'Decreased duration of flow', 'Increased duration of menstrual flow', 'Passage of clots', 'Painful menstruation', 'Painful coitus', 'Excessive white discharge', 'Foul-smelling discharge', 'Pruritus vulvae', 'Lower backache', 'Fatigue', 'Dizziness', 'Unusual weight gain', 'Symptoms of bowel dysfunction', 'Diagnosed congenital anomaly', 'Fever', 'Loss of weight', 'Hirsutism', 'Galactorrhoea']),
      area('rxHx', 'Treatment taken so far, and investigations already done'),
    ], 'Describe each complaint by onset, duration, progression, aggravating and relieving factors and associated symptoms.'),
    pastHistory(['Congenital / chromosomal anomaly', 'Previous gynaecological surgery (D&C, myomectomy)', 'Tubectomy']),
    menstrualGyn(),
    maritalWA(),
    obstGyn(),
    pregTable(),
    familyHistory(['Carcinoma of breast, ovary, endometrium or colon']),
    personalHistory(),
    persWA(),
    envWA(),
    histSummary(),
    gpeObg(),
    abdomenGyn(),
    abdomenExtras(),
    vulva(),
    perSpec(),
    perVaginal(),
    systemic(),
    closingObg({ dx: 'Provisional diagnosis', rx: 'Management: investigations and treatment' }),
  ],
}


/* College record book extras for the antenatal case */
const ancCollege = (): Section[] => [
  sec('diet', 'Dietetic history', [
    ch('dietType', 'Diet', ['Vegetarian', 'Non-vegetarian', 'Mixed']),
    area('dietD', 'Details of diet: morning, lunch, evening, dinner'),
    fd('dietAd', 'Whether adequate in', ['Calories adequate', 'Proteins adequate', 'Carbohydrates adequate', 'Fats adequate', 'Vitamins and minerals adequate', 'Diet inadequate overall']),
  ]),
  sec('riskF', 'Risk factors identified', [
    fd('riskFl', 'Tap present or absent', ['Age below 18 or above 35', 'Short stature (below 145 cm)', 'Grand multipara', 'Previous caesarean section', 'Previous stillbirth or neonatal death', 'Bad obstetric history', 'Anaemia', 'Hypertension', 'Diabetes', 'Heart disease', 'Rh-negative blood group', 'Twin pregnancy', 'Malpresentation', 'Antepartum haemorrhage', 'Oligohydramnios / polyhydramnios', 'Fetal growth restriction', 'Post-dated pregnancy', 'Infection (HIV, HBsAg, VDRL positive)']),
    area('riskN', 'Other risk factors'),
  ]),
  sec('advice', 'Advice given to the patient', [
    txt('revisit', 'Revisit at (weeks)', { half: true }), txt('dietAdv', 'Diet advised', { half: true }),
    fd('adviceF', 'Tap if given', ['Tetanus toxoid 1st dose', 'Tetanus toxoid 2nd dose', 'Iron and folic acid', 'Calcium', 'Fetal kick count', 'Danger signs explained', 'Breast feeding counselling', 'Birth preparedness', 'Contraception counselling', 'Institutional delivery advised']),
    area('medicine', 'Medicines prescribed'),
  ]),
  sec('plan', 'Plan of delivery', [
    ch('planMode', 'Plan', ['Spontaneous labour', 'Induction of labour', 'Elective caesarean section', 'Trial of labour', 'Undecided']),
    txt('planWhen', 'When', { half: true }), area('planN', 'Reason and details'),
  ]),
]

/* ---------------- 2. Obstetrics: antenatal case ---------------- */

const anc: CaseDef = {
  id: 'obg-anc', subject: 'obg', title: 'Obstetrics: antenatal case',
  blurb: 'Complete antenatal case: trimester-wise history, past obstetric table, Leopold grips, SFH, FHS, investigations and management',
  sections: [
    partWA('anc'),
    sec('complaints', 'Chief / presenting complaints', [
      txt('amen', 'Amenorrhoea (weeks / months)', { half: true }),
      cc('cc', 'Select the complaints and give the duration', WA_ANC_CC),
    ]),
    sec('hpi', 'History of presenting complaints / illness', [
      symptoms.pain('Pain abdomen / labour pain'), symptoms.bleedPv(), symptoms.leak(), symptoms.fm(), symptoms.pih(),
      sym('oedema', 'Swelling of lower limbs', ['duration', 'onset', 'progression', at('side', 'Side', ['Both lower limbs', 'Right', 'Left']), 'aggravating', 'relieving']),
      fd('neg', 'Also ask: tap present or absent', ['Excessive vomiting', 'Fever', 'Fatigue', 'Breathlessness', 'Palpitations', 'Burning micturition', 'Increased thirst and hunger', 'Itching all over', 'Reduced urine output', 'Passage of worms in stool']),
    ], 'Describe the complaints by onset, duration, progression, aggravating and relieving factors and associated symptoms.'),
    ...ancHistories(),
    pregTable(),
    menstrualObs(),
    obstANC(),
    pastHistory(['Blood transfusion', 'Rh incompatibility']),
    maritalWA(),
    familyHistory(['Twins in the family', 'Congenital anomaly / chromosomal disorder']),
    personalHistory(),
    persWA(),
    sec('contra', 'Contraceptive history', [ch('contraH', 'Contraceptive use', ['No significant history', 'OCP', 'Condoms', 'IUCD', 'Injectable', 'Other']), area('contraN', 'Details')]),
    envWA(),
    histSummary(),
    gpeObg(['Varicose veins']),
    systemic(),
    paInspection(),
    obsPalpation(),
    obsAuscultation(),
    ancInvest(),
    ...ancCollege(),
    closingObg({ dx: 'Diagnosis (e.g. G2 P1 L1 at 38 weeks, singleton live pregnancy, longitudinal lie, cephalic presentation, not in labour)', rx: 'Management' }),
  ],
}


/* ---------------- Obstetrics: labour case (college record format) ---------------- */

const labour: CaseDef = {
  id: 'obg-labour', subject: 'obg', title: 'Obstetrics: labour case (college record format)',
  blurb: 'Admission in labour: booking, per vaginal findings, stages of labour, partogram, delivery details, baby and third stage',
  sections: [
    partWA('anc'),
    sec('admit', 'Admission details', [
      ch('inLabRoom', 'Admission in labour room', ['Yes', 'No']), ch('booked', 'Booked or emergency', ['Booked', 'Emergency']),
      txt('ancVisits', 'Number of antenatal visits', { half: true }), date('lastAnc', 'Last antenatal visit on'),
      ch('referred', 'Referred', ['No', 'Yes']), txt('refReason', 'Reason for referral'),
      txt('admTime', 'Date and time of admission in labour', { half: true }),
    ]),
    sec('complaints', 'Presenting complaints', [
      txt('amen', 'H/O amenorrhoea (weeks)', { half: true }),
      cc('cc', 'Select the complaints and give the duration', ['Labour pains', 'Show (blood-stained mucus per vagina)', 'Leaking per vagina', 'Bleeding per vagina', 'Decreased fetal movements', 'Pain abdomen', 'Headache / blurring of vision', 'Came for safe confinement', 'Post-dated pregnancy']),
    ]),
    sec('hpi', 'History of present illness', [
      sym('lp', 'Labour pains', ['duration', 'onset', 'progression', at('freq', 'Frequency', ['Every 10 minutes', 'Every 5 minutes', 'Every 2 to 3 minutes', 'Irregular']), at('dur2', 'Each pain lasts', ['Less than 20 seconds', '20 to 40 seconds', 'More than 40 seconds']), 'radiation']),
      sym('show', 'Show', ['duration', 'amount']), symptoms.leak(), symptoms.bleedPv(), symptoms.fm(), symptoms.pih(),
      fd('neg', 'Also ask: tap present or absent', ['Fever', 'Pain abdomen between contractions', 'Burning micturition', 'Vomiting', 'Last oral intake recorded']),
    ]),
    sec('ancSum', 'Antenatal summary', [
      ch('book', 'Booking', ['Booked, regular ANC', 'Booked, irregular ANC', 'Unbooked']),
      fd('ancF', 'Antenatal care', ['Folic acid taken', 'IFA and calcium taken', 'Td vaccine completed', 'Dating scan done', 'Anomaly scan done', 'Growth scan done', 'OGTT done', 'Hb checked', 'Blood group and Rh known', 'HIV, VDRL, HBsAg done']),
      area('ancProb', 'Antenatal complications (hypertension, GDM, anaemia, bleeding, others)'),
    ]),
    menstrualObs(),
    obstANC(),
    pregTable(),
    pastHistory(['Previous caesarean section', 'Blood transfusion']),
    familyHistory(['Twins']),
    personalHistory(),
    maritalWA(),
    ancInvest(),
    gpeObg(['Varicose veins']),
    systemic(),
    paInspection(),
    obsPalpation(),
    sec('contr', 'Uterine contractions', [
      txt('cFreq', 'Number of contractions in 10 minutes', { half: true }), txt('cDur', 'Duration of each contraction (seconds)', { half: true }),
      ch('cInt', 'Intensity', ['Mild', 'Moderate', 'Strong']), ch('cRelax', 'Uterus between contractions', ['Relaxes fully', 'Remains tense or tender']),
    ]),
    obsAuscultation(),
    sec('pvLab', 'Per vaginal examination (in labour)', [
      txt('pvTime', 'Time of examination', { half: true }),
      ch('dil', 'Cervical dilatation (cm)', ['0 to 1', '2', '3', '4', '5', '6', '7', '8', '9', '10 (fully dilated)']),
      ch('eff', 'Effacement', ['0 to 25%', '50%', '75%', 'Fully effaced']),
      ch('station', 'Station of the presenting part', ['-3', '-2', '-1', '0 (at ischial spines)', '+1', '+2', '+3']),
      ch('memb', 'Membranes', ['Intact', 'Ruptured']),
      ch('liquorC', 'Liquor', ['Clear', 'Meconium-stained', 'Blood-stained', 'Not draining']),
      ch('posn', 'Position (denominator)', ['Left occipito-anterior (LOA)', 'Right occipito-anterior (ROA)', 'Occipito-posterior', 'Occipito-transverse', 'Not made out']),
      fd('pvF', 'Findings', ['Caput', 'Moulding', 'Cord felt', 'Show on glove', 'Bleeding on glove', 'Cervix thick', 'Cervix well applied to the head']),
      fd('pelvis', 'Clinical pelvic assessment', ['Sacral promontory not reached', 'Sacral curve adequate', 'Ischial spines not prominent', 'Subpubic angle adequate', 'Pelvis adequate']),
      area('partograph', 'Partogram notes (alert and action lines, progress)'),
    ]),
    sec('stages', 'Stages of labour', [
      txt('s1start', 'Onset of true labour pains (date, time)', { half: true }), txt('s1dur', 'Duration of first stage (hours)', { half: true }),
      ch('augm', 'Augmentation of labour', ['None', 'Artificial rupture of membranes', 'Oxytocin infusion', 'Both']),
      ch('induc', 'Induction of labour', ['Not done', 'Misoprostol', 'Dinoprostone gel', 'Foley catheter', 'Oxytocin']),
      txt('s2dur', 'Duration of second stage (minutes)', { half: true }), txt('s3dur', 'Duration of third stage (minutes)', { half: true }),
      ch('analg', 'Analgesia', ['None', 'Pudendal block', 'Epidural', 'Parenteral analgesic']),
      area('laborN', 'Progress of labour and any complication'),
    ]),
    sec('delivery', 'Delivery details', [
      txt('delTime', 'Date and time of delivery', { half: true }),
      ch('mode', 'Mode of delivery', ['Spontaneous vaginal (vertex)', 'Assisted breech', 'Forceps', 'Vacuum', 'Emergency caesarean', 'Elective caesarean']),
      ch('epis', 'Episiotomy', ['Not given', 'Mediolateral', 'Median']), ch('tear', 'Perineal tear', ['None', 'First degree', 'Second degree', 'Third or fourth degree']),
      fd('cord', 'Cord', ['Cord round the neck', 'Early cord clamping', 'Delayed cord clamping']),
      area('delN', 'Indication, if instrumental or caesarean'),
    ]),
    sec('baby', 'Baby details', [
      ch('sex', 'Sex', ['Male', 'Female']), txt('bwt', 'Birth weight (kg)', { half: true }),
      txt('apgar1', 'Apgar at 1 minute', { half: true }), txt('apgar5', 'Apgar at 5 minutes', { half: true }),
      fd('babyF', 'Baby', ['Cried immediately', 'Resuscitation needed', 'Congenital anomaly seen', 'Skin-to-skin contact done', 'Breast feeding initiated within 1 hour', 'Vitamin K given', 'BCG, OPV and hepatitis B given']),
      ch('nicu', 'Shifted to', ['Mother side', 'NICU / SNCU']),
    ]),
    sec('third', 'Third stage and post-delivery', [
      ch('amtsl', 'Active management of third stage', ['Done (oxytocin 10 IU, controlled cord traction, uterine massage)', 'Not done']),
      ch('placenta', 'Placenta', ['Complete', 'Incomplete / retained bits', 'Retained placenta']), ch('membr', 'Membranes', ['Complete', 'Incomplete']),
      txt('bloodLoss', 'Estimated blood loss (mL)', { half: true }), ch('uterus', 'Uterus after delivery', ['Well contracted', 'Atonic']),
      fd('pph', 'Complications', ['Postpartum haemorrhage', 'Retained placenta', 'Perineal haematoma', 'Uterine inversion', 'Eclampsia', 'Shock']),
      area('postObs', 'Observation for the first 2 hours (pulse, BP, bleeding, uterine tone)'),
    ]),
    closingObg({ dx: 'Diagnosis (e.g. G2 P1 L1 at 39 weeks, vertex, in active labour; or delivered, third stage complete)', rx: 'Plan (monitoring, analgesia, mode of delivery, active management of third stage)' }),
  ],
}

/* ---------------- 3. Obstetrics: post-natal case ---------------- */

const pnc: CaseDef = {
  id: 'obg-pnc', subject: 'obg', title: 'Obstetrics: post-natal case',
  blurb: 'Complete post-natal case: antenatal, intra-natal and post-natal history, lochia, breast feeding, wound and perineum, baby',
  sections: [
    partWA('pnc'),
    sec('complaints', 'Chief / presenting complaints', [cc('cc', 'Select the complaints and give the duration', ['Came for regular follow-up / immunisation of the baby', 'Fever', 'Excessive discharge per vagina', 'Excessive bleeding per vagina', 'Mass protruding out of vagina', 'Foul-smelling discharge per vagina', 'Pain in abdomen', 'Burning micturition', 'Breast tenderness / swelling', 'Pain at the caesarean wound', 'Pain at the episiotomy / perineum', 'Difficulty in breast feeding', 'Routine postnatal care'])]),
    sec('hpi', 'History of presenting complaints / illness', [
      sym('fever', 'Fever', ['duration', 'onset', 'progression', at('ass', 'Associated', ['Chills and rigors', 'Foul-smelling lochia', 'Wound discharge', 'Breast pain', 'Burning micturition', 'Calf pain'], true)]),
      sym('lochia', 'Bleeding / discharge per vagina (lochia)', ['duration', 'amount', at('c', 'Colour', ['Red (rubra)', 'Pink-brown (serosa)', 'Yellowish-white (alba)']), 'smell', at('cl', 'Clots', ['Passage of clots', 'No clots'])]),
      sym('wound', 'Pain at wound / perineum / abdomen', ['duration', 'onset', 'progression', 'severity', 'aggravating', 'relieving']),
      sym('breastS', 'Breast tenderness / swelling', ['duration', at('type', 'Problem', ['Engorgement', 'Cracked nipples', 'Pain', 'Poor milk supply', 'Difficulty in latching'], true)]),
      fd('neg', 'Also ask: tap present or absent', ['Burning micturition', 'Retention of urine', 'Constipation', 'Headache', 'Calf pain', 'Mass protruding out of vagina', 'Low mood', 'Sleeplessness', 'Passed flatus and stool', 'Ambulant']),
    ]),
    ...ancHistories(),
    sec('natal', 'Intra-natal history', [
      ch('onset', 'Labour', ['Spontaneous in onset', 'Induced']),
      ch('mode', 'Mode of delivery', ['Normal vaginal delivery', 'Assisted (forceps or vacuum)', 'Elective LSCS', 'Emergency LSCS']),
      txt('place', 'Place of delivery', { half: true }), txt('indic', 'Why was caesarean section done', { half: true }), txt('gaDel', 'Gestational age at delivery', { half: true }),
      fd('natF', 'Intra-natal events', ['Prolonged leaking per vagina', 'Premature rupture of membranes', 'Prolonged labour', 'Oxytocin augmentation', 'Meconium-stained liquor', 'Fetal distress', 'Episiotomy', 'Perineal tear', 'Retained placenta', 'Postpartum haemorrhage', 'Blood transfusion', 'Other intra-natal complication']),
      area('baby', 'Baby: cried immediately or not, resuscitation, birth weight, sex, cord clamping, urine and meconium passed, NICU, jaundice, fever, how the baby is now, immunisation'),
      txt('bfStart', 'Breast feeding initiated at', { half: true }),
    ]),
    sec('postnatal', 'Post-natal history', [
      fd('pnF', 'Post-natal history', ['Fever', 'Foul-smelling discharge per vagina', 'Excessive bleeding / discharge per vagina', 'Mass protruding out of vagina', 'Pre-lacteal feeds given', 'Colostrum fed', 'Breast feeding well', 'Wound problem']),
      ch('lochiaH', 'Lochia', ['Rubra', 'Serosa', 'Alba']), txt('feeds', 'Number of feeds per day', { half: true }),
    ]),
    pregTable(),
    pastHistory(['Previous caesarean section', 'Blood transfusion']),
    menstrualObs(),
    maritalWA(),
    familyHistory(['Twins in the family', 'Congenital anomaly / chromosomal disorder']),
    personalHistory(),
    persWA(),
    sec('contra', 'Contraceptive history', [ch('contraH', 'Contraceptive use', ['No significant history', 'OCP', 'Condoms', 'IUCD', 'Injectable', 'Other']), area('contraN', 'Details and plans')]),
    envWA(),
    histSummary(),
    gpeObg(),
    systemic(),
    sec('pnExam', 'Post-natal examination', [
      ch('fundus', 'Uterus (per abdomen)', ['Firmly contracted, below the umbilicus', 'Well contracted', 'Subinvoluted: soft and high', 'Not palpable per abdomen']),
      txt('fundHt', 'Fundal height (finger breadths below the umbilicus)', { half: true }),
      fd('woundF', 'Caesarean wound', ['Wound clean and dry', 'Wound gaping', 'Wound discharge', 'Wound induration', 'Wound tenderness', 'Sutures intact']),
      fd('perin', 'Perineum', ['Episiotomy healed', 'Episiotomy gaping', 'Perineal haematoma', 'Perineal oedema', 'Perineal tear repaired']),
      fd('lochiaF', 'Lochia', ['Lochia rubra', 'Lochia serosa', 'Lochia alba', 'Foul-smelling lochia', 'Excess lochia', 'Clots in lochia']),
      fd('breastF', 'Breasts and nipples', ['Soft breasts', 'Engorged breasts', 'Cracked nipples', 'Inverted nipples', 'Mastitis (red, hot, tender)', 'Breast abscess', 'Milk secretion present']),
      fd('legs', 'Legs', ['Calf tenderness', 'Calf swelling', 'Pedal oedema']),
      area('babyEx', 'Baby: weight, activity, feeding, jaundice, cord, any problem'),
    ]),
    closingObg({ dx: 'Diagnosis (e.g. postnatal day 3 after emergency LSCS for fetal distress, doing well)', rx: 'Management and discharge advice (danger signs, breast feeding, contraception, immunisation, follow-up)' }),
  ],
}

/* ====================================================================
   TOPIC CASES: each one is a base sheet with the complaints that
   belong to the topic put first, plus a "Focus" section of the points an
   examiner expects for that topic. Content follows the case presentations
   in the shared OBG folder.
   ==================================================================== */

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

function topic(o: { base: CaseDef; id: string; title: string; blurb: string; first?: string[]; focusTitle: string; focus: string[]; extra?: Field[] }): CaseDef {
  const b = clone(o.base)
  const sections = b.sections.map((s) =>
    s.id === 'complaints' && o.first
      ? { ...s, fields: s.fields.map((f) => (f.t === 'complaints' ? { ...f, options: [...o.first!, ...f.options.filter((x) => !o.first!.includes(x))] } : f)) }
      : s,
  )
  const ci = sections.findIndex((s) => s.id === 'closing')
  sections.splice(ci, 0, sec('focus', o.focusTitle, [fd('fo', 'Tap present or absent', o.focus), ...(o.extra || [])]))
  return { ...b, id: o.id, title: o.title, blurb: o.blurb, sections }
}

const TOPICS: CaseDef[] = [
  /* ---------- Gynaecology topics ---------- */
  topic({
    base: gyn, id: 'obg-fibroid', title: 'Gynaecology: fibroid uterus (AUB-L)',
    blurb: 'Heavy periods with clots and a firm, mobile pelvic or abdominal mass that moves with the cervix',
    first: ['Heavy menstrual flow', 'Painful menstruation', 'Passage of clots', 'Palpable mass per abdomen'],
    focusTitle: 'Focus: fibroid uterus',
    focus: ['Soaking of pads (more than 6 per day)', 'Waking at night to change pads', 'Mass in the lower abdomen', 'Pressure symptoms on bladder or bowel', 'Mass moves with the cervix', 'Firm, smooth or nodular uterine enlargement', 'Cannot get below the mass', 'Mass transversely mobile only', 'Uterine size in weeks recorded', 'Pallor / anaemia', 'Mother or sister had hysterectomy for uterine mass', 'Rapid growth of the mass', 'Infertility or recurrent abortion'],
  }),
  topic({
    base: gyn, id: 'obg-aub', title: 'Gynaecology: abnormal uterine bleeding with dysmenorrhoea',
    blurb: 'Painful, heavy periods in a young woman: PALM-COEIN, endometriosis, adenomyosis, ovulatory disorders',
    first: ['Heavy menstrual flow', 'Painful menstruation'],
    focusTitle: 'Focus: abnormal uterine bleeding (PALM-COEIN)',
    focus: ['Pain starts before the period and settles after bleeding stops', 'Pain radiating to back or thigh', 'Cycles regular', 'Cycles irregular', 'Waking at night to change pads', 'Dyspareunia', 'Dyschezia / pain on defaecation', 'Tender iliac fossae on palpation', 'Tender, bulky, globular uterus', 'Fixed retroverted uterus or nodularity in the pouch of Douglas', 'Obesity or hirsutism (ovulatory disorder)', 'Bleeding disorder history', 'Thyroid disorder', 'On OCP, IUCD or anticoagulants', 'Pallor / anaemia'],
  }),
  topic({
    base: gyn, id: 'obg-pmb', title: 'Gynaecology: postmenopausal bleeding',
    blurb: 'Bleeding after 12 months of menopause: rule out endometrial hyperplasia, carcinoma and cervical growth',
    first: ['Postmenopausal bleeding'],
    focusTitle: 'Focus: postmenopausal bleeding',
    focus: ['Years since menopause recorded', 'Spotting at first, then increasing bleeding', 'Offensive discharge', 'Loss of weight or appetite', 'Obesity (BMI 30 or more)', 'Diabetes mellitus', 'Hypertension', 'Nulliparity or low parity', 'Late menopause (after 52 years)', 'On tamoxifen', 'On hormone replacement therapy', 'Family history of endometrial, ovarian, breast or colorectal cancer', 'Atrophic vaginitis on speculum', 'Cervical growth or polyp on speculum', 'Bulky uterus or adnexal mass on bimanual', 'Pap smear / cancer screening ever done'],
  }),
  topic({
    base: gyn, id: 'obg-pcos', title: 'Gynaecology: secondary amenorrhoea, PCOS and infertility',
    blurb: 'Irregular cycles since menarche, months of amenorrhoea, weight gain and inability to conceive: ovulatory dysfunction and infertility work-up',
    first: ['Irregular cycle', 'Amenorrhoea', 'Inability to conceive', 'Unusual weight gain'],
    focusTitle: 'Focus: PCOS and infertility work-up',
    focus: ['Irregular cycles since menarche', 'Cycle length 35 days or more', 'Weight gain and sedentary lifestyle', 'Hirsutism', 'Acne or oily skin', 'Acanthosis nigricans', 'Galactorrhoea', 'Hot flushes or vaginal dryness (ovarian failure)', 'Symptoms of thyroid disease', 'Unprotected intercourse for 12 months or more', 'Tubal / pelvic infection history', 'Urine pregnancy test negative', 'Withdrawal bleed after progesterone challenge', 'LH:FSH ratio raised', 'Raised testosterone', 'Polycystic ovaries on ultrasound', "Husband's semen analysis normal", 'Both tubes patent on HSG'],
  }),
  topic({
    base: gyn, id: 'obg-ovarian', title: 'Gynaecology: ovarian tumour (adnexal mass)',
    blurb: 'Abdominal distension with a pelvic mass: benign versus malignant ovarian tumour, ovarian cyst in a girl and torsion',
    first: ['Palpable mass per abdomen', 'Pain abdomen'],
    focusTitle: 'Focus: ovarian tumour',
    focus: ['Progressive abdominal distension', 'Bloating and dyspepsia', 'Loss of appetite', 'Loss of weight', 'Postmenopausal age', 'Mass arising from the pelvis', 'Mass separate from the uterus on bimanual', 'Movement of mass not transmitted to the cervix', 'Irregular surface and restricted mobility', 'Mass felt through the fornix', 'Nodules in the pouch of Douglas', 'Ascites (shifting dullness)', 'Cystic mass in a young girl', 'Sudden severe pain with vomiting (torsion)', 'Hirsutism / virilisation', 'Family history of ovarian or breast cancer', 'CA-125 and ultrasound advised'],
  }),
  topic({
    base: gyn, id: 'obg-prolapse', title: 'Gynaecology: uterovaginal prolapse',
    blurb: 'Mass coming out of the vagina in a postmenopausal multipara: degree of prolapse, cystocele, rectocele',
    first: ['Mass coming out of vagina / prolapse', 'Symptoms of bladder dysfunction', 'Lower backache'],
    focusTitle: 'Focus: prolapse',
    focus: ['Pelvic heaviness / dragging sensation', 'Mass increases on standing, lifting or straining', 'Mass reduces on lying down', 'Stress incontinence', 'Difficulty in passing urine', 'Constipation or incomplete evacuation', 'Home delivery or prolonged labour in the past', 'Postmenopausal (oestrogen deficiency)', 'Chronic cough or constipation', 'Cervix is the leading part', 'Cough impulse positive', 'Cannot get above the mass', 'Mass is reducible', 'Anterior vaginal wall rugosities lost', 'Decubitus ulcer on the mass', 'Prolapse in third degree (cervix outside the introitus)', 'Diabetes or hypertension (fitness for surgery)'],
  }),
  topic({
    base: gyn, id: 'obg-ectopic', title: 'Gynaecology/Obstetrics: ectopic pregnancy',
    blurb: 'Missed period, lower abdominal pain and bleeding with shock: ruptured ectopic, work-up and management',
    first: ['Amenorrhoea', 'Pain abdomen', 'Bleeding per vagina'],
    focusTitle: 'Focus: ectopic pregnancy',
    focus: ['Urine pregnancy test positive', 'Sudden severe lower abdominal pain', 'Pain on one side', 'Scanty dark bleeding per vagina', 'Shoulder-tip pain', 'Fainting or giddiness', 'Previous ectopic pregnancy', 'Previous pelvic inflammatory disease', 'Previous tubal surgery or tubal sterilisation', 'IUCD in situ', 'Assisted reproduction', 'Smoking', 'Genital tuberculosis', 'Tachycardia', 'Hypotension / shock', 'Pallor', 'Abdominal tenderness and guarding', 'Cervical motion tenderness', 'Fornix fullness', 'Uterus smaller than period of amenorrhoea', 'Empty uterus with free fluid on ultrasound', 'Serum beta-hCG raised', 'Rh-negative: anti-D needed'],
  }),

  /* ---------- Obstetric topics ---------- */
  topic({
    base: anc, id: 'obg-anaemia', title: 'Obstetrics: anaemia in pregnancy',
    blurb: 'Fatigue, breathlessness and pallor in pregnancy: grading, causes, oral and parenteral iron, transfusion and heart failure',
    first: ['Diagnosed to have low haemoglobin', 'Breathlessness', 'Swelling of both lower limbs'],
    focusTitle: 'Focus: anaemia in pregnancy',
    focus: ['Easy fatiguability', 'Breathlessness on exertion', 'Palpitations', 'Giddiness', 'Pica', 'Pallor of conjunctiva and tongue', 'Koilonychia', 'Angular stomatitis / glossitis', 'Tachycardia and ejection systolic flow murmur', 'Pedal oedema', 'Raised JVP / basal crepitations (cardiac failure)', 'Iron tablets not taken regularly', 'Poor diet (low calories and protein)', 'Short interval between pregnancies', 'Previous severe anaemia or transfusion', 'Worm infestation', 'Heavy periods before pregnancy', 'Family history of thalassaemia / sickle cell', 'Hb below 11 g/dL recorded', 'Peripheral smear / serum ferritin advised'],
  }),
  topic({
    base: anc, id: 'obg-gdm', title: 'Obstetrics: gestational diabetes mellitus',
    blurb: 'High blood sugar found in pregnancy: DIPSI/OGTT, diet, insulin, fetal surveillance and timing of delivery',
    first: ['Diagnosed to have raised blood sugar', 'Routine antenatal check-up'],
    focusTitle: 'Focus: gestational diabetes',
    focus: ['Family history of diabetes in parents', 'Previous gestational diabetes', 'Previous macrosomic baby (4 kg or more)', 'Previous unexplained stillbirth', 'Obesity (BMI 25 or more)', 'Polyhydramnios', 'Polyuria and polydipsia', 'Recurrent urinary or vulvovaginal infection', 'Glycosuria', 'DIPSI 2-hour value 140 mg/dL or more', 'Fasting glucose raised on OGTT', 'HbA1c raised', 'On medical nutrition therapy', 'On insulin', 'Stopped insulin against advice', 'Self-monitoring of blood sugar', 'Fetal growth scan advised', 'Postpartum OGTT advised'],
  }),
  topic({
    base: anc, id: 'obg-pih', title: 'Obstetrics: pre-eclampsia / hypertensive disorders of pregnancy',
    blurb: 'Raised BP, headache and pedal oedema in pregnancy: grading, severe features, magnesium sulphate, antihypertensives and delivery',
    first: ['Raised BP recording', 'Headache', 'Swelling of both lower limbs'],
    focusTitle: 'Focus: hypertensive disorders of pregnancy',
    focus: ['Headache (frontal or occipital)', 'Blurring of vision', 'Epigastric pain', 'Pedal oedema not relieved by rest', 'Facial puffiness', 'Reduced urine output', 'Convulsions', 'Primigravida', 'Previous pre-eclampsia', 'Chronic hypertension', 'Family history of hypertension / pre-eclampsia', 'Diabetes, obesity or twin pregnancy', 'BP 140/90 or more on two readings', 'BP 160/110 or more (severe range)', 'Urine albumin 1+ or more', 'Hyperreflexia / clonus', 'Fundal height smaller than period of gestation', 'Magnesium sulphate started', 'Antihypertensive started'],
  }),
  topic({
    base: anc, id: 'obg-rh', title: 'Obstetrics: Rh-negative pregnancy',
    blurb: 'Rh-negative mother with Rh-positive husband: isoimmunisation, indirect Coombs, anti-D and fetal monitoring',
    first: ['Routine antenatal check-up'],
    focusTitle: 'Focus: Rh-negative pregnancy',
    focus: ['Mother Rh-negative', 'Husband Rh-positive', 'Previous abortion or ectopic without anti-D', 'Previous baby with neonatal jaundice or exchange transfusion', 'Previous intrauterine death or hydrops', 'Previous blood transfusion', 'Anti-D given after the last delivery', 'Indirect Coombs test done', 'Indirect Coombs test positive (titre recorded)', 'Anti-D advised at 28 weeks', 'Anti-D advised within 72 hours of delivery', 'Middle cerebral artery Doppler advised', 'Fetal anaemia / hydrops on ultrasound'],
  }),
  topic({
    base: anc, id: 'obg-aph', title: 'Obstetrics: antepartum haemorrhage (placenta praevia / abruption)',
    blurb: 'Bleeding after 28 weeks: painless fresh bleeding of praevia against painful dark bleeding of abruptio',
    first: ['Bleeding per vagina', 'Pain abdomen'],
    focusTitle: 'Focus: antepartum haemorrhage',
    focus: ['Bleeding after 28 weeks of gestation', 'Painless bleeding', 'Painful bleeding', 'Bright red blood', 'Dark blood with clots', 'Sudden onset, soaked a pad', 'Recurrent episodes', 'Bleeding stopped on its own', 'History of trauma', 'Hypertension / pre-eclampsia', 'Previous caesarean section', 'Previous placenta praevia', 'Smoking or cocaine', 'Soft, relaxed uterus', 'Tense, tender, woody-hard uterus', 'Head high and floating / malpresentation', 'Fundal height more than period of gestation (concealed)', 'FHS absent', 'Shock out of proportion to visible blood loss', 'Per vaginal examination avoided', 'Ultrasound localisation of placenta advised'],
  }),
  topic({
    base: anc, id: 'obg-multiple', title: 'Obstetrics: multiple pregnancy (twins)',
    blurb: 'Over-distended uterus, three fetal poles and two heart sounds: chorionicity, complications and mode of delivery',
    first: ['Came for safe confinement'],
    focusTitle: 'Focus: multiple pregnancy',
    focus: ['Uterus larger than period of gestation', 'Over-distended abdomen', 'Excessive weight gain', 'Breathlessness', 'Excessive vomiting in early pregnancy', 'Family history of twins', 'Ovulation induction or ART used', 'Twin pregnancy on early scan', 'Dichorionic diamniotic on first trimester scan', 'Monochorionic twins', 'Three fetal poles palpable', 'Many small parts felt', 'Two fetal heart sounds at different sites', 'Heart rates differ by 10 beats or more', 'Polyhydramnios', 'Growth discordance on scans', 'First twin cephalic', 'First twin not cephalic', 'Anaemia or pre-eclampsia in this pregnancy'],
  }),
  topic({
    base: anc, id: 'obg-breech', title: 'Obstetrics: breech presentation',
    blurb: 'Term pregnancy with breech: types, causes, external cephalic version, mode of delivery and complications',
    first: ['Came for safe confinement'],
    focusTitle: 'Focus: breech presentation',
    focus: ['Breech noted on scan or by the doctor', 'Head felt at the fundus (hard, round, ballotable)', 'Soft broad mass at the pelvic brim', 'FHS best heard above the umbilicus', 'Primigravida', 'Previous breech delivery', 'Polyhydramnios or oligohydramnios', 'Twin pregnancy', 'Placenta praevia', 'Contracted pelvis', 'Uterine anomaly or fibroid', 'Prematurity', 'Frank breech on ultrasound', 'Complete breech on ultrasound', 'Footling breech on ultrasound', 'External cephalic version considered', 'Contraindication to version present', 'Elective caesarean planned', 'Vaginal breech delivery planned'],
  }),
  topic({
    base: anc, id: 'obg-lscs', title: 'Obstetrics: previous caesarean section',
    blurb: 'Pregnancy after one LSCS: scar assessment, TOLAC versus repeat caesarean, signs of scar rupture',
    first: ['Came for safe confinement'],
    focusTitle: 'Focus: previous caesarean section',
    focus: ['One previous LSCS', 'Two or more previous caesareans', 'Indication of previous caesarean noted', 'Indication persists in this pregnancy', 'Interval from last caesarean 18 months or more', 'Interval from last caesarean less than 18 months', 'Previous vaginal delivery', 'Previous classical or unknown uterine scar', 'Previous uterine rupture', 'Previous wound infection / puerperal sepsis', 'Scar healthy on inspection', 'Scar tenderness absent', 'Scar tenderness present', 'Placenta praevia / low-lying placenta in this pregnancy', 'Estimated fetal weight not too large', 'Pelvis adequate', 'Trial of labour after caesarean planned', 'Elective repeat caesarean planned', 'Facilities for emergency caesarean available'],
  }),
  topic({
    base: anc, id: 'obg-cpd', title: 'Obstetrics: short stature and contracted pelvis (CPD)',
    blurb: 'Primigravida with short stature at term: pelvic assessment, trial of labour and caesarean section',
    first: ['Came for safe confinement'],
    focusTitle: 'Focus: contracted pelvis / cephalopelvic disproportion',
    focus: ['Height below 145 cm', 'Past rickets or poliomyelitis', 'Fracture of pelvis, hip or spine', 'Abnormal gait', 'Spinal deformity', 'Primigravida with head not engaged at term', 'Sacral promontory reached on vaginal examination', 'Diagonal conjugate less than 11.5 cm', 'Obstetric conjugate less than 10 cm', 'Side walls of the pelvis convergent', 'Ischial spines prominent', 'Subpubic angle acute', 'Intertuberous diameter less than 8 cm', 'Anaemia', 'Large baby estimated', 'Trial of labour planned', 'Elective caesarean planned'],
  }),
  topic({
    base: anc, id: 'obg-fgr', title: 'Obstetrics: fetal growth restriction',
    blurb: 'Reduced fetal growth on serial scans: causes, Doppler, monitoring and timing of delivery',
    first: ['Came for safe confinement'],
    focusTitle: 'Focus: fetal growth restriction',
    focus: ['Reduced growth on serial ultrasound', 'SFH less than period of gestation', 'Estimated fetal weight below the 10th centile', 'Reduced liquor / oligohydramnios', 'Reduced fetal movements', 'Abnormal umbilical artery Doppler', 'Absent or reversed end-diastolic flow', 'Brain-sparing on middle cerebral artery Doppler', 'Abnormal CTG / non-stress test', 'Previous small-for-dates baby', 'Hypertension / pre-eclampsia', 'Anaemia or poor nutrition', 'Smoking or tobacco', 'Congenital infection / anomaly', 'Antenatal steroids given', 'Previous caesarean section (scar)', 'Delivery timed by Doppler findings'],
  }),
  topic({
    base: anc, id: 'obg-cardiac', title: 'Obstetrics: heart disease in pregnancy (rheumatic mitral stenosis)',
    blurb: 'Past rheumatic fever with a diastolic murmur in pregnancy: NYHA class, risk, medical care and mode of delivery',
    first: ['Routine antenatal check-up', 'Breathlessness'],
    focusTitle: 'Focus: heart disease in pregnancy',
    focus: ['History of rheumatic fever / sore throat with joint pain', 'On benzathine penicillin prophylaxis', 'Breathlessness on exertion', 'Orthopnoea or paroxysmal nocturnal dyspnoea', 'Palpitations', 'Chest pain', 'Syncope', 'Haemoptysis', 'Pedal oedema', 'Raised JVP', 'Tapping apex beat', 'Loud S1 with opening snap', 'Mid-diastolic murmur at the apex with presystolic accentuation', 'Loud P2 (pulmonary hypertension)', 'Irregular pulse (atrial fibrillation)', 'Basal crepitations', 'NYHA class I', 'NYHA class II', 'NYHA class III or IV', 'On anticoagulant', 'Echocardiography advised'],
  }),
  /* ---------- Gynaecology topics from the college record ---------- */
  topic({
    base: gyn, id: 'obg-adenomyosis', title: 'Gynaecology: adenomyosis',
    blurb: 'Progressive dysmenorrhoea with heavy periods in a multipara: a tender, globular, bulky uterus',
    first: ['Heavy menstrual flow', 'Painful menstruation', 'Passage of clots'],
    focusTitle: 'Focus: adenomyosis',
    focus: ['Age 35 to 50 years', 'Multiparous woman', 'Progressively increasing dysmenorrhoea', 'Heavy regular periods', 'Chronic pelvic pain', 'Dyspareunia', 'Previous uterine surgery or curettage', 'Uniformly enlarged globular uterus (up to 12 weeks)', 'Tender uterus, worse at periods', 'Uterus mobile', 'No separate mass in the adnexa', 'Pallor / anaemia', 'Coexisting fibroid or endometriosis', 'Thickened junctional zone on MRI', 'Heterogeneous myometrium on ultrasound'],
  }),
  topic({
    base: gyn, id: 'obg-primamen', title: 'Gynaecology: primary amenorrhoea',
    blurb: 'No periods by 15 years with secondary sexual characters, or by 13 years without: Turner, Mullerian agenesis, AIS, hypothalamic causes',
    first: ['Amenorrhoea'],
    focusTitle: 'Focus: primary amenorrhoea',
    focus: ['Age 15 years or more with no menarche', 'Age 13 years or more with no breast development', 'Breast development present', 'Breast development absent', 'Pubic and axillary hair present', 'Pubic and axillary hair absent or scanty', 'Short stature', 'Webbed neck, shield chest, wide carrying angle (Turner)', 'Cyclical lower abdominal pain (haematocolpos)', 'Bulging bluish membrane at the introitus (imperforate hymen)', 'Blind vagina / vaginal agenesis', 'Uterus absent on ultrasound', 'Anosmia (Kallmann)', 'Hirsutism or virilisation', 'Galactorrhoea', 'Headache or visual field defect', 'Chronic illness, malnutrition or excessive exercise', 'FSH raised (hypergonadotropic)', 'FSH low (hypogonadotropic)', 'Karyotype advised'],
  }),
  topic({
    base: gyn, id: 'obg-pubmen', title: 'Gynaecology: puberty menorrhagia',
    blurb: 'Heavy or prolonged bleeding in an adolescent after menarche: anovulatory cycles, bleeding disorders, anaemia',
    first: ['Heavy menstrual flow', 'Increased duration of menstrual flow', 'Irregular cycle'],
    focusTitle: 'Focus: puberty menorrhagia',
    focus: ['Menarche in the last 1 to 3 years', 'Irregular cycles since menarche', 'Prolonged bleeding (more than 7 days)', 'Soaking of pads with clots', 'Giddiness and weakness', 'Haemodynamic instability', 'No history of sexual activity', 'Easy bruising or nose bleeds', 'Family history of bleeding disorder', 'Thyroid symptoms', 'Obesity or hirsutism', 'Severe pallor / anaemia', 'Abdominal mass absent', 'Per rectal examination normal', 'Platelet count and coagulation profile advised', 'Hb below 7 g/dL'],
  }),

  /* ---------- Labour topics from the college record ---------- */
  topic({
    base: labour, id: 'obg-lab-normal', title: 'Labour: normal labour (vertex delivery)',
    blurb: 'Term pregnancy in spontaneous labour: first, second and third stage, partogram, active management and newborn care',
    first: ['Labour pains', 'Show (blood-stained mucus per vagina)'],
    focusTitle: 'Focus: normal labour',
    focus: ['Term gestation (37 to 40 weeks)', 'Singleton, vertex, longitudinal lie', 'Spontaneous onset of regular contractions', 'Show present', 'Head engaged', 'Cervical dilatation progressing 1 cm per hour or more', 'Plotted on the partogram, to the left of the alert line', 'Liquor clear', 'FHS between 110 and 160 per minute', 'Membranes ruptured artificially or spontaneously', 'Delivered by normal vaginal delivery', 'Episiotomy given', 'Active management of third stage done', 'Placenta and membranes complete', 'Blood loss under 500 mL', 'Baby cried immediately (Apgar 7 or more)', 'Breast feeding initiated within an hour'],
  }),
  topic({
    base: labour, id: 'obg-lab-precip', title: 'Labour: precipitate labour',
    blurb: 'Expulsion of the fetus within 3 hours of the onset of contractions: causes, maternal and fetal risks',
    first: ['Labour pains', 'Show (blood-stained mucus per vagina)'],
    focusTitle: 'Focus: precipitate labour',
    focus: ['Total duration of labour under 3 hours', 'Multipara', 'Strong, frequent contractions', 'Small baby or roomy pelvis', 'Previous history of precipitate labour', 'Delivery occurred before reaching the hospital / in transit', 'Cervical tears', 'Perineal tears', 'Postpartum haemorrhage', 'Uterine inversion', 'Atonic uterus', 'Baby: cord tear / bruising / intracranial haemorrhage', 'Birth asphyxia', 'Tocolytic or controlled delivery of the head', 'Check for cervical and vaginal tears'],
  }),
  topic({
    base: labour, id: 'obg-lab-prolonged', title: 'Labour: prolonged labour',
    blurb: 'Labour beyond 18 hours or crossing the action line on the partogram: the three Ps, obstructed labour, caesarean',
    first: ['Labour pains'],
    focusTitle: 'Focus: prolonged labour',
    focus: ['Duration of labour over 18 hours', 'Primigravida', 'Cervical dilatation less than 1 cm per hour', 'Partogram crossed the alert line', 'Partogram crossed the action line', 'Inefficient uterine action (powers)', 'Occipito-posterior or malposition (passenger)', 'Large baby / hydrocephalus (passenger)', 'Contracted pelvis / cephalopelvic disproportion (passage)', 'Cervical dystocia', 'Caput and moulding marked', 'Maternal exhaustion, dehydration, ketosis', 'Bandl\'s ring', 'Tender lower segment', 'Meconium-stained liquor', 'Fetal distress (FHS abnormal)', 'Oxytocin augmentation given', 'Decision for emergency caesarean'],
  }),
  topic({
    base: labour, id: 'obg-lab-instr', title: 'Labour: instrumental delivery (forceps / vacuum)',
    blurb: 'Prolonged second stage or fetal distress: prerequisites, indications, types and complications of forceps and vacuum',
    first: ['Labour pains'],
    focusTitle: 'Focus: instrumental delivery',
    focus: ['Prolonged second stage', 'Maternal exhaustion', 'Fetal distress in the second stage', 'Maternal cardiac disease or hypertension (shortened second stage)', 'Cervix fully dilated', 'Membranes ruptured', 'Head engaged and at least +2 station', 'Position known', 'Bladder emptied', 'Adequate analgesia', 'Pelvis adequate', 'Outlet forceps', 'Low forceps', 'Mid forceps (rarely)', 'Vacuum applied', 'Episiotomy given', 'Cervical or vaginal tear', 'Baby: facial marks, scalp swelling (chignon)', 'Baby: cephalhaematoma, brachial plexus injury'],
  }),
  topic({
    base: labour, id: 'obg-lab-pph', title: 'Labour: postpartum haemorrhage',
    blurb: 'Blood loss over 500 mL after vaginal delivery: the four Ts, atonic uterus, active management and stepwise treatment',
    first: ['Bleeding per vagina'],
    focusTitle: 'Focus: postpartum haemorrhage',
    focus: ['Blood loss over 500 mL after vaginal delivery', 'Blood loss over 1000 mL after caesarean', 'Uterus soft and relaxed (atonic)', 'Uterus contracted but bleeding continues', 'Placenta retained', 'Placenta or membranes incomplete', 'Genital tract tear', 'Perineal or vaginal haematoma', 'Coagulopathy (DIC)', 'Prolonged labour', 'Polyhydramnios / twins / big baby', 'Grand multipara', 'Antepartum haemorrhage', 'Previous PPH', 'Anaemia', 'Active management of third stage given', 'Bimanual compression', 'Oxytocin, ergometrine and carboprost', 'Tranexamic acid', 'Balloon tamponade / B-Lynch suture', 'Pulse and BP monitored, blood and fluids given'],
  }),
  topic({
    base: labour, id: 'obg-lab-breech', title: 'Labour: breech delivery',
    blurb: 'Vaginal breech delivery: Lovset, Mauriceau-Smellie-Veit manoeuvre, complications and when to deliver by caesarean',
    first: ['Labour pains'],
    focusTitle: 'Focus: breech delivery',
    focus: ['Breech diagnosed on abdominal and vaginal examination', 'Frank breech', 'Complete breech', 'Footling breech', 'Sacrum is the denominator', 'Meconium on the examining finger (normal in breech)', 'Pelvis adequate', 'Estimated fetal weight under 3.5 kg', 'Fetal head flexed on ultrasound', 'Spontaneous or assisted breech delivery', 'Lovset manoeuvre used', 'Mauriceau-Smellie-Veit manoeuvre used', 'Episiotomy given', 'Hands-off until the umbilicus is delivered', 'Cord prolapse', 'Head entrapment', 'Birth asphyxia or injury to the baby', 'Emergency caesarean converted'],
  }),
]


/* ====================================================================
   FAMILY PLANNING PROCEDURE RECORDS (OBG record book format):
   Tubectomy case, M.T.P. case record (1st trimester), I.U.C.D. case record
   ==================================================================== */

const prelimFP = (o: { discharge?: boolean } = {}): Section =>
  sec('particulars', 'Preliminary data of the patient', [
    txt('name', 'Name in full', { half: true }), txt('age', 'Age', { half: true }),
    txt('ward', 'Ward', { half: true }), txt('bed', 'Bed no.', { half: true }),
    txt('unit', 'Unit in-charge', { half: true }), txt('ipd', 'IPD no.', { half: true }),
    txt('religion', 'Religion and caste', { half: true }), txt('occupation', 'Occupation', { half: true }),
    txt('education', 'Education', { half: true }), txt('income', 'Income', { half: true }),
    txt('hname', 'Name of husband', { half: true }), txt('hage', 'Age of husband', { half: true }),
    txt('hocc', "Husband's occupation", { half: true }), txt('hincome', "Husband's income", { half: true }),
    txt('address', 'Address'), date('doa', 'Date of admission'),
    ...(o.discharge ? [date('dod', 'Date of discharge')] : []),
  ])

const menstrualFP = (): Section =>
  sec('menstrual', 'Menstrual history', [
    txt('menarche', 'Age at menarche', { half: true }), date('lmp', 'LMP'),
    ch('cycle', 'Cycle', ['Regular', 'Irregular']), txt('cycleLen', 'Cycle length (days)', { half: true }),
    txt('flowDays', 'Flow for (days)', { half: true }),
    ch('flow', 'Flow', ['Scanty', 'Normal', 'Heavy']), ch('clots', 'Clots', ['Without clots', 'With clots']),
    ch('pain', 'Pain', ['Absent', 'Premenstrual', 'Menstrual', 'Post-menstrual']),
  ])

const obstFP = (): Section =>
  sec('obst', 'Obstetric history', [
    txt('married', 'Married life (years)', { half: true }),
    txt('obsG', 'Gravida', { half: true }), txt('obsP', 'Para', { half: true }), txt('obsA', 'Abortion', { half: true }),
    txt('obsL', 'Live', { half: true }), txt('obsD', 'Dead', { half: true }),
    area('children', 'Each pregnancy: type of delivery or abortion, year, complications, place, complications of labour, sex and weight of the baby, present health of the child'),
    txt('lastDel', 'Last delivery / last obstetric event (date, type)'),
  ])

const pastFP = (): Section =>
  sec('past', 'Past illness', [
    fd('pastF', 'Tap present or absent', ['Hypertension', 'Diabetes', 'Urinary complaints', 'Tuberculosis', 'Venereal disease', 'Rheumatic fever', 'Previous operations', 'Bleeding disorder', 'Drug allergy', 'Any other illness']),
    area('pastN', 'Details'),
  ])

const gpeFP = (): Section =>
  sec('gpe', 'General examination', [
    ch('built', 'Built', ['Well built', 'Moderately built', 'Poorly built', 'Obese']),
    fd('signs', 'General signs', ['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'Pedal oedema', 'Lymphadenopathy']),
    vitals(),
  ])

const sysFP = (): Section =>
  sec('systemic', 'Systemic examination', [
    fd('sysF', 'Systems', ['RS: bilateral normal vesicular breath sounds', 'CVS: S1 and S2 normal, no murmurs', 'CNS: no deficit']),
    fd('abd', 'Per abdomen', ['Abdomen soft, non-tender', 'No mass palpable', 'Scar of previous surgery', 'Uterus not palpable per abdomen']),
    fd('spec', 'Per speculum', ['Healthy cervix and vagina', 'Cervicitis / erosion', 'Abnormal discharge', 'Cervical polyp', 'IUCD threads seen']),
    fd('pv', 'Per vaginum', ['Uterus anteverted, normal size', 'Uterus retroverted', 'Uterus bulky (size in weeks)', 'Fornices free and non-tender', 'Adnexal mass', 'Cervical motion tenderness']),
    area('sysN', 'Details'),
  ])

const closeFP = (rx: string): Section =>
  sec('closing', 'Summary and plan', [area('summary', 'Summary of the case'), area('provDx', 'Diagnosis / indication'), area('rx', rx)])

const tubectomy: CaseDef = {
  id: 'obg-tubectomy', subject: 'obg', title: 'Family planning: tubectomy case record',
  blurb: 'Female sterilisation: eligibility, counselling, consent, timing, mini-laparotomy or laparoscopy, steps and follow-up',
  sections: [
    prelimFP({ discharge: true }), menstrualFP(), obstFP(), pastFP(), gpeFP(), sysFP(),
    sec('inv', 'Investigations', [
      txt('hb', 'Haemoglobin (g/dL)', { half: true }), txt('bg', 'Blood group', { half: true }),
      ch('urProt', 'Urine albumin', ['Nil', 'Trace', 'Present']), ch('urSug', 'Urine sugar', ['Nil', 'Present']),
      txt('urMic', 'Urine microscopy', { half: true }), txt('vdrl', 'VDRL', { half: true }),
      ch('hiv', 'HIV test', ['Consented: non-reactive', 'Consented: reactive', 'Not consented']), txt('hbs', 'HBsAg', { half: true }),
      area('spl', 'Special investigations'),
    ]),
    sec('counsel', 'Eligibility, counselling and consent', [
      fd('elig', 'Tap present or absent', ['Married woman of reproductive age', 'Family complete', 'Youngest child older than one year', 'Informed of permanence and small failure rate', 'Informed of other contraceptive options', 'Pregnancy excluded', 'Written informed consent from the woman', 'No contraindication (infection, bleeding disorder, severe illness)']),
      area('consentN', 'Consent and counselling notes'),
    ]),
    sec('proc', 'Details of procedure', [
      ch('timing', 'Timing', ['Interval', 'Puerperal (postpartum)', 'Post-MTP', 'Concurrent (with caesarean section)']),
      ch('type', 'Type', ['Mini-laparotomy', 'Laparoscopy']),
      ch('tech', 'Technique', ['Modified Pomeroy', 'Irving', 'Uchida', 'Falope ring', 'Filshie clip', 'Hulka clip']),
      area('steps', 'Steps of the operation'), ch('anaes', 'Anaesthesia', ['Local with sedation', 'Spinal', 'General']),
      area('post', 'Post-procedure observation'), area('compl', 'Complications, if any'),
      txt('fu7', 'Follow-up at 7 days', { half: true }), txt('fu30', 'Follow-up at 1 month', { half: true }),
    ]),
    closeFP('Plan and advice at discharge'),
  ],
}

const mtp: CaseDef = {
  id: 'obg-mtp', subject: 'obg', title: 'Family planning: M.T.P. case record (1st trimester)',
  blurb: 'Medical termination of pregnancy: indication under the MTP Act, counselling, MVA or medical abortion, complications and contraception',
  sections: [
    sec('particulars', 'Details', [
      txt('name', 'Name', { half: true }), txt('age', 'Age', { half: true }), txt('mtpNo', 'MTP no.', { half: true }), date('doa', 'Date'),
      txt('occupation', 'Occupation', { half: true }), txt('address', 'Address', { half: true }), ch('marital', 'Marital status', ['Married', 'Unmarried', 'Widowed', 'Separated']),
    ]),
    sec('complaints', 'Complaints, if any', [cc('cc', 'Select the complaints and give the duration', ['Amenorrhoea', 'Nausea and vomiting', 'Bleeding per vagina', 'Pain abdomen', 'Burning micturition', 'No complaints'])]),
    menstrualFP(),
    obstFP(),
    sec('prevAb', 'Previous abortions', [txt('spont', 'Spontaneous', { half: true }), txt('induced', 'Induced', { half: true }), area('prevN', 'Details')]),
    gpeFP(), sysFP(),
    sec('indic', 'Counselling, consent and indication', [
      fd('indF', 'Indication for termination (MTP Act)', ['Contraceptive failure', 'Pregnancy caused by rape or incest', 'Minor (below 18 years)', 'Risk to physical health of the woman', 'Risk to mental health of the woman', 'Fetal abnormality', 'Unwanted pregnancy / social grounds', 'Change in marital status']),
      fd('couns', 'Counselling and consent', ['Pregnancy confirmed intrauterine by ultrasound', 'Gestation less than 12 weeks', 'Options explained (medical, MVA)', 'Risks and complications explained', 'Written informed consent from the woman', 'Confidentiality explained', 'Rh status checked', 'Contraception counselled']),
    ]),
    sec('proc', 'Procedure', [
      ch('method', 'Method', ['M.R. (menstrual regulation)', 'Suction / MVA', 'Medical abortion', 'Dilatation and evacuation']),
      txt('cannula', 'Cannula used (size, mm)', { half: true }), txt('dil', 'Dilatation up to', { half: true }),
      ch('anaes', 'Anaesthesia', ['None / paracervical block', 'Sedation', 'General']),
      txt('prod', 'Quantity of products aspirated', { half: true }), ch('curet', 'Check curettage', ['Done', 'Not done']),
      txt('drugs', 'Drugs used in medical abortion (name, dose, route)'),
      fd('contra', 'Concomitant contraceptive measure', ['Copper IUCD inserted', 'Oral contraceptive pills', 'Condoms', 'Tubectomy', 'None']),
      area('post', 'Post-operative observation'), area('compl', 'Complications, if any'), area('advice', 'Advice on discharge'),
    ]),
    closeFP('Plan and follow-up'),
  ],
}

const iucd: CaseDef = {
  id: 'obg-iucd', subject: 'obg', title: 'Family planning: I.U.C.D. case record',
  blurb: 'IUCD insertion: counselling on contraceptive options, selection, steps of insertion, post-procedure advice and follow-up',
  sections: [
    sec('particulars', 'Preliminary details', [
      txt('name', 'Name', { half: true }), txt('age', 'Age', { half: true }), txt('iucdNo', 'IUCD no.', { half: true }), date('doa', 'Date'),
      txt('income', 'Income', { half: true }), txt('address', 'Address', { half: true }),
    ]),
    menstrualFP(),
    sec('obst', 'Obstetric history', [
      txt('del', 'Deliveries (number)', { half: true }), txt('abort', 'Abortions', { half: true }),
      txt('female', 'Female children', { half: true }), txt('male', 'Male children', { half: true }),
      txt('living', 'Living children with ages'), txt('lastEvent', 'Last obstetric event (date, type)'),
    ]),
    gpeFP(), sysFP(),
    sec('inv', 'Investigations', [ch('urAlb', 'Urine albumin', ['Nil', 'Trace', 'Present']), ch('urSug', 'Urine sugar', ['Nil', 'Present']), txt('urMic', 'Microscopy', { half: true }), txt('hb', 'Haemoglobin', { half: true })]),
    sec('counsel', 'Counselling and consent', [
      fd('opt', 'Tap present or absent', ['Contraceptive options explained', 'Mode of action explained', 'Side effects explained (pain, bleeding)', 'Expulsion and perforation risk explained', 'Return visit and danger signs explained', 'Pregnancy excluded', 'No active pelvic infection', 'Written informed consent']),
      area('consentN', 'Consent notes'),
    ]),
    sec('proc', 'Details of procedure', [
      ch('timing', 'Timing of insertion', ['Interval (within 12 days of menses)', 'Postpartum (within 48 hours)', 'Post-abortal', 'Intra-caesarean']),
      ch('type', 'Device', ['Copper T 380A', 'Copper T 375', 'LNG-IUS', 'Other']),
      txt('sound', 'Uterine sound length (cm)', { half: true }), ch('anaes', 'Anaesthesia', ['None', 'Local', 'Other']),
      area('steps', 'Steps of insertion'), area('post', 'Post-procedure observation'), txt('threads', 'Length of threads left (cm)', { half: true }),
      area('fu', 'Follow-up'),
    ]),
    closeFP('Plan and follow-up'),
  ],
}

export const OBG_CASES: CaseDef[] = [gyn, anc, labour, pnc, ...TOPICS, tubectomy, mtp, iucd]
