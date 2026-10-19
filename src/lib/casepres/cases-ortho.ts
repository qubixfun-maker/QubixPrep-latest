import type { CaseDef } from './types'
import { txt, area, ch, fd, sym, sec, at } from './dsl'
import { mk } from './cases-util'

const SIDE = at('side', 'Side', ['Right', 'Left', 'Both'])

const fracture = mk({
  id: 'ortho-fracture', subject: 'orthopaedics', title: 'Fracture (trauma)', blurb: 'Long bone fractures, open fractures, compartment syndrome, complications', noMenstrual: true,
  complaints: ['Pain', 'Swelling', 'Deformity', 'Inability to move the limb', 'Inability to bear weight', 'Open wound with bleeding', 'Numbness or tingling', 'Abnormal movement', 'Bruising'],
  hpi: [
    sym('injury', 'Injury', ['onset', at('mech', 'Mechanism', ['Road traffic accident', 'Fall from height', 'Fall on level ground', 'Sports injury', 'Direct blow', 'Twisting injury', 'Assault', 'Machinery or crush injury', 'Pathological (trivial trauma)'], true), at('dir', 'Force', ['Direct violence', 'Indirect violence']), SIDE]),
    sym('pain', 'Pain', ['onset', 'duration', 'site', 'nature', 'aggravating', 'relieving']),
    sym('swell', 'Swelling', ['onset', 'duration', 'progression', 'site']),
    sym('deform', 'Deformity', ['onset', 'site', at('type', 'Type', ['Shortening', 'Angulation', 'Rotation', 'Bony prominence'], true)]),
    sym('wound', 'Open wound', ['onset', 'site', at('ass', 'Details', ['Bone visible', 'Heavy contamination', 'Active bleeding', 'Tetanus status unknown'], true)]),
    sym('nv', 'Neurovascular symptoms', ['onset', at('ass', 'Symptoms', ['Numbness', 'Tingling', 'Weakness of fingers or toes', 'Pale or cold limb', 'Severe pain not relieved by analgesics'], true)]),
    sym('assoc', 'Associated injuries', ['onset', at('ass', 'Injuries', ['Head injury with loss of consciousness', 'Chest pain or breathlessness', 'Abdominal pain', 'Back or neck pain', 'Other limb injuries', 'Pelvic pain'], true)]),
    sym('firstaid', 'First aid / treatment taken', ['onset', at('ass', 'Details', ['Splint applied', 'Seen by traditional bone setter', 'Tight bandage', 'Analgesics taken', 'Tetanus toxoid given'], true)]),
  ],
  middle: [
    sec('inj', 'Details of injury', [
      txt('bone', 'Bone and level involved', { half: true }), txt('doi', 'Date and time of injury', { half: true }),
      ch('openclosed', 'Type', ['Closed fracture', 'Open fracture']),
      area('injN', 'Place and circumstances of injury'),
    ]),
  ],
  pastExtra: ['Previous fracture at the same site', 'Osteoporosis', 'Long-term steroid use', 'Bone disease', 'Anticoagulant use'],
  gpeExtra: ['Pallor (blood loss)', 'Tachycardia', 'Hypotension', 'Respiratory distress', 'Head injury signs', 'Other injuries'],
  exam: [
    sec('look', 'Local examination: look', [
      fd('lookF', 'Findings', ['Swelling', 'Bruising', 'Deformity (angulation)', 'Shortening of the limb', 'External rotation', 'Open wound over fracture', 'Skin tenting', 'Fracture blisters', 'Abrasions', 'Bone ends visible']),
      area('lookN', 'Site, size of wound (cm), level, contamination'),
    ]),
    sec('feel', 'Local examination: feel', [
      fd('feelF', 'Findings', ['Point bony tenderness', 'Warmth', 'Bony crepitus', 'Abnormal mobility', 'Tense swelling', 'Distal pulses absent', 'Capillary refill delayed', 'Distal sensation lost', 'Cold distal limb']),
      area('feelN', 'Bone tenderness site and distal pulses (dorsalis pedis, radial)'),
    ]),
    sec('move', 'Movements and measurement', [
      fd('moveF', 'Findings', ['Active movement lost', 'Pain on passive movement', 'Adjacent joint stiffness', 'True shortening', 'Apparent shortening', 'Unable to lift leg (straight leg raise)', 'Unable to bear weight']),
      area('moveN', 'Limb length measurement (right vs left), range of movement of adjacent joints'),
    ]),
    sec('comp', 'Complications to look for', [
      fd('compF', 'Findings', ['Pain on passive stretch of muscles', 'Compartment syndrome suspected', 'Nerve injury', 'Vascular injury', 'Fat embolism features', 'Wound infection', 'Delayed union', 'Malunion', 'Joint stiffness', 'Pressure sores']),
      area('compN', 'Nerve examined (name), compartment, Gustilo grade'),
    ]),
  ],
})

const joint = mk({
  id: 'ortho-joint', subject: 'orthopaedics', title: 'Joint disorders (knee, hip, shoulder)', blurb: 'Osteoarthritis, ligament and meniscal injury, hip and shoulder problems', noMenstrual: true,
  complaints: ['Joint pain', 'Joint swelling', 'Stiffness', 'Limp', 'Locking of the joint', 'Giving way', 'Deformity', 'Difficulty climbing stairs', 'Difficulty squatting or sitting cross-legged', 'Clicking or grinding', 'Night pain', 'Shoulder pain with overhead activity'],
  hpi: [
    sym('pain', 'Joint pain', ['onset', 'duration', 'progression', at('joint', 'Joint', ['Knee', 'Hip', 'Shoulder', 'Ankle', 'Elbow', 'Wrist'], true), SIDE, 'nature', 'aggravating', 'relieving', at('night', 'Night / rest pain', ['No', 'Night pain', 'Pain at rest'])]),
    sym('swell', 'Joint swelling', ['onset', 'duration', at('cause', 'Onset', ['Immediately after injury', 'Hours after injury', 'Spontaneous', 'Recurrent']), at('ass', 'Associated with', ['Warmth', 'Redness', 'Fever'], true)]),
    sym('stiff', 'Stiffness', ['onset', 'duration', at('len', 'Morning stiffness', ['Less than 30 minutes', 'More than 1 hour', 'After rest (gelling)'])]),
    sym('mech', 'Mechanical symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Locking', 'Giving way', 'Catching', 'Clicking', 'Instability', 'Dislocation episodes'], true)]),
    sym('func', 'Functional limitation', ['duration', at('ass', 'Difficulty with', ['Climbing stairs', 'Squatting', 'Sitting cross-legged', 'Wearing socks or shoes', 'Combing hair', 'Reaching overhead', 'Walking distance'], true)]),
    sym('limp', 'Limp / deformity', ['onset', 'duration', at('type', 'Type', ['Painful limp', 'Short limb limp', 'Bow legs', 'Knock knees', 'Visible deformity'], true)]),
    sym('inj', 'Previous injury', ['duration', at('ass', 'Mechanism', ['Twisting injury of the knee', 'Dashboard injury', 'Fall on outstretched hand', 'Fall on the shoulder', 'Previous fracture', 'Previous dislocation'], true)]),
    sym('constit', 'Constitutional / other joints', ['duration', at('ass', 'Symptoms', ['Fever', 'Weight loss', 'Multiple joint involvement', 'Back pain', 'Skin or eye symptoms'], true)]),
  ],
  pastExtra: ['Previous joint surgery', 'Joint injection', 'Long-term steroid use', 'Rheumatoid arthritis', 'Gout', 'Obesity'],
  gpeExtra: ['Obesity', 'Gait abnormality', 'Use of walking aid'],
  exam: [
    sec('knee', 'Knee examination', [
      fd('kneeF', 'Look, feel and move', ['Genu varum', 'Genu valgum', 'Effusion', 'Quadriceps wasting', 'Joint line tenderness', 'Warmth', 'Crepitus', 'Patellar tap positive', 'Fixed flexion deformity', 'Extension lag', 'Flexion restricted', 'Popliteal swelling']),
      fd('kneeT', 'Special tests (present = positive)', ['Lachman test positive', 'Anterior drawer test positive', 'Posterior drawer test positive', 'Valgus stress test positive', 'Varus stress test positive', 'McMurray test positive', 'Apley grind test positive', 'Patellar apprehension test positive']),
      area('kneeN', 'Side, range of movement (degrees), findings'),
    ], 'Use only the joint relevant to your case; the other joint sections can stay blank.'),
    sec('hip', 'Hip examination', [
      fd('hipF', 'Look, feel and move', ['Antalgic gait', 'Short limb gait', 'Trendelenburg gait', 'Gluteal wasting', 'Limb shortening', 'External rotation of limb', 'Groin tenderness', 'Greater trochanter tenderness', 'Flexion restricted', 'Rotation restricted and painful', 'Fixed flexion deformity']),
      fd('hipT', 'Special tests (present = positive)', ['Thomas test positive', 'Trendelenburg sign positive', 'FABER test positive', 'Telescoping test positive', 'Log roll test positive', "Allis sign positive", 'Bryant triangle shortened']),
      area('hipN', 'Side, range of movement, true and apparent length'),
    ]),
    sec('shoulder', 'Shoulder examination', [
      fd('shF', 'Look, feel and move', ['Squaring of shoulder', 'Wasting of deltoid', 'Supraspinatus wasting', 'Acromioclavicular tenderness', 'Bicipital groove tenderness', 'Restricted abduction', 'Restricted external rotation', 'Painful arc present', 'Winging of scapula']),
      fd('shT', 'Special tests (present = positive)', ['Apprehension test positive', 'Neer impingement sign positive', 'Hawkins test positive', 'Drop arm test positive', 'Empty can test positive', 'Speed test positive', 'Sulcus sign positive', "Hamilton ruler test positive"]),
      area('shN', 'Side, range of movement, findings'),
    ]),
    sec('neurovasc', 'Neurovascular status', [fd('nvF', 'Findings', ['Distal pulses present', 'Distal pulses absent', 'Sensory loss', 'Weakness of distal muscles']), area('nvN', 'Details')]),
  ],
})

const osteo = mk({
  id: 'ortho-osteo', subject: 'orthopaedics', title: 'Bone and joint infection', blurb: 'Osteomyelitis, septic arthritis, discharging sinus, Brodie abscess', noMenstrual: true,
  complaints: ['Pain in the limb', 'Swelling', 'Fever', 'Discharging sinus', 'Limp', 'Redness', 'Refusal to move the limb', 'Loss of weight', 'Pus discharge from a scar'],
  hpi: [
    sym('fever', 'Fever', ['onset', 'duration', 'progression', at('grade', 'Grade', ['Low grade', 'Moderate', 'High grade with chills']), at('ass', 'Associated with', ['Malaise', 'Loss of appetite', 'Night sweats'], true)]),
    sym('pain', 'Bone / joint pain', ['onset', 'duration', 'progression', 'site', SIDE, at('type', 'Nature', ['Severe throbbing', 'Dull aching', 'Pain at night', 'Pain on any movement'], true)]),
    sym('swell', 'Swelling', ['onset', 'duration', 'progression', 'site', at('ass', 'Associated with', ['Redness', 'Warmth', 'Fluctuant'], true)]),
    sym('sinus', 'Discharging sinus', ['onset', 'duration', 'site', at('dis', 'Discharge', ['Seropurulent', 'Purulent', 'Foul smelling', 'Bone spicules extruded', 'Intermittent with healing and recurrence'], true)]),
    sym('func', 'Limb function', ['onset', at('ass', 'Problem', ['Refusal to move limb (pseudoparalysis)', 'Limp', 'Unable to bear weight', 'Joint held in flexion'], true)]),
    sym('ante', 'Antecedent events', ['duration', at('ass', 'Preceding event', ['Open fracture or implant surgery', 'Skin infection or boil', 'Upper respiratory infection', 'Trauma', 'Intravenous injection or drug use', 'Diabetic foot', 'Infection elsewhere (UTI, ear)', 'Umbilical sepsis (neonate)'], true)]),
    sym('treat', 'Previous treatment', ['duration', at('ass', 'Treatment', ['Antibiotics for short course', 'Previous surgery for the same condition', 'Dressings only', 'Antitubercular treatment'], true)]),
  ],
  pastExtra: ['Sickle cell disease', 'Immunosuppression', 'Malnutrition', 'Previous bone or joint surgery'],
  gpeExtra: ['Toxic appearance', 'Septicaemia features'],
  exam: [
    sec('local', 'Local examination', [
      fd('locF', 'Findings', ['Swelling', 'Redness', 'Warmth', 'Bone tenderness (point)', 'Fluctuation', 'Discharging sinus', 'Sinus adherent to bone', 'Sequestrum visible', 'Adherent scar', 'Thickened bone (involucrum)', 'Muscle wasting', 'Limb length discrepancy', 'Deformity']),
      area('locN', 'Site, number of sinuses, discharge character'),
    ]),
    sec('joint', 'Joint examination', [
      fd('jF', 'Findings', ['Joint effusion', 'Joint held in flexion', 'All movements painful', 'Pseudoparalysis', 'Restricted movement', 'Joint instability', 'Ankylosis']),
      area('jN', 'Joint, range of movement'),
    ]),
    sec('reg', 'Regional and systemic', [
      fd('regF', 'Findings', ['Regional lymph nodes enlarged', 'Hepatosplenomegaly', 'Cardiac murmur', 'Other infective foci']),
      area('regN', 'Details'),
    ]),
  ],
})

const tumour = mk({
  id: 'ortho-tumour', subject: 'orthopaedics', title: 'Bone tumour / swelling', blurb: 'Osteosarcoma, Ewing sarcoma, giant cell tumour, osteochondroma, metastasis', noMenstrual: true,
  complaints: ['Swelling', 'Pain', 'Night pain', 'Pathological fracture', 'Limp', 'Loss of weight', 'Fever', 'Restricted joint movement', 'Cough or breathlessness'],
  hpi: [
    sym('swell', 'Swelling', ['onset', 'duration', 'progression', 'site', SIDE, at('rate', 'Growth', ['Slow', 'Rapid', 'Sudden increase recently'])]),
    sym('pain', 'Pain', ['onset', 'duration', 'progression', at('type', 'Nature', ['Dull aching', 'Night pain', 'Pain at rest', 'Pain on activity only', 'Painless'], true), 'relieving']),
    sym('fracture', 'Fracture with trivial trauma', ['onset', 'site']),
    sym('constit', 'Constitutional symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Weight loss', 'Fever', 'Loss of appetite', 'Fatigue', 'Night sweats'], true)]),
    sym('mets', 'Features of spread', ['duration', at('ass', 'Symptoms', ['Cough', 'Haemoptysis', 'Breathlessness', 'Bone pain elsewhere', 'Abdominal pain'], true)]),
    sym('primary', 'Symptoms of a known primary', ['duration', at('ass', 'Primary site', ['Breast lump', 'Prostate symptoms', 'Lung symptoms', 'Thyroid swelling', 'Kidney symptoms'], true)]),
    sym('func', 'Functional loss', ['duration', at('ass', 'Problem', ['Limp', 'Restricted movement of the nearby joint', 'Unable to bear weight'], true)]),
  ],
  pastExtra: ['Previous radiotherapy', 'Paget disease', 'Previous malignancy', 'Retinoblastoma', 'Multiple exostoses'],
  familyExtra: ['Cancer in family', 'Multiple hereditary exostoses'],
  gpeExtra: ['Cachexia', 'Anaemia', 'Lymph nodes', 'Primary tumour search'],
  exam: [
    sec('local', 'Local examination of the swelling', [
      fd('locF', 'Findings', ['Hard swelling', 'Irregular surface', 'Fixed to the bone', 'Warmth', 'Dilated veins over the swelling', 'Skin ulceration', 'Pulsatile', 'Bruit present', 'Tender', 'Egg-shell crackling', 'Soft tissue mass', 'Pathological fracture', 'Mobile soft tissue swelling']),
      area('locN', 'Site, size (cm), shape, surface, edge, consistency'),
    ]),
    sec('joint', 'Nearby joint and limb', [
      fd('jF', 'Findings', ['Restricted movement of nearby joint', 'Joint effusion', 'Muscle wasting', 'Limb length discrepancy', 'Distal pulses diminished', 'Neurological deficit']),
      area('jN', 'Details'),
    ]),
    sec('met', 'Regional spread and metastatic work-up', [
      fd('metF', 'Findings', ['Regional lymph nodes enlarged', 'Chest signs (crepitations or dullness)', 'Hepatomegaly', 'Spinal tenderness', 'Other bone tenderness', 'Primary tumour found (breast, thyroid, prostate)']),
      area('metN', 'Details'),
    ]),
  ],
})

const spine = mk({
  id: 'ortho-spine', subject: 'orthopaedics', title: 'Spine and back pain', blurb: 'Lumbar disc prolapse, TB spine, spinal stenosis, cauda equina, cervical myelopathy', noMenstrual: true,
  complaints: ['Low back pain', 'Neck pain', 'Pain radiating down the leg', 'Weakness of limbs', 'Numbness or tingling', 'Difficulty in passing urine or stool', 'Fever', 'Loss of weight', 'Hump on the back', 'Difficulty in walking', 'Inability to stand straight'],
  hpi: [
    sym('back', 'Back / neck pain', ['onset', 'duration', 'progression', at('level', 'Level', ['Cervical', 'Dorsal', 'Lumbar', 'Lumbosacral', 'Sacroiliac']), 'nature', at('agg', 'Aggravated by', ['Bending forward', 'Lifting weights', 'Coughing or sneezing', 'Prolonged sitting', 'Walking', 'Lying flat at night'], true), 'relieving']),
    sym('sciatica', 'Radiating leg / arm pain', ['onset', 'duration', 'side', at('dist', 'Distribution', ['Back of thigh to foot (sciatica)', 'Front of thigh', 'Lateral leg to big toe (L5)', 'Lateral foot (S1)', 'Down the arm to fingers'], true), at('ass', 'Associated with', ['Tingling', 'Numbness', 'Cough impulse pain'], true)]),
    sym('claud', 'Neurogenic claudication', ['onset', 'duration', at('ass', 'Pattern', ['Leg pain on walking', 'Relieved by sitting or bending forward', 'Relieved by rest'], true)]),
    sym('weak', 'Weakness of limbs', ['onset', 'duration', 'progression', at('part', 'Part', ['One leg', 'Both legs', 'One arm', 'Both arms', 'All four limbs', 'Foot drop'], true)]),
    sym('sens', 'Sensory symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Numbness', 'Tingling', 'Saddle area numbness', 'Band-like sensation around the trunk'], true)]),
    sym('sphincter', 'Bladder / bowel disturbance', ['onset', 'duration', at('ass', 'Symptoms', ['Urinary retention', 'Incontinence', 'Constipation', 'Faecal incontinence', 'Erectile dysfunction'], true)]),
    sym('constit', 'Constitutional symptoms', ['duration', at('ass', 'Symptoms', ['Fever', 'Night sweats', 'Weight loss', 'Loss of appetite', 'Known TB contact'], true)]),
    sym('deform', 'Deformity', ['onset', 'progression', at('type', 'Type', ['Angular hump (gibbus)', 'Scoliosis', 'Stooped posture', 'Torticollis'], true)]),
    sym('trauma', 'Trauma / lifting injury', ['onset', at('ass', 'Mechanism', ['Fall', 'Road traffic accident', 'Lifting a heavy object', 'Sudden twisting'], true)]),
  ],
  pastExtra: ['Previous back pain episodes', 'Spine surgery', 'Osteoporosis', 'Malignancy', 'Tuberculosis'],
  familyExtra: ['Ankylosing spondylitis'],
  gpeExtra: ['Cold abscess', 'Lymphadenopathy', 'Fever', 'Pallor', 'Breast or thyroid lump'],
  exam: [
    sec('look', 'Inspection and palpation of the spine', [
      fd('lookF', 'Findings', ['Gibbus (angular kyphosis)', 'Scoliosis', 'Loss of lumbar lordosis', 'Paraspinal muscle spasm', 'Spinous process tenderness', 'Paraspinal tenderness', 'Step deformity', 'Cold abscess swelling', 'Sinus', 'Muscle wasting']),
      area('lookN', 'Level and details'),
    ]),
    sec('move', 'Movements and special tests', [
      fd('moveF', 'Findings', ['Forward flexion restricted', 'Extension restricted', 'Schober test reduced', 'Straight leg raise positive', 'Crossed straight leg raise positive', 'Bowstring sign positive', 'Femoral stretch test positive', 'Neck movements restricted', 'Spurling test positive', "Lhermitte sign positive"]),
      area('moveN', 'Degree of restriction, angle of SLR (degrees), side'),
    ]),
    sec('neuro', 'Neurological examination', [
      fd('neuroF', 'Findings', ['Power reduced (myotome)', 'Sensory loss (dermatome)', 'Knee jerk diminished', 'Ankle jerk diminished', 'Exaggerated reflexes', 'Babinski positive', 'Saddle anaesthesia', 'Anal tone reduced', 'Spastic gait', 'High-stepping gait', 'Foot drop', 'Sensory level', 'Hoffmann sign positive']),
      area('neuroN', 'Muscle power by root, sensory level, reflex grading'),
    ]),
  ],
})

const nerve = mk({
  id: 'ortho-nerve', subject: 'orthopaedics', title: 'Peripheral nerve injury / neuropathy', blurb: 'Median, ulnar, radial, peroneal nerve palsy, carpal tunnel, brachial plexus', noMenstrual: true,
  complaints: ['Weakness of the hand', 'Wrist drop', 'Foot drop', 'Numbness or tingling', 'Deformity of hand', 'Wasting of muscles', 'Pain', 'Clumsiness of fingers', 'Ulcers on insensitive skin', 'Injury or fracture before onset'],
  hpi: [
    sym('cause', 'Cause / injury', ['onset', at('ass', 'Event', ['Fracture of humerus', 'Supracondylar fracture', 'Wrist or forearm laceration', 'Fracture around the knee or fibula', 'Dislocation of shoulder', 'Gunshot or stab injury', 'Tight plaster or tourniquet', 'Prolonged pressure (Saturday night palsy)', 'Birth injury', 'Injection injury', 'Fall on the shoulder'], true), SIDE]),
    sym('motor', 'Weakness / deformity', ['onset', 'duration', 'progression', at('type', 'Type', ['Wrist drop', 'Claw hand', 'Ape thumb', 'Foot drop', 'Weak grip', 'Weak pinch', 'Weak shoulder abduction or elbow flexion'], true)]),
    sym('sens', 'Sensory symptoms', ['onset', 'duration', at('dist', 'Distribution', ['Thumb, index, middle and half of ring finger', 'Little finger and half of ring finger', 'Dorsum of hand (first web space)', 'Dorsum of foot and lateral leg', 'Sole of foot', 'Whole arm'], true), at('type', 'Type', ['Numbness', 'Tingling', 'Burning pain', 'Loss of sensation'], true)]),
    sym('night', 'Night symptoms (compression)', ['duration', at('ass', 'Pattern', ['Tingling at night waking from sleep', 'Relieved by shaking the hand', 'Worse with repetitive hand use', 'Worse with prolonged elbow flexion'], true)]),
    sym('trophic', 'Trophic changes', ['duration', at('ass', 'Changes', ['Painless ulcers', 'Burns without feeling pain', 'Skin shiny and dry', 'Loss of sweating', 'Nail changes', 'Bone absorption'], true)]),
    sym('recovery', 'Course / recovery', ['duration', at('pro', 'Progress', ['No recovery', 'Partial recovery', 'Worsening', 'Tinel sign advancing'])]),
    sym('assoc', 'Associated conditions', ['duration', at('ass', 'Condition', ['Diabetes', 'Hypothyroidism', 'Pregnancy', 'Rheumatoid arthritis', 'Leprosy', 'Alcohol', 'Repetitive occupational use'], true)]),
  ],
  pastExtra: ['Wrist fracture', 'Elbow fracture', 'Leprosy', 'Nerve repair or tendon transfer'],
  gpeExtra: ['Thickened peripheral nerves', 'Skin patches (leprosy)', 'Trophic ulcers', 'Burns'],
  exam: [
    sec('motor', 'Motor examination', [
      fd('motF', 'Findings', ['Wrist drop', 'Claw hand', 'Ape thumb deformity', 'Benediction hand', 'Foot drop', 'Thenar wasting', 'Hypothenar wasting', 'Interosseous wasting', 'Weak thumb abduction', 'Weak finger extension', 'Weak finger abduction and adduction', 'Weak ankle dorsiflexion', 'Weak ankle eversion', 'Steppage gait']),
      fd('motT', 'Special tests (present = positive)', ["Froment sign positive", 'Tinel sign positive', 'Phalen test positive', 'OK sign abnormal', 'Pen test positive', 'Card test positive', 'Egawa test positive', 'Bowler sign positive']),
      area('motN', 'Muscle power grading, nerve and level of lesion'),
    ]),
    sec('sens', 'Sensory examination', [
      fd('sensF', 'Findings', ['Loss of sensation in median nerve area', 'Loss of sensation in ulnar nerve area', 'Loss of sensation in radial nerve area', 'Loss of sensation over dorsum of foot', 'Loss of sensation on the sole', 'Hyperaesthesia', 'Two-point discrimination impaired', 'Anaesthetic area']),
      area('sensN', 'Map the area of sensory loss'),
    ]),
    sec('trophic', 'Trophic and nerve palpation', [
      fd('trF', 'Findings', ['Trophic ulcer', 'Dry shiny skin', 'Loss of sweating', 'Thickened nerve', 'Tender nerve', 'Contracture', 'Neuroma at injury site']),
      area('trN', 'Nerves palpated and findings'),
    ]),
  ],
})

export const ORTHO_CASES: CaseDef[] = [fracture, joint, osteo, tumour, spine, nerve]
