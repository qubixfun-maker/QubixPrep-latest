/**
 * Subject-specific format templates.
 *
 * Different subjects organize their content in genuinely different shapes - an anatomy
 * structure and a pharmacology drug do not break down the same way, and forcing one
 * generic template onto every subject produces awkward, half-fitting notes/mindmaps.
 *
 * Instead of asking the AI to invent a structure per chapter (which needs new rendering
 * code every time and drifts in quality), it picks from this small, fixed library. The
 * mapping from subject name to template is explicit rather than auto-detected by keyword
 * matching, since some subject names don't cleanly signal their category (e.g. "Textbook
 * of pathology", "Biochemistry vasudhevan").
 */

export type FormatTemplate = {
  name: string;
  sections: string[];
  description: string;
};

export const FORMAT_TEMPLATES: Record<string, FormatTemplate> = {
  anatomy: {
    name: 'Anatomy',
    sections: ['Origin', 'Insertion', 'Nerve Supply', 'Blood Supply', 'Clinical Correlation'],
    description: 'Structures defined by attachment points and innervation/vascular supply',
  },
  histology: {
    name: 'Histology',
    sections: ['Location/Distribution', 'Microscopic Structure', 'Cell Types', 'Function', 'Clinical Correlation'],
    description: 'Microscopic tissue architecture, distinct from gross anatomy',
  },
  pathology: {
    name: 'Pathology',
    sections: ['Etiology', 'Pathogenesis', 'Morphology', 'Clinical Features', 'Complications', 'Lab Diagnosis'],
    description: 'Disease entities defined by cause, mechanism, and structural change',
  },
  pharmacology: {
    name: 'Pharmacology',
    sections: ['Mechanism of Action', 'Pharmacokinetics', 'Adverse Effects', 'Clinical Uses', 'Contraindications'],
    description: 'Drugs defined by how they act and how they are used clinically',
  },
  physiology: {
    name: 'Physiology',
    sections: ['Definition', 'Mechanism', 'Regulation', 'Clinical Correlation'],
    description: 'Normal body processes and how they are controlled',
  },
  microbiology: {
    name: 'Microbiology',
    sections: ['Morphology', 'Culture/Growth', 'Pathogenesis', 'Clinical Disease', 'Lab Diagnosis', 'Treatment'],
    description: 'Organisms defined by structure, how they grow, and the disease they cause',
  },
  biochemistry: {
    name: 'Biochemistry',
    sections: ['Structure/Composition', 'Metabolic Pathway', 'Enzymes/Regulation', 'Clinical Disorders'],
    description: 'Molecules and pathways defined by structure and metabolic role',
  },
  appliedClinical: {
    name: 'Applied/Clinical',
    sections: ['Definition', 'Etiology', 'Clinical Features', 'Investigations', 'Management', 'Complications'],
    description: 'Clinical subjects (surgery, medicine, obstetrics, etc.) organized around patient care',
  },
};

// Cross-cutting templates: usable for ANY subject when the content itself calls for this
// shape, regardless of subject category (e.g. a pathology chapter that happens to compare
// two diseases side by side still fits "comparison", not the standard pathology template).
export const CROSS_CUTTING_TEMPLATES: Record<string, FormatTemplate> = {
  comparison: {
    name: 'Comparison Table',
    sections: ['Feature', 'Entity A', 'Entity B'],
    description: 'Contrasting two or more entities directly (disease vs disease, drug vs drug)',
  },
  process: {
    name: 'Process/Mechanism Flowchart',
    sections: ['Step', 'Detail'],
    description: 'A stepwise sequence - pathogenesis cascades, drug mechanisms, procedural steps',
  },
  clinicalVignette: {
    name: 'Clinical Vignette Card',
    sections: ['Presentation', 'Key Findings', 'Diagnosis/Reasoning'],
    description: 'Case-based content built around a patient presentation',
  },
};

// Explicit subject-name -> template key mapping. Deliberately not keyword-matched, since
// names like "Textbook of pathology" or "Biochemistry vasudhevan" could easily mismatch
// or fail to match a naive keyword rule.
const SUBJECT_TEMPLATE_MAP: Record<string, keyof typeof FORMAT_TEMPLATES> = {
  'anatomy': 'anatomy',
  'abdomen and lower limb': 'anatomy',
  'general anatomy': 'anatomy',
  'head and neck': 'anatomy',
  'neuro anatomy': 'anatomy',
  'upper limb': 'anatomy',
  'histology': 'histology',
  'textbook of pathology': 'pathology',
  'pharmacology kdt': 'pharmacology',
  'physiology': 'physiology',
  'microbiology': 'microbiology',
  'biochemistry vasudhevan': 'biochemistry',
  'ent': 'appliedClinical',
  'general medicine': 'appliedClinical',
  'gynaecology': 'appliedClinical',
  'obstetrics': 'appliedClinical',
  'opthalmology': 'appliedClinical',
  'orthopaedic': 'appliedClinical',
  'surgery': 'appliedClinical',
};

/**
 * Resolves a subject name to its template. Falls back to Applied/Clinical (the most
 * general-purpose shape) for any subject not in the explicit map, rather than throwing -
 * new subjects added later should still get a reasonable default instead of failing.
 */
export function resolveTemplateForSubject(subjectName: string): FormatTemplate {
  const key = SUBJECT_TEMPLATE_MAP[subjectName.trim().toLowerCase()];
  return FORMAT_TEMPLATES[key || 'appliedClinical'];
}

/** All templates (subject-specific + cross-cutting) as a flat list, for prompting. */
export function allTemplatesForPrompt(subjectName: string): FormatTemplate[] {
  const primary = resolveTemplateForSubject(subjectName);
  return [primary, ...Object.values(CROSS_CUTTING_TEMPLATES)];
}
