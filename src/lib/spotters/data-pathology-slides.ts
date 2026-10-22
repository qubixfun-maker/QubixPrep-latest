import type { Spot } from "./types"

const P = "/spotters/pathology-slides/"
const S = "Pathology"
const G = "Pathology slides" as const

export const PATHOLOGY_SLIDES: Spot[] = [
  {
    id: "ps-appendicitis", subject: S, group: G, topic: "GIT", name: "Acute appendicitis",
    imgs: [{ f: P + "ps01.webp" }],
    identify: [
      "Section of appendix: lumen filled with pus, fibrin and necrotic debris",
      "Mucosa ulcerated and necrosed",
      "Dense neutrophilic infiltrate through the mucosa, submucosa and muscularis",
      "Congested vessels and serosal fibrinopurulent exudate",
    ],
    about: "Acute appendicitis begins with luminal obstruction (faecolith or lymphoid hyperplasia) and bacterial invasion. The diagnostic histological criterion is neutrophilic infiltration of the muscularis propria.",
    points: [
      "Early: neutrophils in the mucosa and submucosa only. Established: transmural neutrophils with serositis.",
      "Gangrenous appendicitis shows necrosis and haemorrhage and may perforate.",
      "Complications: perforation, peritonitis, appendicular abscess, pylephlebitis, mucocele.",
    ],
    viva: [
      "What is the histological criterion for the diagnosis? — Neutrophils in the muscularis propria.",
      "Commonest cause of obstruction in adults? — Faecolith (in children, lymphoid hyperplasia).",
    ],
    mcq: [
      ["The diagnostic feature of acute appendicitis is:", "Neutrophils in the muscularis propria", "Lymphoid follicles in the mucosa", "Granulomas with giant cells", "Eosinophils in the mucosa", "Muscle-wall neutrophilic infiltration confirms acute appendicitis."],
      ["Commonest cause of acute appendicitis in adults:", "Faecolith", "Lymphoid hyperplasia", "Worms", "Tumour", "Faecolith obstruction in adults; lymphoid hyperplasia in children."],
    ],
  },
  {
    id: "ps-chronic-cholecystitis", subject: S, group: G, topic: "GIT", name: "Chronic cholecystitis",
    imgs: [{ f: P + "ps02.webp" }],
    identify: [
      "Section of gall bladder (no submucosa)",
      "Mucosa ulcerated or flattened",
      "Chronic inflammatory cells: lymphocytes, plasma cells and macrophages in the wall",
      "Rokitansky-Aschoff sinuses: mucosal invaginations into the muscle layer",
    ],
    about: "Chronic cholecystitis is almost always associated with gallstones. The wall becomes fibrotic and thickened, and the mucosa shows glandular outpouchings called Rokitansky-Aschoff sinuses.",
    points: [
      "Gross: thick fibrotic wall and stones; may show a porcelain gall bladder (calcification), which carries a risk of carcinoma.",
      "Xanthogranulomatous cholecystitis shows foamy macrophages and mimics carcinoma.",
      "Complications: empyema, perforation, fistula, gallstone ileus.",
    ],
    viva: [
      "What is a Rokitansky-Aschoff sinus? — Herniation of mucosa through the muscularis due to raised pressure.",
    ],
    mcq: [
      ["Rokitansky-Aschoff sinuses are seen in:", "Chronic cholecystitis", "Acute appendicitis", "Peptic ulcer", "Crohn's disease", "They represent mucosal herniations into the wall of the gall bladder."],
    ],
  },
  {
    id: "ps-colloid-goitre", subject: S, group: G, topic: "Endocrine", name: "Colloid goitre",
    imgs: [{ f: P + "ps03.webp" }],
    identify: [
      "Section of thyroid showing dilated follicles distended with pink colloid",
      "Lining epithelium flattened or low cuboidal",
      "Variation in follicle size",
      "Areas of haemorrhage or fibrosis in long-standing cases",
    ],
    about: "Colloid goitre results from iodine deficiency or enzymatic defects. TSH stimulation leads to hyperplasia first, then involution leaves large follicles full of colloid.",
    points: [
      "Hyperplastic phase: crowded small follicles with tall cells and papillary infoldings. Involutional phase: large colloid-filled follicles.",
      "Endemic goitre is due to iodine deficiency; sporadic goitre to goitrogens or enzyme defects.",
      "Multinodular goitre can compress the trachea or cause hyperthyroidism (toxic).",
    ],
    viva: [
      "What stimulates goitre formation? — Raised TSH due to low thyroid hormone levels.",
    ],
    mcq: [
      ["Colloid goitre is characterised by:", "Large follicles filled with colloid and flat epithelium", "Papillae with orphan Annie nuclei", "Hurthle cells with lymphoid follicles", "Sheets of anaplastic cells", "Involution leads to distended colloid-rich follicles."],
    ],
  },
  {
    id: "ps-capillary-hemangioma", subject: S, group: G, topic: "Vascular", name: "Capillary haemangioma",
    imgs: [{ f: P + "ps04.webp" }],
    identify: [
      "Section of skin or soft tissue showing a lobulated collection of small capillary-sized channels",
      "Vessels lined by plump endothelial cells and filled with red cells",
      "Thin fibrous septa separate the lobules",
      "No encapsulation and no atypia",
    ],
    about: "A benign vascular tumour made of closely packed capillaries. The juvenile (strawberry) type appears in infancy, grows for months and regresses by 5 to 7 years.",
    points: [
      "Strawberry haemangioma regresses spontaneously; port-wine stain does not.",
      "Pyogenic granuloma is a capillary haemangioma on the skin or gums, often after trauma or in pregnancy.",
      "GLUT-1 positivity distinguishes infantile haemangioma from vascular malformations.",
    ],
    viva: [
      "Does the strawberry haemangioma need treatment? — Usually not; it regresses spontaneously.",
    ],
    mcq: [
      ["Infantile capillary haemangioma typically:", "Regresses spontaneously", "Turns malignant", "Persists for life", "Metastasises", "Most involute by 5 to 7 years of age."],
    ],
  },
  {
    id: "ps-cavernous-hemangioma", subject: S, group: G, topic: "Vascular", name: "Cavernous haemangioma",
    imgs: [{ f: P + "ps05.webp" }],
    identify: [
      "Large dilated blood-filled vascular spaces lined by flat endothelium",
      "Thin walls with intervening fibrous stroma",
      "Poorly circumscribed, may show thrombosis or calcification",
    ],
    about: "Cavernous haemangiomas are made of large vascular channels. They do not regress and can occur in the liver, brain and skin.",
    points: [
      "Associated with von Hippel-Lindau disease when found in the CNS.",
      "Hepatic haemangioma is the commonest benign liver tumour; avoid biopsy because of bleeding.",
      "Deeper and larger than capillary type and often mix with it.",
    ],
    viva: [
      "Commonest benign tumour of the liver? — Cavernous haemangioma.",
    ],
    mcq: [
      ["A tumour of large dilated blood-filled spaces with thin walls is:", "Cavernous haemangioma", "Capillary haemangioma", "Angiosarcoma", "Glomus tumour", "Cavernous haemangioma has large sinusoidal channels."],
    ],
  },
  {
    id: "ps-tb-lymphnode", subject: S, group: G, topic: "Lymphoreticular", name: "Tuberculosis of lymph node",
    imgs: [{ f: P + "ps06.webp" }],
    identify: [
      "Lymph node with multiple epithelioid cell granulomas",
      "Central caseous necrosis (amorphous pink area)",
      "Langhans giant cells with horseshoe-shaped nuclei at the periphery",
      "Surrounding lymphocytes and fibrosis",
    ],
    about: "Tuberculous lymphadenitis shows caseating granulomas, a type IV hypersensitivity response. Cervical nodes are the commonest site (scrofula).",
    points: [
      "Confirm with Ziehl-Neelsen stain for acid-fast bacilli and with culture or PCR.",
      "Caseation is the key difference from sarcoidosis, where granulomas are non-caseating.",
      "Cold abscess and sinus formation can follow.",
    ],
    viva: [
      "What are Langhans giant cells? — Multinucleated giant cells with nuclei arranged in a horseshoe at the periphery.",
    ],
    mcq: [
      ["Caseous necrosis with Langhans giant cells suggests:", "Tuberculosis", "Sarcoidosis", "Crohn's disease", "Leprosy tuberculoid", "Caseating granulomas are the hallmark of TB."],
    ],
  },
  {
    id: "ps-tb-intestine", subject: S, group: G, topic: "GIT", name: "Tuberculosis of intestine",
    imgs: [{ f: P + "ps07.webp" }],
    identify: [
      "Section of intestine with ulceration of the mucosa",
      "Caseating granulomas in the submucosa and muscle layer",
      "Epithelioid cells and Langhans giant cells",
      "Lymphoid aggregates around the lesion",
    ],
    about: "Intestinal TB commonly involves the ileocaecal region. Ulcers lie transversely (girdle ulcers), unlike typhoid ulcers that lie longitudinally.",
    points: [
      "Healing by fibrosis causes annular strictures and subacute obstruction.",
      "Hyperplastic ileocaecal TB can mimic carcinoma or Crohn's disease.",
      "Treatment is medical (ATT); surgery for complications.",
    ],
    viva: [
      "How do TB ulcers differ from typhoid ulcers? — TB ulcers are transverse; typhoid ulcers are longitudinal along Peyer's patches.",
    ],
    mcq: [
      ["Ulcers in intestinal tuberculosis lie:", "Transversely", "Longitudinally", "In the rectum only", "In the oesophagus", "Transverse (girdle) ulcers follow the lymphatics around the gut."],
    ],
  },
  {
    id: "ps-adenocarcinoma", subject: S, group: G, topic: "GIT", name: "Adenocarcinoma (colon)",
    imgs: [{ f: P + "ps08.webp" }],
    identify: [
      "Irregular malignant glands lined by tall columnar cells",
      "Cells show pleomorphism, hyperchromasia and loss of polarity",
      "Glands invade the stroma and muscle layer",
      "Mitoses and necrotic debris in the lumens (dirty necrosis)",
    ],
    about: "Colorectal adenocarcinoma arises from adenomatous polyps through the APC, KRAS, p53 sequence. Well-differentiated tumours form back-to-back glands.",
    points: [
      "Dukes and TNM staging depend on depth of invasion and nodal spread; CEA is a tumour marker for follow-up.",
      "Right-sided cancers present with anaemia; left-sided with obstruction and altered bowel habit.",
      "Mucinous variant has large lakes of extracellular mucin.",
    ],
    viva: [
      "Tumour marker of colorectal cancer? — CEA.",
    ],
    mcq: [
      ["Colon cancer in familial adenomatous polyposis is caused by a mutation in:", "APC gene", "RB gene", "BRCA1", "VHL", "APC loss starts the adenoma-carcinoma sequence."],
    ],
  },
  {
    id: "ps-secretory-endometrium", subject: S, group: G, topic: "Gynaecology", name: "Secretory endometrium",
    imgs: [{ f: P + "ps09.webp" }],
    identify: [
      "Endometrial glands that are tortuous with a saw-toothed outline",
      "Subnuclear and then supranuclear vacuoles with luminal secretions",
      "Oedematous stroma with spiral arterioles in the late phase",
      "Seen in the second half of the menstrual cycle",
    ],
    about: "Under the effect of progesterone from the corpus luteum, the endometrial glands become coiled and secrete glycogen-rich fluid, preparing for implantation.",
    points: [
      "Subnuclear vacuoles appear on day 16, secretions by day 20 to 22, predecidual change by day 25.",
      "Used to confirm ovulation on endometrial biopsy.",
      "Irregular shedding suggests a persistent corpus luteum.",
    ],
    viva: [
      "Which hormone produces the secretory phase? — Progesterone.",
    ],
    mcq: [
      ["Subnuclear vacuolation of endometrial glands appears about day:", "16", "6", "10", "28", "It is the earliest sign of ovulation in the endometrium."],
    ],
  },
  {
    id: "ps-proliferative-endometrium", subject: S, group: G, topic: "Gynaecology", name: "Proliferative endometrium",
    imgs: [{ f: P + "ps10.webp" }],
    identify: [
      "Straight, tubular glands lined by pseudostratified columnar cells",
      "Mitoses in glands and stroma",
      "Dense cellular stroma",
      "No secretions or vacuoles",
    ],
    about: "In the first half of the cycle, oestrogen stimulates the glands to grow into long straight tubules, and the endometrium thickens to about 3 to 5 mm.",
    points: [
      "Distinguished from hyperplasia by orderly, evenly spaced glands with a normal gland-to-stroma ratio.",
      "Persistent proliferative pattern suggests anovulation.",
    ],
    viva: [
      "Which phase is controlled by oestrogen? — Proliferative phase.",
    ],
    mcq: [
      ["Straight tubular glands with mitoses and no secretion indicate:", "Proliferative endometrium", "Secretory endometrium", "Atrophic endometrium", "Decidual change", "Oestrogen effect without progesterone."],
    ],
  },
  {
    id: "ps-bph", subject: S, group: G, topic: "Genitourinary", name: "Benign prostatic hyperplasia (BHP)",
    imgs: [{ f: P + "ps11.webp" }],
    identify: [
      "Hyperplastic glands of different sizes with papillary infoldings",
      "Two-layered epithelium: inner columnar and outer basal cells",
      "Corpora amylacea in the lumens",
      "Increased fibromuscular stroma in nodules",
    ],
    about: "BPH is a nodular hyperplasia of both glands and stroma in the transitional zone, driven by dihydrotestosterone. It compresses the prostatic urethra.",
    points: [
      "Symptoms: hesitancy, poor stream, nocturia, retention.",
      "Treatment: alpha-blockers (tamsulosin), 5-alpha reductase inhibitors (finasteride), TURP.",
      "Does not become malignant but may coexist with carcinoma.",
    ],
    viva: [
      "Which zone is involved in BPH? — Transitional (periurethral) zone.",
    ],
    mcq: [
      ["The hormone mainly responsible for BPH is:", "Dihydrotestosterone", "Testosterone", "Oestradiol", "LH", "DHT, formed by 5-alpha reductase."],
    ],
  },
  {
    id: "ps-lipoma", subject: S, group: G, topic: "Soft tissue", name: "Lipoma",
    imgs: [{ f: P + "ps12.webp" }],
    identify: [
      "Mature adipocytes with clear cytoplasm and peripheral flattened nuclei",
      "Thin fibrous capsule",
      "Fibrous septa dividing the tissue into lobules",
      "No atypia or lipoblasts",
    ],
    about: "Lipoma is the commonest benign soft tissue tumour. It is made of normal-looking fat cells and is usually subcutaneous, soft and mobile.",
    points: [
      "Liposarcoma shows atypical lipoblasts and is usually deep and large.",
      "Treatment is excision; recurrence is rare.",
      "Angiolipoma is a painful variant with vessels.",
    ],
    viva: [
      "Commonest soft tissue tumour? — Lipoma.",
    ],
    mcq: [
      ["Lipoblasts are characteristic of:", "Liposarcoma", "Lipoma", "Hibernoma", "Fat necrosis", "Atypical lipoblasts define liposarcoma."],
    ],
  },
  {
    id: "ps-cirrhosis", subject: S, group: G, topic: "Liver", name: "Cirrhosis of liver",
    imgs: [{ f: P + "ps13.webp" }],
    identify: [
      "Loss of normal lobular architecture",
      "Regenerative nodules of hepatocytes surrounded by fibrous septa",
      "Chronic inflammatory cells and proliferating bile ductules in the septa",
      "Fatty change or Mallory hyaline in alcoholic type",
    ],
    about: "Cirrhosis is diffuse fibrosis with nodule formation. The nodules are separated by bands of fibrous tissue that connect portal tracts and central veins.",
    points: [
      "Micronodular (alcoholic) and macronodular (post-viral) types.",
      "Complications: portal hypertension, ascites, varices, encephalopathy, hepatocellular carcinoma.",
      "Reticulin stain highlights the nodules; Masson trichrome shows the fibrosis.",
    ],
    viva: [
      "What are the three essential features of cirrhosis? — Diffuse involvement, fibrosis, regenerative nodules.",
    ],
    mcq: [
      ["Which cells produce collagen in cirrhosis?", "Hepatic stellate cells", "Kupffer cells", "Hepatocytes", "Cholangiocytes", "Activated stellate cells lay down fibrous tissue."],
    ],
  },
  {
    id: "ps-fatty-liver", subject: S, group: G, topic: "Liver", name: "Fatty liver",
    imgs: [{ f: P + "ps14.webp" }],
    identify: [
      "Hepatocytes with clear vacuoles of fat that push the nucleus to the side",
      "Macrovesicular steatosis (single large vacuole)",
      "Lobular architecture preserved",
      "Starts in the centrilobular zone in alcohol-related injury",
    ],
    about: "Fatty change is the accumulation of triglyceride in hepatocytes due to alcohol, obesity, diabetes, drugs or toxins. It is reversible.",
    points: [
      "Alcoholic hepatitis adds Mallory-Denk bodies and neutrophils.",
      "Non-alcoholic fatty liver disease is linked with metabolic syndrome.",
      "Fat is dissolved in routine processing; Oil Red O on frozen sections confirms it.",
    ],
    viva: [
      "Which stain demonstrates fat? — Oil Red O or Sudan III on frozen sections.",
    ],
    mcq: [
      ["Fat in tissue is best demonstrated by:", "Oil Red O on frozen section", "H&E on paraffin section", "PAS", "Congo red", "Routine processing dissolves lipid."],
    ],
  },
  {
    id: "ps-mucinous-cystadenoma", subject: S, group: G, topic: "Gynaecology", name: "Mucinous cystadenoma of ovary",
    imgs: [{ f: P + "ps15.webp" }],
    identify: [
      "Cyst wall lined by a single layer of tall columnar mucin-secreting cells",
      "Basal, uniform nuclei with apical mucin",
      "Cysts of varying size in a fibrous stroma",
      "No papillary projections, atypia or invasion",
    ],
    about: "A benign epithelial ovarian tumour that forms large multilocular cysts filled with sticky mucin. Rupture can cause pseudomyxoma peritonei.",
    points: [
      "Gross: large multilocular cyst with smooth surface and glairy fluid.",
      "Mucinous tumours are usually unilateral; serous tumours are often bilateral.",
      "Always check the appendix when pseudomyxoma peritonei is present.",
    ],
    viva: [
      "Which ovarian tumour causes pseudomyxoma peritonei? — Mucinous tumours (often of appendiceal origin).",
    ],
    mcq: [
      ["The lining of a mucinous cystadenoma is:", "Tall columnar mucin-secreting cells", "Ciliated cuboidal cells", "Squamous cells", "Transitional cells", "Endocervical-type mucinous epithelium."],
    ],
  },
  {
    id: "ps-bcc", subject: S, group: G, topic: "Skin", name: "Basal cell carcinoma",
    imgs: [{ f: P + "ps16.webp" }],
    identify: [
      "Islands and nests of basaloid cells in the dermis",
      "Peripheral palisading of the nuclei",
      "Retraction clefts between tumour and stroma",
      "Connected to the epidermis; no keratin pearls",
    ],
    about: "BCC is the commonest skin cancer, arises from the basal layer on sun-exposed skin, and is locally invasive but rarely metastasises.",
    points: [
      "Gross: pearly nodule with rolled edges and a central rodent ulcer.",
      "Hedgehog pathway (PTCH) mutations; Gorlin syndrome.",
      "Treatment: excision, Mohs surgery, radiotherapy.",
    ],
    viva: [
      "Characteristic microscopic feature? — Peripheral palisading with retraction clefts.",
    ],
    mcq: [
      ["Rodent ulcer is the gross appearance of:", "Basal cell carcinoma", "Squamous cell carcinoma", "Melanoma", "Keratoacanthoma", "BCC with a pearly rolled border."],
    ],
  },
  {
    id: "ps-squamous-papilloma", subject: S, group: G, topic: "Skin", name: "Squamous papilloma",
    imgs: [{ f: P + "ps17.webp" }],
    identify: [
      "Finger-like papillae with a central fibrovascular core",
      "Covered by hyperplastic stratified squamous epithelium",
      "Hyperkeratosis and papillomatosis",
      "Basement membrane intact; no invasion",
    ],
    about: "A benign epithelial tumour made of branching papillae covered by normal-looking squamous epithelium. It is often caused by HPV.",
    points: [
      "HPV 6 and 11 cause warts and laryngeal papillomas.",
      "Differs from carcinoma because the base is intact and cells are mature.",
    ],
    viva: [
      "Which virus causes squamous papilloma? — Human papillomavirus.",
    ],
    mcq: [
      ["Fibrovascular cores covered by benign squamous epithelium describe:", "Squamous papilloma", "Squamous carcinoma", "Keratoacanthoma", "Seborrhoeic keratosis only", "A papilloma has a core of connective tissue."],
    ],
  },
  {
    id: "ps-scc", subject: S, group: G, topic: "Skin", name: "Squamous cell carcinoma (skin)",
    imgs: [{ f: P + "ps18.webp" }],
    identify: [
      "Irregular masses of malignant squamous cells invading the dermis",
      "Keratin pearls (concentric whorls of keratinisation)",
      "Intercellular bridges and individual cell keratinisation",
      "Pleomorphic nuclei and mitoses",
    ],
    about: "Squamous cell carcinoma arises from the epidermal keratinocytes in sun-damaged skin, scars (Marjolin's ulcer) or in HPV-related sites. It can metastasise to lymph nodes.",
    points: [
      "Well-differentiated tumours form keratin pearls; poorly differentiated ones do not.",
      "Spreads by lymphatics, unlike BCC.",
      "Risk factors: UV light, arsenic, chronic ulcers, immunosuppression.",
    ],
    viva: [
      "What is Marjolin's ulcer? — Squamous cell carcinoma arising in a chronic scar or ulcer.",
    ],
    mcq: [
      ["Keratin pearls are characteristic of:", "Squamous cell carcinoma", "Basal cell carcinoma", "Melanoma", "Adenocarcinoma", "Concentric layers of keratin are the hallmark."],
    ],
  },
  {
    id: "ps-melanoma", subject: S, group: G, topic: "Skin", name: "Malignant melanoma",
    imgs: [{ f: P + "ps19.webp" }],
    identify: [
      "Nests and sheets of atypical melanocytes in the epidermis and dermis",
      "Large nuclei with prominent eosinophilic nucleoli",
      "Brown melanin pigment in many cells",
      "Pagetoid spread of tumour cells up into the epidermis",
    ],
    about: "Melanoma is a malignant tumour of melanocytes. Prognosis depends on Breslow thickness (depth of invasion in millimetres).",
    points: [
      "Markers: S-100, HMB-45, Melan-A.",
      "BRAF V600E mutation is common and treated with vemurafenib.",
      "ABCDE rule: asymmetry, border, colour, diameter, evolution.",
    ],
    viva: [
      "Most important prognostic factor? — Breslow thickness.",
    ],
    mcq: [
      ["Immunohistochemical markers of melanoma include:", "S-100 and HMB-45", "Cytokeratin and EMA", "CD20 and CD3", "Desmin and actin", "S-100 and HMB-45 are melanocytic markers."],
    ],
  },
  {
    id: "ps-scirrhous-breast", subject: S, group: G, topic: "Breast", name: "Scirrhous carcinoma of breast",
    imgs: [{ f: P + "ps20.webp" }],
    identify: [
      "Small clusters, cords and single malignant cells in a dense fibrous (desmoplastic) stroma",
      "Pleomorphic hyperchromatic nuclei",
      "Infiltration of fat",
      "Often accompanied by DCIS or elastosis",
    ],
    about: "Scirrhous carcinoma is the invasive ductal carcinoma (no special type), the most common breast cancer. The dense stroma makes the tumour hard.",
    points: [
      "Gross: hard, stellate, gritty mass that retracts the nipple or skin.",
      "ER, PR and HER2 status guide hormonal and targeted therapy.",
      "Spreads to axillary nodes, bone, lung, liver and brain.",
    ],
    viva: [
      "What does scirrhous mean? — Hard, due to abundant fibrous stroma.",
    ],
    mcq: [
      ["The commonest histological type of breast cancer is:", "Invasive ductal carcinoma NST", "Invasive lobular carcinoma", "Medullary carcinoma", "Mucinous carcinoma", "Scirrhous carcinoma is the common ductal type."],
    ],
  },
  {
    id: "ps-fibroadenoma", subject: S, group: G, topic: "Breast", name: "Fibroadenoma of breast",
    imgs: [{ f: P + "ps21.webp" }],
    identify: [
      "Well-circumscribed lesion with both epithelial and stromal elements",
      "Ducts compressed into slit-like spaces (intracanalicular) or round open ducts (pericanalicular)",
      "Loose myxoid stroma of fibroblasts",
      "Bilayered epithelium without atypia",
    ],
    about: "Fibroadenoma is the commonest benign breast tumour in young women. It is a firm, mobile, painless lump (breast mouse).",
    points: [
      "Stromal proliferation compresses the ducts; hormonally responsive and may enlarge in pregnancy.",
      "Phyllodes tumour has a more cellular stroma with leaf-like clefts.",
      "Treated by excision if large or growing.",
    ],
    viva: [
      "What is the clinical sign of a fibroadenoma? — A mobile, well-defined, rubbery lump called the breast mouse.",
    ],
    mcq: [
      ["The commonest benign tumour of the breast is:", "Fibroadenoma", "Phyllodes tumour", "Intraductal papilloma", "Lipoma", "Seen mainly in women aged 15 to 30 years."],
    ],
  },
  {
    id: "ps-rcc", subject: S, group: G, topic: "Genitourinary", name: "Renal cell carcinoma",
    imgs: [{ f: P + "ps22.webp" }],
    identify: [
      "Sheets and nests of polygonal cells with clear cytoplasm (clear cell type)",
      "Rich delicate capillary network",
      "Round nuclei with prominent nucleoli",
      "Cytoplasm clear because lipid and glycogen are dissolved",
    ],
    about: "Clear cell RCC arises from the proximal tubular cells. Loss of the VHL gene on chromosome 3p is the common mutation.",
    points: [
      "Classic triad: haematuria, flank pain and palpable mass (present in a minority).",
      "Paraneoplastic: polycythaemia, hypercalcaemia, hypertension, Stauffer syndrome.",
      "Spreads through the renal vein into the IVC; metastasises to lung and bone (cannonball).",
    ],
    viva: [
      "Which gene is associated with clear cell RCC? — VHL.",
    ],
    mcq: [
      ["Renal cell carcinoma commonly extends into:", "Renal vein", "Ureter only", "Bladder wall", "Spinal cord", "Venous invasion is characteristic."],
    ],
  },
  {
    id: "ps-pleomorphic-adenoma", subject: S, group: G, topic: "Head and neck", name: "Pleomorphic salivary adenoma",
    imgs: [{ f: P + "ps23.webp" }],
    identify: [
      "Epithelial elements: ducts and sheets of cuboidal cells",
      "Myoepithelial cells",
      "Chondromyxoid (bluish) stroma",
      "Encapsulated tumour with pseudopod-like extensions",
    ],
    about: "Pleomorphic adenoma (mixed tumour) is the commonest salivary gland tumour, usually in the parotid. It has a mixture of epithelial and mesenchymal-like elements.",
    points: [
      "Recurrence if enucleated because of capsular pseudopodia; treated by superficial parotidectomy.",
      "Can undergo malignant change (carcinoma ex pleomorphic adenoma).",
      "Warthin tumour is the second commonest, seen in elderly smokers.",
    ],
    viva: [
      "Why does it recur? — Incomplete excision leaves tumour in capsular extensions.",
    ],
    mcq: [
      ["The commonest salivary gland tumour is:", "Pleomorphic adenoma", "Warthin tumour", "Mucoepidermoid carcinoma", "Adenoid cystic carcinoma", "Over 60% of salivary tumours."],
    ],
  },
  {
    id: "ps-seminoma", subject: S, group: G, topic: "Genitourinary", name: "Seminoma of testis",
    imgs: [{ f: P + "ps24.webp" }],
    identify: [
      "Sheets of uniform large round cells with clear cytoplasm and central nuclei",
      "Fibrous septa containing lymphocytes",
      "Granulomas may be present",
      "Resembles primordial germ cells",
    ],
    about: "Seminoma is the commonest testicular germ cell tumour in men aged 30 to 40. It is very radiosensitive and has an excellent prognosis.",
    points: [
      "Markers: placental alkaline phosphatase and often raised LDH; AFP is normal.",
      "Spreads to para-aortic nodes first.",
      "Dysgerminoma of the ovary is its counterpart.",
    ],
    viva: [
      "Which marker is raised in yolk sac tumour but not in pure seminoma? — AFP.",
    ],
    mcq: [
      ["The commonest testicular tumour is:", "Seminoma", "Yolk sac tumour", "Teratoma", "Leydig cell tumour", "A germ cell tumour with an excellent response to radiotherapy."],
    ],
  },
  {
    id: "ps-gct-bone", subject: S, group: G, topic: "Bone", name: "Giant cell tumour of bone",
    imgs: [{ f: P + "ps25.webp" }],
    identify: [
      "Multinucleated osteoclast-like giant cells with 20 or more nuclei",
      "Uniform round to oval mononuclear stromal cells",
      "Nuclei of the giant cells resemble those of stromal cells",
      "Haemorrhage and haemosiderin",
    ],
    about: "GCT of bone arises in the epiphysis of long bones (lower end of the femur and upper end of the tibia) in young adults. The mononuclear stromal cells are the true neoplastic cells.",
    points: [
      "X-ray: eccentric lytic lesion with a soap-bubble appearance at the epiphysis.",
      "Treated with curettage, or denosumab (RANKL inhibitor) in large lesions; locally aggressive and can recur.",
      "Rarely metastasises to the lung.",
    ],
    viva: [
      "Where in the bone does GCT arise? — Epiphysis.",
    ],
    mcq: [
      ["Denosumab acts on:", "RANKL", "VEGF", "HER2", "EGFR", "It inhibits RANK ligand on the stromal cells."],
    ],
  },
  {
    id: "ps-osteosarcoma", subject: S, group: G, topic: "Bone", name: "Osteosarcoma",
    imgs: [{ f: P + "ps26.webp" }],
    identify: [
      "Highly pleomorphic malignant spindle and oval cells with hyperchromatic nuclei",
      "Lace-like pink osteoid directly produced by tumour cells",
      "Atypical mitoses and tumour giant cells",
      "Often chondroblastic or fibroblastic areas",
    ],
    about: "Osteosarcoma is the commonest primary malignant bone tumour in adolescents. It arises in the metaphysis of long bones around the knee. The diagnostic feature is tumour osteoid.",
    points: [
      "X-ray: Codman triangle and sunburst periosteal reaction.",
      "Associated with Rb and p53 mutations, Paget disease and prior radiation.",
      "Spreads by blood to the lungs; treated with neoadjuvant chemotherapy and limb-salvage surgery.",
    ],
    viva: [
      "What identifies the tumour as an osteosarcoma? — Direct production of osteoid by the malignant cells.",
    ],
    mcq: [
      ["Codman triangle is seen in:", "Osteosarcoma", "Osteoma", "Simple bone cyst", "Osteochondroma", "Periosteal elevation by the aggressive tumour."],
    ],
  },
]
