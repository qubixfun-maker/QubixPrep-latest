import type { CaseDef, Section, Field } from './types'
import { txt, area, ch, fd, cc, sym, sec, at, vitals, date } from './dsl'
import { pastHistory, familyHistory, personalHistory } from './blocks'

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
    txt('married', 'Married life (years)', { half: true }), ch('consang', 'Consanguinity', ['No', 'Yes']),
    txt('obsP', 'P (para)', { half: true }), txt('obsL', 'L (living)', { half: true }), txt('obsA', 'A (abortions)', { half: true }),
    txt('obsD', 'D (deaths)', { half: true }), txt('obsE', 'E (ectopic)', { half: true }),
    txt('ld', 'LD (date and mode of last delivery)', { half: true }),
    ch('steril', 'Sterilization', ['Not done', 'Tubectomy done', 'Husband has had vasectomy']),
    ch('contra', 'Contraception used', ['None', 'Condoms', 'OCP', 'IUCD', 'Injectable', 'Other']),
    area('children', 'Children: number, sex, age, mode of delivery, any complication'),
  ], 'Leave blank what does not apply, for example for a nulliparous woman.')

const obstANC = (): Section =>
  sec('obst', 'Obstetric history and score', [
    txt('married', 'Married life (years)', { half: true }), ch('consang', 'Consanguinity', ['No', 'Yes']),
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

/* ---------------- Gynaecology (OPD proforma) ---------------- */

const gyn: CaseDef = {
  id: 'obg-gyn', subject: 'obg', title: 'Gynaecology case (OPD proforma)', blurb: 'Heavy or irregular periods, pain, white discharge, mass, urinary complaints: full gynaecology proforma',
  sections: [
    partOP(),
    sec('complaints', 'H/O presenting complaints', [cc('cc', 'Select the complaints and give the duration', ['Heavy menstrual bleeding per vagina', 'Irregular menstrual cycles', 'Painful menstruation', 'Passage of clots', 'Scanty flow', 'Amenorrhoea', 'Intermenstrual bleeding', 'Postcoital bleeding', 'Postmenopausal bleeding', 'Pain abdomen', 'Mass per abdomen', 'Mass coming out of vagina', 'Excessive white discharge', 'Foul-smelling discharge', 'Pruritus vulvae', 'Increased frequency of micturition', 'Burning micturition', 'Foul-smelling urine', 'Lower backache', 'Fatigue', 'Dizziness', 'Painful coitus', 'Inability to conceive', 'Bowel complaints'])]),
    sec('hpi', 'History of present illness', [
      sym('hmb', 'Heavy menstrual bleeding', ['duration', 'onset', 'progression', at('pads', 'Pads used per day', ['1 to 2', '3 to 4', '4 to 5', 'More than 5', 'Soaking through at night']), at('clots', 'Clots', ['Passage of clots', 'No clots']), at('cyc', 'Menstrual cycles', ['Regular', 'Irregular']), 'aggravating', 'relieving', 'smell']),
      sym('cycle', 'Irregular menstrual cycles', ['duration', 'onset', 'progression', at('type', 'Pattern', ['Irregular cycles', 'Polymenorrhoea', 'Oligomenorrhoea', 'Hypomenorrhoea', 'Metrorrhagia', 'Intermenstrual bleeding', 'Postcoital bleeding', 'Postmenopausal bleeding', 'Amenorrhoea'], true), at('dys', 'Pain', ['Painful (dysmenorrhoea)', 'Painless'])]),
      symptoms.pain(),
      sym('urine', 'Urinary complaints', ['duration', 'onset', 'progression', at('ass', 'Symptoms', ['Increased frequency', 'Urgency', 'Unable to control urine', 'Urge incontinence', 'Stress incontinence', 'Burning micturition', 'Haematuria', 'Foul-smelling urine', 'Poor stream / retention', 'Nocturia'], true), 'aggravating', 'relieving', 'timing']),
      sym('mass', 'Mass per abdomen / vagina', ['duration', 'onset', 'progression', at('type', 'Features', ['Lump in the abdomen', 'Mass coming out of vagina', 'Worse on standing or straining', 'Reduces on lying down']), 'aggravating']),
      sym('disch', 'Vaginal discharge', ['duration', 'amount', at('c', 'Colour', ['White', 'Yellow', 'Green', 'Blood-stained', 'Watery']), 'smell', at('ass', 'Associated', ['Pruritus', 'Dyspareunia', 'Burning micturition', 'Fever', 'Lower abdominal pain'], true)]),
      sym('infert', 'Infertility', ['duration', at('type', 'Pattern', ['Primary', 'Secondary'])]),
      fd('neg', 'Also ask: tap present or absent', ['Fever', 'Weight loss', 'Dizziness or fatigue', 'Postcoital bleeding', 'Intermenstrual bleeding', 'Painful coitus', 'Abdominal distension', 'Bowel complaints', 'Hirsutism', 'Galactorrhoea', 'Hot flushes', 'Trauma', 'Loss of appetite']),
      area('rxHx', 'Treatment taken so far, and investigations already done'),
    ]),
    menstrualGyn(),
    obstGyn(),
    pastHistory(['Tubectomy', 'Previous caesarean section', 'Previous gynaecological surgery (D&C, myomectomy)']),
    familyHistory(['Carcinoma of breast, ovary or cervix']),
    personalHistory(),
    gpeObg(),
    systemic(),
    abdomenGyn(),
    vulva(),
    perSpec(),
    perVaginal(),
    closingObg({ dx: 'Diagnosis (e.g. most probably uterine fibroid)', rx: 'Treatment / management' }),
  ],
}

/* ---------------- Antenatal case record (IPD proforma) ---------------- */

const anc: CaseDef = {
  id: 'obg-anc', subject: 'obg', title: 'Antenatal case record (IPD proforma)', blurb: 'Trimester-wise history, obstetric score, Leopold grips, FHS, investigations and advice',
  sections: [
    partIP(),
    sec('complaints', 'H/O amenorrhoea and presenting complaints', [
      txt('amen', 'H/O amenorrhoea (weeks / months)', { half: true }),
      cc('cc', 'Select the complaints and give the duration', ['Amenorrhoea', 'Labour pain', 'Pain abdomen', 'Bleeding per vagina', 'Leaking per vagina', 'Decreased fetal movements', 'Headache', 'Blurring of vision', 'Swelling of both lower limbs', 'Swelling of face', 'Vomiting', 'Burning micturition', 'Fever', 'Routine antenatal check-up']),
    ]),
    sec('hpi', 'History of present illness', [
      symptoms.pain('Pain abdomen / labour pain'), symptoms.bleedPv(), symptoms.leak(), symptoms.fm(), symptoms.pih(),
      sym('oedema', 'Swelling of lower limbs', ['duration', 'onset', 'progression', at('side', 'Side', ['Both lower limbs', 'Right', 'Left']), 'aggravating', 'relieving']),
      fd('neg', 'Also ask: tap present or absent', ['Fever', 'Fatigue', 'Dizziness', 'Headache', 'Blurring of vision', 'Aggravating or relieving factors', 'Burning micturition', 'Vomiting', 'Itching all over']),
    ]),
    sec('t1', '1st trimester', [
      ch('conc', 'Conception', ['Spontaneous', 'With fertility treatment']),
      txt('uptDay', 'Detected by UPT after (days / weeks of amenorrhoea)', { half: true }), ch('usg1', 'Confirmed by USG', ['Yes', 'No']),
      fd('t1F', 'First trimester', ['Dating scan done', 'Folic acid supplement taken', 'Excessive vomiting', 'Fever with rash', 'Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Burning micturition', 'Drug intake', 'Radiation exposure', 'Spontaneous abortion threatened']),
      area('t1N', 'Details'),
    ]),
    sec('t2', '2nd trimester', [
      txt('quick', 'Quickening felt at (weeks)', { half: true }), txt('anc', 'ANC visits (number, place, registered)', { half: true }),
      ch('td', 'Td / TT vaccine', ['1 dose', '2 doses', 'Booster', 'Not taken']),
      fd('t2F', 'Second trimester', ['Iron and calcium tablets taken', 'NT scan done', 'Anomaly scan done', 'Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Headache', 'Blurring of vision', 'Pedal oedema', 'Burning micturition']),
      area('t2N', 'Details'),
    ]),
    sec('t3', '3rd trimester', [
      ch('fm3', 'Fetal movements', ['Well perceived', 'Decreased', 'Absent']),
      fd('t3F', 'Third trimester', ['IFA and calcium tablets taken', 'Growth scan done', 'Bleeding per vagina', 'Leaking per vagina', 'Pain abdomen', 'Headache', 'Blurring of vision', 'Pedal oedema', 'Burning micturition', 'Fever']),
      area('t3N', 'Details'),
    ]),
    obstANC(),
    pregTable(),
    menstrualObs(),
    sec('contra', 'Contraceptive history', [ch('contraH', 'Contraceptive history', ['No significant history', 'OCP', 'Condoms', 'IUCD', 'Injectable', 'Other']), area('contraN', 'Details')]),
    familyHistory(['Twins', 'Congenital anomaly']),
    pastHistory(['Blood transfusion after abortion', 'Rh incompatibility']),
    personalHistory(),
    gpeObg(['Varicose veins']),
    systemic(),
    paInspection(),
    obsPalpation(),
    obsAuscultation(),
    sec('ixTable', 'Investigations (table)', [
      txt('ixCbc', 'CBC (Hb, platelets)', { half: true }), txt('ixGrp', 'Blood group and Rh', { half: true }),
      txt('ixLft', 'LFT, RFT', { half: true }), txt('ixInf', 'VDRL, HBsAg, HIV', { half: true }),
      txt('ixPap', 'Pap smear', { half: true }), txt('ixThy', 'Thyroid profile (GA, result)', { half: true }),
      txt('ixDate', 'Dating scan / routine USG (10 to 13 weeks)', { half: true }), txt('ixAnom', 'Anomaly scan (GA, result)', { half: true }),
      txt('ixGrow', 'Growth scan + Doppler (GA, result)', { half: true }), txt('ixOgtt', 'OGTT (GA, result)', { half: true }),
      txt('ixUrine', 'Urine routine and culture', { half: true }),
      area('ixOther', 'Other investigations, with date, GA and interpretation'),
    ]),
    closingObg({ dx: 'Diagnosis (e.g. G2 P0 L0 A1 at 36 weeks, longitudinal lie, cephalic, with pedal oedema)', rx: 'Advice / management' }),
  ],
}

/* ---------------- Labour (intrapartum) ---------------- */

const labour: CaseDef = {
  id: 'obg-labour', subject: 'obg', title: 'Obstetrics: labour (intrapartum) case', blurb: 'Admission in labour: contractions, per vaginal findings, pelvis assessment, partograph',
  sections: [
    partIP(),
    sec('complaints', 'Presenting complaints', [
      txt('amen', 'H/O amenorrhoea (weeks)', { half: true }),
      cc('cc', 'Select the complaints and give the duration', ['Amenorrhoea', 'Labour pains', 'Show (blood-stained mucus per vagina)', 'Leaking per vagina', 'Bleeding per vagina', 'Decreased fetal movements', 'Pain abdomen', 'Headache / blurring of vision']),
    ]),
    sec('hpi', 'History of present illness', [
      sym('lp', 'Labour pains', ['duration', 'onset', 'progression', at('freq', 'Frequency', ['Every 10 minutes', 'Every 5 minutes', 'Every 2 to 3 minutes', 'Irregular']), at('dur2', 'Each pain lasts', ['Less than 20 seconds', '20 to 40 seconds', 'More than 40 seconds']), 'radiation']),
      sym('show', 'Show', ['duration', 'amount']), symptoms.leak(), symptoms.bleedPv(), symptoms.fm(), symptoms.pih(),
      fd('neg', 'Also ask: tap present or absent', ['Fever', 'Pain abdomen between contractions', 'Burning micturition', 'Vomiting']),
    ]),
    sec('ancSum', 'Antenatal summary', [
      ch('book', 'Booking', ['Booked, regular ANC', 'Booked, irregular ANC', 'Unbooked']),
      fd('ancF', 'Antenatal care', ['Folic acid taken', 'IFA and calcium taken', 'Td vaccine completed', 'Dating scan done', 'Anomaly scan done', 'Growth scan done', 'OGTT done', 'Hb checked', 'Blood group and Rh known', 'HIV, VDRL, HBsAg done']),
      area('ancProb', 'Antenatal complications (hypertension, GDM, anaemia, bleeding, others)'),
    ]),
    obstANC(),
    pregTable(),
    menstrualObs(),
    pastHistory(['Previous caesarean section', 'Blood transfusion']),
    familyHistory(['Twins']),
    personalHistory(),
    gpeObg(),
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
      area('partograph', 'Partograph notes (alert and action lines, progress)'),
    ]),
    closingObg({ dx: 'Diagnosis (e.g. G2 P1 L1 at 39 weeks, vertex, in active labour)', rx: 'Plan (monitoring, analgesia, mode of delivery, active management of third stage)' }),
  ],
}

/* ---------------- Postnatal / post-caesarean ---------------- */

const pnc: CaseDef = {
  id: 'obg-pnc', subject: 'obg', title: 'Obstetrics: postnatal / post-caesarean case', blurb: 'Delivery details, lochia, breast feeding, wound and perineum, danger signs, discharge advice',
  sections: [
    partIP([date('dod', 'Date of delivery'), txt('pnd', 'Postnatal day / post-operative day', { half: true })]),
    sec('complaints', 'Presenting complaints', [cc('cc', 'Select the complaints and give the duration', ['Routine postnatal care', 'Pain at the caesarean wound', 'Pain at the episiotomy / perineum', 'Excessive bleeding per vagina', 'Foul-smelling vaginal discharge', 'Fever', 'Breast pain or engorgement', 'Difficulty in breast feeding', 'Burning micturition', 'Headache', 'Calf pain or swelling', 'Low mood or anxiety', 'Constipation'])]),
    sec('hpi', 'Postnatal history', [
      sym('fever', 'Fever', ['duration', 'onset', 'progression', at('ass', 'Associated', ['Chills and rigors', 'Foul-smelling lochia', 'Wound discharge', 'Breast pain', 'Burning micturition', 'Calf pain'], true)]),
      sym('lochia', 'Bleeding per vagina (lochia)', ['duration', 'amount', at('c', 'Colour', ['Red (rubra)', 'Pink-brown (serosa)', 'Yellowish-white (alba)']), 'smell', at('cl', 'Clots', ['Passage of clots', 'No clots'])]),
      sym('wound', 'Pain at wound / perineum', ['duration', 'onset', 'progression', 'severity', 'aggravating', 'relieving']),
      sym('breastS', 'Breast problem', ['duration', at('type', 'Problem', ['Engorgement', 'Cracked nipples', 'Pain', 'Poor milk supply', 'Difficulty in latching'], true)]),
      fd('neg', 'Also ask: tap present or absent', ['Burning micturition', 'Retention of urine', 'Constipation', 'Headache', 'Calf pain', 'Low mood', 'Sleeplessness', 'Passed flatus and stool', 'Ambulant']),
    ]),
    sec('delivery', 'Delivery details', [
      ch('mode', 'Mode of delivery', ['Normal vaginal delivery', 'Assisted (forceps or vacuum)', 'Elective LSCS', 'Emergency LSCS']),
      txt('indic', 'Indication, if LSCS or assisted', { half: true }), txt('gaDel', 'Gestational age at delivery', { half: true }),
      txt('place', 'Place of delivery', { half: true }), ch('anaes', 'Anaesthesia', ['Spinal', 'Epidural', 'General', 'Local or none']),
      fd('delF', 'Intrapartum events', ['Prolonged labour', 'Oxytocin augmentation', 'Meconium-stained liquor', 'Fetal distress', 'Episiotomy', 'Perineal tear', 'Retained placenta', 'Postpartum haemorrhage', 'Blood transfusion']),
      area('baby', 'Baby: sex, birth weight, Apgar, cry at birth, NICU admission, feeding'),
      area('ancSumm', 'Antenatal summary (booked or not, complications, Td, IFA, investigations)'),
    ]),
    obstANC(),
    pregTable(),
    menstrualObs(),
    pastHistory(['Previous caesarean section', 'Blood transfusion']),
    familyHistory(),
    personalHistory(),
    gpeObg(),
    systemic(),
    sec('pnExam', 'Postnatal examination', [
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

/* ---------------- High-risk pregnancy ---------------- */

const hrp: CaseDef = {
  id: 'obg-hrp', subject: 'obg', title: 'Obstetrics: high-risk pregnancy', blurb: 'Hypertension, GDM, anaemia, previous caesarean, Rh-negative and other risk factors',
  sections: [
    partIP(),
    sec('complaints', 'Presenting complaints', [
      txt('amen', 'H/O amenorrhoea (weeks / months)', { half: true }),
      cc('cc', 'Select the complaints and give the duration', ['Amenorrhoea', 'Swelling of both lower limbs', 'Swelling of face', 'Headache', 'Blurring of vision', 'Pain in the epigastrium', 'Convulsions', 'Excessive thirst or polyuria', 'Breathlessness', 'Palpitations', 'Easy fatiguability', 'Decreased fetal movements', 'Bleeding per vagina', 'Pain over previous scar', 'Routine antenatal check-up']),
    ]),
    sec('hpi', 'History of present illness', [
      symptoms.pih(), symptoms.fm(), symptoms.bleedPv(), symptoms.pain('Pain abdomen'),
      sym('breath', 'Breathlessness / palpitations', ['duration', 'onset', 'progression', 'aggravating', 'relieving']),
      sym('thirst', 'Excessive thirst / polyuria', ['duration', 'onset', 'progression']),
      fd('risk', 'Risk factors (tap present or absent)', ['Hypertension before pregnancy', 'Pre-eclampsia in a previous pregnancy', 'Gestational diabetes', 'Pre-gestational diabetes', 'Anaemia', 'Previous caesarean section', 'Rh-negative blood group', 'Twin pregnancy', 'Previous stillbirth or neonatal death', 'Recurrent miscarriage', 'Elderly primigravida', 'Short stature', 'Thyroid disorder', 'Heart disease', 'Epilepsy', 'Bad obstetric history']),
      area('ancProb', 'Complications in this pregnancy and treatment taken'),
    ]),
    sec('indexPreg', 'Present pregnancy', [
      ch('plurality', 'Pregnancy', ['Singleton', 'Twins']),
      fd('ancF', 'Antenatal care', ['Registered / booked', 'Dating scan done', 'Anomaly scan done', 'Growth scan done', 'OGTT done', 'Hb checked', 'Td vaccine completed', 'IFA taken', 'Calcium taken', 'Aspirin prophylaxis taken', 'Antihypertensives taken', 'Insulin or oral hypoglycaemic taken', 'Admitted earlier in this pregnancy']),
    ]),
    obstANC(),
    pregTable(),
    menstrualObs(),
    pastHistory(['Rh incompatibility', 'Previous caesarean section']),
    familyHistory(['Pre-eclampsia', 'Twins']),
    personalHistory(),
    gpeObg(['Varicose veins']),
    systemic(),
    sec('hrpEx', 'Examination for high-risk features', [
      txt('bpBoth', 'BP (position, arm, repeat reading)', { half: true }),
      ch('urineAlb', 'Urine albumin (dipstick)', ['Nil', 'Trace', '1+', '2+', '3+']),
      txt('glu', 'Blood sugar (FBS, PPBS, OGTT)', { half: true }),
      fd('hrpF', 'Findings', ['Pedal oedema', 'Facial puffiness', 'Hyperreflexia', 'Clonus', 'Epigastric tenderness', 'Pallor', 'Raised JVP', 'Basal crepitations', 'Goitre', 'Scar tenderness (previous LSCS)', 'Uterine tenderness']),
    ]),
    paInspection(),
    obsPalpation(),
    obsAuscultation(),
    closingObg({ dx: 'Diagnosis (e.g. G2 P1 L1 at 34 weeks with gestational hypertension, cephalic)', rx: 'Management (monitoring, drugs, timing and mode of delivery, counselling)' }),
  ],
}

/* ---------------- Early pregnancy bleeding ---------------- */

const early: CaseDef = {
  id: 'obg-early', subject: 'obg', title: 'Obstetrics: early pregnancy bleeding (abortion / ectopic)', blurb: 'Bleeding and pain in early pregnancy: types of abortion, ectopic, shock, speculum and bimanual findings',
  sections: [
    partIP(),
    sec('complaints', 'Presenting complaints', [
      txt('amen', 'H/O amenorrhoea (weeks)', { half: true }),
      cc('cc', 'Select the complaints and give the duration', ['Amenorrhoea', 'Bleeding per vagina', 'Pain in the lower abdomen', 'Passage of clots', 'Passage of tissue (fleshy mass)', 'Fainting or giddiness', 'Shoulder-tip pain', 'Vomiting', 'Fever', 'Foul-smelling vaginal discharge']),
    ]),
    sec('hpi', 'History of present illness', [
      symptoms.bleedPv(),
      sym('pain', 'Pain in the lower abdomen', ['duration', 'onset', 'progression', at('site', 'Site', ['Hypogastrium', 'Right iliac fossa', 'Left iliac fossa', 'Generalised']), at('nature', 'Nature', ['Colicky (cramping)', 'Sudden severe', 'Dull aching', 'Continuous']), at('rad', 'Radiation', ['None', 'To the shoulder', 'To the back'])]),
      sym('syncope', 'Fainting / giddiness', ['duration', 'onset']),
      sym('infect', 'Fever / foul discharge', ['duration', at('ass', 'Associated', ['Fever with chills', 'Foul-smelling discharge', 'Lower abdominal pain'], true)]),
      fd('risk', 'Risk factors (tap present or absent)', ['Previous ectopic pregnancy', 'Pelvic inflammatory disease', 'Tubal surgery or tubectomy', 'IUCD in situ', 'Infertility treatment', 'Previous abortion', 'Drugs taken to induce abortion', 'Uterine instrumentation', 'Abdominal trauma', 'Diabetes or thyroid disorder']),
      fd('neg', 'Also ask: tap present or absent', ['Vomiting', 'Fever', 'Burning micturition', 'Passage of tissue']),
    ]),
    menstrualObs(),
    obstANC(),
    pregTable(),
    sec('contra', 'Contraception, past, family and personal history', [
      ch('contraH', 'Contraception', ['None', 'Condoms', 'OCP', 'IUCD', 'Tubectomy done']),
      fd('pastHx2', 'Past history', ['Diabetes mellitus', 'Hypertension', 'Thyroid disorder', 'Tuberculosis', 'Pelvic infection', 'Previous surgery', 'Blood transfusion', 'Drug allergy']),
      area('famPers', 'Family history, diet, appetite, bowel and bladder, sleep, habits'),
    ]),
    gpeObg(),
    systemic(),
    sec('abdE', 'Per abdomen', [
      fd('inspF', 'Inspection and palpation', ['Abdomen distended', 'Tenderness', 'Guarding', 'Rebound tenderness', 'Uterus palpable per abdomen', 'Free fluid']),
      area('abdN', 'Details (site of tenderness, size of uterus)'),
    ]),
    sec('psE', 'Per speculum and per vaginal examination', [
      fd('os', 'Per speculum', ['Cervix healthy', 'Os closed', 'Os open', 'Products of conception in the os', 'Bleeding from the os', 'Clots in vagina', 'Foul-smelling discharge']),
      ch('uterusSz', 'Uterus (bimanual)', ['Corresponds to the period of amenorrhoea', 'Smaller than the period of amenorrhoea', 'Larger than the period of amenorrhoea']),
      fd('pvF', 'Per vaginal findings', ['Uterus soft', 'Cervical motion tenderness', 'Fornix tenderness', 'Adnexal mass (right)', 'Adnexal mass (left)', 'Pouch of Douglas fullness', 'Cervical excitation']),
      area('pvN', 'Details'),
    ]),
    sec('ixE', 'Investigations', [
      txt('ixHcg', 'UPT / serum beta-hCG', { half: true }), txt('ixUsg', 'USG (TVS) findings', { half: true }),
      txt('ixHb', 'Hb and blood group with Rh', { half: true }), area('ixOther', 'Other investigations'),
    ]),
    closingObg({ dx: 'Diagnosis (e.g. incomplete abortion at 9 weeks, or ruptured ectopic pregnancy)', rx: 'Management (resuscitation, medical, surgical, anti-D if Rh-negative)' }),
  ],
}

/* ---------------- Gynaecology: prolapse ---------------- */

const prolapse: CaseDef = {
  id: 'obg-prolapse', subject: 'obg', title: 'Gynaecology: pelvic organ prolapse', blurb: 'Mass coming out of the vagina, urinary and bowel symptoms, degree of prolapse',
  sections: [
    partOP(),
    sec('complaints', 'H/O presenting complaints', [cc('cc', 'Select the complaints and give the duration', ['Mass coming out of vagina', 'Heaviness or dragging sensation in the pelvis', 'Unable to control urine', 'Increased frequency of micturition', 'Difficulty in passing urine', 'Constipation or incomplete evacuation', 'Lower backache', 'White discharge', 'Bleeding or ulcer on the mass', 'Difficulty in walking or sitting'])]),
    sec('hpi', 'History of present illness', [
      sym('mass', 'Mass coming out of vagina', ['duration', 'onset', 'progression', at('rel', 'Behaviour', ['Comes down on standing, coughing or straining', 'Goes back on lying down', 'Needs to be pushed back by hand', 'Always outside', 'Ulcer or bleeding on the mass'], true), 'aggravating', 'relieving']),
      sym('heavy', 'Heaviness / dragging pain', ['duration', 'onset', 'progression', 'aggravating', 'relieving']),
      sym('urine', 'Urinary complaints', ['duration', 'onset', 'progression', at('ass', 'Symptoms', ['Stress incontinence', 'Urge incontinence', 'Increased frequency', 'Urgency', 'Poor stream', 'Retention of urine', 'Need to push the mass to pass urine', 'Burning micturition'], true)]),
      sym('bowelS', 'Bowel complaints', ['duration', 'onset', 'progression', at('ass', 'Symptoms', ['Constipation', 'Feeling of incomplete evacuation', 'Needs digital support to pass stool'], true)]),
      fd('risk', 'Risk factors (tap present or absent)', ['Multiparity', 'Prolonged or instrumental labour', 'Large baby (more than 4 kg)', 'Early return to heavy work after delivery', 'Chronic cough', 'Chronic constipation', 'Obesity', 'Menopause (oestrogen deficiency)', 'Previous pelvic surgery', 'Connective tissue disorder']),
      area('rxHx', 'Treatment taken (pessary, exercises, surgery)'),
    ]),
    menstrualGyn(),
    obstGyn(),
    pastHistory(['Previous gynaecological surgery', 'Chronic cough']),
    familyHistory(),
    personalHistory(),
    gpeObg(),
    systemic(),
    abdomenGyn(),
    vulva(),
    sec('prolEx', 'Prolapse assessment', [
      ch('grade', 'Uterine descent', ['No descent', '1st degree: cervix within the vagina', '2nd degree: cervix at the introitus', '3rd degree: cervix outside the introitus', '4th degree (procidentia): whole uterus outside']),
      fd('prolF', 'Findings', ['Cystocele', 'Rectocele', 'Enterocele', 'Urethrocele', 'Vault prolapse', 'Decubitus ulcer on the cervix', 'Hypertrophied elongated cervix', 'Atrophic vaginitis', 'Stress incontinence on cough']),
      ch('perineum', 'Perineum', ['Intact', 'Deficient (old perineal tear)', 'Gaping introitus']),
      area('prolN', 'Details (reducibility, ulcer, size of cervix)'),
    ]),
    perSpec(),
    perVaginal(),
    closingObg({ dx: 'Diagnosis (e.g. 2nd degree uterovaginal prolapse with cystocele and rectocele)', rx: 'Management (pelvic floor exercises, ring pessary, surgery such as vaginal hysterectomy with repair)' }),
  ],
}

/* ---------------- Gynaecology: infertility ---------------- */

const infertility: CaseDef = {
  id: 'obg-infert', subject: 'obg', title: 'Gynaecology: infertility', blurb: 'Couple history, ovulatory, tubal and male factors, examination and work-up',
  sections: [
    partOP(),
    sec('complaints', 'H/O presenting complaints', [cc('cc', 'Select the complaints and give the duration', ['Inability to conceive', 'Irregular menstrual cycles', 'Amenorrhoea', 'Painful menstruation', 'Painful coitus', 'Excessive hair growth', 'Milky discharge from the breasts', 'Pelvic pain', 'Weight gain', 'Sexual difficulty'])]),
    sec('hpi', 'History of present illness', [
      sym('infert', 'Inability to conceive', ['duration', at('type', 'Pattern', ['Primary', 'Secondary']), at('freq', 'Frequency of coitus', ['Less than once a week', '1 to 2 times a week', '2 to 3 times a week', 'More than 3 times a week']), at('timing', 'Coitus timed to the fertile period', ['Yes', 'No'])]),
      sym('cycle', 'Irregular cycles', ['duration', 'onset', 'progression', at('type', 'Pattern', ['Oligomenorrhoea', 'Amenorrhoea', 'Polymenorrhoea', 'Regular but anovulatory'], true)]),
      symptoms.pain('Pelvic pain / dysmenorrhoea'),
      fd('risk', 'Risk factors (tap present or absent)', ['Pelvic inflammatory disease', 'Genital tuberculosis', 'Previous abdominal or pelvic surgery', 'Endometriosis', 'Previous abortion with sepsis', 'PCOS', 'Thyroid disorder', 'Diabetes mellitus', 'Weight gain']),
      fd('neg', 'Also ask: tap present or absent', ['Painful coitus', 'Hirsutism', 'Acne', 'Galactorrhoea', 'Headache or visual disturbance', 'Hot flushes', 'Abnormal vaginal discharge']),
      area('rxHx', 'Treatment and investigations done so far (ovulation induction, IUI, HSG, semen analysis)'),
    ]),
    menstrualGyn(),
    obstGyn(),
    sec('husband', "Husband's history", [
      txt('hAge', 'Age', { half: true }), txt('hOcc', 'Occupation', { half: true }),
      ch('sa', 'Semen analysis', ['Done: normal', 'Done: abnormal', 'Not done']),
      fd('husF', 'History', ['Smoking', 'Alcohol', 'Tobacco', 'Mumps orchitis', 'Hernia, hydrocele or testicular surgery', 'Diabetes', 'Sexually transmitted infection', 'Exposure to heat or chemicals', 'Erectile or ejaculatory problem', 'Has fathered a child before']),
    ]),
    pastHistory(['Pelvic tuberculosis', 'Previous gynaecological surgery']),
    familyHistory(),
    personalHistory(),
    gpeObg(['Hirsutism', 'Acne', 'Acanthosis nigricans']),
    systemic(),
    abdomenGyn(),
    vulva(),
    perSpec(),
    perVaginal(),
    sec('ixInf', 'Investigations done', [
      txt('ixHorm', 'Day 2 to 3 FSH, LH, prolactin, TSH', { half: true }), txt('ixTvs', 'TVS and follicular study', { half: true }),
      txt('ixHsg', 'HSG / laparoscopy and hysteroscopy', { half: true }), txt('ixSem', 'Semen analysis (count, motility, morphology)', { half: true }),
      area('ixOth', 'Other investigations (progesterone day 21, AMH, endometrial biopsy)'),
    ]),
    closingObg({ dx: 'Diagnosis (e.g. primary infertility due to anovulation (PCOS))', rx: 'Management (lifestyle, ovulation induction, IUI, IVF, treatment of cause)' }),
  ],
}

export const OBG_CASES: CaseDef[] = [gyn, anc, labour, pnc, hrp, early, prolapse, infertility]
