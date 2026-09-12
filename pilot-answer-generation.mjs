const SITE_URL = 'https://qubixprep.com';
const SECRET = process.env.ADMIN_BULK_SECRET;

if (!SECRET) {
  console.error('ADMIN_BULK_SECRET not found in .env.local');
  process.exit(1);
}

const questions = [
  "Define inflammation. Mention the types. Explain the sequential vascular changes in acute inflammation.",
  "Define inflammation. Describe the cellular changes that take place in acute inflammation.",
  "Define inflammation. Enumerate cellular events in inflammation and discuss in detail about phagocytosis.",
  "Define inflammation. Discuss in detail about chemical mediators of inflammation.",
  "Describe the cardinal signs of acute inflammation. Describe bone healing of fractures in long bones.",
  "Discuss the vascular phenomenon of inflammation.",
  "Describe the cellular events in acute inflammation.",
  "Discuss phagocytosis.",
  "Define and classify granuloma. Explain the evolution, morphology and fate of tuberculous granuloma.",
  "Define granuloma. List the diseases with granulomatous inflammation. Describe the lesions in primary tuberculosis.",
  "Describe the morphologic types of secondary tuberculosis.",
  "A 42-year-old male presented with history of fever, cough and weight loss since two months. X-ray of the chest showed cavitary lesion in right apical lobe. (a) What is your diagnosis and why? (b) Describe the etiopathogenesis of this disease. (c) Describe the gross and microscopic findings in the lung.",
  "What do you understand by the terms — \"healing\", \"regeneration\" and \"repair\"? Describe the steps in healing by first intention.",
  "Describe the mode of healing by secondary union. List the factors which influence repair. Tabulate the difference between primary and secondary unions.",
  "Compare with the help of suitable diagrams wound healing by primary and secondary intention. Discuss the factors promoting and delaying the process.",
  "Discuss the healing of fractured bone and its complications.",
];

console.log(`Generating ${questions.length} Long Essay answers for "Inflammation and Healing"...\n`);

const res = await fetch(`${SITE_URL}/api/admin/generate-section-answers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: SECRET,
    subjectId: 'pathology',
    chapterId: 'ch-06',
    chapterTitle: '6. Inflammation and Healing',
    sectionType: 'long-essays',
    questions,
    useGeminiNative: true,
  }),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
