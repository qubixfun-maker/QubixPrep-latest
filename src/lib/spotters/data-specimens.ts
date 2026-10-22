import type { Spot } from "./types"

const P = "/spotters/specimens/"
const S = "Pathology"
const O = "Obstetrics & Gynaecology"
const G = "Gross specimens" as const

export const SPECIMENS: Spot[] = [
  {
    id: "sp-calculous-cholecystitis", subject: S, group: G, topic: "Hepatobiliary", name: "Calculous cholecystitis (gallstones)", labelled: true,
    imgs: [{ f: P + "calculous-cholecystitis.webp" }, { f: P + "gallbladder-stones-b.webp" }, { f: P + "gallbladder-stones-a.webp" }],
    identify: [
      "Opened gall bladder with a thickened fibrotic wall",
      "Multiple faceted stones lying in the lumen (or a stone impacted in the neck)",
      "Mucosa is flattened, granular or ulcerated",
      "Adherent omentum or surrounding fibrosis in chronic cases",
    ],
    about: "Gallstones are present in over 90% of cases of chronic cholecystitis. Cholesterol stones are the commonest in India and the West; pigment stones are linked to haemolysis and infection.",
    points: [
      "Risk factors (the 5 Fs): female, fat, fertile, forty, fair; also rapid weight loss, haemolysis and cirrhosis.",
      "Ultrasound shows stones with acoustic shadowing; treatment is laparoscopic cholecystectomy.",
      "Complications: acute cholecystitis, empyema, perforation, choledocholithiasis, gallstone ileus, Mirizzi syndrome, carcinoma of the gall bladder.",
      "Porcelain gall bladder (wall calcification) has a high risk of carcinoma.",
    ],
    viva: [
      "Commonest type of gallstone? — Mixed stones; pure cholesterol stones are the commonest pure type in the West.",
      "What is Mirizzi syndrome? — A stone in the cystic duct or Hartmann's pouch compressing the common hepatic duct.",
    ],
    mcq: [
      ["Which gallstones are radio-opaque on plain X-ray?", "Calcium bilirubinate (pigment) stones with calcium", "Pure cholesterol stones", "Mixed stones always", "None of them", "Only a minority (10 to 15%) of gallstones are radio-opaque, mostly pigment or calcified stones."],
      ["Best investigation for gallstones is:", "Ultrasonography", "Plain abdominal X-ray", "CT scan", "MRI", "USG detects gallstones with more than 95% accuracy."],
    ],
  },
  {
    id: "sp-gangrenous-appendix", subject: S, group: G, topic: "GIT", name: "Acute gangrenous appendicitis", labelled: true,
    imgs: [{ f: P + "gangrenous-appendix-a.webp" }, { f: P + "gangrenous-appendix-b.webp" }],
    identify: [
      "Vermiform appendix with a dull grey-black or green discoloured wall",
      "Swollen and distended, often with a dull serosa covered by exudate",
      "Perforation may be seen at the tip",
      "Lumen contains pus or a faecolith",
    ],
    about: "Gangrenous appendicitis is a severe form where venous and then arterial thrombosis causes necrosis of the wall. Perforation leads to peritonitis or an appendicular abscess.",
    points: [
      "Typical history: periumbilical pain shifting to the right iliac fossa, anorexia, vomiting and fever.",
      "McBurney's point tenderness, Rovsing's, psoas and obturator signs.",
      "Alvarado score helps in diagnosis; treatment is appendicectomy.",
      "Appendicular mass is treated with the Ochsner-Sherren regimen initially in selected cases.",
    ],
    viva: [
      "Which artery supplies the appendix? — Appendicular artery, a branch of the ileocolic artery (an end artery).",
      "Why is gangrene common? — The appendicular artery is an end artery that thromboses easily.",
    ],
    mcq: [
      ["The commonest position of the appendix is:", "Retrocaecal", "Pelvic", "Subcaecal", "Pre-ileal", "Retrocaecal in about 65%."],
      ["Pain shifts from the umbilicus to the right iliac fossa because:", "Parietal peritoneum becomes inflamed", "Visceral pain is localised", "Colon contracts", "Referred pain to the groin", "Somatic pain replaces the visceral pain when the parietal peritoneum is involved."],
    ],
  },
  {
    id: "sp-rcc", subject: S, group: G, topic: "Genitourinary", name: "Renal cell carcinoma", labelled: true,
    imgs: [{ f: P + "rcc-a.webp" }, { f: P + "rcc-b.webp" }],
    identify: [
      "Kidney cut section showing a well-circumscribed rounded mass, usually at a pole",
      "Variegated golden yellow cut surface with areas of haemorrhage and necrosis",
      "Pushes the normal parenchyma aside and may invade the renal vein",
      "Yellow colour is due to lipid in clear cells",
    ],
    about: "Renal cell carcinoma arises from the proximal tubule epithelium. The clear cell type has loss of the VHL gene on chromosome 3p and appears golden yellow on cut section.",
    points: [
      "Classic triad: haematuria, loin pain and a palpable mass; paraneoplastic syndromes include erythrocytosis and hypercalcaemia.",
      "Spreads along the renal vein to the IVC and to lung (cannonball), bone and brain.",
      "Treatment: radical or partial nephrectomy; targeted therapy for metastatic disease (sunitinib, pazopanib).",
      "Smoking and obesity are risk factors; also von Hippel-Lindau disease and tuberous sclerosis.",
    ],
    viva: [
      "Which vein is invaded? — Renal vein, extending into the IVC.",
      "Which symptom triggers a left-sided varicocele? — Tumour thrombus blocking the left renal vein.",
    ],
    mcq: [
      ["The commonest type of renal cell carcinoma is:", "Clear cell", "Papillary", "Chromophobe", "Collecting duct", "Clear cell accounts for about 75%."],
      ["A left varicocele of sudden onset in an adult suggests:", "Left renal cell carcinoma", "Hydrocele", "Epididymitis", "Inguinal hernia", "Tumour thrombus occludes the left testicular vein drainage."],
    ],
  },
  {
    id: "sp-bph", subject: S, group: G, topic: "Genitourinary", name: "Nodular prostatic hyperplasia (BPH)", labelled: true,
    imgs: [{ f: P + "bph-a.webp" }, { f: P + "bph-b.webp" }, { f: P + "bph-c.webp" }],
    identify: [
      "Enlarged prostate, rounded and nodular with a firm rubbery cut surface",
      "Cut section shows nodules of varying size separated by fibrous tissue",
      "Compressed urethra, often with a thickened trabeculated bladder in the same specimen",
      "Median lobe may bulge into the bladder",
    ],
    about: "BPH is hyperplasia of the periurethral (transitional) zone driven by dihydrotestosterone. The enlarged gland compresses the prostatic urethra causing lower urinary tract symptoms.",
    points: [
      "Symptoms: hesitancy, poor stream, terminal dribbling, frequency, nocturia, retention.",
      "Complications: acute retention, UTI, bladder stones, hydronephrosis, renal failure.",
      "Investigations: DRE, PSA, USG; IPSS score. Treatment: tamsulosin, finasteride, TURP.",
      "TURP syndrome is dilutional hyponatraemia from absorbed glycine irrigation fluid.",
    ],
    viva: [
      "Drug that shrinks the prostate? — Finasteride or dutasteride (5-alpha reductase inhibitors).",
      "Which lobe forms the 'middle lobe' effect? — The median lobe.",
    ],
    mcq: [
      ["BPH arises mainly from the:", "Transitional zone", "Peripheral zone", "Central zone", "Anterior fibromuscular stroma", "Carcinoma arises from the peripheral zone."],
      ["Irrigation fluid used in TURP is:", "Glycine", "Normal saline", "Ringer lactate", "Sterile water", "Non-conducting fluid is required for monopolar diathermy; absorption causes hyponatraemia."],
    ],
  },
  {
    id: "sp-meckel", subject: S, group: G, topic: "GIT", name: "Meckel's diverticulum", labelled: true,
    imgs: [{ f: P + "meckel.webp" }],
    identify: [
      "Blind outpouching arising from the antimesenteric border of the ileum",
      "About 2 feet (60 cm) from the ileocaecal valve and about 2 inches long",
      "True diverticulum: contains all three coats of the intestinal wall",
      "May contain ectopic gastric or pancreatic tissue",
    ],
    about: "Meckel's diverticulum is a remnant of the vitello-intestinal duct. It is the commonest congenital anomaly of the GI tract and follows the rule of 2s.",
    points: [
      "Rule of 2s: 2% of the population, 2 feet from the ileocaecal valve, 2 inches long, 2 types of ectopic tissue, presents before age 2.",
      "Painless rectal bleeding in a child from ectopic gastric mucosa (diagnosed by a Meckel's scan, Tc-99m pertechnetate).",
      "Other complications: diverticulitis, obstruction, intussusception, Littre hernia.",
      "Treatment is diverticulectomy or segmental resection if symptomatic.",
    ],
    viva: [
      "Embryological origin? — Persistence of the proximal part of the vitello-intestinal duct.",
      "Investigation of choice for bleeding Meckel's? — Technetium-99m pertechnetate scan.",
    ],
    mcq: [
      ["The most common ectopic tissue in a Meckel's diverticulum is:", "Gastric mucosa", "Pancreatic tissue", "Colonic mucosa", "Liver tissue", "Gastric mucosa causes ulceration and bleeding."],
    ],
  },
  {
    id: "sp-intussusception", subject: S, group: G, topic: "GIT", name: "Intussusception", labelled: true,
    imgs: [{ f: P + "intussusception.webp" }],
    identify: [
      "Segment of bowel telescoped into the adjacent distal segment",
      "Specimen shows the outer intussuscipiens and inner intussusceptum",
      "Congested, oedematous and dusky bowel wall",
      "Ileo-colic type commonest in children",
    ],
    about: "Intussusception occurs when a proximal bowel segment invaginates into the distal segment, causing obstruction and strangulation. In infants the cause is usually enlarged Peyer's patches after a viral illness.",
    points: [
      "Classic triad: colicky abdominal pain, red currant jelly stools and a palpable sausage-shaped mass.",
      "Dance's sign: emptiness in the right iliac fossa.",
      "Ultrasound shows a target or doughnut sign; air or hydrostatic enema reduction is the first treatment, surgery if that fails or if peritonitis.",
      "In adults a lead point (polyp, tumour, Meckel's) is usually present, so resection is required.",
    ],
    viva: [
      "Name the ultrasound sign. — Target (doughnut) sign.",
      "Commonest type? — Ileocolic.",
    ],
    mcq: [
      ["Red currant jelly stool is seen in:", "Intussusception", "Appendicitis", "Pyloric stenosis", "Hirschsprung disease", "Blood and mucus from congested mucosa."],
      ["Peak age of idiopathic intussusception:", "3 months to 2 years", "Newborn", "5 to 10 years", "Adolescence", "Most cases are in infants under 2 years."],
    ],
  },
  {
    id: "sp-carcinoma-penis", subject: S, group: G, topic: "Genitourinary", name: "Carcinoma of penis (after penectomy)", labelled: true,
    imgs: [{ f: P + "carcinoma-penis-a.webp" }, { f: P + "carcinoma-penis-b.webp" }],
    identify: [
      "Amputated penile specimen with a proliferative or ulcerative growth on the glans or prepuce",
      "Fungating mass with irregular everted edge",
      "Tumour infiltrates the corpora and shaft",
      "Resection margin is shown with at least 2 cm clearance",
    ],
    about: "Penile carcinoma is a squamous cell carcinoma linked with lack of circumcision, poor hygiene, phimosis and HPV 16 and 18. It is rare in circumcised men.",
    points: [
      "Premalignant lesions: Bowen's disease, erythroplasia of Queyrat, leukoplakia, balanitis xerotica obliterans, Buschke-Lowenstein tumour (verrucous).",
      "Spreads to inguinal lymph nodes first, then pelvic nodes; haematogenous spread is rare.",
      "Treatment: partial penectomy with a 2 cm margin, total penectomy if the tumour is large, and inguinal node dissection.",
      "Early neonatal circumcision is protective.",
    ],
    viva: [
      "Which virus is linked with it? — HPV 16 and 18.",
      "Which lymph nodes drain the penis? — Superficial and deep inguinal nodes.",
    ],
    mcq: [
      ["The commonest histological type of penile cancer is:", "Squamous cell carcinoma", "Adenocarcinoma", "Basal cell carcinoma", "Melanoma", "More than 95% are SCC."],
      ["Erythroplasia of Queyrat is a premalignant lesion on the:", "Glans penis", "Scrotum", "Urethra", "Foreskin only", "It is carcinoma in situ on the glans or prepuce."],
    ],
  },
  {
    id: "sp-bladder-stone", subject: S, group: G, topic: "Genitourinary", name: "Vesical calculus (bladder stone)", labelled: true,
    imgs: [{ f: P + "bladder-stone.webp" }],
    identify: [
      "Large rounded or oval stone with a rough or cracked surface",
      "Laminated appearance on section",
      "Often hard, grey-white or brown; fragments at the base of the jar",
      "Single or multiple",
    ],
    about: "Bladder stones form in stasis, in infection with urea-splitting organisms or around foreign bodies. In India, endemic bladder stones occur in children on a low-protein, cereal-based diet.",
    points: [
      "Symptoms: suprapubic pain at the end of micturition, haematuria, interrupted stream relieved by lying down, referred pain to the tip of the penis.",
      "Investigation: X-ray KUB, USG, cystoscopy.",
      "Treatment: cystolitholapaxy, lithotripsy or suprapubic cystolithotomy.",
      "Types: oxalate (mulberry stone), uric acid (radiolucent), phosphate (staghorn, in infection).",
    ],
    viva: [
      "Pain is referred to? — The tip of the penis (the pudendal nerve).",
      "Which stone is radiolucent? — Uric acid stone.",
    ],
    mcq: [
      ["Stones associated with Proteus infection are:", "Triple phosphate (struvite)", "Uric acid", "Calcium oxalate", "Cystine", "Urease splits urea into ammonia, giving an alkaline urine."],
    ],
  },
  {
    id: "sp-carcinoma-breast", subject: S, group: G, topic: "Breast", name: "Carcinoma of breast", labelled: true,
    imgs: [{ f: P + "carcinoma-breast-a.webp" }, { f: P + "carcinoma-breast-b.webp" }],
    identify: [
      "Breast tissue with an irregular, ill-defined, hard grey-white mass",
      "Infiltrates the surrounding fat and gives a stellate outline",
      "Nipple retraction or ulceration over the lesion may be seen",
      "Chalky streaks and gritty cut surface",
    ],
    about: "Invasive ductal carcinoma is the commonest breast cancer. The specimen shown is a mastectomy (modified radical or simple), often with the nipple and skin.",
    points: [
      "Risk factors: early menarche, late menopause, nulliparity, BRCA1 and BRCA2, family history, radiation.",
      "Clinical signs: peau d'orange, nipple retraction, fixity, axillary nodes.",
      "TNM staging; receptors ER, PR and HER2 decide treatment (tamoxifen, aromatase inhibitors, trastuzumab).",
      "Spread: axillary nodes, bone (commonest distant site), lung, liver, brain.",
    ],
    viva: [
      "Most common site of distant metastasis? — Bone.",
      "Which cancer shows Paget's disease of the nipple? — Underlying ductal carcinoma.",
    ],
    mcq: [
      ["Peau d'orange is due to:", "Lymphatic obstruction and oedema of the skin", "Fat necrosis", "Skin infiltration by melanocytes", "Nipple inversion", "Blocked dermal lymphatics make the skin pit at hair follicles."],
      ["Which gene is mutated in hereditary breast-ovarian cancer?", "BRCA1", "APC", "RB", "NF1", "BRCA1 and BRCA2 are tumour suppressor genes."],
    ],
  },
  {
    id: "sp-tb-intestine", subject: S, group: G, topic: "GIT", name: "Tuberculosis of intestine (stricture)", labelled: true,
    imgs: [{ f: P + "tb-intestine.webp" }],
    identify: [
      "Wet-mount formalin-fixed bowel opened to show a stricture",
      "Transverse (girdle) ulcers with a thickened wall",
      "Narrowed lumen with proximal dilatation",
      "Ileocaecal region commonly affected",
    ],
    about: "Intestinal TB spreads from swallowed sputum or haematogenously. Ulcers run transversely around the gut, and healing by fibrosis produces strictures causing subacute obstruction.",
    points: [
      "Typhoid ulcers run longitudinally along Peyer's patches; TB ulcers lie transversely.",
      "Presents with abdominal pain, weight loss, fever and altered bowel habit.",
      "Treated with antitubercular therapy; surgery for obstruction (stricturoplasty or resection).",
    ],
    viva: [
      "Commonest site? — Ileocaecal region.",
    ],
    mcq: [
      ["Ulcers in intestinal TB are oriented:", "Transversely", "Longitudinally", "Radially", "Randomly", "They follow the lymphatics around the circumference."],
    ],
  },
  {
    id: "sp-colloid-goitre", subject: S, group: G, topic: "Endocrine", name: "Colloid goitre (thyroid)", labelled: true,
    imgs: [{ f: P + "colloid-goitre.webp" }],
    identify: [
      "Cut section of an enlarged thyroid with a thin capsule and lobulation",
      "Uniform gelatinous brown-pink homogeneous swelling",
      "Glistening colloid-filled cystic spaces",
      "Haemorrhage, fibrosis or calcification in long-standing cases",
    ],
    about: "Colloid goitre is the involutional stage of diffuse hyperplastic goitre in iodine deficiency. The thyroid is enlarged and filled with abundant colloid.",
    points: [
      "Endemic where iodine deficiency exists (Himalayan belt); prevented by iodised salt.",
      "Complications: tracheal compression, retrosternal extension, secondary thyrotoxicosis (toxic multinodular goitre), malignant change.",
      "Investigations: TFT, USG, FNAC; treatment is thyroxine suppression or thyroidectomy.",
    ],
    viva: [
      "Treatment of a multinodular goitre with pressure symptoms? — Total or subtotal thyroidectomy.",
    ],
    mcq: [
      ["Endemic goitre is caused by:", "Iodine deficiency", "Iodine excess", "Selenium excess", "Thyroid autoantibodies", "Low iodine raises TSH and enlarges the gland."],
    ],
  },
  /* -------- Obstetrics & Gynaecology specimens -------- */
  {
    id: "sp-molar-pregnancy", subject: O, group: G, topic: "Obstetrics", name: "Hydatidiform mole (molar pregnancy)", labelled: true,
    imgs: [{ f: P + "molar-pregnancy.webp" }],
    identify: [
      "Mass of translucent grape-like vesicles of varying size",
      "Vesicles are thin-walled, fluid-filled and attached by thin stalks",
      "No fetal parts in a complete mole",
      "Vesicles lie at the bottom of the jar",
    ],
    about: "A hydatidiform mole is a gestational trophoblastic disease with hydropic swelling of chorionic villi and trophoblastic proliferation. A complete mole is 46,XX (paternal origin) and has no fetus.",
    points: [
      "Presents with bleeding in the first half of pregnancy, uterus larger than dates, hyperemesis and very high hCG; USG shows a snowstorm pattern.",
      "Treatment: suction evacuation; follow-up with serial hCG for at least 6 months to 1 year.",
      "About 15% of complete moles turn into persistent disease and about 2 to 3% into choriocarcinoma.",
      "Theca lutein cysts of the ovary are common due to high hCG.",
    ],
    viva: [
      "Karyotype of a complete mole? — 46,XX, entirely paternal.",
      "Contraception advised after a mole? — Barrier or oral contraceptive pills; avoid IUCD until hCG normalises.",
    ],
    mcq: [
      ["Ultrasound appearance of a complete mole is:", "Snowstorm pattern", "Double decidual sac sign", "Gestational sac with yolk sac", "Ring of fire", "Multiple small cystic spaces without a fetus."],
      ["Complete mole is usually:", "46,XX paternal", "69,XXY", "45,X", "47,XXY", "Fertilisation of an empty ovum by one sperm that doubles."],
    ],
  },
  {
    id: "sp-normal-placenta", subject: O, group: G, topic: "Obstetrics", name: "Normal placenta", labelled: true,
    imgs: [{ f: P + "normal-placenta.webp" }],
    identify: [
      "Discoid organ with a fetal surface covered by amnion and the cord attached",
      "Maternal surface divided into 15 to 20 cotyledons",
      "Weight about one-sixth of fetal weight (500 g at term) and 20 cm diameter",
      "Cord inserted centrally or eccentrically",
    ],
    about: "At term the placenta is a round flat disc about 20 cm in diameter and 2.5 cm thick. The fetal surface is smooth and shiny; the maternal surface is rough with cotyledons.",
    points: [
      "Always inspect the placenta after delivery for completeness, to exclude retained cotyledons that cause PPH.",
      "Abnormalities: succenturiate lobe, circumvallate placenta, battledore insertion, velamentous cord insertion.",
      "Functions: gas exchange, nutrition, hormone production (hCG, hPL, oestrogen, progesterone), barrier.",
    ],
    viva: [
      "How many cotyledons does a normal placenta have? — 15 to 20.",
      "Placental weight to fetal weight ratio? — About 1:6.",
    ],
    mcq: [
      ["Normal term placenta weighs about:", "500 g", "200 g", "1000 g", "100 g", "Roughly one-sixth of the baby's weight."],
    ],
  },
  {
    id: "sp-mucinous-cystadenoma", subject: O, group: G, topic: "Gynaecology", name: "Mucinous cystadenoma of ovary", labelled: true,
    imgs: [{ f: P + "mucinous-cystadenoma.webp" }],
    identify: [
      "Large multilocular cystic ovarian mass with a smooth surface",
      "Thin-walled loculi, filled with sticky mucoid fluid",
      "Smooth outer capsule without surface growth",
      "Usually unilateral",
    ],
    about: "A benign mucinous tumour of the ovary, which can reach a huge size and fill the abdomen. The lining is tall columnar mucin-secreting epithelium.",
    points: [
      "Large painless abdominal distension; may cause torsion, rupture or haemorrhage.",
      "Rupture can cause pseudomyxoma peritonei.",
      "Treatment: ovarian cystectomy or oophorectomy; examine the appendix.",
      "CA-125 is more useful in serous tumours; CEA and CA 19-9 may be raised in mucinous tumours.",
    ],
    viva: [
      "Which ovarian tumour can become the largest? — Mucinous cystadenoma.",
    ],
    mcq: [
      ["Pseudomyxoma peritonei is classically associated with:", "Mucinous tumours", "Serous tumours", "Dermoid cyst", "Fibroma", "Rupture releases mucin into the peritoneal cavity."],
    ],
  },
  {
    id: "sp-ectopic-pregnancy", subject: O, group: G, topic: "Obstetrics", name: "Unruptured tubal ectopic pregnancy", labelled: true,
    imgs: [{ f: P + "ectopic-pregnancy.webp" }],
    identify: [
      "Fallopian tube with a bulging sausage-shaped swelling in the ampulla",
      "Bluish-purple tube wall due to haemorrhage",
      "Tube dilated with products of conception and blood clot",
      "Uterus and ovary may be attached",
    ],
    about: "Ectopic pregnancy is implantation outside the uterine cavity; over 95% are tubal, most in the ampulla. The tube is usually distended before it ruptures.",
    points: [
      "Triad: amenorrhoea, pain in the lower abdomen and vaginal bleeding; beta-hCG above the discriminatory zone with an empty uterus on TVS.",
      "Risk factors: PID, previous ectopic, tubal surgery, IUCD, assisted reproduction.",
      "Treatment: methotrexate in stable, unruptured small cases; laparoscopic salpingectomy or salpingostomy; emergency laparotomy if ruptured with shock.",
      "Ruptured isthmic pregnancy presents early (6 weeks), ampullary at 8 weeks.",
    ],
    viva: [
      "Commonest site of ectopic pregnancy? — Ampulla of the fallopian tube.",
      "Drug used for medical management? — Methotrexate.",
    ],
    mcq: [
      ["Commonest cause of death in ectopic pregnancy is:", "Haemorrhage", "Sepsis", "Embolism", "Anaesthesia", "Rupture causes massive intraperitoneal bleeding."],
    ],
  },
  {
    id: "sp-fibroid", subject: O, group: G, topic: "Gynaecology", name: "Uterine fibroid (leiomyoma)", labelled: true,
    imgs: [{ f: P + "fibroid.webp" }],
    identify: [
      "Uterus with a firm, rounded, well-circumscribed mass",
      "Cut section: whorled, pale grey-white, bulging surface",
      "Pseudocapsule of compressed myometrium",
      "Can be subserosal, intramural or submucosal",
    ],
    about: "Fibroids are benign smooth muscle tumours, the commonest tumour in women, and are oestrogen dependent. They are multiple in most cases.",
    points: [
      "Symptoms: menorrhagia, pressure symptoms, dysmenorrhoea, infertility and recurrent pregnancy loss.",
      "Secondary changes: hyaline, cystic and red (carneous) degeneration, calcification (womb stones), sarcomatous change (rare).",
      "Treatment: medical (GnRH analogues, ulipristal, tranexamic acid), myomectomy, UAE or hysterectomy.",
      "Red degeneration occurs in pregnancy and causes acute pain.",
    ],
    viva: [
      "Commonest type of fibroid? — Intramural.",
      "Which type causes most menorrhagia? — Submucous.",
    ],
    mcq: [
      ["Degeneration common in pregnancy is:", "Red (carneous) degeneration", "Hyaline degeneration", "Calcification", "Sarcomatous change", "It presents as pain and low-grade fever."],
    ],
  },
  {
    id: "sp-anencephaly", subject: O, group: G, topic: "Obstetrics", name: "Anencephaly", labelled: true,
    imgs: [{ f: P + "anencephaly.webp" }],
    identify: [
      "Fetus with absence of the cranial vault and cerebral hemispheres",
      "Exposed vascular brain tissue (area cerebrovasculosa)",
      "Frog-like face with bulging eyes",
      "Short neck",
    ],
    about: "Anencephaly is a neural tube defect due to failure of the anterior neuropore to close at the 4th week. It is incompatible with life.",
    points: [
      "Associated with polyhydramnios because the fetus cannot swallow.",
      "AFP is raised in maternal serum and amniotic fluid; diagnosed on the 11 to 14 week scan.",
      "Prevention: folic acid 0.4 mg daily preconceptionally (4 mg if previous affected child).",
      "Termination of pregnancy is permitted at any gestation under the MTP Act in case of lethal anomalies.",
    ],
    viva: [
      "Folic acid dose after a previous neural tube defect? — 4 mg daily.",
    ],
    mcq: [
      ["Anencephaly is associated with:", "Polyhydramnios", "Oligohydramnios", "Raised hCG only", "Low AFP", "Failure to swallow amniotic fluid."],
    ],
  },
  {
    id: "sp-dermoid-cyst", subject: O, group: G, topic: "Gynaecology", name: "Dermoid cyst (mature cystic teratoma)", labelled: true,
    imgs: [{ f: P + "dermoid-cyst.webp" }],
    identify: [
      "Ovarian cyst, usually unilocular with a smooth wall",
      "Contents: sebaceous material, hair and sometimes teeth or bone",
      "Rokitansky protuberance (solid nodule) in the wall",
      "Pedicle that can twist",
    ],
    about: "A mature cystic teratoma is a benign germ cell tumour containing derivatives of all three germ layers. It is the commonest ovarian tumour in young women.",
    points: [
      "Complications: torsion (commonest), rupture, infection, malignant change (squamous cell carcinoma in 1 to 2%).",
      "Bilateral in about 10 to 15%.",
      "Struma ovarii contains thyroid tissue and can cause hyperthyroidism.",
      "Treatment: ovarian cystectomy preserving ovarian tissue.",
    ],
    viva: [
      "Commonest complication? — Torsion.",
      "Which tumour marker is normal? — AFP and hCG are normal in benign teratoma.",
    ],
    mcq: [
      ["Commonest malignant transformation of a dermoid cyst is:", "Squamous cell carcinoma", "Adenocarcinoma", "Melanoma", "Sarcoma", "Seen in older women (1 to 2%)."],
    ],
  },
]
