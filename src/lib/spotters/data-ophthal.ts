import type { Spot } from "./types"

const P = "/spotters/ophthal/"
const S = "Ophthalmology"
const G = "Instruments" as const

export const OPHTHAL: Spot[] = [
  {
    id: "oph-ac-cannula", subject: S, group: G, topic: "Cataract surgery", name: "Anterior chamber (AC) cannula", labelled: true,
    imgs: [{ f: P + "ac-cannula.webp" }],
    identify: [
      "Small metal Luer-hub cannula with a short fine, slightly curved tip",
      "Attaches to a syringe",
      "Blunt tip for safe entry through the side port",
    ],
    about: "The AC cannula is a thin hollow needle used to inject fluid, viscoelastic or air into the anterior chamber, and to wash out blood or cortical remnants.",
    points: [
      "Uses: forming the anterior chamber, injecting viscoelastic (OVD) during cataract surgery, injecting intracameral antibiotics (cefuroxime or moxifloxacin), hydro-dissection and hydro-delineation of the lens.",
      "Used to inject air to tamponade a Descemet's detachment.",
      "Used through a paracentesis (side port) incision.",
    ],
    viva: [
      "What is viscoelastic used for? — To maintain the anterior chamber and protect the corneal endothelium.",
      "Why use intracameral antibiotics? — To prevent post-operative endophthalmitis.",
    ],
    mcq: [
      ["An AC cannula is used to:", "Inject fluids or viscoelastic into the anterior chamber", "Cut the cornea", "Dilate the lacrimal punctum", "Hold the globe", "It irrigates or fills the anterior chamber through a side port."],
      ["Which measure best reduces the risk of post-cataract endophthalmitis?", "Povidone-iodine 5% and intracameral antibiotic", "Topical steroid only", "Patching only", "Systemic steroid", "Povidone-iodine and intracameral cefuroxime reduce risk."],
    ],
  },
  {
    id: "oph-keratome", subject: S, group: G, topic: "Cataract surgery", name: "Keratome (pointed tip)", labelled: true,
    imgs: [{ f: P + "keratome.webp" }],
    identify: [
      "Handle with a small flat triangular blade with a pointed tip set at the end",
      "Angled blade with both edges sharp",
      "Used to enter the anterior chamber",
    ],
    about: "A keratome is a short angled knife used to create a corneal or clear corneal tunnel incision, such as in phacoemulsification.",
    points: [
      "Uses: making the main corneal incision (2.2 to 3.2 mm) and the side-port incision in small incision cataract surgery.",
      "Slit knife and crescent knife create the tunnel; the keratome enters the anterior chamber.",
      "Pointed tip enters the chamber at the end of the tunnel.",
    ],
    viva: [
      "What incision size is used for phacoemulsification? — About 2.2 to 3 mm clear corneal tunnel.",
    ],
    mcq: [
      ["The instrument used for entering the anterior chamber after the corneal tunnel is made:", "Keratome", "Chalazion scoop", "Wire speculum", "Bowman's probe", "The keratome makes the internal entry."],
    ],
  },
  {
    id: "oph-lid-retractor", subject: S, group: G, topic: "Lids and orbit", name: "Desmarres' lid retractor", labelled: true,
    imgs: [{ f: P + "lid-retractor.webp" }],
    identify: [
      "Long handle with a flat curved blade bent at right angles at the end",
      "Used to evert the eyelid",
      "Blade is angled and smooth",
    ],
    about: "The Desmarres retractor is used to retract and evert the upper or lower eyelid to expose the conjunctival surface.",
    points: [
      "Uses: eversion of lids for removal of a foreign body from the upper tarsal conjunctiva, chalazion surgery, ptosis and entropion repair, and examination of the fornices.",
      "Double eversion of the upper lid is used in suspected foreign bodies in the superior fornix.",
    ],
    viva: [
      "Where do corneal foreign bodies usually hide? — Upper tarsal conjunctiva, in vertical linear corneal abrasions.",
    ],
    mcq: [
      ["Which instrument is used to evert the lid?", "Desmarres retractor", "Castroviejo scissors", "Slit lamp", "Fixation forceps", "It retracts and everts the lids."],
    ],
  },
  {
    id: "oph-thermal-cautery", subject: S, group: G, topic: "Cataract surgery", name: "Thermal (heat) cautery", labelled: true,
    imgs: [{ f: P + "thermal-cautery-a.webp" }, { f: P + "thermal-cautery-b.webp" }],
    identify: [
      "Long flat metal handle with a bent tip carrying a small bead (ball)",
      "Tip heats by an electric current or on a flame",
      "Brown or wooden bead at the end of the working portion",
    ],
    about: "Heat cautery is used to cauterise bleeding points on the sclera and conjunctiva and to make coagulation of tissues in the eye.",
    points: [
      "Uses: haemostasis in the scleral bed, treating corneal ulcers (cauterisation of the ulcer base), cauterising the lacrimal sac in dacryocystectomy and treatment of ptosis or trichiasis in some settings.",
      "Deep cauterisation can be used for a fistulising bleb or perforation.",
      "Wet-field cautery is the modern bipolar alternative.",
    ],
    viva: [
      "Name one use in corneal pathology. — Cauterisation of an indolent or fungal corneal ulcer.",
    ],
    mcq: [
      ["Heat cautery in ophthalmology is used for:", "Haemostasis of scleral vessels", "Lens extraction", "Lid eversion", "Probing the nasolacrimal duct", "It coagulates bleeding vessels."],
    ],
  },
  {
    id: "oph-microsurgery-set", subject: S, group: G, topic: "Microsurgery", name: "Vannas scissors, Castroviejo corneal scissors and needle-holding forceps", labelled: true,
    imgs: [{ f: P + "scissors-a.webp" }, { f: P + "scissors-b.webp" }],
    identify: [
      "Vannas scissors: very small spring scissors with delicate straight blades",
      "Castroviejo corneal scissors: spring handle with curved blades",
      "Needle-holding forceps: slender locking holder for fine sutures",
    ],
    about: "These are micro-surgical instruments used in intra-ocular surgery for precise cutting and suturing.",
    points: [
      "Vannas scissors: cut the iris, capsule, fine membranes and perform peripheral iridectomy.",
      "Castroviejo corneal scissors: cut corneal tissue in keratoplasty and widen incisions.",
      "Needle-holding forceps (Castroviejo): hold 10-0 nylon sutures in corneal and scleral closure.",
      "Spring-handle instruments give fine control and are autoclaved with care.",
    ],
    viva: [
      "Which suture is used to close a corneal tunnel or graft? — 10-0 monofilament nylon.",
    ],
    mcq: [
      ["Iridectomy scissors with delicate spring action are:", "Vannas", "Mayo", "Metzenbaum", "Episiotomy scissors", "Vannas scissors are fine micro-scissors."],
    ],
  },
  {
    id: "oph-slide-calipers", subject: S, group: G, topic: "Measurements", name: "Slide calipers", labelled: true,
    imgs: [{ f: P + "slide-calipers.webp" }],
    identify: [
      "Metal measuring instrument with two arms that slide on a graduated millimetre scale",
      "Fixed jaw on one side and moving arm with a screw lock",
      "Quarter-circle scale",
    ],
    about: "Slide calipers are used to measure distances, such as the corneal diameter (white-to-white) and the width of a lid or tumour in millimetres.",
    points: [
      "Uses: measurement of the horizontal corneal diameter (normal 11.7 mm), size of a lesion and the distance between the two pupils or canthi.",
      "Used for checking the diameter of intraocular lenses and planning contact lenses.",
    ],
    viva: [
      "Normal horizontal corneal diameter in adults? — About 11.7 mm.",
    ],
    mcq: [
      ["Normal horizontal corneal diameter is:", "11.7 mm", "9.0 mm", "15 mm", "20 mm", "The cornea is about 11.7 mm horizontally and 11 mm vertically."],
    ],
  },
  {
    id: "oph-bowman-probe", subject: S, group: G, topic: "Lacrimal system", name: "Bowman's probe", labelled: true,
    imgs: [{ f: P + "bowman-probe.webp" }],
    identify: [
      "Long thin malleable silver wire with a slightly broader flattened or tapered centre",
      "Various sizes numbered 0 to 6",
      "Blunt, smooth ends",
    ],
    about: "Bowman's probes are used for probing the lacrimal drainage system, especially in congenital nasolacrimal duct obstruction.",
    points: [
      "Uses: diagnostic and therapeutic probing of the nasolacrimal duct, treating canalicular stenosis and probing to confirm the patency after syringing.",
      "Congenital NLD obstruction is treated by massage until 12 months, then probing, and then DCR or intubation in resistant cases.",
      "Pass through the upper or lower punctum, then horizontally through the canaliculus to the sac, then turn vertically down into the duct.",
    ],
    viva: [
      "At what age is probing usually done for congenital NLD block? — After 6 to 12 months of failed conservative treatment.",
      "Which valve is at the lower end of the nasolacrimal duct? — Valve of Hasner.",
    ],
    mcq: [
      ["Congenital nasolacrimal duct obstruction is caused by:", "Non-canalisation of the valve of Hasner", "Absent lacrimal gland", "Block at the punctum", "Dacryolith", "Persistent membrane at the lower end of the duct."],
    ],
  },
  {
    id: "oph-bp-holder", subject: S, group: G, topic: "General", name: "Bard-Parker blade holder", labelled: true,
    imgs: [{ f: P + "bp-holder.webp" }],
    identify: [
      "Short metal handle with a slotted tip for a replaceable blade",
      "Flat ridged grip",
      "Blade is fitted at the end",
    ],
    about: "The Bard-Parker handle is a scalpel holder that carries a detachable blade such as number 11 or 15.",
    points: [
      "BP handle No. 3 holds blades 10, 11, 12 and 15; handle No. 4 holds larger blades 20 to 24.",
      "Uses: skin incisions, conjunctival peritomy, chalazion incision and lid margin procedures.",
      "Blade is loaded and removed with a needle holder or artery forceps.",
    ],
    viva: [
      "Which blade is used for stab incisions? — Number 11.",
    ],
    mcq: [
      ["BP handle No. 3 takes blades numbered:", "10, 11, 12, 15", "20 to 24", "30 to 40", "5 to 7", "No. 3 fits small blades."],
    ],
  },
  {
    id: "oph-chalazion-scoop", subject: S, group: G, topic: "Lids and orbit", name: "Chalazion scoop (curette)", labelled: true,
    imgs: [{ f: P + "chalazion-scoop.webp" }],
    identify: [
      "Handle with a small round cup (spoon) at the end",
      "Bowl has sharp edges",
      "Used for scraping a cyst cavity",
    ],
    about: "The chalazion scoop is a small curette that removes the lipogranulomatous contents of a chalazion through a conjunctival incision.",
    points: [
      "Chalazion is a chronic granulomatous inflammation of a meibomian gland and presents as a painless lid swelling.",
      "Treatment: incision and curettage with a chalazion clamp, usually through the conjunctival route with a vertical incision.",
      "Recurrent chalazion in the elderly should be sent for histopathology to exclude sebaceous gland carcinoma.",
    ],
    viva: [
      "What is the incision for a chalazion? — A vertical incision on the conjunctival side to avoid cutting other meibomian glands.",
    ],
    mcq: [
      ["Recurrent chalazion in an elderly patient should raise suspicion of:", "Sebaceous gland carcinoma", "Basal cell carcinoma", "Stye", "Xanthelasma", "It must be biopsied."],
    ],
  },
  {
    id: "oph-wire-speculum", subject: S, group: G, topic: "General", name: "Wire speculum (Barraquer)", labelled: true,
    imgs: [{ f: P + "wire-speculum.webp" }],
    identify: [
      "Light spring wire frame with two U-shaped blades",
      "Holds the eyelids open without much pressure on the globe",
      "Placed between the upper and lower lids",
    ],
    about: "The wire lid speculum keeps the lids apart during ocular surgery. Its light design reduces pressure on the eyeball.",
    points: [
      "Uses: cataract surgery, glaucoma and corneal surgery and examining children or uncooperative patients.",
      "Solid-blade speculums can increase intra-ocular pressure and are avoided in open globe injuries.",
    ],
    viva: [
      "Why avoid pressure on the globe during open globe repair? — It can extrude intra-ocular contents.",
    ],
    mcq: [
      ["The instrument that holds the lids apart during surgery is:", "Lid speculum", "Lid retractor", "Fixation forceps", "Keratome", "It keeps the palpebral aperture open."],
    ],
  },
  {
    id: "oph-evisceration-scoop", subject: S, group: G, topic: "Lids and orbit", name: "Evisceration scoop", labelled: true,
    imgs: [{ f: P + "evisceration-scoop.webp" }],
    identify: [
      "Long handle with a broad flat or slightly curved spoon-like spatula end",
      "Used to separate the uveal tissue from the sclera",
      "Blunt tip",
    ],
    about: "An evisceration scoop is used to remove the contents of the globe, leaving the sclera and extra-ocular muscles in place.",
    points: [
      "Evisceration is indicated in endophthalmitis or panophthalmitis unresponsive to treatment and in a painful blind eye.",
      "In suspected intra-ocular tumour enucleation is preferred; evisceration is avoided.",
      "Sympathetic ophthalmitis risk exists with penetrating injury and is an indication for early enucleation of a severely damaged eye.",
      "An orbital implant is placed after evisceration or enucleation.",
    ],
    viva: [
      "Difference between evisceration and enucleation? — Evisceration removes the contents leaving the sclera; enucleation removes the whole globe.",
    ],
    mcq: [
      ["Evisceration is contraindicated in:", "Intra-ocular tumour", "Panophthalmitis", "Painful blind eye", "Expulsive haemorrhage", "A suspected tumour must be removed intact by enucleation."],
    ],
  },
  {
    id: "oph-iol-dilator", subject: S, group: G, topic: "Cataract surgery", name: "IOL dilator and iris repositor", labelled: true,
    imgs: [{ f: P + "iol-dilator.webp" }],
    identify: [
      "Two fine rods with different tips on a long handle",
      "Bent-up end and flat end",
      "Used inside the eye to manipulate tissues",
    ],
    about: "These instruments are used to manipulate the intra-ocular lens (IOL) haptics and to reposition the iris during cataract surgery.",
    points: [
      "IOL dilator (bent-up end) helps place or rotate the lens in the capsular bag.",
      "Iris repositor (flat) sweeps the iris back into place after prolapse.",
      "Modern IOLs are foldable and implanted through an injector.",
    ],
    viva: [
      "Where is the IOL placed in cataract surgery? — In the capsular bag (posterior chamber).",
    ],
    mcq: [
      ["An iris repositor is used to:", "Replace a prolapsed iris", "Cut the cornea", "Dilate the punctum", "Measure the cornea", "It reposition iris tissue."],
    ],
  },
  {
    id: "oph-crescent-knife", subject: S, group: G, topic: "Cataract surgery", name: "Crescent knife (scleral splitter)", labelled: true,
    imgs: [{ f: P + "crescent-knife.webp" }],
    identify: [
      "Handle with a curved crescent-shaped flat blade at the tip",
      "Blade is sharp only on the curved edge",
      "Used to dissect lamellar planes",
    ],
    about: "The crescent knife is used to dissect a tunnel in the sclera or cornea in manual small-incision cataract surgery.",
    points: [
      "Scleral tunnel is made with the crescent knife; entry into the anterior chamber is with the keratome.",
      "A self-sealing tunnel prevents leakage and reduces astigmatism.",
    ],
    viva: [
      "Which instrument enters the anterior chamber after the crescent knife? — Keratome.",
    ],
    mcq: [
      ["A scleral tunnel is dissected with a:", "Crescent knife", "Chalazion scoop", "Bowman's probe", "Lid retractor", "It creates a lamellar tunnel."],
    ],
  },
  {
    id: "oph-punctum-dilator", subject: S, group: G, topic: "Lacrimal system", name: "Punctum dilator", labelled: true,
    imgs: [{ f: P + "punctum-dilator.webp" }],
    identify: [
      "Slender pointed conical probe on a handle",
      "Tip is tapered like a cone",
      "Used before probing and syringing",
    ],
    about: "The punctum dilator is a small tapered probe used to enlarge the lacrimal punctum before syringing or probing.",
    points: [
      "Uses: dilating the punctum in punctal stenosis, before syringing for DCR assessment, and before passing a probe for nasolacrimal duct obstruction.",
      "Regurgitation of fluid through the opposite punctum on syringing indicates NLD obstruction.",
      "Regurgitation of fluid through the same punctum indicates canalicular obstruction.",
    ],
    viva: [
      "What does regurgitation from the other punctum on syringing suggest? — Nasolacrimal duct obstruction.",
    ],
    mcq: [
      ["Syringing with fluid coming out of the opposite punctum indicates:", "Nasolacrimal duct block", "Canalicular block", "Normal drainage", "Punctal agenesis", "The fluid reaches the common canaliculus and refluxes."],
    ],
  },
  {
    id: "oph-fixation-forceps", subject: S, group: G, topic: "General", name: "Fixation forceps, St Martin's forceps and suture-tying forceps", labelled: true,
    imgs: [{ f: P + "fixation-forceps.webp" }],
    identify: [
      "Fixation forceps: forceps with fine teeth and a stop for holding the conjunctiva and episclera",
      "St Martin's forceps: fine toothed forceps (1x2 teeth) for the cornea and sclera",
      "Suture-tying forceps: smooth fine platform tips for knotting",
    ],
    about: "These fine forceps are used in intra-ocular surgery for holding the eyeball, tissues and sutures.",
    points: [
      "Fixation forceps stabilise the globe during surgery.",
      "St Martin's 1x2 toothed forceps grip the corneal edge during suturing.",
      "Suture-tying forceps are used to tie 10-0 sutures.",
    ],
    viva: [
      "Why use toothed forceps on the cornea? — To grip the tissue without slipping while avoiding crush damage.",
    ],
    mcq: [
      ["Which forceps hold the eyeball steady during surgery?", "Fixation forceps", "Suture tying forceps", "Needle holder", "Artery forceps", "They grasp the episclera."],
    ],
  },
  {
    id: "oph-ia-cannula", subject: S, group: G, topic: "Cataract surgery", name: "Irrigation-aspiration cannula", labelled: true,
    imgs: [{ f: P + "ia-cannula.webp" }],
    identify: [
      "Thin, flexible tubing connected to a silicone or metal tip",
      "Two channels: irrigation and aspiration",
      "Tip has a small port for cortex",
    ],
    about: "The I/A cannula removes residual cortical lens matter after nucleus removal in cataract surgery, while maintaining the anterior chamber with irrigating fluid.",
    points: [
      "Uses: aspiration of cortical remnants and removal of viscoelastic at the end.",
      "Posterior capsule opacification can follow cataract surgery and is treated by Nd:YAG capsulotomy.",
      "Posterior capsule rupture is the most feared intra-operative complication.",
    ],
    viva: [
      "Treatment of posterior capsule opacification? — Nd:YAG laser capsulotomy.",
    ],
    mcq: [
      ["Posterior capsule opacification is treated with:", "Nd:YAG laser capsulotomy", "Argon laser", "Cryotherapy", "Retinal photocoagulation", "A central opening is made in the opaque capsule."],
    ],
  },
]
