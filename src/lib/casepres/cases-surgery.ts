import type { CaseDef, Section } from './types'
import { txt, area, ch, fd, cc, sym, sec, at } from './dsl'
import { particulars, pastHistory, familyHistory, personalHistory, menstrualHistory, envSocio, gpe, closing } from './blocks'

const HX_COMMON = [pastHistory(), personalHistory(), familyHistory(), menstrualHistory(), envSocio()]
const EXTRA_SIGNS = ['Lymphadenopathy (regional)', 'Anaemia']

/** Standard "describe the lump" examination used by several surgical cases. */
const lumpExam = (id: string, title: string): Section =>
  sec(id, title, [
    txt('site', 'Site / region', { half: true }),
    txt('size', 'Size (cm x cm)', { half: true }),
    ch('shape', 'Shape', ['Round', 'Oval', 'Irregular', 'Pear shaped', 'Dumbbell']),
    ch('surface', 'Surface', ['Smooth', 'Lobulated', 'Nodular', 'Irregular']),
    ch('edge', 'Edge', ['Well defined', 'Ill defined', 'Sloping']),
    ch('consist', 'Consistency', ['Soft', 'Firm', 'Hard', 'Cystic', 'Rubbery', 'Stony hard']),
    ch('skin', 'Skin over the swelling', ['Normal', 'Stretched and shiny', 'Red', 'Warm', 'Peau d\'orange', 'Ulcerated', 'Tethered', 'Dilated veins']),
    fd('lumpF', 'Findings', ['Tender', 'Local rise of temperature', 'Fluctuant', 'Transilluminant', 'Pulsatile', 'Compressible', 'Reducible', 'Cough impulse present', 'Fixed to skin', 'Fixed to underlying structures', 'Mobile in all directions', 'Can get above the swelling', 'Pedunculated', 'Bruit / thrill', 'Overlying scar', 'Regional lymph nodes enlarged']),
    area('lumpN', 'Additional description'),
  ])

const varicose: CaseDef = {
  id: 'sur-varicose', subject: 'surgery', title: 'Varicose veins', blurb: 'Lower limb varicose veins and venous insufficiency',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Swelling / dilated veins of the lower limb', 'Dull aching pain', 'Dragging pain', 'Ulcer', 'Eczema', 'Bleeding', 'Pigmentation', 'Swelling of the foot'])]),
    sec('hpi', 'History of present illness', [
      sym('swell', 'Dilated veins / swelling', ['onset', 'duration', 'progression', at('side', 'Limb', ['Right', 'Left', 'Both']), at('where', 'Distribution', ['Medial aspect of leg', 'Posterolateral aspect of leg', 'Thigh', 'Calf'], true)]),
      sym('pain', 'Pain', ['onset', 'duration', 'progression', 'nature', 'radiation', 'aggravating', 'relieving', at('night', 'Night', ['More at night', 'Not related to night'])]),
      sym('ulcer', 'Ulcer / eczema / bleeding', ['onset', 'duration', 'progression', 'site']),
      sym('pigm', 'Pigmentation / discolouration', ['onset', 'duration']),
      sym('dvt', 'Previous DVT symptoms (fever with calf pain)', ['onset', 'duration']),
      fd('risk', 'Risk factors', ['Prolonged standing', 'Pregnancy', 'Raised intra-abdominal pressure', 'Abdominal distension', 'Smoking', 'Obesity', 'Previous DVT', 'Prolonged drug intake (OCP)', 'Constipation', 'Chronic cough']),
    ]),
    ...HX_COMMON,
    gpe(EXTRA_SIGNS),
    sec('local', 'Local examination: inspection', [
      ch('limb', 'Limb involved', ['Right', 'Left', 'Bilateral']),
      fd('inspF', 'Findings', ['Dilated tortuous veins', 'Medial side (long saphenous)', 'Posterolateral side (short saphenous)', 'Limb swelling', 'Skin shiny and stretched', 'Pigmentation', 'Eczema', 'Lipodermatosclerosis', 'Venous ulcer', 'Healed scar', 'Loss of hair', 'Ischaemic changes', 'Atrophie blanche', "Morrissey's cough impulse positive"]),
      area('inspN', 'Course and extent of the veins, ulcer site/size, comment on healthy limb'),
    ]),
    sec('tests', 'Palpation and special tests', [
      fd('palpF', 'Palpation', ['Warmth', 'Tenderness', 'Thickened cord-like veins', 'Pitting oedema', 'Palpable saphenofemoral incompetence', 'Peripheral pulses normal', 'Dorsalis pedis felt', 'Posterior tibial felt']),
      fd('tests', 'Tests (present = positive)', ["Trendelenburg test I positive", "Trendelenburg test II positive", 'Tourniquet test positive', 'Perthes test: deep veins patent', "Schwartz test positive", 'Fegan sign positive (perforator)', 'Multiple tourniquet test: perforator incompetence', "Pratt's test positive", 'Cough impulse at saphenofemoral junction']),
      area('testN', 'Details (level of perforators, extent)'),
      area('other', 'Abdominal and pelvic examination (pelvic mass, ascites), per rectal, genitalia'),
    ]),
    closing(),
  ],
}

const scrotal: CaseDef = {
  id: 'sur-scrotal', subject: 'surgery', title: 'Scrotal swelling (hydrocele / testis)', blurb: 'Hydrocele, epididymo-orchitis, torsion, scrotal lumps',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Swelling in the scrotum', 'Pain in the scrotum', 'Fever', 'Burning micturition', 'Infertility', 'Heaviness'])]),
    sec('hpi', 'History of present illness', [
      sym('swell', 'Scrotal swelling', ['onset', 'duration', 'progression', 'side', at('first', 'Started as', ['Swelling in the groin', 'Swelling in the scrotum', 'Painful swelling', 'Painless swelling']), at('red', 'Size on lying down', ['Reduces on lying down', 'No change on lying down']), at('cough', 'On coughing / exertion', ['Increases', 'No change'])]),
      sym('pain', 'Pain', ['onset', 'duration', 'progression', 'nature', 'radiation', 'aggravating', 'relieving']),
      sym('trauma', 'History of trauma', ['duration']),
      sym('fever', 'Fever', ['onset', 'duration', at('ass', 'Associated with', ['Chills', 'Urinary symptoms'], true)]),
      sym('infertility', 'Infertility', ['duration']),
      fd('assoc', 'Also ask', ['Filariasis / travel to endemic area', 'Burning micturition', 'Urethral discharge', 'Weight loss', 'Undescended testis', 'Mumps', 'Previous scrotal surgery']),
    ]),
    ...HX_COMMON,
    gpe(EXTRA_SIGNS),
    sec('local', 'Local examination: scrotum', [
      ch('side', 'Side', ['Right', 'Left', 'Bilateral']),
      ch('size', 'Size of swelling', ['Small', 'Medium', 'Large (extends above)', 'Gigantic']),
      fd('inspF', 'Inspection / palpation', ['Skin normal', 'Skin red', 'Skin oedematous', 'Rugosities lost', 'Penis buried', 'Tender', 'Warm', 'Can get above the swelling', 'Testis palpable separately', 'Testis not palpable', 'Epididymis palpable separately', 'Cord thickened', 'Transillumination positive', 'Fluctuation', 'Cough impulse', 'Reducible', 'Hard nodule in testis', 'Prehn sign positive', 'Cremasteric reflex absent']),
      area('localN', 'Describe (size, shape, surface, consistency, relation to testis/cord)'),
      fd('other', 'Other', ['Opposite side normal', 'Inguinal lymph nodes enlarged', 'Abdominal mass', 'Hernial orifices normal', 'Per rectal: prostate normal', 'Spermatic cord thickened']),
    ]),
    closing(),
  ],
}

const lump: CaseDef = {
  id: 'sur-lump', subject: 'surgery', title: 'Lump / swelling (general)', blurb: 'Any lump or swelling: lipoma, cyst, abscess, lymph node, tumour',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Lump', 'Swelling', 'Pain', 'Discharge', 'Fever', 'Ulceration', 'Weight loss', 'Difficulty in movement'])]),
    sec('hpi', 'History of present illness', [
      sym('lump', 'Lump / swelling', ['onset', 'duration', 'progression', at('site', 'Exact site', ['Head and neck', 'Axilla', 'Groin', 'Trunk', 'Upper limb', 'Lower limb', 'Back', 'Abdominal wall']), at('growth', 'Rate of growth', ['Slow', 'Rapid', 'Static', 'Reduced in size'])]),
      sym('pain', 'Pain', ['onset', 'duration', 'progression', 'nature', 'radiation', 'aggravating', 'relieving']),
      sym('fever', 'Fever', ['onset', 'duration', 'grade']),
      sym('others', 'Other lumps elsewhere', ['site']),
      sym('secondary', 'Secondary changes', [at('ass', 'Changes', ['Ulceration', 'Bleeding', 'Redness', 'Discharge', 'Sudden increase in size'], true)]),
      sym('function', 'Impairment of function', [at('ass', 'Effect', ['Restricted movement', 'Disfigurement', 'Dyspnoea', 'Dysphagia', 'Pressure symptoms'], true)]),
    ]),
    ...HX_COMMON,
    gpe(EXTRA_SIGNS),
    lumpExam('lump', 'Local examination of the lump'),
    sec('nodes', 'Regional nodes and other systems', [
      fd('nodes', 'Lymph nodes', ['Regional nodes enlarged', 'Generalised lymphadenopathy', 'Nodes matted', 'Nodes hard', 'Nodes tender']),
      area('systemic', 'Systemic examination'),
    ]),
    closing(),
  ],
}

const breast: CaseDef = {
  id: 'sur-breast', subject: 'surgery', title: 'Breast lump', blurb: 'Breast lump, fibroadenoma, carcinoma, abscess',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Lump in the breast', 'Breast pain', 'Nipple discharge', 'Nipple retraction', 'Skin changes', 'Axillary swelling', 'Ulcer', 'Weight loss', 'Bone pain'])]),
    sec('hpi', 'History of present illness', [
      sym('lump', 'Breast lump', ['onset', 'duration', 'progression', 'side', at('quad', 'Quadrant', ['Upper outer', 'Upper inner', 'Lower outer', 'Lower inner', 'Central', 'Retro-areolar']), at('growth', 'Rate of growth', ['Slow', 'Rapid', 'Static']), at('cycle', 'Change with periods', ['Increases before periods', 'No change with periods']), 'trauma']),
      sym('pain', 'Pain', ['onset', 'duration', 'progression', 'nature', 'aggravating', 'relieving']),
      sym('skinChg', 'Skin changes / ulceration', ['onset', 'duration', at('ass', 'Changes', ['Redness', 'Peau d\'orange', 'Dimpling', 'Ulceration', 'Nodules'], true)]),
      sym('nipple', 'Nipple changes / discharge', ['onset', 'duration', at('ass', 'Changes', ['Retraction', 'Eczema', 'Bloody discharge', 'Serous discharge', 'Milky discharge', 'Purulent discharge'], true)]),
      sym('mets', 'Metastatic symptoms', [at('ass', 'Symptoms', ['Bone pain', 'Cough / breathlessness', 'Jaundice / abdominal pain', 'Headache / seizures', 'Weight loss'], true)]),
      fd('risk', 'Risk factors', ['Family history of breast cancer', 'Early menarche', 'Late menopause', 'Nulliparity', 'Late first pregnancy', 'Not breastfed', 'Oral contraceptives / HRT', 'Previous breast disease', 'Radiation exposure']),
    ]),
    menstrualHistory(),
    pastHistory(), personalHistory(), familyHistory(), envSocio(),
    gpe(EXTRA_SIGNS),
    sec('insp', 'Breast examination: inspection', [
      fd('inspF', 'Both breasts', ['Symmetrical', 'Asymmetry', 'Visible lump', 'Skin dimpling', 'Peau d\'orange', 'Skin ulceration', 'Redness', 'Dilated veins', 'Nipple retraction', 'Nipple deviation', 'Nipple discharge', 'Nipple eczema', 'Areolar changes', 'Arm swelling', 'Lump moves on raising the arm']),
      area('inspN', 'Notes'),
    ]),
    lumpExam('lump', 'Breast lump: palpation'),
    sec('nodes', 'Lymph nodes and systemic examination', [
      fd('nodes', 'Nodes', ['Axillary nodes palpable', 'Axillary nodes hard', 'Axillary nodes matted', 'Supraclavicular nodes', 'Opposite axilla involved', 'Mobile', 'Fixed']),
      fd('metsSurvey', 'Metastatic survey', ['Hepatomegaly', 'Spinal tenderness', 'Pleural effusion', 'Ascites', 'Pathological fracture']),
      area('opp', 'Opposite breast and other systems'),
    ]),
    closing(),
  ],
}

const ulcer: CaseDef = {
  id: 'sur-ulcer', subject: 'surgery', title: 'Ulcer', blurb: 'Chronic ulcers: venous, arterial, diabetic, trophic, malignant',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Ulcer', 'Pain', 'Discharge', 'Swelling', 'Bleeding', 'Fever', 'Discolouration'])]),
    sec('hpi', 'History of present illness', [
      sym('ulcer', 'Ulcer', ['onset', 'duration', 'progression', 'site', at('start', 'Started as', ['Spontaneous', 'After trauma', 'After a burn', 'From a swelling', 'From a blister', 'After an injection']), at('prior', 'Prior swelling', ['Prior swelling', 'No prior swelling'])]),
      sym('pain', 'Pain', ['onset', 'duration', 'progression', 'site', 'nature', 'radiation', 'aggravating', 'relieving']),
      sym('discharge', 'Discharge', ['onset', 'duration', at('colour', 'Colour', ['Yellow', 'Green', 'Brown', 'Blood-tinged', 'Clear']), 'discharge', 'smell', 'amount']),
      fd('assoc', 'Precipitating factor / associated disease', ['Diabetes mellitus', 'Varicose veins', 'Peripheral vascular disease / claudication', 'Neuropathy', 'Leprosy', 'Tuberculosis', 'Trauma', 'Smoking', 'Prolonged immobility', 'Malignancy', 'Sickle cell disease', 'Radiotherapy']),
    ]),
    ...HX_COMMON,
    gpe(EXTRA_SIGNS),
    sec('ulcerExam', 'Local examination of the ulcer', [
      txt('site', 'Site', { half: true }), txt('size', 'Size (cm x cm)', { half: true }), txt('number', 'Number', { half: true }),
      ch('shape', 'Shape', ['Round', 'Oval', 'Irregular', 'Serpiginous', 'Linear']),
      ch('edge', 'Edge', ['Sloping', 'Punched out', 'Undermined', 'Raised and everted', 'Rolled', 'Raised and beaded']),
      ch('floor', 'Floor', ['Healthy granulation tissue', 'Slough', 'Necrotic tissue', 'Pale granulation', 'Bone exposed', 'Tendon exposed', 'Bleeds on touch']),
      ch('base', 'Base', ['Soft', 'Indurated', 'Fixed to deeper structures', 'Mobile']),
      ch('dischargeEx', 'Discharge', ['Serous', 'Serosanguinous', 'Purulent', 'Foul-smelling', 'None']),
      ch('surround', 'Surrounding skin', ['Normal', 'Red and warm', 'Pigmented', 'Eczematous', 'Indurated', 'Shiny and hairless', 'Oedematous']),
      fd('feat', 'Features', ['Tender', 'Bleeds easily', 'Regional lymph nodes palpable', 'Lymph nodes tender', 'Lymph nodes hard and fixed']),
      area('ulcerN', 'Additional description'),
    ]),
    sec('vasc', 'Vascular and neurological assessment', [
      fd('vascF', 'Findings', ['Varicose veins', 'Peripheral pulses present', 'Femoral pulse absent', 'Popliteal pulse absent', 'Dorsalis pedis absent', 'Posterior tibial absent', 'Capillary refill delayed', "Buerger's test positive", 'Cold limb', 'Loss of hair', 'Sensory loss (stocking pattern)', 'Ankle jerk absent', 'Monofilament test abnormal', 'Thickened nerves']),
      area('vascN', 'Details (ABPI, Doppler findings)'),
    ]),
    closing(),
  ],
}

const thyroid: CaseDef = {
  id: 'sur-thyroid', subject: 'surgery', title: 'Thyroid swelling', blurb: 'Goitre, thyroid nodule, thyrotoxicosis, hypothyroidism',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Swelling in the neck', 'Pain in the swelling', 'Pressure symptoms', 'Toxic symptoms', 'Hypothyroid symptoms', 'Change in voice', 'Difficulty swallowing', 'Difficulty breathing'])]),
    sec('hpi', 'History of present illness', [
      sym('swell', 'Neck swelling', ['onset', 'duration', 'progression', at('rate', 'Rate of growth', ['Slow', 'Rapid', 'Sudden increase']), at('mov', 'Moves with swallowing', ['Moves with swallowing', 'Does not move'])]),
      sym('pain', 'Pain', ['onset', 'duration', 'progression', 'radiation', 'aggravating']),
      sym('pressure', 'Pressure symptoms', [at('ass', 'Symptoms', ['Dysphagia', 'Dyspnoea', 'Stridor', 'Hoarseness of voice', 'Cough'], true), 'duration']),
      sym('toxic', 'Hyperthyroid (toxic) symptoms', [at('ass', 'Symptoms', ['Weight loss despite good appetite', 'Heat intolerance', 'Sweating', 'Palpitations', 'Tremors', 'Irritability / anxiety', 'Diarrhoea', 'Menstrual irregularity', 'Muscle weakness', 'Eye symptoms (staring, protrusion)'], true), 'duration']),
      sym('hypo', 'Hypothyroid symptoms', [at('ass', 'Symptoms', ['Weight gain despite poor appetite', 'Cold intolerance', 'Hair loss', 'Lethargy / muscle fatigue', 'Memory loss', 'Constipation', 'Menstrual irregularity', 'Dry skin', 'Hoarse voice'], true), 'duration']),
      fd('risk', 'Relevant history', ['Residence in goitre-endemic area', 'Radiation exposure to neck', 'Family history of thyroid disease', 'Antithyroid drug intake', 'Previous thyroid surgery', 'Pregnancy', 'Other lumps in the body', 'Bone pain']),
    ]),
    ...HX_COMMON,
    gpe(['Tremors', 'Warm moist skin', 'Dry coarse skin', 'Facial puffiness', 'Loss of lateral eyebrow']),
    sec('eye', 'Eye signs and peripheral signs', [
      fd('eyeF', 'Eye signs', ['Lid retraction', 'Lid lag (von Graefe)', 'Exophthalmos', 'Ophthalmoplegia', 'Staring look, infrequent blinking', "Joffroy's sign absent", "Moebius sign positive", 'Chemosis', 'Periorbital oedema']),
      fd('periph', 'Peripheral signs', ['Fine tremors of outstretched hands', 'Warm sweaty palms', 'Tachycardia', 'Atrial fibrillation', 'Pretibial myxoedema', 'Thyroid acropachy', 'Delayed ankle jerk relaxation', 'Bradycardia', 'Proximal myopathy']),
    ]),
    lumpExam('lump', 'Thyroid swelling: local examination'),
    sec('thy', 'Thyroid-specific signs', [
      ch('extent', 'Extent', ['Isthmus only', 'Right lobe', 'Left lobe', 'Both lobes', 'Multinodular', 'Solitary nodule', 'Retrosternal extension']),
      fd('thyF', 'Findings', ['Moves with deglutition', 'Moves with protrusion of tongue (not)', 'Can get below the swelling', 'Retrosternal extension', 'Bruit / thrill', 'Trachea central', 'Trachea deviated', 'Carotid pulsations felt', "Pemberton's sign positive", 'Berry sign (carotid) negative', 'Cervical nodes palpable', 'Vocal cord paralysis (indirect laryngoscopy)']),
      area('thyN', 'Notes (nodule size, consistency, fixity)'),
      ch('status', 'Functional status', ['Euthyroid', 'Thyrotoxic', 'Hypothyroid']),
    ]),
    closing(),
  ],
}

const abdomen: CaseDef = {
  id: 'sur-abdomen', subject: 'surgery', title: 'Abdominal case (pain / lump)', blurb: 'Abdominal pain, mass, GI and hepatobiliary surgical problems',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Pain abdomen', 'Palpable lump / mass', 'Flatulence / dyspepsia', 'Nausea and vomiting', 'Jaundice', 'Urinary complaints', 'Altered bowel habits', 'Loss of appetite', 'Fever', 'Abdominal distension', 'Weight loss'])]),
    sec('hpi', 'History of present illness', [
      sym('pain', 'Pain abdomen', ['onset', 'duration', 'progression', at('site', 'Site', ['Epigastric', 'Right hypochondrium', 'Left hypochondrium', 'Umbilical', 'Right iliac fossa', 'Left iliac fossa', 'Hypogastric', 'Loin', 'Generalised']), 'nature', 'radiation', 'timing', 'aggravating', 'relieving']),
      sym('lump', 'Palpable lump', ['onset', 'duration', 'progression', 'site', 'grade']),
      sym('dyspepsia', 'Flatulence / dyspepsia', ['duration', 'aggravating', 'relieving']),
      sym('vomit', 'Nausea and vomiting', ['onset', 'duration', 'episodes', at('type', 'Type', ['Bilious', 'Non-bilious', 'Projectile', 'Blood-stained', 'Faeculent', 'Undigested food']), 'relieving']),
      sym('jaundice', 'Jaundice', ['onset', 'duration', 'progression', at('ass', 'Associated', ['Pruritus', 'Pale stools', 'Dark urine', 'Fever with chills', 'Abdominal pain'], true)]),
      sym('urinary', 'Urinary complaints', [at('ass', 'Symptoms', ['Dysuria', 'Haematuria', 'Frequency', 'Hesitancy', 'Retention', 'Pneumaturia'], true), 'duration']),
      sym('bowelSym', 'Bowel habits', [at('ass', 'Change', ['Constipation', 'Diarrhoea', 'Alternating', 'Blood in stools', 'Mucus in stools', 'Absolute constipation', 'Narrow stools'], true), 'duration']),
      sym('appetiteSym', 'Appetite / weight', [at('ass', 'Change', ['Loss of appetite', 'Weight loss', 'Early satiety'], true), 'duration']),
      sym('fever', 'Fever', ['onset', 'duration', 'grade']),
    ]),
    ...HX_COMMON,
    gpe(['Supraclavicular node (Virchow)', 'Sister Mary Joseph nodule', 'Dehydration signs']),
    sec('insp', 'Abdomen: inspection', [
      ch('shape', 'Shape', ['Scaphoid', 'Flat', 'Distended uniformly', 'Distended with localised swelling', 'Asymmetrical']),
      fd('inspF', 'Findings', ['Moves with respiration', 'Restricted movement with respiration', 'Umbilicus inverted', 'Umbilicus everted', 'Flanks full', 'Visible peristalsis', 'Visible mass', 'Scars', 'Sinuses', 'Dilated veins', 'Hernial orifices bulging', 'Genitalia abnormal']),
      area('inspN', 'Notes'),
    ]),
    sec('palp', 'Abdomen: palpation', [
      fd('palpF', 'Findings', ['Tenderness', 'Guarding', 'Rigidity', 'Rebound tenderness', "Murphy's sign positive", "McBurney's point tenderness", "Rovsing's sign positive", 'Palpable liver', 'Palpable spleen', 'Palpable kidney', 'Palpable gallbladder (Courvoisier)', 'Palpable mass', 'Fluid thrill', 'Renal angle tenderness']),
      area('palpN', 'Describe tenderness location, organomegaly and the mass (site, size, shape, surface, edge, consistency, mobility with respiration, relation to the abdominal wall)'),
    ]),
    sec('perc', 'Percussion, auscultation, PR', [
      fd('percF', 'Percussion / auscultation', ['Liver dullness preserved', 'Liver dullness obliterated', 'Shifting dullness', 'Tympanic note', 'Bowel sounds normal', 'Bowel sounds sluggish', 'Bowel sounds absent', 'Bowel sounds exaggerated (tinkling)', 'Bruit', 'Succussion splash']),
      area('hernia', 'Hernial orifices, external genitalia'),
      area('pr', 'Per rectal examination'),
      area('systemic', 'Other systems'),
    ]),
    closing(),
  ],
}

const hernia: CaseDef = {
  id: 'sur-hernia', subject: 'surgery', title: 'Hernia', blurb: 'Inguinal, femoral, umbilical, incisional hernia',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Swelling in the inguinal region', 'Swelling in the inguinoscrotal region', 'Swelling in the abdomen', 'Swelling near the umbilicus', 'Pain', 'Vomiting', 'Constipation', 'Irreducible swelling'])]),
    sec('hpi', 'History of present illness', [
      sym('swell', 'Swelling', ['onset', 'duration', 'progression', 'side', at('first', 'Started as', ['Small swelling in groin', 'Swelling after a strain', 'Swelling after surgery', 'Congenital']), at('red', 'On lying down', ['Reduces on lying down', 'Does not reduce']), at('cough', 'On cough / exertion', ['Increases', 'No change'])]),
      sym('pain', 'Associated pain', ['onset', 'duration', 'progression', 'nature', 'radiation', 'aggravating', 'relieving']),
      sym('obstruct', 'Obstruction / strangulation features', [at('ass', 'Symptoms', ['Abdominal pain', 'Nausea', 'Vomiting', 'Constipation', 'Distension', 'Irreducible swelling', 'Tense tender swelling', 'Fever'], true)]),
      fd('risk', 'Predisposing factors', ['Chronic cough', 'Constipation', 'Straining at micturition (prostatism)', 'Heavy lifting', 'Obesity', 'Previous abdominal surgery', 'Ascites', 'Pregnancy', 'Smoking', 'Family history of hernia']),
    ]),
    ...HX_COMMON,
    gpe(EXTRA_SIGNS),
    sec('local', 'Local examination', [
      ch('side', 'Side', ['Right', 'Left', 'Bilateral']),
      ch('site', 'Site', ['Inguinal', 'Inguinoscrotal', 'Femoral', 'Umbilical', 'Paraumbilical', 'Epigastric', 'Incisional', 'Spigelian']),
      txt('size', 'Size (cm)', { half: true }),
      fd('inspF', 'Findings', ['Visible swelling', 'Extends into scrotum', 'Skin normal', 'Visible cough impulse', 'Reducible', 'Irreducible', 'Tender', 'Tense', 'Resonant note', 'Dull note', 'Bowel sounds heard', 'Cough impulse positive', 'Can get above the swelling', 'Testis palpable separately', 'Superficial ring dilated']),
      fd('tests', 'Tests', ['Deep ring occlusion test: controls (indirect)', 'Deep ring occlusion test: does not control (direct)', 'Zieman test', 'Invagination test positive', 'Finger tip test']),
      ch('type', 'Type', ['Indirect inguinal', 'Direct inguinal', 'Pantaloon', 'Femoral', 'Umbilical', 'Incisional', 'Undetermined']),
      area('localN', 'Additional description, opposite side, other hernial orifices, abdominal and PR (prostate)'),
    ]),
    closing(),
  ],
}

const pvd: CaseDef = {
  id: 'sur-pvd', subject: 'surgery', title: 'Peripheral vascular disease', blurb: 'Claudication, rest pain, gangrene, ischaemic limb',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Pain in the limb', 'Ulcer', 'Discolouration', 'Coldness', 'Numbness', 'Gangrene', 'Swelling'])]),
    sec('hpi', 'History of present illness', [
      sym('pain', 'Pain in the limb', ['onset', 'duration', 'progression', at('side', 'Limb', ['Right', 'Left', 'Both']), at('where', 'Site', ['Calf', 'Thigh', 'Buttock', 'Foot', 'Toes'], true), 'nature', 'radiation', 'timing', 'aggravating', 'relieving', at('claud', 'Claudication', ['Claudication', 'Rest pain', 'Night pain relieved by hanging leg']), at('dist', 'Claudication distance', ['<50 m', '50 to 100 m', '100 to 200 m', '>200 m'])]),
      sym('ulcer', 'Ulcer', ['onset', 'duration', 'progression', 'site', at('ass', 'Associated', ['Pain', 'Discharge', 'Swelling or redness'], true)]),
      sym('colour', 'Discolouration', ['onset', 'duration', at('c', 'Colour', ['Pale', 'Blue', 'Black (gangrene)', 'Red'], true), at('pos', 'Change with position', ['Pale on elevation, red on dependency', 'No change'])]),
      fd('risk', 'Risk factors', ['Smoking', 'Diabetes mellitus', 'Hypertension', 'Hyperlipidaemia', 'Coronary artery disease', 'Stroke / TIA', 'Previous vascular surgery', 'Family history of vascular disease', 'Atrial fibrillation', 'Raynaud symptoms', 'Sudden onset (embolism)']),
    ]),
    ...HX_COMMON,
    gpe(['Bruit over carotids']),
    sec('vasc', 'Limb inspection and palpation', [
      ch('limb', 'Limb involved', ['Right', 'Left', 'Both']),
      fd('inspF', 'Findings', ['Pallor on elevation', 'Rubor on dependency', 'Cyanosis', 'Loss of hair', 'Shiny atrophic skin', 'Brittle nails', 'Muscle wasting', 'Ulcer', 'Gangrene (dry)', 'Gangrene (wet)', 'Cold limb', 'Delayed capillary refill', 'Venous filling time prolonged', "Buerger's angle reduced", 'Oedema']),
      area('inspN', 'Ulcer/gangrene description (follow ulcer proforma), demarcation line'),
      fd('pulses', 'Pulses absent', ['Femoral', 'Popliteal', 'Posterior tibial', 'Dorsalis pedis', 'Radial', 'Brachial', 'Carotid']),
      fd('tests', 'Tests / auscultation', ["Buerger's test positive", 'Femoral bruit', 'Abdominal aortic aneurysm palpable', 'Allen test abnormal']),
      area('palpN', 'Details (ABPI, Doppler)'),
    ]),
    sec('neuro', 'Neurological and other systems', [
      fd('neuroF', 'Findings', ['Sensory loss', 'Motor weakness', 'Reflexes diminished']),
      area('systemic', 'Cardiovascular, respiratory, abdomen, carotid'),
    ]),
    closing(),
  ],
}

export const SURGERY_CASES: CaseDef[] = [varicose, scrotal, lump, breast, ulcer, thyroid, abdomen, hernia, pvd]
