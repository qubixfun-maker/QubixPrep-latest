export type FormatTemplate = {
  name: string;
  sections: string[];
  description: string;
  renderAs?: 'subheadings' | 'table' | 'steps';
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
    sections: ['Etiology', 'Classification', 'Pathogenesis', 'Morphology', 'Clinical Features', 'Complications', 'Lab Diagnosis'],
    description: 'Disease entities defined by cause, mechanism, and structural change',
  },
  pharmacology: {
    name: 'Pharmacology',
    sections: ['Classification', 'Mechanism of Action', 'Pharmacokinetics', 'Adverse Effects', 'Clinical Uses', 'Contraindications'],
    description: 'Drugs defined by how they act and how they are used clinically',
  },
  physiology: {
    name: 'Physiology',
    sections: ['Definition', 'Classification', 'Mechanism', 'Regulation', 'Clinical Correlation'],
    description: 'Normal body processes and how they are controlled',
  },
  microbiology: {
    name: 'Microbiology',
    sections: ['Classification', 'Morphology', 'Culture/Growth', 'Pathogenesis', 'Clinical Disease', 'Lab Diagnosis', 'Treatment'],
    description: 'Organisms defined by structure, how they grow, and the disease they cause',
  },
  biochemistry: {
    name: 'Biochemistry',
    sections: ['Structure/Composition', 'Classification', 'Metabolic Pathway', 'Enzymes/Regulation', 'Clinical Disorders'],
    description: 'Molecules and pathways defined by structure and metabolic role',
  },
  appliedClinical: {
    name: 'Applied/Clinical',
    sections: ['Definition', 'Classification', 'Etiology', 'Clinical Features', 'Investigations', 'Management', 'Complications'],
    description: 'Clinical subjects (surgery, medicine, obstetrics, etc.) organized around patient care',
  },
};

export const CROSS_CUTTING_TEMPLATES: Record<string, FormatTemplate> = {
  comparison: {
    name: 'Comparison Table',
    sections: ['Feature', 'Entity A', 'Entity B'],
    description: 'Contrasting two or more entities directly (disease vs disease, drug vs drug)',
    renderAs: 'table',
  },
  process: {
    name: 'Process/Mechanism Flowchart',
    sections: ['Step', 'Detail'],
    description: 'A stepwise sequence - pathogenesis cascades, drug mechanisms, procedural steps',
    renderAs: 'steps',
  },
  clinicalVignette: {
    name: 'Clinical Vignette Card',
    sections: ['Presentation', 'Key Findings', 'Diagnosis/Reasoning'],
    description: 'Case-based content built around a patient presentation',
  },
};

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

export function resolveTemplateForSubject(subjectName: string): FormatTemplate {
  const key = SUBJECT_TEMPLATE_MAP[subjectName.trim().toLowerCase()];
  return FORMAT_TEMPLATES[key || 'appliedClinical'];
}

export function allTemplatesForPrompt(subjectName: string): FormatTemplate[] {
  const primary = resolveTemplateForSubject(subjectName);
  return [primary, ...Object.values(CROSS_CUTTING_TEMPLATES)];
}
