const SITE_URL = 'https://qubixprep.com';
const SECRET = process.env.ADMIN_BULK_SECRET;

const res = await fetch(`${SITE_URL}/api/admin/generate-section-answers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret: SECRET,
    subjectId: 'pathology',
    chapterId: 'ch-06',
    chapterTitle: '6. Inflammation and Healing',
    sectionType: 'long-essays',
    question: 'Define inflammation. Mention the types. Explain the sequential vascular changes in acute inflammation. (RETEST V4)',
  }),
});
console.log(JSON.stringify(await res.json(), null, 2));
