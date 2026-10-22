import type { Extra } from "./extra"

export const EXTRA_SURGERY: Record<string, Extra> = {
  "sur-allis": {
    about: "Allis tissue forceps are ratcheted, self-retaining grasping forceps. The tips are slightly curved and carry a row of small, fine interlocking teeth, with a fenestrated (open) oval between the blades. The fenestration spreads the grip over a wide area, so the forceps hold tough, slippery tissue firmly without crushing it as much as a toothed clamp would. They are made in 6-inch and 8-inch sizes. In a surgical set they are used mainly to hold fascia, aponeurosis and the edges of the rectus sheath during closure, to pick up the edge of a hernial sac, and to hold breast or other lumps for dissection. They are not meant for bowel or other delicate tissue, because the teeth can bruise or perforate it.",
    points: [
      "Description for the exam: ratchet handle, curved fenestrated jaws, rows of tiny interlocking teeth at the tip.",
      "Typical uses: holding fascia and aponeurosis, holding the sheath edges in laparotomy closure, holding the neck of a hernial sac, holding the cervix or vaginal wall in gynaecological surgery, holding the edge of the breast in lumpectomy.",
      "Do not use on bowel, vessels or nerves. Babcock's forceps are used for bowel, appendix, fallopian tube and ureter.",
      "Mnemonic: Allis = Ali's teeth, A for Aponeurosis; Babcock = Bowel.",
    ],
    viva: [
      "What is the difference between Allis and Babcock forceps? — Allis has small interlocking teeth and grips tough tissue like fascia; Babcock has smooth, atraumatic, fenestrated tips with a wider curved blade and is used for bowel, tubes and ureter.",
      "Name two tissues you would never hold with Allis forceps. — Bowel and blood vessels, because the teeth crush and can perforate them.",
      "Why are the jaws fenestrated? — To spread the holding force over a wider area and reduce crushing of the tissue.",
    ],
    mcq: [
      ["Which forceps has small interlocking teeth at the tip and a fenestrated jaw?", "Allis forceps", "Babcock forceps", "Moynihan forceps", "Kocher's forceps", "Allis forceps have a row of interlocking teeth with an open fenestration between them."],
      ["Allis forceps should NOT be used to hold:", "Bowel", "Rectus sheath", "Hernial sac", "Breast lump", "The teeth can injure bowel wall; Babcock's forceps are used for bowel."],
      ["The instrument used for holding the appendix or fallopian tube without injury is:", "Babcock's forceps", "Allis forceps", "Towel clip", "Doyen's clamp", "Babcock's forceps are atraumatic with a smooth grip."],
    ],
  },
  "sur-needle-holder": {
    about: "The Mayo-Hegar needle holder is a ratcheted instrument with short, stout, serrated jaws and a tungsten carbide (gold-handled) insert in modern versions. A small groove runs along the length of the jaw to prevent the needle from rotating or slipping. It has finger rings and a box lock with a ratchet that keeps the grip locked. It is used to hold and pass curved suture needles through tissue. The needle is gripped about one-third to half the way along from the swaged end, perpendicular to the jaw, close to the tip. Heavy needle holders are used for fascia and skin; fine ones such as Gillies, Castroviejo or Derf needle holders are used in plastic, vascular and eye surgery.",
    points: [
      "Description: short thick jaws with crosshatched serrations and a central groove, box lock, finger rings and a ratchet.",
      "Use: holding the curved needle to take bites of tissue during suturing; also used for instrument ties.",
      "Needle holders differ from artery forceps because the jaws are short, stout and serrated, to grip a needle firmly without bending it.",
      "Wrong grip on a needle bends it; load the needle about two-thirds from the point and avoid holding it at the swage.",
    ],
    viva: [
      "How does a needle holder differ from artery forceps? — Needle holder: short, strong jaws with crosshatching and a central groove, made to grip the needle. Artery forceps: longer, with transverse serrations, designed to clamp vessels.",
      "Where on the needle do you grip it? — About one-third to half the way along from the swaged end, near the tip of the jaws.",
      "Name a fine needle holder used in microsurgery. — Castroviejo (also Gillies and Derf for plastics and general fine work).",
    ],
    mcq: [
      ["The jaws of a needle holder differ from those of artery forceps in being:", "Short with crosshatched serrations and a central groove", "Long with transverse serrations", "Smooth and fenestrated", "Toothed like Allis forceps", "A needle holder grips the needle with a stout, serrated, grooved jaw."],
      ["The usual place to hold a curved suture needle is:", "About one-third to half way from the swaged end", "At the very tip", "At the swage", "In the middle of the curve only", "Holding at the tip or swage risks bending or breaking the needle."],
      ["A Mayo-Hegar needle holder has which locking mechanism?", "Ratchet with box lock", "Screw lock", "Spring-loaded plain handle", "No lock", "It has finger rings with a ratchet and box lock."],
    ],
  },
  "sur-hemostat": {
    about: "Artery (haemostatic) forceps are ratcheted clamps with transversely serrated jaws, finger rings and a box lock. The commonest types in a set are Mosquito (small), Halsted and Spencer Wells (medium) and Kelly's (larger). The jaws can be straight or curved. They are used to clamp bleeding vessels so that they can be ligated or coagulated, to grasp and hold tissue edges, to hold suture ends, and as general-purpose holding instruments. The tip of the jaw should be applied across the vessel at right angles, with the curve pointing upward, so that minimum surrounding tissue is included.",
    points: [
      "Types: Mosquito (smallest), Halsted, Spencer Wells, Kelly, Rochester-Pean (long, heavy).",
      "Jaw serrations are transverse (across the jaw), unlike a needle holder with crosshatching.",
      "Uses: clamping vessels, tagging suture ends, blunt dissection by spreading the jaws, holding drapes (Spencer Wells).",
      "Kocher's artery forceps differ because their jaws have a single tooth at the tip.",
    ],
    viva: [
      "What is the difference between Spencer Wells and Kocher's forceps? — Spencer Wells has no teeth and is atraumatic for vessels; Kocher's has a tooth at the tip and is for holding tough tissue like fascia.",
      "How do you apply an artery forceps to a bleeding vessel? — Pick up the vessel with the tip, curve upward, across the vessel, and include as little surrounding tissue as possible.",
      "Name the smallest artery forceps. — Mosquito forceps.",
    ],
    mcq: [
      ["The smallest artery forceps is the:", "Mosquito forceps", "Kocher's forceps", "Spencer Wells forceps", "Rochester-Pean forceps", "Mosquito forceps are the smallest and are used for fine vessels."],
      ["Artery forceps are mainly used to:", "Clamp bleeding vessels", "Hold a needle", "Cut tissue", "Retract the abdominal wall", "They clamp vessels so they can be ligated or coagulated."],
      ["Artery forceps jaws have:", "Transverse serrations", "Longitudinal grooves and crosshatching", "Fine interlocking teeth", "No serrations", "Transverse serrations help grip the vessel while the jaws are locked."],
    ],
  },
  "sur-doyen-towel-clip": {
    about: "Doyen's towel clip is a ratcheted clamp with sharp, curved, pointed jaws that pierce the drape. Each jaw ends in a pointed hook, so when the clip is closed the two points come together. The clip is used to fix sterile drapes (towels) to the skin around the operative field and to fix them to each other, and also to hold the suction tubing or diathermy cable to the drape. Because the points pierce the cloth and sometimes the skin edge, the clip should never be used on tissues or to hold bowel.",
    points: [
      "Description: ratcheted handle with finger rings and a box lock; jaws are curved with sharp, pointed ends that meet when closed.",
      "Uses: securing drapes to the skin, fixing suction tubing, diathermy leads and light handle cords to the drape.",
      "Because the points penetrate the cloth, they are not suitable for use on tissues.",
      "Non-piercing towel clips (for example Edna or Roeder) clamp the cloth without puncturing it; Doyen's and Backhaus clips pierce the drape.",
    ],
    viva: [
      "What is the use of Doyen's towel clip? — To fix sterile drapes to the skin around the operative field and to secure tubing and cables to the drape.",
      "Is a towel clip used on tissue? — No; the pointed jaws are meant only for drapes.",
      "Which towel clip does not pierce the cloth? — Non-piercing towel clips (such as Edna or Roeder).",
    ],
    mcq: [
      ["The instrument with curved, sharp-pointed jaws used to fix drapes is:", "Doyen's towel clip", "Allis forceps", "Babcock forceps", "Rampley's sponge holder", "The pointed jaws penetrate the drapes to fix them to the skin."],
      ["A towel clip is NOT used for:", "Holding bowel", "Securing drapes", "Fixing suction tubing", "Fixing diathermy cable", "The points would perforate bowel; towel clips are for drapes only."],
      ["Doyen's towel clip is held closed by:", "A ratchet lock", "A screw", "A spring only", "A hinge pin", "It has a ratchet that holds the clip closed on the drape."],
    ],
  },
  "sur-sponge-holder": {
    about: "Rampley's sponge-holding forceps are long, ratcheted forceps with fenestrated, ring-shaped (oval) serrated jaws. The rings are slightly angled and have fine transverse serrations so that they hold a gauze swab (sponge) without crushing the tissue beneath it. They are used for skin preparation with antiseptic solution (painting and cleaning), for holding a swab to mop blood in deep cavities such as the abdomen and pelvis, and for gentle blunt dissection with a swab. The forceps can also hold a vaginal pack or be used to push intestines aside in a laparotomy.",
    points: [
      "Description: long forceps with oval fenestrated jaws, finger rings and a ratchet.",
      "Uses: skin painting with antiseptic, holding gauze swabs, mopping blood from deep cavities, swab dissection, holding a pack in the vagina or abdomen.",
      "Count swabs before and after the operation to avoid retained swabs (gossypiboma).",
      "Do not use to hold tissue; Allis and Babcock forceps are used for tissue.",
    ],
    viva: [
      "What are the uses of Rampley's sponge holder? — Skin cleaning, mopping blood in deep cavities, swab dissection and holding packs.",
      "What is gossypiboma? — A retained surgical sponge or swab inside the body after surgery.",
      "Why are the jaws fenestrated? — To grip the swab without cutting or crushing the surrounding tissue.",
    ],
    mcq: [
      ["The instrument with oval, fenestrated jaws used to hold gauze for skin painting is:", "Sponge-holding forceps", "Allis forceps", "Kocher's forceps", "Needle holder", "Rampley's forceps hold swabs for skin cleaning and mopping."],
      ["A retained surgical swab inside the abdomen is called:", "Gossypiboma", "Hematoma", "Seroma", "Lipoma", "Gossypiboma is a retained sponge or textile in the body."],
      ["Sponge-holding forceps are NOT used for:", "Holding bowel tissue", "Painting the skin", "Holding a swab to mop blood", "Swab dissection", "Tissue is held with tissue forceps, not a sponge holder."],
    ],
  },
  "sur-kocher": {
    about: "Kocher's artery forceps are strong, ratcheted, heavy clamps with transverse serrations and a single tooth at the tip of one jaw that fits into a groove in the opposite jaw (1 into 2 teeth). The tooth gives a very firm hold that does not slip. They are used to hold tough tissues such as fascia, aponeurosis, muscle edges and skin edges, to clamp thick pedicles and to hold the cut end of a tendon, as well as to clamp vessels in places where slipping is dangerous. They are not suitable for delicate tissue because the tooth crushes and punctures.",
    points: [
      "Description: heavy, ratcheted, transversely serrated jaws with a single tooth at the tip (1 into 2 teeth).",
      "Uses: grasping fascia and aponeurosis, clamping thick pedicles, holding muscle edges, holding the stump of a divided structure.",
      "Spencer Wells (no teeth) is preferred for vessels and delicate tissue.",
      "Straight and curved types exist; a curved type is used for deep pelvic work.",
    ],
    viva: [
      "How do you differentiate Kocher's from Spencer Wells forceps? — Kocher's has a tooth at the tip; Spencer Wells has none.",
      "What are the uses of Kocher's forceps? — Holding fascia and thick tissue, clamping thick pedicles, holding the cut ends of tendon or muscle.",
      "Can you use Kocher's on bowel? — No; the tooth injures the bowel wall.",
    ],
    mcq: [
      ["Artery forceps with a single tooth at the tip are:", "Kocher's forceps", "Spencer Wells forceps", "Mosquito forceps", "Halsted forceps", "Kocher's forceps have a 1-into-2 tooth arrangement at the tip."],
      ["Kocher's forceps are best used to hold:", "Fascia", "Bowel", "Ureter", "Fine vessel", "The tooth gives a secure, non-slip hold on tough tissue."],
      ["Which has no teeth?", "Spencer Wells forceps", "Kocher's forceps", "Allis forceps", "Toothed dissecting forceps", "Spencer Wells is a plain, atraumatic artery forceps."],
    ],
  },
  "sur-babcock": {
    about: "Babcock's forceps are ratcheted tissue forceps with smooth, fenestrated, triangular (spoon-shaped) jaws that curve outward at the tip. The blades are wide, with a smooth, atraumatic surface and a fenestration in the centre. When closed, the jaws form a loop that encircles a tubular structure without crushing it. They are used for holding delicate tubular structures: bowel (especially during anastomosis and appendicectomy), the appendix, fallopian tubes, ureter, and sometimes the gall bladder or vas. Babcock's forceps are one of the most commonly asked instruments in surgical spotter examinations.",
    points: [
      "Description: ratchet, triangular fenestrated jaws that curve inward and meet as a loop at the tip.",
      "Uses: holding bowel, appendix, fallopian tube, ureter, gall bladder, vas deferens; lifting the peritoneum.",
      "It is atraumatic because the blades are smooth and fenestrated.",
      "Compare: Allis has teeth, Babcock is smooth.",
    ],
    viva: [
      "Why is Babcock's forceps suited for bowel? — Smooth, fenestrated jaws distribute pressure and do not crush or perforate bowel.",
      "Name three structures you would hold with Babcock's forceps. — Appendix, fallopian tube, bowel (ureter and gall bladder also).",
      "What is the shape of the jaws when closed? — A fenestrated, triangular loop that encircles tubular structures.",
    ],
    mcq: [
      ["The forceps used for holding bowel and the appendix is:", "Babcock's forceps", "Allis forceps", "Kocher's forceps", "Towel clip", "Babcock's smooth, fenestrated jaws are atraumatic."],
      ["Babcock's forceps differ from Allis in having:", "Smooth jaws without teeth", "Toothed jaws", "A screw lock", "A curved blade only", "Babcock jaws are smooth; Allis jaws carry teeth."],
      ["Which structure is typically held with Babcock's forceps?", "Fallopian tube", "Fascia", "Skin edge", "Drape", "Delicate tubular structures are held with Babcock's."],
    ],
  },
  "sur-toothed-forceps": {
    about: "Dissecting (tissue) forceps are non-ratcheted, spring-type forceps held like a pen. The toothed variety has one or more fine teeth (usually 1 into 2) at the tip that interlock when the blades close, giving a secure grip on skin, fascia and tough tissue with only light pressure. The non-toothed (plain or atraumatic) type has serrated tips and is used for delicate tissue such as bowel, vessels and nerves. Fine ones (Adson's) are used for skin and plastic surgery; heavier ones (Gillies, Lane) are used for fascia and deeper tissues. Toothed forceps are used to hold skin edges for suturing and to lift tough tissues during dissection; plain forceps are used with a scissors or knife to dissect deeper structures.",
    points: [
      "Description: spring forceps with no ratchet; toothed has a 1-into-2 tooth arrangement at the tip, non-toothed has fine serrations.",
      "Toothed: skin, fascia, tendon. Non-toothed (plain): bowel, vessels, nerves, delicate tissue.",
      "Hold them like a pen, between the thumb and first two fingers.",
      "Rat-tooth forceps is another name for toothed dissecting forceps.",
    ],
    viva: [
      "When do you use toothed forceps? — For skin, fascia and other tough tissue where a firm hold is needed.",
      "Which forceps do you use for bowel or vessels? — Non-toothed (plain, atraumatic) dissecting forceps.",
      "How are dissecting forceps held? — Like a pen between thumb and the first two fingers.",
    ],
    mcq: [
      ["Dissecting forceps with a 1-into-2 teeth arrangement at the tip are used for:", "Skin and fascia", "Bowel", "Nerves", "Large vessels", "Toothed forceps give a firm hold on tough tissue without much pressure."],
      ["Which dissecting forceps are used for delicate tissue and vessels?", "Non-toothed (plain) forceps", "Toothed forceps", "Allis forceps", "Towel clip", "Plain forceps do not injure delicate structures."],
      ["Dissecting forceps are held:", "Like a pen", "In a closed fist", "With the thumb through a ring", "With both hands", "A pen grip allows fine control."],
    ],
  },
  "sur-mcindoe": {
    about: "McIndoe's dissecting scissors are long, slender, blunt-tipped scissors with a curved blade, used for fine dissection in plastic, vascular and general surgery. The blades are long and thin with rounded, blunt tips so that the tips can be inserted into tissue planes and spread to open them without cutting vital structures. Because the blades are fine they should never be used to cut sutures or tough tissue, as they will lose their edge and become misaligned. McIndoe's scissors are often used in neck dissection, thyroid surgery, hernia repair and abdominal surgery for separating tissue planes.",
    points: [
      "Description: long, slender scissors with curved, blunt-tipped blades and finger rings.",
      "Use: fine dissection of tissue planes, undermining skin flaps, dissecting vessels and nerves.",
      "Do not cut sutures with dissecting scissors; use a separate straight stitch scissors (Mayo's).",
      "Compare: Mayo's scissors are heavy and used for cutting fascia and sutures; Metzenbaum scissors are similar to McIndoe, with delicate blades for tissue.",
    ],
    viva: [
      "What is the use of McIndoe's scissors? — Fine dissection of tissues and undermining skin flaps.",
      "Why should you not use them to cut sutures? — They blunt and misalign the fine blades; stitch scissors are used instead.",
      "How do you distinguish them from Mayo's scissors? — McIndoe's are long and slender with fine blunt tips; Mayo's are short, heavy and strong.",
    ],
    mcq: [
      ["Long slender curved scissors with blunt tips used for fine dissection are:", "McIndoe's scissors", "Mayo's scissors", "Stitch scissors", "Episiotomy scissors", "McIndoe's blades are slender and blunt for delicate dissection."],
      ["Which scissors are used to cut sutures?", "Stitch scissors or Mayo's", "McIndoe's", "Metzenbaum", "Vannas", "Dissecting scissors should not be used for suture cutting."],
      ["The blunt tip of dissecting scissors is meant to:", "Spread tissue planes safely", "Pierce the skin", "Cut bone", "Hold needles", "A blunt tip lets the surgeon open planes without cutting vessels."],
    ],
  },
  "sur-moynihan-lahey": {
    about: "Moynihan's forceps are heavy, ratcheted, curved clamps used to hold the gall bladder or to clamp thick pedicles during cholecystectomy, and Lahey's forceps are right-angled forceps. Lahey's (also called Lahey's goitre or right-angled forceps) have a nearly 90 degree curve at the tip and are used to pass a ligature around a deep vessel, especially the cystic artery or duct, or the inferior thyroid vessels in thyroid surgery. Because the tip is angled, the surgeon can pass the ligature around the structure without damaging neighbouring tissue.",
    points: [
      "Moynihan's: heavy clamp with jaws curved on the flat, used to hold a pedicle or gall bladder.",
      "Lahey's (right-angled) forceps: tip bent at about 90 degrees; used to pass ligatures around a vessel in a deep place.",
      "Common uses: cystic duct and artery in cholecystectomy, thyroid vessels in thyroidectomy, deep pelvic vessels.",
      "Mixter's forceps are a similar right-angled instrument used for the same job.",
    ],
    viva: [
      "What is a right-angled forceps used for? — To pass a ligature around a deep vessel or duct, for example the cystic duct or a thyroid vessel.",
      "Name two operations where Lahey's forceps are used. — Cholecystectomy and thyroidectomy.",
      "How do you recognise a Lahey's forceps? — The tip is bent almost at a right angle.",
    ],
    mcq: [
      ["The instrument used to pass a ligature around a deep vessel is:", "Right-angled (Lahey's) forceps", "Allis forceps", "Towel clip", "Sponge holder", "The right-angled tip allows passing ligatures around deep structures."],
      ["Moynihan's forceps is used to hold:", "Gall bladder or a thick pedicle", "Skin edge", "Drapes", "A suture needle", "It is a heavy clamp used for pedicles and the gall bladder."],
      ["Lahey's forceps tip is bent at about:", "90 degrees", "30 degrees", "45 degrees", "It is straight", "Lahey's forceps are right-angled."],
    ],
  },
  "sur-doyen-clamp": {
    about: "Doyen's intestinal occlusion clamp is a long, ratcheted clamp with straight or slightly curved, parallel jaws covered with soft rubber sleeves or fine longitudinal serrations. It is a non-crushing clamp, so it temporarily occludes the lumen of the bowel without damaging its wall. It is used in bowel surgery to prevent spillage of intestinal contents during resection and anastomosis, usually applied in pairs on either side of the segment to be removed. Before application the mesentery must be cleared, and the clamp is applied across the bowel at right angles. Crushing clamps (e.g., Payr's) are used only on the specimen side.",
    points: [
      "Description: long, soft-jawed, non-crushing clamp with finger rings and a ratchet.",
      "Use: temporarily occluding the bowel during resection and anastomosis (applied on the proximal and distal sides).",
      "Crushing clamps like Payr's or Kocher's are applied on the side of the specimen to be removed.",
      "The jaws may be covered with rubber tubing to make them atraumatic.",
    ],
    viva: [
      "What is the use of Doyen's clamp? — To occlude the bowel temporarily to prevent spillage during resection and anastomosis.",
      "Why is it called a non-crushing clamp? — Its soft or serrated jaws do not damage the bowel wall.",
      "Which clamp is applied on the specimen side? — A crushing clamp such as Payr's or Kocher's.",
    ],
    mcq: [
      ["A non-crushing clamp used to occlude bowel during anastomosis is:", "Doyen's intestinal clamp", "Kocher's forceps", "Towel clip", "Allis forceps", "Doyen's clamp occludes bowel without crushing it."],
      ["Intestinal clamps are applied:", "On both sides of the bowel segment to be removed", "Only on the mucosa", "Only on the mesentery", "After the anastomosis is complete", "They prevent soiling from either cut end."],
      ["Which clamp is used on the specimen side?", "Crushing clamp (Payr's)", "Doyen's clamp", "Babcock's forceps", "Bulldog clamp", "A crushing clamp is acceptable on the portion to be discarded."],
    ],
  },
  "sur-desjardin": {
    about: "Desjardin's choledocholithotomy forceps are long forceps with a gently curved shaft and small, cup-shaped or spoon-shaped, fenestrated jaws. The jaws are angled and are used to remove stones from the common bile duct (CBD) after it has been opened by a choledochotomy. The forceps are passed through the incision in the duct and used to grasp and extract stones; a flexible choledochoscope or a balloon catheter may be used for clearance afterwards. After the duct has been explored, a T-tube (Kehr's tube) is left in place to allow bile drainage and later cholangiography.",
    points: [
      "Description: long curved forceps with small oval spoon-shaped (cupped) jaws.",
      "Use: removing stones from the common bile duct in open choledocholithotomy (CBD exploration).",
      "Followed by insertion of a Kehr's T-tube to drain the CBD.",
      "Alternatives now: ERCP with sphincterotomy and stone extraction, laparoscopic CBD exploration.",
    ],
    viva: [
      "What is the use of Desjardin's forceps? — Removing stones from the common bile duct during CBD exploration.",
      "What is left in the duct after CBD exploration? — A Kehr's T-tube.",
      "Name a non-surgical method for CBD stones. — ERCP with endoscopic sphincterotomy and stone extraction.",
    ],
    mcq: [
      ["Stones in the common bile duct are removed at open surgery with:", "Desjardin's forceps", "Babcock's forceps", "Moynihan's forceps", "Allis forceps", "Desjardin's forceps are designed for choledocholithotomy."],
      ["After choledocholithotomy, the tube left in the CBD is:", "Kehr's T-tube", "Ryle's tube", "Foley's catheter", "Corrugated drain", "A T-tube drains the CBD and allows a postoperative cholangiogram."],
      ["The non-operative method of removing CBD stones is:", "ERCP with sphincterotomy", "Colonoscopy", "Cystoscopy", "Bronchoscopy", "ERCP allows endoscopic stone extraction."],
    ],
  },
  "sur-urethral-dilators": {
    about: "Urethral dilators are graduated metal rods used to dilate a stricture of the urethra. Lister's dilators are curved metal rods that follow the curve of the male urethra, while Clutton's dilators are straight, solid metal rods with a groove along the underside, so that they can be passed over a guide. They are available in a graded series of calibre (Charrière or English scale) so that sequential dilatation can be performed by passing progressively larger sizes. Urethral dilatation is done gently under lubrication and antibiotic cover, with a risk of false passage, haemorrhage and bacteraemia. A urethral stricture is also treated with optical urethrotomy and urethroplasty.",
    points: [
      "Lister's: curved dilator that fits the male urethra. Clutton's: straight dilator with a groove on the underside.",
      "Graded sizes; start with a small size and progress carefully.",
      "Complications: false passage, bleeding, urethral rupture, urinary infection and bacteraemia.",
      "Alternatives: internal optical urethrotomy and urethroplasty for recurrent or long strictures.",
    ],
    viva: [
      "What are urethral dilators used for? — To dilate a urethral stricture in a graded manner.",
      "Name two complications of urethral dilatation. — False passage and bleeding or bacteraemia.",
      "What is a definitive treatment for a long or recurrent stricture? — Urethroplasty.",
    ],
    mcq: [
      ["Straight metal urethral dilators with a groove along the underside are:", "Clutton's dilators", "Lister's dilators", "Hegar's dilators", "Bowman's probes", "Clutton's dilators are straight and grooved; Lister's are curved."],
      ["A feared complication of blind urethral dilatation is:", "False passage", "Hydrocele", "Hernia", "Varicocele", "A false passage can form if the dilator is forced."],
      ["For a long, recurrent urethral stricture the best treatment is:", "Urethroplasty", "Repeated dilatation only", "Catheter for life", "Circumcision", "Urethroplasty gives a durable cure."],
    ],
  },
  "sur-veress": {
    about: "The Veress needle is a spring-loaded needle used to create a pneumoperitoneum before laparoscopic surgery. It has an outer sharp cutting needle and an inner, blunt, spring-loaded stylet with a side hole. When the needle is pushed through the abdominal wall the blunt stylet retracts; once the needle enters the peritoneal cavity, the stylet springs forward to protect the bowel. CO2 is then insufflated through the needle at a low flow rate to establish pneumoperitoneum (12 to 15 mmHg). Tests to confirm correct position include the saline drop test (hanging drop), aspiration test and the low initial insufflation pressure. The needle is usually inserted at the umbilicus (or Palmer's point in some patients). The alternative is an open technique (Hasson's).",
    points: [
      "Description: long needle with a spring-loaded blunt inner stylet; a Luer-lock connection for gas.",
      "Use: creating pneumoperitoneum with CO2 in laparoscopy.",
      "Confirmation: saline drop test, aspiration, insufflation pressure below 10 mmHg at start, free flow of gas.",
      "Complications: injury to bowel or blood vessels, extraperitoneal insufflation, gas embolism.",
      "Open (Hasson) technique avoids blind needle insertion and is safer in adhesions.",
    ],
    viva: [
      "What is the Veress needle used for? — Creating pneumoperitoneum before laparoscopy.",
      "How do you confirm that the tip is in the peritoneal cavity? — Saline drop test, aspiration, low insufflation pressure and free gas flow.",
      "What is the open technique of access? — Hasson's technique, where a cut-down is made and a blunt trocar inserted under vision.",
    ],
    mcq: [
      ["The needle with a spring-loaded blunt stylet used to create pneumoperitoneum is:", "Veress needle", "Spinal needle", "Trocar", "Cannula", "The spring-loaded stylet protects the viscera once inside the peritoneum."],
      ["The gas used for pneumoperitoneum is:", "Carbon dioxide", "Oxygen", "Nitrous oxide", "Nitrogen", "CO2 is rapidly absorbed and is not combustible."],
      ["A test to confirm the position of a Veress needle is:", "Saline drop test", "Valsalva test", "Trendelenburg test", "Tourniquet test", "A saline drop is drawn in when the needle lies in the peritoneal cavity."],
    ],
  },
  "sur-deaver": {
    about: "Deaver's retractor is a handheld, curved, malleable retractor with a broad, smooth, gently curved blade that is wide at the tip and has a short curved handle. It is used to retract the liver, bowel and abdominal wall during laparotomy, particularly in upper abdominal operations such as cholecystectomy, gastrectomy and splenectomy. The curved shape allows the blade to hold organs away from the operating field without slipping and without injuring them. It is an easily spotted instrument because of its distinctive curved, flat blade.",
    points: [
      "Description: broad, curved, flat blade attached to a straight handle; handheld retractor.",
      "Use: retracting liver, bowel, bladder or abdominal wall in deep operations.",
      "Other retractors: Morris, Doyen's (self-retaining), Balfour (self-retaining), Czerny, Langenbeck (skin).",
      "Retractors are classified as handheld or self-retaining.",
    ],
    viva: [
      "What is Deaver's retractor used for? — Retracting the liver, bowel and abdominal wall in deep abdominal surgery.",
      "Name one self-retaining abdominal retractor. — Balfour's retractor.",
      "How do you classify retractors? — Handheld and self-retaining.",
    ],
    mcq: [
      ["The broad curved handheld retractor used in abdominal surgery is:", "Deaver's retractor", "Langenbeck's retractor", "Balfour's retractor", "Czerny's retractor", "Deaver's retractor has a wide curved blade for deep retraction."],
      ["A self-retaining abdominal retractor is:", "Balfour's retractor", "Deaver's retractor", "Langenbeck's retractor", "Skin hook", "Balfour's has side blades held apart by a frame."],
      ["Deaver's retractor is used mainly to retract:", "Liver and bowel", "Skin edge", "Nerves", "Vessels", "It holds organs away from the operative field."],
    ],
  },
  "sur-kehr-t-tube": {
    about: "Kehr's T-tube is a rubber or latex T-shaped tube used for drainage of the common bile duct (CBD) after choledochotomy. The horizontal limb lies within the duct, with one end towards the liver and the other towards the duodenum; the vertical limb passes out through the wall of the duct and the abdominal wall to drain bile into a bag. The T-tube decompresses the CBD, protects the suture line, and allows a postoperative T-tube cholangiogram (usually after 7 to 10 days) to check for retained stones. The tube is removed after about 2 to 3 weeks, once the cholangiogram is normal and a track has formed, which prevents bile leak into the peritoneum.",
    points: [
      "Description: soft rubber T-shaped tube with a long vertical limb and a short horizontal limb that lies in the bile duct.",
      "Indications: CBD exploration for stones, choledochotomy, biliary decompression.",
      "T-tube cholangiogram at 7 to 10 days; remove at around 2 to 3 weeks after the track matures.",
      "Complications: bile leak or peritonitis after removal, blockage, dislodgement, infection.",
    ],
    viva: [
      "What is a Kehr's T-tube used for? — To drain the CBD after exploration and to allow postoperative cholangiography.",
      "When is a T-tube removed? — About 2 to 3 weeks after surgery, once cholangiography shows no retained stones and the track is mature.",
      "Why should it be left for 2 to 3 weeks? — To allow a track to form and prevent bile leak into the peritoneum.",
    ],
    mcq: [
      ["The tube placed in the CBD after choledocholithotomy is:", "Kehr's T-tube", "Ryle's tube", "Foley's catheter", "Corrugated drain", "The T-tube drains the CBD and allows a cholangiogram."],
      ["A T-tube cholangiogram is usually done at about:", "7 to 10 days", "Day 1", "3 months", "6 months", "It checks for retained stones before tube removal."],
      ["A complication after early T-tube removal is:", "Bile peritonitis", "Pneumothorax", "Pulmonary embolism", "Hernia", "If the track is immature, bile may leak into the peritoneum."],
    ],
  },
  "sur-foley": {
    about: "Foley's catheter is a self-retaining urethral catheter made of latex or silicone with a balloon near the tip that is inflated with sterile water after insertion into the bladder. The catheter has two or three channels: one for urine drainage, one for balloon inflation (with a valve), and, in three-way catheters, one for irrigation. Sizes are given in French (Fr) or Charrière gauge, with each unit being one-third of a millimetre. The balloon holds the catheter in the bladder. Foley's catheters are used for urinary retention, monitoring urine output in critically ill patients, postoperative drainage, bladder irrigation (three-way for haematuria) and in urological and gynaecological surgery.",
    points: [
      "Description: a two-way (drainage and balloon) or three-way (plus irrigation) catheter with a balloon inflated with 5 to 10 mL sterile water.",
      "Size: French gauge; 1 Fr = 0.33 mm. Commonly 14 to 18 Fr in adults.",
      "Indications: acute urinary retention, strict output monitoring, perioperative drainage, bladder irrigation, immobile patients.",
      "Complications: catheter-associated urinary tract infection, urethral trauma, stricture, encrustation, bladder spasm.",
      "Inflate the balloon only after confirming urine flow to avoid urethral injury.",
    ],
    viva: [
      "What is the diameter of 1 French? — One third of a millimetre.",
      "What is the use of a three-way Foley's catheter? — Continuous bladder irrigation, for example after prostate surgery or in haematuria.",
      "When should you inflate the balloon? — After urine is seen to flow, so that you know the tip is in the bladder.",
    ],
    mcq: [
      ["A self-retaining catheter with an inflatable balloon is:", "Foley's catheter", "Nelaton catheter", "Ryle's tube", "Kehr's tube", "The balloon retains Foley's catheter in the bladder."],
      ["1 French (Fr) equals:", "0.33 mm", "1 mm", "0.5 cm", "3 mm", "One French is one-third of a millimetre."],
      ["The commonest complication of long-term catheterisation is:", "Urinary tract infection", "Hernia", "Hydrocele", "Hypertension", "Catheter-associated UTI is the commonest complication."],
    ],
  },
  "sur-kelly-speculum": {
    about: "Kelly's rectal speculum (proctoscope) is a short, tubular, hollow instrument with a flared, funnel-shaped end and a removable obturator (introducer) used for examining the anal canal and lower rectum. The obturator makes insertion easier and less painful; once in position the obturator is removed to allow inspection of the mucosa. It is used to diagnose and treat haemorrhoids (including banding and injection sclerotherapy), anal fissures, fistulae, polyps and low rectal lesions. A rigid sigmoidoscope is a longer version for examining the rectum and sigmoid colon.",
    points: [
      "Description: short hollow cylinder (proctoscope) with a removable obturator; a side-opening variant is called Hill-Ferguson's.",
      "Uses: examination of the anal canal for haemorrhoids, fissure, fistula; injection sclerotherapy and rubber band ligation.",
      "Position: left lateral (Sims) position or lithotomy; lubricate before insertion.",
      "A rigid sigmoidoscope is longer (25 cm) and is used for the rectum and lower sigmoid.",
    ],
    viva: [
      "What is a proctoscope used for? — Examining the anal canal and lower rectum and treating internal haemorrhoids.",
      "What position is used for proctoscopy? — Left lateral (Sims) or lithotomy.",
      "What is the role of the obturator? — To allow smooth, painless insertion; it is removed once the instrument is in place.",
    ],
    mcq: [
      ["The instrument used to examine the anal canal is:", "Proctoscope", "Sigmoidoscope", "Cystoscope", "Laryngoscope", "A proctoscope (Kelly's rectal speculum) examines the anal canal."],
      ["Internal haemorrhoids can be treated through a proctoscope by:", "Rubber band ligation", "Thyroidectomy", "Biopsy of the breast", "Appendicectomy", "Banding and sclerotherapy are done via a proctoscope."],
      ["The standard position for proctoscopy is:", "Left lateral", "Supine", "Prone", "Sitting", "Left lateral (Sims) gives good exposure of the anal canal."],
    ],
  },
  "sur-rubber-drain": {
    about: "A corrugated rubber sheet drain is a flat, soft rubber sheet with parallel longitudinal ridges (corrugations) used as a passive, capillary-action drain. It allows fluid, blood and pus to drain along the grooves by capillary action and gravity out of a wound or cavity into a dressing. It is placed in abscess cavities, infected wounds and after surgery when oozing is expected, such as in appendicular abscess or after drainage of a subcutaneous abscess. It is fixed to the skin with a stitch or a safety pin to prevent it from slipping inside. It is removed in 24 to 72 hours or when drainage stops, often by gradual shortening. Disadvantages are that it is open, so it can act as a route for infection, and it irritates the tissues.",
    points: [
      "Description: soft flat rubber sheet with corrugations; a passive, open drain acting by capillary action and gravity.",
      "Uses: abscess drainage, infected wounds, post-operative oozing, after appendicectomy for abscess.",
      "Secure with a suture or safety pin to prevent loss inside the wound.",
      "Closed suction drains (e.g., Redivac) are used for large collections like after mastectomy.",
    ],
    viva: [
      "How does a corrugated rubber drain work? — By capillary action and gravity along the ridges.",
      "Why is a safety pin or suture used? — To prevent the drain from slipping into the wound.",
      "Name a closed suction drain. — Redivac (Redon) drain.",
    ],
    mcq: [
      ["A drain that works by capillary action along ridges is:", "Corrugated rubber drain", "Redivac drain", "Foley's catheter", "T-tube", "The ridges on a corrugated drain allow capillary drainage."],
      ["A passive drain should be fixed to the skin to prevent:", "Slipping into the wound", "Infection of the blood", "Bleeding", "Allergy", "A pin or stitch prevents the drain from being lost inside."],
      ["Which is a closed suction drain?", "Redivac drain", "Corrugated drain", "Penrose drain", "Cigarette drain", "Redivac uses vacuum suction in a closed system."],
    ],
  },
  "sur-ryle": {
    about: "Ryle's tube is a thin, flexible, single-lumen rubber or plastic nasogastric tube with a weighted tip (a small metal bead) and several side holes near the end. It is passed through the nose into the stomach to aspirate gastric contents (gastric decompression), to feed patients (enteral nutrition), to give medication, and to lavage the stomach in poisoning. It carries length markings (about 45, 55 and 65 cm from the tip) so that the depth of insertion can be checked; around 50 to 60 cm usually places the tip in the stomach. The position is confirmed by aspirating gastric juice and testing it with blue litmus paper (turns red, pH below 5.5) or by chest or abdominal X-ray. Complications include nasal trauma, aspiration pneumonia, misplacement into the airway and oesophageal perforation.",
    points: [
      "Description: long thin rubber tube with a weighted tip and holes near the end; marked with length measurements.",
      "Uses: gastric decompression in intestinal obstruction, feeding, drug administration, gastric lavage, collecting gastric aspirate.",
      "Check position: aspirate and test pH, X-ray if in doubt; never start feeding without confirming position.",
      "Contraindications: base-of-skull fracture, severe facial trauma (use orogastric route).",
      "Complications: aspiration, sinusitis, nasal necrosis, oesophageal injury.",
    ],
    viva: [
      "What is Ryle's tube used for? — Gastric decompression, feeding, drug administration and lavage.",
      "How do you confirm position? — Aspirate gastric contents and test with litmus paper (acidic), and check with an X-ray if in doubt.",
      "When is it contraindicated? — Base-of-skull fracture or severe facial trauma (use the oral route).",
    ],
    mcq: [
      ["A nasogastric tube with a weighted tip is:", "Ryle's tube", "Foley's catheter", "Kehr's tube", "Corrugated drain", "Ryle's tube is the standard nasogastric tube."],
      ["Gastric aspirate turns blue litmus paper:", "Red", "Blue", "Green", "Colourless", "Gastric juice is acidic and turns blue litmus red."],
      ["A contraindication to a nasogastric tube is:", "Base-of-skull fracture", "Intestinal obstruction", "Acute pancreatitis", "Poisoning", "A nasal tube could enter the cranium in a basal skull fracture."],
    ],
  },
  "sur-urobag": {
    about: "A Urobag is a sterile, disposable urine collection bag connected to an indwelling urinary catheter through a drainage tube. It has a non-return (anti-reflux) valve at the top to prevent urine from flowing back to the bladder, a drainage tap at the bottom for emptying, a sampling port and graduated markings to measure the volume. The bag must always be kept below the level of the bladder to prevent backflow. The bag is a closed system, which reduces the risk of catheter-associated urinary tract infection (CAUTI). It is changed according to protocol, usually every 5 to 7 days or when contaminated, and emptied at intervals to monitor hourly or daily urine output.",
    points: [
      "Description: transparent collection bag with a tubing, a non-return valve, a drainage tap and graduations.",
      "Uses: collecting urine from a Foley's catheter, measuring urine output, closed drainage.",
      "Keep below bladder level, avoid the bag touching the floor, and do not disconnect the closed system unnecessarily.",
      "Complications: CAUTI, reflux of urine when the bag is lifted above the bladder.",
    ],
    viva: [
      "What is the purpose of the non-return valve in a Urobag? — To prevent backflow of urine into the tubing and bladder.",
      "Where should the bag be kept? — Below the level of the bladder.",
      "How can CAUTI be reduced? — Using a closed drainage system, aseptic technique, removing the catheter as early as possible.",
    ],
    mcq: [
      ["The Urobag is connected to:", "An indwelling urinary catheter", "A Ryle's tube", "A chest drain", "A T-tube", "It collects urine from a urinary catheter."],
      ["The bag must be kept:", "Below the bladder level", "Above the bladder level", "On the pillow", "On the chest", "Keeping it below prevents backflow and infection."],
      ["The most important preventive step to reduce CAUTI is:", "Removing the catheter early", "Changing it daily", "Irrigating the bladder daily", "Using a larger catheter", "Early removal reduces infection risk."],
    ],
  },
  "sur-bp-handle": {
    about: "The Bard-Parker (BP) handle is a re-usable scalpel handle that carries a detachable, disposable blade. The handle has a slot at the tip into which the blade is slid and locked, and it is available as No. 3 (small blades 10, 11, 12, 15) and No. 4 (larger blades 20, 21, 22, 23, 24). Blade No. 10 and 15 are used for skin incisions and general surgery, No. 11 is a pointed blade for stab incisions (abscess, drain), No. 12 is a hooked blade (tonsil, suture removal), and Nos. 20 to 24 are large blades for deeper and larger incisions. The blade is loaded and removed using a needle holder or artery forceps, never with fingers, to prevent injury.",
    points: [
      "Handles: No. 3 (blades 10, 11, 12, 15) and No. 4 (blades 20 to 24).",
      "Blades: 11 for stab incisions (abscess), 15 for fine cuts, 10 and 22 for skin and larger incisions, 12 for hooking suture removal.",
      "Load and remove the blade with a needle holder, never with the fingers.",
      "Pass the scalpel with the blade facing away, using a kidney dish (neutral zone) to avoid sharps injury.",
    ],
    viva: [
      "Which blade is used for incision and drainage of an abscess? — Blade No. 11.",
      "How do you load a blade onto a BP handle? — Grip the blade with a needle holder and slide it onto the slot of the handle.",
      "What are the two sizes of BP handle? — No. 3 and No. 4.",
    ],
    mcq: [
      ["The scalpel blade used for incision and drainage of an abscess is:", "No. 11", "No. 22", "No. 10", "No. 24", "Blade No. 11 is a pointed stab blade."],
      ["Blades 20 to 24 fit which handle?", "No. 4", "No. 3", "No. 7", "No. 5", "No. 4 handles carry the larger blades."],
      ["The safe way to load a scalpel blade is:", "With a needle holder", "With the fingers", "With a towel clip", "With a scissors", "A needle holder prevents injury to the fingers."],
    ],
  },
  "sur-trocar": {
    about: "A laparoscopic trocar and cannula (port) system is used to gain access to the peritoneal cavity for laparoscopic surgery. The trocar is a sharp (pyramidal or conical) or blunt obturator that is inserted through a cannula (hollow tube with a valve). Once the cannula is in place, the trocar is withdrawn and the cannula allows instruments and the camera to pass in and out while maintaining pneumoperitoneum; a gas port on the cannula allows CO2 insufflation. Ports come in 5 mm, 10 mm and 12 mm sizes. A standard laparoscopic cholecystectomy uses four ports. Safe insertion uses the open (Hasson) technique or a closed Veress technique, and the first port is placed at the umbilicus. Visceral and vascular injuries are the dreaded complications.",
    points: [
      "Description: a sharp or blunt obturator (trocar) within a hollow cannula (sleeve) with a valve and gas port.",
      "Sizes: 5, 10 and 12 mm. The 10 mm port at the umbilicus usually carries the camera.",
      "Pneumoperitoneum pressure: 12 to 15 mmHg with CO2.",
      "Complications: bowel or vessel injury, port-site hernia, port-site infection, bleeding from the epigastric vessels.",
    ],
    viva: [
      "What is a trocar and what is a cannula? — The trocar is the sharp or blunt obturator used to puncture; the cannula is the hollow tube left in place to pass instruments.",
      "How many ports are used in a standard laparoscopic cholecystectomy? — Four.",
      "What is a port-site hernia and how is it prevented? — A hernia at the port site; prevented by closing the fascia at 10 mm or larger ports.",
    ],
    mcq: [
      ["The hollow tube left in the abdominal wall for passing laparoscopic instruments is the:", "Cannula (port)", "Veress needle", "Foley's catheter", "T-tube", "The cannula maintains access while the trocar is withdrawn."],
      ["Port-site hernias are most likely at:", "10 mm and larger ports", "5 mm ports", "No ports", "Only the umbilicus in thin patients", "Fascia should be closed at 10 mm or larger ports."],
      ["The usual intra-abdominal pressure in laparoscopy is:", "12 to 15 mmHg", "1 to 2 mmHg", "30 to 40 mmHg", "60 mmHg", "12 to 15 mmHg gives adequate exposure without compromising venous return."],
    ],
  },
  "sur-maryland": {
    about: "The Maryland dissector is a laparoscopic instrument with long, slender, curved jaws used for fine dissection and grasping of tissue in laparoscopic surgery. It has a rotating shaft and curved, tapered, serrated jaws that are insulated, so monopolar diathermy can be applied through the instrument for coagulation. The curved tip allows careful dissection around the cystic duct and artery in laparoscopic cholecystectomy and spreading of tissue planes in other laparoscopic procedures. It is passed through a 5 mm port and is available as reusable or disposable.",
    points: [
      "Description: long laparoscopic instrument with curved, tapered jaws on an insulated shaft; ratchet handle with a diathermy connection.",
      "Use: fine dissection, spreading and grasping of tissue, and diathermy dissection in laparoscopic cholecystectomy (Calot's triangle).",
      "A fenestrated grasper is used for holding and a Maryland for dissection.",
      "Insulation faults can cause stray burns; check the shaft integrity.",
    ],
    viva: [
      "What is a Maryland dissector used for? — Fine dissection of tissue and spreading planes in laparoscopic surgery.",
      "Which area is dissected with it in laparoscopic cholecystectomy? — Calot's triangle (hepatocystic triangle).",
      "Why is the shaft insulated? — To allow monopolar diathermy without injuring surrounding structures.",
    ],
    mcq: [
      ["A laparoscopic instrument with curved tapered jaws for fine dissection is:", "Maryland dissector", "Veress needle", "Trocar", "Foley's catheter", "The Maryland dissector is used for fine dissection."],
      ["Calot's triangle is dissected during:", "Laparoscopic cholecystectomy", "Appendicectomy", "Hernia repair", "Thyroidectomy", "Calot's triangle contains the cystic artery and duct."],
      ["A Maryland dissector is usually passed through a:", "5 mm port", "20 mm port", "Chest drain", "Spinal needle", "It is a 5 mm instrument."],
    ],
  },
}
