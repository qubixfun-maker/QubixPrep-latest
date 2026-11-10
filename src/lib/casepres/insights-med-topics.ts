import type { Hint, Viva } from './insights-data'

type Ins = { hints: Hint[]; must: { n: string; m: string[] }[]; viva: Viva[] }
const h = (dx: string, why: string, any: string[], min = 2): Hint => ({ dx, why, any, min: Math.min(min, any.length) })
const mu = (n: string, ...m: string[]) => ({ n, m })
const v = (q: string, a: string): Viva => ({ q, a })

export const INSIGHTS_MED_TOPICS: Record<string, Ins> = {
  'med-rhd': {
    hints: [
      h('Rheumatic mitral stenosis', 'Mid-diastolic rumbling murmur with loud S1 and opening snap, mitral facies and atrial fibrillation.', ['mid-diastolic rumbling', 'loud s1', 'mitral facies', 'irregularly irregular', 'tapping apex']),
      h('Rheumatic mitral regurgitation', 'Pansystolic apical murmur radiating to the axilla with a displaced apex.', ['pansystolic murmur', 'radiating to the axilla'], 1),
      h('Pulmonary hypertension and right heart failure', 'Loud P2, raised JVP, hepatomegaly and pedal oedema.', ['loud p2', 'raised jvp', 'hepatomegaly', 'pedal oedema'], 3),
      h('Left atrial thrombus / embolic risk', 'Atrial fibrillation with mitral stenosis or a previous embolism.', ['irregularly irregular', 'stroke or embolism'], 1),
    ],
    must: [mu('Rheumatic fever history and penicillin prophylaxis', 'sore throat with fleeting', 'benzathine'), mu('Pulse: rate, rhythm, volume', 'irregularly irregular', 'pulse'), mu('JVP', 'raised jvp', 'jvp'), mu('Apex beat character', 'tapping apex', 'apex beat'), mu('Heart sounds and murmur', 'loud s1', 'murmur'), mu('Signs of failure (crepitations, liver, oedema)', 'basal crepitations', 'pedal oedema')],
    viva: [v('Grade of the severity of mitral stenosis clinically?', 'Longer the murmur and the earlier the opening snap (shorter A2-OS gap), the tighter the stenosis. Mitral valve area under 1 cm2 is severe on echo.'), v('Why does mitral stenosis cause haemoptysis?', 'Raised left atrial and pulmonary venous pressure ruptures bronchial veins; also pulmonary oedema and infarction.'), v('Which murmur is heard in left lateral position?', 'Mitral stenosis murmur, with the bell of the stethoscope at the apex after exercise.'), v('Graham Steell murmur?', 'Early diastolic murmur of pulmonary regurgitation from severe pulmonary hypertension.'), v('Treatment options?', 'Diuretics, rate control (beta blocker, digoxin), anticoagulation (warfarin) if AF; percutaneous balloon mitral valvotomy or valve replacement.'), v('Secondary prophylaxis?', 'Benzathine penicillin 1.2 million units IM every 3 weeks (every 4 weeks in some programmes), duration depends on age and carditis.'), v('Complications of mitral stenosis?', 'AF, systemic embolism, pulmonary hypertension, right heart failure, infective endocarditis, haemoptysis.')],
  },
  'med-ie': {
    hints: [
      h('Infective endocarditis', 'Fever with a new or changing murmur and peripheral stigmata.', ['prolonged low-grade fever', 'new or changing murmur', 'splinter haemorrhages', 'osler nodes', 'janeway lesions', 'roth spots']),
      h('Embolic complications', 'Stroke, limb ischaemia, splenic or renal infarcts from vegetations.', ['embolic phenomena', 'haematuria'], 1),
      h('Predisposing valvular lesion', 'Rheumatic, congenital, prosthetic valve or IV drug use.', ['known valvular', 'intravenous drug use', 'recent dental'], 1),
    ],
    must: [mu('Fever and predisposing cause', 'prolonged low-grade fever', 'recent dental'), mu('Peripheral stigmata', 'splinter', 'osler', 'janeway'), mu('Clubbing and pallor', 'clubbing', 'pallor'), mu('Spleen', 'splenomegaly'), mu('Murmur', 'new or changing murmur'), mu('Blood cultures before antibiotics', 'blood cultures')],
    viva: [v('Modified Duke criteria?', 'Major: positive blood cultures with typical organisms and endocardial involvement on echo or new regurgitation. Minor: predisposition, fever, vascular phenomena, immunological phenomena, microbiology not meeting major. Definite: 2 major, or 1 major + 3 minor, or 5 minor.'), v('Commonest organisms?', 'Viridans streptococci in native valve subacute cases; Staphylococcus aureus in acute cases and IV drug users.'), v('Number of blood cultures?', 'At least 3 sets from separate sites over 24 hours before starting antibiotics.'), v('Immunological phenomena?', 'Osler nodes, Roth spots, glomerulonephritis, positive rheumatoid factor.'), v('Treatment?', 'Prolonged IV antibiotics (4 to 6 weeks) according to culture; surgery for heart failure, abscess, large vegetations or persistent sepsis.'), v('Prophylaxis?', 'Only in high-risk patients (prosthetic valve, previous IE, some congenital disease) before dental procedures: amoxicillin 2 g one hour before.'), v('Janeway versus Osler?', 'Janeway lesions are painless macules on palms and soles (septic emboli); Osler nodes are painful nodules on finger pulps (immune complex).')],
  },
  'med-arf': {
    hints: [
      h('Acute rheumatic fever', 'Preceding sore throat with migratory arthritis, carditis, chorea, nodules or erythema marginatum.', ['sore throat 2 to 4 weeks', 'migratory polyarthritis', 'carditis', 'sydenham chorea', 'erythema marginatum', 'subcutaneous nodules']),
      h('Rheumatic carditis', 'New murmur, tachycardia out of proportion to fever or prolonged PR interval.', ['carditis', 'prolonged pr interval'], 1),
    ],
    must: [mu('Preceding sore throat', 'sore throat 2 to 4 weeks'), mu('Joint examination', 'migratory polyarthritis'), mu('Heart: murmur and rate', 'carditis'), mu('Chorea', 'sydenham chorea'), mu('Skin: nodules and rash', 'erythema marginatum', 'subcutaneous nodules'), mu('ASO titre and ESR', 'aso', 'esr')],
    viva: [v('Revised Jones criteria?', 'Evidence of preceding streptococcal infection plus 2 major or 1 major + 2 minor. Major: carditis, polyarthritis, chorea, erythema marginatum, subcutaneous nodules. Minor: fever, arthralgia, raised ESR or CRP, prolonged PR interval.'), v('Does arthritis of rheumatic fever leave deformity?', 'No, it is migratory, responds to aspirin and leaves no residual damage.'), v('Treatment?', 'Bed rest, penicillin to eradicate streptococcus, aspirin or NSAID for arthritis, steroids for severe carditis, haloperidol or valproate for chorea.'), v('Which heart valve is commonly affected?', 'Mitral first, then aortic.'), v('Duration of secondary prophylaxis?', 'Without carditis 5 years or until age 21; with carditis 10 years or until age 40; lifelong if severe valve disease.'), v('Why is ASO titre not diagnostic alone?', 'It shows past streptococcal infection only; interpreted with clinical criteria.')],
  },
  'med-copd': {
    hints: [
      h('COPD', 'Smoker with chronic productive cough, exertional breathlessness, barrel chest, hyper-resonance and rhonchi.', ['smoker with 20', 'chronic productive cough', 'barrel-shaped chest', 'hyper-resonant', 'prolonged expiration']),
      h('Cor pulmonale', 'Raised JVP and pedal oedema in a patient with chronic lung disease.', ['pedal oedema and raised jvp', 'cyanosis'], 1),
      h('Acute exacerbation', 'Increased breathlessness, sputum volume or purulence.', ['recurrent exacerbations', 'use of accessory muscles'], 1),
    ],
    must: [mu('Smoking in pack-years', 'smoker with 20', 'pack-years'), mu('Chest shape', 'barrel-shaped'), mu('Accessory muscles and pursed-lip breathing', 'accessory muscles', 'pursed-lip'), mu('Percussion', 'hyper-resonant'), mu('Breath sounds and added sounds', 'prolonged expiration'), mu('Signs of cor pulmonale', 'pedal oedema and raised jvp')],
    viva: [v('Define COPD.', 'Persistent airflow limitation that is not fully reversible, with post-bronchodilator FEV1/FVC below 0.7.'), v('Blue bloater versus pink puffer?', 'Blue bloater (chronic bronchitis) is cyanosed, oedematous with cor pulmonale; pink puffer (emphysema) is thin, breathless, non-cyanosed with hyperinflation.'), v('Treatment of stable COPD?', 'Stop smoking, inhaled LAMA/LABA, ICS in frequent exacerbators, pulmonary rehabilitation, vaccination, long-term oxygen if PaO2 under 55 mmHg.'), v('Treatment of acute exacerbation?', 'Nebulised bronchodilators, controlled oxygen 24 to 28%, oral steroids, antibiotics, NIV if acidotic.'), v('Why controlled oxygen?', 'High oxygen removes hypoxic drive in CO2 retainers and worsens hypercapnia.'), v('Spirometry in COPD?', 'FEV1/FVC below 0.7 after bronchodilator, increased TLC and RV, reduced DLCO in emphysema.'), v('GOLD grading by FEV1?', 'GOLD 1 at 80% or more, 2 at 50 to 79%, 3 at 30 to 49%, 4 under 30%.')],
  },
  'med-ild': {
    hints: [
      h('Interstitial lung disease / pulmonary fibrosis', 'Progressive dyspnoea, dry cough, clubbing and bibasal fine velcro crepitations.', ['progressive exertional breathlessness', 'bibasal fine', 'clubbing', 'reduced chest expansion']),
      h('Connective tissue disease associated ILD', 'Arthritis, Raynaud or skin tightening.', ['connective tissue disease'], 1),
      h('Occupational / drug induced ILD', 'Exposure to silica, asbestos, birds, or drugs such as amiodarone.', ['occupational exposure', 'drug history'], 1),
    ],
    must: [mu('Occupational and drug history', 'occupational exposure', 'drug history'), mu('Clubbing', 'clubbing'), mu('Chest expansion', 'reduced chest expansion'), mu('Crepitations', 'bibasal fine'), mu('Pulmonary hypertension signs', 'loud p2'), mu('Features of connective tissue disease', 'connective tissue disease')],
    viva: [v('Characteristic crepitations?', 'Fine end-inspiratory (velcro) crepitations at the bases that do not clear with coughing.'), v('Pattern on spirometry?', 'Restrictive: FVC reduced, FEV1/FVC normal or raised, DLCO reduced.'), v('HRCT feature of IPF?', 'Basal subpleural reticulation with honeycombing (UIP pattern).'), v('Treatment of IPF?', 'Antifibrotics (pirfenidone, nintedanib), oxygen, pulmonary rehabilitation, lung transplant in selected patients.'), v('Causes of upper zone fibrosis?', 'Silicosis, tuberculosis, sarcoidosis, ankylosing spondylitis, hypersensitivity pneumonitis.'), v('Drugs causing fibrosis?', 'Amiodarone, methotrexate, nitrofurantoin, bleomycin.')],
  },
  'med-pleural': {
    hints: [
      h('Pleural effusion', 'Reduced movement, stony dull percussion, absent breath sounds with tracheal shift to the opposite side.', ['stony dull', 'absent breath sounds', 'reduced tactile vocal fremitus', 'reduced chest movement', 'trachea shifted']),
      h('Tuberculous pleural effusion', 'Fever, weight loss and a lymphocytic exudate with high ADA.', ['fever with weight loss', 'ada raised', 'exudate by light'], 2),
      h('Malignant or cardiac effusion', 'Known malignancy, heart failure or liver disease.', ['known malignancy', 'straw-coloured'], 1),
    ],
    must: [mu('Trachea position', 'trachea shifted'), mu('Chest movement', 'reduced chest movement'), mu('Vocal fremitus', 'reduced tactile vocal fremitus'), mu('Percussion', 'stony dull'), mu('Breath sounds', 'absent breath sounds'), mu('Upper border of effusion: aegophony or bronchial breathing', 'aegophony', 'bronchial breathing above')],
    viva: [v('Light criteria for exudate?', 'Pleural fluid protein/serum protein over 0.5, pleural LDH/serum LDH over 0.6, or pleural LDH over two-thirds of the upper limit of normal serum LDH.'), v('Common causes of exudate?', 'Tuberculosis, parapneumonic, malignancy, pulmonary embolism, connective tissue disease.'), v('Common causes of transudate?', 'Heart failure, cirrhosis, nephrotic syndrome, hypoalbuminaemia.'), v('Why is the trachea shifted to the opposite side?', 'The fluid pushes the mediastinum away when large.'), v('Minimum fluid for X-ray visibility?', 'About 200 ml for blunting of the costophrenic angle on PA view.'), v('Where to tap?', 'One or two spaces below the upper level of dullness, above the rib, in the posterior axillary region or under ultrasound guidance.'), v('Pleural fluid ADA value suggestive of TB?', 'Above about 40 U/L.')],
  },
  'med-tb': {
    hints: [
      h('Pulmonary tuberculosis', 'Cough over 2 weeks, evening fever, night sweats, haemoptysis and weight loss.', ['cough for more than 2 weeks', 'evening rise of temperature', 'night sweats', 'haemoptysis', 'loss of weight']),
      h('Cavitary disease', 'Amphoric breath sounds and upper zone cavity.', ['amphoric', 'cavity'], 1),
      h('Predisposition: diabetes or HIV', 'Immune compromise raises risk of TB and atypical presentations.', ['diabetes or hiv', 'contact with a tuberculosis'], 1),
    ],
    must: [mu('Contact history', 'contact with a tuberculosis'), mu('Previous ATT', 'previous antituberculous'), mu('Lymph node examination', 'cervical lymphadenopathy'), mu('Tracheal position', 'tracheal shift'), mu('Upper zone auscultation', 'apical crepitations', 'bronchial breathing'), mu('Sputum AFB / CBNAAT', 'sputum afb', 'cbnaat')],
    viva: [v('Diagnosis in a new case?', 'Sputum smear AFB and CBNAAT/Xpert (rapid molecular test with rifampicin resistance), chest X-ray.'), v('Standard regimen for new drug-sensitive TB?', '2 months of isoniazid, rifampicin, pyrazinamide and ethambutol, then 4 months of isoniazid, rifampicin and ethambutol (daily fixed-dose combination under the national programme).'), v('Side effects of the first line drugs?', 'Isoniazid: hepatitis and peripheral neuropathy (give pyridoxine). Rifampicin: hepatitis, orange urine. Pyrazinamide: hepatitis, hyperuricaemia. Ethambutol: optic neuritis.'), v('Define MDR TB.', 'Resistance to at least isoniazid and rifampicin.'), v('Ghon focus and Ghon complex?', 'Primary parenchymal lesion with the enlarged draining hilar lymph nodes.'), v('Why is the upper zone commonly affected in post-primary TB?', 'High oxygen tension in the apices favours the aerobic bacilli.'), v('DOTS?', 'Directly observed treatment, short course, under the national TB elimination programme.')],
  },
  'med-stroke': {
    hints: [
      h('Ischaemic stroke', 'Sudden hemiparesis with facial palsy, sensory loss and a vascular risk factor, without early headache.', ['sudden onset', 'hemiparesis with spasticity', 'facial palsy of the upper motor neuron', 'atrial fibrillation', 'hypertension']),
      h('Haemorrhagic stroke', 'Headache, vomiting and loss of consciousness at onset with hypertension.', ['headache and vomiting at onset', 'loss of consciousness'], 2),
      h('Dominant hemisphere lesion', 'Right-sided weakness with aphasia.', ['right-sided weakness with aphasia'], 1),
      h('Non-dominant hemisphere lesion', 'Left-sided weakness with neglect.', ['left-sided weakness with neglect'], 1),
    ],
    must: [mu('Time of onset', 'sudden onset'), mu('Risk factors', 'hypertension', 'diabetes', 'smoking'), mu('Consciousness and speech', 'slurred speech', 'aphasia'), mu('Facial palsy type', 'facial palsy of the upper motor neuron'), mu('Tone, power and reflexes', 'hemiparesis with spasticity'), mu('Plantar response', 'extensor plantar'), mu('Carotid and cardiac examination', 'carotid bruit', 'atrial fibrillation')],
    viva: [v('Difference between upper and lower motor neuron facial palsy?', 'In UMN palsy the forehead is spared because of bilateral cortical supply; in LMN palsy the whole half of the face is affected.'), v('Investigation of first choice?', 'Non-contrast CT brain urgently to separate haemorrhage from infarct.'), v('Thrombolysis window?', 'IV alteplase or tenecteplase within 4.5 hours of onset in eligible patients; thrombectomy up to 24 hours in selected large vessel occlusion.'), v('Which artery gives contralateral hemiparesis with aphasia?', 'Middle cerebral artery in the dominant hemisphere.'), v('Secondary prevention?', 'Antiplatelet, statin, BP and diabetes control, anticoagulation in atrial fibrillation, stop smoking, carotid endarterectomy for severe symptomatic stenosis.'), v('Why is tone initially flaccid?', 'Cerebral shock (diaschisis); spasticity develops over days to weeks.'), v('Weber syndrome?', 'Midbrain lesion: ipsilateral third nerve palsy with contralateral hemiparesis.')],
  },
  'med-paraplegia': {
    hints: [
      h('Compressive myelopathy (Pott spine / tumour)', 'Gradual spastic paraparesis with back pain, gibbus and a sensory level.', ['gradual onset over months', 'spinal tenderness or gibbus', 'sensory level present', 'spastic paraparesis', 'back pain']),
      h('Acute transverse myelitis', 'Acute paraparesis with a sensory level and bladder involvement over hours to days.', ['acute onset over hours', 'sensory level present', 'bladder and bowel disturbance'], 2),
      h('Cauda equina / lower motor neuron lesion', 'Flaccid paraparesis with absent reflexes and saddle anaesthesia.', ['flaccid paraparesis'], 1),
      h('Traumatic cord injury', 'History of trauma.', ['trauma history'], 1),
    ],
    must: [mu('Onset and progression', 'acute onset', 'gradual onset'), mu('Bladder and bowel', 'bladder and bowel disturbance'), mu('Sensory level', 'sensory level present'), mu('Tone and reflexes', 'spastic paraparesis', 'flaccid paraparesis'), mu('Plantar response', 'bilateral extensor'), mu('Spine examination', 'spinal tenderness'), mu('Pressure areas', 'pressure sores')],
    viva: [v('UMN versus LMN features?', 'UMN: spasticity, brisk reflexes, extensor plantars, little wasting. LMN: flaccidity, areflexia, wasting, fasciculations.'), v('Investigation of choice for cord compression?', 'MRI of the whole spine.'), v('Causes of spastic paraparesis?', 'Cord compression (Pott, tumour, disc), myelitis, multiple sclerosis, subacute combined degeneration, tropical spastic paraparesis, motor neurone disease.'), v('Causes of acute paraplegia?', 'Trauma, transverse myelitis, spinal cord infarct, epidural haematoma or abscess, Guillain-Barre (flaccid).'), v('Treatment of Pott spine paraplegia?', 'Antituberculous drugs; surgery if no improvement, instability or severe deformity.'), v('Treatment of acute transverse myelitis?', 'IV methylprednisolone, plasma exchange if refractory.'), v('Nursing care?', 'Turn every 2 hours, bladder catheterisation, bowel care, physiotherapy, prevention of pressure sores and DVT.')],
  },
  'med-gbs': {
    hints: [
      h('Guillain-Barre syndrome', 'Ascending symmetrical flaccid weakness with areflexia after an infection.', ['ascending weakness', 'preceding diarrhoea', 'areflexia', 'symmetrical weakness']),
      h('Respiratory muscle involvement', 'Breathlessness, reduced single-breath count or bulbar weakness.', ['breathlessness / respiratory', 'bulbar weakness', 'single-breath count'], 1),
      h('Autonomic involvement', 'Tachycardia and BP swings.', ['autonomic disturbance'], 1),
    ],
    must: [mu('Preceding illness', 'preceding diarrhoea'), mu('Pattern of weakness', 'ascending weakness'), mu('Tone and reflexes', 'hypotonia', 'areflexia'), mu('Sensory examination', 'paraesthesia'), mu('Cranial nerves: face and bulbar', 'facial weakness', 'bulbar'), mu('Respiratory reserve', 'single-breath count', 'respiratory muscle'), mu('Autonomic: pulse and BP', 'autonomic')],
    viva: [v('Classical CSF finding?', 'Albuminocytological dissociation: raised protein with normal cell count, may be normal in the first week.'), v('Nerve conduction findings?', 'Slowed conduction, conduction block, prolonged F waves and absent H reflexes (demyelinating).'), v('Treatment?', 'IV immunoglobulin 0.4 g/kg for 5 days or plasma exchange; supportive care; no steroids.'), v('When to ventilate?', 'Vital capacity under 20 ml/kg, falling trend, or bulbar weakness with aspiration, or PaO2 falling.'), v('Preceding organism?', 'Campylobacter jejuni most often.'), v('Variant with ophthalmoplegia, ataxia and areflexia?', 'Miller Fisher syndrome with anti-GQ1b antibodies.'), v('Is bladder involved?', 'Usually spared; early bladder involvement suggests cord lesion.')],
  },
  'med-mnd': {
    hints: [
      h('Motor neurone disease (ALS)', 'Mixed upper and lower motor neuron signs without sensory loss.', ['wasting of small muscles', 'fasciculations', 'brisk reflexes in the same limb', 'no sensory loss', 'extensor plantar']),
      h('Bulbar onset', 'Dysarthria, dysphagia and tongue wasting.', ['bulbar symptoms', 'tongue wasting'], 1),
    ],
    must: [mu('Pattern of weakness and wasting', 'wasting of small muscles'), mu('Fasciculations', 'fasciculations'), mu('Tone and reflexes in the same limb', 'brisk reflexes in the same limb'), mu('Sensory system is normal', 'no sensory loss'), mu('Tongue and bulbar muscles', 'tongue wasting', 'bulbar'), mu('Bladder and eye movements spared', 'no bladder', 'no extraocular')],
    viva: [v('Why no sensory loss?', 'Only motor neurones in the cortex, brainstem and anterior horn degenerate.'), v('Which systems are classically spared?', 'Sensory system, bladder and bowel, extraocular muscles and cognition (mostly).'), v('Investigations?', 'EMG showing widespread denervation, nerve conduction normal sensory, MRI to exclude cervical myelopathy.'), v('Treatment?', 'Riluzole, non-invasive ventilation, PEG feeding, multidisciplinary supportive care.'), v('Median survival?', 'About 3 to 5 years from onset.'), v('Variants?', 'Progressive muscular atrophy (LMN only), primary lateral sclerosis (UMN only), progressive bulbar palsy.')],
  },
  'med-ataxia': {
    hints: [
      h('Cerebellar syndrome', 'Nystagmus, intention tremor, dysdiadochokinesia, hypotonia and broad-based gait.', ['nystagmus', 'intention tremor', 'dysdiadochokinesia', 'broad-based gait', 'finger-nose test abnormal']),
      h('Alcohol / hypothyroid / drug related ataxia', 'Alcohol intake or hypothyroidism, or phenytoin.', ['alcohol intake', 'hypothyroidism'], 1),
      h('Posterior fossa mass', 'Features of raised intracranial pressure.', ['raised intracranial pressure'], 1),
    ],
    must: [mu('Gait', 'broad-based gait', 'swaying'), mu('Nystagmus', 'nystagmus'), mu('Speech', 'scanning speech'), mu('Finger-nose test', 'finger-nose'), mu('Dysdiadochokinesia', 'dysdiadochokinesia'), mu('Tone and reflexes', 'hypotonia', 'pendular'), mu('Heel-knee test and tandem walking', 'knee-heel', 'tandem')],
    viva: [v('Side of lesion?', 'Cerebellar signs are ipsilateral to the lesion in a hemisphere.'), v('Vermis versus hemisphere lesion?', 'Vermis: truncal ataxia and gait ataxia. Hemisphere: limb ataxia, intention tremor, nystagmus.'), v('Cerebellar speech?', 'Slow, slurred, scanning or staccato.'), v('Causes of cerebellar ataxia?', 'Stroke, tumour, multiple sclerosis, alcohol, drugs (phenytoin), hypothyroidism, hereditary ataxias, paraneoplastic.'), v('Romberg sign?', 'Positive in sensory ataxia (loss of joint position sense), not in cerebellar ataxia.'), v('Rebound phenomenon?', 'Failure to check the limb after sudden release of resisted flexion.')],
  },
  'med-dementia': {
    hints: [
      h('Alzheimer disease', 'Gradual memory loss with disorientation, no stepwise course and normal examination.', ['gradual forgetfulness', 'disorientation', 'loss of learned skills', 'memory impaired']),
      h('Vascular dementia', 'Stepwise deterioration with hypertension, diabetes or previous stroke.', ['stepwise deterioration', 'hypertension, diabetes'], 1),
      h('Dementia with Lewy bodies', 'Visual hallucinations and parkinsonism.', ['parkinsonism or visual'], 1),
      h('Reversible causes', 'Hypothyroidism, B12 deficiency, hypercalcaemia, depression and normal pressure hydrocephalus.', ['reversible causes', 'depression excluded'], 1),
    ],
    must: [mu('Informant history', 'informant'), mu('Onset and course', 'gradual forgetfulness', 'stepwise'), mu('Daily activities', 'impaired daily activities'), mu('Bedside cognitive test', 'memory impaired', 'mini-mental'), mu('Neurological examination for focal signs', 'parkinsonism'), mu('Exclude depression and reversible causes', 'depression excluded', 'reversible causes')],
    viva: [v('Difference between delirium and dementia?', 'Delirium is acute, fluctuating with impaired attention and altered consciousness; dementia is chronic and progressive with clear consciousness.'), v('Mini-Mental State Examination maximum score?', '30; below 24 suggests cognitive impairment.'), v('Reversible causes?', 'Hypothyroidism, B12 deficiency, neurosyphilis, hypercalcaemia, normal pressure hydrocephalus, depression, drugs, subdural haematoma.'), v('Normal pressure hydrocephalus triad?', 'Gait disturbance, urinary incontinence, dementia.'), v('Drugs for Alzheimer?', 'Donepezil, rivastigmine, galantamine (cholinesterase inhibitors) and memantine.'), v('Pathology of Alzheimer?', 'Extracellular amyloid plaques and intracellular neurofibrillary tangles of tau.')],
  },
  'med-dcld': {
    hints: [
      h('Decompensated cirrhosis with portal hypertension', 'Ascites, splenomegaly, caput medusae and varices.', ['shifting dullness', 'splenomegaly', 'caput medusae', 'varices on endoscopy', 'ascitic fluid saag']),
      h('Hepatic encephalopathy', 'Confusion, altered sleep pattern and flapping tremor.', ['confusion or altered sleep', 'flapping tremor'], 1),
      h('Spontaneous bacterial peritonitis', 'Fever, abdominal pain and tenderness in ascites.', ['spontaneous bacterial peritonitis'], 1),
      h('Alcohol related cirrhosis', 'Chronic heavy alcohol use.', ['alcohol intake'], 1),
    ],
    must: [mu('Alcohol, hepatitis B/C and transfusion history', 'alcohol intake', 'hepatitis b or c'), mu('Stigmata of chronic liver disease', 'spider naevi', 'palmar erythema', 'gynaecomastia'), mu('Asterixis', 'flapping tremor'), mu('Ascites: shifting dullness and fluid thrill', 'shifting dullness'), mu('Spleen and liver', 'splenomegaly', 'nodular liver'), mu('Pedal oedema', 'pedal oedema'), mu('Bleeding history', 'haematemesis or melaena')],
    viva: [v('Child-Pugh components?', 'Bilirubin, albumin, INR, ascites, encephalopathy.'), v('SAAG meaning?', 'Serum minus ascitic albumin; 1.1 g/dl or more indicates portal hypertension.'), v('Ascitic fluid analysis?', 'Cell count (neutrophils 250 or more = SBP), albumin, protein, culture, cytology.'), v('Treatment of ascites?', 'Salt restriction, spironolactone with furosemide, paracentesis with albumin if tense, TIPS in refractory cases.'), v('Treatment of variceal bleed?', 'Resuscitation, terlipressin or octreotide, antibiotics, endoscopic band ligation; propranolol for prophylaxis.'), v('Precipitants of encephalopathy?', 'GI bleed, infection, constipation, sedatives, electrolyte disturbance, diuretics.'), v('Treatment of encephalopathy?', 'Treat the precipitant, lactulose, rifaximin.')],
  },
  'med-ald': {
    hints: [
      h('Alcoholic hepatitis', 'Heavy drinker with fever, tender hepatomegaly and jaundice.', ['tender hepatomegaly', 'jaundice', 'fever', 'daily alcohol intake']),
      h('Alcoholic cirrhosis', 'Ascites, spider naevi and Dupuytren contracture.', ['ascites', 'dupuytren'], 1),
      h('Alcohol dependence', 'Positive CAGE questionnaire and withdrawal.', ['cage questionnaire', 'withdrawal'], 1),
    ],
    must: [mu('Quantity and duration of alcohol', 'daily alcohol intake', 'quantity'), mu('CAGE questions', 'cage'), mu('Liver size and tenderness', 'tender hepatomegaly'), mu('Jaundice and stigmata', 'jaundice', 'parotid', 'dupuytren'), mu('Ascites', 'ascites'), mu('AST:ALT and GGT', 'ast to alt', 'ggt')],
    viva: [v('CAGE questionnaire?', 'Cut down, Annoyed, Guilty, Eye-opener; 2 positives suggest dependence.'), v('Typical enzyme pattern?', 'AST more than ALT (ratio over 2), raised GGT and MCV.'), v('Maddrey discriminant function?', 'Used in alcoholic hepatitis; 32 or more suggests severe disease needing steroids.'), v('Stages of alcoholic liver disease?', 'Fatty liver, alcoholic hepatitis, cirrhosis.'), v('Treatment?', 'Abstinence, nutrition, thiamine and vitamins, steroids in severe hepatitis, transplantation in selected cases.'), v('Delirium tremens?', 'Withdrawal state at 48 to 72 hours with confusion, tremor, hallucinations and autonomic overactivity; treated with benzodiazepines and thiamine.')],
  },
  'med-pancreatitis': {
    hints: [
      h('Chronic pancreatitis', 'Recurrent epigastric pain radiating to the back, steatorrhoea, weight loss and diabetes.', ['recurrent epigastric pain', 'steatorrhoea', 'weight loss', 'diabetes mellitus', 'leaning forward']),
      h('Pancreatic pseudocyst', 'Epigastric mass after pancreatitis.', ['pseudocyst'], 1),
      h('Alcohol / gallstone aetiology', 'Alcohol intake or gallstones.', ['alcohol intake', 'gallstone'], 1),
    ],
    must: [mu('Pain: site, radiation, relief', 'recurrent epigastric pain', 'leaning forward'), mu('Alcohol and gallstones', 'alcohol intake', 'gallstone'), mu('Stool character', 'steatorrhoea'), mu('Weight and nutrition', 'weight loss'), mu('Epigastric mass or tenderness', 'epigastric tenderness', 'pseudocyst'), mu('Diabetes', 'diabetes mellitus')],
    viva: [v('Triad of chronic pancreatitis?', 'Pancreatic calcification, steatorrhoea and diabetes mellitus.'), v('Commonest cause?', 'Alcohol in adults; tropical calcific pancreatitis is common in south India.'), v('Investigations?', 'CT abdomen (calcification, duct dilatation), faecal elastase, serum amylase may be normal, MRCP.'), v('Treatment?', 'Abstinence, analgesia, pancreatic enzyme replacement, insulin, endoscopic or surgical drainage (Puestow).'), v('Complications?', 'Pseudocyst, bile duct obstruction, splenic vein thrombosis, pancreatic cancer.'), v('Why steatorrhoea?', 'Lipase deficiency; more than 90% of the gland must be lost.')],
  },
  'med-hsm': {
    hints: [
      h('Portal hypertension with hepatosplenomegaly', 'Ascites, jaundice and stigmata of liver disease.', ['ascites with portal hypertension', 'jaundice'], 1),
      h('Haematological: leukaemia / lymphoma / haemolysis', 'Pallor, lymphadenopathy and bleeding with splenomegaly.', ['pallor', 'lymphadenopathy', 'bleeding manifestations'], 2),
      h('Infective: malaria, kala-azar, enteric', 'Fever with chills and hepatosplenomegaly.', ['fever and chills'], 1),
      h('Congestive cardiac failure', 'Raised JVP with tender hepatomegaly.', ['raised jvp'], 1),
    ],
    must: [mu('Liver size, edge and surface', 'palpable liver'), mu('Spleen size and notch', 'palpable spleen', 'splenic notch'), mu('Is it possible to get above the mass?', 'cannot get above'), mu('Respiratory movement', 'moves with respiration'), mu('Lymph nodes and pallor', 'lymphadenopathy', 'pallor'), mu('Ascites and jaundice', 'ascites', 'jaundice')],
    viva: [v('How to differentiate spleen from left kidney?', 'Spleen has a notch, moves with respiration towards the right iliac fossa, you cannot get above it, and has no resonant band in front; kidney is ballotable and bimanually palpable with a colon in front.'), v('Causes of massive splenomegaly?', 'Chronic myeloid leukaemia, myelofibrosis, kala-azar, chronic malaria, Gaucher disease.'), v('Causes of hepatosplenomegaly with fever?', 'Malaria, enteric fever, kala-azar, tuberculosis, infectious mononucleosis, lymphoma.'), v('Riedel lobe?', 'A tongue-like downward projection of the right lobe, a normal variant.'), v('Causes of hepatomegaly without splenomegaly?', 'Hepatitis, fatty liver, congestive failure, hepatocellular carcinoma, abscess.'), v('Investigations?', 'CBC with peripheral smear, LFT, ultrasound abdomen, malarial and dengue tests, bone marrow if needed.')],
  },
}
