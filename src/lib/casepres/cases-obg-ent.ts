import type { CaseDef } from './types'
import { txt, area, ch, fd, cc, sym, sec, at, vitals, date } from './dsl'
import { particulars, pastHistory, familyHistory, personalHistory, envSocio, gpe, closing } from './blocks'

const ENT_SIGNS = ['Cervical lymphadenopathy']

const entCommon = () => [
  pastHistory(['Previous ENT surgery', 'Allergy (rhinitis / atopy)']),
  familyHistory(['Hearing loss in family']),
  personalHistory(),
  envSocio(),
  gpe(ENT_SIGNS),
]

const entClose = () => closing()

const ear: CaseDef = {
  id: 'ent-ear', subject: 'ent', title: 'ENT: Ear', blurb: 'Hearing loss, otorrhoea, tinnitus, vertigo, earache',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Hearing loss', 'Tinnitus', 'Dizziness / vertigo', 'Ear discharge', 'Earache', 'Itching in the ear', 'Deformity of the pinna', 'Swelling around the ear', 'Fullness in the ear'])]),
    sec('hpi', 'History of present illness', [
      sym('hearing', 'Hearing loss', ['onset', 'duration', 'progression', at('side', 'Side', ['Right', 'Left', 'Bilateral']), 'trauma', 'associated']),
      sym('pain', 'Earache', ['onset', 'duration', 'progression', 'side', 'nature', 'radiation', 'aggravating', 'relieving', at('ass', 'Associated', ['Throat pain', 'URTI symptoms', 'Discharge', 'Hearing loss'], true)]),
      sym('disch', 'Ear discharge', ['onset', 'duration', 'progression', 'side', at('c', 'Colour', ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged']), 'discharge', 'smell', 'amount', 'aggravating', 'relieving', at('ass', 'Associated', ['URTI symptoms', 'Hearing loss', 'Fever', 'Earache'], true)]),
      sym('tinn', 'Tinnitus', ['onset', 'duration', 'progression', 'side', at('type', 'Type', ['High pitched', 'Low pitched', 'Pulsatile', 'Continuous', 'Intermittent']), 'aggravating', 'relieving']),
      sym('vertigo', 'Vertigo / dizziness', ['onset', 'duration', 'episodes', at('ass', 'Associated', ['Nausea / vomiting', 'Hearing loss', 'Tinnitus', 'Positional', 'Fall'], true)]),
      fd('also', 'Also ask', ['Fever', 'Itching of the ear', 'Throat irritation', 'Swelling of the ear', 'Deformity', 'Throat pain', 'Dysphagia', 'Odynophagia', 'Hoarseness', 'Neck swelling', 'Nasal obstruction', 'Running nose', 'Nasal discharge', 'Cough', 'Watering of eyes', 'Noise exposure', 'Ototoxic drug intake', 'Facial weakness']),
      area('rxHx', 'Treatment history'),
    ]),
    ...entCommon(),
    sec('pinna', 'Ear examination: pinna and mastoid', [
      ch('side', 'Ear examined', ['Right', 'Left', 'Both']),
      fd('pinnaF', 'Pinna and surrounding area', ['Normal size, shape, position', 'Microtia / deformity', 'Redness', 'Swelling', 'Vesicles in concha / groove', 'Scar', 'Ulcer or neoplasm', 'Sinus / fistula', 'Preauricular sinus', 'Raised temperature', 'Thickened tissue', 'Fluctuation', 'Tenderness', 'Tragal tenderness', 'Pinna movement painful', 'Cauliflower ear']),
      fd('mastoidF', 'Mastoid', ['Swelling', 'Obliteration of the retroauricular groove', 'Fistula', 'Scar', 'Tenderness over antrum', 'Tenderness over tip', 'Postaural sinus']),
    ]),
    sec('eac', 'External auditory canal and tympanic membrane', [
      fd('eacF', 'External auditory canal', ['Normal calibre', 'Narrow meatus', 'Wax', 'Debris', 'Discharge', 'Polyp', 'Granulations', 'Exostosis', 'Furuncle', 'Foreign body', 'Meatal wall swelling', 'Sagging of posterosuperior wall', 'Neoplasm', 'Fungal debris']),
      ch('tmColour', 'Tympanic membrane colour', ['Pearly grey', 'Dull', 'Red', 'Yellow / amber', 'Blue (haemotympanum)']),
      ch('tmPos', 'Position', ['Normal', 'Retracted', 'Bulging']),
      fd('tmF', 'Tympanic membrane', ['Intact', 'Central perforation', 'Marginal perforation', 'Attic perforation', 'Total perforation', 'Cone of light present', 'Cone of light absent', 'Mobile on pneumatic otoscopy', 'Restricted mobility', 'Retraction pocket', 'Tympanosclerosis', 'Cholesteatoma flakes', 'Middle ear mucosa congested', 'Middle ear mucosa pale', 'Air-fluid level', 'Bubbles behind TM']),
      area('tmN', 'Perforation site, size, middle ear mucosa, ossicles, Eustachian tube'),
    ]),
    sec('func', 'Functional tests', [
      fd('voice', 'Voice tests', ['Conversational voice heard', 'Whisper heard at 6 m', 'Reduced hearing on right', 'Reduced hearing on left']),
      ch('rinneR', 'Rinne: right', ['Positive', 'Negative', 'False negative']), ch('rinneL', 'Rinne: left', ['Positive', 'Negative', 'False negative']),
      ch('weber', 'Weber', ['Central', 'Lateralised to right', 'Lateralised to left']),
      ch('abc', 'Absolute bone conduction', ['Normal', 'Reduced on right', 'Reduced on left', 'Reduced bilaterally']),
      ch('schw', 'Schwabach', ['Normal', 'Prolonged', 'Shortened']),
      ch('hl', 'Impression', ['Normal hearing', 'Conductive hearing loss', 'Sensorineural hearing loss', 'Mixed hearing loss']),
      fd('vest', 'Vestibular function', ['Spontaneous nystagmus', 'Fistula test positive', 'Dix-Hallpike positive', 'Romberg unsteady', 'Unterberger deviation', 'Gait abnormal']),
      fd('facial', 'Facial nerve', ['Normal', 'Facial palsy (LMN)', 'Facial palsy House-Brackmann grade']),
      area('funcN', 'Notes (audiometry, tympanometry if available)'),
    ]),
    sec('otherENT', 'Nose, throat and systemic examination', [
      area('nose', 'Nose'), area('throat', 'Throat'), area('neck', 'Neck'), area('cns', 'CNS'), area('cvs', 'CVS'), area('rs', 'RS'), area('abd', 'Abdomen'),
    ]),
    entClose(),
  ],
}

const nose: CaseDef = {
  id: 'ent-nose', subject: 'ent', title: 'ENT: Nose and sinuses', blurb: 'Nasal obstruction, discharge, epistaxis, sinusitis, polyps, DNS',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Nasal obstruction', 'Nasal discharge', 'Postnasal drip', 'Sneezing', 'Epistaxis', 'Headache / facial pain', 'Swelling or deformity of the nose', 'Disturbance of smell', 'Snoring', 'Change in voice'])]),
    sec('hpi', 'History of present illness', [
      sym('obst', 'Nasal obstruction', ['onset', 'duration', 'progression', 'side', 'aggravating', 'relieving', 'timing', 'associated']),
      sym('disch', 'Nasal discharge', ['onset', 'duration', 'progression', 'side', 'amount', at('c', 'Colour', ['Clear', 'White', 'Yellow', 'Green', 'Blood-tinged']), 'discharge', 'smell', 'timing', 'aggravating', 'relieving', 'associated']),
      sym('pnd', 'Postnasal drip', ['onset', 'duration', 'associated']),
      sym('sneeze', 'Sneezing', ['onset', 'duration', 'progression', at('freq', 'Frequency', ['Occasional', 'Paroxysmal', 'Episodes daily']), 'timing', 'associated']),
      sym('epistaxis', 'Epistaxis', ['onset', 'duration', 'side', 'episodes', 'amount', at('ass', 'Associated', ['Hypertension', 'Trauma', 'Systemic illness', 'Bleeding disorder', 'Anticoagulants', 'Nose picking'], true)]),
      sym('head', 'Headache / facial pain', ['onset', 'duration', at('site', 'Site', ['Frontal', 'Maxillary', 'Periorbital', 'Retro-orbital', 'Vertex']), 'nature', 'aggravating', 'relieving']),
      fd('also', 'Also ask', ['Swelling or deformity of the nose', 'Disturbance of smell', 'Snoring', 'Change in voice (hypo / hypernasality)', 'Dysphagia', 'Congenital anomalies', 'Throat pain', 'Throat irritation', 'Cough', 'Expectoration', 'Earache', 'Ear discharge', 'Hearing loss', 'Tinnitus', 'Trauma to nose', 'Allergy triggers (dust, pollen)']),
      area('rxHx', 'Treatment history'),
    ]),
    ...entCommon(),
    sec('extNose', 'External nose and vestibule', [
      fd('skin', 'Inspection / palpation', ['Skin normal', 'Scar', 'Sinus', 'Swelling or neoplasm', 'Deformity', 'Deviated nose', 'Hump', 'Depressed bridge', 'Saddle nose', 'Bifid / pointed tip', 'Destruction of nose', 'Raised temperature', 'Fixity of skin', 'Tenderness', 'Crepitus']),
      fd('vest', 'Vestibule', ['Furuncle', 'Fissure', 'Crusting', 'Dislocated caudal septum', 'Tumour', 'Normal']),
    ]),
    sec('rhino', 'Anterior and posterior rhinoscopy', [
      ch('side', 'Side', ['Right', 'Left', 'Both']),
      fd('rhinoF', 'Anterior rhinoscopy', ['Septum deviated to right', 'Septum deviated to left', 'Septal spur', 'Septal perforation', 'Septal haematoma', 'Mucosa congested', 'Mucosa pale and boggy', 'Mucosa hypertrophic', 'Inferior turbinate hypertrophy', 'Middle turbinate hypertrophy', 'Mucopus in middle meatus', 'Polyps', 'Mass', 'Crusts', 'Atrophic mucosa', 'Foreign body', 'Bleeding point (Little area)', 'Floor / roof normal']),
      fd('prF', 'Posterior rhinoscopy', ['Postnasal space clear', 'Adenoid hypertrophy', 'Nasopharyngeal mass', 'Choanal polyp', 'Mucopus on posterior end of turbinates']),
      fd('func', 'Functional', ['Nasal patency reduced on right', 'Nasal patency reduced on left', 'Cotton wool test positive', 'Spatula test abnormal', 'Anosmia', 'Hyposmia']),
      area('rhinoN', 'Details'),
    ]),
    sec('sinus', 'Paranasal sinuses', [
      fd('sinF', 'Tenderness / signs', ['Maxillary tenderness (canine fossa)', 'Frontal tenderness', 'Ethmoid tenderness (medial canthus)', 'Cheek swelling', 'Periorbital oedema', 'Proptosis', 'Diplopia', 'Palatal bulge', 'Alveolar tooth involvement', 'Pus in middle meatus', 'Pus in superior meatus', 'Transillumination reduced']),
      area('sinN', 'Notes'),
      area('otherENT', 'Ear, throat and systemic examination'),
    ]),
    entClose(),
  ],
}

const throat: CaseDef = {
  id: 'ent-throat', subject: 'ent', title: 'ENT: Throat and larynx', blurb: 'Sore throat, dysphagia, voice change, tonsils, neck masses',
  sections: [
    particulars(),
    sec('complaints', 'Chief complaints', [cc('cc', 'Select the complaints and give the duration', ['Sore throat', 'Odynophagia', 'Dysphagia', 'Change in voice', 'Earache', 'Snoring', 'Halitosis', 'Hearing loss', 'Abnormal appearance of throat', 'Neck swelling', 'Stridor / breathing difficulty', 'Trismus'])]),
    sec('hpi', 'History of present illness', [
      sym('sore', 'Sore throat', ['onset', 'duration', 'progression', 'aggravating', 'relieving', 'associated']),
      sym('odyno', 'Odynophagia', ['onset', 'duration', 'progression', 'aggravating', 'relieving', 'associated']),
      sym('dysph', 'Dysphagia', ['onset', 'duration', 'progression', at('rel', 'To', ['Solids', 'Liquids', 'Both']), 'associated']),
      sym('voice', 'Change in voice', ['onset', 'duration', 'progression', at('type', 'Voice', ['Hoarse', 'Weak', 'Muffled (hot potato)', 'Breathy', 'Aphonia', 'Nasal']), 'associated']),
      sym('ear', 'Earache', ['onset', 'duration', 'progression', 'nature', 'aggravating', 'relieving', 'associated']),
      fd('also', 'Also ask', ['Pain', 'Disturbance in salivation', 'Disturbance of taste', 'Trismus', 'Lesion in oral cavity', 'Halitosis', 'Hearing loss', 'Ear discharge', 'Nasal obstruction', 'Nasal discharge', 'Swelling in the neck', 'Fever', 'URTI symptoms', 'Snoring / sleep apnoea', 'Haemoptysis', 'Weight loss', 'Smoking / tobacco / alcohol']),
      area('rxHx', 'Treatment history'),
    ]),
    ...entCommon(),
    sec('oral', 'Oral cavity', [
      fd('lips', 'Lips', ['Swelling', 'Vesicles', 'Ulcers', 'Crusts', 'Scars', 'Cleft lip']),
      fd('buccal', 'Buccal mucosa', ['Normal', 'Colour change', 'Leukoplakia', 'Erythroplakia', 'Submucous fibrosis (bands)', 'Ulcer', 'Candidiasis', 'Lichen planus']),
      fd('gums', 'Gums and teeth', ['Red swollen gums', 'Ulceration', 'Membrane over gums', 'Hyperplasia', 'Growth', 'Loose teeth', 'Dental caries', 'Malocclusion', 'Mandible fracture', 'TMJ abnormality']),
      fd('palate', 'Hard palate', ['Normal', 'Cleft palate', 'Oronasal fistula', 'High arched', 'Bulge', 'Torus palatinus', 'Mass or ulcer']),
      fd('tongue', 'Tongue', ['Normal', 'Large', 'Ulcer', 'Fissure', 'Inability to protrude', 'Bald tongue', 'Deviation on protrusion', 'White thick patch', 'Growth', 'Coated']),
      fd('floor', 'Floor of mouth and retromolar trigone', ['Normal', 'Scar', 'Ulcer', 'Swelling', 'Ranula', 'Sialolith', 'Retromolar trigone lesion']),
    ]),
    sec('oropharynx', 'Oropharynx', [
      ch('tons', 'Tonsils', ['Not enlarged', 'Grade I', 'Grade II', 'Grade III', 'Grade IV (kissing)', 'Absent (tonsillectomy)']),
      fd('tonF', 'Tonsils and pillars', ['Symmetrical', 'Asymmetrical', 'Congested', 'Crypts with debris', 'White or yellow spots', 'Membrane', 'Ulcer', 'Mass', 'Peritonsillar bulge', 'Uvula deviated', 'Pillars congested', 'Pillar ulcer', 'Soft palate oedema', 'Posterior pharyngeal wall granularity', 'Posterior pharyngeal wall bulge', 'Base of tongue lesion', 'Vallecula lesion']),
      area('oroN', 'Notes'),
    ]),
    sec('larynx', 'Indirect laryngoscopy and neck', [
      fd('laryF', 'Larynx / hypopharynx', ['Epiglottis normal', 'Epiglottis oedematous', 'Vocal cords mobile', 'Vocal cord palsy (right)', 'Vocal cord palsy (left)', 'Vocal cord nodules', 'Vocal cord polyp', 'Vocal cord growth', 'Vocal cord oedema', 'Arytenoids congested', 'Pyriform fossa pooling', 'Postcricoid growth', 'Subglottic narrowing']),
      fd('neckF', 'Neck', ['Lymph nodes palpable', 'Level II node', 'Level III node', 'Level V node', 'Nodes hard, fixed', 'Thyroid swelling', 'Laryngeal crepitus lost', 'Neck swelling']),
      area('neckN', 'Neck swelling or node description'),
      area('nose', 'Nose and nasopharynx'), area('earExam', 'Ear'), area('sys', 'Systemic (CNS, CVS, RS, abdomen)'),
    ]),
    entClose(),
  ],
}

export { OBG_CASES } from './cases-obg'
export const ENT_CASES: CaseDef[] = [ear, nose, throat]
