import type { Spot } from "./types"

const P = "/spotters/obg/"
const S = "Obstetrics & Gynaecology"
const G = "Instruments" as const

export const OBG_INSTRUMENTS: Spot[] = [
  {
    id: "obg-ovum-forceps", subject: S, group: G, topic: "Forceps", name: "Ovum-holding forceps",
    imgs: [{ f: P + "ovum-forceps.webp" }],
    identify: [
      "Long ratcheted forceps with finger rings",
      "Jaws end in oval, spoon-shaped fenestrated cups with a smooth grooved edge",
      "No catch (no ratchet-like teeth) between the cups",
    ],
    about: "Ovum-holding forceps (sponge-holding forceps with the cups open) are used to remove the products of conception from the uterus.",
    points: [
      "Uses: removing the products of conception in dilatation and evacuation (D&E) and in incomplete abortion.",
      "Removing retained bits of placenta and membranes after delivery.",
      "Differs from sponge-holding forceps: the ovum forceps has a smooth spoon tip with no catch, so it cannot crush the tissue.",
      "Perforation of the uterus is the most serious complication of evacuation.",
    ],
    viva: [
      "How can you differentiate ovum forceps from sponge-holding forceps? — Ovum forceps has fenestrated spoon-shaped cups without a ratchet catch; the sponge-holding forceps has ring tips with a catch.",
    ],
    mcq: [
      ["Which instrument removes retained products of conception?", "Ovum-holding forceps", "Vulsellum", "Uterine sound", "Sims speculum", "Its spoon-shaped cups grasp the products."],
    ],
  },
  {
    id: "obg-sponge-forceps", subject: S, group: G, topic: "Forceps", name: "Sponge-holding forceps (obstetric use)",
    imgs: [{ f: P + "sponge-forceps.webp" }],
    identify: [
      "Long ratcheted forceps with a ring-shaped tip and a catch",
      "Ring tips have grooves (serrations)",
      "Handle with finger rings and a ratchet",
    ],
    about: "Sponge-holding forceps carry a swab or gauze, and can also hold the cervix in some gynaecological operations.",
    points: [
      "Uses: painting and draping with antiseptic, holding a swab to apply pressure, removing membranes in normal delivery and repair of cervical tears.",
      "Used to hold the anterior lip of the cervix in place of Allis forceps.",
      "Do not confuse with ovum forceps: ring-shaped tip with a catch.",
    ],
    viva: [
      "Name one use in obstetrics. — Holding the edges of a cervical tear for repair.",
    ],
    mcq: [
      ["Which instrument is used to hold the anterior lip of the cervix besides a vulsellum?", "Sponge-holding forceps", "Needle holder", "Ovum forceps", "Hegar dilator", "It is used when no vulsellum is available."],
    ],
  },
  {
    id: "obg-green-armytage", subject: S, group: G, topic: "Forceps", name: "Green-Armytage forceps",
    imgs: [{ f: P + "green-armytage.webp" }],
    identify: [
      "Long ratcheted forceps with a screw joint",
      "Tips have a pair of small teeth that hold the tissue",
      "Similar in size to long Allis forceps",
    ],
    about: "Green-Armytage forceps hold the cut margins of the uterine incision during a caesarean section and control bleeding.",
    points: [
      "Use: in caesarean section to hold and compress the edges of the uterine wound.",
      "Largely replaced by Allis forceps, which are now used for the same purpose.",
      "A screw joint is the distinguishing feature from Allis forceps (a box joint).",
    ],
    viva: [
      "What is the key use? — Holding the cut margins of the uterus at caesarean section.",
    ],
    mcq: [
      ["Instrument used to hold the uterine edges in a caesarean section:", "Green-Armytage forceps", "Ovum forceps", "Kocher's forceps", "Sims speculum", "It clamps the margins and reduces bleeding."],
    ],
  },
  {
    id: "obg-vulsellum", subject: S, group: G, topic: "Forceps", name: "Vulsellum (single-tooth and multiple-teeth)", labelled: true,
    imgs: [{ f: P + "vulsellum.webp" }],
    identify: [
      "Long ratcheted forceps with finger rings",
      "Single-tooth vulsellum: one sharp tooth on one blade fitting into the other",
      "Multiple-teeth vulsellum: two or more sharp teeth on each tip, resembling a long Allis forceps",
    ],
    about: "Vulsellum forceps hold the cervix, especially during intrauterine procedures. Single-tooth is the commonest in practice.",
    points: [
      "Uses: holding the anterior lip of the cervix in D&C, IUCD insertion, hysterosalpingography and cervical biopsy.",
      "Multiple-teeth vulsellum is used to hold the fundus of the uterus and apply traction in total abdominal hysterectomy.",
      "Single-tooth vulsellum: holding the cervix and giving traction in hysterectomy and the cervical stump after amputation.",
      "Tenaculum is the alternative; its grip leaves a smaller wound.",
    ],
    viva: [
      "Where do you apply the vulsellum on the cervix? — On the anterior lip at 12 o'clock.",
    ],
    mcq: [
      ["The cervix is held for IUCD insertion with a:", "Single-tooth vulsellum", "Sims speculum", "Hegar dilator", "Karman cannula", "It grips the anterior lip of the cervix."],
    ],
  },
  {
    id: "obg-episiotomy-scissors", subject: S, group: G, topic: "Scissors", name: "Episiotomy scissors",
    imgs: [{ f: P + "episiotomy-scissors.webp" }],
    identify: [
      "Strong angled scissors with a bent shaft",
      "One blade has a blunt end that is inserted into the vagina",
      "Blades are heavy and curved on the flat",
    ],
    about: "Episiotomy scissors cut the perineum in the second stage of labour. They are angled so that the blade can be placed behind the vaginal mucosa without injury to the baby's head.",
    points: [
      "Uses: episiotomy (mediolateral is commonest) and cutting the umbilical cord.",
      "Mediolateral incision begins at the fourchette at 45 degrees and is cut at the height of a contraction.",
      "Midline episiotomy heals better but extends more easily to the anal sphincter (third and fourth degree tears).",
      "Done under local infiltration (lignocaine) and repaired with a continuous absorbable suture.",
    ],
    viva: [
      "Which muscles are cut in a mediolateral episiotomy? — Bulbospongiosus, superficial transverse perineal and part of levator ani.",
    ],
    mcq: [
      ["The commonest type of episiotomy practised in India is:", "Mediolateral", "Midline", "J-shaped", "Lateral", "It has less risk of rectal extension."],
    ],
  },
  {
    id: "obg-sims-speculum", subject: S, group: G, topic: "Specula", name: "Sims' posterior vaginal speculum",
    imgs: [{ f: P + "sims-speculum.webp" }],
    identify: [
      "Double-ended, non-self-retaining speculum with two blades of different sizes",
      "Each blade has a groove for drainage of fluid",
      "Held by an assistant while the patient is in the left lateral (Sims) position",
    ],
    about: "Sims' speculum retracts the posterior vaginal wall, giving a clear view of the cervix and vagina. It is used with an anterior vaginal wall retractor.",
    points: [
      "Uses: D&C, anterior colporrhaphy, cervical cerclage, vaginal hysterectomy, inspecting amniotic fluid in suspected PROM, examining cystocele or vesico-vaginal fistula.",
      "Examining the cervix in the left lateral (Sims') position: narrow blade for nulliparae and wide blade for multiparae.",
      "Disadvantages: needs an assistant and it is non-self-retaining.",
    ],
    viva: [
      "What position is used with Sims speculum? — Left lateral (Sims') position.",
      "Why is there a groove? — For drainage of blood and fluids.",
    ],
    mcq: [
      ["Sims' speculum is:", "Non-self-retaining, used with an assistant", "Self-retaining bivalve", "An anterior retractor only", "A dilator", "It needs to be held in position."],
    ],
  },
  {
    id: "obg-cusco-speculum", subject: S, group: G, topic: "Specula", name: "Cusco's bivalve speculum",
    imgs: [{ f: P + "cusco-speculum.webp" }],
    identify: [
      "Bivalve metal speculum with two blades that open like a duck-bill",
      "Self-retaining with a screw that fixes the opening",
      "Handle with a ratchet and a locking screw",
    ],
    about: "Cusco's speculum is a self-retaining speculum used for routine per speculum examination. It displays the cervix and the vaginal fornices.",
    points: [
      "Uses: per speculum examination, Pap smear, IUCD insertion, endometrial biopsy and cervical culture.",
      "Anterior and posterior vaginal walls are retracted, so they cannot be seen (unlike with Sims').",
      "Not used in vaginal operations because the space is limited.",
      "Lubricate with warm water or gel (not for Pap smear because it may interfere with cytology).",
    ],
    viva: [
      "Why is lubricating jelly avoided for a Pap smear? — It may obscure cells and affect cytology.",
    ],
    mcq: [
      ["A Pap smear is taken using:", "Cusco's speculum", "Sims' speculum", "Auvard's retractor", "Proctoscope", "It displays the cervix and is self-retaining."],
    ],
  },
  {
    id: "obg-uterine-sound", subject: S, group: G, topic: "Dilators and curettes", name: "Uterine sound",
    imgs: [{ f: P + "uterine-sound.webp" }],
    identify: [
      "Long, thin, malleable metal rod with a blunt round (olive) tip",
      "Marked with graduations in centimetres",
      "Slightly curved with a flattened handle",
    ],
    about: "The uterine sound measures the length of the uterine cavity and detects a uterine anomaly or perforation. Normal length is about 6 to 8 cm.",
    points: [
      "Uses: measuring uterine depth before IUCD insertion, finding the direction of the cavity before dilatation and curettage, and detecting a bicornuate uterus.",
      "Contraindicated in pregnancy and uterine infection.",
      "Perforation is the commonest complication; use gentle force and a pinch grip.",
      "Normal length of the uterine cavity: 6 to 8 cm (2.5 to 3 inches).",
    ],
    viva: [
      "Normal length of the uterine cavity? — 6 to 8 cm.",
    ],
    mcq: [
      ["Uterine sounding is contraindicated in:", "Pregnancy", "Before IUCD insertion", "Before D&C", "Suspected uterine anomalies", "It may cause abortion or infection."],
    ],
  },
  {
    id: "obg-cervical-dilator", subject: S, group: G, topic: "Dilators and curettes", name: "Cervical dilators (Hawkin-Ambler and Das')", labelled: true,
    imgs: [{ f: P + "cervical-dilator.webp" }],
    identify: [
      "Metal rods with a curved shaft and a blunt tip of graduated width",
      "Hawkin-Ambler: single-ended with a handle and a bent tip",
      "Das' dilator: double-ended with different sizes at each end",
    ],
    about: "Cervical dilators gradually widen the cervical canal before intrauterine procedures. Hegar's dilator is the commonest and is double-ended and straight.",
    points: [
      "Uses: dilatation before D&C, suction evacuation, hysteroscopy and MTP.",
      "Hegar's dilators come in sizes 3 to 26 mm (a set of 12 dilators).",
      "Dilate gradually in ascending order, holding the dilator like a pen.",
      "Complications: perforation, cervical injury and false passage.",
    ],
    viva: [
      "Maximum dilatation usually done in a nulliparous woman? — Up to 10 to 12 mm (Hegar 10-12).",
    ],
    mcq: [
      ["Dilators are numbered in:", "Millimetres of diameter", "French gauge", "Inches", "Gauge of needle", "Hegar numbers correspond to the diameter in mm."],
    ],
  },
  {
    id: "obg-uterine-curette", subject: S, group: G, topic: "Dilators and curettes", name: "Uterine curettes (sharp, blunt and flushing)", labelled: true,
    imgs: [{ f: P + "uterine-curette.webp" }],
    identify: [
      "Long handle with a spoon-shaped loop at the working end",
      "Sharp curette has a sharp edge; blunt curette has a smooth edge",
      "Sharman's curette is a flushing curette for endometrial sampling",
    ],
    about: "A curette scrapes the endometrium for diagnosis (D&C) or removes retained products. The sharp curette is for gynaecology and the blunt curette for obstetric uses.",
    points: [
      "Sharp curette: dilatation and curettage in gynaecology (diagnostic), such as abnormal uterine bleeding.",
      "Blunt curette: evacuation after incomplete abortion to reduce the risk of perforation.",
      "Endometrial curettage is done in the pre-menstrual phase to prove ovulation.",
      "Complications: perforation, Asherman's syndrome (intrauterine adhesions) and infection.",
    ],
    viva: [
      "Which curette is used in obstetric cases? — Blunt curette.",
      "What is Asherman's syndrome? — Intrauterine adhesions after curettage, causing amenorrhoea.",
    ],
    mcq: [
      ["Asherman's syndrome follows:", "Overvigorous curettage", "Oral contraceptives", "Pelvic TB only", "Hysterosalpingography", "Scraping the basal layer causes adhesions."],
    ],
  },
  {
    id: "obg-karman-cannula", subject: S, group: G, topic: "Dilators and curettes", name: "Karman's cannula (suction cannula)",
    imgs: [{ f: P + "karman-cannula.webp" }],
    identify: [
      "Flexible or rigid plastic tube with a blunt end and two side openings",
      "Wide flange at the other end for attachment to a syringe",
      "Different sizes with colour-coded bases (4, 6, 8, 10 and 12 mm)",
    ],
    about: "The Karman's cannula is attached to a 60 mL syringe or machine vacuum aspirator for manual vacuum aspiration (MVA) of the uterine contents.",
    points: [
      "Uses: evacuation of incomplete abortion, MTP up to 12 weeks, endometrial aspiration.",
      "Sizes in mm correspond to weeks of gestation.",
      "Safer than sharp curettage with a lower risk of perforation.",
    ],
    viva: [
      "Up to what gestation is MVA used? — Up to 12 weeks (MTP Act and WHO).",
    ],
    mcq: [
      ["Manual vacuum aspiration uses:", "Karman's cannula and syringe", "Sims speculum", "Ovum forceps only", "Hegar dilator only", "The cannula attaches to the aspirator."],
    ],
  },
  {
    id: "obg-myoma-screw", subject: S, group: G, topic: "Gynaecological surgery", name: "Myoma screw",
    imgs: [{ f: P + "myoma-screw.webp" }],
    identify: [
      "Handle ring on one end and a corkscrew (spiral) tip on the other",
      "Looks like a corkscrew",
      "Metallic, with a loop handle",
    ],
    about: "The myoma screw is screwed into a fibroid to provide traction during myomectomy, so that the fibroid can be pulled out of its bed.",
    points: [
      "Uses: myomectomy to apply traction on the fibroid and deliver it.",
      "Also used in vaginal hysterectomy for gripping a large uterus.",
      "Blood loss is reduced by tourniquet, vasopressin injection or uterine artery ligation.",
    ],
    viva: [
      "What is the use of the myoma screw? — To grip and give traction on a fibroid during myomectomy.",
    ],
    mcq: [
      ["Traction on a fibroid during myomectomy is applied with a:", "Myoma screw", "Cusco's speculum", "Karman's cannula", "Ovum forceps", "Its spiral tip grips the fibroid."],
    ],
  },
  {
    id: "obg-doyen-retractor", subject: S, group: G, topic: "Retractors", name: "Doyen's retractor",
    imgs: [{ f: P + "doyen-retractor.webp" }],
    identify: [
      "Heavy metal retractor with a broad flat blade, bent at a right angle",
      "Blade is rectangular and smooth, with a handle",
      "Also called a bladder retractor",
    ],
    about: "Doyen's retractor retracts the bladder and the lower abdominal wall in caesarean section and in gynaecological operations.",
    points: [
      "Uses: retracting the bladder in caesarean section, the anterior abdominal wall in pelvic surgery and exposing the lower uterine segment.",
      "Deaver's retractor (long curved) is used for bowel and liver retraction.",
      "Always used with a wet abdominal mop.",
    ],
    viva: [
      "Which retractor holds the bladder down in caesarean section? — Doyen's (bladder) retractor.",
    ],
    mcq: [
      ["Doyen's retractor is used to:", "Retract the bladder", "Cut the cervix", "Hold the cord", "Dilate the cervix", "It exposes the lower uterine segment."],
    ],
  },
  {
    id: "obg-iud", subject: S, group: G, topic: "Contraception", name: "Intrauterine contraceptive device (Cu IUCD)",
    imgs: [{ f: P + "iud.webp" }],
    identify: [
      "Small T-shaped plastic device with copper wire wound around the vertical stem",
      "Thread (tail) attached at the end",
      "Supplied in a sterile pack with an inserter tube and plunger",
    ],
    about: "The copper IUCD (Cu T 375 or Cu T 380A) is a long-acting reversible contraceptive. Copper ions are toxic to sperm and the endometrium becomes unfavourable for implantation.",
    points: [
      "Cu T 380A is effective for 10 years; Cu T 375 for 5 years (as marked on the pack, and per the national programme).",
      "Insertion: during menses, post-partum (within 48 hours) or post-abortion, using the withdrawal technique.",
      "Side effects: increased menstrual bleeding, cramps, expulsion, PID and perforation.",
      "Also the most effective emergency contraception if inserted within 5 days of unprotected intercourse.",
      "Lost threads: check by USG or X-ray to exclude perforation.",
    ],
    viva: [
      "Mechanism of action? — Copper creates a sterile inflammatory response toxic to sperm and ova.",
      "Contraindication? — Pelvic infection, suspected pregnancy and distorted uterine cavity.",
    ],
    mcq: [
      ["Copper T 380A is effective for:", "10 years", "3 years", "5 years only", "1 year", "Cu T 380A is approved for 10 years."],
      ["IUCD is the best emergency contraceptive when inserted within:", "5 days", "24 hours", "48 hours", "7 days", "Cu T can be inserted up to 5 days after unprotected sex."],
    ],
  },
  {
    id: "obg-iud-inserter", subject: S, group: G, topic: "Contraception", name: "IUCD inserter",
    imgs: [{ f: P + "iud-inserter.webp" }],
    identify: [
      "Thin plastic or metal rod with a flange or handle",
      "Used to introduce and push an older-generation IUCD into the uterus",
      "Often lies with a Lippes loop or a Cu device",
    ],
    about: "An inserter is a rod used to introduce the IUCD inside the uterine cavity. The Lippes loop was inserted with this type of inserter.",
    points: [
      "Lippes loop is a non-medicated, double-S shaped plastic device, now largely replaced by copper devices.",
      "A uterine sound should be passed before insertion to find the depth and direction.",
      "The device is placed at the fundus with the vertical arm in the cavity.",
    ],
    viva: [
      "What is a Lippes loop? — An older double-S shaped inert plastic IUCD with a thread.",
    ],
    mcq: [
      ["Before inserting an IUCD, the uterine length is measured with a:", "Uterine sound", "Vulsellum", "Sims speculum", "Hegar dilator", "It confirms depth and direction of the cavity."],
    ],
  },
  {
    id: "obg-punch-biopsy", subject: S, group: G, topic: "Gynaecological surgery", name: "Cervical punch biopsy forceps",
    imgs: [{ f: P + "punch-biopsy.webp" }],
    identify: [
      "Long forceps with finger rings and angled shaft",
      "Cup-shaped sharp jaws at the end that cut a bite of tissue",
      "Fine, with one jaw fixed and the other movable",
    ],
    about: "A punch biopsy forceps takes a small piece of cervical tissue for histopathology, usually under colposcopic vision.",
    points: [
      "Uses: cervical biopsy for abnormal Pap smear, suspected cervical intraepithelial neoplasia or carcinoma.",
      "Colposcopy with acetic acid identifies acetowhite areas for biopsy; Schiller's test uses Lugol's iodine.",
      "Cone biopsy or LEEP is done for CIN lesions.",
    ],
    viva: [
      "What is Schiller's test? — Application of Lugol's iodine: normal cervix stains brown, abnormal areas do not.",
    ],
    mcq: [
      ["The best screening test for carcinoma of the cervix is:", "Pap smear (cytology) or HPV testing", "Colposcopy", "Cone biopsy", "Hysteroscopy", "Screening detects pre-malignant changes."],
    ],
  },
  {
    id: "obg-obstetric-forceps", subject: S, group: G, topic: "Obstetric operations", name: "Obstetric forceps (Das' long curved forceps)",
    imgs: [{ f: P + "obstetric-forceps-long.webp" }, { f: P + "obstetric-forceps.webp" }],
    identify: [
      "Two separate blades (right and left) with a shank, lock and handle",
      "Each blade has a cephalic curve (to grip the fetal head) and a pelvic curve (to fit the birth canal)",
      "English lock where the blades cross",
    ],
    about: "Obstetric forceps are applied to the fetal head in the second stage of labour to assist delivery. The blades are applied to the sides of the head with the left blade first.",
    points: [
      "Indications: prolonged second stage, maternal exhaustion, fetal distress and after-coming head of breech.",
      "Prerequisites: fully dilated cervix, ruptured membranes, engaged head, no cephalopelvic disproportion, empty bladder and adequate analgesia.",
      "Types: outlet, low, mid and high (high forceps are obsolete).",
      "Complications: maternal vaginal and cervical tears, PPH and fetal facial palsy or cephalhaematoma.",
      "Left blade is applied first, then the right (locks correctly).",
    ],
    viva: [
      "Which blade is applied first? — The left blade.",
      "Name the curves of the forceps. — Cephalic curve and pelvic curve.",
    ],
    mcq: [
      ["The first blade to be applied in forceps delivery is:", "Left blade", "Right blade", "Either", "Both together", "The left blade is placed first so the blades lock."],
      ["A prerequisite for forceps delivery is:", "Fully dilated cervix", "Closed membranes", "High head", "Full bladder", "The cervix must be fully dilated."],
    ],
  },
  {
    id: "obg-cord-clamp", subject: S, group: G, topic: "Obstetrics", name: "Umbilical cord clamp (plastic)",
    imgs: [{ f: P + "cord-clamp.webp" }],
    identify: [
      "Blue disposable plastic clamp with a locking snap",
      "Serrated inner surface to grip the cord",
      "Supplied sterile in a pack",
    ],
    about: "A cord clamp occludes the umbilical cord after birth. The cord is cut between two clamps, or between the clamp and the baby's side.",
    points: [
      "Delayed cord clamping (1 to 3 minutes) is recommended unless the baby needs resuscitation.",
      "The clamp is applied about 2 to 3 cm from the umbilicus.",
      "The cord contains two arteries and one vein; check the vessels after birth.",
      "Collect cord blood for blood grouping, Rh status and cord blood gas as needed.",
    ],
    viva: [
      "How long is delayed cord clamping? — At least 1 minute (up to 3 minutes) after birth.",
    ],
    mcq: [
      ["WHO recommends cord clamping:", "1 to 3 minutes after birth", "Immediately", "After the placenta is delivered", "After 10 minutes", "Delayed clamping improves neonatal iron stores."],
    ],
  },
]
