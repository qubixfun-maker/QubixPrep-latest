import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DRY_RUN = process.argv[2] !== '--apply';

function safeId(title) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const LIGATURE_MAP = {
  '\uFB00': 'ff', '\uFB01': 'fi', '\uFB02': 'fl',
  '\uFB03': 'ffi', '\uFB04': 'ffl', '\uFB05': 'st', '\uFB06': 'st',
};
const KNOWN_WORDS = new Set([
  'inflammation','inflammatory','inflamed','define','defined','defines','definition',
  'classification','classify','classified','difficult','difficulty','efficacy','efficient',
  'sufficient','insufficient','specific','specificity','identification','identify','identified',
  'modification','modified','calcification','calcified','ossification','magnification',
  'fibrosis','fibrous','fibrin','fibroblast','fibroma','fibroid','profile','superficial',
  'artificial','beneficial','confirm','confirmed','confluent','influx','influence',
  'reflux','reflex','conflict','first','fistula','fissure','fixation','flap','flexion',
  'flexor','fluid','flow','affected','affect','effect','effective','effusion',
  'different','differential','differentiation','office','official','suffix','affix',
  'biofilm','film','filter','final','finding','findings','fine','finger','finish',
  'fifth','fifty','figure','file','fill','filled','stenosis','stent','stomach',
  'staining','stage','staging','standard','statistics','insufficiency','deficiency',
  'deficit','infiltration','infiltrate','inflate','inflation','reflection','refill',
  'certificate','verification','amplification','stratification','notification',
  'significant','significance','signification','unified','ossify','liquefaction',
  'proliferation','proliferative','differentiate','diffuse','diffusion','suffering',
  'buffer','coffee','offer','offset','stiff','stiffness','cuff','staff',
  'immunodeficiency','immunodeficient',
]);

function mergeIfKnownWord(match, left, frag, right) {
  const merged = left + frag + right;
  return KNOWN_WORDS.has(merged.toLowerCase()) ? merged : match;
}

function repairTitle(input) {
  if (!input) return input;
  let text = input;
  for (const [glyph, replacement] of Object.entries(LIGATURE_MAP)) {
    text = text.split(glyph).join(replacement);
  }
  text = text.replace(/([A-Za-z]+)\s(ffi|ffl|ff|fi|fl|st)\s([a-z]+)/g, mergeIfKnownWord);
  text = text.replace(/([A-Za-z]+)\s(ffi|ffl|ff|fi|fl|st)([a-z]+)/g, mergeIfKnownWord);
  text = text.replace(/([A-Za-z]+)(ffi|ffl|ff|fi|fl|st)\s([a-z]+)/g, mergeIfKnownWord);
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/\s*—\s*/g, ' - ');
  text = text.replace(/-\s+/g, '- ').replace(/\s+-/g, ' -');
  return text;
}

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
initializeApp({ credential: cert(key) });
const db = getFirestore();

const subjects = await db.collection('subjects').get();
let totalNeedingMigration = 0;

for (const subj of subjects.docs) {
  const chapters = await db.collection('subjects').doc(subj.id).collection('essayChapters').get();
  for (const ch of chapters.docs) {
    const data = ch.data();
    const repairedTitle = repairTitle(data.title || '');
    const newId = safeId(repairedTitle || ch.id);
    const titleChanged = repairedTitle !== data.title;
    if (newId === ch.id && !titleChanged) continue; // nothing to do

    totalNeedingMigration++;
    console.log(`\n[${subj.data().name || subj.id}]`);
    console.log(`  old title: "${data.title}"`);
    if (titleChanged) console.log(`  new title: "${repairedTitle}"`);
    console.log(`  old id: ${ch.id}`);
    console.log(`  new id: ${newId}`);

    if (!DRY_RUN) {
      const sections = await ch.ref.collection('sections').get();
      const newData = { ...data, title: repairedTitle };
      if (newId === ch.id) {
        // ID is already fine - just update the title in place, no copy/delete needed.
        await ch.ref.set(newData, { merge: true });
        console.log(`  UPDATED TITLE IN PLACE`);
      } else {
        const newChapterRef = db.collection('subjects').doc(subj.id).collection('essayChapters').doc(newId);
        await newChapterRef.set(newData);
        for (const sec of sections.docs) {
          await newChapterRef.collection('sections').doc(sec.id).set(sec.data());
        }
        for (const sec of sections.docs) {
          await sec.ref.delete();
        }
        await ch.ref.delete();
        console.log(`  MIGRATED (${sections.size} section(s) copied)`);
      }
    }
  }
}

console.log(`\n${totalNeedingMigration} chapter(s) need migration/title-fix across all subjects.`);
console.log(DRY_RUN ? '\nDRY RUN — nothing changed. Re-run with --apply to migrate.' : '\nDone.');
