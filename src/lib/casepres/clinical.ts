import { KB2 } from './clinical2'
/**
 * Clinical knowledge base for Case Presentation.
 * Each entry matches a finding label (regex) and can carry:
 *  - how / why: for TESTS (shown as a procedure card)
 *  - p / a: what it MEANS when present (positive) / absent (negative)
 *  - detail / chips: prompt and quick-fill suggestions for elaborating a positive finding
 */
export type Kb = {
  m: RegExp
  name?: string
  how?: string
  why?: string
  pt?: string
  at?: string
  p?: string
  a?: string
  detail?: string
  chips?: string[]
}

export const DEFAULT_DETAIL = "Site, extent, size, character (optional)"

export const KB: Kb[] = [
  // ---------- Varicose veins and venous disease ----------
  {
    m: /^Dilated tortuous veins/i,
    detail: "Site and extent of the veins",
    chips: ["Medial side of thigh and leg (long saphenous territory)", "Posterolateral side of calf (short saphenous territory)", "Along the whole length of the long saphenous vein, groin to ankle", "Below the knee only", "Both long and short saphenous territories", "Reticular veins and telangiectasia only"],
    p: "Elongated, dilated, tortuous superficial veins indicate varicose veins from valvular incompetence. Long saphenous territory runs on the medial side, short saphenous on the posterolateral calf.",
  },
  { m: /^Medial side \(long saphenous\)/i, p: "Veins along the medial side follow the long (great) saphenous vein, pointing to saphenofemoral junction or perforator incompetence.", detail: "Level: thigh, knee, leg" },
  { m: /^Posterolateral side \(short saphenous\)/i, p: "Veins on the posterolateral calf follow the short saphenous vein, pointing to saphenopopliteal junction incompetence.", detail: "Level and extent" },
  { m: /^Limb swelling/i, p: "Oedema of the limb suggests chronic venous insufficiency; confirm that the deep veins are patent (Perthes test).", detail: "Extent (foot, ankle, leg), pitting or non-pitting" },
  { m: /^Pigmentation/i, p: "Haemosiderin deposition from extravasated red cells in chronic venous hypertension, typically in the gaiter area (lower third of the leg, medial side).", detail: "Site and extent", chips: ["Gaiter area, medial side", "Whole of the lower third of the leg", "Around the medial malleolus"] },
  { m: /^Eczema/i, p: "Venous (stasis) eczema caused by chronic venous hypertension.", detail: "Site and extent" },
  { m: /^Lipodermatosclerosis/i, p: "Fibrosis of skin and fat from chronic venous hypertension; gives the 'inverted champagne bottle' leg. Advanced venous disease.", detail: "Site and extent" },
  { m: /^Venous ulcer/i, p: "Typically over the medial malleolus (gaiter area), shallow with sloping edge: caused by venous hypertension from incompetent valves.", detail: "Site, size, edge, floor, discharge", chips: ["Medial malleolus, shallow, sloping edge", "Lower third of leg, medial side"] },
  { m: /^Atrophie blanche/i, p: "White, atrophic scar-like patches with surrounding telangiectasia; a sign of advanced venous disease." },
  { m: /^Ischaemic changes/i, p: "Signs of arterial insufficiency in the limb. Assess the arterial supply before compression or surgery." },
  { m: /^Healed scar/i, p: "Previous ulcer or surgery; suggests long-standing venous disease or previous venous surgery.", detail: "Site and size" },
  {
    m: /Morrissey/i, name: "Morrissey's cough impulse",
    how: "With the patient standing, place your fingers over the saphenofemoral junction (about 4 cm below and lateral to the pubic tubercle) and ask the patient to cough.",
    why: "To check whether the saphenofemoral junction valve is competent.",
    p: "A palpable impulse is transmitted down the vein: the saphenofemoral junction valve is incompetent.",
    a: "No impulse felt: the saphenofemoral junction valve is competent.",
  },
  {
    m: /Cough impulse at saphenofemoral/i, name: "Cough impulse at the saphenofemoral junction",
    how: "With the patient standing, place your fingers over the saphenofemoral junction and ask the patient to cough.",
    why: "To check whether the saphenofemoral junction valve is competent.",
    p: "A palpable impulse is transmitted down the vein: the saphenofemoral junction valve is incompetent.",
    a: "No impulse felt: the saphenofemoral junction valve is competent.",
  },
  {
    m: /Trendelenburg test I positive/i, name: "Trendelenburg test I (release test)",
    how: "Lay the patient flat and raise the limb to empty the veins. Press firmly with the thumb over the saphenofemoral junction (or apply a tourniquet high on the thigh). Ask the patient to stand while the pressure is maintained, then release it suddenly and watch the veins for 30 seconds.",
    why: "To find out whether the saphenofemoral junction valve is incompetent and is the source of reflux into the long saphenous vein.",
    p: "Rapid filling of the veins from above on release (retrograde flow): the saphenofemoral junction is incompetent.",
    a: "Veins fill slowly from below only: the saphenofemoral junction valve is competent.",
  },
  {
    m: /Trendelenburg test II positive/i, name: "Trendelenburg test II (filling during compression)",
    how: "Set up as for test I, but watch the veins during the 30 seconds while the pressure over the saphenofemoral junction is still held, before releasing it.",
    why: "To detect incompetent perforating veins (or short saphenous reflux) below the level of the compression.",
    p: "Veins fill rapidly from below despite compression: perforators (or the short saphenous system) below the level of occlusion are incompetent.",
    a: "Veins stay collapsed during compression: perforators below the level of occlusion are competent.",
  },
  {
    m: /^Tourniquet test positive/i, name: "Tourniquet test",
    how: "Raise the limb to empty the veins, apply a tourniquet around the upper thigh just below the saphenofemoral junction, then ask the patient to stand and walk. Watch the veins for 30 seconds, then release the tourniquet.",
    why: "To find the level of incompetence: above the tourniquet (saphenofemoral junction) or below it (perforators).",
    p: "Veins fill from below while the tourniquet is on: incompetent perforators below it. Veins fill only after release: saphenofemoral junction incompetence.",
    a: "Veins stay collapsed until the tourniquet is released: perforators below it are competent.",
  },
  {
    m: /^Perthes test/i, name: "Perthes test", pt: "Deep veins patent", at: "Deep veins not patent",
    how: "With the patient standing, apply a tourniquet around the upper thigh to occlude the superficial veins, then ask the patient to walk briskly (or do toe raises) for about 5 minutes. Watch the varicosities and ask about pain.",
    why: "To confirm that the deep venous system is patent before any superficial surgery (ligation, stripping).",
    p: "Varicosities empty or shrink and there is no pain: the deep veins are patent and the perforators are competent, so superficial surgery is safe.",
    a: "Veins become more prominent and the leg aches (bursting pain): deep vein obstruction (e.g., post-DVT). Superficial surgery is contraindicated.",
  },
  {
    m: /^Schwartz test/i, name: "Schwartz (tap) test",
    how: "With the patient standing, place one hand on the upper part of a varicose vein and tap the lower part with a finger of the other hand.",
    why: "To show continuity of the column of blood through incompetent valves.",
    p: "A tap impulse is felt over the upper part: the valves along that segment of vein are incompetent.",
    a: "No impulse is transmitted: valves in that segment are competent.",
  },
  {
    m: /^Fegan/i, name: "Fegan's test (palpation for perforator defects)",
    how: "With the patient standing, mark the varicose veins and run your fingertips along the course of the vein, feeling for round gaps (blow-outs) in the deep fascia.",
    why: "To locate the sites of incompetent perforating veins for surgical marking.",
    p: "A palpable gap in the deep fascia (often with a bulge on standing) marks the site of an incompetent perforator.",
    a: "No fascial defects felt: no clinically palpable perforator incompetence.",
  },
  {
    m: /^Multiple tourniquet test/i, name: "Multiple tourniquet test",
    how: "Empty the veins with the limb raised, apply tourniquets at several levels (upper thigh, above the knee, below the knee), then ask the patient to stand and watch which segment fills.",
    why: "To localise the level of incompetent perforators in segments of the limb.",
    p: "The segment that fills rapidly from below between two tourniquets contains an incompetent perforator.",
    a: "No segment fills rapidly: no incompetent perforators detected.",
  },
  {
    m: /^Pratt/i, name: "Pratt's test",
    how: "Raise the limb, wrap an elastic bandage from toes to groin, apply a tourniquet at the groin, then stand the patient and remove the bandage from above downward while a second bandage is wound from the top downward, leaving a gap. Watch for bulges in the gap.",
    why: "To locate the sites of incompetent perforators.",
    p: "A bulge in the gap between the two bandages marks an incompetent perforator at that level.",
    a: "No bulge appears: no perforator incompetence found at the levels tested.",
  },

  // ---------- General swelling tests ----------
  {
    m: /^Transillumination|^Transilluminant/i, name: "Transillumination",
    how: "In a dark room, press a pen torch against one side of the swelling and look from the opposite side.",
    why: "To separate clear-fluid swellings from solid or blood-filled ones.",
    p: "The swelling glows red: it contains clear fluid (hydrocele, cyst, cystic hygroma).",
    a: "The swelling is opaque: solid mass, blood, pus, or bowel (tumour, haematocele, hernia).",
  },
  {
    m: /^Fluctuant|^Fluctuation/i, name: "Fluctuation",
    how: "Place two fingers on opposite sides of the swelling. Press down with one and watch whether the other finger lifts; repeat at right angles to the first direction.",
    why: "To confirm that the swelling contains fluid.",
    p: "Fluctuation is positive in two planes: the swelling contains fluid (abscess, cyst, haematoma).",
    a: "No fluctuation: the swelling is solid or the fluid is under tension.",
  },
  {
    m: /^Pulsatile/i, name: "Pulsation",
    how: "Place a finger of each hand on opposite sides of the swelling and see whether the fingers are pushed apart with each beat.",
    why: "To separate an expansile pulsation (aneurysm) from a transmitted pulsation (mass lying on an artery).",
    p: "Expansile pulsation: the swelling is vascular (e.g., aneurysm).",
    a: "No pulsation, or only transmitted pulsation.",
  },
  {
    m: /^Compressible/i, name: "Compressibility",
    how: "Press gently on the swelling and release; watch whether it reduces in size and refills.",
    why: "To identify swellings that communicate with a vascular space or a body cavity.",
    p: "The swelling empties on pressure and refills on release: haemangioma, vascular malformation, lymphangioma or hernia.",
    a: "Not compressible: solid, or cyst with no communication.",
  },
  {
    m: /^Reducible$|^Reducible/i, name: "Reducibility",
    how: "Lie the patient down (or elevate the part) and gently push the contents back through the opening.",
    why: "To find out whether the contents can return to the cavity of origin.",
    p: "The swelling reduces with a gurgle or slip: a reducible hernia (no obstruction or strangulation).",
    a: "Irreducible: adhesions, obstructed or strangulated hernia, or not a hernia.",
  },
  {
    m: /^Cough impulse(?! at)/i, name: "Cough impulse",
    how: "Place your fingers on the swelling and ask the patient to cough (or strain).",
    why: "To find out whether the swelling communicates with the abdominal cavity.",
    p: "An expansile impulse is felt: it communicates with the abdomen (hernia, or saphena varix in the groin).",
    a: "No impulse: no communication with the abdominal cavity.",
  },
  { m: /^Can get above the swelling/i, p: "The upper limit of the swelling can be reached: it arises from the scrotum or limb and is not an inguinal hernia coming through the canal." },
  { m: /^Mobile in all directions/i, p: "Free mobility suggests a benign, encapsulated swelling (lipoma, cyst, fibroadenoma)." },
  { m: /^Fixed to (skin|underlying)/i, p: "Fixation to skin or deeper structures suggests infiltration (malignancy) or inflammatory adhesion.", detail: "What is it fixed to, and over what extent" },
  { m: /^Regional lymph nodes enlarged|^Lymph nodes palpable|^Nodes (hard|matted|tender)|Lymphadenopathy/i, detail: "Group, size, number, consistency, mobility, tenderness", p: "Enlarged nodes suggest infection or lymphatic spread of a tumour; hard, fixed, matted nodes favour malignancy or tuberculosis." },

  // ---------- Hernia ----------
  {
    m: /Deep ring occlusion test: controls/i, name: "Deep ring occlusion test", pt: "Controlled", at: "Not controlled",
    how: "Reduce the hernia with the patient lying down. Press firmly over the deep inguinal ring (just above the mid-inguinal point), then ask the patient to stand and cough while you keep the pressure on.",
    why: "To tell an indirect inguinal hernia from a direct one.",
    p: "The hernia does not appear while the deep ring is blocked: it is an indirect inguinal hernia.",
    a: "The hernia still appears: it is likely direct.",
  },
  {
    m: /Deep ring occlusion test: does not control/i, name: "Deep ring occlusion test", pt: "Not controlled", at: "Controlled",
    how: "Reduce the hernia with the patient lying down. Press firmly over the deep inguinal ring, then ask the patient to stand and cough while keeping the pressure on.",
    why: "To tell an indirect inguinal hernia from a direct one.",
    p: "The hernia bulges despite pressure on the deep ring: it is a direct inguinal hernia.",
    a: "The hernia is controlled: indirect inguinal hernia.",
  },
  {
    m: /^Zieman/i, name: "Zieman's test",
    how: "With the patient standing, place the index, middle and ring fingers over the superficial ring, deep ring and femoral canal, and ask the patient to cough.",
    why: "To identify which orifice the hernia protrudes through, especially when more than one is suspected.",
    p: "The impulse under the finger identifies the hernia: deep ring = indirect, superficial ring = direct, femoral canal = femoral hernia.",
  },
  {
    m: /^Invagination test/i, name: "Invagination test",
    how: "Invaginate the scrotal skin with your little finger along the spermatic cord into the superficial ring, then ask the patient to cough.",
    why: "To confirm an inguinal hernia and judge its type.",
    p: "An impulse felt on the tip of the finger indicates an indirect hernia; on the pulp indicates a direct hernia.",
  },
  { m: /^Finger tip test/i, name: "Finger tip test", how: "With the little finger in the inguinal canal, ask the patient to cough and feel which part of the finger the impulse strikes.", why: "To differentiate indirect from direct hernia.", p: "Impulse on the tip: indirect. Impulse on the pulp: direct." },
  { m: /^Superficial ring dilated/i, p: "A dilated superficial ring suggests an established inguinal hernia." },
  { m: /^Prehn/i, name: "Prehn's sign", how: "Gently lift the painful testis up towards the pubic symphysis and ask whether the pain changes.", why: "To separate epididymo-orchitis from testicular torsion.", p: "Pain relieved on elevation: epididymo-orchitis.", a: "Pain not relieved (or worse): testicular torsion until proved otherwise." },
  { m: /^Cremasteric reflex absent/i, name: "Cremasteric reflex", pt: "Absent", at: "Present", how: "Stroke the skin of the upper inner thigh with a blunt object and watch the testis on that side.", why: "To test the L1-L2 reflex arc and screen for testicular torsion.", p: "Reflex absent: suspect testicular torsion (a surgical emergency) or a lesion of the L1-L2 reflex arc.", a: "Testis rises normally." },
  { m: /^Pemberton/i, name: "Pemberton's sign", how: "Ask the patient to raise both arms above the head and hold them there for about a minute. Watch for facial flushing, dilated neck veins and stridor.", why: "To detect thoracic inlet obstruction by a retrosternal goitre.", p: "Facial congestion, distended neck veins, and stridor appear: thoracic inlet obstruction by a retrosternal goitre.", a: "No change: no thoracic inlet obstruction." },
  // ---------- Breast ----------
  { m: /^Peau d.orange/i, p: "Lymphatic oedema of the skin from obstruction of dermal lymphatics: suggests locally advanced carcinoma.", detail: "Extent", chips: ["Over the lump only", "Over the whole breast"] },
  { m: /^Skin dimpling/i, p: "Tethering of the skin to the tumour through Cooper's ligaments: suggests carcinoma.", detail: "Site; seen on arm raising?" },
  { m: /^Nipple retraction/i, p: "Shortening of the lactiferous ducts by tumour or duct ectasia. Recent retraction raises suspicion of malignancy." },
  { m: /^Nipple discharge/i, p: "Bloody discharge suggests duct papilloma or carcinoma; milky discharge suggests galactorrhoea; purulent suggests abscess.", detail: "Colour, single or multiple ducts, spontaneous or expressed" },
  { m: /^Nipple eczema/i, p: "Eczema of the nipple that does not heal: think of Paget's disease of the breast." },
  { m: /^Lump moves on raising the arm/i, p: "A lump that becomes fixed or less mobile on tightening the pectoralis (hands on hips) is attached to the pectoral fascia or muscle." },

  // ---------- Thyroid ----------
  { m: /^Moves with deglutition/i, name: "Movement with swallowing", how: "Ask the patient to take a sip of water and swallow while you watch and feel the swelling.", why: "The thyroid is attached to the pretracheal fascia and rises with the larynx on swallowing.", p: "Swelling moves up with swallowing: it belongs to the thyroid (or a thyroglossal cyst).", a: "No movement with swallowing: not thyroid in origin." },
  { m: /protrusion of tongue/i, name: "Movement with tongue protrusion", how: "Ask the patient to stick out the tongue while you watch the swelling.", why: "A thyroglossal cyst is attached to the hyoid via the thyroglossal duct.", p: "Swelling moves up on tongue protrusion: thyroglossal cyst (a thyroid swelling does not).", a: "Does not move: not a thyroglossal cyst." },
  { m: /^Retrosternal extension/i, p: "The lower border cannot be seen or felt: part of the goitre lies in the thorax; look for Pemberton's sign and tracheal compression." },
  { m: /^Can get below the swelling/i, p: "Lower border can be reached: no retrosternal extension." },
  { m: /Berry/i, name: "Berry's sign", pt: "Negative", at: "Positive", how: "Palpate for the common carotid pulsation over the lateral lobe of the thyroid.", why: "To look for infiltration of the carotid sheath by thyroid cancer.", p: "Carotid pulsations are felt over the swelling: no invasion of the carotid sheath.", a: "Carotid pulsations are absent over the lobe: suggests malignant infiltration." },
  { m: /Carotid pulsations felt/i, p: "Pulsations are palpable: carotid sheath not involved by the thyroid swelling (Berry's sign negative)." },
  { m: /^Lid retraction/i, p: "Sclera visible above the iris because of sympathetic overactivity or Graves' orbitopathy: thyrotoxicosis." },
  { m: /^Lid lag/i, name: "Lid lag (von Graefe's sign)", how: "Ask the patient to follow your finger as it moves slowly downward from above eye level, keeping the head still.", why: "To detect sympathetic overactivity of Muller's muscle.", p: "The upper lid lags behind the eyeball: thyrotoxicosis.", a: "Lid follows smoothly." },
  { m: /^Joffroy/i, name: "Joffroy's sign", pt: "Absent forehead wrinkling", at: "Forehead wrinkles", how: "Ask the patient to look up without moving the head and look for forehead wrinkling.", why: "To check for the effect of thyrotoxicosis on frontalis function.", p: "Forehead does not wrinkle on upward gaze: thyrotoxicosis." },
  { m: /^Moebius/i, name: "Moebius' sign", how: "Ask the patient to follow your finger as you bring it close to the nose.", why: "To test convergence.", p: "Poor convergence: Graves' disease." },
  { m: /^Exophthalmos|^Proptosis/i, p: "Forward displacement of the eyeball from retro-orbital inflammation: Graves' orbitopathy (or orbital tumour or sinus disease).", detail: "Unilateral or bilateral; degree" },
  { m: /^Ophthalmoplegia/i, p: "Extra-ocular muscle involvement in Graves' orbitopathy." },
  { m: /Staring look|infrequent blinking/i, p: "Staring look from lid retraction: thyrotoxicosis." },
  { m: /^Fine tremors/i, name: "Fine tremors of the outstretched hands", how: "Ask the patient to stretch both hands out in front with fingers apart; rest a sheet of paper on the dorsum.", why: "To detect sympathetic overactivity.", p: "Fine, rapid tremor: thyrotoxicosis." },
  { m: /^Warm sweaty palms|^Warm moist skin/i, p: "Increased heat production from raised metabolic rate: thyrotoxicosis." },
  { m: /^Pretibial myxoedema/i, p: "Infiltrative dermopathy of Graves' disease (non-pitting thickening over the shins)." },
  { m: /^Thyroid acropachy/i, p: "Clubbing with periosteal new bone in Graves' disease." },
  { m: /^Delayed ankle jerk relaxation/i, name: "Ankle jerk relaxation", how: "Tap the Achilles tendon with the ankle dorsiflexed and watch how fast the foot relaxes.", why: "To look for slowed muscle relaxation.", p: "Slow relaxation phase (Woltman's sign): hypothyroidism." },

  // ---------- Abdomen ----------
  { m: /^Murphy/i, name: "Murphy's sign", how: "Place your fingers firmly under the right costal margin at the tip of the ninth costal cartilage. Ask the patient to breathe in deeply.", why: "To detect gallbladder inflammation.", p: "The patient stops inspiring because of pain: acute cholecystitis.", a: "No pain on deep inspiration." },
  { m: /^McBurney/i, p: "Tenderness at McBurney's point (one-third from the right ASIS to the umbilicus): acute appendicitis.", detail: "Severity, rebound, guarding" },
  { m: /^Rovsing/i, name: "Rovsing's sign", how: "Press deeply in the left iliac fossa and watch for pain in the right iliac fossa.", why: "To detect peritoneal irritation in the right iliac fossa.", p: "Pain in the right iliac fossa on left-sided pressure: appendicitis.", a: "No referred pain." },
  { m: /^Rebound tenderness/i, name: "Rebound tenderness", how: "Press slowly and deeply over the area, then release suddenly.", why: "To detect parietal peritoneal inflammation.", p: "Pain worse on release: peritonitis.", a: "No pain on release." },
  { m: /^Guarding/i, p: "Involuntary contraction of abdominal wall muscles over an inflamed peritoneum: peritonitis (localised or generalised).", detail: "Site and extent" },
  { m: /^Rigidity$/i, p: "Board-like, persistent muscle contraction: generalised peritonitis (e.g., hollow viscus perforation)." },
  { m: /Courvoisier/i, p: "A palpable, non-tender gallbladder with jaundice suggests malignant biliary obstruction (Courvoisier's law), e.g., carcinoma of the head of the pancreas." },
  { m: /^Shifting dullness/i, name: "Shifting dullness", how: "Percuss from the midline towards the flank until the note turns dull. Keep the finger there, roll the patient to the opposite side, wait 30 seconds and percuss again.", why: "To detect free fluid in the peritoneal cavity.", p: "The dull note becomes resonant on turning: free fluid (ascites).", a: "The note does not shift: no significant free fluid." },
  { m: /^Fluid thrill/i, name: "Fluid thrill", how: "Place the palm of one hand on one flank, ask an assistant (or the patient) to press the edge of a hand firmly on the midline, and flick the opposite flank with a finger of the other hand.", why: "To detect large-volume ascites.", p: "A thrill is felt by the palm: large-volume ascites.", a: "No thrill." },
  { m: /^Tidal percussion/i, p: "Positive in massive ascites when the usual percussion tests are difficult to interpret." },
  { m: /^Caput medusae/i, p: "Dilated veins radiating from the umbilicus: portosystemic collaterals in portal hypertension." },
  { m: /^Dilated veins/i, p: "Dilated veins on the abdomen: check the direction of flow (IVC obstruction: upward; portal hypertension: away from the umbilicus).", detail: "Site, direction of flow" },
  { m: /^Succussion splash/i, name: "Succussion splash", how: "Place the stethoscope over the epigastrium and shake the patient gently by the shoulders (or rock the abdomen).", why: "To detect fluid and gas in a dilated stomach.", p: "A splashing sound is heard hours after a meal: gastric outlet obstruction.", a: "No splash." },
  { m: /^Visible gastric peristalsis/i, p: "Waves moving from left to right across the upper abdomen: gastric outlet obstruction (e.g., pyloric stenosis)." },
  { m: /^Visible intestinal peristalsis/i, p: "Ladder pattern of peristalsis: intestinal obstruction." },
  { m: /^Fetor hepaticus/i, p: "Sweet, musty breath of hepatic failure." },
  { m: /^Liver dullness obliterated/i, p: "Free gas under the diaphragm: hollow viscus perforation (or severe hyperinflation)." },
  { m: /^Palpable liver|^Hepatomegaly/i, detail: "Size below the costal margin (cm), edge, surface, tenderness", p: "Hepatomegaly: consider congestion, hepatitis, cirrhosis, malignancy, abscess." },
  { m: /^Palpable spleen|^Splenomegaly/i, detail: "Size below the costal margin (cm), notch, consistency", p: "Splenomegaly: consider portal hypertension, haemolysis, infection, haematological malignancy." },
  { m: /^Palpable kidney/i, detail: "Side, size, ballotable?" },
  { m: /^Palpable mass|^Visible mass|^Palpable lump/i, detail: "Site, size, shape, surface, edge, consistency, mobility", chips: ["Right iliac fossa", "Left iliac fossa", "Epigastrium", "Umbilical region", "Right hypochondrium", "Hypogastrium"] },

  // ---------- Vascular ----------
  { m: /^Buerger.s test positive/i, name: "Buerger's test", how: "With the patient lying down, raise the limb to about 45 degrees and watch the foot for pallor. Then ask the patient to sit with the legs hanging down and watch the colour change.", why: "To assess the severity of arterial insufficiency.", p: "Pallor on elevation and a delayed reactive redness (rubor) on hanging down: significant arterial insufficiency.", a: "Normal colour on both manoeuvres." },
  { m: /^Buerger.s angle reduced/i, p: "A small Buerger's angle (below 30 degrees) indicates severe arterial insufficiency; below 20 degrees means critical ischaemia." },
  { m: /capillary refill delayed|^Delayed capillary refill/i, name: "Capillary refill", how: "Press a nail bed for 5 seconds and release; count how long the colour takes to return.", why: "To assess peripheral perfusion.", p: "Refill takes more than 2 seconds: poor peripheral perfusion." },
  { m: /^Venous filling time prolonged/i, p: "Slow refilling of dorsal foot veins after elevation: arterial insufficiency." },
  { m: /^Pallor on elevation/i, p: "Blanching of the foot on elevation: arterial insufficiency." },
  { m: /^Rubor on dependency/i, p: "Reactive redness on hanging down: chronic ischaemia with capillary dilatation." },
  { m: /^Gangrene/i, p: "Dry gangrene suggests chronic arterial ischaemia; wet gangrene implies infection superimposed.", detail: "Site, extent, line of demarcation" },
  { m: /^Allen test abnormal/i, name: "Allen's test", how: "Compress the radial and ulnar arteries at the wrist, ask the patient to open and close the fist until the hand is pale, release one artery, and watch the hand flush.", why: "To check collateral circulation through the palmar arches.", p: "Delayed colour return: incompetent collateral supply.", a: "Prompt flushing: good collateral supply." },
  { m: /^Femoral bruit/i, p: "A bruit over the femoral artery implies turbulent flow from arterial stenosis." },
  { m: /Abdominal aortic aneurysm palpable/i, p: "An expansile pulsatile mass in the abdomen: abdominal aortic aneurysm; risk of rupture." },
  { m: /^Carotid bruit|^Bruit over carotids/i, p: "A bruit over the carotid suggests carotid artery stenosis; risk of stroke or TIA." },

  // ---------- Neurology ----------
  { m: /^Neck stiffness/i, name: "Neck stiffness", how: "With the patient lying supine, place a hand behind the head and gently flex the neck, trying to bring the chin to the chest.", why: "To detect meningeal irritation.", p: "Resistance to neck flexion with pain: meningeal irritation (meningitis, subarachnoid haemorrhage).", a: "Neck flexes freely." },
  { m: /^Kernig/i, name: "Kernig's sign", how: "With the patient supine, flex the hip and knee to 90 degrees and then try to extend the knee.", why: "To detect meningeal irritation.", p: "Pain and resistance to extending the knee: meningitis or subarachnoid haemorrhage.", a: "Knee extends freely." },
  { m: /^Brudzinski/i, name: "Brudzinski's sign", how: "With the patient supine, passively flex the neck and watch the hips and knees.", why: "To detect meningeal irritation.", p: "The hips and knees flex involuntarily: meningeal irritation.", a: "No flexion of the legs." },
  { m: /Plantar extensor|Babinski/i, name: "Plantar response (Babinski)", pt: "Extensor (Babinski positive)", at: "Flexor", how: "Stroke the lateral side of the sole from the heel up to the base of the toes with a blunt object and watch the great toe.", why: "To test the integrity of the pyramidal tract.", p: "Great toe goes up (extensor): upper motor neuron lesion.", a: "Great toe flexes: normal." },
  { m: /^Plantar flexor/i, p: "Normal plantar response (great toe flexes)." },
  { m: /^Romberg/i, name: "Romberg's test", pt: "Positive", at: "Negative", how: "Ask the patient to stand with the feet together and eyes open, then close the eyes for 30 seconds while you stand close enough to steady them.", why: "To separate sensory (proprioceptive) ataxia from cerebellar ataxia.", p: "The patient sways or falls when the eyes close: sensory ataxia (dorsal column or proprioceptive loss).", a: "Steady with the eyes closed." },
  { m: /^Clonus/i, name: "Ankle clonus", how: "With the knee flexed, support the leg and suddenly dorsiflex the foot, maintaining the pressure.", why: "To detect hyperreflexia of an upper motor neuron lesion.", p: "Sustained rhythmic beats of the foot: upper motor neuron lesion.", a: "No clonus (a few unsustained beats can be normal)." },
  { m: /^Pronator drift/i, name: "Pronator drift", how: "Ask the patient to hold both arms out in front, palms up, with the eyes closed for 20 seconds.", why: "To detect subtle pyramidal weakness.", p: "One arm drifts downward and the forearm pronates: mild upper motor neuron weakness on that side.", a: "Arms remain level." },
  { m: /exaggerated$/i, p: "Brisk reflexes point to an upper motor neuron lesion." },
  { m: /diminished$/i, p: "Reduced reflexes point to a lower motor neuron lesion or peripheral neuropathy." },
  { m: /^Dysdiadochokinesia/i, name: "Dysdiadochokinesia", how: "Ask the patient to pat one palm quickly with alternating palm and back of the other hand.", why: "To test cerebellar coordination.", p: "Slow, clumsy alternating movements: ipsilateral cerebellar lesion." },
  { m: /^Finger-nose/i, name: "Finger-nose test", how: "Ask the patient to touch their nose and then your finger, which you move to different positions.", why: "To test for dysmetria and intention tremor.", p: "Overshoot and tremor on nearing the target: cerebellar lesion." },
  { m: /^Heel-shin/i, name: "Heel-shin test", how: "Ask the patient (supine) to run the heel of one foot slowly down the shin of the other leg.", why: "To test lower limb cerebellar coordination.", p: "Heel wobbles off the shin: cerebellar lesion." },
  { m: /^Nystagmus/i, p: "Involuntary rhythmic eye movements: vestibular, cerebellar or brainstem disease. The direction helps localise.", detail: "Direction, type (horizontal, vertical), gaze-evoked" },
  { m: /Papilloedema/i, p: "Swollen optic discs: raised intracranial pressure." },
  { m: /Corneal reflex absent/i, name: "Corneal reflex", pt: "Absent", at: "Present", how: "Touch the edge of the cornea lightly with a wisp of cotton from the side while the patient looks away.", why: "To test the trigeminal (afferent) and facial (efferent) nerves.", p: "No blink: lesion of the trigeminal or facial nerve." },
  { m: /Gag reflex absent/i, name: "Gag reflex", pt: "Absent", at: "Present", how: "Touch the back of the throat on each side with a tongue depressor.", why: "To test glossopharyngeal (afferent) and vagus (efferent) function.", p: "No gag: IX / X lesion." },
  { m: /^Gowers|Gowers' sign/i, name: "Gowers' sign", how: "Ask the child to get up from the floor and watch the way the hands climb up the thighs.", why: "To detect proximal muscle weakness.", p: "The child 'climbs up' the thighs with the hands: proximal muscle weakness (e.g., Duchenne muscular dystrophy)." },
  { m: /Tandem walking impaired/i, p: "Cannot walk heel-to-toe: truncal ataxia of cerebellar origin." },
  { m: /^Neck swelling/i, detail: "Site, size, consistency, movement" },

  // ---------- Chest ----------
  { m: /^Clubbing$|^Pandigital clubbing/i, name: "Clubbing (Schamroth's window)", how: "Place the dorsal surfaces of the distal phalanges of corresponding fingers of both hands together and look for the diamond-shaped window.", why: "To detect clubbing, a sign of chronic hypoxia or suppuration.", p: "Loss of the window: clubbing (lung cancer, bronchiectasis, lung abscess, cyanotic heart disease, endocarditis, cirrhosis).", a: "Window present: no clubbing." },
  { m: /^Tactile vocal fremitus increased/i, name: "Tactile vocal fremitus", pt: "Increased", at: "Normal", how: "Place the ulnar border of the palm on the chest wall and ask the patient to say 'ninety-nine'. Compare both sides.", why: "To assess transmission of vibrations through the lung.", p: "Increased: consolidation." },
  { m: /^Tactile vocal fremitus (decreased|absent)/i, p: "Reduced or absent: pleural effusion, pneumothorax, or collapse with a blocked bronchus." },
  { m: /^Stony dull/i, p: "Stony dull percussion note: pleural effusion." },
  { m: /^Dull$/i, p: "Dull note: consolidation, collapse, or fibrosis." },
  { m: /^Hyper-?resonant/i, p: "Pneumothorax or emphysema." },
  { m: /^Tympanic$/i, p: "Air-filled space: pneumothorax, large cavity, or bowel." },
  { m: /^Fine crepitations/i, p: "Alveolar fluid or fibrosis: pulmonary oedema, early pneumonia, interstitial lung disease." },
  { m: /^Coarse crepitations/i, p: "Secretions in larger airways: bronchiectasis, pneumonia, bronchitis." },
  { m: /^Post-tussive crepitations/i, p: "Crepitations that appear after coughing: classically in pulmonary tuberculosis." },
  { m: /^Rhonchi/i, p: "Airway narrowing with secretions: bronchitis, COPD." },
  { m: /^Wheeze|^With wheeze/i, p: "Airway narrowing: asthma, COPD, cardiac asthma." },
  { m: /^Pleural rub/i, p: "Inflamed pleural surfaces rubbing together: pleurisy (pneumonia, tuberculosis, infarct)." },
  { m: /^Amphoric/i, p: "Large smooth-walled cavity or pneumothorax with a bronchopleural fistula." },
  { m: /^Aegophony|^Whispering pectoriloquy|^Bronchophony/i, p: "Increased vocal resonance: consolidation (or the upper border of an effusion)." },
  { m: /^Trachea deviated|^Trachea shifted/i, p: "Mediastinal shift: pulled towards collapse or fibrosis, pushed away from a large effusion or tension pneumothorax.", detail: "Direction" },
  { m: /^Accessory muscles in use/i, p: "Increased work of breathing: respiratory distress (COPD, asthma, severe pneumonia)." },
  { m: /^Indrawing of intercostal/i, p: "Negative intrathoracic pressure from airway obstruction." },
  { m: /^Reduced movement on/i, p: "Reduced chest movement on that side: pleural effusion, consolidation, collapse, fibrosis, or pneumothorax.", detail: "Side and area" },

  // ---------- Cardiovascular ----------
  { m: /^Raised JVP/i, name: "Jugular venous pressure", how: "Position the patient at 45 degrees with the head turned slightly, and look for the internal jugular pulsation above the sternal angle. Measure the vertical height above the angle.", why: "To estimate right atrial pressure.", p: "JVP above 4 cm over the sternal angle: raised right atrial pressure (right heart failure, tamponade, constrictive pericarditis, fluid overload)." },
  { m: /^Kussmaul sign/i, p: "Paradoxical rise of JVP on inspiration: constrictive pericarditis, restrictive cardiomyopathy, or right ventricular failure." },
  { m: /^Thrill present/i, name: "Thrill", how: "Place the palm flat over the precordium and over each valve area and feel for a vibration like a purring cat.", why: "To pick up a loud murmur (grade 4 or more).", p: "A palpable thrill: loud murmur (valve stenosis, regurgitation, VSD). Note its area and timing.", detail: "Site and timing (systolic / diastolic)" },
  { m: /^Apex beat heaving/i, p: "Pressure overload of the left ventricle: aortic stenosis, hypertension." },
  { m: /^Apex beat tapping/i, p: "Palpable loud S1: mitral stenosis." },
  { m: /^Apex beat displaced/i, p: "Displaced downward and outward: left ventricular dilatation (volume overload, cardiomyopathy).", detail: "Position (e.g., 6th intercostal space, anterior axillary line)" },
  { m: /^Left parasternal heave/i, p: "Right ventricular hypertrophy or dilatation (pulmonary hypertension, ASD)." },
  { m: /^Palpable P2/i, p: "Pulmonary hypertension." },
  { m: /^P2 loud/i, p: "Pulmonary hypertension." },
  { m: /^S3 gallop/i, p: "Rapid ventricular filling in left ventricular failure or volume overload." },
  { m: /^S4 gallop/i, p: "Atrial contraction against a stiff ventricle (hypertension, hypertrophy, ischaemia)." },
  { m: /^Opening snap/i, p: "Mitral stenosis (stiff leaflets opening); the interval from S2 reflects severity." },
  { m: /^Ejection click/i, p: "Bicuspid aortic valve or pulmonary stenosis." },
  { m: /Wide fixed|Split S2/i, p: "Wide fixed splitting of S2: atrial septal defect. Wide variable splitting: RBBB, pulmonary stenosis." },
  { m: /^Pericardial rub/i, p: "Scratching sound from inflamed pericardial layers: pericarditis." },
  { m: /Systolic murmur/i, p: "Between S1 and S2: ejection (AS, PS, HOCM) or pansystolic (MR, TR, VSD). Describe the area, grade and radiation.", detail: "Area, grade, radiation, character" },
  { m: /Diastolic murmur/i, p: "Between S2 and S1: usually organic: mitral stenosis, aortic regurgitation. Describe the area and radiation.", detail: "Area, grade, radiation, character" },
  { m: /Continuous murmur/i, p: "Heard throughout the cardiac cycle: patent ductus arteriosus, AV fistula.", detail: "Area, grade, radiation" },
  { m: /^Hill.s sign positive/i, name: "Hill's sign", how: "Measure the blood pressure in the arm and then in the leg (popliteal) with the cuff.", why: "To grade the severity of aortic regurgitation.", p: "Popliteal systolic pressure exceeds brachial by more than 60 mmHg: severe aortic regurgitation." },
  { m: /^Radio-femoral delay/i, name: "Radio-femoral delay", how: "Palpate the radial and femoral pulses at the same time.", why: "To screen for coarctation of the aorta.", p: "Femoral pulse lags behind the radial: coarctation of the aorta." },
  { m: /^Radio-radial delay/i, p: "Delay between the two radial pulses: subclavian stenosis or arch lesion (e.g., coarctation, aneurysm)." },
  { m: /^Apex-pulse deficit/i, p: "Heart rate at the apex is greater than the pulse: atrial fibrillation." },
  { m: /Splinter haemorrhages|Osler|Roth spots|Janeway/i, p: "Peripheral stigmata of infective endocarditis (embolic or immune phenomena)." },
  { m: /Erythema marginatum|Subcutaneous nodules|Sydenham|chorea/i, p: "A major Jones criterion of acute rheumatic fever." },
  { m: /^Xanthelasma|^Xanthomas|^Arcus senilis/i, p: "Suggests hyperlipidaemia and risk of atherosclerosis." },

  // ---------- Paediatrics ----------
  { m: /^Bitot spots/i, p: "Foamy patches on the conjunctiva: vitamin A deficiency." },
  { m: /Rachitic rosary|Harrison/i, p: "Rickets: enlarged costochondral junctions and groove along the diaphragm attachment (vitamin D deficiency)." },
  { m: /Bilateral pitting oedema/i, p: "Defining feature of kwashiorkor / severe acute malnutrition with oedema." },
  { m: /MUAC below 11.5/i, name: "Mid-upper arm circumference", how: "Measure the circumference at the midpoint between the acromion and olecranon with a MUAC tape.", why: "Rapid screen for acute malnutrition in children aged 6 to 59 months.", p: "Below 11.5 cm: severe acute malnutrition." },
  { m: /MUAC 11.5 to 12.5/i, p: "Moderate acute malnutrition." },
  { m: /Sunken eyes|Skin pinch goes back slowly/i, p: "Signs of dehydration (some or severe depending on the number of signs)." },
  { m: /Hip click|Ortolani/i, name: "Ortolani and Barlow tests", how: "With the hips flexed to 90 degrees, abduct and lift the thigh (Ortolani) or push backwards with adduction (Barlow).", why: "To screen for developmental dysplasia of the hip.", p: "A click or clunk: dislocatable or dislocated hip." },

  // ---------- ENT ----------
  { m: /^Cotton wool test/i, name: "Cotton wool test", how: "Hold a wisp of cotton wool under each nostril and see whether it moves with expiration.", why: "To check the patency of each nasal passage.", p: "Little or no movement on one side: nasal obstruction on that side." },
  { m: /^Spatula test/i, name: "Cold spatula test", how: "Hold a cold metal spatula under the nostrils and compare the mist patches formed on each side.", why: "To compare nasal airflow on the two sides.", p: "A smaller mist patch on one side: nasal obstruction on that side." },
  { m: /Fistula test positive/i, name: "Fistula test", how: "Apply pressure (Siegle's speculum, tragal pressure, or a Politzer bulb) to the external canal and watch the eyes for nystagmus while asking about vertigo.", why: "To detect erosion of the bony labyrinth.", p: "Vertigo and nystagmus on pressure: labyrinthine fistula (usually from cholesteatoma eroding the lateral semicircular canal)." },
  { m: /Dix-Hallpike/i, name: "Dix-Hallpike test", how: "Seat the patient and turn the head 45 degrees. Then lay the patient back quickly with the head hanging about 20 degrees below the couch. Watch the eyes for nystagmus.", why: "To diagnose benign paroxysmal positional vertigo.", p: "Delayed, fatiguable torsional nystagmus with vertigo toward the lower ear: posterior canal BPPV." },
  { m: /Unterberger/i, name: "Unterberger's (stepping) test", how: "Ask the patient to march on the spot with the eyes closed and arms outstretched for 50 steps.", why: "To detect a vestibular lesion.", p: "Rotation toward the side of the lesion: peripheral vestibular disease." },
  { m: /^Transillumination reduced/i, p: "Reduced glow over a sinus: sinusitis (fluid or mucosal thickening) or a mass." },
  { m: /^Tragal tenderness|^Pinna movement painful/i, p: "Pain on pulling the pinna or pressing the tragus: acute otitis externa." },
  { m: /^Cone of light absent/i, p: "Distorted tympanic membrane: retraction or middle ear effusion." },
  { m: /^Leukoplakia/i, p: "White patch that cannot be scraped off: premalignant; needs biopsy.", detail: "Site and size" },
  { m: /^Erythroplakia/i, p: "Red velvety patch with a high malignant potential; biopsy is mandatory.", detail: "Site and size" },
  { m: /^Submucous fibrosis/i, p: "Premalignant condition from areca nut chewing; fibrous bands cause trismus." },
  { m: /Laryngeal crepitus lost/i, p: "Loss of laryngeal click: post-cricoid or hypopharyngeal growth." },
  { m: /Vocal cord palsy/i, p: "Paralysis of a vocal cord from recurrent laryngeal nerve injury (thyroid surgery, malignancy, aortic arch lesion)." },
  { m: /^Peritonsillar bulge/i, p: "Bulge above the tonsil with uvula pushed across: quinsy (peritonsillar abscess)." },

  // ---------- Obstetric and gynaecology ----------
  { m: /^Cervical motion tenderness/i, name: "Cervical motion tenderness", how: "During a vaginal examination, move the cervix gently from side to side.", why: "To detect pelvic peritoneal irritation.", p: "Pain on moving the cervix (chandelier sign): pelvic inflammatory disease or ectopic pregnancy." },
  { m: /^Fornix tenderness/i, p: "Tenderness in a vaginal fornix: pelvic inflammation, ectopic pregnancy, or endometriosis." },
  { m: /^Uterine prolapse/i, p: "Descent of the uterus; grade by the position of the cervix relative to the introitus.", detail: "Grade (I to III)" },
  { m: /^Cystocele|^Rectocele/i, p: "Prolapse of the anterior (bladder) or posterior (rectum) vaginal wall." },
  { m: /^Stress incontinence on cough/i, p: "Leakage of urine on coughing: stress urinary incontinence." },

  // ---------- General signs ----------
  { m: /^Pallor$/i, p: "Anaemia (look at conjunctiva, tongue, palms, nail beds).", detail: "Where noted (conjunctiva, tongue, palms)" },
  { m: /^Icterus/i, p: "Yellow discolouration of sclera (best in daylight): bilirubin above 2 to 3 mg/dl." },
  { m: /^Cyanosis/i, p: "Bluish discolouration: central (tongue and lips: hypoxaemia) or peripheral (extremities: poor perfusion).", detail: "Central or peripheral" },
  { m: /^Oedema|^Pedal oedema|Oedema \(/i, p: "Fluid retention: cardiac, renal, hepatic, venous or nutritional causes.", detail: "Site, pitting or non-pitting, extent" },
  { m: /^Dehydration/i, p: "Reduced fluid volume: look at skin turgor, tongue, eyes, pulse and blood pressure." },
  { m: /Lymphadenopathy/i, detail: "Group, size, number, consistency, mobility, tenderness" },
  { m: /^Tenderness$/i, detail: "Site, severity" },
  { m: /^Scars$|^Scar$/i, detail: "Site, length, healed or not" },
  { m: /^Ulcer/i, detail: "Site, size, edge, floor" },
  { m: /^Swelling$/i, detail: "Site and size" },
  { m: /^Sinus|^Sinuses/i, detail: "Site and discharge" },
]

export function findKb(label: string): Kb | undefined {
  const t = (label || "").trim()
  return KB2.find((k) => k.m.test(t)) || KB.find((k) => k.m.test(t))
}

export const isTest = (kb?: Kb) => !!(kb && kb.how)
