import type { CaseDef, Section } from './types'
import { txt, area, fd, sym, sec, at } from './dsl'
import { mk } from './cases-util'

const SIDE = at('side', 'Eye', ['Right eye', 'Left eye', 'Both eyes'])

/** Visual acuity block, shared by every eye case. */
const va = (): Section =>
  sec('va', 'Visual acuity and refraction', [
    txt('vaR', 'Distant vision: right eye', { half: true }), txt('vaL', 'Distant vision: left eye', { half: true }),
    txt('phR', 'With pinhole: right eye', { half: true }), txt('phL', 'With pinhole: left eye', { half: true }),
    txt('nvR', 'Near vision: right eye', { half: true }), txt('nvL', 'Near vision: left eye', { half: true }),
    fd('vaF', 'Findings', ['Pinhole improves vision', 'Perception of light absent', 'Counting fingers only', 'Hand movements only', 'Colour vision defect', 'Relative afferent pupillary defect', 'Field defect on confrontation']),
    area('vaN', 'Visual acuity chart used (Snellen), refraction and spectacle power'),
  ])

const front = (o: { lids?: string[]; conj?: string[]; cornea?: string[]; ac?: string[]; iris?: string[]; lens?: string[] } = {}): Section[] => [
  sec('lids', 'Eyelids, lacrimal apparatus and orbit', [
    fd('lidF', 'Findings', ['Lid swelling', 'Lid margin redness', 'Ptosis', 'Lagophthalmos', 'Ectropion', 'Entropion', 'Trichiasis', 'Lid lump', 'Blepharitis (crusting at the margins)', 'Regurgitation on pressure over the lacrimal sac', 'Swelling of the lacrimal sac', 'Proptosis', ...(o.lids || [])]),
    area('lidN', 'Right and left eye findings'),
  ]),
  sec('conj', 'Conjunctiva and sclera', [
    fd('conjF', 'Findings', ['Conjunctival congestion (diffuse)', 'Ciliary congestion (circumcorneal)', 'Subconjunctival haemorrhage', 'Chemosis', 'Papillae', 'Follicles', 'Discharge', 'Pallor', 'Icterus', 'Pterygium', 'Pinguecula', 'Scleral nodule', ...(o.conj || [])]),
  ]),
  sec('cornea', 'Cornea', [
    fd('corF', 'Findings', ['Corneal haze or oedema', 'Corneal opacity (leucoma)', 'Corneal ulcer', 'Fluorescein staining positive', 'Corneal vascularisation', 'Keratic precipitates', 'Reduced corneal sensation', 'Arcus senilis', 'Foreign body', ...(o.cornea || [])]),
    area('corN', 'Size and site of any ulcer or opacity'),
  ]),
  sec('ac', 'Anterior chamber, iris and pupil', [
    fd('acF', 'Findings', ['Shallow anterior chamber', 'Deep anterior chamber', 'Cells and flare', 'Hypopyon', 'Hyphaema', 'Iris atrophy', 'Posterior synechiae', 'Irregular pupil', 'Sluggish pupil', 'Mid-dilated fixed pupil', 'Constricted pupil', 'Leukocoria', ...(o.ac || []), ...(o.iris || [])]),
  ]),
  sec('lens', 'Lens', [
    fd('lensF', 'Findings', ['Lens opacity', 'Immature cataract', 'Mature cataract (white pupil)', 'Hypermature cataract', 'Posterior capsular cataract', 'Subluxated lens', 'Aphakia', 'Pseudophakia', ...(o.lens || [])]),
    area('lensN', 'Type and grade of cataract; torchlight, slit lamp findings'),
  ]),
]

const back = (o: { fundus?: string[]; iop?: string[]; move?: string[] } = {}): Section[] => [
  sec('iop', 'Intraocular pressure', [
    txt('iopR', 'IOP right eye (mmHg)', { half: true }), txt('iopL', 'IOP left eye (mmHg)', { half: true }),
    fd('iopF', 'Findings', ['Raised IOP', 'Stony hard eyeball on palpation', 'Soft eyeball', ...(o.iop || [])]),
  ]),
  sec('fundus', 'Fundus examination', [
    fd('funF', 'Findings', ['Absent red glow', 'Hazy media (vitreous haemorrhage)', 'Pale optic disc', 'Cupped optic disc', 'Disc swelling (papilloedema)', 'Increased cup-disc ratio', 'Retinal haemorrhages', 'Hard exudates', 'Cotton wool spots', 'Microaneurysms', 'Neovascularisation', 'Cherry-red spot at the macula', 'Retinal detachment', 'Macular oedema', 'Drusen', 'Arteriolar narrowing', 'Venous dilatation and tortuosity', ...(o.fundus || [])]),
    area('funN', 'Cup-disc ratio, macula, vessels, periphery'),
  ]),
  sec('move', 'Ocular movements and fields', [
    fd('moveF', 'Findings', ['Restricted ocular movement', 'Nystagmus', 'Diplopia', 'Convergence insufficiency', 'Visual field defect', ...(o.move || [])]),
  ]),
]

const redEye = mk({
  id: 'eye-red', subject: 'ophthalmology', title: 'Red eye', blurb: 'Conjunctivitis, keratitis, uveitis, acute angle closure glaucoma, episcleritis',
  complaints: ['Redness of the eye', 'Eye pain', 'Watering', 'Discharge', 'Photophobia', 'Diminished vision', 'Itching', 'Foreign body sensation', 'Swelling of the lids', 'Halos around lights', 'Headache with vomiting'],
  hpi: [
    sym('red', 'Redness', ['onset', 'duration', 'progression', SIDE]),
    sym('pain', 'Eye pain', ['onset', 'duration', at('type', 'Nature', ['Foreign body or gritty', 'Dull ache', 'Severe, boring', 'Pain on eye movement', 'Photophobia-related'], true), at('rad', 'Radiates to', ['Forehead and brow', 'Temple', 'Jaw', 'No radiation'])]),
    sym('disch', 'Discharge', ['onset', 'duration', at('type', 'Type', ['Watery', 'Mucopurulent', 'Purulent', 'Ropy mucoid', 'Sticky lids on waking'], true)]),
    sym('photo', 'Photophobia and watering', ['onset', 'duration', at('ass', 'Features', ['Blepharospasm', 'Profuse lacrimation', 'Photophobia'], true)]),
    sym('vision', 'Diminished vision', ['onset', 'duration', at('type', 'Pattern', ['Mild blurring that clears on blinking', 'Persistent blurring', 'Marked loss', 'Halos around lights'], true)]),
    sym('itch', 'Itching', ['onset', 'duration', at('ass', 'Associated with', ['Seasonal allergy', 'Rubbing the eyes', 'Sneezing and nasal symptoms'], true)]),
    sym('trauma', 'Injury / foreign body', ['onset', at('ass', 'Event', ['Vegetable matter', 'Metal on grinding', 'Chemical splash', 'Contact lens use', 'Welding arc', 'Mud or dust'], true)]),
    sym('contact', 'Contact with infected persons', ['onset', at('ass', 'Contact', ['Family members with red eye', 'School or work contacts', 'Swimming pool'], true)]),
    sym('sys', 'Systemic associations', ['duration', at('ass', 'Features', ['Back pain', 'Joint pain', 'Mouth ulcers', 'Skin rash', 'Cough', 'Urethral discharge', 'Herpes zoster rash'], true)]),
    sym('glauc', 'Acute angle closure features', ['onset', at('ass', 'Features', ['Severe headache', 'Nausea and vomiting', 'Halos around lights', 'Onset in dim light', 'Hypermetropic person', 'Previous similar attacks'], true)]),
    sym('rxhx', 'Treatment taken', ['duration', at('ass', 'Treatment', ['Steroid drops', 'Antibiotic drops', 'Traditional eye remedies', 'Eye drops without prescription', 'Pad or bandage'], true)]),
  ],
  pastExtra: ['Previous red eye episodes', 'Allergic conjunctivitis', 'Glaucoma', 'Uveitis', 'Contact lens use', 'Eye surgery', 'Herpes infection', 'Steroid eye drops'],
  familyExtra: ['Glaucoma', 'Eye disease', 'Ankylosing spondylitis'],
  exam: [va(), ...front({ conj: ['Follicular response', 'Pseudomembrane', 'Phlyctenule'], cornea: ['Dendritic ulcer', 'Dry eye (reduced tear break-up time)', 'Hypopyon ulcer', 'Corneal infiltrate'], ac: ['Raised IOP with shallow chamber'], lens: [] }), ...back(), sec('redsigns', 'Differentiating signs', [
    fd('redF', 'Findings', ['Pupil normal and reactive', 'Pupil small and irregular', 'Pupil mid-dilated and fixed', 'Visual acuity normal', 'Visual acuity reduced', 'Preauricular lymph node enlarged', 'Photophobia']),
  ])],
})

const gradual = mk({
  id: 'eye-gradual', subject: 'ophthalmology', title: 'Gradual painless loss of vision', blurb: 'Cataract, glaucoma, diabetic retinopathy, age-related macular degeneration, refractive error',
  complaints: ['Diminished vision', 'Blurring of vision', 'Glare', 'Difficulty reading', 'Difficulty in dim light', 'Seeing halos', 'Frequent change of glasses', 'Double vision in one eye', 'Tunnel vision', 'Bumping into objects', 'Distortion of straight lines', 'Floaters'],
  hpi: [
    sym('loss', 'Loss of vision', ['onset', 'duration', 'progression', SIDE, at('type', 'Pattern', ['Distance vision affected', 'Near vision affected', 'Central vision loss', 'Peripheral vision loss', 'Overall blurring'], true)]),
    sym('glare', 'Glare / halos', ['onset', 'duration', at('ass', 'Features', ['Glare in sunlight', 'Halos around lights', 'Monocular double vision', 'Second sight (better near vision)'], true)]),
    sym('night', 'Night vision problems', ['onset', 'duration', at('ass', 'Features', ['Night blindness', 'Difficulty in dim light'], true)]),
    sym('field', 'Field loss', ['onset', 'duration', at('ass', 'Features', ['Tunnel vision', 'Bumping into objects', 'Missing steps'], true)]),
    sym('distort', 'Distortion', ['onset', 'duration', at('ass', 'Features', ['Straight lines appear wavy', 'Central black spot', 'Difficulty recognising faces'], true)]),
    sym('flo', 'Floaters and flashes', ['onset', 'duration']),
    sym('glasses', 'Spectacle history', ['duration', at('ass', 'Features', ['Frequent change of glasses', 'Needs a stronger near addition', 'Squinting', 'Never examined before'], true)]),
    sym('dm', 'Systemic disease', ['duration', at('ass', 'Disease', ['Diabetes', 'Hypertension', 'Steroid use', 'Thyroid disease', 'Kidney disease'], true)]),
    sym('inj', 'Past eye problems', ['duration', at('ass', 'History', ['Trauma', 'Uveitis', 'Previous eye surgery', 'Laser treatment', 'Squint or amblyopia as a child'], true)]),
    sym('impact', 'Impact on daily activities', ['duration', at('ass', 'Problem', ['Cannot read or write', 'Unable to recognise faces', 'Falls', 'Difficulty in driving', 'Dependent on others'], true)]),
  ],
  pastExtra: ['Diabetes mellitus', 'Hypertension', 'Steroid use', 'Cataract surgery in the other eye', 'Eye trauma', 'Uveitis', 'Smoking', 'Myopia'],
  familyExtra: ['Glaucoma', 'Cataract', 'Macular degeneration', 'Diabetes', 'Retinitis pigmentosa'],
  exam: [va(), ...front({ lens: ['Nuclear sclerosis', 'Cortical cataract', 'Posterior subcapsular cataract', 'Oil-drop reflex', 'Brown cataract (nuclear)', 'Lenticular myopia'] }), ...back({ iop: ['Open anterior chamber angle on gonioscopy', 'Narrow angle on gonioscopy', 'Visual field loss on perimetry (arcuate scotoma)'], fundus: ['Dot-blot haemorrhages', 'Venous beading', 'Intraretinal microvascular abnormality', 'Macular exudates', 'Geographic atrophy', 'Wet AMD (subretinal haemorrhage)', 'Bone-spicule pigmentation'] })],
})

const sudden = mk({
  id: 'eye-sudden', subject: 'ophthalmology', title: 'Sudden loss of vision', blurb: 'Retinal artery and vein occlusion, retinal detachment, vitreous haemorrhage, optic neuritis, stroke',
  complaints: ['Sudden loss of vision', 'Black curtain', 'Flashes of light', 'Floaters', 'Pain on eye movement', 'Transient blackout', 'Blurring in one eye', 'Headache', 'Double vision', 'Loss of half of the visual field', 'Eye pain'],
  hpi: [
    sym('loss', 'Sudden loss of vision', ['onset', 'duration', 'progression', SIDE, at('type', 'Pattern', ['Complete loss', 'Partial loss', 'Altitudinal (upper or lower half)', 'Central loss', 'Hemifield loss', 'Black curtain from one side'], true)]),
    sym('flash', 'Flashes and floaters', ['onset', 'duration', at('ass', 'Features', ['Flashes of light (photopsia)', 'Shower of floaters', 'Cobwebs', 'Curtain spreading'], true)]),
    sym('pain', 'Pain', ['onset', 'duration', at('ass', 'Features', ['Painless', 'Pain on eye movement', 'Severe ocular pain', 'Headache and scalp tenderness'], true)]),
    sym('amaur', 'Amaurosis fugax', ['onset', 'episodes', at('ass', 'Features', ['Transient curtain over vision lasting minutes', 'Associated weakness of the opposite limb', 'Aphasia'], true)]),
    sym('vasc', 'Vascular risk factors', ['duration', at('ass', 'Risk', ['Hypertension', 'Diabetes', 'Atrial fibrillation', 'Carotid disease', 'Smoking', 'High cholesterol', 'Bleeding disorder', 'Giant cell arteritis symptoms (jaw claudication)'], true)]),
    sym('trauma', 'Trauma / injury', ['onset', at('ass', 'Event', ['Blunt injury', 'Penetrating injury', 'Recent eye surgery', 'Heavy lifting'], true)]),
    sym('neuro', 'Neurological symptoms', ['onset', at('ass', 'Symptoms', ['Numbness or tingling in limbs', 'Weakness', 'Double vision', 'Previous optic neuritis', 'Recent viral illness'], true)]),
    sym('myop', 'Retinal risk factors', ['duration', at('ass', 'Risk', ['High myopia', 'Lattice degeneration', 'Cataract surgery', 'Family history of detachment', 'Previous detachment in the other eye'], true)]),
    sym('dm', 'Diabetic eye disease', ['duration', at('ass', 'History', ['Proliferative retinopathy', 'Laser treatment', 'Poor control'], true)]),
  ],
  pastExtra: ['Hypertension', 'Diabetes mellitus', 'Atrial fibrillation', 'Stroke or TIA', 'Carotid stenosis', 'Multiple sclerosis', 'Retinal detachment', 'Cataract surgery'],
  familyExtra: ['Retinal detachment', 'Glaucoma', 'Multiple sclerosis', 'Stroke'],
  exam: [va(), ...front({ ac: ['Positive RAPD (Marcus Gunn pupil)'], cornea: [], lens: ['Dislocated lens'] }), ...back({ fundus: ['Pale retina with cherry-red spot (CRAO)', 'Embolus visible in retinal artery', 'Blood and thunder fundus (CRVO)', 'Disc swelling with normal retina (optic neuritis)', 'Undulating detached retina', 'Retinal tear (horseshoe)', 'Tobacco dust (Shafer sign)', 'Fresh preretinal haemorrhage'], move: ['Pain on eye movement', 'Central scotoma', 'Altitudinal field defect', 'Homonymous hemianopia'] }), sec('sudcom', 'Systemic examination', [
    fd('sudF', 'Findings', ['Raised blood pressure', 'Irregular pulse (atrial fibrillation)', 'Carotid bruit', 'Temporal artery tenderness', 'Focal neurological deficit', 'Cardiac murmur']),
    area('sudN', 'Details'),
  ])],
})

const adnexa = mk({
  id: 'eye-lid', subject: 'ophthalmology', title: 'Eyelid, lacrimal and orbital disorders', blurb: 'Stye, chalazion, ptosis, watering eye, dacryocystitis, proptosis, orbital cellulitis',
  complaints: ['Lid swelling', 'Lump in the eyelid', 'Drooping of the eyelid', 'Watering of the eye', 'Swelling near the nose', 'Pain in the eyelid', 'Forward protrusion of the eye', 'Redness of the lid margin', 'Irritation of the eye', 'Eyelashes turning in', 'Double vision', 'Eyelid turning out'],
  hpi: [
    sym('lump', 'Lid swelling / lump', ['onset', 'duration', 'progression', 'site', at('ass', 'Features', ['Painful', 'Painless', 'Red and tender', 'Discharge', 'Recurrent'], true)]),
    sym('ptosis', 'Drooping of the eyelid', ['onset', 'duration', 'progression', SIDE, at('ass', 'Features', ['Present since birth', 'Worse in the evening (fatigable)', 'Double vision', 'Head tilt or chin up posture', 'Preceded by trauma'], true)]),
    sym('water', 'Watering', ['onset', 'duration', SIDE, at('type', 'Type', ['Constant epiphora', 'Mucopurulent discharge', 'Reflex watering with irritation', 'Watering with sac swelling'], true)]),
    sym('sac', 'Swelling at the inner canthus', ['onset', 'duration', at('ass', 'Features', ['Pain', 'Redness', 'Pus discharge', 'Fever', 'Pus on pressing'], true)]),
    sym('prop', 'Proptosis', ['onset', 'duration', 'progression', SIDE, at('ass', 'Features', ['Painless', 'Pain', 'Double vision', 'Reduced vision', 'Pulsation', 'Increases on bending down', 'Redness', 'Lid retraction'], true)]),
    sym('lash', 'Lash and lid margin problems', ['duration', at('ass', 'Features', ['Eyelashes rubbing the eye', 'Lid margin turned in', 'Lid margin turned out', 'Crusting at lash roots', 'Loss of lashes'], true)]),
    sym('thy', 'Thyroid symptoms', ['duration', at('ass', 'Symptoms', ['Weight loss', 'Palpitations', 'Heat intolerance', 'Tremors', 'Neck swelling'], true)]),
    sym('inf', 'Infection symptoms', ['onset', at('ass', 'Features', ['Fever', 'Sinusitis', 'Dental infection', 'Recent trauma', 'Skin infection'], true)]),
    sym('vis', 'Visual symptoms', ['onset', at('ass', 'Symptoms', ['Blurred vision', 'Double vision', 'Colour desaturation', 'Pain on eye movement'], true)]),
    sym('rxhx', 'Treatment so far', ['duration', at('ass', 'Treatment', ['Warm compresses', 'Antibiotics', 'Incision and curettage', 'Probing of the nasolacrimal duct', 'Steroids', 'Traditional remedies'], true)]),
  ],
  pastExtra: ['Recurrent stye', 'Blepharitis', 'Chronic dacryocystitis', 'Thyroid disease', 'Facial or orbital trauma', 'Sinusitis', 'Myasthenia gravis', 'Squint'],
  familyExtra: ['Ptosis', 'Thyroid disease', 'Eye disease'],
  exam: [va(), ...front({ lids: ['Lid retraction', 'Lid lag', 'Marginal ptosis', 'Marginal reflex distance reduced', 'Levator function reduced', 'Hordeolum externum', 'Hordeolum internum', 'Chalazion', 'Xanthelasma', 'Molluscum contagiosum lesion', 'Papilloma of lid'], conj: ['Chemosis with proptosis'], cornea: ['Exposure keratopathy'], lens: [] }), ...back({ move: ['Restricted upgaze', 'Restricted abduction', 'Pulsating proptosis', 'Bruit over the orbit', 'Axial proptosis', 'Eccentric proptosis', 'Resistance to retropulsion'] }), sec('orbit', 'Orbit and lacrimal system', [
    fd('orbF', 'Findings', ['Proptosis (exophthalmometer reading raised)', 'Fixed painful eye with swollen lids (orbital cellulitis)', 'Fluid regurgitates on pressing the sac', 'Fluorescein dye disappearance test abnormal', 'Syringing: reflux through the opposite punctum', 'Syringing: no passage into the nose', 'Dacryocystitis (red tender sac)', 'Mucocele of the sac', 'Orbital mass palpable']),
    area('orbN', 'Exophthalmometer readings (mm) and syringing result'),
  ])],
})

const squint = mk({
  id: 'eye-squint', subject: 'ophthalmology', title: 'Squint and refractive errors', blurb: 'Concomitant squint, paralytic squint, amblyopia, myopia, hypermetropia, astigmatism, presbyopia',
  complaints: ['Eyes not straight', 'Eye turning in', 'Eye turning out', 'Double vision', 'Headache after reading', 'Difficulty seeing the blackboard', 'Difficulty reading small print', 'Squeezing the eyes', 'Head tilt', 'Eye strain', 'Poor vision in one eye', 'Holding books close'],
  hpi: [
    sym('squint', 'Squint', ['onset', 'duration', 'progression', SIDE, at('type', 'Direction', ['Inward (esotropia)', 'Outward (exotropia)', 'Upward', 'Downward'], true), at('pat', 'Pattern', ['Constant', 'Intermittent', 'Alternating', 'Worse when tired', 'Worse for near', 'Worse for distance'])]),
    sym('diplo', 'Double vision', ['onset', 'duration', at('type', 'Type', ['Horizontal', 'Vertical', 'Oblique', 'Disappears on closing one eye'], true), at('trig', 'Worse on looking to', ['Right', 'Left', 'Up', 'Down'], true)]),
    sym('head', 'Head posture', ['onset', at('ass', 'Posture', ['Head tilt', 'Face turn', 'Chin up', 'Chin down'], true)]),
    sym('far', 'Difficulty seeing far', ['onset', 'duration', 'progression', at('ass', 'Features', ['Cannot see the blackboard', 'Squeezes the eyes', 'Sits close to the TV', 'Better when looking close', 'Increasing spectacle power'], true)]),
    sym('near', 'Difficulty seeing near', ['onset', 'duration', at('ass', 'Features', ['Holds book at arm\'s length', 'Needs more light', 'Headache and eye strain after reading', 'Age above 40'], true)]),
    sym('strain', 'Asthenopia', ['duration', at('ass', 'Symptoms', ['Headache', 'Eye strain', 'Watering', 'Brow ache', 'Blurring after reading'], true)]),
    sym('amb', 'Amblyopia features', ['duration', at('ass', 'Features', ['Poor vision in one eye with no disease', 'Never wore glasses', 'Squint since childhood', 'Cover test shows fixation preference'], true)]),
    sym('birth', 'Birth and developmental history', ['duration', at('ass', 'History', ['Premature birth', 'Low birth weight', 'Birth trauma', 'Developmental delay', 'Family squint'], true)]),
    sym('cause', 'Cause of paralytic squint', ['onset', at('ass', 'Cause', ['Diabetes', 'Hypertension', 'Head injury', 'Raised intracranial pressure', 'Myasthenia gravis', 'Thyroid eye disease', 'Stroke', 'Cranial nerve palsy'], true)]),
    sym('rxhx', 'Treatment so far', ['duration', at('ass', 'Treatment', ['Spectacles', 'Patching of the good eye', 'Prisms', 'Squint surgery', 'Eye exercises', 'Botulinum toxin'], true)]),
  ],
  pastExtra: ['Squint in childhood', 'Amblyopia', 'Premature birth', 'Head injury', 'Previous squint surgery', 'Myopia', 'Hypermetropia'],
  familyExtra: ['Squint', 'High refractive error', 'Amblyopia', 'Eye disease'],
  exam: [va(), sec('squintEx', 'Squint examination', [
    fd('sqF', 'Findings', ['Esotropia', 'Exotropia', 'Hypertropia', 'Hirschberg corneal reflex displaced', 'Cover test: movement of the fixing eye (tropia)', 'Cover-uncover test: movement of the eye behind the cover (phoria)', 'Alternate cover test positive', 'Primary deviation less than secondary deviation', 'Abnormal head posture', 'Limitation of movement in a field of action', 'Restricted abduction (VI nerve)', 'Ptosis with eye down and out (III nerve)', 'Weak depression in adduction (IV nerve)', 'Retraction of the globe on adduction', 'Amblyopia']),
    area('sqN', 'Angle of deviation (prism dioptres), versions, ductions, fixation preference'),
  ]), ...front({ lids: [], conj: [], cornea: [], lens: [] }), ...back({ fundus: ['Myopic crescent', 'Tilted disc', 'Hypermetropic pseudo-papilloedema'], move: ['Convergence insufficiency', 'Limitation of adduction'] }), sec('refr', 'Refraction', [
    fd('refF', 'Findings', ['Myopia (minus lens improves distance vision)', 'Hypermetropia (plus lens improves vision)', 'Astigmatism (cylindrical lens needed)', 'Presbyopia (near addition needed)', 'Anisometropia', 'Retinoscopy: with movement', 'Retinoscopy: against movement']),
    txt('rxR', 'Refraction right eye (sphere / cylinder x axis)', { half: true }), txt('rxL', 'Refraction left eye (sphere / cylinder x axis)', { half: true }),
    area('refN', 'Prescription, add for near, cycloplegic refraction in children'),
  ])],
})

export const EYE_CASES: CaseDef[] = [redEye, gradual, sudden, adnexa, squint]
