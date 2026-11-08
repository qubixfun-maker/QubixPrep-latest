import type { Hint, Viva } from './insights-data'

type Ins = { hints: Hint[]; must: { n: string; m: string[] }[]; viva: Viva[] }

/* Hint needles are lower-case pieces of what the student ticked or typed. */

const GYN: Ins = {
  hints: [
    { dx: 'Uterine fibroid (leiomyoma)', why: 'Heavy periods with a pelvic mass or a bulky, irregular uterus that moves with the cervix.', any: ['heavy menstrual flow', 'lump arising from pelvis', 'mass palpable', 'uterus bulky', 'uterus irregular surface', 'mass per abdomen', 'passage of clots'], min: 3 },
    { dx: 'Abnormal uterine bleeding (AUB-O, ovulatory dysfunction / DUB)', why: 'Irregular, heavy bleeding with no pelvic mass: think PALM-COEIN, ovulatory dysfunction is the commonest cause in adolescents and perimenopause.', any: ['irregular cycle', 'irregular cycles', 'metrorrhagia', 'polymenorrhoea', 'intermenstrual bleeding', 'heavy menstrual flow'], min: 2 },
    { dx: 'Adenomyosis / endometriosis', why: 'Progressive dysmenorrhoea with heavy flow, dyspareunia and a tender, globular bulky uterus.', any: ['painful menstruation', 'dysmenorrhoea', 'painful coitus', 'uterus bulky', 'uterus globular', 'uterine tenderness', 'nodularity'], min: 3 },
    { dx: 'Chronic pelvic inflammatory disease', why: 'Lower abdominal pain, discharge and fornix or cervical motion tenderness.', any: ['cervical motion tenderness', 'fornix tenderness', 'foul-smelling discharge', 'excessive white discharge', 'pain abdomen', 'fever', 'pouch of douglas fullness'], min: 3 },
    { dx: 'Vaginitis / cervicitis (vaginal discharge)', why: 'White or abnormal discharge with itching or cervical changes.', any: ['excessive white discharge', 'pruritus vulvae', 'abnormal discharge', 'cervicitis', 'erosion / ectropion', 'burning micturition'], min: 2 },
    { dx: 'Uterovaginal prolapse with cystocele / rectocele', why: 'Mass coming out of the vagina, worse on standing or straining, with urinary or bowel symptoms.', any: ['mass coming out of vagina', 'cystocele', 'rectocele', 'uterine prolapse', 'stress incontinence', 'prolapse visible on straining'], min: 2 },
    { dx: 'Carcinoma cervix (to be ruled out)', why: 'Postcoital or irregular bleeding with a hard, friable cervix or growth: needs biopsy.', any: ['postcoital bleeding', 'cervical growth', 'cervix bleeds on touch', 'cervix hard', 'foul-smelling discharge', 'intermenstrual bleeding'], min: 2 },
    { dx: 'Postmenopausal bleeding: rule out endometrial hyperplasia or carcinoma', why: 'Any bleeding after 12 months of amenorrhoea at menopause needs endometrial assessment.', all: ['postmenopausal bleeding'] },
    { dx: 'Ovarian mass (cyst or neoplasm)', why: 'Adnexal mass or a lump arising from the pelvis with pain or distension.', any: ['adnexal mass', 'lump arising from pelvis', 'can get below the swelling', 'mass per abdomen'], min: 2 },
    { dx: 'Polycystic ovary syndrome', why: 'Oligomenorrhoea, hirsutism, acne, obesity or acanthosis.', any: ['oligomenorrhoea', 'irregular cycle', 'hirsutism', 'obese', 'unusual weight gain', 'inability to conceive'], min: 3 },
    { dx: 'Iron deficiency anaemia secondary to blood loss', why: 'Pallor, fatigue, dizziness with heavy periods.', any: ['pallor', 'koilonychia', 'fatigue', 'dizziness'], min: 2 },
  ],
  must: [
    { n: 'General signs (pallor, oedema)', m: ['pallor', 'pedal oedema'] },
    { n: 'Vital signs and BMI', m: ['vital signs'] },
    { n: 'Thyroid and breast examination', m: ['thyroid enlargement', 'breasts (right and left)'] },
    { n: 'Abdominal inspection and palpation', m: ['umbilicus central', 'mass palpable', 'tenderness'] },
    { n: 'Vulval inspection', m: ['appears healthy', 'vulva'] },
    { n: 'Per speculum: cervix and vagina', m: ['cervix bleeds on touch', 'cervical polyp', 'cervical growth', 'erosion / ectropion', 'healthy vaginal walls', 'cervicitis'] },
    { n: 'Bimanual: uterus position and size', m: ['uterus: position', 'uterus: size'] },
    { n: 'Fornices and adnexa', m: ['fornices free', 'adnexal mass (right)', 'fornix tenderness'] },
    { n: 'Menstrual and obstetric history', m: ['age at menarche', 'p (para)'] },
  ],
  viva: [
    { q: 'Define abnormal uterine bleeding and give the FIGO classification.', a: 'AUB is bleeding from the uterine corpus that is abnormal in regularity, volume, frequency or duration. FIGO PALM-COEIN: Polyp, Adenomyosis, Leiomyoma, Malignancy and hyperplasia (structural causes); Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not yet classified (non-structural). Heavy menstrual bleeding is more than 80 mL per cycle or more than 7 days.' },
    { q: 'Define menorrhagia, metrorrhagia, polymenorrhoea, oligomenorrhoea and hypomenorrhoea.', a: 'Menorrhagia (heavy menstrual bleeding): regular cycles with excess flow or duration. Metrorrhagia: irregular bleeding between cycles. Polymenorrhoea: cycle shorter than 21 days. Oligomenorrhoea: cycle longer than 35 days. Hypomenorrhoea: scanty flow of regular cycles.' },
    { q: 'What are the types of fibroid and their complications?', a: 'By position: subserous, intramural, submucous (most likely to cause bleeding) and cervical or broad ligament. Complications: hyaline, cystic and calcific change, red degeneration (mainly in pregnancy), sarcomatous change (less than 1%), torsion of a pedunculated fibroid, infection, and effects on fertility and pregnancy.' },
    { q: 'How do you tell a uterine mass from an ovarian mass on examination?', a: 'A uterine mass moves with the cervix (the cervix moves when the lump is moved), and you cannot get between the mass and the uterus. An ovarian mass is felt separately from the uterus in a fornix, and the uterus can be felt apart from it. Both arise from the pelvis, so you cannot get below the swelling.' },
    { q: 'How do you investigate heavy menstrual bleeding?', a: 'Urine pregnancy test, CBC with platelets, thyroid function, coagulation profile when indicated, pelvic ultrasound (transvaginal), and endometrial sampling or hysteroscopy for women older than 45 years or with risk factors or failed treatment.' },
    { q: 'What is the medical and surgical management of a fibroid?', a: 'Medical: tranexamic acid, NSAIDs, hormonal treatment (LNG-IUS, progestins), GnRH agonists before surgery to shrink the fibroid and correct anaemia. Surgical: myomectomy (to preserve fertility), hysterectomy (completed family), hysteroscopic resection for submucous fibroids, and uterine artery embolisation.' },
    { q: 'Describe the steps of a bimanual pelvic examination.', a: 'Explain, obtain consent, with a chaperone, empty bladder, lithotomy position. Two fingers of one hand in the vagina, other hand on the lower abdomen. Note cervix (position, consistency, motion tenderness), then uterus (position, size, shape, mobility, tenderness), then the fornices and adnexa.' },
    { q: 'How do you grade uterine prolapse?', a: '1st degree: cervix descends within the vagina. 2nd degree: cervix reaches the introitus. 3rd degree: cervix is outside the introitus. 4th degree (procidentia): whole uterus is outside the vulva. The POP-Q system is used in modern practice.' },
    { q: 'What is the screening for cervical cancer?', a: 'Pap smear or HPV DNA testing, and VIA (visual inspection with acetic acid) in the national programme for women aged 30 to 65 years. Abnormal results need colposcopy and biopsy. HPV vaccination protects girls aged 9 to 14 years.' },
    { q: 'Name the causes of vaginal discharge and how they present.', a: 'Candidiasis: thick curdy white discharge with itching. Trichomoniasis: frothy yellow-green, strawberry cervix. Bacterial vaginosis: thin grey fishy discharge with clue cells. Cervicitis, PID, foreign body and malignancy also cause discharge.' },
  ],
}

const ANC: Ins = {
  hints: [
    { dx: 'Singleton pregnancy, longitudinal lie, cephalic presentation', why: 'Longitudinal lie with head as the presenting part on palpation.', all: ['lie longitudinal', 'presentation cephalic'] },
    { dx: 'Breech presentation', why: 'Head felt at the fundus and the breech at the pelvic brim.', any: ['presentation breech'], min: 1 },
    { dx: 'Transverse or oblique lie', why: 'Uterus broader than long, fundal height less than expected, head felt in the flank.', any: ['lie transverse', 'lie oblique', 'presentation shoulder'], min: 1 },
    { dx: 'Pregnancy-induced hypertension / pre-eclampsia', why: 'Headache, visual blurring, epigastric pain, facial puffiness or pedal oedema with raised BP.', any: ['headache', 'blurring of vision', 'epigastric pain', 'facial puffiness', 'swelling of both lower limbs', 'pedal oedema'], min: 2 },
    { dx: 'Anaemia in pregnancy', why: 'Pallor, fatigue, dizziness or koilonychia: confirm with haemoglobin.', any: ['pallor', 'koilonychia', 'fatigue', 'dizziness'], min: 2 },
    { dx: 'Antepartum haemorrhage (placenta praevia or abruptio)', why: 'Bleeding per vagina after 28 weeks: painless suggests praevia, painful with a tense uterus suggests abruption.', all: ['bleeding per vagina'] },
    { dx: 'Premature rupture of membranes', why: 'Leaking per vagina with a history of watery discharge.', all: ['leaking per vagina'] },
    { dx: 'Decreased fetal movements: assess fetal wellbeing', why: 'Reduced movements need CTG and an ultrasound with Doppler.', any: ['fetal movements decreased', 'fetal movements absent', 'decreased fetal movements'], min: 1 },
    { dx: 'Reduced liquor: oligohydramnios / IUGR to be ruled out', why: 'Reduced liquor and SFH smaller than the gestational age.', any: ['liquor (clinical) reduced'], min: 1 },
    { dx: 'Polyhydramnios', why: 'Excess liquor with SFH larger than the dates.', any: ['liquor (clinical) excess'], min: 1 },
    { dx: 'Term pregnancy in labour', why: 'Regular painful contractions with show or leaking.', any: ['labour pain'], min: 1 },
  ],
  must: [
    { n: 'Obstetric score (G P L A D E)', m: ['gravida', 'para'] },
    { n: 'Menstrual dates, LMP and EDD', m: ['edd', 'lmp'] },
    { n: 'Trimester-wise antenatal history', m: ['first trimester', 'second trimester', 'third trimester', 'td / tt vaccine'] },
    { n: 'General signs: pallor, pedal oedema', m: ['pallor', 'pedal oedema'] },
    { n: 'Vital signs (BP) and weight', m: ['vital signs'] },
    { n: 'Uterine height and SFH', m: ['uterine height in weeks', 'sfh (cm)'] },
    { n: 'Fundal and lateral grips', m: ['fundal grip', 'lateral grips'] },
    { n: 'Pelvic grips and engagement', m: ['engagement of the head', '1st pelvic grip'] },
    { n: 'Lie and presentation', m: ['lie', 'presentation'] },
    { n: 'Fetal heart sounds', m: ['fhs (rate per minute)', 'fhs rhythm'] },
    { n: 'Estimated fetal weight', m: ["estimated fetal weight"] },
  ],
  viva: [
    { q: 'How do you calculate the EDD? What are its limits?', a: "Naegele's rule: add 7 days to the first day of the LMP and add 9 months (or subtract 3 months). It assumes a regular 28-day cycle with ovulation on day 14. Dating by an early ultrasound (crown-rump length, 8 to 13 weeks) is more accurate when the LMP is uncertain or cycles are irregular." },
    { q: 'Define gravida, para, abortion and live birth. How is the obstetric score written?', a: 'Gravida is the number of pregnancies including the present one. Para is the number of births after the period of viability (28 weeks in India). Abortion is loss before viability. Score: G P L A D E, for example G3 P1 L1 A1 means 3 pregnancies, 1 delivery, 1 living child, 1 abortion.' },
    { q: 'What are the landmarks of the fundal height by weeks?', a: '12 weeks: just above the symphysis pubis. 16 weeks: halfway between the symphysis and the umbilicus. 20 weeks: at the umbilicus. 24 weeks: about 1 finger above the umbilicus. 36 weeks: at the xiphoid. At 40 weeks it falls slightly as the head engages. Between 20 and 36 weeks the SFH in cm is roughly equal to the weeks.' },
    { q: 'Describe the obstetric grips.', a: 'Fundal grip tells what is at the fundus (breech is broad and soft, head is round and hard). Lateral (umbilical) grips find the back, which is smooth and firm, and the limbs, which are knobby. 1st pelvic grip (Pawlik) identifies the presenting part. 2nd pelvic grip: fingers converge when the head is not engaged and diverge when it is engaged.' },
    { q: "What is Johnson's formula?", a: 'EFW in grams = (SFH in cm minus n) x 155, with n = 12 if the head is not engaged and 11 if it is engaged. Subtract 1 more if the patient weighs more than 91 kg.' },
    { q: 'What is the normal FHS and where is it heard?', a: 'Normal rate is 110 to 160 per minute. It is heard through the back of the fetus, below the umbilicus in a cephalic presentation and at or above the umbilicus in a breech presentation. A Doppler detects it from 10 to 12 weeks, a fetoscope from 18 to 20 weeks.' },
    { q: 'What is the schedule of routine antenatal care?', a: 'At least 4 visits in India (monthly up to 28 weeks, fortnightly to 36, then weekly); the WHO model recommends 8 contacts. Give Td (2 doses 4 weeks apart or a booster), IFA (100 mg elemental iron with 500 microgram folic acid daily from the second trimester), calcium, and deworming after the first trimester. Do routine tests and ultrasound.' },
    { q: 'List the routine investigations in pregnancy.', a: 'Hb, blood group and Rh, urine routine and culture, blood sugar (OGTT 75 g at 24 to 28 weeks), HIV, VDRL, HBsAg, thyroid (TSH), dating scan at 10 to 13 weeks, NT scan, anomaly scan at 18 to 20 weeks and growth scan in the third trimester when indicated.' },
    { q: 'List the danger signs in pregnancy.', a: 'Bleeding per vagina, leaking of fluid, severe headache or blurring of vision, convulsions, severe abdominal pain, fever, reduced or absent fetal movements, swelling of face and hands, severe breathlessness or palpitations, and persistent vomiting.' },
    { q: 'When is anti-D immunoglobulin given?', a: 'To an Rh-negative non-sensitised mother with an Rh-positive baby: 300 microgram at 28 weeks and again within 72 hours of delivery. It is also given after abortion, ectopic pregnancy, antepartum bleeding and invasive procedures.' },
    { q: 'How do you grade anaemia in pregnancy?', a: 'Hb below 11 g/dL is anaemia. Mild 10 to 10.9, moderate 7 to 9.9, severe below 7 g/dL. Oral iron for mild to moderate, IV iron (iron sucrose or ferric carboxymaltose) when oral fails or from the second trimester, and transfusion for severe anaemia close to term or decompensation.' },
  ],
}

const PNC: Ins = {
  hints: [
    { dx: 'Puerperal sepsis / puerperal pyrexia', why: 'Fever with foul-smelling lochia, uterine tenderness or wound infection.', any: ['fever', 'foul-smelling lochia', 'foul-smelling discharge per vagina', 'chills and rigors', 'subinvoluted', 'pain in abdomen'], min: 2 },
    { dx: 'Surgical site infection (wound sepsis)', why: 'Wound discharge, induration, tenderness or gaping with fever.', any: ['wound discharge', 'wound induration', 'wound tenderness', 'wound gaping'], min: 1 },
    { dx: 'Mastitis / breast engorgement', why: 'Painful hot red breast, cracked nipples or engorgement.', any: ['mastitis', 'engorged breasts', 'engorged breasts', 'cracked nipples', 'breast abscess', 'difficulty in latching'], min: 1 },
    { dx: 'Secondary postpartum haemorrhage', why: 'Excess lochia or clots days after delivery: retained products or infection.', any: ['excess lochia', 'excessive bleeding per vagina', 'clots in lochia'], min: 1 },
    { dx: 'Subinvolution of the uterus', why: 'Soft, high uterus with persistent red lochia.', any: ['subinvoluted'], min: 1 },
    { dx: 'Postpartum deep vein thrombosis', why: 'Calf pain, swelling or tenderness.', any: ['calf tenderness', 'calf swelling', 'calf pain'], min: 1 },
    { dx: 'Urinary tract infection', why: 'Burning micturition with fever in the puerperium.', any: ['burning micturition'], min: 1 },
    { dx: 'Postpartum blues / depression', why: 'Low mood, anxiety and sleeplessness.', any: ['low mood', 'sleeplessness', 'low mood'], min: 1 },
    { dx: 'Normal puerperium (uneventful recovery)', why: 'Well contracted uterus, clean wound and normal lochia.', any: ['wound clean and dry', 'firmly contracted', 'well contracted', 'lochia rubra', 'lochia serosa', 'soft breasts'], min: 3 },
  ],
  must: [
    { n: 'Delivery details and indication', m: ['mode of delivery', 'indication, if lscs', 'indication'] },
    { n: 'Vital signs: temperature, pulse, BP', m: ['vital signs'] },
    { n: 'Pallor', m: ['pallor'] },
    { n: 'Uterus: involution and tone', m: ['uterus (per abdomen)', 'fundal height'] },
    { n: 'Caesarean wound or perineum', m: ['caesarean wound', 'perineum'] },
    { n: 'Lochia', m: ['lochia'] },
    { n: 'Breasts and feeding', m: ['breasts and nipples'] },
    { n: 'Legs: calf tenderness', m: ['legs', 'calf tenderness'] },
    { n: 'Baby assessment', m: ['baby'] },
  ],
  viva: [
    { q: 'Define the puerperium. What is involution?', a: 'The period of about 6 weeks after delivery of the placenta during which the reproductive organs return to the non-pregnant state. The uterus involutes from about 1000 g to about 60 g by 6 weeks; the fundus falls about 1 cm (one finger breadth) per day and is not palpable per abdomen by about day 10 to 14.' },
    { q: 'Describe the types of lochia.', a: 'Lochia rubra (red, days 1 to 4), lochia serosa (pink-brown, days 5 to 9) and lochia alba (yellowish-white, up to 2 to 3 weeks). Foul-smelling lochia suggests infection; persistent red lochia suggests subinvolution or retained products.' },
    { q: 'Define puerperal pyrexia.', a: 'A temperature of 38 degrees C (100.4 F) or more on any 2 of the first 10 days after delivery, excluding the first 24 hours. Causes: genital tract infection, UTI, breast infection, wound infection, thrombophlebitis.' },
    { q: 'Define postpartum haemorrhage and its causes.', a: 'Blood loss of 500 mL or more after vaginal delivery or 1000 mL or more after caesarean, or any loss that causes haemodynamic compromise. Primary within 24 hours, secondary from 24 hours to 12 weeks. Causes (4 Ts): Tone (atony), Trauma, Tissue (retained), Thrombin (coagulopathy).' },
    { q: 'What are the advantages of breast feeding and its recommended duration?', a: 'Start within 1 hour of birth and give exclusive breast feeding for 6 months, then continue with complementary feeds up to 2 years. It gives the baby antibodies and the best nutrition, promotes bonding, aids uterine involution, helps birth spacing (LAM) and reduces maternal breast and ovarian cancer risk.' },
    { q: 'What are the criteria for lactational amenorrhoea method?', a: 'Baby under 6 months, exclusively or almost exclusively breast fed, and the mother amenorrhoeic. Effectiveness is about 98%.' },
    { q: 'What postpartum contraception options are available?', a: 'LAM, condoms, progestin-only pills, injectable DMPA, PPIUCD (within 48 hours of delivery or at caesarean), implants, and female sterilisation (postpartum tubectomy within 7 days) or male sterilisation. Combined pills are avoided in the first 6 weeks of breast feeding.' },
    { q: 'What are the postpartum danger signs?', a: 'Heavy bleeding, fever, foul-smelling discharge, severe abdominal pain, wound redness or discharge, breast pain with fever, calf swelling, breathlessness, convulsions or severe headache, and mental distress.' },
    { q: 'What care is given after a caesarean section?', a: 'Monitoring of vitals, urine output, wound and uterine tone, early ambulation and oral feeds, analgesia, thromboprophylaxis if high risk, breast feeding support, and suture removal or check on day 5 to 7 with counselling on contraception and follow-up.' },
    { q: 'What vaccines are given to the newborn at birth?', a: 'BCG, oral polio vaccine zero dose and hepatitis B birth dose, plus vitamin K at birth.' },
  ],
}


/* ---------------- Gynaecology topics ---------------- */

const FIBROID: Ins = {
  hints: [
    { dx: 'Uterine fibroid (leiomyoma), AUB-L', why: 'Heavy periods with clots and a firm mass that moves with the cervix.', any: ['soaking of pads', 'mass in the lower abdomen', 'mass moves with the cervix', 'firm, smooth or nodular', 'cannot get below the mass', 'passage of clots', 'heavy menstrual flow'], min: 3 },
    { dx: 'Fibroid with pressure symptoms', why: 'Urinary frequency or constipation point to a large fibroid pressing on the bladder or rectum.', all: ['pressure symptoms on bladder or bowel'] },
    { dx: 'Rapidly growing mass: rule out sarcomatous change or degeneration', why: 'Sudden growth, especially after menopause, needs imaging and histology.', all: ['rapid growth of the mass'] },
    { dx: 'Iron deficiency anaemia from menorrhagia', why: 'Pallor with heavy bleeding.', any: ['pallor / anaemia', 'soaking of pads', 'waking at night'], min: 2 },
    { dx: 'Ovarian tumour (differential)', why: 'A mass that does not move with the cervix and lets you feel the uterus separately.', all: ['mass transversely mobile only'] },
  ],
  must: [
    { n: 'Menstrual history with pad count and clots', m: ['soaking of pads', 'passage of clots', 'age at menarche'] },
    { n: 'Pallor and vital signs', m: ['pallor', 'vital signs'] },
    { n: 'Palpation: size, surface, mobility, can you get below it', m: ['mass in the lower abdomen', 'cannot get below the mass', 'firm, smooth or nodular'] },
    { n: 'Does the mass move with the cervix', m: ['mass moves with the cervix'] },
    { n: 'Uterine size in weeks', m: ['uterine size in weeks recorded'] },
    { n: 'Speculum to exclude cervical pathology', m: ['cervix', 'healthy vaginal walls'] },
    { n: 'Pressure symptoms and fertility wish', m: ['pressure symptoms', 'infertility or recurrent abortion'] },
  ],
  viva: [
    { q: 'What are the types of fibroid?', a: 'Subserous, intramural and submucous (FIGO 0 to 8), plus cervical and broad ligament fibroids. Submucous fibroids cause the heaviest bleeding; subserous ones cause pressure symptoms and torsion if pedunculated.' },
    { q: 'What are the secondary changes (degenerations) in a fibroid?', a: 'Hyaline, cystic, calcific (womb stone), red (carneous) degeneration, mostly in pregnancy and causing pain and low fever, fatty change, infection, and sarcomatous change (under 1%).' },
    { q: 'Why do fibroids cause heavy bleeding?', a: 'Increased endometrial surface area, impaired uterine contractility, dilated venous plexus under a submucous fibroid, and associated endometrial hyperplasia.' },
    { q: 'How do you investigate a fibroid?', a: 'CBC for anaemia, transvaginal or abdominal ultrasound (number, size, position), endometrial sampling if over 45 years or irregular bleeding, hysteroscopy for submucous, MRI for mapping or doubtful sarcoma.' },
    { q: 'What is the medical management?', a: 'Tranexamic acid, NSAIDs, LNG-IUS, combined pills for bleeding; iron for anaemia; GnRH agonists for 3 to 6 months before surgery; ulipristal or mifepristone where available.' },
    { q: 'What are the surgical options?', a: 'Myomectomy (abdominal, laparoscopic, hysteroscopic) when fertility is wanted; hysterectomy when the family is complete; uterine artery embolisation; MR-guided focused ultrasound.' },
    { q: 'What is the effect of fibroid on pregnancy?', a: 'Abortion, preterm labour, malpresentation, placenta praevia, obstructed labour (cervical or low fibroids), postpartum haemorrhage, red degeneration, and retained placenta.' },
  ],
}

const AUB: Ins = {
  hints: [
    { dx: 'Endometriosis / adenomyosis', why: 'Pain that starts before the period, dyspareunia, dyschezia and a tender bulky or fixed uterus.', any: ['pain starts before the period', 'dyspareunia', 'dyschezia', 'tender, bulky, globular uterus', 'fixed retroverted uterus', 'pain radiating to back'], min: 3 },
    { dx: 'AUB-O (ovulatory dysfunction) / PCOS', why: 'Irregular cycles with obesity or hirsutism.', any: ['cycles irregular', 'obesity or hirsutism'], min: 2 },
    { dx: 'AUB-C (coagulopathy)', why: 'Heavy bleeding since menarche with a bleeding disorder.', all: ['bleeding disorder history'] },
    { dx: 'Thyroid-related AUB', why: 'Thyroid disease causes both heavy and irregular bleeding.', all: ['thyroid disorder'] },
    { dx: 'AUB-I (iatrogenic)', why: 'Bleeding on OCP, IUCD or anticoagulants.', all: ['on ocp, iucd or anticoagulants'] },
    { dx: 'AUB with anaemia', why: 'Pallor and night-time pad changes mean significant loss.', any: ['pallor / anaemia', 'waking at night'], min: 2 },
  ],
  must: [
    { n: 'Cycle pattern and amount (pads, clots, nights)', m: ['cycles regular', 'cycles irregular', 'waking at night'] },
    { n: 'Pain character and relation to periods', m: ['pain starts before the period', 'pain radiating'] },
    { n: 'Dyspareunia and bowel symptoms', m: ['dyspareunia', 'dyschezia'] },
    { n: 'Pallor, BMI, hirsutism, thyroid', m: ['pallor', 'obesity or hirsutism', 'thyroid'] },
    { n: 'Abdominal and bimanual examination', m: ['tender iliac fossae', 'tender, bulky, globular uterus', 'uterus: size'] },
    { n: 'Drug and bleeding disorder history', m: ['bleeding disorder history', 'on ocp, iucd or anticoagulants'] },
  ],
  viva: [
    { q: 'Give the PALM-COEIN classification.', a: 'Structural: Polyp, Adenomyosis, Leiomyoma, Malignancy and hyperplasia. Non-structural: Coagulopathy, Ovulatory dysfunction, Endometrial, Iatrogenic, Not yet classified.' },
    { q: 'What is the difference between primary and secondary dysmenorrhoea?', a: 'Primary: no pelvic pathology, starts within 1 to 2 years of menarche, due to prostaglandins. Secondary: due to pathology such as endometriosis, adenomyosis, fibroid or PID, starts later and is often progressive.' },
    { q: 'How do you treat ovulatory AUB?', a: 'Tranexamic acid and NSAIDs for acute control, cyclic progestins (medroxyprogesterone or norethisterone) or combined pills, LNG-IUS for long term, iron, and treatment of the cause (thyroid, PCOS).' },
    { q: 'How is endometriosis diagnosed and treated?', a: 'Suspected from pain, dyspareunia, dyschezia, infertility and nodularity in the pouch of Douglas; ultrasound shows endometriomas; laparoscopy is the gold standard. Treatment: NSAIDs, OCP or progestins, GnRH analogues, surgery.' },
    { q: 'When is endometrial sampling indicated?', a: 'Age 45 years or more, younger women with risk factors (obesity, PCOS, tamoxifen), persistent AUB, or failed medical treatment.' },
    { q: 'What investigations would you order?', a: 'Urine pregnancy test, CBC, TSH, coagulation profile when indicated, transvaginal ultrasound, and sampling or hysteroscopy as above.' },
  ],
}

const PMB: Ins = {
  hints: [
    { dx: 'Endometrial carcinoma / hyperplasia', why: 'Postmenopausal bleeding with obesity, diabetes, hypertension, nulliparity or late menopause.', any: ['obesity (bmi 30 or more)', 'diabetes mellitus', 'hypertension', 'nulliparity or low parity', 'late menopause', 'on tamoxifen', 'bulky uterus'], min: 3 },
    { dx: 'Atrophic vaginitis / endometritis', why: 'Light spotting with dryness and thin vaginal walls on speculum.', all: ['atrophic vaginitis on speculum'] },
    { dx: 'Carcinoma cervix', why: 'A growth or friable cervix needs biopsy.', any: ['cervical growth or polyp', 'offensive discharge', 'pap smear / cancer screening ever done'], min: 2 },
    { dx: 'Ovarian tumour (oestrogen secreting) or other pelvic mass', why: 'Adnexal mass with bleeding.', all: ['bulky uterus or adnexal mass'] },
    { dx: 'HRT or tamoxifen related bleeding', why: 'Drug-related endometrial stimulation.', any: ['on hormone replacement therapy', 'on tamoxifen'] , min: 1 },
  ],
  must: [
    { n: 'Years since menopause and bleeding pattern', m: ['years since menopause', 'spotting at first'] },
    { n: 'Risk factors: obesity, diabetes, hypertension, tamoxifen, HRT', m: ['obesity', 'diabetes mellitus', 'hypertension', 'on tamoxifen', 'on hormone replacement'] },
    { n: 'Weight loss, appetite, offensive discharge', m: ['loss of weight or appetite', 'offensive discharge'] },
    { n: 'Speculum: cervix and vaginal walls', m: ['atrophic vaginitis', 'cervical growth or polyp'] },
    { n: 'Bimanual: uterine size and adnexa', m: ['bulky uterus or adnexal mass'] },
    { n: 'Pap smear and family cancer history', m: ['pap smear', 'family history of endometrial'] },
  ],
  viva: [
    { q: 'Define postmenopausal bleeding.', a: 'Bleeding from the genital tract after 12 months of amenorrhoea in a woman of menopausal age. It is malignancy until proven otherwise.' },
    { q: 'What are the causes?', a: 'Atrophic vaginitis or endometritis (commonest), endometrial hyperplasia and carcinoma, endometrial and cervical polyps, cervical carcinoma, HRT or tamoxifen, ovarian tumours, and rarely bleeding disorders.' },
    { q: 'How do you investigate it?', a: 'Transvaginal ultrasound for endometrial thickness (4 mm or less is reassuring), endometrial sampling (Pipelle) or hysteroscopy-guided biopsy, Pap smear and cervical biopsy where a lesion is seen.' },
    { q: 'What are the risk factors for endometrial carcinoma?', a: 'Obesity, diabetes, hypertension, nulliparity, late menopause, early menarche, unopposed oestrogen, tamoxifen, PCOS and Lynch syndrome.' },
    { q: 'How is endometrial carcinoma treated?', a: 'Surgical staging: total hysterectomy with bilateral salpingo-oophorectomy, with pelvic lymph node assessment as indicated, followed by radiotherapy or chemotherapy by stage and grade.' },
    { q: 'What is the commonest histological type?', a: 'Endometrioid adenocarcinoma (type I), related to unopposed oestrogen; type II (serous, clear cell) is more aggressive.' },
  ],
}

const PCOS: Ins = {
  hints: [
    { dx: 'Polycystic ovary syndrome', why: 'Irregular cycles since menarche, hirsutism, acne, weight gain and polycystic ovaries (Rotterdam: 2 of 3).', any: ['irregular cycles since menarche', 'hirsutism', 'acne or oily skin', 'acanthosis nigricans', 'weight gain', 'raised testosterone', 'lh:fsh ratio raised', 'polycystic ovaries on ultrasound'], min: 3 },
    { dx: 'Hyperprolactinaemia', why: 'Galactorrhoea with amenorrhoea.', all: ['galactorrhoea'] },
    { dx: 'Thyroid disorder', why: 'Cycle irregularity with thyroid symptoms.', all: ['symptoms of thyroid disease'] },
    { dx: 'Premature ovarian insufficiency', why: 'Hot flushes or vaginal dryness with amenorrhoea.', all: ['hot flushes or vaginal dryness'] },
    { dx: 'Primary infertility, tubal factor', why: 'Past pelvic infection or blocked tubes.', any: ['tubal / pelvic infection history', 'both tubes patent on hsg'], min: 1 },
    { dx: 'Pregnancy (exclude first)', why: 'Any amenorrhoea needs a urine pregnancy test.', all: ['urine pregnancy test negative'] },
  ],
  must: [
    { n: 'Cycle length, amenorrhoea duration, weight change', m: ['cycle length', 'weight gain'] },
    { n: 'Hirsutism, acne, acanthosis, BMI', m: ['hirsutism', 'acne', 'acanthosis'] },
    { n: 'Galactorrhoea and thyroid symptoms', m: ['galactorrhoea', 'symptoms of thyroid'] },
    { n: 'Urine pregnancy test', m: ['urine pregnancy test'] },
    { n: 'Duration of infertility and coital history', m: ['unprotected intercourse for 12 months', 'inability to conceive'] },
    { n: "Husband's semen analysis and tubal patency", m: ['semen analysis', 'both tubes patent'] },
  ],
  viva: [
    { q: 'Define secondary amenorrhoea and its causes.', a: 'Absence of periods for 3 months in a woman with previously regular cycles (6 months if irregular). Pregnancy first, then PCOS, hypothalamic causes (stress, weight loss), hyperprolactinaemia, thyroid disease, premature ovarian insufficiency and Asherman syndrome.' },
    { q: 'How do you diagnose PCOS?', a: 'Rotterdam criteria, any 2 of 3: oligo- or anovulation, clinical or biochemical hyperandrogenism, polycystic ovaries on ultrasound (12 or more follicles of 2 to 9 mm or volume above 10 mL), after excluding other causes.' },
    { q: 'What is the progesterone challenge test?', a: 'Medroxyprogesterone 10 mg for 5 to 10 days. A withdrawal bleed means adequate oestrogen and an intact outflow tract; no bleed suggests low oestrogen or an outflow problem.' },
    { q: 'How do you treat PCOS?', a: 'Weight loss and exercise first. Combined pills for cycles and hirsutism, metformin for insulin resistance. For fertility, letrozole is first line (clomiphene is an alternative), then gonadotropins, laparoscopic ovarian drilling, IUI or IVF.' },
    { q: 'What are the long-term risks of PCOS?', a: 'Type 2 diabetes, metabolic syndrome, endometrial hyperplasia and carcinoma, cardiovascular disease, sleep apnoea and infertility.' },
    { q: 'Define infertility and give its basic work-up.', a: 'No conception after 12 months of regular unprotected intercourse (6 months over 35 years). Semen analysis, ovulation assessment (mid-luteal progesterone, follicular study), tubal patency (HSG), hormones (TSH, prolactin, FSH, LH, AMH) and pelvic ultrasound.' },
    { q: 'What is the WHO lower reference limit of semen?', a: 'Volume 1.4 mL, concentration 16 million/mL, total motility 42%, progressive motility 30%, normal morphology 4%, vitality 54%.' },
  ],
}

const OVARIAN: Ins = {
  hints: [
    { dx: 'Malignant ovarian tumour (epithelial)', why: 'Postmenopausal age, distension, weight loss, irregular fixed mass, ascites and pouch of Douglas nodules.', any: ['progressive abdominal distension', 'loss of weight', 'postmenopausal age', 'irregular surface and restricted mobility', 'ascites', 'nodules in the pouch of douglas', 'loss of appetite', 'family history of ovarian'], min: 3 },
    { dx: 'Benign ovarian cyst (serous or mucinous cystadenoma)', why: 'A smooth cystic mass arising from the pelvis, separate from the uterus.', any: ['mass arising from the pelvis', 'mass separate from the uterus', 'movement of mass not transmitted to the cervix', 'ascites'], min: 3 },
    { dx: 'Torsion of ovarian cyst', why: 'Sudden severe pain and vomiting with a tender adnexal mass.', all: ['sudden severe pain with vomiting'] },
    { dx: 'Functional or benign cyst in a young girl (dermoid, follicular)', why: 'A cystic mass in an adolescent is usually benign but needs tumour markers.', all: ['cystic mass in a young girl'] },
    { dx: 'Hormone-secreting tumour', why: 'Virilisation points to a sex cord-stromal tumour.', all: ['hirsutism / virilisation'] },
  ],
  must: [
    { n: 'Onset and progress of distension, weight and appetite', m: ['progressive abdominal distension', 'loss of weight', 'loss of appetite'] },
    { n: 'Palpation of the mass: arises from pelvis, mobility, surface', m: ['mass arising from the pelvis', 'irregular surface'] },
    { n: 'Ascites (shifting dullness, fluid thrill)', m: ['ascites'] },
    { n: 'Bimanual: relation to uterus, fornices, pouch of Douglas', m: ['mass separate from the uterus', 'nodules in the pouch of douglas'] },
    { n: 'Family history of ovarian and breast cancer', m: ['family history of ovarian'] },
    { n: 'Plan: ultrasound, CA-125, CT', m: ['ca-125'] },
  ],
  viva: [
    { q: 'How do you differentiate an ovarian from a uterine mass?', a: 'An ovarian mass is separate from the uterus on bimanual examination, does not move with the cervix when pulled, and may occupy a fornix; a uterine mass moves with the cervix. You cannot get below either, as both arise from the pelvis.' },
    { q: 'Classify ovarian tumours.', a: 'Surface epithelial (serous, mucinous, endometrioid, clear cell, Brenner), germ cell (dysgerminoma, teratoma, yolk sac), sex cord-stromal (granulosa, Sertoli-Leydig, fibroma), and metastatic (Krukenberg).' },
    { q: 'What is the Risk of Malignancy Index?', a: 'RMI = ultrasound score x menopausal status score x CA-125. An RMI above 200 suggests malignancy and warrants referral to a gynaecological oncology centre.' },
    { q: 'Which tumour markers do you use?', a: 'CA-125 for epithelial tumours, AFP and hCG for germ cell tumours, LDH for dysgerminoma, inhibin for granulosa cell tumours, CEA for mucinous tumours.' },
    { q: 'What is a Krukenberg tumour?', a: 'Bilateral metastatic ovarian tumour from a gastric (or other GI) primary, with signet ring cells.' },
    { q: 'What is the treatment of malignant ovarian cancer?', a: 'Surgical staging and cytoreduction (total hysterectomy, bilateral salpingo-oophorectomy, omentectomy, lymph node assessment), then platinum and taxane chemotherapy; PARP inhibitors in selected cases.' },
    { q: 'How do you manage an ovarian cyst in a young girl?', a: 'Ultrasound and tumour markers. Conservative cystectomy preserving the ovary in benign cysts, laparoscopy where possible, and urgent surgery for torsion.' },
  ],
}

const PROLAPSE_N: Ins = {
  hints: [
    { dx: 'Uterovaginal prolapse (third degree) with cystocele and rectocele', why: 'Mass coming out of the vagina, worse on standing, with urinary or bowel symptoms in a postmenopausal multipara.', any: ['pelvic heaviness', 'mass increases on standing', 'mass reduces on lying down', 'cervix is the leading part', 'cough impulse positive', 'cannot get above the mass', 'mass is reducible', 'prolapse in third degree'], min: 3 },
    { dx: 'Stress urinary incontinence with cystocele', why: 'Leakage on cough with loss of anterior wall rugosities.', any: ['stress incontinence', 'anterior vaginal wall rugosities lost'], min: 2 },
    { dx: 'Rectocele with obstructed defaecation', why: 'Constipation and incomplete evacuation.', all: ['constipation or incomplete evacuation'] },
    { dx: 'Decubitus ulcer on prolapse', why: 'Ulceration on an exposed cervix needs a biopsy if suspicious.', all: ['decubitus ulcer on the mass'] },
    { dx: 'Cervical elongation (differential)', why: 'Elongated cervix outside with a high fundus.', any: ['cannot get above the mass'], min: 1 },
  ],
  must: [
    { n: 'Mass character: reduces on lying, increases on straining', m: ['mass increases on standing', 'mass reduces on lying down'] },
    { n: 'Urinary symptoms: stress incontinence, retention', m: ['stress incontinence', 'difficulty in passing urine'] },
    { n: 'Bowel symptoms', m: ['constipation or incomplete evacuation'] },
    { n: 'Risk factors: home deliveries, menopause, chronic cough', m: ['home delivery', 'postmenopausal', 'chronic cough'] },
    { n: 'Examination: degree, cough impulse, ulcer', m: ['cough impulse', 'prolapse in third degree', 'decubitus ulcer'] },
    { n: 'Fitness for surgery', m: ['diabetes or hypertension'] },
  ],
  viva: [
    { q: 'Define and grade uterine prolapse.', a: 'Descent of the uterus down the vagina. 1st degree: cervix within the vagina. 2nd degree: cervix at the introitus. 3rd degree: cervix outside the introitus. 4th degree (procidentia): whole uterus outside. POP-Q is the modern quantification.' },
    { q: 'What are the supports of the uterus?', a: 'Upper: uterosacral, transverse cervical (Mackenrodt) and round ligaments. Middle: pelvic floor muscles (levator ani). Lower: perineal body and urogenital diaphragm.' },
    { q: 'What are the causes and predisposing factors?', a: 'Childbirth injury (multiparity, prolonged or home deliveries), menopausal atrophy, chronic cough, constipation, obesity, connective tissue weakness.' },
    { q: 'How do you differentiate prolapse from cervical elongation and chronic inversion?', a: 'In prolapse the fundus is not palpable above the cervix and you cannot get a finger above the mass; in elongation the uterus is high with an elongated cervix; in inversion a cup-shaped depression is felt per abdomen.' },
    { q: 'What is the treatment?', a: 'Conservative: pelvic floor exercises, ring pessary, oestrogen cream. Surgical: vaginal hysterectomy with pelvic floor repair (Manchester repair if the uterus is to be conserved), sacrospinous fixation, sacrocolpopexy.' },
    { q: 'What is the Manchester (Fothergill) operation?', a: 'Amputation of the cervix, shortening and fixing of the cardinal ligaments in front of the cervix, plus anterior colporrhaphy and colpoperineorrhaphy, in younger women who want to retain the uterus.' },
  ],
}

const ECTOPIC: Ins = {
  hints: [
    { dx: 'Ruptured tubal ectopic pregnancy', why: 'Missed period, sudden lower abdominal pain, shoulder-tip pain and shock with fornix fullness.', any: ['sudden severe lower abdominal pain', 'shoulder-tip pain', 'hypotension / shock', 'tachycardia', 'fornix fullness', 'cervical motion tenderness', 'pallor', 'abdominal tenderness and guarding', 'fainting or giddiness'], min: 4 },
    { dx: 'Unruptured ectopic pregnancy', why: 'Positive pregnancy test with unilateral pain and an empty uterus, stable haemodynamics.', any: ['urine pregnancy test positive', 'pain on one side', 'empty uterus with free fluid', 'serum beta-hcg raised', 'uterus smaller than period of amenorrhoea'], min: 3 },
    { dx: 'Threatened or incomplete abortion (differential)', why: 'Bleeding with cramping pain but a uterus of dates and a gestational sac.', all: ['urine pregnancy test positive'] },
    { dx: 'Ruptured corpus luteum cyst / torsion (differential)', why: 'Acute abdomen with a negative or early pregnancy.', all: ['sudden severe lower abdominal pain'] },
  ],
  must: [
    { n: 'Triad: amenorrhoea, pain, bleeding', m: ['sudden severe lower abdominal pain', 'scanty dark bleeding'] },
    { n: 'Risk factors: PID, previous ectopic, IUCD, tubal surgery', m: ['previous ectopic', 'previous pelvic inflammatory', 'iucd in situ', 'previous tubal surgery'] },
    { n: 'Vitals and signs of shock', m: ['tachycardia', 'hypotension', 'pallor'] },
    { n: 'Abdominal tenderness and guarding', m: ['abdominal tenderness and guarding'] },
    { n: 'Gentle bimanual: fornix, cervical motion tenderness', m: ['cervical motion tenderness', 'fornix fullness'] },
    { n: 'Urine pregnancy test and ultrasound', m: ['urine pregnancy test', 'empty uterus'] },
    { n: 'Rh status', m: ['rh-negative'] },
  ],
  viva: [
    { q: 'Define ectopic pregnancy and give the commonest site.', a: 'Implantation of the fertilised ovum outside the uterine cavity. Ampulla of the fallopian tube is the commonest site (about 70 to 80%), then isthmus, fimbria, ovary, cervix, interstitial and abdomen.' },
    { q: 'What are the risk factors?', a: 'Previous ectopic, PID or tubal infection (including TB), tubal surgery or sterilisation, IUCD in situ, assisted reproduction, smoking and endometriosis.' },
    { q: 'What is the classical presentation?', a: 'Amenorrhoea of 6 to 8 weeks, lower abdominal pain, and scanty dark vaginal bleeding; with rupture there is collapse, shoulder-tip pain, tenderness and fornix fullness.' },
    { q: 'How do you confirm the diagnosis?', a: 'Urine pregnancy test, serum beta-hCG, transvaginal ultrasound (empty uterus, adnexal mass, free fluid), culdocentesis showing non-clotting blood. A beta-hCG above the discriminatory zone (about 1500 to 2000 mIU/mL) with an empty uterus is ectopic until proven otherwise.' },
    { q: 'What are the criteria for medical management with methotrexate?', a: 'Haemodynamically stable, unruptured, mass under 3.5 to 4 cm, no fetal cardiac activity, beta-hCG below 5000 mIU/mL, reliable follow-up. Methotrexate 50 mg/m2 intramuscularly, repeat if the hCG fall is under 15% between day 4 and 7. Avoid folate and NSAIDs.' },
    { q: 'What is the surgical management?', a: 'Resuscitate. Laparoscopic or open salpingectomy in a ruptured case or if the other tube is healthy; salpingostomy to conserve the tube when the contralateral tube is damaged and fertility is desired (risk of persistent trophoblast).' },
    { q: 'Do you need anti-D?', a: 'Yes, in an Rh-negative woman (50 mcg or 300 mcg) within 72 hours.' },
  ],
}

/* ---------------- Obstetric topics ---------------- */

const ANAEMIA: Ins = {
  hints: [
    { dx: 'Iron deficiency anaemia in pregnancy', why: 'Fatigue, pallor, koilonychia and poor diet or irregular iron intake.', any: ['easy fatiguability', 'pallor of conjunctiva', 'koilonychia', 'angular stomatitis', 'pica', 'iron tablets not taken regularly', 'poor diet', 'giddiness', 'hb below 11'], min: 4 },
    { dx: 'Severe anaemia with cardiac failure', why: 'Breathlessness at rest, raised JVP, oedema and crepitations.', any: ['raised jvp', 'basal crepitations', 'pedal oedema', 'breathlessness on exertion', 'tachycardia and ejection systolic'], min: 3 },
    { dx: 'Haemoglobinopathy (thalassaemia / sickle cell)', why: 'Family history or microcytosis not responding to iron.', all: ['family history of thalassaemia'] },
    { dx: 'Megaloblastic anaemia (folate / B12)', why: 'Glossitis and poor diet, especially in multiparous women.', any: ['angular stomatitis / glossitis', 'poor diet'], min: 2 },
    { dx: 'Anaemia due to hookworm or blood loss', why: 'Worm infestation or heavy periods before pregnancy.', any: ['worm infestation', 'heavy periods before pregnancy'], min: 1 },
  ],
  must: [
    { n: 'Symptoms: fatigue, dyspnoea, palpitation', m: ['easy fatiguability', 'breathlessness on exertion', 'palpitations'] },
    { n: 'Diet and iron-folic acid compliance', m: ['poor diet', 'iron tablets not taken regularly'] },
    { n: 'Pallor, koilonychia, glossitis, oedema', m: ['pallor of conjunctiva', 'koilonychia', 'pedal oedema'] },
    { n: 'Pulse, BP, JVP and heart', m: ['tachycardia', 'raised jvp', 'vital signs'] },
    { n: 'Chest: crepitations', m: ['basal crepitations'] },
    { n: 'Interval, previous anaemia, worms, family history', m: ['short interval', 'previous severe anaemia', 'worm infestation', 'family history of thalassaemia'] },
    { n: 'Investigations: Hb, smear, ferritin', m: ['hb below 11', 'peripheral smear'] },
  ],
  viva: [
    { q: 'Define anaemia in pregnancy and grade it.', a: 'Hb below 11 g/dL in the first and third trimesters and below 10.5 g/dL in the second (WHO / ICMR: 11 g/dL). Mild 10 to 10.9, moderate 7 to 9.9, severe below 7, very severe below 4 g/dL.' },
    { q: 'Why is anaemia more common in pregnancy?', a: 'Haemodilution (plasma volume rises more than red cell mass), increased iron demand (about 1000 mg over pregnancy), poor diet, short birth intervals, worm infestation and repeated blood loss.' },
    { q: 'How do you treat mild to moderate anaemia?', a: '100 mg elemental iron with 500 mcg folic acid daily in oral form, preferably before meals with vitamin C; reassess Hb in 4 weeks (expected rise about 1 g/dL in 2 to 3 weeks); deworming after the first trimester.' },
    { q: 'When is parenteral iron used?', a: 'Intolerance or non-response to oral iron, moderate to severe anaemia in late pregnancy, or poor compliance. Iron sucrose or ferric carboxymaltose IV; iron deficit = weight (kg) x 2.3 x (target Hb minus actual Hb) + 500 mg.' },
    { q: 'When do you transfuse?', a: 'Hb below 5 g/dL at any time, Hb below 7 in late pregnancy (after 36 weeks) or with cardiac failure or active bleeding; use packed cells, slowly, with diuretic cover.' },
    { q: 'What are the effects on mother and baby?', a: 'Mother: preterm labour, pre-eclampsia, heart failure, PPH, sepsis, poor lactation. Baby: low birth weight, prematurity, stillbirth, iron deficiency.' },
    { q: 'How is anaemia prevented?', a: 'Iron and folic acid from the second trimester under the national programme (IFA 100 mg), dietary advice, birth spacing, deworming and early detection.' },
  ],
}

const GDM: Ins = {
  hints: [
    { dx: 'Gestational diabetes mellitus (diet controlled)', why: 'DIPSI 2-hour value of 140 mg/dL or more, risk factors, and managed by MNT.', any: ['dipsi 2-hour value', 'fasting glucose raised on ogtt', 'on medical nutrition therapy', 'obesity (bmi 25', 'family history of diabetes', 'previous gestational diabetes'], min: 3 },
    { dx: 'GDM requiring insulin', why: 'Poor control on diet alone with insulin started.', any: ['on insulin', 'hba1c raised', 'self-monitoring of blood sugar'], min: 2 },
    { dx: 'Pre-gestational diabetes (overt)', why: 'Early high HbA1c or fasting glucose and a previous diabetic history.', any: ['hba1c raised', 'family history of diabetes in parents', 'polyuria and polydipsia'], min: 2 },
    { dx: 'Macrosomia / polyhydramnios risk', why: 'Previous large baby or polyhydramnios.', any: ['previous macrosomic baby', 'polyhydramnios'], min: 1 },
    { dx: 'Urinary or vulvovaginal infection', why: 'Recurrent infection and glycosuria suggest hyperglycaemia.', any: ['recurrent urinary or vulvovaginal infection', 'glycosuria'], min: 1 },
  ],
  must: [
    { n: 'Risk factors: family history, previous GDM, obesity, big baby', m: ['family history of diabetes', 'previous gestational diabetes', 'previous macrosomic baby', 'obesity'] },
    { n: 'Symptoms: polyuria, polydipsia, infections', m: ['polyuria and polydipsia', 'recurrent urinary'] },
    { n: 'Diagnosis: DIPSI / OGTT values', m: ['dipsi 2-hour value', 'fasting glucose raised'] },
    { n: 'Treatment: MNT, insulin, self monitoring', m: ['on medical nutrition therapy', 'on insulin', 'self-monitoring'] },
    { n: 'Fundal height and liquor (macrosomia, polyhydramnios)', m: ['polyhydramnios', 'fundal height'] },
    { n: 'Fetal surveillance and postpartum OGTT', m: ['fetal growth scan', 'postpartum ogtt'] },
  ],
  viva: [
    { q: 'How is GDM diagnosed?', a: 'India (DIPSI): 75 g oral glucose irrespective of fasting, 2-hour venous plasma glucose 140 mg/dL or more. IADPSG / WHO 75 g OGTT: fasting 92 or more, 1 hour 180 or more, 2 hour 153 or more mg/dL (any one value).' },
    { q: 'Who should be screened and when?', a: 'All pregnant women at the first antenatal visit, repeated at 24 to 28 weeks if normal, and early in the presence of risk factors.' },
    { q: 'What are the glycaemic targets?', a: 'Fasting below 95, 1-hour post-meal below 140 and 2-hour post-meal below 120 mg/dL.' },
    { q: 'What is the management?', a: 'Medical nutrition therapy with 30 minutes of walking daily for 1 to 2 weeks; insulin if targets are not met (or metformin / glibenclamide as alternatives); fetal growth scans, kick counts and antenatal testing from 32 to 34 weeks.' },
    { q: 'When and how do you deliver?', a: 'Diet controlled with good control: up to 40 weeks. Insulin or poor control: 38 to 39 weeks. Caesarean if the estimated weight is above 4 to 4.5 kg. Control intrapartum glucose with an insulin / dextrose infusion.' },
    { q: 'What are the fetal and neonatal complications?', a: 'Macrosomia, shoulder dystocia, polyhydramnios, stillbirth, neonatal hypoglycaemia, respiratory distress, polycythaemia, jaundice and hypocalcaemia.' },
    { q: 'What follow-up is needed after delivery?', a: 'Stop insulin, 75 g OGTT at 6 to 12 weeks, and annual screening for life as there is a high risk of later type 2 diabetes.' },
  ],
}

const PIH: Ins = {
  hints: [
    { dx: 'Severe pre-eclampsia', why: 'BP 160/110 or more with headache, visual disturbance, epigastric pain or oliguria.', any: ['bp 160/110 or more', 'headache', 'blurring of vision', 'epigastric pain', 'reduced urine output', 'hyperreflexia / clonus', 'urine albumin 1+ or more'], min: 4 },
    { dx: 'Pre-eclampsia without severe features', why: 'BP 140/90 or more on two readings with proteinuria and oedema.', any: ['bp 140/90 or more', 'urine albumin 1+ or more', 'pedal oedema not relieved by rest', 'facial puffiness', 'primigravida'], min: 3 },
    { dx: 'Eclampsia (impending or established)', why: 'Convulsions with a hypertensive picture.', all: ['convulsions'] },
    { dx: 'Chronic hypertension with superimposed pre-eclampsia', why: 'Hypertension before 20 weeks or a history of chronic hypertension.', all: ['chronic hypertension'] },
    { dx: 'Gestational hypertension', why: 'New hypertension after 20 weeks without proteinuria.', any: ['bp 140/90 or more'], min: 1 },
    { dx: 'HELLP syndrome (to rule out)', why: 'Epigastric pain with severe hypertension needs liver enzymes and platelets.', all: ['epigastric pain'] },
  ],
  must: [
    { n: 'Headache, visual symptoms, epigastric pain, oliguria', m: ['headache', 'blurring of vision', 'epigastric pain', 'reduced urine output'] },
    { n: 'Risk factors: primigravida, previous PE, chronic HTN, twins', m: ['primigravida', 'previous pre-eclampsia', 'chronic hypertension', 'twin pregnancy'] },
    { n: 'BP recording on two occasions', m: ['bp 140/90', 'bp 160/110', 'vital signs'] },
    { n: 'Oedema and reflexes', m: ['pedal oedema', 'hyperreflexia'] },
    { n: 'Urine albumin', m: ['urine albumin'] },
    { n: 'Fetal growth: SFH vs gestation, FHS', m: ['fundal height smaller'] },
    { n: 'Treatment: MgSO4, antihypertensive, delivery plan', m: ['magnesium sulphate', 'antihypertensive'] },
  ],
  viva: [
    { q: 'Define pre-eclampsia.', a: 'New-onset hypertension (BP 140/90 mmHg or more on two readings 4 hours apart) after 20 weeks, with proteinuria (300 mg/24 h, or 1+ dipstick) or other end-organ dysfunction.' },
    { q: 'What are the severe features?', a: 'BP 160/110 or more, headache, visual disturbance, epigastric or right upper quadrant pain, oliguria (under 500 mL/day), pulmonary oedema, platelets under 100,000, raised liver enzymes, serum creatinine above 1.1 mg/dL, and eclampsia.' },
    { q: 'What is the pathogenesis?', a: 'Defective trophoblastic invasion of spiral arteries leads to placental ischaemia, release of anti-angiogenic factors (sFlt-1) and widespread endothelial dysfunction.' },
    { q: 'How do you give magnesium sulphate?', a: 'Pritchard: 4 g IV slowly plus 10 g IM (5 g in each buttock), then 5 g IM every 4 hours. Zuspan: 4 g IV loading then 1 g/hour infusion. Continue for 24 hours after delivery or the last fit. Monitor knee jerks, respiratory rate (above 16) and urine output (above 30 mL/hour); antidote is 10 mL of 10% calcium gluconate IV.' },
    { q: 'Which antihypertensives are used?', a: 'Labetalol (IV or oral), nifedipine (oral, short acting), methyldopa. Avoid ACE inhibitors and ARBs. Aim for a BP of 140-150 / 90-100 mmHg.' },
    { q: 'When do you deliver?', a: 'Severe features: stabilise and deliver after 34 weeks (earlier if unstable), non-severe: at 37 weeks. Mode depends on the Bishop score; induction is preferred if the condition allows. Give antenatal steroids before 34 weeks.' },
    { q: 'What is HELLP syndrome?', a: 'Haemolysis, Elevated Liver enzymes and Low Platelets, a severe variant of pre-eclampsia requiring urgent delivery.' },
  ],
}

const RH: Ins = {
  hints: [
    { dx: 'Rh-negative pregnancy, not isoimmunised', why: 'Rh-negative mother with Rh-positive husband and a negative indirect Coombs.', any: ['mother rh-negative', 'husband rh-positive', 'indirect coombs test done', 'anti-d advised at 28 weeks'], min: 3 },
    { dx: 'Rh isoimmunisation (sensitised)', why: 'Positive indirect Coombs or a history of affected babies.', any: ['indirect coombs test positive', 'previous baby with neonatal jaundice', 'previous intrauterine death or hydrops', 'fetal anaemia / hydrops'], min: 1 },
    { dx: 'Sensitising event risk', why: 'Previous abortion, ectopic or transfusion without anti-D.', any: ['previous abortion or ectopic without anti-d', 'previous blood transfusion'], min: 1 },
    { dx: 'Hydrops fetalis (severe fetal anaemia)', why: 'Hydrops on ultrasound with raised MCA Doppler.', any: ['fetal anaemia / hydrops', 'middle cerebral artery doppler'], min: 2 },
  ],
  must: [
    { n: "Mother's and husband's blood group", m: ['mother rh-negative', 'husband rh-positive'] },
    { n: 'Sensitising events and previous baby outcomes', m: ['previous abortion or ectopic', 'previous baby with neonatal jaundice', 'previous intrauterine death'] },
    { n: 'Anti-D history', m: ['anti-d given after the last delivery'] },
    { n: 'Indirect Coombs test and titre', m: ['indirect coombs'] },
    { n: 'Fetal assessment: MCA Doppler, hydrops', m: ['middle cerebral artery doppler', 'fetal anaemia'] },
    { n: 'Anti-D plan: 28 weeks and within 72 h', m: ['anti-d advised at 28 weeks', 'anti-d advised within 72 hours'] },
  ],
  viva: [
    { q: 'What is Rh isoimmunisation?', a: 'An Rh-negative mother forms anti-D antibodies after exposure to Rh-positive fetal red cells (fetomaternal haemorrhage). IgG antibodies cross the placenta in later pregnancies and cause haemolysis of fetal red cells.' },
    { q: 'What are the sensitising events?', a: 'Delivery, abortion, ectopic pregnancy, antepartum haemorrhage, amniocentesis, external version, abdominal trauma and mismatched transfusion.' },
    { q: 'How is anti-D prophylaxis given?', a: '300 microgram IM at 28 weeks and again within 72 hours of delivery if the baby is Rh-positive; also after any sensitising event (50 microgram up to 12 weeks, 300 microgram after). Use the Kleihauer-Betke test to estimate the dose after a large fetomaternal bleed.' },
    { q: 'How do you monitor a sensitised pregnancy?', a: 'Indirect Coombs titre every 4 weeks; if above the critical titre (1:16) or in a previously affected pregnancy, start MCA peak systolic velocity Doppler; amniocentesis (delta OD 450) is the older method.' },
    { q: 'What is the treatment of severe fetal anaemia?', a: 'Intrauterine intravascular transfusion (cordocentesis) with O-negative blood and delivery at 34 to 37 weeks when appropriate.' },
    { q: 'What is the effect on the newborn?', a: 'Haemolytic disease: anaemia, hydrops, jaundice, kernicterus. Treat with phototherapy, exchange transfusion and IVIG.' },
  ],
}

const APH: Ins = {
  hints: [
    { dx: 'Placenta praevia', why: 'Painless, bright-red, recurrent bleeding with a soft uterus and a high, floating head.', any: ['painless bleeding', 'bright red blood', 'recurrent episodes', 'soft, relaxed uterus', 'head high and floating', 'previous caesarean section', 'previous placenta praevia', 'bleeding stopped on its own'], min: 4 },
    { dx: 'Abruptio placentae (accidental haemorrhage)', why: 'Painful dark bleeding with a tense, woody uterus, hypertension and shock out of proportion to the blood loss.', any: ['painful bleeding', 'dark blood with clots', 'tense, tender, woody-hard uterus', 'shock out of proportion', 'hypertension / pre-eclampsia', 'history of trauma', 'fhs absent', 'fundal height more than period of gestation'], min: 4 },
    { dx: 'Concealed abruption with DIC risk', why: 'Large retroplacental clot with absent fetal heart.', all: ['fundal height more than period of gestation (concealed)'] },
    { dx: 'Vasa praevia / marginal bleed (differential)', why: 'Painless bleeding with fetal distress and a normal uterus.', any: ['sudden onset, soaked a pad'], min: 1 },
  ],
  must: [
    { n: 'Nature of bleeding: pain, colour, onset, recurrence', m: ['painless bleeding', 'painful bleeding', 'bright red blood', 'dark blood with clots'] },
    { n: 'Risk factors: trauma, hypertension, previous caesarean', m: ['history of trauma', 'hypertension', 'previous caesarean section'] },
    { n: 'Shock assessment: pulse, BP, pallor', m: ['shock out of proportion', 'vital signs'] },
    { n: 'Uterine tone: soft or woody, tenderness', m: ['soft, relaxed uterus', 'tense, tender'] },
    { n: 'Lie, presentation and FHS', m: ['head high', 'fhs absent'] },
    { n: 'Avoid per vaginal examination before ultrasound', m: ['per vaginal examination avoided'] },
    { n: 'Ultrasound localisation of placenta', m: ['ultrasound localisation'] },
  ],
  viva: [
    { q: 'Define antepartum haemorrhage and list the causes.', a: 'Bleeding from the genital tract after 28 weeks (period of viability) and before delivery. Causes: placenta praevia, abruptio placentae, vasa praevia, local lesions (cervical polyp, carcinoma, vaginitis) and unexplained marginal bleed.' },
    { q: 'How do you differentiate placenta praevia from abruption?', a: 'Praevia: painless, fresh, recurrent, soft uterus, malpresentation, the shock matches blood loss and FHS usually present. Abruption: painful, dark blood (may be concealed), tense woody uterus, shock out of proportion, hypertension, FHS often absent.' },
    { q: 'Why should a per vaginal examination not be done in APH?', a: 'It can provoke torrential haemorrhage in placenta praevia. Perform it only in the operating theatre under double set-up after localising the placenta.' },
    { q: 'Classify placenta praevia.', a: 'Type I (low-lying), II (marginal), III (partial central) and IV (complete central). Clinically, minor (I, II anterior) and major (II posterior, III, IV).' },
    { q: 'How is expectant management of praevia carried out?', a: 'For a stable woman before 37 weeks with minimal bleeding: admission, rest, blood group and cross-match, iron, antenatal steroids before 34 weeks, and delivery at 36 to 37 weeks by caesarean section.' },
    { q: 'What are the complications of abruption?', a: 'Hypovolaemic shock, Couvelaire uterus, DIC, acute renal failure, postpartum haemorrhage, Sheehan syndrome, fetal death.' },
    { q: 'What is the management of severe abruption?', a: 'Resuscitation, two large-bore lines, blood and clotting factors, urine output monitoring, and rapid delivery (vaginal if labour is advancing with fetal death, otherwise caesarean section), with active management of the third stage.' },
  ],
}

const MULTIPLE: Ins = {
  hints: [
    { dx: 'Twin pregnancy (dichorionic diamniotic)', why: 'Uterus larger than dates with three fetal poles and two heart sounds 10 beats apart.', any: ['uterus larger than period of gestation', 'over-distended abdomen', 'three fetal poles palpable', 'many small parts felt', 'two fetal heart sounds at different sites', 'heart rates differ by 10 beats', 'dichorionic diamniotic', 'twin pregnancy on early scan'], min: 4 },
    { dx: 'Monochorionic twins with TTTS risk', why: 'Monochorionic twins with growth discordance and polyhydramnios.', any: ['monochorionic twins', 'growth discordance', 'polyhydramnios'], min: 2 },
    { dx: 'Polyhydramnios (differential)', why: 'Large-for-date uterus with a tense abdomen and difficult palpation.', all: ['polyhydramnios'] },
    { dx: 'Twin pregnancy with non-cephalic first twin: caesarean likely', why: 'A non-cephalic leading twin usually means caesarean.', all: ['first twin not cephalic'] },
    { dx: 'Twin pregnancy with anaemia or pre-eclampsia', why: 'Both are commoner in twins.', all: ['anaemia or pre-eclampsia in this pregnancy'] },
  ],
  must: [
    { n: 'Fundal height larger than dates, girth', m: ['uterus larger than period of gestation', 'over-distended'] },
    { n: 'Palpation: three poles, many small parts', m: ['three fetal poles', 'many small parts'] },
    { n: 'Auscultation: two FHS and difference', m: ['two fetal heart sounds', 'heart rates differ'] },
    { n: 'Presentation of first twin', m: ['first twin cephalic', 'first twin not cephalic'] },
    { n: 'Chorionicity on first trimester scan', m: ['dichorionic', 'monochorionic'] },
    { n: 'Complications: anaemia, pre-eclampsia, polyhydramnios, growth', m: ['anaemia or pre-eclampsia', 'polyhydramnios', 'growth discordance'] },
  ],
  viva: [
    { q: 'How do you diagnose twins clinically?', a: 'Uterus larger than dates, more than two fetal poles, many small parts, two distinct fetal heart sounds with a silent zone and a rate difference of 10 or more beats, confirmed by ultrasound.' },
    { q: 'What is chorionicity and why is it important?', a: 'Determined best at 11 to 14 weeks (lambda sign for dichorionic, T sign for monochorionic). Monochorionic twins have shared circulation and risks of TTTS, TAPS, selective growth restriction and cord entanglement (monoamniotic), needing 2-weekly scans from 16 weeks.' },
    { q: 'What are the maternal complications of twins?', a: 'Hyperemesis, anaemia, pre-eclampsia, gestational diabetes, polyhydramnios, preterm labour, malpresentation, postpartum haemorrhage and operative delivery.' },
    { q: 'What is twin-to-twin transfusion syndrome?', a: 'In monochorionic twins, unbalanced shunting through placental anastomoses: donor oligohydramnios and growth restriction, recipient polyhydramnios and cardiac overload. Staged by Quintero; treated by laser ablation of anastomoses.' },
    { q: 'What is the timing of delivery?', a: 'Uncomplicated dichorionic: 37 to 38 weeks. Monochorionic diamniotic: 36 to 37 weeks. Monoamniotic: 32 to 34 weeks by caesarean section.' },
    { q: 'What is the mode of delivery?', a: 'Vaginal delivery if the first twin is cephalic; caesarean if the first twin is non-cephalic, monoamniotic, or for obstetric indications. Manage the third stage actively because of the high PPH risk.' },
    { q: 'What is the interlocking of twins?', a: 'A rare complication of breech first and vertex second twin where the chins lock, causing obstructed labour.' },
  ],
}

const BREECH: Ins = {
  hints: [
    { dx: 'Breech presentation (frank breech)', why: 'Hard, round, ballotable head at the fundus, soft broad pole at the brim and FHS above the umbilicus.', any: ['head felt at the fundus', 'soft broad mass at the pelvic brim', 'fhs best heard above the umbilicus', 'breech noted on scan', 'frank breech on ultrasound'], min: 3 },
    { dx: 'Breech with an underlying cause (praevia, polyhydramnios, anomaly)', why: 'Look for a cause: placenta praevia, polyhydramnios, uterine anomaly, fibroid, contracted pelvis.', any: ['placenta praevia', 'polyhydramnios or oligohydramnios', 'uterine anomaly or fibroid', 'contracted pelvis', 'twin pregnancy'], min: 1 },
    { dx: 'Breech suitable for external cephalic version', why: 'Term, extended breech with no contraindication.', all: ['external cephalic version considered'] },
    { dx: 'Breech needing caesarean section', why: 'Footling, contracted pelvis, previous caesarean or a contraindication.', any: ['elective caesarean planned', 'footling breech', 'contraindication to version present'], min: 1 },
  ],
  must: [
    { n: 'Palpation: fundal grip (head), pelvic grip (breech)', m: ['head felt at the fundus', 'soft broad mass'] },
    { n: 'Site of FHS (above the umbilicus)', m: ['fhs best heard above the umbilicus'] },
    { n: 'Type of breech on ultrasound', m: ['frank breech', 'complete breech', 'footling breech'] },
    { n: 'Look for the cause: placenta, liquor, uterus, pelvis', m: ['placenta praevia', 'polyhydramnios', 'contracted pelvis', 'uterine anomaly'] },
    { n: 'Pelvic assessment and estimated weight', m: ['contracted pelvis'] },
    { n: 'Plan: ECV or caesarean', m: ['external cephalic version', 'elective caesarean', 'vaginal breech delivery'] },
  ],
  viva: [
    { q: 'What are the types of breech?', a: 'Frank (extended legs, commonest, 60 to 70%), complete (flexed hips and knees), incomplete or footling (one or both feet presenting).' },
    { q: 'How do you diagnose breech on abdominal examination?', a: 'Fundal grip: hard, round, ballotable head. Pelvic grip: broad, soft, irregular breech not ballotable. FHS is heard above the umbilicus. Confirm by ultrasound.' },
    { q: 'What are the causes of breech?', a: 'Prematurity, multiple pregnancy, polyhydramnios, oligohydramnios, placenta praevia, contracted pelvis, uterine anomalies, fibroids, fetal anomalies (hydrocephalus, anencephaly) and a short cord.' },
    { q: 'What is external cephalic version?', a: 'Manual rotation of the fetus to a cephalic presentation through the abdomen, at 36 to 37 weeks (primigravida) or 37 weeks (multigravida), with tocolysis, ultrasound guidance and CTG before and after. Anti-D to Rh-negative mothers.' },
    { q: 'What are the contraindications to ECV?', a: 'Placenta praevia, antepartum haemorrhage, previous caesarean (relative), multiple pregnancy, oligohydramnios, ruptured membranes, fetal anomaly, hypertension and fetal distress.' },
    { q: 'What are the complications of vaginal breech delivery?', a: 'Cord prolapse, birth asphyxia, head entrapment, brachial plexus injury, intracranial haemorrhage, fractures and fetal organ injury.' },
    { q: 'Name the manoeuvres for breech delivery.', a: 'Spontaneous or assisted breech delivery (Lovset for arms, Mauriceau-Smellie-Veit for the after-coming head, Burns-Marshall, forceps to the after-coming head). Term Breech Trial recommends caesarean in most cases.' },
  ],
}

const LSCS: Ins = {
  hints: [
    { dx: 'Previous one LSCS, suitable for trial of labour (TOLAC)', why: 'A single lower-segment scar, interval 18 months or more, non-recurrent indication and normal pelvis.', any: ['one previous lscs', 'interval from last caesarean 18 months or more', 'previous vaginal delivery', 'indication persists in this pregnancy', 'scar healthy on inspection', 'pelvis adequate', 'trial of labour after caesarean planned'], min: 4 },
    { dx: 'Previous caesarean, needs elective repeat LSCS', why: 'Recurrent indication, two or more scars, classical scar or placenta praevia.', any: ['two or more previous caesareans', 'indication persists in this pregnancy', 'previous classical or unknown uterine scar', 'placenta praevia / low-lying placenta', 'elective repeat caesarean planned'], min: 2 },
    { dx: 'Impending scar rupture / scar dehiscence', why: 'Scar tenderness with pain or fetal distress.', all: ['scar tenderness present'] },
    { dx: 'Short inter-pregnancy interval risk', why: 'Interval under 18 months increases rupture risk.', all: ['interval from last caesarean less than 18 months'] },
  ],
  must: [
    { n: 'Indication, date and type of previous caesarean', m: ['indication of previous caesarean noted', 'one previous lscs'] },
    { n: 'Interval since last caesarean', m: ['interval from last caesarean'] },
    { n: 'Previous vaginal delivery and post-operative course', m: ['previous vaginal delivery', 'wound infection'] },
    { n: 'Scar: healthy and non-tender', m: ['scar healthy', 'scar tenderness'] },
    { n: 'Placenta site and pelvis', m: ['placenta praevia', 'pelvis adequate'] },
    { n: 'Plan: TOLAC or elective repeat, with facilities', m: ['trial of labour after caesarean', 'elective repeat', 'facilities for emergency'] },
  ],
  viva: [
    { q: 'What are the criteria for trial of labour after caesarean?', a: 'One previous lower segment caesarean, non-recurrent indication, interval of at least 18 months, singleton cephalic, adequate pelvis, estimated weight not excessive, no other contraindication, and facilities for an emergency caesarean.' },
    { q: 'What are the signs of scar rupture?', a: 'Scar tenderness, pain between contractions, vaginal bleeding, fetal heart abnormalities, recession of the presenting part, haematuria, maternal tachycardia and shock, and palpable fetal parts under the skin.' },
    { q: 'What is the risk of uterine rupture with TOLAC?', a: 'About 0.5 to 1% with a single low transverse scar; higher with induction, prostaglandins, oxytocin augmentation, short interval and classical scars.' },
    { q: 'How should labour be conducted after a previous caesarean?', a: 'Continuous electronic fetal monitoring, intravenous access, blood cross-matched, theatre on standby, avoid prostaglandins, careful oxytocin if needed, and early recourse to caesarean on failure to progress.' },
    { q: 'What are the contraindications to TOLAC?', a: 'Classical or T-shaped scar, previous rupture, two or more caesareans, contracted pelvis, placenta praevia, recurrent indication, and any other obstetric indication for caesarean.' },
    { q: 'What are the complications of repeat caesarean?', a: 'Adhesions, bladder or bowel injury, placenta praevia and accreta in later pregnancy, haemorrhage, hysterectomy and wound infection.' },
  ],
}

const CPD: Ins = {
  hints: [
    { dx: 'Cephalopelvic disproportion / contracted pelvis', why: 'Short stature, a head not engaged at term in a primigravida and a small pelvis on assessment.', any: ['height below 145 cm', 'primigravida with head not engaged at term', 'diagonal conjugate less than 11.5', 'obstetric conjugate less than 10', 'intertuberous diameter less than 8', 'subpubic angle acute', 'sacral promontory reached', 'side walls of the pelvis convergent', 'ischial spines prominent'], min: 3 },
    { dx: 'Rachitic or post-polio contracted pelvis', why: 'Past rickets, poliomyelitis, fracture or abnormal gait.', any: ['past rickets or poliomyelitis', 'fracture of pelvis', 'abnormal gait', 'spinal deformity'], min: 1 },
    { dx: 'Borderline pelvis: trial of labour', why: 'Borderline measurements with a normal-sized baby may be given a trial.', all: ['trial of labour planned'] },
    { dx: 'Large baby with CPD', why: 'A large estimated fetal weight adds to disproportion.', all: ['large baby estimated'] },
  ],
  must: [
    { n: 'Height and gait', m: ['height below 145', 'abnormal gait'] },
    { n: 'Past rickets, polio, fractures, spinal deformity', m: ['past rickets', 'fracture of pelvis', 'spinal deformity'] },
    { n: 'Head engagement at term in a primigravida', m: ['primigravida with head not engaged'] },
    { n: 'Pelvic assessment: DC, sacral promontory, spines, subpubic angle, intertuberous', m: ['diagonal conjugate', 'sacral promontory', 'ischial spines', 'subpubic angle', 'intertuberous'] },
    { n: 'Estimated fetal weight', m: ['large baby estimated'] },
    { n: 'Plan: trial of labour or elective caesarean', m: ['trial of labour planned', 'elective caesarean planned'] },
  ],
  viva: [
    { q: 'Define contracted pelvis.', a: 'A pelvis where one or more diameters are reduced by 1 cm or more, enough to interfere with normal labour. Brim contraction: AP below 10 cm obstetric conjugate or transverse below 12 cm. Outlet contraction: intertuberous below 8 cm.' },
    { q: 'What is the diagonal conjugate and obstetric conjugate?', a: 'Diagonal conjugate is the distance between the lower border of the symphysis pubis and the sacral promontory (normal 12 cm; palpable at 11.5 cm or less suggests contraction). Obstetric conjugate = diagonal conjugate minus 1.5 cm, normal 10.5 cm or more.' },
    { q: 'What are the causes of a contracted pelvis?', a: 'Rickets, osteomalacia, poliomyelitis, pelvic fractures, kyphoscoliosis, spondylolisthesis, hip dislocation, short stature (justo minor) and android pelvis.' },
    { q: 'How do you assess the outlet?', a: 'Intertuberous diameter by closed fist (normal 10 cm; 8 cm or less is contracted), subpubic angle (90 degrees or more), and the sacrococcygeal mobility.' },
    { q: 'What is a trial of labour?', a: 'A supervised labour in a woman with borderline pelvic contraction to see whether the head will descend. Given in a hospital with facilities, with a clear time limit and caesarean on failure.' },
    { q: 'What is the Müller-Munro Kerr method?', a: 'Impaction of the head into the pelvic brim by pushing the fetal head down with the abdominal hand while the vaginal fingers test whether the head overrides the symphysis, to detect disproportion.' },
  ],
}

const FGR: Ins = {
  hints: [
    { dx: 'Fetal growth restriction (FGR)', why: 'EFW below the 10th centile with a small SFH and reduced liquor.', any: ['reduced growth on serial ultrasound', 'sfh less than period of gestation', 'estimated fetal weight below the 10th centile', 'reduced liquor / oligohydramnios', 'reduced fetal movements', 'abnormal umbilical artery doppler'], min: 3 },
    { dx: 'Severe early-onset FGR with placental insufficiency', why: 'Absent or reversed end-diastolic flow, brain sparing and abnormal CTG.', any: ['absent or reversed end-diastolic flow', 'brain-sparing', 'abnormal ctg'], min: 2 },
    { dx: 'Maternal causes: hypertension, anaemia, poor nutrition', why: 'Common treatable causes.', any: ['hypertension / pre-eclampsia', 'anaemia or poor nutrition', 'smoking or tobacco'], min: 1 },
    { dx: 'Congenital infection or anomaly', why: 'Symmetrical FGR with anomaly on scan.', all: ['congenital infection / anomaly'] },
    { dx: 'FGR with previous caesarean scar', why: 'Delivery decision must account for the scar.', all: ['previous caesarean section (scar)'] },
  ],
  must: [
    { n: 'SFH against dates and fetal movements', m: ['sfh less than period of gestation', 'reduced fetal movements'] },
    { n: 'Risk factors: hypertension, anaemia, smoking, previous SGA', m: ['hypertension', 'anaemia or poor nutrition', 'smoking', 'previous small-for-dates'] },
    { n: 'Serial growth scans: EFW and liquor', m: ['estimated fetal weight below', 'reduced liquor'] },
    { n: 'Doppler studies: umbilical artery, MCA', m: ['umbilical artery doppler', 'brain-sparing', 'absent or reversed'] },
    { n: 'CTG / NST', m: ['abnormal ctg'] },
    { n: 'Steroids and plan for delivery', m: ['antenatal steroids given', 'delivery timed'] },
  ],
  viva: [
    { q: 'Define FGR and SGA.', a: 'FGR: failure of the fetus to reach its growth potential, usually estimated weight or abdominal circumference below the 10th centile (severe below the 3rd) with abnormal Doppler. SGA is a constitutionally small baby with normal Doppler.' },
    { q: 'What are the causes?', a: 'Maternal (hypertension, anaemia, malnutrition, smoking, chronic disease), placental (insufficiency, infarcts, abruption), fetal (aneuploidy, congenital anomalies, infections like TORCH) and multiple pregnancy.' },
    { q: 'What is symmetrical versus asymmetrical FGR?', a: 'Symmetrical: head, abdomen and femur are all reduced, usually early in pregnancy from intrinsic causes (infection, aneuploidy). Asymmetrical: abdominal circumference falls first, head is spared, due to placental insufficiency late in pregnancy.' },
    { q: 'How do you monitor FGR?', a: 'Serial growth scans every 2 weeks, liquor volume, umbilical artery Doppler (weekly or twice-weekly if abnormal), MCA Doppler, ductus venosus, CTG and biophysical profile, and fetal kick counts.' },
    { q: 'How do you time the delivery?', a: 'Normal Doppler: 37 weeks. Reduced end-diastolic flow: 34 to 36 weeks. Absent end-diastolic flow: 32 to 34 weeks. Reversed flow or abnormal ductus venosus: at 30 to 32 weeks. Give antenatal steroids and magnesium for neuroprotection before preterm delivery.' },
    { q: 'What is the prognosis?', a: 'Increased perinatal mortality, hypoxia, hypoglycaemia, hypothermia, necrotising enterocolitis, neurodevelopmental problems and adult metabolic disease (Barker hypothesis).' },
  ],
}

const CARDIAC: Ins = {
  hints: [
    { dx: 'Rheumatic heart disease: mitral stenosis in pregnancy', why: 'Mid-diastolic murmur with presystolic accentuation, loud S1, opening snap and a rheumatic history.', any: ['history of rheumatic fever', 'loud s1 with opening snap', 'mid-diastolic murmur at the apex', 'tapping apex beat', 'on benzathine penicillin', 'loud p2'], min: 3 },
    { dx: 'Mitral stenosis with pulmonary congestion / heart failure', why: 'Orthopnoea, PND, basal crepitations and raised JVP.', any: ['orthopnoea or paroxysmal nocturnal dyspnoea', 'basal crepitations', 'raised jvp', 'pedal oedema', 'haemoptysis', 'nyha class iii or iv'], min: 3 },
    { dx: 'Atrial fibrillation (needs anticoagulation)', why: 'An irregular pulse in mitral stenosis carries a high embolic risk.', any: ['irregular pulse (atrial fibrillation)', 'on anticoagulant'], min: 1 },
    { dx: 'Pulmonary hypertension', why: 'Loud P2 with severe symptoms carries high maternal mortality.', all: ['loud p2'] },
    { dx: 'Peripartum cardiomyopathy (differential)', why: 'New heart failure late in pregnancy without valvular disease.', any: ['raised jvp', 'orthopnoea'], min: 2 },
  ],
  must: [
    { n: 'Rheumatic fever history and penicillin prophylaxis', m: ['history of rheumatic fever', 'on benzathine penicillin'] },
    { n: 'Symptoms: dyspnoea, orthopnoea, PND, palpitations, syncope', m: ['breathlessness on exertion', 'orthopnoea', 'palpitations', 'syncope'] },
    { n: 'Pulse, JVP, oedema', m: ['irregular pulse', 'raised jvp', 'pedal oedema'] },
    { n: 'Cardiac auscultation', m: ['loud s1', 'mid-diastolic murmur', 'loud p2'] },
    { n: 'Chest: crepitations', m: ['basal crepitations'] },
    { n: 'NYHA class', m: ['nyha class'] },
    { n: 'Echocardiography and anticoagulation', m: ['echocardiography advised', 'on anticoagulant'] },
  ],
  viva: [
    { q: 'What is the NYHA classification?', a: 'Class I: no limitation. II: slight limitation, comfortable at rest. III: marked limitation, comfortable only at rest. IV: symptoms at rest. Classes III and IV carry a high risk, and pregnancy is contraindicated in pulmonary hypertension and severe stenosis.' },
    { q: 'Why is pregnancy risky in mitral stenosis?', a: 'Blood volume and heart rate rise, which shortens diastole, raises left atrial pressure and precipitates pulmonary oedema, especially at 28 to 34 weeks, in labour and just after delivery.' },
    { q: 'How is mitral stenosis managed in pregnancy?', a: 'Rest, salt restriction, diuretics and beta blockers (to lengthen diastole), penicillin prophylaxis, anticoagulation for AF or thrombus (LMWH, with warfarin avoided in the first trimester), and balloon valvotomy (PMBV) for refractory symptoms.' },
    { q: 'How is labour managed?', a: 'Vaginal delivery is preferred; assist the second stage with forceps or ventouse, avoid ergometrine, use oxytocin cautiously, labour in the left lateral position with oxygen, and give antibiotic prophylaxis. Caesarean for obstetric indications.' },
    { q: 'What are the dangerous periods?', a: '12 to 16 weeks, 28 to 34 weeks (peak volume), labour, and the immediate postpartum period (autotransfusion from uterine contraction).' },
    { q: 'What contraceptive advice would you give?', a: 'Permanent sterilisation after completing the family; IUCD or progestin-only methods; avoid oestrogen containing methods in the presence of pulmonary hypertension or AF.' },
  ],
}

/* ---------------- Family planning procedure records ---------------- */

const TUBECT: Ins = {
  hints: [
    { dx: 'Eligible for female sterilisation (tubectomy)', why: 'Married woman of reproductive age with a completed family, informed consent and pregnancy excluded.', any: ['family complete', 'written informed consent', 'pregnancy excluded', 'informed of permanence', 'married woman of reproductive age', 'youngest child older than one year'], min: 4 },
    { dx: 'Not fit for the procedure at present', why: 'Active infection or a bleeding disorder is a contraindication to the procedure.', all: ['no contraindication'] },
  ],
  must: [
    { n: 'Preliminary data, age and married life', m: ['age', 'married life'] },
    { n: 'Obstetric score and last delivery', m: ['obsg', 'gravida', 'last delivery'] },
    { n: 'Menstrual history and LMP', m: ['lmp', 'cycle'] },
    { n: 'Past illness: HT, DM, TB, previous surgery', m: ['hypertension', 'diabetes', 'tuberculosis', 'previous operations'] },
    { n: 'General, systemic and pelvic examination', m: ['vital signs', 'rs:', 'cvs:', 'per speculum', 'uterus'] },
    { n: 'Investigations: Hb, urine, VDRL, HIV, HBsAg', m: ['haemoglobin', 'urine albumin', 'vdrl', 'hiv test'] },
    { n: 'Counselling and consent', m: ['written informed consent', 'family complete'] },
    { n: 'Procedure details and follow-up', m: ['timing', 'technique', 'follow-up at 7 days'] },
  ],
  viva: [
    { q: 'What are the eligibility criteria for female sterilisation in India?', a: 'Married woman aged 22 to 49 years, with at least one living child older than one year, of sound mind, with informed written consent; the woman is not pregnant. Not eligible: unmarried, or with an active illness for which surgery is unsafe.' },
    { q: 'What are the timings of tubectomy?', a: 'Interval (any time in the first half of the cycle, or when pregnancy can be reasonably excluded), puerperal (within 48 hours of delivery, ideally 24 hours), post-abortal (within 7 days, if no infection) and concurrent with caesarean section.' },
    { q: 'Describe the steps of minilaparotomy (Pomeroy).', a: 'Empty bladder, local anaesthesia with sedation, 2.5 to 3 cm suprapubic incision (infraumbilical in puerperal cases), uterine elevator for the interval procedure, identification of the tube by fimbrial or Babcock forceps, lifting a loop in the mid isthmic part, ligation with absorbable suture (plain catgut) and excision of the loop, and inspection for bleeding before closing in layers.' },
    { q: 'What are the other techniques?', a: 'Irving, Uchida, Parkland, Falope ring and clip applications (Filshie, Hulka) performed by laparoscopy, and hysteroscopic methods (Essure, now discontinued).' },
    { q: 'What are the complications and failure rate?', a: 'Anaesthetic complications, bleeding, infection, bowel or bladder injury, and ectopic pregnancy. The failure rate is about 0.5 to 1% in the first year; advise returning if a period is missed.' },
    { q: 'What follow-up is advised?', a: 'Review at 7 days for the wound and stitch removal, and at 1 month; counselling on danger signs (fever, severe pain, discharge, missed period).' },
    { q: 'What is the Indian national compensation for sterilisation failure?', a: 'The Family Planning Insurance Scheme gives compensation for death, complications and failure (a registered failure after sterilisation).' },
  ],
}

const MTP: Ins = {
  hints: [
    { dx: 'First trimester MTP (suction / MVA)', why: 'Pregnancy under 12 weeks with an indication under the MTP Act and informed consent.', any: ['gestation less than 12 weeks', 'written informed consent', 'pregnancy confirmed intrauterine', 'suction / mva', 'm.r. (menstrual regulation)'], min: 3 },
    { dx: 'Medical abortion (mifepristone-misoprostol)', why: 'Early pregnancy up to 9 weeks managed with drugs.', any: ['medical abortion', 'options explained'], min: 2 },
    { dx: 'MTP for contraceptive failure with concomitant contraception', why: 'Offer a long-acting method at the time of the procedure.', any: ['contraceptive failure', 'copper iucd inserted', 'contraception counselled'], min: 2 },
    { dx: 'MTP in a minor or after rape (special indication)', why: 'Special consent and documentation rules apply.', any: ['minor (below 18 years)', 'pregnancy caused by rape or incest'], min: 1 },
  ],
  must: [
    { n: 'Complaints, LMP and period of amenorrhoea', m: ['amenorrhoea', 'lmp'] },
    { n: 'Obstetric history and previous abortions', m: ['obsg', 'spontaneous', 'induced'] },
    { n: 'General and pelvic examination, uterine size', m: ['vital signs', 'uterus', 'per vaginum'] },
    { n: 'Indication under the MTP Act', m: ['contraceptive failure', 'risk to physical health', 'fetal abnormality', 'unwanted pregnancy'] },
    { n: 'Counselling and written consent', m: ['written informed consent', 'options explained'] },
    { n: 'Ultrasound and Rh status', m: ['intrauterine by ultrasound', 'rh status checked'] },
    { n: 'Procedure details and contraception', m: ['method', 'concomitant contraceptive'] },
  ],
  viva: [
    { q: 'What are the indications under the MTP Act?', a: 'Risk to the life or grave injury to the physical or mental health of the woman; substantial risk of serious fetal abnormality; pregnancy caused by rape; failure of a contraceptive method used by a married woman (or her partner); and the women in special categories (minors, disabled, widowed).' },
    { q: 'What is the gestational limit under the MTP (Amendment) Act 2021?', a: 'Up to 20 weeks on the opinion of one registered medical practitioner; 20 to 24 weeks on the opinion of two practitioners for special categories (rape survivors, minors, disabled, change in marital status); above 24 weeks only for substantial fetal anomalies on a medical board decision.' },
    { q: 'Who can perform the MTP and where?', a: 'A registered medical practitioner with MTP training, in a government hospital or an approved private centre. Written consent of the woman is needed (guardian for a minor), and records are kept confidential.' },
    { q: 'What are the methods of first trimester MTP?', a: 'Medical: mifepristone 200 mg followed 24 to 48 hours later by misoprostol 800 microgram (up to 9 weeks). Surgical: manual vacuum aspiration or electric suction up to 12 weeks, with a cannula of size equal to the period of gestation in weeks.' },
    { q: 'What are the complications?', a: 'Haemorrhage, incomplete evacuation, infection, uterine perforation, cervical injury, failed abortion and ongoing pregnancy, and later Asherman syndrome.' },
    { q: 'What is menstrual regulation?', a: 'Early aspiration with a Karman cannula, within 6 to 8 weeks of the last period, without confirming pregnancy.' },
    { q: 'What post-abortion advice do you give?', a: 'Rest, expected bleeding for up to two weeks, danger signs, abstain from intercourse for two weeks, follow-up at 2 weeks, contraception immediately (IUCD or pills), and anti-D for Rh-negative women.' },
  ],
}

const IUCD: Ins = {
  hints: [
    { dx: 'Suitable candidate for IUCD insertion', why: 'Regular cycles, no pelvic infection or pregnancy, counselled and consenting.', any: ['pregnancy excluded', 'no active pelvic infection', 'written informed consent', 'contraceptive options explained', 'side effects explained', 'expulsion and perforation risk explained'], min: 4 },
    { dx: 'Postpartum or post-abortal IUCD', why: 'Insertion within 48 hours of delivery or immediately after an abortion.', any: ['postpartum (within 48 hours)', 'post-abortal', 'intra-caesarean'], min: 1 },
    { dx: 'LNG-IUS for heavy periods and contraception', why: 'Reduces menstrual loss.', all: ['lng-ius'] },
  ],
  must: [
    { n: 'Age, parity, number and age of living children', m: ['deliveries', 'living children'] },
    { n: 'Menstrual history and LMP', m: ['lmp', 'cycle'] },
    { n: 'General and pelvic examination', m: ['vital signs', 'per speculum', 'uterus'] },
    { n: 'Investigations', m: ['urine albumin', 'haemoglobin'] },
    { n: 'Counselling about options, side effects and consent', m: ['contraceptive options explained', 'written informed consent'] },
    { n: 'Procedure: timing, device, sound length, threads', m: ['timing', 'device', 'uterine sound', 'threads'] },
    { n: 'Follow-up schedule', m: ['follow-up'] },
  ],
  viva: [
    { q: 'What are the types of IUCD?', a: 'Copper T 380A (10 years), Copper T 375 multiload (5 years), CuT 200 (3 years) and LNG-IUS (Mirena, 5 years). Inert (Lippes loop) is obsolete.' },
    { q: 'What is the mechanism of action?', a: 'Copper devices cause a sterile inflammatory reaction in the endometrium that is toxic to sperm and ova and interferes with implantation; LNG-IUS thickens cervical mucus and thins the endometrium.' },
    { q: 'When can an IUCD be inserted?', a: 'Interval: within 12 days of the start of menses (or any time pregnancy is reasonably excluded), postpartum within 48 hours, post-abortal immediately, or at caesarean section.' },
    { q: 'What are the contraindications?', a: 'Pregnancy, active pelvic infection, undiagnosed genital bleeding, suspected genital malignancy, distorted uterine cavity, Wilson disease (copper) and untreated cervicitis.' },
    { q: 'What are the side effects and complications?', a: 'Pain, increased menstrual bleeding, PID, expulsion, perforation, ectopic pregnancy (the absolute risk is lower than without contraception), and pregnancy with the device in situ.' },
    { q: 'Describe the insertion technique.', a: 'Bimanual to check size and position; speculum, clean the cervix with antiseptic, hold the anterior lip with a vulsellum, sound the uterus, load the device within its sheath (no-touch technique), insert and withdraw the sheath, trim the threads to 2 to 3 cm.' },
    { q: 'What follow-up is advised?', a: 'After the first menses or 4 to 6 weeks, to check the threads, then yearly. Advise the woman to return for pain, fever, foul discharge or a missed period.' },
  ],
}

/* ---------------- Labour and added gynaecology topics ---------------- */

const LABOUR: Ins = {
  hints: [
    { dx: 'Latent phase of the first stage of labour', why: 'Cervix up to 3 cm dilated with irregular or mild contractions.', any: ['cervical dilatation (cm) 0 to 1', 'cervical dilatation (cm) 2', 'cervical dilatation (cm) 3'], min: 1 },
    { dx: 'Active phase of the first stage of labour', why: 'Cervix 4 cm or more with regular strong contractions and descent.', any: ['cervical dilatation (cm) 4', 'cervical dilatation (cm) 5', 'cervical dilatation (cm) 6', 'cervical dilatation (cm) 7', 'cervical dilatation (cm) 8', 'cervical dilatation (cm) 9'], min: 1 },
    { dx: 'Second stage of labour (fully dilated)', why: 'Cervix fully dilated at 10 cm.', any: ['cervical dilatation (cm) 10'], min: 1 },
    { dx: 'Meconium-stained liquor: possible fetal compromise', why: 'Needs continuous fetal monitoring and readiness for neonatal resuscitation.', any: ['liquor meconium-stained'], min: 1 },
    { dx: 'Premature rupture of membranes', why: 'Leaking with ruptured membranes before contractions.', any: ['membranes ruptured', 'leaking per vagina'], min: 2 },
    { dx: 'Cord prolapse: an obstetric emergency', why: 'Cord felt on vaginal examination.', any: ['cord felt'], min: 1 },
    { dx: 'Occipito-posterior position: prolonged labour likely', why: 'Back pain, slow progress and a posterior denominator.', any: ['position (denominator) occipito-posterior'], min: 1 },
    { dx: 'Hypertensive disorder in labour', why: 'Raised BP with headache, blurred vision or oedema.', any: ['headache / blurring of vision', 'headache', 'facial puffiness'], min: 2 },
    { dx: 'Antepartum haemorrhage in labour', why: 'Bleeding beyond show: no vaginal examination until praevia is excluded.', any: ['bleeding on glove', 'bleeding per vagina'], min: 1 },
  ],
  must: [
    { n: 'Obstetric score, LMP and EDD', m: ['gravida', 'lmp'] },
    { n: 'Booking, antenatal visits and complications', m: ['booked', 'antenatal complications'] },
    { n: 'Vital signs', m: ['vital signs'] },
    { n: 'Fundal height, lie and presentation', m: ['lie', 'presentation'] },
    { n: 'Engagement of the head', m: ['engagement'] },
    { n: 'Contractions: frequency and duration', m: ['number of contractions in 10 minutes', 'duration of each contraction'] },
    { n: 'Fetal heart sounds', m: ['fetal heart', 'fhs'] },
    { n: 'Per vaginal: dilatation, effacement, station', m: ['cervical dilatation (cm)', 'effacement', 'station of the presenting part'] },
    { n: 'Membranes and liquor', m: ['membranes', 'liquor'] },
    { n: 'Position and pelvic assessment', m: ['position (denominator)', 'clinical pelvic assessment'] },
    { n: 'Partogram plotted', m: ['partogram notes'] },
  ],
  viva: [
    { q: 'Define labour and name its stages.', a: 'Labour is the process by which the fetus, placenta and membranes are expelled after viability with regular contractions and progressive cervical dilatation. First stage: onset of true labour to full dilatation (latent up to 6 cm in current WHO labour care guide, active after). Second: full dilatation to delivery of the baby. Third: delivery of the baby to delivery of the placenta. Fourth: the first hour after delivery.' },
    { q: 'What is the partogram and how is it used?', a: 'A graphic record of labour: cervical dilatation against time with an alert line (1 cm per hour) and an action line 4 hours to its right, descent of the head in fifths, contractions, FHR, liquor, moulding, oxytocin and maternal vitals. Crossing the alert line prompts evaluation; crossing the action line requires intervention.' },
    { q: 'Describe the mechanism of labour in vertex presentation.', a: 'Engagement, descent, flexion, internal rotation, crowning, extension, restitution, external rotation (shoulders rotate), and lateral flexion for delivery of the shoulders and body.' },
    { q: 'What is active management of the third stage of labour?', a: 'Oxytocin 10 IU IM within one minute of birth, controlled cord traction after signs of separation while guarding the uterus, and uterine massage after delivery of the placenta. It reduces postpartum haemorrhage.' },
    { q: 'What are the signs of fetal distress in labour?', a: 'FHR below 110 or above 160 per minute, late or variable decelerations, reduced variability, and meconium-stained liquor. Manage with left lateral position, oxygen, stopping oxytocin, treating hypotension and delivering promptly if not corrected.' },
    { q: 'How do you assess the pelvis clinically?', a: 'Inlet: sacral promontory not reached on PV. Cavity: sacral curve, ischial spines, side walls. Outlet: subpubic angle (at least 90 degrees), intertuberous diameter (at least 8 cm) and the sacrococcygeal mobility.' },
    { q: 'What are the indications for an episiotomy?', a: 'Instrumental delivery, shoulder dystocia, breech delivery, rigid perineum, previous perineal repair, and imminent tear in a primigravida with fetal distress. Mediolateral is preferred in India.' },
    { q: 'What is the Bishop score?', a: 'It rates dilatation, effacement, station, consistency and position of the cervix. A score of 8 or more predicts a successful induction.' },
  ],
}

const LAB_NORMAL: Ins = {
  hints: [
    { dx: 'Term pregnancy in normal spontaneous labour', why: 'Term, singleton vertex, spontaneous onset with expected progress.', any: ['term gestation', 'singleton, vertex, longitudinal lie', 'spontaneous onset of regular contractions', 'cervical dilatation progressing', 'liquor clear', 'fhs between 110 and 160', 'head engaged'], min: 4 },
    { dx: 'Normal vaginal delivery with complete third stage', why: 'Delivered vaginally with active management and a complete placenta.', any: ['delivered by normal vaginal delivery', 'active management of third stage done', 'placenta and membranes complete', 'blood loss under 500', 'baby cried immediately'], min: 3 },
  ],
  must: [
    { n: 'Onset, frequency and duration of labour pains', m: ['spontaneous onset', 'number of contractions in 10 minutes'] },
    { n: 'Per vaginal findings and progress on the partogram', m: ['cervical dilatation (cm)', 'plotted on the partogram'] },
    { n: 'FHS monitored', m: ['fhs between 110 and 160'] },
    { n: 'Second stage details and episiotomy', m: ['episiotomy given', 'delivered by normal vaginal delivery'] },
    { n: 'Active management of the third stage', m: ['active management of third stage'] },
    { n: 'Baby: Apgar, weight and early breast feeding', m: ['baby cried immediately', 'breast feeding initiated'] },
  ],
  viva: [
    { q: 'What are the signs of onset of true labour?', a: 'Regular, increasingly frequent and painful contractions with progressive cervical dilatation and effacement, show, and descent of the presenting part. False labour pains are irregular and do not dilate the cervix.' },
    { q: 'What is the normal rate of cervical dilatation?', a: 'Active phase: at least 1 cm per hour in a primigravida and a little faster in a multipara. Second stage: up to 2 hours in a primigravida and 1 hour in a multipara (longer with epidural).' },
    { q: 'Describe the care of the newborn at birth.', a: 'Dry and keep warm, assess breathing and tone, clear airway only if needed, delayed cord clamping at 1 to 3 minutes, skin-to-skin contact, initiate breastfeeding within an hour, vitamin K, and BCG, OPV zero and hepatitis B at birth.' },
    { q: 'How do you diagnose the second stage?', a: 'Fully dilated cervix on vaginal examination, with bearing-down efforts, bulging perineum, gaping anus and visible head at the vulva.' },
    { q: 'What are the signs of placental separation?', a: 'Gush of blood, lengthening of the cord, the uterus becoming firm, globular and rising up in the abdomen.' },
    { q: 'What is the Apgar score?', a: 'Appearance, pulse, grimace, activity and respiration, each scored 0 to 2, recorded at 1 and 5 minutes. 7 to 10 is normal, 4 to 6 moderate depression, 0 to 3 severe depression.' },
  ],
}

const LAB_PRECIP: Ins = {
  hints: [
    { dx: 'Precipitate labour', why: 'Labour completed within 3 hours with strong contractions in a multipara.', any: ['total duration of labour under 3 hours', 'multipara', 'strong, frequent contractions', 'small baby or roomy pelvis', 'previous history of precipitate labour', 'delivery occurred before reaching'], min: 3 },
    { dx: 'Genital tract trauma / PPH after precipitate labour', why: 'Rapid expulsion causes cervical and perineal tears and atony.', any: ['cervical tears', 'perineal tears', 'postpartum haemorrhage', 'atonic uterus'], min: 1 },
    { dx: 'Neonatal injury or asphyxia', why: 'Sudden descent can cause intracranial injury and asphyxia.', any: ['baby: cord tear', 'birth asphyxia'], min: 1 },
  ],
  must: [
    { n: 'Total duration of labour', m: ['total duration of labour under 3 hours'] },
    { n: 'Parity and past similar history', m: ['multipara', 'previous history of precipitate labour'] },
    { n: 'Check for cervical and vaginal tears', m: ['check for cervical and vaginal tears', 'cervical tears'] },
    { n: 'Third stage and blood loss', m: ['postpartum haemorrhage', 'atonic uterus'] },
    { n: 'Baby examination', m: ['baby:', 'birth asphyxia'] },
  ],
  viva: [
    { q: 'Define precipitate labour.', a: 'Expulsion of the fetus within 3 hours of the onset of contractions (some define it as a rate of cervical dilatation over 5 cm per hour in a primigravida or 10 cm in a multipara).' },
    { q: 'What are the causes?', a: 'Multiparity, a roomy pelvis, a small baby, and very efficient uterine contractions (strong and frequent), including overuse of oxytocic drugs.' },
    { q: 'What are the maternal complications?', a: 'Cervical, vaginal and perineal tears, uterine atony with postpartum haemorrhage, amniotic fluid embolism, and, rarely, uterine rupture or inversion.' },
    { q: 'What are the fetal complications?', a: 'Birth asphyxia from tetanic contractions, intracranial haemorrhage, cord tear, bruising and injury from delivery on the ground, and infection.' },
    { q: 'How would you manage it?', a: 'Left lateral position, avoid oxytocics, discourage pushing, tocolytic for tetanic contractions if the baby is not yet delivered, control the delivery of the head, inspect the genital tract after delivery and give active management of the third stage.' },
    { q: 'What is the role of the attendant at a precipitate delivery?', a: 'Control the delivery of the head to avoid sudden expulsion and tears, support the perineum, check for cord round the neck, give active management of the third stage, and examine the baby and the genital tract afterwards.' },
  ],
}

const LAB_PROLONGED: Ins = {
  hints: [
    { dx: 'Prolonged labour (first stage arrest / protracted)', why: 'More than 18 hours or crossing the action line, with slow cervical dilatation.', any: ['duration of labour over 18 hours', 'cervical dilatation less than 1 cm per hour', 'partogram crossed the alert line', 'partogram crossed the action line', 'primigravida'], min: 2 },
    { dx: 'Obstructed labour', why: 'Maternal exhaustion, Bandl ring, tender lower segment, marked caput and moulding.', any: ['bandl', 'tender lower segment', 'caput and moulding marked', 'maternal exhaustion', 'contracted pelvis'], min: 3 },
    { dx: 'Cephalopelvic disproportion', why: 'A contracted pelvis or large baby with arrest despite good contractions.', any: ['contracted pelvis', 'large baby', 'caput and moulding marked'], min: 2 },
    { dx: 'Malposition (occipito-posterior)', why: 'Passenger factor with back pain and slow progress.', any: ['occipito-posterior'], min: 1 },
    { dx: 'Inefficient uterine action', why: 'Poor contractions with a normal pelvis and a normal fetus.', any: ['inefficient uterine action'], min: 1 },
    { dx: 'Fetal distress in prolonged labour', why: 'Meconium and abnormal FHS.', any: ['meconium-stained liquor', 'fetal distress'], min: 1 },
  ],
  must: [
    { n: 'Duration of labour and partogram', m: ['duration of labour over 18 hours', 'partogram crossed'] },
    { n: 'Three Ps: power, passenger, passage', m: ['inefficient uterine action', 'occipito-posterior', 'contracted pelvis'] },
    { n: 'Maternal condition: dehydration, ketosis, pulse', m: ['maternal exhaustion', 'vital signs'] },
    { n: 'Bandl ring and lower segment tenderness', m: ['bandl', 'tender lower segment'] },
    { n: 'Caput and moulding', m: ['caput and moulding marked'] },
    { n: 'Fetal condition', m: ['fetal distress', 'meconium'] },
    { n: 'Decision for caesarean section', m: ['decision for emergency caesarean'] },
  ],
  viva: [
    { q: 'Define prolonged labour.', a: 'Labour lasting more than 18 hours (some say 12 hours of the active phase). On the partogram: the cervical dilatation crossing the alert line, and action line needs intervention.' },
    { q: 'What are the causes?', a: 'The 3 Ps: Power (inefficient uterine action), Passenger (malposition, malpresentation, large baby, hydrocephalus), Passage (contracted pelvis, cervical dystocia, pelvic tumour).' },
    { q: 'What are the signs of obstructed labour?', a: 'Maternal distress, dehydration, tachycardia, fever, tender lower segment, Bandl pathological retraction ring, oedematous cervix and vulva, severe caput and moulding, passage of meconium and dark scanty urine.' },
    { q: 'How do you manage it?', a: 'Correct dehydration and ketosis, analgesia, assess the pelvis and presentation, ARM and oxytocin if the cause is inefficient uterine action and there is no obstruction, and caesarean section for obstruction or fetal distress.' },
    { q: 'What are the complications?', a: 'Maternal: infection, uterine rupture, vesicovaginal fistula, PPH, exhaustion. Fetal: asphyxia, intracranial injury, sepsis, death.' },
    { q: 'What is cephalopelvic disproportion?', a: 'Failure of the fetal head to pass the pelvis due to size or position mismatch, diagnosed by failure of descent with good contractions, caput and moulding. Manage by caesarean.' },
  ],
}

const LAB_INSTR: Ins = {
  hints: [
    { dx: 'Forceps delivery for prolonged second stage / maternal exhaustion', why: 'Second stage arrest with the head low and the prerequisites fulfilled.', any: ['prolonged second stage', 'maternal exhaustion', 'low forceps', 'outlet forceps', 'cervix fully dilated', 'head engaged and at least +2'], min: 3 },
    { dx: 'Vacuum delivery', why: 'Ventouse applied with the head low.', any: ['vacuum applied', 'chignon'], min: 1 },
    { dx: 'Fetal distress in the second stage', why: 'Abnormal FHR needing a quick assisted delivery.', any: ['fetal distress in the second stage'], min: 1 },
    { dx: 'Shortening of the second stage for a maternal condition', why: 'Heart disease, hypertension or eclampsia.', any: ['maternal cardiac disease or hypertension'], min: 1 },
  ],
  must: [
    { n: 'Indication for the instrumental delivery', m: ['prolonged second stage', 'fetal distress in the second stage', 'maternal exhaustion'] },
    { n: 'Prerequisites: fully dilated, ruptured membranes, engaged, position known', m: ['cervix fully dilated', 'membranes ruptured', 'head engaged', 'position known'] },
    { n: 'Bladder emptied and analgesia', m: ['bladder emptied', 'adequate analgesia'] },
    { n: 'Type of instrument and episiotomy', m: ['forceps', 'vacuum applied', 'episiotomy given'] },
    { n: 'Check for tears', m: ['cervical or vaginal tear'] },
    { n: 'Baby check for injuries', m: ['baby:'] },
  ],
  viva: [
    { q: 'What are the prerequisites for forceps delivery?', a: 'Fully dilated cervix, ruptured membranes, engaged head with known position, empty bladder, adequate analgesia, adequate pelvis, a trained operator, and facility for caesarean back-up.' },
    { q: 'What are the indications for forceps?', a: 'Prolonged second stage, maternal exhaustion, maternal cardiac disease or hypertension, fetal distress in the second stage, after-coming head of the breech, and delivery of a head in a caesarean with a deeply engaged head.' },
    { q: 'Classify forceps delivery.', a: 'Outlet: the scalp visible without separating the labia, skull on the pelvic floor. Low: leading point of the skull at +2 station or more. Mid: head engaged, above +2. High forceps is obsolete.' },
    { q: 'What are the contraindications to vacuum?', a: 'Face or breech presentation, gestation under 34 weeks (relative), incompletely dilated cervix, suspected fetal coagulopathy or bleeding disorders, and disproportion.' },
    { q: 'What are the complications of forceps?', a: 'Maternal: perineal tears, cervical and vaginal tears, PPH, bladder injury. Fetal: facial marks, facial nerve palsy, cephalhaematoma, skull fracture, intracranial haemorrhage.' },
    { q: 'What are the complications of vacuum?', a: 'Chignon, cephalhaematoma, subgaleal haemorrhage, retinal haemorrhage, scalp lacerations, and neonatal jaundice.' },
  ],
}

const LAB_PPH: Ins = {
  hints: [
    { dx: 'Primary postpartum haemorrhage due to uterine atony', why: 'A soft, relaxed uterus with continued bleeding.', any: ['uterus soft and relaxed', 'polyhydramnios / twins / big baby', 'prolonged labour', 'grand multipara', 'anaemia'], min: 2 },
    { dx: 'PPH due to retained placenta or products', why: 'Placenta not delivered or incomplete on inspection.', any: ['placenta retained', 'placenta or membranes incomplete'], min: 1 },
    { dx: 'PPH due to genital tract trauma', why: 'Bleeding with a contracted uterus after a rapid or instrumental delivery.', any: ['genital tract tear', 'perineal or vaginal haematoma', 'uterus contracted but bleeding continues'], min: 1 },
    { dx: 'PPH due to coagulopathy (DIC)', why: 'Bleeding with abruption, pre-eclampsia or sepsis.', any: ['coagulopathy', 'antepartum haemorrhage'], min: 1 },
  ],
  must: [
    { n: 'Estimated blood loss and vital signs', m: ['blood loss over', 'pulse and bp monitored'] },
    { n: 'Uterine tone', m: ['uterus soft and relaxed', 'uterus contracted but bleeding continues'] },
    { n: 'Placenta and membranes complete?', m: ['placenta retained', 'placenta or membranes incomplete'] },
    { n: 'Inspect cervix, vagina and perineum', m: ['genital tract tear'] },
    { n: 'Risk factors', m: ['prolonged labour', 'polyhydramnios', 'previous pph', 'anaemia'] },
    { n: 'Stepwise treatment', m: ['bimanual compression', 'oxytocin, ergometrine', 'tranexamic acid', 'balloon tamponade'] },
  ],
  viva: [
    { q: 'Define postpartum haemorrhage.', a: 'Blood loss of 500 mL or more after vaginal delivery (1000 mL or more after caesarean), or any blood loss that causes haemodynamic instability. Primary: within 24 hours. Secondary: 24 hours to 12 weeks.' },
    { q: 'What are the four Ts of causes?', a: 'Tone (atony, 70-80%), Tissue (retained placenta or products), Trauma (tears, haematoma, inversion, rupture) and Thrombin (coagulopathy).' },
    { q: 'How do you prevent PPH?', a: 'Active management of the third stage: oxytocin 10 IU IM within one minute, controlled cord traction and uterine massage; identify and treat risk factors such as anaemia.' },
    { q: 'Describe the stepwise management of atonic PPH.', a: 'Call for help, resuscitate (two large lines, fluids, blood), rub up a contraction and empty the bladder, oxytocin infusion, ergometrine 0.25 mg IM (not in hypertension), carboprost 250 microgram IM, misoprostol 800 microgram, tranexamic acid 1 g IV, bimanual compression, balloon tamponade, uterine artery ligation or B-Lynch, and hysterectomy as the last resort.' },
    { q: 'What are the contraindications to ergometrine?', a: 'Hypertension, pre-eclampsia, heart disease and retained placenta (before delivery of the placenta).' },
    { q: 'What is secondary PPH and its commonest cause?', a: 'Bleeding after 24 hours, most often from retained products or infection (endometritis). Treat with antibiotics, uterotonics and evacuation.' },
  ],
}

const LAB_BREECH: Ins = {
  hints: [
    { dx: 'Term breech in labour (vaginal breech delivery)', why: 'Breech with an adequate pelvis, a small baby and a flexed head.', any: ['breech diagnosed on abdominal and vaginal examination', 'frank breech', 'pelvis adequate', 'estimated fetal weight under 3.5', 'fetal head flexed', 'sacrum is the denominator', 'spontaneous or assisted breech delivery'], min: 3 },
    { dx: 'Footling or complete breech: caesarean preferred', why: 'Footling carries a risk of cord prolapse and entrapment.', any: ['footling breech', 'complete breech', 'emergency caesarean converted'], min: 1 },
    { dx: 'Complications of breech delivery', why: 'Cord prolapse, head entrapment, birth asphyxia.', any: ['cord prolapse', 'head entrapment', 'birth asphyxia'], min: 1 },
  ],
  must: [
    { n: 'Type of breech', m: ['frank breech', 'complete breech', 'footling breech'] },
    { n: 'Pelvis and estimated weight', m: ['pelvis adequate', 'estimated fetal weight'] },
    { n: 'Hands-off then manoeuvres', m: ['hands-off', 'lovset', 'mauriceau'] },
    { n: 'Episiotomy and cord care', m: ['episiotomy given', 'cord prolapse'] },
    { n: 'Baby assessment', m: ['birth asphyxia'] },
  ],
  viva: [
    { q: 'How do you recognise a breech on vaginal examination?', a: 'Soft irregular presenting part: the sacrum, ischial tuberosities and anus form a straight line (three bony points in a line), with no sutures or fontanelles. Meconium on the finger is normal in breech.' },
    { q: 'Describe the Lovset manoeuvre.', a: 'For delivery of extended arms: hold the fetus by the hips and rotate through 180 degrees so that the posterior shoulder becomes anterior, delivering the arm under the pubic arch, then rotate back to deliver the other arm.' },
    { q: 'Describe the Mauriceau-Smellie-Veit manoeuvre.', a: 'For the after-coming head: the baby lies astride the operator\'s forearm, the index and middle fingers on the maxilla maintain flexion, while the other hand\'s fingers hook on the shoulders and neck, and an assistant provides suprapubic pressure. The head is delivered by flexion with an upward swing.' },
    { q: 'When is a vaginal breech delivery acceptable?', a: 'Frank or complete breech, term, flexed head, estimated weight 2.5 to 3.5 kg, adequate pelvis, no other obstetric indication, an experienced attendant, and facilities for emergency caesarean.' },
    { q: 'What are the complications of breech delivery?', a: 'Cord prolapse, birth asphyxia, head entrapment, extended arms or nuchal arm, intracranial haemorrhage, brachial plexus injury, fractures, and abdominal organ injury.' },
    { q: 'What is the role of external cephalic version and the Term Breech Trial?', a: 'ECV at 36 to 37 weeks converts breech to vertex in about half of attempts. The Term Breech Trial (2000) favoured planned caesarean for term breech, reducing perinatal mortality; vaginal breech delivery is now reserved for selected cases.' },
  ],
}

const ADENO: Ins = {
  hints: [
    { dx: 'Adenomyosis', why: 'Progressive dysmenorrhoea and heavy periods in a multipara with a uniformly enlarged, tender, globular uterus.', any: ['progressively increasing dysmenorrhoea', 'heavy regular periods', 'multiparous woman', 'uniformly enlarged globular uterus', 'tender uterus, worse at periods', 'chronic pelvic pain', 'heterogeneous myometrium', 'age 35 to 50'], min: 4 },
    { dx: 'Fibroid uterus (differential)', why: 'An irregular enlarged uterus rather than a symmetric globular one.', any: ['coexisting fibroid or endometriosis'], min: 1 },
    { dx: 'Endometriosis (differential or coexisting)', why: 'Dyspareunia and chronic pelvic pain, with nodularity.', any: ['dyspareunia', 'chronic pelvic pain'], min: 2 },
    { dx: 'Anaemia from menorrhagia', why: 'Pallor with heavy bleeding.', any: ['pallor / anaemia'], min: 1 },
  ],
  must: [
    { n: 'Pattern of dysmenorrhoea and flow', m: ['progressively increasing dysmenorrhoea', 'heavy regular periods'] },
    { n: 'Dyspareunia and chronic pelvic pain', m: ['dyspareunia', 'chronic pelvic pain'] },
    { n: 'Obstetric history and previous uterine surgery', m: ['multiparous woman', 'previous uterine surgery'] },
    { n: 'Uterus: size, shape, tenderness', m: ['uniformly enlarged globular uterus', 'tender uterus'] },
    { n: 'Adnexa free', m: ['no separate mass in the adnexa'] },
    { n: 'Pallor', m: ['pallor / anaemia'] },
  ],
  viva: [
    { q: 'Define adenomyosis.', a: 'Presence of endometrial glands and stroma within the myometrium, with surrounding hypertrophy of the muscle, producing a diffusely enlarged uterus.' },
    { q: 'What is the classical clinical picture?', a: 'A multiparous woman aged 35 to 50 years with progressive secondary dysmenorrhoea, heavy regular periods, and a uniformly enlarged, globular, tender uterus up to 12 weeks size that is mobile.' },
    { q: 'How is it diagnosed?', a: 'Transvaginal ultrasound (heterogeneous myometrium, myometrial cysts, asymmetric wall thickening), MRI (thick junctional zone above 12 mm), and histology of the hysterectomy specimen, which is the gold standard.' },
    { q: 'How do you treat adenomyosis?', a: 'Medical: NSAIDs, tranexamic acid, LNG-IUS, progestins, combined pills, GnRH analogues. Surgical: hysterectomy for a completed family; uterine artery embolisation or adenomyomectomy where uterus must be conserved.' },
    { q: 'How do you differentiate adenomyosis from a fibroid?', a: 'Adenomyosis gives a symmetric, globular, tender uterus with prominent dysmenorrhoea; a fibroid gives an irregular, firm and non-tender nodular uterus, mostly with menorrhagia only.' },
    { q: 'What is the difference between adenomyosis and endometriosis?', a: 'In adenomyosis the ectopic endometrial tissue lies inside the myometrium (endometriosis interna). In endometriosis it lies outside the uterus (ovaries, pouch of Douglas, ligaments).' },
  ],
}

const PRIMAMEN: Ins = {
  hints: [
    { dx: 'Turner syndrome (gonadal dysgenesis, 45 X)', why: 'Short stature, webbed neck, shield chest and absent breast development with high FSH.', any: ['short stature', 'webbed neck', 'breast development absent', 'fsh raised', 'karyotype advised'], min: 3 },
    { dx: 'Mullerian agenesis (Mayer-Rokitansky-Kuster-Hauser)', why: 'Normal breast and hair with an absent uterus and a blind vagina.', any: ['breast development present', 'pubic and axillary hair present', 'blind vagina', 'uterus absent on ultrasound'], min: 3 },
    { dx: 'Imperforate hymen / transverse vaginal septum (cryptomenorrhoea)', why: 'Cyclical pain with a bluish bulging membrane and haematocolpos.', any: ['cyclical lower abdominal pain', 'bulging bluish membrane', 'breast development present'], min: 2 },
    { dx: 'Androgen insensitivity syndrome', why: 'Breasts present, scanty pubic hair, blind vagina and absent uterus.', any: ['breast development present', 'pubic and axillary hair absent or scanty', 'blind vagina', 'uterus absent on ultrasound'], min: 4 },
    { dx: 'Hypogonadotropic hypogonadism (Kallmann, hypothalamic, pituitary)', why: 'Absent puberty with low FSH, anosmia or chronic illness.', any: ['anosmia', 'fsh low', 'chronic illness', 'headache or visual field defect', 'breast development absent'], min: 3 },
    { dx: 'Constitutional delay or hyperprolactinaemia', why: 'Delayed menarche with galactorrhoea or a family pattern.', any: ['galactorrhoea', 'headache or visual field defect'], min: 1 },
  ],
  must: [
    { n: 'Age and growth: height, puberty', m: ['age 15 years or more', 'age 13 years or more', 'short stature'] },
    { n: 'Breast development and pubic hair', m: ['breast development present', 'breast development absent', 'pubic and axillary hair'] },
    { n: 'Turner stigmata', m: ['webbed neck'] },
    { n: 'Cyclical pain and examination of the hymen', m: ['cyclical lower abdominal pain', 'bulging bluish membrane'] },
    { n: 'Vagina and uterus on ultrasound', m: ['blind vagina', 'uterus absent on ultrasound'] },
    { n: 'Hormones and karyotype', m: ['fsh', 'karyotype advised'] },
    { n: 'Galactorrhoea, headache, anosmia', m: ['galactorrhoea', 'headache or visual field defect', 'anosmia'] },
  ],
  viva: [
    { q: 'Define primary amenorrhoea.', a: 'Absence of menarche by 15 years in a girl with secondary sexual characteristics, or by 13 years without any breast development.' },
    { q: 'Classify the causes.', a: 'Hypergonadotropic (Turner, pure gonadal dysgenesis, premature ovarian failure), hypogonadotropic (constitutional delay, Kallmann, hypothalamic, pituitary), eugonadal with outflow tract anomalies (Mullerian agenesis, imperforate hymen, transverse septum, AIS), and systemic (thyroid, PCOS, chronic illness).' },
    { q: 'What are the features of Turner syndrome?', a: 'Karyotype 45 X; short stature, webbed neck, low hairline, shield chest, wide carrying angle (cubitus valgus), streak gonads, absent puberty, and associated coarctation of the aorta, renal anomalies and hypothyroidism.' },
    { q: 'What is androgen insensitivity syndrome?', a: '46 XY with testes and testosterone, but defective androgen receptors: female phenotype with breast development, scanty or absent pubic and axillary hair, a blind vagina and no uterus. Remove the testes after puberty because of malignancy risk.' },
    { q: 'How do you evaluate it?', a: 'History, height and BMI, Tanner staging, examination of the hymen and vagina, ultrasound of the pelvis, FSH, LH, TSH, prolactin, oestradiol, karyotype, and MRI of the pituitary or pelvis as needed.' },
    { q: 'How do you treat an imperforate hymen?', a: 'Cruciate incision of the hymen and drainage of the haematocolpos under anaesthesia, with antibiotic cover.' },
  ],
}

const PUBMEN: Ins = {
  hints: [
    { dx: 'Puberty menorrhagia (anovulatory dysfunctional bleeding)', why: 'Heavy, prolonged and irregular bleeding in the first years after menarche without a structural cause.', any: ['menarche in the last 1 to 3 years', 'irregular cycles since menarche', 'prolonged bleeding', 'soaking of pads with clots', 'no history of sexual activity', 'abdominal mass absent'], min: 4 },
    { dx: 'Bleeding disorder (von Willebrand disease, ITP)', why: 'Heavy periods since menarche with bruising or a family history.', any: ['easy bruising or nose bleeds', 'family history of bleeding disorder', 'platelet count and coagulation profile advised'], min: 1 },
    { dx: 'Severe anaemia with haemodynamic instability', why: 'Pallor, giddiness and shock need urgent stabilisation.', any: ['haemodynamic instability', 'severe pallor / anaemia', 'hb below 7', 'giddiness and weakness'], min: 2 },
    { dx: 'Hypothyroidism or PCOS in an adolescent', why: 'Thyroid symptoms or obesity and hirsutism.', any: ['thyroid symptoms', 'obesity or hirsutism'], min: 1 },
  ],
  must: [
    { n: 'Age at menarche and cycle pattern', m: ['menarche in the last', 'irregular cycles since menarche'] },
    { n: 'Amount of bleeding, clots and giddiness', m: ['soaking of pads', 'giddiness and weakness'] },
    { n: 'Bleeding tendency and family history', m: ['easy bruising', 'family history of bleeding disorder'] },
    { n: 'Pallor, pulse and BP', m: ['severe pallor', 'haemodynamic instability'] },
    { n: 'Abdominal and per rectal examination (no PV)', m: ['abdominal mass absent', 'per rectal examination normal'] },
    { n: 'Investigations: Hb, platelets, coagulation, TSH', m: ['platelet count and coagulation profile advised'] },
  ],
  viva: [
    { q: 'What is the commonest cause of heavy bleeding in an adolescent?', a: 'Anovulatory cycles from immaturity of the hypothalamic-pituitary-ovarian axis (AUB-O). Always exclude a bleeding disorder, which is present in up to 20% of adolescents with heavy bleeding.' },
    { q: 'How do you investigate?', a: 'Urine pregnancy test, CBC with platelet count, PT and aPTT, von Willebrand screening, TSH, and pelvic ultrasound (abdominal). Avoid pelvic examination in a virgin unless essential.' },
    { q: 'How do you manage acute heavy bleeding?', a: 'Stabilise with fluids and blood if needed; tranexamic acid, high-dose oestrogen or combined pills tapered over days, followed by cyclic progestin or pills for 3 to 6 months; iron supplements.' },
    { q: 'When do you suspect a bleeding disorder?', a: 'Heavy bleeding since menarche, bleeding that needs transfusion, easy bruising, nose bleeds, family history, and prolonged bleeding after dental extraction.' },
    { q: 'What is the role of progestins?', a: 'Medroxyprogesterone or norethisterone for 10 days each month gives a regular withdrawal bleed and prevents prolonged unopposed oestrogen stimulation.' },
    { q: 'What are the complications if left untreated?', a: 'Severe iron deficiency anaemia, heart failure, repeated hospital admissions, school absence, and psychological distress. A bleeding disorder left undiagnosed can lead to life-threatening haemorrhage at surgery.' },
  ],
}

export const INSIGHTS_OBG: Record<string, Ins> = {
  'obg-gyn': GYN,
  'obg-anc': ANC,
  'obg-labour': LABOUR,
  'obg-pnc': PNC,
  'obg-lab-normal': LAB_NORMAL,
  'obg-lab-precip': LAB_PRECIP,
  'obg-lab-prolonged': LAB_PROLONGED,
  'obg-lab-instr': LAB_INSTR,
  'obg-lab-pph': LAB_PPH,
  'obg-lab-breech': LAB_BREECH,
  'obg-adenomyosis': ADENO,
  'obg-primamen': PRIMAMEN,
  'obg-pubmen': PUBMEN,
  'obg-fibroid': FIBROID,
  'obg-aub': AUB,
  'obg-pmb': PMB,
  'obg-pcos': PCOS,
  'obg-ovarian': OVARIAN,
  'obg-prolapse': PROLAPSE_N,
  'obg-ectopic': ECTOPIC,
  'obg-anaemia': ANAEMIA,
  'obg-gdm': GDM,
  'obg-pih': PIH,
  'obg-rh': RH,
  'obg-aph': APH,
  'obg-multiple': MULTIPLE,
  'obg-breech': BREECH,
  'obg-lscs': LSCS,
  'obg-cpd': CPD,
  'obg-fgr': FGR,
  'obg-cardiac': CARDIAC,
  'obg-tubectomy': TUBECT,
  'obg-mtp': MTP,
  'obg-iucd': IUCD,
}
