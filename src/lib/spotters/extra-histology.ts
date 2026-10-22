import type { Extra } from "./extra"

export const EXTRA_HISTOLOGY: Record<string, Extra> = {
  "h-liver": {
    about: "The liver is covered by a thin connective tissue capsule (Glisson's capsule) and divided into classical hepatic lobules, which are hexagonal units with a central vein in the middle and portal triads at the corners. Plates (cords) of hepatocytes radiate from the central vein toward the periphery, separated by sinusoids lined by discontinuous endothelium and Kupffer cells (macrophages). The space of Disse lies between the hepatocytes and the sinusoidal lining and contains stellate cells (Ito cells) that store vitamin A. Each portal triad contains a branch of the hepatic artery, a branch of the portal vein and a bile duct (lined by cuboidal epithelium), together with lymphatics. Hepatocytes are polygonal with a central round nucleus, and some are binucleate. Human liver has little connective tissue between lobules, unlike the pig, which has complete septa.",
    points: [
      "Identification: hexagonal lobules, central vein, radiating plates of hepatocytes, sinusoids and portal triads.",
      "Portal triad: hepatic artery branch, portal vein branch and bile duct (and lymphatic).",
      "Kupffer cells: macrophages in the sinusoid; Ito cells in the space of Disse store vitamin A and form collagen in fibrosis.",
      "Functional units: classical lobule, portal lobule and the hepatic acinus (of Rappaport) with zones 1 to 3; zone 3 is most sensitive to ischaemia.",
      "Blood flows from the portal tract through the sinusoids to the central vein; bile flows in the opposite direction.",
    ],
    viva: [
      "What are the components of a portal triad? — Hepatic artery, portal vein and bile duct.",
      "Which cells line the sinusoids and phagocytose? — Kupffer cells.",
      "Where are Ito cells located? — In the space of Disse.",
      "Which zone of the acinus is most susceptible to ischaemia? — Zone 3, around the central vein.",
    ],
    mcq: [
      ["The central vein of the liver lobule drains into the:", "Hepatic vein", "Portal vein", "Hepatic artery", "Bile duct", "The central veins join to form the hepatic veins."],
      ["Kupffer cells are:", "Macrophages", "Fat-storing cells", "Bile duct cells", "Endothelial stem cells", "They are resident macrophages in sinusoids."],
      ["The space of Disse contains:", "Ito cells", "Kupffer cells", "Bile ductules", "Neurons", "Ito cells store vitamin A."],
      ["Zone most sensitive to hypoxia is:", "Zone 3", "Zone 1", "Zone 2", "All equal", "Zone 3 is furthest from the arterial supply."],
    ],
  },
  "h-gallbladder": {
    about: "The wall of the gall bladder has three layers: mucosa, muscularis externa and serosa or adventitia. There is no muscularis mucosae and no submucosa. The mucosa is thrown into numerous deep, branching folds that look like villi in section, lined by a simple columnar epithelium with microvilli and tall cells, without goblet cells; the lamina propria is a loose connective tissue with glands in the neck region. The muscle layer is thin and consists of irregular bundles of smooth muscle. The outer layer is serosa on the free surface and adventitia on the surface that attaches to the liver. Rokitansky-Aschoff sinuses (pouches of mucosa penetrating the muscle) may appear in disease. The epithelium absorbs water and concentrates bile five to ten times.",
    points: [
      "Identification: tall mucosal folds lined by simple columnar epithelium; no submucosa and no muscularis mucosae; no goblet cells.",
      "Function: stores and concentrates bile by active sodium and water absorption.",
      "CCK from the duodenum causes contraction of the gall bladder and relaxation of the sphincter of Oddi.",
      "Difference from small intestine: no true villi, no crypts, no goblet cells.",
    ],
    viva: [
      "Which layer is absent in the gall bladder? — The submucosa (and muscularis mucosae).",
      "What stimulates contraction of the gall bladder? — Cholecystokinin (CCK).",
      "What is the lining epithelium? — Simple columnar with microvilli.",
    ],
    mcq: [
      ["The gall bladder wall lacks:", "Submucosa", "Mucosa", "Muscularis externa", "Serosa", "The mucosa lies directly on the muscle layer."],
      ["Gall bladder contraction is stimulated by:", "CCK", "Secretin", "Gastrin", "Somatostatin", "CCK is released by the duodenum on entry of fat."],
      ["The epithelium of the gall bladder is:", "Simple columnar", "Stratified squamous", "Transitional", "Pseudostratified", "It is a simple columnar epithelium."],
    ],
  },
  "h-pancreas": {
    about: "The pancreas is a mixed exocrine and endocrine gland. The exocrine part (about 98 percent) is composed of serous acini of pyramid-shaped cells with a basal basophilic cytoplasm (rough ER) and apical eosinophilic zymogen granules. Centroacinar cells (the beginning of the intercalated duct inside the acinus) are pale cells in the lumen that are a feature specific to the pancreas, and there are no striated ducts, unlike the salivary glands. The endocrine part consists of pale-staining islets of Langerhans scattered among the acini, containing alpha cells (glucagon, 20 percent), beta cells (insulin, 70 percent), delta cells (somatostatin) and PP cells; with special stains beta cells are seen in the centre and alpha cells at the periphery. The gland is divided into lobules by thin connective tissue septa that contain interlobular ducts.",
    points: [
      "Identification: serous acini with zymogen granules, pale islets of Langerhans, centroacinar cells.",
      "No striated ducts; this differentiates it from the parotid gland.",
      "Islet cells: beta (70 percent, insulin), alpha (20 percent, glucagon), delta (somatostatin), PP (pancreatic polypeptide).",
      "CCK stimulates acinar secretion; secretin stimulates ductal bicarbonate secretion.",
      "Endocrine hormones: insulin lowers blood glucose; glucagon raises it.",
    ],
    viva: [
      "What are centroacinar cells? — Pale duct cells that lie within the acinus; a feature unique to the pancreas.",
      "Which cell secretes insulin? — Beta cell of the islets.",
      "How do you differentiate it from salivary glands? — Presence of islets and absence of striated ducts.",
    ],
    mcq: [
      ["Centroacinar cells are found in the:", "Pancreas", "Parotid gland", "Liver", "Thyroid", "They are characteristic of pancreatic acini."],
      ["The commonest cell in the islet of Langerhans is the:", "Beta cell", "Alpha cell", "Delta cell", "PP cell", "Beta cells form about 70 percent."],
      ["Zymogen granules are found in:", "Acinar cells", "Islet cells", "Duct cells", "Fibroblasts", "They store digestive enzyme precursors."],
    ],
  },
  "h-kidney": {
    about: "The kidney is covered by a fibrous capsule and divided into the outer cortex and inner medulla. In the cortex, one sees round renal corpuscles, each made of a glomerulus (tuft of fenestrated capillaries) inside Bowman's capsule, with a visceral layer of podocytes and a parietal layer of simple squamous epithelium, and the urinary space between them. Surrounding the corpuscles are the proximal convoluted tubules (PCT), with tall cuboidal cells with a brush border and strongly eosinophilic cytoplasm that stain darker, and distal convoluted tubules (DCT), with smaller, paler cuboidal cells without a brush border and a wider lumen. The macula densa of the DCT is part of the juxtaglomerular apparatus with the juxtaglomerular (granular) cells of the afferent arteriole that secrete renin. The medulla contains straight tubules: thin loops of Henle (simple squamous epithelium), thick limbs and collecting ducts (pale cuboidal cells with distinct borders). Medullary rays extend from the medulla into the cortex.",
    points: [
      "Cortex: renal corpuscles, PCT (brush border, eosinophilic, small lumen), DCT (paler, wider lumen).",
      "Medulla: loops of Henle (thin segments are squamous), collecting ducts and vasa recta.",
      "Juxtaglomerular apparatus: macula densa, JG cells (renin) and extraglomerular mesangial cells.",
      "Filtration barrier: fenestrated endothelium, glomerular basement membrane and podocyte slit diaphragm.",
      "PCT is more numerous than DCT in a section, and is darker.",
    ],
    viva: [
      "What are the layers of the filtration barrier? — Fenestrated endothelium, basement membrane and the podocyte filtration slits.",
      "Which cells secrete renin? — Juxtaglomerular cells in the afferent arteriole.",
      "How do you differentiate PCT from DCT? — PCT has a brush border, a narrow lumen and strong eosinophilia; DCT is paler with a wide, clear lumen.",
      "What is the macula densa? — A cluster of tall, crowded DCT cells at the vascular pole that sense sodium chloride.",
    ],
    mcq: [
      ["Brush border is seen in the:", "Proximal convoluted tubule", "Distal convoluted tubule", "Collecting duct", "Thin loop of Henle", "PCT cells have long microvilli."],
      ["The macula densa belongs to the:", "Distal convoluted tubule", "Proximal tubule", "Collecting duct", "Bowman's capsule", "It is a modified part of the DCT."],
      ["The podocytes are present in the:", "Visceral layer of Bowman's capsule", "Parietal layer", "PCT", "Collecting duct", "Podocytes form the visceral layer."],
      ["Renin is secreted by:", "JG cells", "Podocytes", "Mesangial cells", "Macula densa", "Modified smooth muscle cells in the afferent arteriole."],
    ],
  },
  "h-ureter": {
    about: "The ureter is a muscular tube with a narrow, star-shaped (stellate) lumen in cross section. Its wall has three layers: the mucosa, lined by transitional epithelium (urothelium) thrown into longitudinal folds, with a lamina propria of fibroelastic connective tissue and no submucosa; the muscularis, composed of an inner longitudinal and an outer circular layer of smooth muscle in the upper two-thirds, and an additional outer longitudinal layer in the lower third; and the adventitia, which is loose connective tissue with blood vessels and nerves. Peristaltic waves move urine from the renal pelvis to the bladder. Narrowing at three sites (pelviureteric junction, pelvic brim and vesicoureteric junction) are places where stones may lodge.",
    points: [
      "Identification: star-shaped lumen lined by transitional epithelium; thick muscle coat; no submucosa.",
      "Muscle: two layers in the upper two-thirds, three layers in the lower third.",
      "Sites of constriction: PUJ, pelvic brim (crossing the iliac vessels), VUJ.",
      "Transitional epithelium is impermeable to urine and stretches.",
    ],
    viva: [
      "What is the lining epithelium of the ureter? — Transitional epithelium (urothelium).",
      "How many muscle layers are present in the lower third? — Three.",
      "Name the three constrictions. — Pelviureteric junction, crossing at the pelvic brim, and vesicoureteric junction.",
    ],
    mcq: [
      ["The ureter has a lumen that is:", "Star-shaped", "Round", "Slit-like", "Absent", "Longitudinal mucosal folds give a stellate lumen."],
      ["The epithelium lining the ureter is:", "Transitional", "Simple cuboidal", "Stratified squamous keratinised", "Simple columnar", "Urothelium lines the urinary tract."],
      ["The ureter lacks a:", "Submucosa", "Muscularis", "Adventitia", "Mucosa", "The lamina propria lies directly on the muscle."],
    ],
  },
  "h-bladder": {
    about: "The wall of the urinary bladder has four layers: a mucosa lined by transitional epithelium (urothelium) of 5 to 7 cell layers when relaxed, with a superficial layer of large, umbrella cells (dome-shaped, sometimes binucleate) that cover several cells below; a lamina propria of connective tissue (the submucosa is poorly defined); a thick muscularis (detrusor) with three poorly defined layers of smooth muscle (inner longitudinal, middle circular and outer longitudinal); and an adventitia or serosa on the superior surface. The epithelium is flattened when the bladder is distended (two to three cell layers) and is thick in the empty state with mucosal folds. It forms an effective barrier to urine due to uroplakin plaques and tight junctions.",
    points: [
      "Identification: transitional epithelium with dome-shaped umbrella cells; thick smooth muscle (detrusor).",
      "The epithelium thins out and flattens during distension.",
      "Uroplakins form plaques that make the apical membrane impermeable.",
      "Transitional cell carcinoma is the commonest bladder cancer; risk factors are smoking and aniline dyes.",
    ],
    viva: [
      "What is the lining epithelium of the bladder? — Transitional epithelium.",
      "What are umbrella cells? — The large, dome-shaped superficial cells of the urothelium.",
      "What is the muscle called? — The detrusor muscle.",
    ],
    mcq: [
      ["Umbrella cells are present in the:", "Transitional epithelium", "Respiratory epithelium", "Skin", "Intestinal epithelium", "They are the superficial cells of urothelium."],
      ["The muscle layer of the bladder is the:", "Detrusor", "Cremaster", "Trigone", "Dartos", "The detrusor muscle empties the bladder."],
      ["The commonest bladder tumour is:", "Transitional cell carcinoma", "Squamous cell carcinoma", "Adenocarcinoma", "Sarcoma", "TCC is the commonest tumour."],
    ],
  },
  "h-prostate": {
    about: "The prostate is made of 30 to 50 compound tubuloalveolar glands embedded in a fibromuscular stroma that contains abundant smooth muscle. The glands have wide, irregular lumens with papillary infoldings of the epithelium and are lined by a simple or pseudostratified columnar or cuboidal epithelium. The distinguishing feature is the presence of corpora amylacea, round eosinophilic concretions of condensed secretion that may calcify with age, in the lumen of the glands. The prostate is divided into zones: central, peripheral (70 percent, the site of carcinoma), transition (the site of BPH) and periurethral. The gland secretes a thin, milky, slightly acidic fluid containing citric acid, acid phosphatase, PSA and fibrinolysin, which liquefies the semen. The urethra runs through the gland, and the ejaculatory ducts open into the prostatic urethra at the verumontanum.",
    points: [
      "Identification: irregular glands with papillary folds, corpora amylacea, fibromuscular stroma.",
      "Zones: peripheral (carcinoma), transition (BPH), central.",
      "Secretions: citric acid, acid phosphatase, PSA, zinc; PSA liquefies semen.",
      "Growth is controlled by dihydrotestosterone.",
    ],
    viva: [
      "What are corpora amylacea? — Concretions of secretory material in prostatic glands.",
      "In which zone does carcinoma of the prostate arise? — The peripheral zone.",
      "What is the role of PSA? — A protease that liquefies the semen coagulum; also a tumour marker.",
    ],
    mcq: [
      ["Corpora amylacea are seen in the:", "Prostate", "Seminal vesicle", "Testis", "Epididymis", "They are prostatic concretions."],
      ["BPH arises from the:", "Transition zone", "Peripheral zone", "Central zone", "Fibromuscular stroma", "BPH affects the periurethral transition zone."],
      ["The prostatic stroma is:", "Fibromuscular", "Adipose", "Reticular", "Cartilaginous", "It contains abundant smooth muscle."],
    ],
  },
  "h-testis": {
    about: "The testis is covered by a thick, dense, connective tissue capsule, the tunica albuginea, which is thickened posteriorly as the mediastinum testis, from which septa divide the testis into lobules. Each lobule contains one to four highly coiled seminiferous tubules lined by stratified germinal epithelium, which consists of Sertoli cells and spermatogenic cells at various stages (spermatogonia at the basal compartment, primary spermatocytes with large nuclei, secondary spermatocytes, round spermatids and elongated spermatids near the lumen). Sertoli cells are tall, pyramidal supporting cells with an oval or triangular pale nucleus and prominent nucleolus; they form the blood-testis barrier by tight junctions and secrete androgen-binding protein, inhibin and anti-Mullerian hormone. Between the tubules, there are clusters of Leydig (interstitial) cells, large polygonal eosinophilic cells that produce testosterone under LH stimulation, with Reinke crystals. The tubules lead to the straight tubules and rete testis.",
    points: [
      "Identification: coiled seminiferous tubules lined by spermatogenic cells, interstitial Leydig cells.",
      "Sertoli cells: blood-testis barrier, nourish germ cells, secrete ABP, inhibin and AMH; FSH acts on them.",
      "Leydig cells: testosterone; LH acts on them; contain Reinke crystals.",
      "Spermatogenesis takes about 74 days; spermiogenesis converts spermatids to spermatozoa.",
      "Temperature: the testis is 2 to 3 degrees below the body temperature.",
    ],
    viva: [
      "Which cells form the blood-testis barrier? — Sertoli cells.",
      "Which hormone acts on Leydig cells? — LH.",
      "Which cell secretes inhibin? — Sertoli cells.",
      "What is the duration of spermatogenesis? — About 74 days.",
    ],
    mcq: [
      ["Testosterone is secreted by:", "Leydig cells", "Sertoli cells", "Spermatogonia", "Spermatids", "Interstitial cells under LH."],
      ["Blood-testis barrier is formed by:", "Sertoli cells", "Leydig cells", "Myoid cells", "Spermatogonia", "Tight junctions between Sertoli cells."],
      ["Reinke crystals are found in:", "Leydig cells", "Sertoli cells", "Spermatozoa", "Myoid cells", "They are crystalloids in interstitial cells."],
      ["FSH acts on:", "Sertoli cells", "Leydig cells", "Prostate", "Epididymis", "FSH stimulates Sertoli cell function."],
    ],
  },
  "h-epididymis": {
    about: "The epididymis is a single, highly coiled tube about 6 metres long, composed of a head, body and tail, and sectioned many times in a slide, which gives the appearance of multiple tubules. Each tubule is lined by a tall, pseudostratified columnar epithelium of principal cells, which have long, non-motile stereocilia (branching microvilli) on the surface, and small basal cells. The tubule is surrounded by a thin layer of circularly arranged smooth muscle, which increases in thickness toward the tail, with loose connective tissue between them. The lumen often contains stored spermatozoa. The function of the epididymis is maturation, storage, absorption of fluid and transport of spermatozoa, which acquire motility and the ability to fertilise during their 12-day passage.",
    points: [
      "Identification: pseudostratified columnar epithelium with stereocilia, spermatozoa in the lumen, thin circular smooth muscle.",
      "Stereocilia are long, non-motile microvilli (not cilia).",
      "Functions: sperm maturation and storage, fluid absorption.",
      "Compare with vas deferens: thick three-layered muscle and a narrow, star-shaped lumen.",
    ],
    viva: [
      "What is the epithelium of the epididymis? — Pseudostratified columnar with stereocilia.",
      "What is the function of the epididymis? — Sperm maturation, storage and transport.",
      "Are stereocilia true cilia? — No, they are long branching microvilli.",
    ],
    mcq: [
      ["Stereocilia are found in the:", "Epididymis", "Trachea", "Fallopian tube", "Bronchi", "They line the epididymal duct."],
      ["Sperm gain motility in the:", "Epididymis", "Seminiferous tubule", "Vas deferens", "Seminal vesicle", "Maturation occurs in the epididymis."],
      ["The epididymal duct is lined by:", "Pseudostratified columnar epithelium", "Transitional epithelium", "Simple squamous epithelium", "Stratified squamous epithelium", "Principal and basal cells form the lining."],
    ],
  },
  "h-vasdeferens": {
    about: "The vas deferens is a thick-walled muscular tube with a narrow, star-shaped (stellate) lumen produced by longitudinal mucosal folds. The mucosa is lined by a pseudostratified columnar epithelium with stereocilia and has a lamina propria of fibroelastic tissue. The muscularis is very thick (the thickest muscle of any duct) and made of three layers of smooth muscle, an inner longitudinal, a middle circular and an outer longitudinal layer, and the outermost layer is adventitia containing blood vessels and nerves. Strong peristaltic contractions propel sperm during ejaculation. The terminal dilated part is the ampulla, and the duct joins the duct of the seminal vesicle to form the ejaculatory duct. Vasectomy involves cutting and ligating the vas.",
    points: [
      "Identification: narrow star-shaped lumen, pseudostratified epithelium with stereocilia, very thick three-layered muscle coat.",
      "Muscle layers: inner longitudinal, middle circular, outer longitudinal.",
      "Vasectomy is a permanent method of male sterilisation; sperm are absent after about 15 to 20 ejaculations.",
      "Part of the spermatic cord.",
    ],
    viva: [
      "What is the lining epithelium of the vas deferens? — Pseudostratified columnar with stereocilia.",
      "Which duct has the thickest muscle wall? — The vas deferens.",
      "What is vasectomy? — Ligation and cutting of the vas deferens for male sterilisation.",
    ],
    mcq: [
      ["The vas deferens has a muscle coat with:", "Three layers", "One layer", "Two layers", "No layers", "It has inner longitudinal, middle circular and outer longitudinal layers."],
      ["The lumen of the vas deferens is:", "Narrow and star-shaped", "Wide and round", "Absent", "Papillary", "Mucosal folds cause a narrow stellate lumen."],
      ["Vasectomy is a method of:", "Male sterilisation", "Female sterilisation", "Emergency contraception", "Barrier contraception", "It blocks the passage of sperm."],
    ],
  },
  "h-ovary": {
    about: "The ovary is covered by a surface layer of simple cuboidal germinal epithelium (a misnomer) over the tunica albuginea. The cortex has a dense stroma containing ovarian follicles at various stages: primordial follicles (a primary oocyte surrounded by a single layer of flat follicular cells), primary follicles (cuboidal granulosa cells, zona pellucida appears), secondary (antral) follicles (multiple layers of granulosa cells with a fluid-filled antrum, theca interna and externa) and the mature Graafian follicle, with a large antrum, cumulus oophorus and corona radiata. The corpus luteum forms after ovulation and secretes progesterone and oestrogen; the corpus albicans is the scar left after its regression. The medulla is a loose connective tissue containing large, coiled blood vessels. Atretic follicles are common. LH triggers ovulation and the formation of the corpus luteum; FSH stimulates follicular growth.",
    points: [
      "Identification: follicles at various stages in a cellular stroma; cortex and medulla.",
      "Follicle stages: primordial, primary, secondary (antral), Graafian.",
      "Theca interna produces androgens; granulosa cells convert them into oestrogen by aromatase (two-cell theory).",
      "Corpus luteum: granulosa lutein cells and theca lutein cells; progesterone.",
      "Corpus albicans: white scar tissue after luteal regression.",
    ],
    viva: [
      "What is the surface epithelium of the ovary? — Simple cuboidal (germinal) epithelium.",
      "Which cells produce oestrogen? — Granulosa cells, using androgens from theca interna cells.",
      "What is the corpus albicans? — The fibrous scar of a regressed corpus luteum.",
      "Which hormone triggers ovulation? — The LH surge.",
    ],
    mcq: [
      ["The primordial follicle consists of:", "Primary oocyte with a single layer of flat follicular cells", "Secondary oocyte with granulosa cells", "A mature ovum", "A fluid-filled antrum", "It is the earliest follicle stage."],
      ["The corpus luteum secretes:", "Progesterone", "FSH", "LH", "hCG", "It secretes progesterone and oestrogen."],
      ["The ovarian medulla contains:", "Large blood vessels", "Primordial follicles", "Corpus luteum", "Graafian follicles", "The medulla is vascular connective tissue."],
    ],
  },
  "h-uterus": {
    about: "The uterine wall has three layers: the endometrium (mucosa), myometrium (thick smooth muscle) and perimetrium (serosa). The endometrium is lined by a simple columnar epithelium, containing secretory and ciliated cells, and has a lamina propria (endometrial stroma) with simple tubular endometrial glands. It has two zones: the functional layer (stratum functionalis), which is shed in menstruation, and the basal layer (stratum basalis), which regenerates it and is supplied by straight arteries; the functional layer is supplied by coiled (spiral) arteries. In the proliferative phase, under oestrogen, glands are straight and narrow with mitoses; in the secretory phase, under progesterone, the glands become tortuous and saw-toothed with secretions and the stroma is oedematous with predecidual change; during menstruation, there is ischaemic necrosis and shedding of the functional layer due to spasm of the spiral arteries when progesterone falls.",
    points: [
      "Identification: endometrium with tubular glands and stroma; thick myometrium.",
      "Functional layer shed during menstruation; basal layer regenerates.",
      "Proliferative phase: straight glands (oestrogen); secretory phase: saw-toothed glands (progesterone).",
      "Spiral arteries supply the functional layer; menstruation results from their constriction.",
      "Myometrium: three poorly defined layers, markedly hypertrophied in pregnancy.",
    ],
    viva: [
      "Which layer of the endometrium is shed? — The functional layer.",
      "What causes menstruation? — Fall in progesterone leading to spasm of the spiral arteries and ischaemia.",
      "Which phase has saw-toothed glands? — Secretory phase.",
    ],
    mcq: [
      ["The functional layer is supplied by:", "Spiral arteries", "Straight arteries", "Uterine veins", "Arcuate veins", "Spiral arteries supply the functional zone."],
      ["Saw-toothed glands are seen in the:", "Secretory phase", "Proliferative phase", "Menstrual phase", "Menopause", "Progesterone causes tortuous glands."],
      ["The layer that regenerates the endometrium is the:", "Basalis", "Functionalis", "Perimetrium", "Myometrium", "The stratum basalis remains after menstruation."],
    ],
  },
  "h-fallopian": {
    about: "The fallopian tube (uterine tube) has an extremely folded mucosa in the ampulla, so that the lumen is almost filled by branching longitudinal folds, which is a distinguishing feature. The epithelium is simple columnar and consists of ciliated cells (which beat towards the uterus) and secretory (peg) cells that nourish the ovum and sperm, with a thin lamina propria. The muscularis is made of an inner circular and outer longitudinal layer of smooth muscle, and the serosa covers the outside. The isthmus has fewer folds and a thicker muscle layer, and the intramural (interstitial) part runs through the uterine wall. The tube picks up the ovum at the fimbriated end, is the usual site of fertilisation (ampulla), and transports the zygote to the uterus in 3 to 4 days by ciliary action and peristalsis. Ectopic pregnancy is most often in the ampulla.",
    points: [
      "Identification: highly branched mucosal folds almost occluding the lumen, ciliated and peg cells.",
      "Ampulla: most folded (site of fertilisation); isthmus: narrow lumen, thick muscle.",
      "Ciliated cells transport the ovum; peg cells secrete nutritive fluid.",
      "Salpingitis can damage the cilia and cause infertility or ectopic pregnancy.",
    ],
    viva: [
      "Where does fertilisation occur? — In the ampulla of the fallopian tube.",
      "What is the lining epithelium? — Simple columnar, with ciliated and peg cells.",
      "What is the feature that distinguishes the ampulla in section? — Complex branching mucosal folds filling the lumen.",
    ],
    mcq: [
      ["The tubal epithelium is:", "Ciliated simple columnar", "Stratified squamous", "Transitional", "Simple cuboidal", "Ciliated and secretory cells line the tube."],
      ["The most folded part of the tube is the:", "Ampulla", "Isthmus", "Interstitial part", "Infundibulum only", "The ampulla has the most extensive folds."],
      ["Peg cells are:", "Secretory cells", "Ciliated cells", "Stem cells", "Smooth muscle cells", "They secrete nutritive fluid."],
    ],
  },
  "h-mammary": {
    about: "The resting (non-lactating) mammary gland consists of 15 to 20 lobes of compound tubuloalveolar glands that open at the nipple through lactiferous ducts. In the inactive state, the glandular tissue is scanty, with small lobules containing short ducts and rudimentary alveoli embedded in abundant dense, irregular connective tissue and adipose tissue (interlobular stroma), which forms most of the breast bulk. The ducts are lined by simple cuboidal or low columnar epithelium with myoepithelial cells around them. The intralobular stroma is looser and more cellular. During pregnancy, the glands proliferate under oestrogen and progesterone; in lactation, the alveoli are distended with milk and lined by secretory cuboidal cells, and prolactin and oxytocin (milk ejection) act. Lactiferous sinuses lie below the nipple and are lined by stratified squamous epithelium close to the opening.",
    points: [
      "Resting gland: few ducts and few alveoli in abundant fibrous and fatty stroma.",
      "Lactating gland: well-developed alveoli with milk secretion; stroma reduced.",
      "Prolactin for milk production; oxytocin for milk ejection (let-down).",
      "Myoepithelial cells contract under oxytocin.",
      "Ductal carcinoma (most common) and lobular carcinoma arise from the terminal duct lobular unit.",
    ],
    viva: [
      "Which hormone causes milk ejection? — Oxytocin.",
      "Which hormone causes milk production? — Prolactin.",
      "How can you differentiate resting from lactating breast? — The resting breast has few small acini in a large stroma; the lactating breast has distended alveoli with milk.",
    ],
    mcq: [
      ["Milk ejection is due to:", "Oxytocin", "Prolactin", "Oestrogen", "Progesterone", "Oxytocin contracts myoepithelial cells."],
      ["A resting mammary gland has:", "Few ducts in abundant stroma", "Distended alveoli", "Milk-filled lobules", "No ducts", "The resting gland is mainly stroma."],
      ["Myoepithelial cells lie around the:", "Alveoli and ducts", "Blood vessels", "Nipple skin", "Adipocytes", "They contract to expel milk."],
    ],
  },
  "h-umbilical": {
    about: "The umbilical cord is covered by a single layer of amniotic epithelium (a flat to cuboidal epithelium). Inside it lies a gelatinous connective tissue called Wharton's jelly, a mucoid connective tissue rich in hyaluronic acid with scattered fibroblasts and mast cells. The cord contains two umbilical arteries, which are small and thick-walled with a muscular wall, and one umbilical vein, which is larger and has a wider lumen. There are no vasa vasorum and no elastic lamina in the arteries. The remnants of the allantois and the yolk sac (vitelline duct) may also be seen. The vessels are protected from compression by the jelly. A single umbilical artery is associated with congenital anomalies in about 20 percent. The cord is about 50 cm long.",
    points: [
      "Identification: two arteries with thick muscular walls, one vein with a larger lumen, Wharton's jelly, amniotic epithelium.",
      "Umbilical vein carries oxygenated blood to the fetus; the arteries carry deoxygenated blood away.",
      "Single umbilical artery (SUA) can be associated with renal and cardiac anomalies.",
      "The vessels lack an internal elastic lamina and vasa vasorum.",
    ],
    viva: [
      "What is Wharton's jelly? — A mucoid connective tissue that surrounds the vessels of the umbilical cord.",
      "How many vessels does the cord contain? — Two arteries and one vein.",
      "Which vessel carries oxygenated blood? — The umbilical vein.",
    ],
    mcq: [
      ["Wharton's jelly is a type of:", "Mucoid connective tissue", "Cartilage", "Bone", "Adipose tissue", "It is rich in hyaluronic acid."],
      ["The umbilical cord is covered by:", "Amniotic epithelium", "Skin", "Peritoneum", "Pleura", "Amnion covers the cord."],
      ["The thick-walled vessels in the cord are the:", "Umbilical arteries", "Umbilical vein", "Lymphatics", "Venules", "The arteries have thick muscular walls."],
    ],
  },
  "h-placenta": {
    about: "The mature (term) placenta shows the chorionic villi, which are tree-like projections floating in the intervillous space filled with maternal blood. At term, the villi have a thin syncytiotrophoblast layer with scattered syncytial knots and a discontinuous cytotrophoblast, since the cytotrophoblast layer disappears as pregnancy advances, which makes the barrier thinner. Inside the villus, there is a core of loose mesenchymal connective tissue with fetal capillaries that are located close to the syncytiotrophoblast (vasculosyncytial membranes), and Hofbauer cells (macrophages). In early pregnancy (first trimester), the villi are larger with a double layer of trophoblast (continuous cytotrophoblast) and fewer capillaries. The placental barrier at term consists of syncytiotrophoblast, fused basement membranes and fetal capillary endothelium. The basal plate carries decidual cells and fibrinoid (Nitabuch's and Rohr's layers), and septa divide the cotyledons.",
    points: [
      "Identification: chorionic villi with fetal capillaries surrounded by syncytiotrophoblast, in an intervillous space.",
      "Early pregnancy: thick villi with two layers of trophoblast. Term: thin villi, few cytotrophoblast cells, syncytial knots.",
      "Placental barrier at term: syncytiotrophoblast, basement membrane, endothelium of fetal capillary.",
      "Hofbauer cells: placental macrophages in the villous core.",
      "Syncytiotrophoblast produces hCG, hPL, oestrogen and progesterone.",
    ],
    viva: [
      "What are the layers of the placental barrier at term? — Syncytiotrophoblast, basement membrane and fetal capillary endothelium.",
      "Which cells secrete hCG? — The syncytiotrophoblast.",
      "What are Hofbauer cells? — Macrophages in the villous core.",
    ],
    mcq: [
      ["Which hormone is produced by the syncytiotrophoblast?", "hCG", "FSH", "LH", "Oxytocin", "hCG is secreted from the syncytiotrophoblast."],
      ["The cytotrophoblast layer of villi at term is:", "Discontinuous", "Thick and continuous", "Absent in villi", "Replaced by amnion", "It becomes thin and discontinuous."],
      ["Hofbauer cells are:", "Macrophages", "Trophoblasts", "Fibroblasts", "Endothelial cells", "They are found in the core of villi."],
    ],
  },
  "h-thyroid": {
    about: "The thyroid gland is enclosed in a thin connective tissue capsule that sends septa inward to divide it into lobules. It is made of numerous round to oval follicles of variable size, each lined by a simple cuboidal epithelium of follicular cells and filled with pink-staining colloid (thyroglobulin). The follicular cells vary with activity: they are cuboidal in the normal state, tall columnar with scalloped colloid in an active gland, and flat in an inactive gland. In the interfollicular spaces are parafollicular (C) cells, large pale-staining cells that secrete calcitonin, found singly or in small groups between follicles and in the follicular wall without reaching the lumen. A rich capillary network surrounds the follicles. Thyroglobulin is iodinated and stored extracellularly, and thyroid hormones (T3 and T4) are released by endocytosis of colloid.",
    points: [
      "Identification: follicles with colloid lined by cuboidal cells; pale parafollicular C cells in between.",
      "Active thyroid: tall cells with scalloped colloid; inactive: flat cells with abundant colloid.",
      "C cells secrete calcitonin (reduces serum calcium); medullary carcinoma arises from them.",
      "Thyroid is the only endocrine gland that stores its hormone extracellularly (in colloid).",
      "Hormones: T3 and T4 increase the metabolic rate.",
    ],
    viva: [
      "Which cells produce calcitonin? — Parafollicular (C) cells.",
      "What does colloid contain? — Thyroglobulin.",
      "How does the follicular epithelium differ with activity? — Cuboidal when normal, columnar when active, flat when inactive.",
    ],
    mcq: [
      ["Calcitonin is produced by:", "Parafollicular cells", "Follicular cells", "Chief cells", "Oxyphil cells", "C cells secrete calcitonin."],
      ["Thyroid follicles are filled with:", "Colloid", "Mucus", "Lymph", "Serous fluid", "Colloid is made of thyroglobulin."],
      ["Medullary carcinoma of the thyroid arises from:", "C cells", "Follicular cells", "Lymphocytes", "Fibroblasts", "It is a neoplasm of the parafollicular cells."],
    ],
  },
  "h-adrenal": {
    about: "The adrenal (suprarenal) gland is covered by a thick connective tissue capsule and consists of an outer cortex and an inner medulla. The cortex is divided into three zones from the outside: the zona glomerulosa (small cells in rounded clusters, producing aldosterone, under angiotensin II), the zona fasciculata (the thickest zone, with large, pale, vacuolated lipid-rich cells arranged in straight cords producing cortisol under ACTH) and the zona reticularis (small, darker cells in an anastomosing network, producing androgens, such as DHEA). The medulla contains large, pale polyhedral chromaffin cells arranged in clumps and cords around wide sinusoidal capillaries and a few ganglion cells; these cells secrete adrenaline (80 percent) and noradrenaline, and are innervated by preganglionic sympathetic fibres. A mnemonic is GFR (salt, sugar, sex) from outside inward. Pheochromocytoma is a tumour of the medulla.",
    points: [
      "Cortex zones: glomerulosa (aldosterone), fasciculata (cortisol), reticularis (androgens): salt, sugar, sex.",
      "Medulla: chromaffin cells secreting adrenaline and noradrenaline.",
      "Fasciculata cells appear vacuolated due to lipid dissolved during processing.",
      "Pheochromocytoma: the rule of 10s; presents with episodic hypertension, sweating, headache and palpitations.",
    ],
    viva: [
      "Which zone of the cortex produces cortisol? — Zona fasciculata.",
      "Which cells are found in the medulla? — Chromaffin cells.",
      "What is the rule for the zones of the cortex? — Salt, sugar, sex (GFR).",
    ],
    mcq: [
      ["Aldosterone is produced in the:", "Zona glomerulosa", "Zona fasciculata", "Zona reticularis", "Medulla", "The outermost zone secretes mineralocorticoids."],
      ["The thickest zone of the adrenal cortex is the:", "Zona fasciculata", "Zona glomerulosa", "Zona reticularis", "Capsule", "The fasciculata is the widest zone."],
      ["The adrenal medulla is derived from:", "Neural crest", "Mesoderm", "Endoderm", "Surface ectoderm", "Chromaffin cells arise from neural crest."],
    ],
  },
  "h-trachea": {
    about: "The trachea is a tube about 10 to 12 cm long, whose wall has four layers: the mucosa, submucosa, hyaline cartilage and adventitia. The mucosa is lined by a pseudostratified ciliated columnar epithelium with goblet cells, basal cells and brush cells, and neuroendocrine (Kulchitsky) cells, which rests on a thick basement membrane (thickened in asthma) and a lamina propria of loose connective tissue with elastic fibres and lymphoid tissue. The submucosa has seromucous glands that open into the lumen. The wall is supported by 16 to 20 C-shaped rings of hyaline cartilage, with the open part facing posteriorly closed by the trachealis muscle (smooth muscle) and fibroelastic ligament, which allows the oesophagus to expand during swallowing and changes the diameter of the lumen during coughing. The outermost layer is the adventitia. Cilia sweep mucus toward the pharynx (the mucociliary escalator).",
    points: [
      "Identification: C-shaped hyaline cartilage, respiratory epithelium with goblet cells, seromucous glands in the submucosa, trachealis muscle posteriorly.",
      "Epithelium: pseudostratified ciliated columnar with goblet cells (respiratory epithelium).",
      "Smoking causes squamous metaplasia and loss of cilia.",
      "The mucociliary escalator moves trapped particles upward.",
    ],
    viva: [
      "What is the shape of the tracheal cartilage? — C-shaped hyaline cartilage rings.",
      "What is the epithelium? — Pseudostratified ciliated columnar with goblet cells.",
      "What closes the gap of the C? — The trachealis muscle.",
    ],
    mcq: [
      ["The tracheal cartilage is:", "Hyaline", "Elastic", "Fibrocartilage", "Absent", "C-shaped hyaline rings support the trachea."],
      ["Squamous metaplasia in smokers affects the:", "Respiratory epithelium", "Alveolar cells", "Pleura", "Cartilage", "Chronic irritation replaces the ciliated epithelium."],
      ["The posterior gap of the trachea is closed by:", "Trachealis muscle", "Cartilage", "Elastic ligament only", "Skeletal muscle", "The trachealis is smooth muscle."],
    ],
  },
  "h-lung": {
    about: "The lung parenchyma shows a spongy appearance, with numerous thin-walled air spaces. The bronchi have cartilage plates and glands in their wall and are lined by pseudostratified ciliated columnar epithelium; the bronchioles have no cartilage and no glands and are lined by simple ciliated columnar epithelium with Clara (club) cells, and have a prominent smooth muscle layer; the terminal bronchioles lead to respiratory bronchioles, alveolar ducts and alveolar sacs, which contain alveoli. Alveoli are lined by type I pneumocytes (thin squamous cells that form the gas exchange surface, 95 percent of surface) and type II pneumocytes (cuboidal cells with foamy cytoplasm and lamellar bodies that secrete surfactant), with alveolar macrophages (dust cells) in the lumen. The blood-air barrier consists of surfactant, type I cell, fused basement membrane and capillary endothelium. Interalveolar septa contain capillaries and elastic fibres, and Kohn pores allow air to pass between alveoli.",
    points: [
      "Identification: alveoli, alveolar ducts, bronchioles without cartilage, bronchi with cartilage plates.",
      "Type II pneumocytes produce surfactant (dipalmitoylphosphatidylcholine); deficiency causes neonatal RDS.",
      "Dust cells are alveolar macrophages; heart failure cells contain haemosiderin.",
      "Clara (club) cells secrete a surfactant-like material and detoxify.",
      "Lecithin to sphingomyelin ratio above 2 shows fetal lung maturity.",
    ],
    viva: [
      "Which cells secrete surfactant? — Type II pneumocytes.",
      "What are dust cells? — Alveolar macrophages.",
      "How do you differentiate bronchus from bronchiole? — The bronchus has cartilage plates and glands; the bronchiole has neither.",
    ],
    mcq: [
      ["Surfactant is produced by:", "Type II pneumocytes", "Type I pneumocytes", "Clara cells", "Macrophages", "Type II cells secrete surfactant."],
      ["Bronchioles differ from bronchi in lacking:", "Cartilage and glands", "Smooth muscle", "Epithelium", "Elastic fibres", "Bronchioles have no cartilage or glands."],
      ["Gas exchange mainly occurs across:", "Type I pneumocytes", "Type II pneumocytes", "Clara cells", "Goblet cells", "Type I cells form the thin gas exchange surface."],
    ],
  },
  "h-retina": {
    about: "The retina is the innermost layer of the eye and has ten layers in light microscopy, from outside to inside: (1) the retinal pigment epithelium, a single layer of cuboidal cells with melanin that absorbs scattered light and phagocytoses the shed outer segments of photoreceptors; (2) the layer of rods and cones (outer segments); (3) the outer limiting membrane; (4) the outer nuclear layer (nuclei of rods and cones); (5) the outer plexiform layer (synapses with bipolar and horizontal cells); (6) the inner nuclear layer (nuclei of bipolar, horizontal, amacrine and Muller cells); (7) the inner plexiform layer; (8) the ganglion cell layer; (9) the nerve fibre layer (axons of ganglion cells, which form the optic nerve); and (10) the inner limiting membrane. Rods mediate dim light (scotopic) vision and use rhodopsin, which needs vitamin A; cones mediate colour and sharp vision. The fovea centralis has only cones, and the blind spot (optic disc) has no photoreceptors. Light passes through all the layers before it reaches the photoreceptors, so the retina is said to be inverted.",
    points: [
      "Ten layers; the neuronal chain is photoreceptor, bipolar cell and ganglion cell.",
      "Rods: dim light vision, rhodopsin, vitamin A. Cones: colour and acuity, fovea.",
      "Retinal pigment epithelium: melanin and phagocytosis of the shed discs.",
      "Optic disc has no photoreceptors; this is the blind spot.",
      "Retinal detachment is separation of the neurosensory retina from the pigment epithelium.",
    ],
    viva: [
      "Which layer contains the nuclei of the photoreceptors? — Outer nuclear layer.",
      "Which cells form the optic nerve? — Axons of the ganglion cells.",
      "What is the function of the pigment epithelium? — Absorbs light and phagocytoses the outer segments; supports photoreceptors.",
    ],
    mcq: [
      ["The outermost layer of the retina is:", "Pigment epithelium", "Ganglion cell layer", "Nerve fibre layer", "Inner nuclear layer", "The pigment epithelium lies next to the choroid."],
      ["The optic nerve fibres arise from the:", "Ganglion cells", "Bipolar cells", "Rods", "Amacrine cells", "Ganglion cell axons form the nerve fibre layer."],
      ["Vitamin A is needed for:", "Rhodopsin", "Collagen synthesis", "Clotting", "Calcium absorption", "Retinal is part of rhodopsin."],
    ],
  },
  "h-cornea": {
    about: "The cornea is a transparent, avascular tissue that has five layers from the outside to the inside. The anterior (corneal) epithelium is a non-keratinised stratified squamous epithelium of 5 to 6 layers with a high regenerative capacity and rich in nerve endings, which makes the cornea very sensitive. Bowman's layer is an acellular condensed layer of collagen fibrils that does not regenerate. The stroma (substantia propria) forms about 90 percent of the thickness and consists of regularly arranged parallel lamellae of collagen fibres with flat keratocytes (fibroblasts) between them, with the regular arrangement making it transparent. Descemet's membrane is a thick basement membrane of the endothelium. The corneal endothelium is a single layer of squamous cells that pumps fluid out of the stroma to maintain deturgescence and transparency, and it does not regenerate. The cornea gets nutrition from the aqueous humour, tear film and limbal vessels.",
    points: [
      "Five layers: epithelium, Bowman's layer, stroma, Descemet's membrane, endothelium.",
      "Transparency: regular collagen arrangement, avascularity, deturgescence by the endothelial pump.",
      "Sensory nerve supply from the ophthalmic division of the trigeminal nerve.",
      "Corneal transplantation (keratoplasty): the first tissue transplant with a high success rate because of avascularity (immune privilege).",
      "Endothelial cells do not regenerate; their loss causes corneal oedema.",
    ],
    viva: [
      "Which layer of the cornea does not regenerate? — Bowman's layer (and the endothelium).",
      "What maintains the corneal transparency? — Regular collagen, no vessels and endothelial pump.",
      "Which is the thickest layer? — The stroma (substantia propria).",
    ],
    mcq: [
      ["Descemet's membrane is the basement membrane of the:", "Endothelium", "Epithelium", "Stroma", "Bowman's layer", "It lies behind the stroma."],
      ["The cornea is nourished by:", "Aqueous humour and tears", "Blood vessels in the stroma", "Lymphatics", "Choroid", "It is avascular."],
      ["The nerve supply to the cornea is the:", "Ophthalmic division of V", "Facial nerve", "Optic nerve", "Oculomotor nerve", "The trigeminal nerve provides sensation."],
    ],
  },
  "h-opticnerve": {
    about: "The optic nerve in transverse section is surrounded by meninges, with a thick outer dura mater, the arachnoid and the pia mater, and a subarachnoid space that contains cerebrospinal fluid. The nerve is made of about one million myelinated axons of the retinal ganglion cells, arranged in bundles (fascicles) that are separated by septa of connective tissue and pia mater carrying blood vessels. The axons are myelinated by oligodendrocytes (not Schwann cells) because the optic nerve is a CNS tract, and there is no neurilemma, so they do not regenerate. Astrocytes provide support between the bundles. The central retinal artery and vein run in the centre of the nerve. Raised intracranial pressure transmits through the subarachnoid space around the nerve and causes papilloedema.",
    points: [
      "Identification: fascicles of myelinated axons separated by connective tissue septa, meninges around, central retinal vessels.",
      "Myelin: produced by oligodendrocytes; part of the CNS.",
      "The nerve sheath is continuous with intracranial meninges: raised ICP causes papilloedema.",
      "Optic neuritis is common in multiple sclerosis.",
    ],
    viva: [
      "Which cells produce myelin in the optic nerve? — Oligodendrocytes.",
      "Why does the optic nerve not regenerate? — It is a CNS tract without neurilemma.",
      "What is papilloedema? — Swelling of the optic disc caused by raised intracranial pressure.",
    ],
    mcq: [
      ["The optic nerve is myelinated by:", "Oligodendrocytes", "Schwann cells", "Astrocytes", "Microglia", "It is part of the CNS."],
      ["Papilloedema results from raised:", "Intracranial pressure", "Blood pressure", "Intraocular pressure", "Pulse pressure", "CSF pressure transmits along the nerve sheath."],
      ["The central retinal artery runs in the:", "Centre of the optic nerve", "Outer sheath only", "Cornea", "Choroid", "It enters the nerve behind the globe."],
    ],
  },
  "h-pituitary": {
    about: "The pituitary gland (hypophysis) has two main parts with different origins: the anterior lobe (adenohypophysis, from Rathke's pouch, an ectodermal outgrowth of the oral cavity) and the posterior lobe (neurohypophysis, from the neural ectoderm of the diencephalon). The anterior pituitary has cords of cells separated by sinusoidal capillaries, with chromophils (acidophils and basophils) and chromophobes. Acidophils (alpha cells) stain pink and secrete growth hormone and prolactin; basophils (beta cells) stain blue and secrete ACTH, TSH, FSH and LH; chromophobes are pale, degranulated or stem cells. The pars intermedia contains colloid-filled cysts (Rathke's cysts) and basophils. The posterior pituitary contains unmyelinated axons of the hypothalamic neurons (supraoptic and paraventricular nuclei) and pituicytes (glial cells), with Herring bodies (dilated axon terminals storing oxytocin and ADH) and no secretory cells. Hormones are produced in the hypothalamus and released from the posterior pituitary.",
    points: [
      "Anterior pituitary: acidophils (GH, prolactin), basophils (ACTH, TSH, FSH, LH), chromophobes.",
      "Posterior pituitary: pituicytes and axons with Herring bodies; stores oxytocin and ADH.",
      "Hypothalamic-hypophyseal portal system carries releasing hormones to the anterior lobe.",
      "Pituitary adenoma: prolactinoma is the commonest functional adenoma; bitemporal hemianopia from chiasma compression.",
      "Sheehan's syndrome: postpartum pituitary necrosis.",
    ],
    viva: [
      "What are Herring bodies? — Dilated axon terminals in the posterior pituitary storing oxytocin and ADH.",
      "Which cells secrete growth hormone? — Acidophils (somatotrophs).",
      "What is the embryological origin of the anterior pituitary? — Rathke's pouch.",
    ],
    mcq: [
      ["Herring bodies are seen in the:", "Posterior pituitary", "Anterior pituitary", "Thyroid", "Adrenal medulla", "They store neurosecretory material."],
      ["The anterior pituitary arises from:", "Rathke's pouch", "Neural tube", "Foregut", "Neural crest", "It develops from oral ectoderm."],
      ["The commonest functioning pituitary adenoma is:", "Prolactinoma", "Somatotroph adenoma", "Corticotroph adenoma", "Thyrotroph adenoma", "Prolactinomas are the commonest."],
    ],
  },
  "h-cerebellum": {
    about: "The cerebellar cortex has three layers from the outside to the inside. The outer molecular layer is poorly cellular, contains the dendrites of Purkinje cells, parallel fibres (axons of granule cells), and a few stellate and basket cells. The middle Purkinje cell layer is a single row of large, flask-shaped neurons with a large, round nucleus and the dendritic tree extending to the molecular layer; their axons are the only output of the cerebellar cortex and are inhibitory (GABA) to the deep cerebellar nuclei. The inner granular layer is densely packed with small, darkly stained granule cells, together with Golgi cells and glomeruli (synaptic complexes), and the granule cell axons ascend to the molecular layer to bifurcate into parallel fibres. The central white matter (medullary core) contains the nerve fibres and the deep nuclei (dentate, emboliform, globose and fastigial). Cerebellar function includes coordination, balance and motor learning; lesions cause ataxia, intention tremor, dysmetria and nystagmus.",
    points: [
      "Identification: three layers, with the single row of large Purkinje cells between molecular and granular layers.",
      "Purkinje cells are the only output neurons of the cortex (inhibitory, GABA).",
      "Granule cells are the only excitatory neurons of the cortex (glutamate).",
      "Climbing fibres (from inferior olive) and mossy fibres (from other sources) are the two inputs.",
      "Cerebellar signs: ataxia, intention tremor, dysdiadochokinesia, nystagmus, hypotonia.",
    ],
    viva: [
      "Which cells are the output of the cerebellar cortex? — Purkinje cells.",
      "Which neurotransmitter do Purkinje cells use? — GABA (inhibitory).",
      "Which layer has the most cells? — The granular layer.",
    ],
    mcq: [
      ["Flask-shaped neurons in a single row are:", "Purkinje cells", "Granule cells", "Basket cells", "Golgi cells", "Purkinje cells lie between the two layers."],
      ["The only excitatory neuron of the cerebellar cortex is the:", "Granule cell", "Purkinje cell", "Golgi cell", "Basket cell", "Granule cells release glutamate."],
      ["A cerebellar lesion produces:", "Intention tremor", "Resting tremor", "Rigidity", "Chorea", "Intention tremor and ataxia are cerebellar signs."],
    ],
  },
  "h-cerebrum": {
    about: "The cerebral cortex is the grey matter covering the cerebrum and has six layers in the neocortex, from the pia surface inward: I, the molecular (plexiform) layer, with few cells and many horizontal fibres; II, the external granular layer, with small stellate (granule) neurons; III, the external pyramidal layer, with small to medium pyramidal cells; IV, the internal granular layer, with stellate cells that receive thalamic input (thick in the sensory cortex); V, the internal pyramidal layer, with large pyramidal cells (including Betz cells in the motor cortex) that give rise to the efferent projection fibres; and VI, the multiform (fusiform) layer, with cells of different shapes. The motor cortex (area 4) is agranular, with a thick layer V that contains the Betz cells, whereas the sensory cortex (areas 3, 1 and 2) is granular, with a thick layer IV. The white matter below contains myelinated fibres and glial cells. Pyramidal cells are excitatory (glutamate), and the stellate cells are mostly inhibitory interneurons.",
    points: [
      "Six layers: molecular, external granular, external pyramidal, internal granular, internal pyramidal, multiform.",
      "Motor cortex: agranular, thick layer V with Betz cells (giant pyramidal cells).",
      "Sensory cortex: granular, thick layer IV (receives thalamocortical input).",
      "Pyramidal neurons are the principal output neurons.",
      "Alzheimer's disease shows neurofibrillary tangles and amyloid plaques in the cortex.",
    ],
    viva: [
      "How many layers has the neocortex? — Six.",
      "Where are Betz cells found? — In layer V of the primary motor cortex.",
      "Which layer receives thalamic input? — The internal granular layer (IV).",
    ],
    mcq: [
      ["Betz cells are in the:", "Motor cortex layer V", "Sensory cortex layer IV", "Cerebellar cortex", "Spinal cord", "They are giant pyramidal cells of area 4."],
      ["Which layer is thickest in the sensory cortex?", "Layer IV", "Layer I", "Layer V", "Layer VI", "The internal granular layer receives afferents."],
      ["The outermost layer of the cerebral cortex is the:", "Molecular layer", "External granular layer", "Pyramidal layer", "Multiform layer", "Layer I is the molecular layer."],
    ],
  },
}
