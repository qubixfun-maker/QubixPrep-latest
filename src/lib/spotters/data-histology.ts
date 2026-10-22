import type { Spot } from "./types"

const P = "/spotters/histology/"
const A = "Anatomy"
const G = "Histology slides" as const

export const HISTOLOGY: Spot[] = [
  {
    id: "h-liver", subject: A, group: G, topic: "Digestive system", name: "Liver",
    imgs: [{ f: P + "liver-lp.webp", cap: "Low power" }, { f: P + "liver-hp.webp", cap: "High power" }],
    identify: [
      "Hepatic lobules made of cords of hepatocytes radiating from a central vein",
      "Sinusoids between the cords, lined by endothelium and Kupffer cells",
      "Portal triad (portal vein, hepatic artery, bile duct) at the corners of the lobule",
      "No thick capsule inside the lobule; thin connective tissue septa in humans",
    ],
    about: "The liver is organised into classical hepatic lobules. Plates of polygonal hepatocytes with round central nuclei (some binucleate) run from the portal tract at the periphery to the central vein, separated by blood sinusoids.",
    points: [
      "Classical lobule: hexagonal, central vein in the middle, portal triads at 3 to 6 corners.",
      "Portal lobule centres on the portal triad; the liver acinus of Rappaport is the functional unit (zone 1 near the portal triad, zone 3 near the central vein).",
      "Zone 3 (centrilobular) is most sensitive to ischaemia; zone 1 to toxins and viral hepatitis.",
      "Space of Disse lies between the hepatocytes and the sinusoidal endothelium; stellate (Ito) cells store vitamin A and produce collagen in cirrhosis.",
    ],
    viva: [
      "What lines the sinusoids? — Fenestrated discontinuous endothelium with Kupffer cells (macrophages).",
      "Which cells store vitamin A? — Hepatic stellate (Ito) cells in the space of Disse.",
      "What forms the portal triad? — Branch of the portal vein, branch of the hepatic artery and a bile ductule.",
    ],
    mcq: [
      ["Which cells of the liver sinusoid are phagocytic?", "Kupffer cells", "Ito cells", "Hepatocytes", "Cholangiocytes", "Kupffer cells are the resident macrophages of the sinusoid."],
      ["The portal triad does NOT contain:", "Central vein", "Hepatic artery branch", "Portal vein branch", "Bile ductule", "The central vein is the centre of the lobule, not part of the portal triad."],
      ["Zone 3 of the liver acinus is also called:", "Centrilobular zone", "Periportal zone", "Mid-zonal zone", "Capsular zone", "Zone 3 surrounds the central vein."],
    ],
  },
  {
    id: "h-gallbladder", subject: A, group: G, topic: "Digestive system", name: "Gall bladder",
    imgs: [{ f: P + "gallbladder.webp" }],
    identify: [
      "Mucosa thrown into tall branching folds lined by simple columnar epithelium",
      "No muscularis mucosae and no submucosa",
      "Lamina propria directly followed by a thin muscle layer, then perimuscular connective tissue and serosa",
      "Rokitansky-Aschoff sinuses may be seen as epithelial pockets in the wall",
    ],
    about: "A hollow organ whose wall shows a folded mucosa with simple columnar epithelium that has microvilli, an underlying lamina propria and a smooth muscle layer. It stores and concentrates bile by absorbing water.",
    points: [
      "Absence of muscularis mucosae and submucosa is the key identification feature.",
      "Mucosal folds branch and anastomose and look like glands in section, but there are no true glands except in the neck.",
      "Epithelium absorbs water and sodium to concentrate bile 5 to 10 times.",
      "Chronic cholecystitis shows deep Rokitansky-Aschoff sinuses and muscle hypertrophy.",
    ],
    viva: [
      "What is missing in the wall of the gall bladder compared with the intestine? — Muscularis mucosae and submucosa.",
      "Which hormone makes it contract? — Cholecystokinin.",
    ],
    mcq: [
      ["Which layer is absent in the gall bladder wall?", "Submucosa", "Lamina propria", "Muscularis externa", "Serosa", "The gall bladder has no submucosa and no muscularis mucosae."],
      ["The lining epithelium of the gall bladder is:", "Simple columnar", "Stratified squamous", "Transitional", "Pseudostratified ciliated", "Simple columnar with microvilli, adapted to absorption."],
    ],
  },
  {
    id: "h-pancreas", subject: A, group: G, topic: "Digestive system", name: "Pancreas",
    imgs: [{ f: P + "pancreas-lp.webp", cap: "Low power" }, { f: P + "pancreas-hp.webp", cap: "High power" }],
    identify: [
      "Dense serous acini with basophilic basal cytoplasm and pink apical zymogen granules",
      "Pale-staining islets of Langerhans scattered among the acini",
      "Interlobular ducts and connective tissue septa; centro-acinar cells inside acini",
      "No striated ducts (unlike the salivary gland) and no capsule thick enough to see",
    ],
    about: "A mixed gland: the exocrine part is made of serous acini that secrete digestive enzymes, and the endocrine part is the islets of Langerhans, which stain paler because their cells are less granular.",
    points: [
      "Centro-acinar cells are unique to the pancreas; they start the duct system inside the acinus.",
      "Islet cells: alpha (glucagon, ~20%), beta (insulin, ~70%), delta (somatostatin), PP cells.",
      "Differs from parotid: no striated ducts and no fat cells in the stroma, but it has islets.",
      "Enzymes are stored as zymogen granules and released by cholecystokinin.",
    ],
    viva: [
      "Which cell is only found in the pancreas acinus? — Centro-acinar cell.",
      "Which islet cell secretes insulin? — Beta cell.",
    ],
    mcq: [
      ["Centro-acinar cells are found in the:", "Pancreas", "Parotid gland", "Liver", "Submandibular gland", "They mark the beginning of the pancreatic duct within the acinus."],
      ["Islet cells that secrete glucagon are:", "Alpha cells", "Beta cells", "Delta cells", "PP cells", "Alpha cells secrete glucagon."],
    ],
  },
  {
    id: "h-kidney", subject: A, group: G, topic: "Urinary system", name: "Kidney",
    imgs: [{ f: P + "kidney-lp.webp", cap: "Low power" }, { f: P + "kidney-hp.webp", cap: "High power" }],
    identify: [
      "Renal corpuscles (glomerulus inside Bowman's capsule) scattered in the cortex",
      "Cut sections of proximal convoluted tubules with brush border and distal tubules with a clear lumen",
      "Medullary rays or collecting ducts running in straight lines",
      "Proximal tubules are more numerous and stain deeper pink than distal tubules",
    ],
    about: "The cortex shows rounded renal corpuscles surrounded by cross-sections of convoluted tubules. The proximal tubule has tall cuboidal cells with a brush border and an irregular narrow lumen; the distal tubule is paler with a wide clear lumen and no brush border.",
    points: [
      "Proximal convoluted tubule: acidophilic cytoplasm, brush border, reabsorbs about 65% of filtrate.",
      "Distal convoluted tubule: no brush border, more nuclei per section, macula densa near the juxtaglomerular apparatus.",
      "Juxtaglomerular cells secrete renin; macula densa senses sodium.",
      "Collecting ducts have clear cells with sharp boundaries and respond to ADH.",
    ],
    viva: [
      "Name the three layers of the glomerular filtration barrier. — Fenestrated endothelium, basement membrane, podocyte filtration slits.",
      "Which cells secrete renin? — Juxtaglomerular cells of the afferent arteriole.",
    ],
    mcq: [
      ["Brush border is seen in the:", "Proximal convoluted tubule", "Distal convoluted tubule", "Collecting duct", "Thin descending limb", "Microvilli form the brush border of the PCT."],
      ["Macula densa is part of the wall of the:", "Distal convoluted tubule", "Proximal convoluted tubule", "Loop of Henle thin limb", "Collecting duct", "It is a modified region of the DCT touching the afferent arteriole."],
    ],
  },
  {
    id: "h-ureter", subject: A, group: G, topic: "Urinary system", name: "Ureter",
    imgs: [{ f: P + "ureter.webp" }],
    identify: [
      "Star-shaped (stellate) lumen due to longitudinal mucosal folds",
      "Transitional epithelium (urothelium) lining",
      "Muscularis made of inner longitudinal and outer circular fibres (a third outer longitudinal layer in the lower third)",
      "Adventitia outside; no submucosa separate from the lamina propria",
    ],
    about: "The ureter is a muscular tube with a characteristic star-shaped lumen when cut in cross-section, lined by transitional epithelium that tolerates stretching and is impermeable to urine.",
    points: [
      "Transitional epithelium with umbrella cells on the surface.",
      "The muscle layers are arranged opposite to the intestine: inner longitudinal, outer circular in the upper two-thirds.",
      "Peristalsis moves urine from the renal pelvis to the bladder.",
    ],
    viva: [
      "Which epithelium lines the ureter? — Transitional epithelium.",
      "Why is the lumen star-shaped? — Longitudinal folds of mucosa in the empty tube.",
    ],
    mcq: [
      ["A star-shaped lumen lined by transitional epithelium suggests:", "Ureter", "Fallopian tube", "Vas deferens", "Oesophagus", "The mucosal folds give the ureter its stellate lumen."],
    ],
  },
  {
    id: "h-bladder", subject: A, group: G, topic: "Urinary system", name: "Urinary bladder",
    imgs: [{ f: P + "bladder.webp" }],
    identify: [
      "Mucosa with transitional epithelium of 5 to 6 layers with large dome-shaped surface cells",
      "Mucosa thrown into folds in the empty bladder",
      "Thick detrusor muscle in three poorly defined layers",
      "No muscularis mucosae; serosa only on the superior surface",
    ],
    about: "A hollow organ lined by transitional epithelium that flattens when the bladder fills. The thick smooth muscle wall (detrusor) is arranged in interlacing bundles.",
    points: [
      "Dome-shaped umbrella cells and plaques of uroplakin protect against hypertonic urine.",
      "Detrusor has inner longitudinal, middle circular and outer longitudinal layers.",
      "Most bladder cancers arise from the transitional epithelium (urothelial carcinoma).",
    ],
    viva: [
      "Name the epithelium of the bladder. — Transitional epithelium (urothelium).",
      "What is the muscle called? — Detrusor muscle.",
    ],
    mcq: [
      ["The surface cells of the bladder epithelium are called:", "Umbrella cells", "Goblet cells", "Clara cells", "Chief cells", "Large dome-shaped umbrella cells cover the urothelium."],
    ],
  },
  {
    id: "h-prostate", subject: A, group: G, topic: "Male reproductive system", name: "Prostate",
    imgs: [{ f: P + "prostate-lp.webp", cap: "Low power" }, { f: P + "prostate-hp.webp", cap: "High power" }],
    identify: [
      "Irregular glandular acini with wide lumens and papillary infoldings",
      "Corpora amylacea (pink laminated secretions) in the lumen",
      "Fibromuscular stroma with smooth muscle between the glands",
      "Epithelium varies from simple columnar to cuboidal",
    ],
    about: "A tubulo-alveolar gland whose acini have large irregular lumens because of infolding of the epithelium. Corpora amylacea are concretions that increase with age.",
    points: [
      "Corpora amylacea are the most helpful identification feature.",
      "Zones: central, transitional (BPH arises here), peripheral (carcinoma arises here).",
      "Stroma contains abundant smooth muscle that contracts during ejaculation.",
    ],
    viva: [
      "In which zone does carcinoma of the prostate arise? — Peripheral zone.",
      "Which zone is enlarged in BPH? — Transitional zone.",
    ],
    mcq: [
      ["Corpora amylacea are seen in the:", "Prostate", "Seminal vesicle", "Testis", "Epididymis", "These laminated concretions are found in prostatic acini."],
      ["Benign prostatic hyperplasia arises mainly in the:", "Transitional zone", "Peripheral zone", "Central zone", "Anterior fibromuscular zone", "The periurethral transitional zone."],
    ],
  },
  {
    id: "h-testis", subject: A, group: G, topic: "Male reproductive system", name: "Testis",
    imgs: [{ f: P + "testis-lp.webp", cap: "Low power" }, { f: P + "testis-hp.webp", cap: "High power" }],
    identify: [
      "Many round or oval seminiferous tubules cut in different planes",
      "Stratified germinal epithelium with Sertoli cells and spermatogenic cells",
      "Interstitial cells of Leydig in the connective tissue between the tubules",
      "Thick tunica albuginea outside",
    ],
    about: "The testis is packed with seminiferous tubules lined by spermatogenic cells at different stages. Spermatogonia lie on the basement membrane and mature cells move toward the lumen.",
    points: [
      "Sertoli cells form the blood-testis barrier and secrete inhibin and androgen-binding protein.",
      "Leydig cells secrete testosterone under LH.",
      "Cell order from the basement membrane to the lumen: spermatogonia, primary spermatocytes, secondary spermatocytes, spermatids, spermatozoa.",
    ],
    viva: [
      "Which cells secrete testosterone? — Leydig cells.",
      "Which cells form the blood-testis barrier? — Sertoli cells (tight junctions).",
    ],
    mcq: [
      ["Leydig cells are stimulated by:", "LH", "FSH", "Prolactin", "Oxytocin", "LH drives testosterone secretion by Leydig cells."],
      ["The blood-testis barrier is formed by:", "Sertoli cells", "Leydig cells", "Spermatogonia", "Myoid cells", "Tight junctions between adjacent Sertoli cells."],
    ],
  },
  {
    id: "h-epididymis", subject: A, group: G, topic: "Male reproductive system", name: "Epididymis",
    imgs: [{ f: P + "epididymis-lp.webp", cap: "Low power" }, { f: P + "epididymis-hp.webp", cap: "High power" }],
    identify: [
      "Highly coiled duct cut in many sections with round profiles",
      "Pseudostratified columnar epithelium with long non-motile stereocilia",
      "Sperms inside the lumen",
      "Thin circular smooth muscle around each profile",
    ],
    about: "A single long coiled tube whose lining cells carry stereocilia (long microvilli) that absorb testicular fluid. The lumen often contains mature sperm.",
    points: [
      "Principal cells have stereocilia; basal cells are stem cells.",
      "Sperm are stored and mature here (gain motility).",
      "Compare with vas deferens: thick muscle (three layers) and a narrow lumen.",
    ],
    viva: [
      "What are the stereocilia of the epididymis? — Long non-motile microvilli.",
    ],
    mcq: [
      ["Pseudostratified columnar epithelium with stereocilia lines the:", "Epididymis", "Seminiferous tubule", "Prostate", "Urethra", "Principal cells of the epididymis bear stereocilia."],
    ],
  },
  {
    id: "h-vasdeferens", subject: A, group: G, topic: "Male reproductive system", name: "Vas deferens",
    imgs: [{ f: P + "vasdeferens.webp" }],
    identify: [
      "Very thick muscular wall relative to a small lumen",
      "Three muscle layers: inner longitudinal, middle circular, outer longitudinal",
      "Pseudostratified columnar epithelium with stereocilia",
      "Star-shaped or narrow irregular lumen with folded mucosa",
    ],
    about: "A thick-walled muscular tube that propels sperm during ejaculation. The mucosa is folded longitudinally giving a narrow irregular lumen.",
    points: [
      "Thickest muscle coat of any duct in the male genital tract.",
      "Cut during vasectomy; the ampulla at the end joins the seminal vesicle to form the ejaculatory duct.",
    ],
    viva: [
      "How many muscle layers does the vas have? — Three.",
    ],
    mcq: [
      ["A narrow lumen with a very thick three-layered muscle wall is typical of:", "Vas deferens", "Ureter", "Fallopian tube", "Epididymis", "The vas has the thickest muscle wall of the male duct system."],
    ],
  },
  {
    id: "h-ovary", subject: A, group: G, topic: "Female reproductive system", name: "Ovary",
    imgs: [{ f: P + "ovary-lp.webp", cap: "Low power" }, { f: P + "ovary-hp.webp", cap: "High power" }],
    identify: [
      "Cortex with follicles at different stages in a cellular stroma",
      "Surface covered by a single layer of cuboidal germinal epithelium over the tunica albuginea",
      "Vascular medulla of loose connective tissue in the centre",
      "Graafian follicle shows an antrum, cumulus oophorus and corona radiata",
    ],
    about: "The cortex contains primordial, primary, secondary and mature follicles embedded in spindle-shaped stroma. The medulla contains blood vessels and no follicles.",
    points: [
      "Primordial follicle: oocyte surrounded by one layer of flat cells.",
      "Primary follicle: cuboidal granulosa cells and zona pellucida.",
      "Secondary follicle shows an antrum; the mature Graafian follicle is the one that ovulates.",
      "Corpus luteum secretes progesterone; it degenerates into the corpus albicans.",
    ],
    viva: [
      "What is the germinal epithelium of the ovary? — Simple cuboidal epithelium covering the surface.",
      "Which cells make oestrogen in the follicle? — Theca interna and granulosa cells.",
    ],
    mcq: [
      ["A follicle with a fluid-filled antrum belongs to the:", "Secondary (antral) stage", "Primordial stage", "Primary stage", "Atretic stage", "The antrum appears in secondary follicles."],
      ["The ovary surface is covered by:", "Simple cuboidal epithelium", "Simple squamous epithelium", "Stratified squamous epithelium", "Mesothelium only", "The so-called germinal epithelium is simple cuboidal."],
    ],
  },
  {
    id: "h-uterus", subject: A, group: G, topic: "Female reproductive system", name: "Uterus (endometrium)",
    imgs: [{ f: P + "uterus-hp.webp" }],
    identify: [
      "Mucosa lined by simple columnar epithelium with tubular uterine glands",
      "Cellular endometrial stroma",
      "Glands are straight in the proliferative phase and coiled with secretions in the secretory phase",
      "Thick myometrium of smooth muscle below the endometrium",
    ],
    about: "The endometrium has a functional layer that is shed in menstruation and a basal layer that regenerates it. The glands and stroma change through the cycle under oestrogen and progesterone.",
    points: [
      "Proliferative phase: straight narrow glands, many mitoses, oestrogen dominated.",
      "Secretory phase: tortuous saw-toothed glands with secretions, progesterone dominated.",
      "Spiral arteries supply the functional layer; the basal layer is supplied by straight arteries.",
    ],
    viva: [
      "Which layer is shed during menstruation? — The functional layer.",
    ],
    mcq: [
      ["Saw-toothed tortuous glands indicate the:", "Secretory phase", "Proliferative phase", "Menstrual phase only", "Post-menopausal state", "Progesterone causes coiling and secretion of the glands."],
    ],
  },
  {
    id: "h-fallopian", subject: A, group: G, topic: "Female reproductive system", name: "Fallopian tube",
    imgs: [{ f: P + "fallopian-lp.webp", cap: "Low power" }, { f: P + "fallopian-hp.webp", cap: "High power" }],
    identify: [
      "Highly branched longitudinal mucosal folds giving a maze-like lumen (ampulla)",
      "Simple columnar epithelium with ciliated and peg (secretory) cells",
      "Two layers of smooth muscle: inner circular and outer longitudinal",
      "No submucosa and no glands",
    ],
    about: "The tube is lined by ciliated and secretory cells. Mucosal folds are most elaborate in the ampulla, where fertilisation usually occurs.",
    points: [
      "Ciliated cells beat toward the uterus; peg cells nourish the ovum.",
      "Isthmus has simple folds and thick muscle; the infundibulum has finger-like fimbriae.",
      "Salpingitis can damage the cilia and predispose to ectopic pregnancy.",
    ],
    viva: [
      "Site of fertilisation? — Ampulla of the fallopian tube.",
    ],
    mcq: [
      ["The most complex mucosal folds are seen in the:", "Ampulla", "Isthmus", "Intramural part", "Cervix", "The ampulla has extensively branching folds."],
    ],
  },
  {
    id: "h-mammary", subject: A, group: G, topic: "Female reproductive system", name: "Mammary gland (resting)",
    imgs: [{ f: P + "mammary.webp" }],
    identify: [
      "Lobules of small ducts and few alveoli in abundant dense connective tissue",
      "Lactiferous ducts lined by cuboidal or columnar epithelium",
      "Myoepithelial cells around the ducts",
      "Large amount of intralobular and interlobular stroma and fat",
    ],
    about: "In the resting (non-lactating) state the breast has many ducts but few secretory alveoli, set in fibrous and fatty stroma. During pregnancy the alveoli proliferate and the stroma shrinks.",
    points: [
      "Lactating gland: dilated alveoli with milk, little stroma.",
      "Prolactin drives milk production and oxytocin drives let-down through myoepithelial cells.",
      "Most breast cancers arise from the terminal duct lobular unit.",
    ],
    viva: [
      "Which hormone causes milk ejection? — Oxytocin.",
    ],
    mcq: [
      ["Myoepithelial cells of the breast contract under the influence of:", "Oxytocin", "Prolactin", "Oestrogen", "Progesterone", "Oxytocin causes the milk ejection reflex."],
    ],
  },
  {
    id: "h-umbilical", subject: A, group: G, topic: "Embryology", name: "Umbilical cord",
    imgs: [{ f: P + "umbilical.webp" }],
    identify: [
      "Two thick-walled umbilical arteries and one thin-walled umbilical vein",
      "Wharton's jelly (mucoid connective tissue) filling the cord",
      "Covered by a single layer of amniotic epithelium",
      "Remnants of the allantois and vitelline duct may be present",
    ],
    about: "The cord has two arteries carrying deoxygenated blood to the placenta and one vein carrying oxygenated blood to the fetus, embedded in Wharton's jelly rich in hyaluronic acid.",
    points: [
      "Single umbilical artery is associated with congenital anomalies (renal and cardiac).",
      "Wharton's jelly is a source of mesenchymal stem cells.",
      "No nerves are present in the cord.",
    ],
    viva: [
      "How many vessels does the cord contain? — Two arteries and one vein.",
    ],
    mcq: [
      ["Wharton's jelly is found in the:", "Umbilical cord", "Placenta villi", "Amnion", "Chorion laeve", "It is the mucoid connective tissue of the cord."],
    ],
  },
  {
    id: "h-placenta", subject: A, group: G, topic: "Embryology", name: "Placenta",
    imgs: [{ f: P + "placenta-lp.webp", cap: "Low power" }, { f: P + "placenta-hp.webp", cap: "High power" }],
    identify: [
      "Many chorionic villi cut in different planes, floating in the intervillous space",
      "Villi covered by trophoblast: outer syncytiotrophoblast and inner cytotrophoblast (in early pregnancy)",
      "Villous core of loose mesenchyme with fetal capillaries",
      "Maternal blood and decidua on the basal side",
    ],
    about: "The chorionic villi are the functional units. In the term placenta the cytotrophoblast layer becomes incomplete and the syncytiotrophoblast forms thin syncytial knots.",
    points: [
      "Placental barrier: syncytiotrophoblast, basement membrane, villous mesenchyme and fetal capillary endothelium.",
      "hCG is secreted by the syncytiotrophoblast.",
      "Hofbauer cells are fetal macrophages in the villous core.",
    ],
    viva: [
      "Which cells secrete hCG? — Syncytiotrophoblast.",
    ],
    mcq: [
      ["Hofbauer cells are:", "Fetal macrophages in the villous core", "Maternal decidual cells", "Cytotrophoblast cells", "Syncytial knots", "They are phagocytic cells of the villous stroma."],
    ],
  },
  {
    id: "h-thyroid", subject: A, group: G, topic: "Endocrine system", name: "Thyroid gland",
    imgs: [{ f: P + "thyroid-lp.webp", cap: "Low power" }, { f: P + "thyroid-hp.webp", cap: "High power" }],
    identify: [
      "Numerous round follicles of different sizes filled with pink colloid",
      "Follicles lined by simple cuboidal epithelium (follicular cells)",
      "Parafollicular (C) cells between follicles, pale cytoplasm",
      "Scalloping of colloid at the periphery in active glands",
    ],
    about: "Thyroid follicles store thyroglobulin as colloid. Active follicles are small with tall cells and scalloped colloid; inactive follicles are large with flat cells.",
    points: [
      "C cells secrete calcitonin and give rise to medullary carcinoma.",
      "Follicular epithelium height reflects activity: columnar when stimulated by TSH, flat when resting.",
      "Only endocrine gland that stores its hormone extracellularly (as colloid).",
    ],
    viva: [
      "Which cells secrete calcitonin? — Parafollicular C cells.",
    ],
    mcq: [
      ["The thyroid stores its hormone in the form of:", "Thyroglobulin in colloid", "Free T3", "Free T4", "Calcitonin granules", "Thyroglobulin is stored in the follicle lumen."],
    ],
  },
  {
    id: "h-adrenal", subject: A, group: G, topic: "Endocrine system", name: "Suprarenal (adrenal) gland",
    imgs: [{ f: P + "adrenal-lp.webp", cap: "Low power" }, { f: P + "adrenal-hp.webp", cap: "High power" }],
    identify: [
      "Outer cortex in three zones: zona glomerulosa, fasciculata, reticularis",
      "Inner medulla with large pale chromaffin cells around central veins",
      "Fasciculata has straight columns of vacuolated (lipid-rich) cells",
      "Capsule of connective tissue",
    ],
    about: "The cortex produces steroids and the medulla produces catecholamines. The zona fasciculata is the widest zone and the cells look vacuolated because of lipid.",
    points: [
      "Mnemonic from outside inward: GFR = salt (aldosterone), sugar (cortisol), sex (androgens).",
      "Medulla: chromaffin cells secrete adrenaline and noradrenaline; pheochromocytoma arises here.",
      "Cortex comes from mesoderm; medulla from neural crest.",
    ],
    viva: [
      "Which zone secretes aldosterone? — Zona glomerulosa.",
    ],
    mcq: [
      ["The widest zone of the adrenal cortex is the:", "Zona fasciculata", "Zona glomerulosa", "Zona reticularis", "Medulla", "It forms about 75% of the cortex."],
      ["The adrenal medulla is derived from:", "Neural crest", "Mesoderm", "Endoderm", "Surface ectoderm", "Chromaffin cells are modified postganglionic sympathetic neurons."],
    ],
  },
  {
    id: "h-trachea", subject: A, group: G, topic: "Respiratory system", name: "Trachea",
    imgs: [{ f: P + "trachea.webp" }],
    identify: [
      "Pseudostratified ciliated columnar epithelium with goblet cells",
      "C-shaped hyaline cartilage ring in the wall",
      "Seromucous glands in the submucosa",
      "Trachealis muscle bridging the open ends of the cartilage",
    ],
    about: "The tracheal wall has a respiratory mucosa, a submucosa with seromucous glands and a fibrocartilaginous layer with C-shaped hyaline cartilage rings.",
    points: [
      "Thick basement membrane under the epithelium.",
      "Cartilage keeps the airway open; the trachealis muscle allows the oesophagus to expand.",
      "Smoking causes squamous metaplasia of this epithelium.",
    ],
    viva: [
      "What type of cartilage is in the trachea? — Hyaline cartilage.",
    ],
    mcq: [
      ["A hyaline cartilage plate with respiratory epithelium and seromucous glands suggests:", "Trachea", "Bronchiole", "Oesophagus", "Epiglottis", "The trachea has C-shaped hyaline rings."],
    ],
  },
  {
    id: "h-lung", subject: A, group: G, topic: "Respiratory system", name: "Lung",
    imgs: [{ f: P + "lung.webp" }],
    identify: [
      "Thin-walled air spaces (alveoli) separated by thin interalveolar septa",
      "Bronchioles without cartilage or glands, with smooth muscle",
      "Alveolar ducts and sacs; alveolar pores may be seen",
      "Type I pneumocytes (flat) and type II pneumocytes (cuboidal)",
    ],
    about: "The lung parenchyma looks like a sponge made of alveoli. Type I pneumocytes form the thin gas-exchange surface and type II pneumocytes secrete surfactant.",
    points: [
      "Blood-air barrier: type I cell, fused basement membrane and capillary endothelium.",
      "Dust cells are alveolar macrophages.",
      "Clara (club) cells are found in terminal bronchioles.",
    ],
    viva: [
      "Which cells secrete surfactant? — Type II pneumocytes.",
    ],
    mcq: [
      ["Surfactant is produced by:", "Type II pneumocytes", "Type I pneumocytes", "Dust cells", "Goblet cells", "Type II cells have lamellar bodies containing surfactant."],
    ],
  },
  {
    id: "h-retina", subject: A, group: G, topic: "Eye", name: "Retina",
    imgs: [{ f: P + "retina.webp" }],
    identify: [
      "Multilayered neural tissue of ten layers lined internally by the inner limiting membrane",
      "Outermost pigment epithelium with melanin granules",
      "Rod and cone layer next to the pigment epithelium",
      "Choroid and sclera lie outside",
    ],
    about: "The retina is the light-sensitive layer of the eye. From outside to inside: pigment epithelium, photoreceptor layer, outer nuclear layer, outer plexiform, inner nuclear, inner plexiform, ganglion cell layer, nerve fibre layer and inner limiting membrane.",
    points: [
      "Light passes through all layers before reaching the rods and cones.",
      "Fovea has only cones; the optic disc has no photoreceptors (blind spot).",
      "Retinal detachment occurs between the pigment epithelium and the neural retina.",
    ],
    viva: [
      "Which layer contains the cell bodies of rods and cones? — Outer nuclear layer.",
    ],
    mcq: [
      ["The outermost layer of the retina is the:", "Pigment epithelium", "Ganglion cell layer", "Nerve fibre layer", "Inner nuclear layer", "The pigment epithelium rests on Bruch's membrane."],
    ],
  },
  {
    id: "h-cornea", subject: A, group: G, topic: "Eye", name: "Cornea",
    imgs: [{ f: P + "cornea.webp" }],
    identify: [
      "Anterior stratified squamous non-keratinised epithelium",
      "Bowman's membrane and a thick regular stroma of parallel collagen lamellae",
      "Descemet's membrane and a single layer of endothelium posteriorly",
      "Avascular tissue",
    ],
    about: "The cornea has five layers: epithelium, Bowman's membrane, stroma, Descemet's membrane and endothelium. Transparency depends on regular collagen arrangement and dehydration by the endothelium.",
    points: [
      "Highest density of sensory nerve endings of any tissue (via the ophthalmic nerve).",
      "Corneal transplantation rarely rejects because the cornea is avascular.",
      "Endothelium pumps fluid out to keep the stroma clear.",
    ],
    viva: [
      "How many layers does the cornea have? — Five.",
    ],
    mcq: [
      ["Which layer of the cornea is the basement membrane of the endothelium?", "Descemet's membrane", "Bowman's membrane", "Stroma", "Epithelium", "Descemet's membrane lies just in front of the endothelium."],
    ],
  },
  {
    id: "h-opticnerve", subject: A, group: G, topic: "Eye", name: "Optic nerve",
    imgs: [{ f: P + "opticnerve.webp" }],
    identify: [
      "Bundles of myelinated nerve fibres separated by fibrous septa",
      "Surrounded by meninges (dura, arachnoid, pia)",
      "Oligodendrocytes and astrocytes (central nervous tissue) in the septa",
      "Central retinal artery and vein in the middle of the nerve",
    ],
    about: "The optic nerve is really a CNS tract, so it is myelinated by oligodendrocytes and covered by all three meninges, with the subarachnoid space continuing around it.",
    points: [
      "Raised intracranial pressure transmits along the subarachnoid space and causes papilloedema.",
      "No Schwann cells; no regeneration after injury.",
    ],
    viva: [
      "Which cells myelinate the optic nerve? — Oligodendrocytes.",
    ],
    mcq: [
      ["The optic nerve is myelinated by:", "Oligodendrocytes", "Schwann cells", "Astrocytes", "Microglia", "It is part of the CNS."],
    ],
  },
  {
    id: "h-pituitary", subject: A, group: G, topic: "Endocrine system", name: "Pituitary gland",
    imgs: [{ f: P + "pituitary-lp.webp", cap: "Low power" }, { f: P + "pituitary-hp.webp", cap: "High power" }],
    identify: [
      "Pars distalis cells in cords with sinusoids: acidophils (pink), basophils (blue) and chromophobes (pale)",
      "Pars nervosa with pale pink nerve fibres, pituicytes and Herring bodies",
      "Pars intermedia with colloid-filled cysts (Rathke's cysts)",
      "Thin capsule",
    ],
    about: "The adenohypophysis (anterior lobe) has secretory cells that are classified by their staining. The neurohypophysis stores and releases hormones made in the hypothalamus.",
    points: [
      "Acidophils: GH and prolactin. Basophils: TSH, FSH, LH, ACTH. Chromophobes are degranulated or reserve cells.",
      "Herring bodies are collections of oxytocin and ADH in nerve terminals.",
      "Pituicytes are glial cells of the posterior lobe.",
    ],
    viva: [
      "What are Herring bodies? — Neurosecretory granules of oxytocin and ADH in the pars nervosa.",
    ],
    mcq: [
      ["Which cells of the anterior pituitary secrete growth hormone?", "Acidophils", "Basophils", "Chromophobes", "Pituicytes", "Somatotrophs and lactotrophs are acidophils."],
    ],
  },
  {
    id: "h-cerebellum", subject: A, group: G, topic: "Nervous system", name: "Cerebellum",
    imgs: [{ f: P + "cerebellum-lp.webp", cap: "Low power" }, { f: P + "cerebellum-hp.webp", cap: "High power" }],
    identify: [
      "Folia with a three-layered cortex: molecular, Purkinje cell and granular layer",
      "Large flask-shaped Purkinje cells in a single row between the other two layers",
      "Dense small granule cells in the deepest cortical layer",
      "White matter core (arbor vitae)",
    ],
    about: "The cerebellar cortex is the same in all folia. Purkinje cells are the only output neurons of the cortex and their axons are inhibitory (GABA).",
    points: [
      "Molecular layer: few cells (stellate and basket cells) and Purkinje dendrites.",
      "Granular layer: tightly packed granule cells and Golgi cells.",
      "Glomeruli of the granular layer are synaptic complexes with mossy fibres.",
    ],
    viva: [
      "Which cells are the output of the cerebellar cortex? — Purkinje cells.",
    ],
    mcq: [
      ["The middle layer of the cerebellar cortex contains:", "Purkinje cells", "Granule cells", "Basket cells", "Pyramidal cells", "Purkinje cell bodies form a single row between the molecular and granular layers."],
    ],
  },
  {
    id: "h-cerebrum", subject: A, group: G, topic: "Nervous system", name: "Cerebrum (cerebral cortex)",
    imgs: [{ f: P + "cerebrum-lp.webp" }],
    identify: [
      "Grey matter of six layers with neuronal cell bodies",
      "Pyramidal cells with an apical dendrite directed toward the pia",
      "White matter below with myelinated fibres and glial cells",
      "Pia mater and subarachnoid space on the surface",
    ],
    about: "The neocortex has six layers: molecular, external granular, external pyramidal, internal granular, internal pyramidal and multiform. The pyramidal cells are the main projection neurons.",
    points: [
      "Layer IV (internal granular) is thickest in sensory cortex; layer V (giant pyramidal cells of Betz) is thickest in motor cortex.",
      "Astrocytes and oligodendrocytes are seen as small nuclei among the neurons.",
    ],
    viva: [
      "Which layer has the Betz cells? — Layer V, the internal pyramidal layer of the motor cortex.",
    ],
    mcq: [
      ["Number of layers in the neocortex:", "Six", "Three", "Four", "Five", "The neocortex has six layers."],
    ],
  },
]
