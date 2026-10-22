import type { Extra } from "./extra"

export const EXTRA_PATHOLOGY: Record<string, Extra> = {
  "ps-appendicitis": {
    about: "This H&E section of the appendix shows the changes of acute inflammation. The lumen contains pus, fibrin and necrotic debris, and the mucosa is ulcerated or eroded. A dense infiltrate of neutrophils passes through the mucosa and submucosa into the muscularis propria, which is the diagnostic criterion, and the vessels in the wall are congested. In the established stage the serosa shows a fibrinopurulent exudate, which leads to peritonitis. The most common cause is luminal obstruction by a faecolith or lymphoid hyperplasia with secondary bacterial invasion by gut organisms (E. coli, Bacteroides). In gangrenous appendicitis the wall shows necrosis, haemorrhage and thrombosis of vessels, with perforation as a complication. Clinically it presents with migratory right iliac fossa pain, anorexia, fever and leucocytosis.",
    points: [
      "Diagnostic criterion: neutrophils in the muscularis propria.",
      "Stages: early (mucosal and submucosal neutrophils), suppurative or phlegmonous, gangrenous, perforated.",
      "Causes of obstruction: faecolith (adults), lymphoid hyperplasia (children), worms, tumours such as carcinoid.",
      "Carcinoid tumour is the commonest tumour of the appendix, typically found at the tip.",
    ],
    viva: [
      "What is the commonest tumour of the appendix? — Carcinoid (neuroendocrine tumour), usually at the tip.",
      "What organisms cause appendicitis? — E. coli and Bacteroides fragilis.",
    ],
    mcq: [
      ["Acute appendicitis is diagnosed histologically by neutrophils in:", "Muscularis propria", "Mucosa only", "Lymphoid follicles", "Serosa only", "Transmural neutrophilic infiltration confirms it."],
      ["The commonest tumour of the appendix is:", "Carcinoid", "Adenocarcinoma", "Lymphoma", "Mucocoele", "Carcinoid occurs at the tip of the appendix."],
    ],
  },
  "ps-chronic-cholecystitis": {
    about: "This section of the gall bladder wall shows chronic cholecystitis. The mucosa is thrown into folds and shows Rokitansky-Aschoff sinuses, which are herniations of the surface epithelium into the thickened muscular wall. The wall is thickened by fibrosis and has a chronic inflammatory infiltrate of lymphocytes, plasma cells and macrophages in the lamina propria, subserosa and muscular layer, together with smooth muscle hypertrophy. Cholesterolosis (foamy macrophages) may be present. Chronic cholecystitis is nearly always associated with gallstones and presents with recurrent biliary colic, dyspepsia and fat intolerance. The complications include acute-on-chronic cholecystitis, perforation, empyema and, rarely, carcinoma of the gall bladder.",
    points: [
      "Histology: thickened wall, chronic inflammatory cells, Rokitansky-Aschoff sinuses, fibrosis and muscle hypertrophy.",
      "Over 90 percent are associated with gallstones.",
      "Strawberry gall bladder: cholesterolosis, cholesterol-laden macrophages in the lamina propria.",
      "Porcelain gall bladder: wall calcification and a risk of carcinoma.",
    ],
    viva: [
      "What are Rokitansky-Aschoff sinuses? — Outpouchings of the mucosa into or through the muscular wall of the gall bladder.",
      "What is porcelain gall bladder? — A calcified wall associated with an increased risk of carcinoma.",
    ],
    mcq: [
      ["Rokitansky-Aschoff sinuses are seen in:", "Chronic cholecystitis", "Acute appendicitis", "Cirrhosis", "Fatty liver", "They are herniations of the mucosa into the wall."],
      ["Strawberry gall bladder is due to:", "Cholesterolosis", "Carcinoma", "Empyema", "Hydrops", "Cholesterol deposits give the speckled appearance."],
    ],
  },
  "ps-colloid-goitre": {
    about: "This section of the thyroid shows large, distended follicles filled with abundant pink-staining colloid, lined by flat or cuboidal epithelium that is compressed by the colloid. There is little follicular hyperplasia, and in long-standing goitres there may be areas of fibrosis, haemorrhage, cystic change, calcification and cholesterol clefts. This is an involutional stage after an earlier hyperplastic phase in which the follicles were small and lined by tall columnar cells. It results from iodine deficiency and is endemic in hilly areas. Patients are euthyroid, with a diffuse or multinodular goitre.",
    points: [
      "Large follicles filled with colloid, flat lining epithelium.",
      "The earlier hyperplastic stage shows papillary infolding of tall columnar cells and little colloid.",
      "Multinodular goitre: nodules of varying sizes with degenerative changes.",
      "Prevention: iodised salt.",
    ],
    viva: [
      "What is the stage after hyperplasia in a goitre? — Colloid involution.",
      "What is the commonest cause of goitre worldwide? — Iodine deficiency.",
    ],
    mcq: [
      ["The follicles in a colloid goitre are:", "Large and filled with colloid", "Small and empty", "Papillary", "Cystic with keratin", "They are distended with colloid."],
      ["The prevention of endemic goitre is by:", "Iodised salt", "Selenium", "Vitamin D", "Iron", "Iodine supplementation prevents it."],
    ],
  },
  "ps-capillary-hemangioma": {
    about: "This section shows a capillary haemangioma, a benign vascular tumour made of closely packed, thin-walled capillary-sized vessels lined by a single layer of plump endothelial cells and separated by a scanty connective tissue stroma. The lumens are small and may contain red blood cells. The lesion is not encapsulated and lobulated. Juvenile (strawberry) haemangioma appears in infancy, grows rapidly in the first year and then regresses by age 5 to 7 years. Pyogenic granuloma is a lobular capillary haemangioma of the skin and mucosa that bleeds easily and is associated with trauma and pregnancy. Most do not need treatment; propranolol is effective for large or functionally important lesions.",
    points: [
      "Small, thin-walled capillaries with plump endothelium and few red cells.",
      "Strawberry (juvenile) haemangioma regresses spontaneously by 5 to 7 years.",
      "Pyogenic granuloma: lobular capillary haemangioma with surface ulceration.",
      "Treatment: observation, propranolol, laser for functional lesions.",
    ],
    viva: [
      "What is a strawberry naevus? — A capillary haemangioma of infancy that regresses by itself.",
      "Name a drug used for infantile haemangioma. — Propranolol.",
    ],
    mcq: [
      ["Capillary haemangioma of infancy usually:", "Regresses spontaneously", "Becomes malignant", "Enlarges for life", "Is encapsulated", "Most regress by childhood."],
      ["Drug used for infantile haemangioma is:", "Propranolol", "Methotrexate", "Digoxin", "Aspirin", "Beta-blocker therapy shrinks the lesion."],
    ],
  },
  "ps-cavernous-hemangioma": {
    about: "This section shows a cavernous haemangioma composed of large, dilated, blood-filled vascular spaces lined by flat endothelium and separated by thin fibrous septa. The channels are irregular and ill-defined at the edges and may contain thrombi, phleboliths (calcified thrombi), or fibrosis. It is less likely to regress than a capillary haemangioma and may be deep in the skin, liver, brain or other organs. In the liver it is the commonest benign tumour and is usually asymptomatic. In the cerebellum, retina, and pancreas it may be a part of von Hippel-Lindau disease. Treatment is rarely needed unless there is bleeding or functional compromise.",
    points: [
      "Large dilated vascular spaces with thin walls and fibrous septa.",
      "Thrombosis and phleboliths are common; they do not regress.",
      "Liver: commonest benign liver tumour; avoid biopsy because of the risk of haemorrhage.",
      "Associated with von Hippel-Lindau disease (cerebellar haemangioblastoma, retina).",
    ],
    viva: [
      "How does cavernous haemangioma differ from capillary type? — Larger vascular spaces, deeper, and no spontaneous regression.",
      "What is the commonest benign liver tumour? — Cavernous haemangioma.",
    ],
    mcq: [
      ["Dilated blood-filled spaces with thin septa are seen in:", "Cavernous haemangioma", "Capillary haemangioma", "Lymphangioma", "Glomus tumour", "Large vascular spaces define the cavernous type."],
      ["Calcified thrombi in a haemangioma are called:", "Phleboliths", "Psammoma bodies", "Gamna-Gandy bodies", "Corpora amylacea", "Phleboliths form in thrombosed channels."],
    ],
  },
  "ps-tb-lymphnode": {
    about: "This section of a lymph node shows tuberculous lymphadenitis. The normal architecture is replaced by multiple epithelioid cell granulomas with central caseous necrosis, which appears as amorphous, pink, granular material. Around the necrosis are epithelioid histiocytes (elongated cells with pale pink cytoplasm and a slipper-shaped nucleus), Langhans giant cells (multinucleated cells with the nuclei arranged in a horseshoe pattern at the periphery), and an outer rim of lymphocytes and fibroblasts. The cervical lymph nodes (scrofula) are most commonly involved. The diagnosis is confirmed by finding acid-fast bacilli with Ziehl-Neelsen stain, PCR (CBNAAT) or culture. Cold abscess and collar-stud abscess may result.",
    points: [
      "Tubercle: central caseous necrosis, epithelioid cells, Langhans giant cells, peripheral lymphocytes.",
      "Stain: Ziehl-Neelsen for acid-fast bacilli; CBNAAT (GeneXpert) confirms it.",
      "Scrofula: tuberculous cervical lymphadenitis; matted nodes, cold abscess, collar-stud abscess.",
      "Treatment: standard antitubercular therapy; incision and drainage is avoided (risk of a sinus).",
    ],
    viva: [
      "What is the hallmark lesion of TB? — Caseating granuloma.",
      "What is a Langhans giant cell? — A multinucleated giant cell with nuclei arranged in a horseshoe at the periphery.",
      "What is scrofula? — Tuberculous cervical lymphadenitis.",
    ],
    mcq: [
      ["Caseous necrosis is characteristic of:", "Tuberculosis", "Acute appendicitis", "Typhoid fever", "Hepatitis", "TB granulomas undergo caseation."],
      ["Langhans giant cells have nuclei arranged:", "In a horseshoe at the periphery", "Randomly", "Centrally", "In a single line", "A horseshoe arrangement is typical."],
      ["The stain for acid-fast bacilli is:", "Ziehl-Neelsen", "Gram stain", "PAS", "Congo red", "ZN stain detects mycobacteria."],
    ],
  },
  "ps-tb-intestine": {
    about: "This section of intestinal wall shows tuberculosis with ulceration of the mucosa and multiple granulomas in the submucosa, muscularis and serosa. Each granuloma has central caseous necrosis surrounded by epithelioid cells and Langhans giant cells with a peripheral cuff of lymphocytes. The ulcer is transversely oriented and may lead to stricture, and the mesenteric lymph nodes are caseous. Compared with Crohn's disease, caseation and acid-fast bacilli are present in TB, whereas Crohn's has non-caseating granulomas, transmural inflammation, fissuring ulcers and lymphoid aggregates. The ileocaecal region is the commonest site.",
    points: [
      "Caseating granulomas with Langhans giant cells in the mucosa and submucosa.",
      "Transverse ulcers, strictures and enlarged caseous mesenteric nodes.",
      "Crohn's: non-caseating granulomas, longitudinal fissuring ulcers, skip lesions.",
      "Confirm with acid-fast bacilli on ZN stain or CBNAAT.",
    ],
    viva: [
      "How do you distinguish TB from Crohn's histologically? — Caseation and AFB in TB; non-caseating granulomas in Crohn's.",
      "Which is the commonest site of intestinal TB? — Ileocaecal region.",
    ],
    mcq: [
      ["Which feature favours TB over Crohn's disease?", "Caseous necrosis", "Skip lesions", "Fissures", "Transmural inflammation only", "Caseation suggests TB."],
      ["Granulomas in Crohn's disease are typically:", "Non-caseating", "Caseating", "Absent", "Necrotising with abscesses", "Non-caseating granulomas occur in Crohn's."],
    ],
  },
  "ps-adenocarcinoma": {
    about: "This section of the colon shows an adenocarcinoma. Irregular, back-to-back malignant glands of varying sizes and shapes are lined by tall columnar cells that have hyperchromatic, enlarged, pleomorphic nuclei with loss of polarity, mitoses and a multilayered pattern. The glands infiltrate the muscularis mucosae and the muscle wall in a haphazard way, with a desmoplastic stroma. The neoplastic cells may secrete mucin, and necrotic debris is seen in the lumen of the glands (dirty necrosis). The adenoma-carcinoma sequence involves APC, KRAS and p53 mutations. Risk factors include a diet low in fibre, polyps, ulcerative colitis, FAP and Lynch syndrome. The diagnosis is by colonoscopy and biopsy, the CEA is used for follow-up, and the treatment is surgical resection with chemotherapy.",
    points: [
      "Features: glandular pattern, pleomorphic hyperchromatic nuclei, loss of polarity, mitoses, desmoplasia.",
      "Adenoma-carcinoma sequence: APC, KRAS, then p53 mutations.",
      "Staging: Dukes and TNM; prognosis depends on nodal status.",
      "Marker for follow-up: CEA (not for screening).",
      "Syndromes: FAP (APC), Lynch syndrome (mismatch repair genes).",
    ],
    viva: [
      "What is the adenoma-carcinoma sequence? — Progressive accumulation of mutations from adenoma to invasive cancer (APC, KRAS, p53).",
      "What is the tumour marker for colorectal cancer? — CEA, used for monitoring.",
      "Which gene is mutated in FAP? — APC.",
    ],
    mcq: [
      ["Early event in the adenoma-carcinoma sequence is mutation of:", "APC", "p53", "KRAS", "DCC", "APC loss is the earliest event."],
      ["The tumour marker used for follow-up in colorectal cancer is:", "CEA", "AFP", "CA-125", "PSA", "CEA is used to monitor recurrence."],
      ["The commonest histological type of colorectal cancer is:", "Adenocarcinoma", "Squamous carcinoma", "Lymphoma", "Carcinoid", "Over 90 percent are adenocarcinomas."],
    ],
  },
  "ps-secretory-endometrium": {
    about: "This section of the endometrium in the secretory phase (days 15 to 28 of the cycle) shows tortuous, saw-toothed (corkscrew) glands with intraluminal secretions, lined by columnar cells with subnuclear and later supranuclear vacuoles. The stroma is oedematous and in the late phase shows predecidual change around the spiral arteries. The changes are due to progesterone from the corpus luteum. Subnuclear vacuoles appear on day 16 and 17 (the earliest sign of ovulation), and glands show maximum secretion by day 21 to 22. Compare with the proliferative phase, in which the glands are straight and tubular with mitoses, and with the menstrual phase, which shows tissue breakdown and bleeding. A secretory endometrium confirms that ovulation has occurred.",
    points: [
      "Saw-toothed (serrated) glands with secretions, oedematous stroma.",
      "Earliest sign of ovulation: subnuclear vacuoles (day 16).",
      "Hormone: progesterone from the corpus luteum.",
      "Used in an endometrial biopsy to prove ovulation in infertility work-up.",
    ],
    viva: [
      "What does a secretory endometrium indicate? — That ovulation has taken place.",
      "What is the earliest histological sign of ovulation? — Subnuclear vacuoles in the glandular epithelium.",
    ],
    mcq: [
      ["Saw-toothed glands with secretions are seen in the:", "Secretory phase", "Proliferative phase", "Menstrual phase", "Atrophic endometrium", "Progesterone causes tortuous secretory glands."],
      ["The hormone responsible for the secretory phase is:", "Progesterone", "Oestrogen", "FSH", "hCG", "Progesterone from the corpus luteum."],
    ],
  },
  "ps-proliferative-endometrium": {
    about: "This section of the endometrium in the proliferative phase (days 5 to 14) shows straight, tubular glands lined by tall columnar cells with oval to elongated nuclei and mitotic figures; the glands are uniformly spaced and have empty lumens with no secretions. The stroma is cellular, compact and not oedematous. The changes are due to oestrogen from the developing ovarian follicles. The endometrium thickens from about 1 to 3 mm to 5 mm. Pseudostratification of nuclei and frequent mitoses are physiological. In endometrial hyperplasia and carcinoma, there is gland crowding, architectural complexity and cytological atypia, which must be distinguished from normal proliferative endometrium.",
    points: [
      "Straight tubular glands, pseudostratified nuclei, mitoses, compact stroma.",
      "Hormone: oestrogen from follicles.",
      "Endometrial hyperplasia: unopposed oestrogen; risk of carcinoma if atypia present.",
      "Compare with secretory: tortuous glands with vacuoles and oedema.",
    ],
    viva: [
      "Which hormone drives the proliferative phase? — Oestrogen.",
      "How do you differentiate from the secretory phase? — Straight glands with mitoses and no secretions, versus tortuous glands with secretions.",
    ],
    mcq: [
      ["Straight tubular glands with mitoses are seen in the:", "Proliferative phase", "Secretory phase", "Menstrual phase", "Postmenopausal atrophy", "Oestrogen causes proliferation."],
      ["Unopposed oestrogen can cause:", "Endometrial hyperplasia", "Fibroid shrinkage", "Amenorrhoea", "Endometrial atrophy", "It may lead to hyperplasia and carcinoma."],
    ],
  },
  "ps-bph": {
    about: "This section of the prostate shows benign prostatic hyperplasia. There is nodular hyperplasia of both glandular and stromal elements. The glands are enlarged, cystically dilated and lined by a double layer of epithelium (inner columnar and outer flat basal cells) with papillary infoldings, and many contain eosinophilic corpora amylacea in the lumen. The stroma between them shows proliferation of smooth muscle and fibrous tissue. There is no atypia. The condition affects the transition zone, which is stimulated by dihydrotestosterone, and is seen in over 50 percent of men over 60 years. The presence of a basal cell layer distinguishes it from carcinoma, in which the basal layer is lost. Prostatic carcinoma is associated with raised PSA and arises from the peripheral zone.",
    points: [
      "Glands with papillary infoldings and corpora amylacea; double layer of epithelium including basal cells.",
      "Stromal smooth muscle hyperplasia: the target for alpha-blockers.",
      "Prostate cancer: loss of basal cells, small crowded glands, prominent nucleoli (Gleason grading).",
      "PSA is raised in BPH, prostatitis and cancer.",
    ],
    viva: [
      "What distinguishes BPH from carcinoma histologically? — Preservation of the basal cell layer in BPH.",
      "Which zone is affected by BPH? — The transition zone.",
    ],
    mcq: [
      ["Corpora amylacea are seen in:", "Prostate", "Thyroid", "Liver", "Breast cancer", "They are laminated secretions in prostatic glands."],
      ["The basal cell layer is lost in:", "Prostate carcinoma", "BPH", "Prostatitis", "Normal prostate", "Absence of basal cells indicates malignancy."],
    ],
  },
  "ps-lipoma": {
    about: "This section shows a lipoma, a benign tumour composed of mature adipocytes arranged in lobules separated by thin fibrous septa, surrounded by a thin fibrous capsule. The cells have a large, clear vacuole that pushes a small, flattened nucleus to the periphery (signet-ring appearance), and the lobules are similar to normal fat. It is the commonest benign soft-tissue tumour in adults and presents as a soft, lobulated, painless, mobile subcutaneous swelling with a slip sign and a positive fluctuation but no transillumination. Variants include angiolipoma (with small vessels), fibrolipoma and spindle cell lipoma. Liposarcoma is a malignant counterpart, with lipoblasts and atypia. Treatment is excision.",
    points: [
      "Mature adipocytes with peripheral nuclei, thin fibrous capsule, no atypia.",
      "Clinical signs: soft, lobulated, mobile, slip sign, edge slips under the finger.",
      "Variants: angiolipoma (painful), hibernoma (brown fat), spindle cell lipoma.",
      "Liposarcoma: lipoblasts, MDM2 amplification.",
    ],
    viva: [
      "What is the slip sign? — The edge of a lipoma slips from under the palpating finger.",
      "Which tumour is the malignant counterpart? — Liposarcoma.",
    ],
    mcq: [
      ["The commonest benign soft-tissue tumour is:", "Lipoma", "Fibroma", "Leiomyoma", "Neurofibroma", "Lipoma is the commonest."],
      ["Lipoblasts are seen in:", "Liposarcoma", "Lipoma", "Fibroma", "Xanthoma", "Lipoblasts indicate malignancy."],
    ],
  },
  "ps-cirrhosis": {
    about: "This section of the liver shows cirrhosis. The normal lobular architecture is replaced by regenerative nodules of hepatocytes that are surrounded by bands of fibrous tissue (fibrous septa) which link portal tracts to central veins. The septa contain proliferating bile ductules and chronic inflammatory cells. The nodules have lost the normal plate arrangement and may contain fatty change or bile. Causes include chronic alcohol use, chronic hepatitis B and C, non-alcoholic steatohepatitis, haemochromatosis, Wilson's disease, autoimmune hepatitis and primary biliary cholangitis. The process is diffuse and irreversible, and it presents with portal hypertension (varices, ascites, splenomegaly) and hepatic failure (jaundice, encephalopathy, coagulopathy). It predisposes to hepatocellular carcinoma. The diagnosis is made by biopsy, with Masson's trichrome or reticulin stains highlighting the fibrosis.",
    points: [
      "Definition: diffuse fibrosis and conversion of normal architecture into regenerative nodules.",
      "Micronodular (Laennec's) in alcoholic; macronodular in post-viral cirrhosis.",
      "Complications: portal hypertension, varices, ascites, hepatic encephalopathy, hepatocellular carcinoma, hepatorenal syndrome.",
      "Child-Pugh score for prognosis; MELD for transplant allocation.",
      "Special stains: Masson's trichrome (fibrosis), reticulin, Perls' (iron), rhodanine (copper).",
    ],
    viva: [
      "What is cirrhosis? — Diffuse hepatic fibrosis with formation of regenerative nodules and loss of normal architecture.",
      "Name two causes. — Alcohol and hepatitis B or C.",
      "What are the complications of portal hypertension? — Varices, splenomegaly, ascites and encephalopathy.",
    ],
    mcq: [
      ["The essential feature of cirrhosis is:", "Regenerative nodules with fibrous septa", "Fatty change only", "Fibrosis around portal tracts only", "Bile stasis", "Nodules plus fibrosis define cirrhosis."],
      ["Alcoholic cirrhosis is typically:", "Micronodular", "Macronodular", "Mixed only", "Not nodular", "Alcohol produces a micronodular pattern."],
      ["The liver cancer that complicates cirrhosis is:", "Hepatocellular carcinoma", "Cholangiocarcinoma", "Angiosarcoma", "Hepatoblastoma", "HCC arises in cirrhotic livers."],
    ],
  },
  "ps-fatty-liver": {
    about: "This section of the liver shows fatty change (steatosis). Many hepatocytes contain clear, round, sharply defined vacuoles of fat that displace the nucleus to the periphery (macrovesicular steatosis); in more severe cases the vacuoles merge to form fat cysts. Fat is dissolved during processing and appears as empty spaces; it can be demonstrated by frozen section with Oil Red O or Sudan III. Fatty liver is caused by alcohol (the commonest), obesity, diabetes, hyperlipidaemia, malnutrition, drugs (tetracycline, methotrexate, valproate) and toxins (CCl4). It is usually reversible. Microvesicular steatosis is seen in Reye's syndrome and acute fatty liver of pregnancy. Progression leads to steatohepatitis (with ballooning and Mallory-Denk bodies) and then to fibrosis and cirrhosis.",
    points: [
      "Macrovesicular: single large fat vacuole pushing the nucleus to the side (alcohol, obesity, diabetes).",
      "Microvesicular: tiny droplets, nucleus central (Reye's syndrome, acute fatty liver of pregnancy, valproate).",
      "Stains: Oil Red O and Sudan III on frozen sections.",
      "NAFLD: associated with metabolic syndrome; may progress to NASH and cirrhosis.",
      "Reversible with abstinence or weight loss.",
    ],
    viva: [
      "How do you demonstrate fat in tissue? — Oil Red O or Sudan III on frozen section.",
      "Name a condition with microvesicular steatosis. — Reye's syndrome or acute fatty liver of pregnancy.",
    ],
    mcq: [
      ["The stain used to demonstrate fat is:", "Oil Red O", "Congo red", "Perls' Prussian blue", "Masson's trichrome", "Oil Red O stains lipid on frozen sections."],
      ["The commonest cause of fatty liver is:", "Alcohol", "Hepatitis A", "Wilson's disease", "Malaria", "Alcohol and metabolic syndrome are the main causes."],
      ["Mallory-Denk bodies are seen in:", "Alcoholic hepatitis", "Viral hepatitis", "Haemochromatosis", "Wilson's only", "They are cytokeratin aggregates in damaged hepatocytes."],
    ],
  },
  "ps-mucinous-cystadenoma": {
    about: "This section of the wall of an ovarian cyst shows a mucinous cystadenoma. The cyst is lined by a single layer of tall columnar epithelial cells with basal, uniform nuclei and abundant clear to pale mucin in the apical cytoplasm, resembling endocervical or intestinal epithelium. There are multiple loculi lined by the same epithelium, and the stroma is fibrous. There are no papillary projections, stratification or atypia (these suggest a borderline or malignant tumour). The tumour is benign, unilateral and large, and is treated by cystectomy or oophorectomy. It differs from the serous type, which has ciliated cuboidal cells and psammoma bodies.",
    points: [
      "Tall columnar mucin-secreting cells with basal nuclei; multilocular.",
      "Benign type has no stratification, atypia or stromal invasion.",
      "Serous: ciliated cuboidal epithelium, psammoma bodies, often bilateral.",
      "Pseudomyxoma peritonei: extensive mucin in the peritoneum.",
    ],
    viva: [
      "What is the lining of a mucinous cystadenoma? — Tall columnar mucin-secreting cells.",
      "What feature indicates a borderline tumour? — Epithelial stratification and papillary tufting without invasion.",
    ],
    mcq: [
      ["Which ovarian tumour shows tall columnar mucin-secreting epithelium?", "Mucinous cystadenoma", "Serous cystadenoma", "Brenner tumour", "Dysgerminoma", "It resembles endocervical or intestinal epithelium."],
      ["Psammoma bodies suggest:", "Serous tumour", "Mucinous tumour", "Teratoma", "Fibroma", "Calcified concentric bodies are seen in serous tumours."],
    ],
  },
  "ps-bcc": {
    about: "This section of the skin shows basal cell carcinoma (BCC). The tumour consists of nests, islands and cords of basaloid cells with dark, oval nuclei and scanty cytoplasm that arise from the basal layer of the epidermis. The cells at the periphery of the nests are arranged in a palisade pattern, and a clear space (retraction artefact) separates the tumour from the surrounding stroma. The nests have little cytoplasm and few mitoses and no keratinisation. BCC is the commonest skin cancer, is related to sun exposure, occurs on the face above a line joining the angle of the mouth and the ear lobe, and is locally invasive but almost never metastasises. The typical lesion is a pearly nodule with telangiectasia and a rodent ulcer with rolled edges. Treatment is wide local excision, Mohs surgery, radiotherapy or imiquimod; Gorlin syndrome is the associated condition (PTCH1 mutation).",
    points: [
      "Peripheral palisading of basaloid cells and retraction clefts; no keratin pearls.",
      "Clinical: pearly nodule, rodent ulcer with rolled, beaded edges, face above the mouth-ear line.",
      "Locally invasive; metastasis is extremely rare.",
      "Gorlin syndrome: multiple BCCs, jaw cysts, PTCH gene.",
      "Treatment: excision, Mohs micrographic surgery, radiotherapy.",
    ],
    viva: [
      "What is the characteristic histological feature of BCC? — Peripheral palisading of the nuclei in basaloid nests.",
      "What is a rodent ulcer? — A BCC with a rolled, pearly edge and a central ulcer.",
      "Does BCC metastasise? — Very rarely; it is locally invasive.",
    ],
    mcq: [
      ["Peripheral palisading is seen in:", "Basal cell carcinoma", "Squamous cell carcinoma", "Melanoma", "Papilloma", "Palisading nuclei at the periphery of nests are typical."],
      ["The commonest skin cancer is:", "Basal cell carcinoma", "Squamous cell carcinoma", "Melanoma", "Merkel cell carcinoma", "BCC is the commonest."],
      ["A mutation in the PTCH gene causes:", "Gorlin syndrome", "Xeroderma pigmentosum", "Li-Fraumeni syndrome", "Cowden syndrome", "Gorlin syndrome has multiple BCCs."],
    ],
  },
  "ps-squamous-papilloma": {
    about: "This section shows a squamous papilloma, a benign epithelial tumour with finger-like, branching papillary fronds, each having a central core of vascularised connective tissue (fibrovascular core) covered by an orderly, thickened, keratinising stratified squamous epithelium with acanthosis and hyperkeratosis. The epithelium matures normally with no atypia, dysplasia or invasion into the underlying stroma. Skin papillomas (warts) are caused by human papillomavirus (HPV types 1, 2, 4); laryngeal papillomas (HPV 6 and 11) occur in children and may recur, and genital warts (condyloma acuminata) are caused by HPV 6 and 11. Papillomas are treated by excision, cryotherapy or electrocautery.",
    points: [
      "Papillary fronds with fibrovascular cores covered by well-differentiated squamous epithelium.",
      "HPV 1, 2, 4: common warts; HPV 6, 11: genital warts and laryngeal papillomas.",
      "HPV 16 and 18: high-risk, cervical cancer.",
      "No atypia or invasion; distinguishes it from squamous cell carcinoma.",
    ],
    viva: [
      "What virus causes warts? — Human papillomavirus.",
      "What cell change is characteristic of HPV infection? — Koilocytes with a perinuclear halo and raisin-like nucleus.",
    ],
    mcq: [
      ["Genital warts are caused by:", "HPV 6 and 11", "HPV 16 and 18", "HSV-2", "HIV", "Low-risk HPV types 6 and 11."],
      ["The cells in HPV infection with a perinuclear halo are:", "Koilocytes", "Reed-Sternberg cells", "Foam cells", "Plasma cells", "Koilocytes are characteristic."],
    ],
  },
  "ps-scc": {
    about: "This section of the skin shows squamous cell carcinoma (SCC). Irregular nests, cords and sheets of malignant squamous cells invade the dermis from the epidermis. The cells are polygonal with abundant eosinophilic cytoplasm and show pleomorphic, hyperchromatic nuclei with prominent nucleoli, increased mitoses, individual cell keratinisation and the formation of keratin pearls (concentric whorls of keratinised cells), with intercellular bridges (desmosomes). The degree of differentiation is graded as well, moderately or poorly differentiated. SCC is associated with sun exposure, chronic ulcers (Marjolin's ulcer), burn scars, arsenic, radiation, HPV and immunosuppression, and arises from precursor lesions such as actinic keratosis and Bowen's disease. It metastasises through lymphatics to regional lymph nodes. The clinical lesion is an ulcer with an everted, indurated edge. Treatment is wide excision with or without node dissection and radiotherapy.",
    points: [
      "Keratin pearls and intercellular bridges are hallmark features.",
      "Marjolin's ulcer: SCC arising in a chronic scar, burn or ulcer.",
      "Premalignant lesions: actinic keratosis, Bowen's disease, leucoplakia, xeroderma pigmentosum.",
      "Spread: lymphatic to regional nodes; occasionally blood-borne.",
      "Everted edge, indurated base, spreads more rapidly than BCC.",
    ],
    viva: [
      "What are keratin pearls? — Concentric whorls of keratinised squamous cells in a well-differentiated SCC.",
      "What is Marjolin's ulcer? — SCC arising in a long-standing scar or chronic ulcer.",
      "How does SCC differ from BCC clinically? — SCC has an everted edge and can metastasise; BCC has a rolled pearly edge and rarely spreads.",
    ],
    mcq: [
      ["Keratin pearls are seen in:", "Well-differentiated SCC", "Basal cell carcinoma", "Adenocarcinoma", "Melanoma", "Keratin pearls indicate squamous differentiation."],
      ["A malignant ulcer in a burn scar is called:", "Marjolin's ulcer", "Curling's ulcer", "Cushing's ulcer", "Rodent ulcer", "Marjolin's ulcer is SCC arising in a scar."],
      ["Intercellular bridges are formed by:", "Desmosomes", "Hemidesmosomes", "Tight junctions", "Gap junctions", "Desmosomes appear as bridges between squamous cells."],
    ],
  },
  "ps-melanoma": {
    about: "This section of the skin shows malignant melanoma, a tumour of melanocytes. Large, atypical epithelioid or spindle-shaped cells with abundant cytoplasm, large pleomorphic nuclei with prominent eosinophilic (cherry-red) nucleoli and brown melanin pigment in the cytoplasm form nests in the epidermis and the dermis. There is a radial (horizontal) growth phase along the epidermis and a vertical growth phase into the dermis. The prognosis depends on the Breslow thickness (depth in mm) and the Clark level, together with ulceration and mitotic rate. Risk factors are sun exposure, fair skin, multiple naevi, dysplastic naevus syndrome and CDKN2A mutation. The ABCDE rule describes the clinical warning signs: Asymmetry, Border irregularity, Colour variation, Diameter above 6 mm, Evolving. Immunohistochemistry (S-100, HMB-45, Melan-A) confirms the diagnosis. Treatment is wide excision with margins according to the Breslow thickness, sentinel node biopsy, and immunotherapy or BRAF inhibitors in advanced disease.",
    points: [
      "Prognosis: Breslow thickness is the most important factor.",
      "Types: superficial spreading (commonest), nodular, lentigo maligna, acral lentiginous (commonest in dark-skinned people, on palms and soles).",
      "Immunohistochemistry: S-100 (sensitive), HMB-45 and Melan-A (specific).",
      "BRAF V600E mutation: treated with vemurafenib or dabrafenib.",
      "Excise with a 1 to 2 cm margin depending on the thickness; sentinel node biopsy for staging.",
    ],
    viva: [
      "What is the most important prognostic factor? — Breslow thickness.",
      "What is the ABCDE rule? — Asymmetry, Border, Colour, Diameter, Evolving.",
      "Which marker is positive in melanoma? — S-100, HMB-45 and Melan-A.",
    ],
    mcq: [
      ["The most important prognostic factor in melanoma is:", "Breslow thickness", "Site", "Age", "Sex", "Depth of invasion in mm predicts outcome."],
      ["The commonest type of melanoma is:", "Superficial spreading", "Nodular", "Lentigo maligna", "Acral lentiginous", "It makes up about 70 percent."],
      ["Which marker is the most specific for melanoma?", "HMB-45", "Cytokeratin", "Vimentin", "Desmin", "HMB-45 and Melan-A are specific."],
    ],
  },
  "ps-scirrhous-breast": {
    about: "This section of the breast shows scirrhous (infiltrating ductal) carcinoma. Small nests, cords and single malignant duct cells infiltrate an abundant, dense, fibrous (desmoplastic) stroma in a haphazard way, replacing the fat. The cells show pleomorphic nuclei with prominent nucleoli, hyperchromasia and mitoses. The fibrous reaction (scirrhous = hard) gives the tumour its characteristic hardness and retraction, which causes skin dimpling and nipple retraction. Elastosis (elastic fibres around the ducts) is common. The tumour is graded by the Nottingham system (tubule formation, nuclear pleomorphism and mitotic count), and ER, PR and HER2 are assessed by immunohistochemistry to decide therapy. It spreads to axillary lymph nodes and then to bone, lung, liver and brain.",
    points: [
      "Infiltrating nests, cords and single cells in a dense desmoplastic stroma.",
      "Nottingham grade: tubule formation, nuclear grade, mitoses.",
      "Receptors: ER, PR, HER2 and Ki-67 determine treatment.",
      "Variants: lobular (single-file pattern, E-cadherin loss), mucinous, medullary, tubular.",
    ],
    viva: [
      "Why is it called scirrhous? — Because of the hard consistency from desmoplastic fibrous stroma.",
      "What is the grading system for breast cancer? — Nottingham (Bloom-Richardson).",
      "What is the single-file pattern? — A feature of invasive lobular carcinoma.",
    ],
    mcq: [
      ["The hard feel of scirrhous carcinoma is due to:", "Desmoplastic stroma", "Calcification", "Necrosis", "Mucin", "Fibrous reaction causes hardness."],
      ["Invasive lobular carcinoma is characterised by loss of:", "E-cadherin", "p53", "BRCA", "Oestrogen receptor", "E-cadherin loss gives discohesive cells."],
      ["Receptor tested for trastuzumab therapy is:", "HER2", "ER", "PR", "EGFR", "HER2 positivity predicts response."],
    ],
  },
  "ps-fibroadenoma": {
    about: "This section of breast tissue shows a fibroadenoma, a benign biphasic tumour comprising both glandular (epithelial) and fibrous stromal components. The tumour is well-circumscribed and encapsulated. There are two growth patterns: the pericanalicular pattern, in which the stroma grows around the ducts that are round or oval and open, and the intracanalicular pattern, in which the stroma compresses the ducts into slit-like or branching clefts. Both components are benign, without atypia. It is the commonest benign breast tumour in women under 30 years, is hormone-responsive, may grow during pregnancy, and regresses and calcifies after menopause. The clinical lesion is a firm, rubbery, smooth, mobile, painless lump (breast mouse). Phyllodes tumour has a cellular, leaf-like stroma, and ranges from benign to malignant. Treatment is excision or observation.",
    points: [
      "Two patterns: pericanalicular and intracanalicular; both are benign.",
      "Clinical: breast mouse, mobile, firm, usually 2 to 3 cm, in young women.",
      "Phyllodes tumour: cellular stroma, leaf-like projections, may recur or turn malignant.",
      "Triple assessment: examination, ultrasound or mammography, FNAC or core biopsy.",
    ],
    viva: [
      "Why is a fibroadenoma called a breast mouse? — It is a mobile, well-defined lump that slips under the fingers.",
      "How does phyllodes differ from fibroadenoma? — A more cellular stroma, leaf-like pattern, larger and potentially malignant.",
    ],
    mcq: [
      ["The commonest benign breast tumour in young women is:", "Fibroadenoma", "Phyllodes tumour", "Duct papilloma", "Lipoma", "Fibroadenoma is common under 30."],
      ["Slit-like ducts compressed by stroma indicate the:", "Intracanalicular pattern", "Pericanalicular pattern", "Cribriform pattern", "Papillary pattern", "The stroma compresses the ducts."],
      ["Leaf-like projections are a feature of:", "Phyllodes tumour", "Fibroadenoma", "Paget's disease", "Lobular carcinoma", "Phyllodes means leaf-like."],
    ],
  },
  "ps-rcc": {
    about: "This section of the kidney shows clear cell renal cell carcinoma. The tumour cells are polygonal with abundant clear cytoplasm (due to glycogen and lipid dissolved during processing) and distinct cell borders, and are arranged in nests and acini separated by a delicate, rich network of thin-walled capillaries. The nuclei are round and show variable atypia, graded by Fuhrman or ISUP system based on the nucleolar prominence. Areas of haemorrhage and necrosis are common. The tumour arises from the proximal convoluted tubule epithelium and is associated with loss of the VHL gene on chromosome 3p. Papillary RCC shows papillae with foam cells and psammoma bodies (trisomy 7 and 17), and chromophobe RCC shows large cells with perinuclear halo and plant-like cell borders. Metastasis occurs by blood to the lung and bone.",
    points: [
      "Clear cytoplasm, distinct cell borders and a delicate capillary network.",
      "Genetics: VHL gene loss on chromosome 3p; hereditary and sporadic forms.",
      "Papillary type: trisomy 7 and 17; chromophobe type: monosomy of multiple chromosomes.",
      "Grading: Fuhrman or ISUP nuclear grade; staging by TNM.",
      "Treatment: nephrectomy; tyrosine kinase inhibitors (sunitinib) and immunotherapy for metastasis.",
    ],
    viva: [
      "Why are the cells clear? — Cytoplasmic glycogen and lipid are removed during processing.",
      "Which gene is lost? — VHL on chromosome 3p.",
    ],
    mcq: [
      ["Clear cell RCC arises from the:", "Proximal convoluted tubule", "Collecting duct", "Glomerulus", "Renal pelvis", "It originates from proximal tubular cells."],
      ["Chromosome associated with clear cell RCC is:", "3p", "7q", "17p", "13q", "Loss of 3p (VHL) is characteristic."],
    ],
  },
  "ps-pleomorphic-adenoma": {
    about: "This section of the salivary gland shows a pleomorphic adenoma (mixed tumour), the commonest salivary gland tumour, most often in the parotid gland. The tumour is composed of a mixture of epithelial and myoepithelial cells arranged in ducts, sheets and cords, set in a myxoid, chondroid (cartilage-like) and sometimes bone-like stroma, which gives it the name 'pleomorphic' or 'mixed'. It is surrounded by an incomplete fibrous capsule with small tumour extensions beyond it, which explains the high recurrence rate after enucleation. The clinical lesion is a slowly growing, painless, firm, mobile lump in the parotid region. Facial nerve involvement suggests malignant change (carcinoma ex pleomorphic adenoma). The treatment is superficial parotidectomy with preservation of the facial nerve.",
    points: [
      "Epithelial and myoepithelial elements with a myxoid or chondroid stroma.",
      "Commonest salivary gland tumour; 80 percent occur in the parotid gland.",
      "Incomplete capsule: enucleation leads to recurrence, so do superficial parotidectomy.",
      "Facial nerve palsy suggests malignancy; malignant transformation in about 5 percent.",
      "Warthin's tumour: second commonest, papillary cystadenoma lymphomatosum, in older male smokers.",
    ],
    viva: [
      "Why is it called a mixed tumour? — It contains epithelial, myoepithelial and mesenchymal-like (myxoid and chondroid) components.",
      "Why does it recur? — The capsule is incomplete and pseudopods extend into the surrounding gland.",
      "What is the treatment? — Superficial parotidectomy with facial nerve preservation.",
    ],
    mcq: [
      ["The commonest salivary gland tumour is:", "Pleomorphic adenoma", "Warthin's tumour", "Mucoepidermoid carcinoma", "Adenoid cystic carcinoma", "It accounts for 60 percent."],
      ["Recurrence in pleomorphic adenoma is due to:", "Incomplete capsule", "Metastasis", "Perineural spread", "Viral infection", "Enucleation leaves capsule extensions."],
      ["Which tumour shows a myxoid and chondroid stroma?", "Pleomorphic adenoma", "Warthin's tumour", "Acinic cell carcinoma", "Mucoepidermoid carcinoma", "Chondromyxoid stroma is typical."],
    ],
  },
  "ps-seminoma": {
    about: "This section of the testis shows seminoma, the commonest testicular germ cell tumour. It is composed of sheets of uniform, large polygonal cells with clear or pale-staining cytoplasm (glycogen), distinct cell borders, large central round nuclei with prominent nucleoli and a fibrous septa containing lymphocytes (and sometimes granulomas). The tumour is divided into lobules by thin fibrous septa infiltrated by lymphocytes. The gross specimen shows a homogeneous, grey-white, fish-flesh cut surface with no haemorrhage. It occurs between 30 and 40 years, spreads by lymphatics to para-aortic nodes, and is highly radiosensitive and chemosensitive, with a good prognosis. Cryptorchidism is the major risk factor. The tumour markers are beta-hCG (mildly raised in some) and LDH; AFP is not raised (its elevation suggests a non-seminomatous component). It is the testicular counterpart of ovarian dysgerminoma and CNS germinoma.",
    points: [
      "Uniform clear cells in sheets with lymphocytic infiltrate in the septa; no necrosis or haemorrhage.",
      "Risk factors: cryptorchidism, Klinefelter's syndrome, previous contralateral tumour.",
      "Markers: placental alkaline phosphatase (PLAP), LDH, mild hCG; AFP is normal.",
      "Spread to para-aortic lymph nodes; treatment with orchidectomy through the inguinal route, then radiotherapy or chemotherapy (BEP).",
      "Never do a scrotal biopsy; use a high inguinal orchidectomy.",
    ],
    viva: [
      "What is the commonest testicular tumour? — Seminoma.",
      "Which lymph nodes are involved first? — Para-aortic nodes.",
      "Why is an inguinal approach used? — To avoid scrotal spread and keep lymphatic drainage intact.",
    ],
    mcq: [
      ["The ovarian counterpart of seminoma is:", "Dysgerminoma", "Teratoma", "Yolk sac tumour", "Granulosa cell tumour", "Both have the same histology."],
      ["Which marker is raised in a pure seminoma?", "LDH and PLAP", "AFP", "CA-125", "CEA", "AFP is not raised in pure seminoma."],
      ["Seminoma is highly sensitive to:", "Radiotherapy", "Antibiotics", "Hormones", "Antivirals", "It is very radiosensitive."],
    ],
  },
  "ps-gct-bone": {
    about: "This section shows a giant cell tumour (osteoclastoma) of the bone. It is composed of numerous large, multinucleated osteoclast-type giant cells (with 20 to 100 nuclei) uniformly scattered among a background of plump, oval or spindle-shaped mononuclear stromal cells. The nuclei of the giant cells are similar to those of the stromal cells, which are the real neoplastic cells. The tumour occurs in the epiphysis of long bones (lower end of the femur, upper end of the tibia, and lower end of the radius) in young adults between 20 and 40 years, after the growth plate has closed. The classical X-ray shows an eccentric, lytic, expansile lesion with a soap-bubble appearance and no periosteal reaction. It is locally aggressive and may recur, and a small proportion metastasise to the lung. The treatment is curettage with bone cement or bone graft, en bloc resection for aggressive lesions, and denosumab (RANKL inhibitor).",
    points: [
      "Site: epiphysis-metaphysis of a long bone near the knee; eccentric lytic lesion with a soap-bubble look.",
      "Stromal cells are neoplastic; the giant cells are reactive osteoclast-like cells.",
      "Treatment: extended curettage with cement or bone grafting; denosumab for unresectable lesions.",
      "Campanacci grading I to III by radiographic appearance.",
      "Pulmonary metastases are rare but may occur.",
    ],
    viva: [
      "What is the typical site of GCT? — The epiphysis of a long bone around the knee.",
      "What is the radiological sign? — Soap-bubble appearance.",
      "Which drug is used? — Denosumab (RANKL inhibitor).",
    ],
    mcq: [
      ["Giant cell tumours typically occur in the:", "Epiphysis", "Diaphysis", "Metaphysis only", "Spine only", "Epiphyseal location after fusion is classical."],
      ["The neoplastic cells in GCT are:", "Mononuclear stromal cells", "Giant cells", "Osteoblasts", "Chondrocytes", "The stromal cells are neoplastic."],
      ["Denosumab acts on:", "RANKL", "TNF", "VEGF", "HER2", "It blocks RANK ligand and osteoclast activity."],
    ],
  },
  "ps-osteosarcoma": {
    about: "This section shows osteosarcoma, the commonest primary malignant bone tumour in adolescents. The tumour consists of highly pleomorphic, hyperchromatic malignant spindle and polygonal cells with atypical mitoses that directly produce neoplastic osteoid (a pink, lace-like or irregular matrix) and may also produce cartilage or fibrous tissue. The presence of malignant osteoid is essential for the diagnosis. It occurs in the metaphysis of long bones (distal femur, proximal tibia, proximal humerus) in people between 10 and 20 years, and in older adults with Paget's disease or after radiation. The X-ray shows a destructive lesion with sunburst appearance and Codman's triangle (periosteal elevation). It spreads early by blood, typically to the lung. Mutations of RB1 and p53 are common. Alkaline phosphatase is raised. Treatment is neoadjuvant chemotherapy (methotrexate, doxorubicin, cisplatin), limb-salvage surgery and adjuvant chemotherapy.",
    points: [
      "Malignant cells producing osteoid; the diagnostic feature.",
      "Site: metaphysis of long bones around the knee.",
      "X-ray: sunburst pattern, Codman's triangle, mixed lytic and sclerotic.",
      "Predisposing: Paget's disease, previous radiation, retinoblastoma (RB1), Li-Fraumeni (p53).",
      "Raised serum alkaline phosphatase; blood-borne spread to lungs.",
    ],
    viva: [
      "What is the diagnostic feature on histology? — Malignant cells producing osteoid.",
      "Name two radiological signs. — Sunburst appearance and Codman's triangle.",
      "Where does it metastasise first? — The lung.",
    ],
    mcq: [
      ["The hallmark of osteosarcoma on histology is:", "Tumour osteoid formation", "Cartilage formation only", "Giant cells", "Small round cells", "Neoplastic osteoid confirms osteosarcoma."],
      ["Codman's triangle is seen in:", "Osteosarcoma", "Osteoma", "Osteochondroma", "Giant cell tumour", "It represents periosteal elevation by tumour."],
      ["The commonest site of osteosarcoma is:", "Lower end of the femur", "Skull", "Vertebra", "Hand", "The knee region is the commonest site."],
    ],
  },
}
