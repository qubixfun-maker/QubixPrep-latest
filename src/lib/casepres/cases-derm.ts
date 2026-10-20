import type { CaseDef, Section } from './types'
import { area, ch, fd, sym, sec, at } from './dsl'
import { mk } from './cases-util'

const PRIM = ['Macule', 'Patch', 'Papule', 'Plaque', 'Nodule', 'Vesicle', 'Bulla', 'Pustule', 'Wheal', 'Cyst']
const SECOND = ['Scales', 'Crusts', 'Erosions', 'Ulcers', 'Excoriations', 'Lichenification', 'Scars', 'Atrophy', 'Fissures', 'Hyperpigmentation after healing']

/** Cutaneous examination: distribution, primary and secondary lesions, plus case-specific signs. */
const skin = (o: { dist?: string[]; prim?: string[]; second?: string[]; signs?: string[]; signsLabel?: string; hair?: string[]; mucosa?: string[] } = {}): Section[] => [
  sec('dist', 'Cutaneous examination: distribution and morphology', [
    fd('distF', 'Distribution', ['Face', 'Scalp', 'Trunk', 'Extensor surfaces of limbs', 'Flexural areas', 'Palms and soles', 'Generalised', 'Symmetrical', 'Asymmetrical', 'Photo-exposed areas', 'Seborrhoeic areas', 'Web spaces of fingers', 'Genital area', ...(o.dist || [])]),
    fd('primF', 'Primary lesions', [...PRIM, ...(o.prim || [])]),
    fd('secF', 'Secondary changes', [...SECOND, ...(o.second || [])]),
    area('lesN', 'Describe size, shape, colour, margins, surface and arrangement of the lesion(s)'),
  ]),
  sec('signs', 'Cutaneous examination: signs and tests', [
    fd('signF', o.signsLabel || 'Signs (present = positive)', o.signs || ['Koebner phenomenon positive']),
  ]),
  sec('adnexa', 'Hair, nails and mucosa', [
    fd('adnF', 'Findings', ['Nail pitting', 'Onycholysis', 'Nail thickening and discolouration', 'Nail dystrophy', 'Hair loss (alopecia)', 'Broken hairs', 'Oral mucosal lesions', 'Genital mucosal lesions', 'Conjunctival lesions', 'Lymph nodes enlarged', ...(o.hair || []), ...(o.mucosa || [])]),
    area('adnN', 'Details'),
  ]),
]

const papulo = mk({
  id: 'derm-papulosq', subject: 'dermatology', title: 'Scaly skin lesions (papulosquamous)', blurb: 'Psoriasis, lichen planus, tinea, seborrhoeic dermatitis, pityriasis rosea',
  complaints: ['Scaly patches', 'Itching', 'Red raised lesions', 'Nail changes', 'Joint pain', 'Dandruff', 'Ring-shaped lesions', 'Hair loss', 'White flaky skin', 'Burning sensation'],
  hpi: [
    sym('lesion', 'Skin lesions', ['onset', 'duration', 'progression', at('site', 'First appeared on', ['Elbows and knees', 'Scalp', 'Trunk', 'Groin', 'Face', 'Palms and soles', 'Nails', 'Wrists and ankles'], true), at('pat', 'Pattern', ['Persistent', 'Relapsing and remitting', 'Seasonal', 'Spreading'])]),
    sym('itch', 'Itching', ['onset', 'duration', at('sev', 'Severity', ['Mild', 'Moderate', 'Severe']), at('time', 'Worse', ['At night', 'On sweating', 'In winter', 'After bathing'], true)]),
    sym('scale', 'Scaling', ['onset', at('type', 'Type', ['Silvery white scales', 'Fine branny scales', 'Greasy yellow scales', 'Collarette scale', 'Adherent scales'], true)]),
    sym('nail', 'Nail changes', ['onset', 'duration', at('ass', 'Changes', ['Pitting', 'Yellow discolouration', 'Thickening', 'Lifting of nail plate', 'Ridging', 'Crumbling'], true)]),
    sym('joint', 'Joint symptoms', ['onset', 'duration', at('ass', 'Features', ['Pain in small joints', 'Morning stiffness', 'Back pain', 'Swollen fingers or toes'], true)]),
    sym('trig', 'Triggers', ['onset', at('ass', 'Factor', ['Sore throat before onset', 'Injury or scratching', 'Stress', 'Drugs (chloroquine, beta-blockers, lithium)', 'Sunlight', 'Sweating or humid weather', 'Alcohol', 'Stopped steroids'], true)]),
    sym('contact', 'Contact with similar lesions', ['duration', at('ass', 'Contact', ['Family members', 'Pets', 'Animals', 'Sharing clothes or towels'], true)]),
    sym('rxhx', 'Previous treatment', ['duration', at('ass', 'Treatment', ['Steroid creams', 'Antifungal creams', 'Oral antifungals', 'Methotrexate', 'Phototherapy', 'Traditional remedies', 'Oral steroids'], true)]),
    sym('mouth', 'Mucosal lesions', ['onset', at('ass', 'Site', ['White lacy lesions in the mouth', 'Genital lesions', 'Scalp lesions'], true)]),
  ],
  pastExtra: ['Psoriasis', 'Atopy', 'Fungal infection', 'Streptococcal infection', 'Hepatitis C', 'Drug intake (chloroquine, beta-blocker, lithium)'],
  familyExtra: ['Psoriasis', 'Skin disease', 'Autoimmune disease'],
  exam: skin({
    signs: ['Auspitz sign positive', 'Candle grease sign positive', 'Koebner phenomenon positive', 'Wickham striae present', 'Collarette scale present', 'Herald patch present', 'Christmas tree pattern', 'Active edge with central clearing', 'Greasy scales'],
    dist: ['Extensor aspect of elbows and knees', 'Sacral area', 'Umbilicus', 'Natal cleft', 'Flexural flaring of the groin'],
    prim: ['Silvery scaly plaque', 'Violaceous flat-topped papule (purple, pruritic, polygonal)', 'Annular lesion with raised edge'],
    mucosa: ['Wickham striae in the buccal mucosa', 'Geographic tongue'],
    hair: ['Scarring alopecia', 'Scalp plaques', 'Tinea capitis (black dot, kerion)'],
  }),
})

const eczema = mk({
  id: 'derm-eczema', subject: 'dermatology', title: 'Itchy rash (eczema, scabies, urticaria)', blurb: 'Atopic and contact dermatitis, scabies, urticaria, drug eruption, pruritus',
  complaints: ['Itching', 'Rash', 'Itching worse at night', 'Red swollen weals', 'Dry skin', 'Blisters or oozing', 'Lip or eyelid swelling', 'Rash after taking medicine', 'Itching in several family members', 'Hair loss'],
  hpi: [
    sym('itch', 'Itching', ['onset', 'duration', 'progression', at('time', 'Pattern', ['Worse at night', 'Worse with sweating', 'Worse with dry weather', 'Constant'], true), at('sev', 'Severity', ['Mild', 'Moderate', 'Disturbs sleep'])]),
    sym('rash', 'Rash', ['onset', 'duration', 'progression', at('site', 'Sites', ['Finger webs', 'Wrists', 'Axillae', 'Genitalia', 'Flexures of elbows and knees', 'Face', 'Hands', 'Feet', 'Generalised'], true), at('type', 'Type', ['Papules', 'Vesicles', 'Burrows', 'Weals', 'Dry scaly patches', 'Blisters'], true)]),
    sym('weals', 'Weals (hives)', ['onset', 'duration', at('ass', 'Features', ['Each lasts less than 24 hours', 'Lasts more than 24 hours', 'Swelling of lips and eyelids (angioedema)', 'Difficulty breathing', 'Throat tightness'], true), at('pat', 'Course', ['Acute (less than 6 weeks)', 'Chronic (more than 6 weeks)'])]),
    sym('contact', 'Contact with a similar illness', ['duration', at('ass', 'Contact', ['Family members itching', 'Roommates or hostel mates', 'Sexual contact', 'Pets'], true)]),
    sym('trig', 'Triggers', ['onset', at('ass', 'Factor', ['Soaps and detergents', 'Cosmetics, hair dye or jewellery', 'Footwear or rubber', 'Plants or occupational chemicals', 'Foods', 'Drugs', 'Heat or cold', 'Pressure', 'Stress', 'Dust or pollen'], true)]),
    sym('drug', 'Drug intake before the rash', ['onset', at('ass', 'Drugs', ['Antibiotics (penicillin, sulphonamide)', 'Anticonvulsants', 'NSAIDs', 'Allopurinol', 'Antitubercular drugs', 'Herbal medicines'], true), at('time', 'Rash started', ['Within 1 hour', '1 to 3 weeks after starting', 'Soon after rechallenge'])]),
    sym('atopy', 'Atopic features', ['duration', at('ass', 'Features', ['Childhood eczema', 'Asthma', 'Allergic rhinitis', 'Dry skin since childhood'], true)]),
    sym('infect', 'Secondary infection', ['onset', at('ass', 'Features', ['Pus or honey-coloured crusts', 'Foul smell', 'Fever', 'Painful regional nodes'], true)]),
    sym('rxhx', 'Previous treatment', ['duration', at('ass', 'Treatment', ['Steroid creams', 'Antihistamines', 'Permethrin', 'Moisturisers', 'Oral steroids', 'Traditional remedies'], true)]),
    sym('sys', 'Systemic symptoms', ['onset', at('ass', 'Symptoms', ['Fever', 'Joint pain', 'Mouth ulcers', 'Eye redness', 'Abdominal pain', 'Weight loss'], true)]),
  ],
  pastExtra: ['Atopic dermatitis', 'Asthma', 'Hay fever', 'Drug allergy', 'Urticaria', 'Thyroid disease', 'Scabies in the past'],
  familyExtra: ['Atopy, asthma or eczema', 'Similar itching in the household', 'Urticaria'],
  exam: skin({
    signs: ['Burrows present', 'Dermographism positive', 'Weals blanch on pressure', 'Lichenification at flexures', 'Dennie-Morgan fold', 'Nikolsky sign negative', 'Positive patch test'],
    dist: ['Finger web spaces', 'Wrists', 'Axillary folds', 'Areolae', 'Periumbilical area', 'Antecubital and popliteal fossae', 'Photo-distributed rash'],
    prim: ['Excoriated papules', 'Weals', 'Papulovesicles', 'Burrow'],
    second: ['Impetiginised lesions', 'Dryness (xerosis)', 'Post-inflammatory pigmentation'],
    hair: ['Crusted nodules on palms and soles (crusted scabies)', 'Facial angioedema', 'Mucosal involvement (erosions)'],
  }),
})

const bullous = mk({
  id: 'derm-bullous', subject: 'dermatology', title: 'Blistering disorders (vesiculobullous)', blurb: 'Pemphigus, bullous pemphigoid, herpes zoster, drug-induced blisters, SJS/TEN',
  complaints: ['Blisters', 'Painful erosions in the mouth', 'Burning or pain', 'Itching', 'Fever', 'Raw areas on the skin', 'Difficulty swallowing', 'Red eyes', 'Rash after taking medicine', 'Band-like painful rash'],
  hpi: [
    sym('blister', 'Blisters', ['onset', 'duration', 'progression', at('site', 'First appeared at', ['Mouth', 'Trunk', 'Flexures', 'Limbs', 'Scalp', 'One side of the body'], true), at('type', 'Nature', ['Flaccid and easily ruptured', 'Tense and firm', 'Grouped vesicles', 'Haemorrhagic'], true)]),
    sym('mouth', 'Oral lesions', ['onset', 'duration', at('ass', 'Features', ['Painful erosions', 'Difficulty eating', 'Precedes skin lesions', 'Hoarseness of voice'], true)]),
    sym('pain', 'Pain / burning', ['onset', 'duration', at('ass', 'Features', ['Burning before the rash', 'Band-like along a dermatome', 'Persists after healing (post-herpetic)'], true)]),
    sym('itch', 'Itching', ['onset', 'duration', at('ass', 'Features', ['Urticarial prodrome', 'Severe itch before blisters'], true)]),
    sym('drug', 'Drug history', ['onset', at('ass', 'Drug', ['Antibiotics', 'Anticonvulsants', 'NSAIDs', 'Allopurinol', 'Penicillamine', 'Captopril', 'Frusemide'], true), at('time', 'Started', ['Within 1 to 3 weeks of the rash', 'Before the rash for months'])]),
    sym('sys', 'Systemic symptoms', ['onset', at('ass', 'Symptoms', ['Fever', 'Malaise', 'Loss of weight', 'Red eyes', 'Genital erosions', 'Diarrhoea'], true)]),
    sym('eye', 'Mucosal involvement', ['onset', at('ass', 'Site', ['Eyes', 'Mouth', 'Genitalia', 'Pharynx'], true)]),
    sym('immuno', 'Triggers', ['onset', at('ass', 'Factor', ['Chickenpox in the past', 'Immunosuppression', 'Old age', 'Radiotherapy', 'None'], true)]),
    sym('rxhx', 'Previous treatment', ['duration', at('ass', 'Treatment', ['Oral steroids', 'Azathioprine', 'Rituximab', 'Acyclovir', 'Topical steroids', 'Traditional remedies'], true)]),
  ],
  pastExtra: ['Autoimmune disease', 'Myasthenia gravis', 'Thymoma', 'Chickenpox', 'Drug reaction', 'HIV'],
  familyExtra: ['Autoimmune skin disease', 'Autoimmune disease'],
  exam: skin({
    signs: ['Nikolsky sign positive', 'Asboe-Hansen (bulla spread) sign positive', 'Tzanck smear positive', 'Dermatomal distribution', 'Target lesions'],
    dist: ['Oral mucosa', 'Grouped vesicles along a dermatome', 'Flexural predominance'],
    prim: ['Flaccid bulla', 'Tense bulla', 'Grouped vesicles on an erythematous base', 'Target (iris) lesion', 'Erosion with collarette of blister roof'],
    second: ['Positive ruptured bulla with raw area', 'Haemorrhagic crusts', 'Dermatomal scarring'],
    mucosa: ['Oral erosions', 'Conjunctival synechiae', 'Genital erosions', 'Lip crusting'],
  }).concat([
    sec('severity', 'Severity assessment', [
      fd('sevF', 'Findings', ['Body surface area detached above 30%', 'Hypotension', 'Fever', 'Secondary infection', 'Dehydration', 'Ocular involvement', 'Hoarseness (laryngeal involvement)']),
      area('sevN', 'Percentage body surface area affected'),
    ]),
  ]),
})

const leprosy = mk({
  id: 'derm-leprosy', subject: 'dermatology', title: 'Hypopigmented patches (leprosy)', blurb: 'Leprosy classification, nerve examination, lepra reactions, deformities, differential diagnosis',
  complaints: ['Skin patch', 'Loss of sensation in the patch', 'Numbness of hands or feet', 'Tingling', 'Painless ulcer', 'Weakness of hands or feet', 'Skin nodules', 'Eyebrow loss', 'Painful swollen nerves', 'Fever with new red lesions', 'Deformity of fingers or toes'],
  hpi: [
    sym('patch', 'Skin patches', ['onset', 'duration', 'progression', at('num', 'Number', ['One', 'Few (2 to 5)', 'Many']), at('type', 'Appearance', ['Hypopigmented', 'Erythematous', 'Coppery', 'Raised edge', 'Dry and hairless', 'Shiny'], true)]),
    sym('sens', 'Loss of sensation', ['onset', 'duration', at('ass', 'Sensation lost', ['In the patch', 'Hands and feet (glove and stocking)', 'Burns noticed without pain', 'Cannot feel heat or cold'], true)]),
    sym('nerve', 'Nerve symptoms', ['onset', 'duration', at('ass', 'Features', ['Nerve pain or tenderness', 'Thickened nerves noticed', 'Tingling', 'Numbness', 'Weakness of hands (claw hand)', 'Foot drop', 'Inability to close the eye'], true)]),
    sym('ulcer', 'Painless ulcers', ['onset', 'duration', 'site', at('ass', 'Features', ['Painless', 'Recurrent', 'Not healing', 'Foul smell'], true)]),
    sym('nodule', 'Nodules / infiltration', ['onset', 'duration', at('site', 'Site', ['Face', 'Ears', 'Trunk', 'Limbs'], true)]),
    sym('mucosa', 'Nose and face symptoms', ['onset', at('ass', 'Symptoms', ['Nasal stuffiness and bleeding', 'Loss of eyebrows and eyelashes', 'Thickened ear lobes', 'Saddle nose'], true)]),
    sym('reaction', 'Reaction episodes', ['onset', 'duration', at('ass', 'Features', ['Fever', 'New red tender nodules (ENL)', 'Existing patches become red and swollen', 'Painful nerves', 'Joint pains', 'Swelling of hands and feet'], true)]),
    sym('contact', 'Contact history', ['duration', at('ass', 'Contact', ['Family member with leprosy', 'Neighbour with leprosy', 'Lives in endemic area'], true)]),
    sym('rxhx', 'Treatment history', ['duration', at('ass', 'Treatment', ['Multidrug therapy (MDT)', 'Irregular treatment', 'Steroids for reaction', 'Thalidomide or clofazimine for ENL', 'No treatment'], true)]),
    sym('func', 'Functional problems', ['onset', at('ass', 'Problem', ['Burns and cuts in the hands', 'Difficulty holding objects', 'Foot ulcers while walking', 'Visual problems', 'Stigma or job loss'], true)]),
  ],
  pastExtra: ['Leprosy', 'Tuberculosis', 'Vitiligo', 'Diabetes mellitus', 'Reaction episodes'],
  familyExtra: ['Leprosy'],
  exam: skin({
    signs: ['Hypoaesthetic patch', 'Anaesthetic patch', 'Loss of hair in the patch', 'Loss of sweating in the patch', 'Histamine flare absent', 'Hypopigmented macule with raised edge', 'Infiltrated plaque', 'Foamy macrophages (slit-skin smear positive)'],
    dist: ['Asymmetrical patches (tuberculoid)', 'Symmetrical diffuse involvement (lepromatous)', 'Ear lobes thickened'],
    prim: ['Hypopigmented anaesthetic patch', 'Erythematous infiltrated plaque', 'Papulonodular lesions', 'Tender red nodules (ENL)'],
    mucosa: ['Madarosis (loss of eyebrows)', 'Saddle nose', 'Collapsed nose bridge', 'Facial leonine appearance', 'Lagophthalmos'],
  }).concat([
    sec('nerves', 'Nerve examination', [
      fd('nerveF', 'Thickened or tender nerves', ['Greater auricular nerve thickened', 'Ulnar nerve thickened', 'Median nerve thickened', 'Radial cutaneous nerve thickened', 'Lateral popliteal nerve thickened', 'Posterior tibial nerve thickened', 'Nerve tenderness']),
      fd('motorF', 'Motor and sensory loss', ['Claw hand', 'Wrist drop', 'Foot drop', 'Lagophthalmos (cannot close the eye)', 'Loss of sensation in the hand', 'Loss of sensation in the foot', 'Wasting of small muscles of the hand', 'Wasting of the first dorsal interosseous', 'Weak abductor pollicis brevis', 'Voluntary muscle testing abnormal']),
      area('nerveN', 'Nerves examined with side and grade of thickening'),
    ]),
    sec('deform', 'Disability and deformity grading', [
      fd('defF', 'Findings', ['Plantar ulcer', 'Absorption of digits', 'Neuropathic ulcer', 'Contractures', 'Corneal anaesthesia', 'Eye involvement', 'Mutilation of hands or feet']),
      ch('whoG', 'WHO disability grade', ['Grade 0: no disability', 'Grade 1: loss of sensation', 'Grade 2: visible deformity or damage']),
    ]),
  ]),
})

const pigment = mk({
  id: 'derm-pigment', subject: 'dermatology', title: 'Pigmentary disorders and skin growths', blurb: 'Vitiligo, melasma, naevi, warts, skin tumours, non-healing ulcers',
  complaints: ['White patches', 'Dark patches on the face', 'Mole changing', 'Skin lump', 'Non-healing sore', 'Warts', 'Skin tag', 'Bleeding mole', 'Itching mole', 'Thickened skin'],
  hpi: [
    sym('patch', 'Pigmentary change', ['onset', 'duration', 'progression', at('type', 'Type', ['White patches (depigmented)', 'Dark patches', 'Patchy loss of colour', 'Generalised darkening'], true), at('site', 'Site', ['Face', 'Hands', 'Around the mouth and eyes', 'Genitals', 'Trunk', 'Limbs'], true)]),
    sym('hair', 'Hair in the lesion', ['onset', at('ass', 'Hair', ['White hair (leucotrichia)', 'Normal hair'], true)]),
    sym('trig', 'Triggers', ['onset', at('ass', 'Factor', ['Sun exposure', 'Pregnancy', 'Oral contraceptive pills', 'Cosmetics', 'Trauma or friction', 'Stress', 'Thyroid disease', 'Inflammation or acne'], true)]),
    sym('lump', 'Skin growth / lump', ['onset', 'duration', 'progression', 'site', at('ass', 'Features', ['Rapid growth', 'Bleeding', 'Ulceration', 'Itching', 'Pain', 'Change in colour', 'Irregular edges'], true)]),
    sym('ulcer', 'Non-healing ulcer', ['onset', 'duration', 'site', at('ass', 'Features', ['Raised pearly edge', 'Everted edge', 'Bleeds easily', 'Arises from an old scar or burn', 'Painless'], true)]),
    sym('mole', 'Change in an existing mole', ['onset', 'duration', at('ass', 'ABCDE change', ['Asymmetry', 'Border irregularity', 'Colour variation', 'Diameter increase above 6 mm', 'Evolution'], true)]),
    sym('exp', 'Risk factors', ['duration', at('ass', 'Risk', ['Chronic sun exposure', 'Fair skin', 'Previous sunburn', 'Arsenic exposure', 'Chronic scar or wound', 'Immunosuppression', 'Radiotherapy'], true)]),
    sym('wart', 'Warts / contagious growths', ['onset', 'duration', at('ass', 'Type', ['Common warts', 'Plantar warts', 'Genital warts', 'Molluscum (umbilicated papules)'], true)]),
    sym('assoc', 'Associated autoimmune disease', ['duration', at('ass', 'Disease', ['Thyroid disease', 'Diabetes', 'Alopecia areata', 'Pernicious anaemia', 'Rheumatoid arthritis'], true)]),
    sym('rxhx', 'Previous treatment', ['duration', at('ass', 'Treatment', ['Topical steroids', 'Tacrolimus', 'Phototherapy', 'Sunscreen', 'Skin lightening creams', 'Excision', 'Cautery', 'Traditional remedies'], true)]),
  ],
  pastExtra: ['Thyroid disease', 'Previous skin cancer', 'Sunburn', 'Burn scar', 'Immunosuppressive therapy'],
  familyExtra: ['Vitiligo', 'Skin cancer', 'Melanoma', 'Thyroid disease'],
  exam: skin({
    signs: ['Wood lamp accentuation of depigmentation', 'Koebner phenomenon positive', 'Leucotrichia', 'Symmetrical depigmented patches', 'Pearly rolled edge', 'Telangiectasia over the surface', 'ABCDE criteria positive', 'Satellite lesions', 'Epidermal melasma pattern (malar, centrofacial)', 'Verrucous surface', 'Umbilicated papule'],
    dist: ['Periorificial', 'Acral', 'Malar and centrofacial', 'Sun-exposed areas'],
    prim: ['Depigmented macule', 'Hyperpigmented macule', 'Pearly nodule', 'Verrucous papule', 'Pigmented lesion with irregular edge', 'Non-healing ulcer with everted edge'],
    hair: ['Regional lymph nodes enlarged', 'Hepatomegaly (metastasis)', 'Thyroid enlargement'],
  }),
})

export const DERM_CASES: CaseDef[] = [papulo, eczema, bullous, leprosy, pigment]
