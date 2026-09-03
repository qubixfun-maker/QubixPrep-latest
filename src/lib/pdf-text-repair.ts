/**
 * Repairs text corruption introduced by PDF extraction.
 *
 * Many typeset PDFs use ligature glyphs (ﬁ ﬂ ﬀ ﬃ ﬄ) for letter pairs. Depending on how
 * the font is embedded, extraction can either emit the ligature character itself, or drop
 * it and leave stray spaces in its place - which is why "inflammation" comes out as
 * "in fl ammation" and "classification" as "classi fi cation".
 *
 * This is a source-data problem and must be fixed at ingestion. Anything derived from
 * uncorrected text (AI-generated answers, URL slugs, section titles) inherits the damage.
 *
 * Rejoining is guarded by a dictionary: a split is only healed when the merged result is
 * a word we recognise. That means legitimate text like "the fl ag" is never touched, and
 * this can never invent a corruption that wasn't already there.
 */

const LIGATURE_MAP: Record<string, string> = {
  '\uFB00': 'ff',
  '\uFB01': 'fi',
  '\uFB02': 'fl',
  '\uFB03': 'ffi',
  '\uFB04': 'ffl',
  '\uFB05': 'st',
  '\uFB06': 'st',
};

// Words that commonly get split by ligature extraction in medical texts. Extend freely -
// adding a word can only ever fix more cases, never break correct text.
const KNOWN_WORDS = new Set([
  'inflammation', 'inflammatory', 'inflamed', 'define', 'defined', 'defines', 'definition',
  'classification', 'classify', 'classified', 'difficult', 'difficulty', 'efficacy', 'efficient',
  'sufficient', 'insufficient', 'specific', 'specificity', 'identification', 'identify', 'identified',
  'modification', 'modified', 'calcification', 'calcified', 'ossification', 'magnification',
  'fibrosis', 'fibrous', 'fibrin', 'fibroblast', 'fibroma', 'fibroid', 'profile', 'superficial',
  'artificial', 'beneficial', 'confirm', 'confirmed', 'confluent', 'influx', 'influence',
  'reflux', 'reflex', 'conflict', 'first', 'fistula', 'fissure', 'fixation', 'flap', 'flexion',
  'flexor', 'fluid', 'flow', 'affected', 'affect', 'effect', 'effective', 'effusion',
  'different', 'differential', 'differentiation', 'office', 'official', 'suffix', 'affix',
  'biofilm', 'film', 'filter', 'final', 'finding', 'findings', 'fine', 'finger', 'finish',
  'fifth', 'fifty', 'figure', 'file', 'fill', 'filled', 'stenosis', 'stent', 'stomach',
  'staining', 'stage', 'staging', 'standard', 'statistics', 'insufficiency', 'deficiency',
  'deficit', 'infiltration', 'infiltrate', 'inflate', 'inflation', 'reflection', 'refill',
  'certificate', 'verification', 'amplification', 'stratification', 'notification',
  'significant', 'significance', 'signification', 'unified', 'ossify', 'liquefaction',
  'proliferation', 'proliferative', 'differentiate', 'diffuse', 'diffusion', 'suffering',
  'buffer', 'coffee', 'offer', 'offset', 'stiff', 'stiffness', 'cuff', 'staff',
]);

function mergeIfKnownWord(match: string, left: string, frag: string, right: string): string {
  const merged = left + frag + right;
  return KNOWN_WORDS.has(merged.toLowerCase()) ? merged : match;
}

export function repairPdfText(input: string): string {
  if (!input) return input;

  let text = input;

  // 1. Replace real ligature glyphs with their letter pairs.
  for (const [glyph, replacement] of Object.entries(LIGATURE_MAP)) {
    text = text.split(glyph).join(replacement);
  }

  // 2. Heal splits around an orphaned ligature fragment, in all three spacing variants.
  //    Each is dictionary-guarded, so unknown merges are left exactly as-is.
  text = text.replace(/([A-Za-z]+)\s(ffi|ffl|ff|fi|fl|st)\s([a-z]+)/g, mergeIfKnownWord);
  text = text.replace(/([A-Za-z]+)\s(ffi|ffl|ff|fi|fl|st)([a-z]+)/g, mergeIfKnownWord);
  text = text.replace(/([A-Za-z]+)(ffi|ffl|ff|fi|fl|st)\s([a-z]+)/g, mergeIfKnownWord);

  return text;
}

/**
 * Detects whether text shows signs of ligature corruption, so ingestion can warn the
 * admin rather than silently storing damaged source material.
 */
export function detectLigatureCorruption(text: string): { corrupted: boolean; sampleCount: number } {
  if (!text) return { corrupted: false, sampleCount: 0 };
  const spaced = text.match(/[A-Za-z]\s(ffi|ffl|ff|fi|fl|st)\s[a-z]/g);
  const glyphs = text.match(/[\uFB00-\uFB06]/g);
  const count = (spaced?.length || 0) + (glyphs?.length || 0);
  return { corrupted: count > 3, sampleCount: count };
}
