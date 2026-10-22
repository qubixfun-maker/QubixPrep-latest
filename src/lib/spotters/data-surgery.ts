import type { Spot } from "./types"

const P = "/spotters/surgery/"
const S = "Surgery"
const G = "Instruments" as const

export const SURGERY: Spot[] = [
  {
    id: "sur-allis", subject: S, group: G, topic: "Forceps", name: "Allis tissue forceps", labelled: true,
    imgs: [{ f: P + "allis.webp" }, { f: "/spotters/obg/allis.webp" }],
    identify: [
      "Ratcheted forceps with finger rings and a box lock",
      "Jaws have a fenestrated, slightly curved tip with fine interlocking teeth",
      "Atraumatic compared with a toothed clamp, but can still injure delicate tissue",
    ],
    about: "Allis forceps grip fibrous or thick tissues without slipping. The teeth interlock in a row of small teeth along the tip.",
    points: [
      "Uses: holding the fascia, aponeurosis, rectus sheath and skin edges during closure; holding the margins of a hernial sac; holding the cervix in D&C.",
      "Not used on bowel or vessels because of the risk of crush injury (Babcock's is used for these).",
      "Used to grasp a lump for biopsy or to hold the margins of a wound.",
    ],
    viva: [
      "Difference between Allis and Babcock forceps? — Allis has teeth and is for tough tissue; Babcock has smooth fenestrated tips and is atraumatic, for bowel.",
    ],
    mcq: [
      ["Which forceps is used for holding fascia during closure?", "Allis forceps", "Babcock forceps", "Doyen's clamp", "Moynihan forceps", "Allis forceps grip fascia securely with their small teeth."],
    ],
  },
  {
    id: "sur-needle-holder", subject: S, group: G, topic: "Needle and suture", name: "Needle holder (Mayo-Hegar)", labelled: true,
    imgs: [{ f: P + "needle-holder.webp" }, { f: "/spotters/obg/needle-holder.webp" }],
    identify: [
      "Ratcheted handle with finger rings and short, strong jaws",
      "Jaws have a crisscross serrated surface and a central groove for the needle",
      "Held with the thumb and ring finger",
    ],
    about: "The needle holder grasps the curved needle at the junction of its anterior two-thirds and posterior one-third, so that sutures can be passed through tissues.",
    points: [
      "Mayo-Hegar is the commonest type; Gillies has a built-in cutter; Castroviejo is for micro-surgery.",
      "Position the needle about one-third from the swage.",
      "Do not use it to hold tissues or hold artery forceps.",
    ],
    viva: [
      "Where is the needle gripped? — At the junction of the anterior two-thirds and posterior one-third.",
    ],
    mcq: [
      ["The jaws of a needle holder have:", "Crisscross serrations with a central groove", "Longitudinal grooves only", "Smooth surfaces", "Hooked teeth", "These grip a needle firmly without damage."],
    ],
  },
  {
    id: "sur-hemostat", subject: S, group: G, topic: "Clamps", name: "Artery (haemostatic) forceps", aka: "Mosquito, Kelly's, Spencer Wells", labelled: true,
    imgs: [{ f: P + "hemostat.webp" }, { f: "/spotters/obg/hemostat.webp" }],
    identify: [
      "Ratcheted forceps with ring handles",
      "Jaws with transverse serrations along the inner surface",
      "Available straight or curved and in different lengths",
    ],
    about: "Haemostatic forceps clamp bleeding vessels so that they can be ligated or coagulated. Mosquito forceps are the smallest.",
    points: [
      "Mosquito: small, for delicate tissues. Spencer Wells and Kelly: medium. Rochester-Pean: long and heavy.",
      "Also used to hold sutures (stay sutures), hold drapes and as a blunt dissector.",
      "Tip should be placed on the vessel end, not on the surrounding tissue.",
    ],
    viva: [
      "Which is the smallest artery forceps? — Mosquito forceps.",
    ],
    mcq: [
      ["Haemostat transverse serrations are found on:", "The inside of the jaws", "The outside of the jaws", "The finger rings", "The box lock", "They grip the vessel securely."],
    ],
  },
  {
    id: "sur-doyen-towel-clip", subject: S, group: G, topic: "Clamps", name: "Doyen's towel clip", labelled: true,
    imgs: [{ f: P + "doyen-towel-clip.webp" }],
    identify: [
      "Ratcheted clip with finger rings",
      "Both jaws curve in a pincer-like fashion with a sharp end",
      "Tips do not meet like forceps; the ends are bent inward as small hooks",
    ],
    about: "Doyen's towel clip secures the sterile drapes to the skin around the operative field.",
    points: [
      "Backhaus towel clip is the other common type with sharp curved points that penetrate the drape.",
      "Used to fix tubing or suction pipes to drapes.",
      "Never use on the patient's skin as a clamp.",
    ],
    viva: [
      "What is its use? — To fix the surgical towels (drapes) to each other and the patient's skin.",
    ],
    mcq: [
      ["Towel clips are used to:", "Hold the drapes", "Hold the bowel", "Clamp vessels", "Retract the abdominal wall", "They fix surgical towels."],
    ],
  },
  {
    id: "sur-sponge-holder", subject: S, group: G, topic: "Forceps", name: "Sponge-holding forceps (Rampley's)", labelled: true,
    imgs: [{ f: P + "sponge-holder.webp" }],
    identify: [
      "Long ratcheted forceps with finger rings",
      "Jaws end in oval or ring-shaped fenestrated heads",
      "Serrated rings hold a gauze sponge",
    ],
    about: "Sponge-holding forceps carry a gauze swab to mop up blood and to apply antiseptic solution (painting and draping) without touching the skin.",
    points: [
      "Uses: antiseptic painting of the operative field, swab-on-stick for deep cavities and holding the cervix.",
      "Different from ovum forceps, which have an opening without a ring serration.",
      "Mops are counted before and after the operation to prevent a retained surgical swab.",
    ],
    viva: [
      "Which antiseptic is used for skin preparation? — Povidone-iodine or chlorhexidine in spirit.",
    ],
    mcq: [
      ["Rampley's forceps are used for:", "Holding swabs", "Holding tissues", "Cutting tissues", "Dilating ducts", "They hold a sponge for mopping."],
    ],
  },
  {
    id: "sur-kocher", subject: S, group: G, topic: "Clamps", name: "Kocher's artery forceps", labelled: true,
    imgs: [{ f: P + "kocher.webp" }, { f: "/spotters/obg/kocher.webp" }],
    identify: [
      "Ratcheted forceps with 1 x 2 interlocking teeth at the tip",
      "Strong, with transverse serrations along the jaws",
      "Straight or curved, heavy build",
    ],
    about: "Kocher's forceps are toothed haemostats that give a firm grip, preventing slipping from the tissue.",
    points: [
      "Uses: clamping thick pedicles, holding the fascia, cutting edges of the rectus sheath and lifting the edge of the thyroid capsule.",
      "Traumatic, so they are not for delicate tissues or bowel.",
      "Kocher's forceps and Kocher's incision are named after Theodor Kocher.",
    ],
    viva: [
      "What distinguishes Kocher's from Spencer Wells? — Kocher's has a tooth at the tip; Spencer Wells has no teeth.",
    ],
    mcq: [
      ["Artery forceps with a tooth at the tip are:", "Kocher's", "Mosquito", "Spencer Wells", "Moynihan", "The 1 x 2 teeth prevent slipping."],
    ],
  },
  {
    id: "sur-babcock", subject: S, group: G, topic: "Forceps", name: "Babcock's tissue forceps", labelled: true,
    imgs: [{ f: P + "babcock.webp" }],
    identify: [
      "Ratcheted forceps with a ring handle",
      "Jaws end in a fenestrated, smooth, rounded, triangular tip",
      "Jaws are slightly flared and open",
    ],
    about: "Babcock's forceps hold delicate tubular structures without crushing them because of the smooth fenestrated tips.",
    points: [
      "Uses: grasping the appendix, fallopian tube, bowel, ureter and vas deferens.",
      "Used in anastomosis for holding bowel loops.",
      "Atraumatic grip, in contrast with Allis forceps that have teeth.",
    ],
    viva: [
      "Name an organ held with Babcock's forceps. — Appendix, bowel, fallopian tube or ureter.",
    ],
    mcq: [
      ["Atraumatic holding of the bowel is best done with:", "Babcock's forceps", "Allis forceps", "Kocher's forceps", "Towel clip", "It has smooth fenestrated tips."],
    ],
  },
  {
    id: "sur-toothed-forceps", subject: S, group: G, topic: "Forceps", name: "Toothed (and non-toothed) dissecting forceps", labelled: true,
    imgs: [{ f: P + "toothed-forceps.webp" }],
    identify: [
      "Spring forceps without a ratchet or rings",
      "Toothed forceps have small interlocking teeth at the tips",
      "Non-toothed forceps have serrated flat tips",
    ],
    about: "Thumb or tissue forceps are held like a pencil to hold tissues during dissection and suturing.",
    points: [
      "Toothed: used on skin, fascia and other tough tissues because teeth give a better grip with less pressure.",
      "Non-toothed (plain): used for delicate tissues like bowel, vessels and nerves.",
      "Toothed forceps are used with the left hand while suturing the skin.",
    ],
    viva: [
      "Which forceps do you use for the skin? — Toothed forceps.",
    ],
    mcq: [
      ["Non-toothed dissecting forceps are used to hold:", "Bowel and vessels", "Skin", "Fascia", "Tendon", "Smooth tips reduce trauma."],
    ],
  },
  {
    id: "sur-mcindoe", subject: S, group: G, topic: "Scissors", name: "McIndoe's dissecting scissors", labelled: true,
    imgs: [{ f: P + "mcindoe.webp" }],
    identify: [
      "Long fine scissors with ring handles",
      "Slender curved blades with blunt tips",
      "Delicate tissue scissors",
    ],
    about: "McIndoe's scissors are fine dissecting scissors used in plastic surgery and delicate dissections.",
    points: [
      "Metzenbaum scissors are similar and used for deep tissue dissection (blunt dissection by opening the blades).",
      "Mayo scissors are heavy: straight for cutting sutures, curved for dissecting fascia.",
      "Never cut sutures with dissecting scissors because they blunt the blades.",
    ],
    viva: [
      "Which scissors cut sutures? — Straight Mayo or stitch scissors.",
    ],
    mcq: [
      ["Curved delicate scissors with blunt tips are used for:", "Dissection of delicate tissue", "Cutting sutures", "Cutting plaster", "Cutting bone", "These are dissecting scissors."],
    ],
  },
  {
    id: "sur-moynihan-lahey", subject: S, group: G, topic: "Clamps", name: "Moynihan's forceps and right-angled (Lahey's) forceps", labelled: true,
    imgs: [{ f: P + "moynihan-lahey.webp" }],
    identify: [
      "Moynihan's: long curved artery forceps with a fine tip",
      "Lahey's: right-angled forceps (Gemini or Mixter) with a sharp 90-degree curved jaw",
      "Both ratcheted with ring handles",
    ],
    about: "Moynihan's forceps are long curved haemostats; right-angled forceps pass a ligature around a vessel or duct.",
    points: [
      "Right-angled forceps are used to pass a ligature around the cystic duct, renal vessels and pedicles.",
      "Used for blunt dissection around vessels and ducts.",
      "Moynihan's forceps are used for clamping vascular pedicles in deep cavities.",
    ],
    viva: [
      "What is the use of a right-angled clamp? — To pass a ligature behind a vessel or duct.",
    ],
    mcq: [
      ["A ligature is passed behind the cystic duct using:", "Right-angled forceps", "Allis forceps", "Towel clip", "Babcock's forceps", "Its 90-degree tip passes the thread behind the duct."],
    ],
  },
  {
    id: "sur-doyen-clamp", subject: S, group: G, topic: "Clamps", name: "Doyen's intestinal occlusion clamp", labelled: true,
    imgs: [{ f: P + "doyen-clamp.webp" }],
    identify: [
      "Long ratcheted clamp with finger rings",
      "Blades are long, smooth and slightly curved, with fine longitudinal grooves",
      "Atraumatic soft jaws, sometimes covered with rubber shods",
    ],
    about: "Doyen's clamps temporarily occlude the bowel lumen during resection and anastomosis, to prevent spillage of contents.",
    points: [
      "Applied to the proximal and distal bowel, away from the line of resection.",
      "Crushing clamps like Payr's are used to crush the bowel before resection; Doyen's is a non-crushing clamp.",
      "Rubber-shod clamps are used on vessels such as the bowel mesentery.",
    ],
    viva: [
      "What is a non-crushing clamp? — A clamp that occludes the bowel without injuring the wall.",
    ],
    mcq: [
      ["Doyen's intestinal clamp is:", "Non-crushing", "Crushing", "A retractor", "A needle holder", "It occludes the lumen gently."],
    ],
  },
  {
    id: "sur-desjardin", subject: S, group: G, topic: "Forceps", name: "Desjardin's choledocholithotomy forceps", labelled: true,
    imgs: [{ f: P + "desjardin.webp" }],
    identify: [
      "Long forceps with a curved, angled, narrow jaw",
      "Slender spoon-shaped tips that enter the common bile duct",
      "Finger rings on the handle",
    ],
    about: "Desjardin's forceps remove stones from the common bile duct through a choledochotomy during open exploration.",
    points: [
      "Open CBD exploration: choledochotomy, stone extraction with Desjardin's forceps, flushing with saline and a Fogarty catheter.",
      "A T-tube (Kehr's) is placed afterward in the CBD to decompress the duct.",
      "Choledochoscopy confirms clearance of stones.",
    ],
    viva: [
      "What is placed in the CBD after exploration? — A T-tube.",
    ],
    mcq: [
      ["Which forceps extract stones from the CBD?", "Desjardin's forceps", "Babcock's forceps", "Allis forceps", "Lahey's forceps", "They enter the duct through a choledochotomy."],
    ],
  },
  {
    id: "sur-urethral-dilators", subject: S, group: G, topic: "Urology", name: "Urethral dilators (Lister's and Clutton's)", labelled: true,
    imgs: [{ f: P + "urethral-dilators.webp" }],
    identify: [
      "Metallic rods with a curved tip and a smooth shaft",
      "Lister's: curved metal bougie with a short curve",
      "Clutton's: metallic bougie with a grooved handle",
    ],
    about: "Urethral dilators are graduated metal bougies used to dilate a urethral stricture gradually.",
    points: [
      "Uses: dilatation of urethral strictures by passing sizes in increasing order and clearing the stricture by gradual calibre increase.",
      "Complications: false passage, bleeding, urethral injury and infection.",
      "Urethral stricture is treated by internal urethrotomy (Sachse) or urethroplasty for recurrent or long strictures.",
      "Gentle technique is essential; a catheter is passed over the guide wire afterwards.",
    ],
    viva: [
      "Complications of urethral dilatation? — False passage, bleeding and infection.",
    ],
    mcq: [
      ["Urethral stricture is treated by:", "Dilatation or urethrotomy", "Catheterisation alone", "Nephrostomy", "Cystectomy", "Gradual dilatation or Sachse urethrotomy."],
    ],
  },
  {
    id: "sur-veress", subject: S, group: G, topic: "Laparoscopy", name: "Veress needle", labelled: true,
    imgs: [{ f: P + "veress.webp" }],
    identify: [
      "Long needle with a spring-loaded blunt inner stylet",
      "Stopcock and Luer connection at the hub",
      "Used to create a pneumoperitoneum",
    ],
    about: "The Veress needle is inserted through the umbilicus to insufflate carbon dioxide into the peritoneal cavity before laparoscopic surgery.",
    points: [
      "The blunt stylet springs forward after passing through the peritoneum to protect the bowel.",
      "Verify the position by the hanging drop test and low initial insufflation pressure.",
      "Intra-abdominal pressure of 12 to 15 mmHg; the gas used is CO2.",
      "Complications: injury to bowel or vessels, surgical emphysema, gas embolism.",
    ],
    viva: [
      "Which gas is used for pneumoperitoneum? — Carbon dioxide.",
    ],
    mcq: [
      ["Pneumoperitoneum is created using:", "CO2 through a Veress needle", "Air through a Foley catheter", "Oxygen through a trocar", "Nitrous oxide only", "CO2 is absorbed rapidly and does not support combustion."],
    ],
  },
  {
    id: "sur-deaver", subject: S, group: G, topic: "Retractors", name: "Deaver's retractor", labelled: true,
    imgs: [{ f: P + "deaver.webp" }],
    identify: [
      "Handheld retractor with a broad curved blade",
      "Smooth, wide, malleable blade that curves like an S",
      "Handle is flat or oval",
    ],
    about: "Deaver's retractor is a handheld abdominal retractor used to retract the liver, bowel or bladder to expose the deeper areas.",
    points: [
      "Uses: retracting the liver in biliary surgery and bowel in pelvic operations.",
      "Doyen's retractor is a similar blade for the abdominal wall and bladder in the pelvis.",
      "Morris retractor retracts the abdominal wall.",
    ],
    viva: [
      "Which retractor is used to hold back the liver? — Deaver's retractor.",
    ],
    mcq: [
      ["A broad curved handheld retractor is:", "Deaver's", "Langenbeck", "Doyen's towel clip", "Czerny", "Deaver's retractor exposes deep spaces."],
    ],
  },
  {
    id: "sur-kehr-t-tube", subject: S, group: G, topic: "Tubes and drains", name: "Kehr's T-tube", labelled: true,
    imgs: [{ f: P + "kehr-t-tube.webp" }],
    identify: [
      "Rubber (latex) tube shaped like the letter T",
      "Horizontal limb sits in the common bile duct; the vertical limb is brought out through the abdominal wall",
      "Soft and flexible",
    ],
    about: "A T-tube is placed in the common bile duct after exploration to drain bile and decompress the biliary tree, and to allow a post-operative cholangiogram.",
    points: [
      "Kept for about 2 to 3 weeks; a T-tube cholangiogram is done around day 10 to 14 to confirm no residual stones or leaks.",
      "Drains 200 to 500 mL of bile daily initially.",
      "Complications: bile leak, tube dislodgement, cholangitis.",
      "Also called a bile duct drain.",
    ],
    viva: [
      "When is the T-tube cholangiogram done? — About the 10th post-operative day.",
    ],
    mcq: [
      ["A T-tube is placed in the:", "Common bile duct", "Pancreatic duct", "Ureter", "Colon", "It drains and decompresses the CBD after exploration."],
    ],
  },
  {
    id: "sur-foley", subject: S, group: G, topic: "Tubes and drains", name: "Foley's catheter", labelled: true,
    imgs: [{ f: P + "foley.webp" }, { f: "/spotters/obg/foley.webp" }],
    identify: [
      "Soft latex or silicone catheter with a small inflatable balloon near the tip",
      "Two channels (two-way): drainage and balloon inflation",
      "Funnel-shaped end",
    ],
    about: "A self-retaining urinary catheter. The balloon is inflated with sterile water, which stops the tube from slipping out of the bladder.",
    points: [
      "Size in French (Fr): the outer circumference in mm (Fr = 3 x diameter in mm); 16 Fr is the usual adult size.",
      "Balloon capacity is 5 to 30 mL, with 10 mL standard.",
      "Indications: urinary retention, monitoring urine output, bladder irrigation, pre-operative drainage, and after urological surgery.",
      "Three-way catheter has an extra channel for irrigation (TURP).",
      "Contraindicated in urethral injury (suprapubic catheter is placed).",
    ],
    viva: [
      "What does 16 Fr mean? — Outer circumference of 16 mm (diameter about 5.3 mm).",
      "Fluid used to inflate the balloon? — Sterile water.",
    ],
    mcq: [
      ["The French gauge of a catheter measures:", "The outer circumference in mm", "The length", "The balloon size", "The inner volume", "1 Fr = 0.33 mm of outer diameter."],
      ["A catheter is contraindicated in:", "Suspected urethral injury", "Retention due to BPH", "Post-operative urine monitoring", "Coma", "Blood at the meatus suggests a urethral tear; use a suprapubic route."],
    ],
  },
  {
    id: "sur-kelly-speculum", subject: S, group: G, topic: "Proctology", name: "Kelly's rectal speculum (proctoscope)", labelled: true,
    imgs: [{ f: P + "kelly-speculum.webp" }],
    identify: [
      "Short metal tube with a wide flared handle end",
      "Obturator fits inside the tube, with a blunt tip",
      "About 8 to 10 cm in length",
    ],
    about: "A proctoscope inspects the anal canal and lower rectum. It is passed with the obturator in position, then the obturator is removed to see the mucosa.",
    points: [
      "Uses: diagnosing piles (haemorrhoids), fissures, rectal polyps and sclerotherapy or banding of haemorrhoids.",
      "Digital rectal examination should always precede proctoscopy.",
      "Sigmoidoscope is longer (25 cm) and examines the rectum and the sigmoid colon.",
    ],
    viva: [
      "What do you examine before the proctoscope? — A digital rectal examination.",
    ],
    mcq: [
      ["Haemorrhoids are best examined with a:", "Proctoscope", "Sigmoidoscope", "Colonoscope", "Cystoscope", "It shows the anal canal and haemorrhoids."],
    ],
  },
  {
    id: "sur-rubber-drain", subject: S, group: G, topic: "Tubes and drains", name: "Corrugated rubber sheet drain", labelled: true,
    imgs: [{ f: P + "rubber-drain.webp" }],
    identify: [
      "Flat, soft rubber sheets with parallel corrugations (ridges)",
      "Orange or amber colour",
      "Can be cut to size",
    ],
    about: "A passive drain that allows fluid to flow by capillary action along the corrugations. It is a type of open drain.",
    points: [
      "Uses: draining abscess cavities, wounds with ooze, and after thyroidectomy or hernia repair.",
      "Closed drains such as Redivac or Jackson-Pratt use suction; tube drains (Robinson, Malecot) are other types.",
      "Remove the drain once the output is minimal (less than 20 to 30 mL per day).",
      "Fix with a stitch and safety pin to avoid it slipping into the wound.",
    ],
    viva: [
      "What type of drain is this? — A passive open drain.",
    ],
    mcq: [
      ["Corrugated rubber drain works by:", "Capillary action", "Suction", "Gravity only", "Siphon action", "Fluid travels along the grooves."],
    ],
  },
  {
    id: "sur-ryle", subject: S, group: G, topic: "Tubes and drains", name: "Ryle's tube", labelled: true,
    imgs: [{ f: P + "ryle.webp" }],
    identify: [
      "Long, thin, flexible rubber or plastic tube with a weighted tip",
      "Multiple side holes near the tip",
      "Markings at 50 cm for the passage",
    ],
    about: "A nasogastric tube used for decompression, aspiration or feeding. The standard length is 100 cm.",
    points: [
      "Uses: decompression of the stomach in intestinal obstruction, gastric lavage, enteral feeding and aspiration of gastric contents.",
      "Measure from the nose to the ear lobe to the xiphisternum for the length to insert (about 50 to 55 cm).",
      "Confirm position by aspirating gastric contents and testing pH, or by X-ray.",
      "Complications: aspiration, sinusitis, nasal erosion, wrong placement in the lung.",
    ],
    viva: [
      "How do you confirm placement? — Aspirate and test pH, or by chest X-ray.",
    ],
    mcq: [
      ["Length to be inserted for a Ryle's tube is estimated as:", "Nose to earlobe to xiphisternum", "Mouth to umbilicus", "Nose to chin", "Ear to ear", "This approximates the distance to the stomach."],
    ],
  },
  {
    id: "sur-urobag", subject: S, group: G, topic: "Tubes and drains", name: "Urobag (urine collection bag)", labelled: true,
    imgs: [{ f: P + "urobag.webp" }],
    identify: [
      "Transparent plastic bag with a drainage tube and a connector",
      "Graduated markings for volume",
      "Outlet tap at the bottom",
    ],
    about: "A closed urine collection system attached to a catheter, with an anti-reflux valve that stops backflow of urine.",
    points: [
      "Keep the bag below the level of the bladder to prevent backflow and infection.",
      "Closed drainage reduces catheter-associated UTI.",
      "Empty when two-thirds full and replace regularly.",
    ],
    viva: [
      "Why should the bag be below the bladder? — To stop retrograde flow of urine and infection.",
    ],
    mcq: [
      ["A urine bag should be kept:", "Below the level of the bladder", "Above the level of the bladder", "At the level of the umbilicus", "On the patient's abdomen", "Gravity drainage prevents backflow and catheter-associated UTI."],
    ],
  },
  {
    id: "sur-bp-handle", subject: S, group: G, topic: "Cutting instruments", name: "Bard-Parker (BP) handle with blade", labelled: true,
    imgs: [{ f: P + "bp-handle.webp" }],
    identify: [
      "Flat metal handle with a slotted end carrying a detachable blade",
      "Fine grooves on the handle for grip",
      "Numbered scale (3 or 4) on the handle",
    ],
    about: "The BP handle holds disposable surgical blades. Handle No. 3 fits blades 10, 11, 12 and 15; Handle No. 4 fits blades 20 to 24.",
    points: [
      "Blade 10: general incisions. Blade 11: stab incisions and abscess drainage. Blade 15: small precise cuts. Blade 22: large incisions on the abdomen.",
      "The belly of the blade is used to cut.",
      "Load and unload the blade with a needle holder, never with the fingers.",
    ],
    viva: [
      "Which blade is used for incision and drainage of an abscess? — Number 11.",
    ],
    mcq: [
      ["BP handle number 4 fits blades:", "20 to 24", "10 to 15", "5 to 8", "30 to 36", "Large blades for abdominal incisions."],
    ],
  },
  {
    id: "sur-trocar", subject: S, group: G, topic: "Laparoscopy", name: "Laparoscopic trocar and cannula", labelled: true,
    imgs: [{ f: P + "trocar.webp" }],
    identify: [
      "Hollow tube (cannula) with a valve and a sharp or blunt obturator inside",
      "Stopcock for gas insufflation or desufflation",
      "Pyramidal or conical tip on the trocar",
    ],
    about: "The trocar is a sharp obturator that perforates the abdominal wall; the cannula remains as a port for instruments and the telescope.",
    points: [
      "Ports: 10 mm for the camera, 5 mm for working instruments; the first port is placed at the umbilicus (open Hasson technique or Veress needle).",
      "Reducer sleeves allow the use of smaller instruments through a larger port.",
      "Complications: port-site hernia, bleeding, bowel injury.",
    ],
    viva: [
      "Which technique avoids blind entry? — The open Hasson technique.",
    ],
    mcq: [
      ["The open (Hasson) technique for the first port:", "Is done under direct vision through a mini laparotomy", "Uses a Veress needle blindly", "Is done only in the left flank", "Needs no gas insufflation", "It reduces the risk of visceral injury."],
    ],
  },
  {
    id: "sur-maryland", subject: S, group: G, topic: "Laparoscopy", name: "Maryland dissector", labelled: true,
    imgs: [{ f: P + "maryland.webp" }],
    identify: [
      "Long, thin laparoscopic instrument with a pistol or ring handle",
      "Curved, tapered jaws at the working end",
      "Insulated shaft with a rotating knob",
    ],
    about: "The Maryland dissector is a curved-jaw laparoscopic dissecting forceps used to dissect and grasp fine tissues. It can be connected to monopolar diathermy.",
    points: [
      "Uses: dissection of Calot's triangle and creation of a window behind the cystic duct and artery in laparoscopic cholecystectomy.",
      "Fine curved jaws allow blunt dissection and grasping.",
      "Other laparoscopic instruments: Babcock-type grasper, hook, scissors, clip applier and suction-irrigation cannula.",
    ],
    viva: [
      "What is the critical view of safety? — Clear visualisation of the cystic duct and artery entering the gall bladder, with Calot's triangle cleared.",
    ],
    mcq: [
      ["Calot's triangle is bounded by:", "Cystic duct, common hepatic duct and liver edge", "Cystic duct, CBD and duodenum", "Portal vein, hepatic artery and CBD", "Cystic artery, IVC and liver", "The cystic artery runs inside it."],
    ],
  },
]
