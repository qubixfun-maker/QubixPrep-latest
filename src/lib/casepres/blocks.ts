import type { Section } from './types'
import { txt, date, area, ch, fd, vitals, sec } from './dsl'

export const particulars = (o: { paeds?: boolean; obg?: boolean } = {}): Section =>
  sec('particulars', 'Patient particulars', [
    txt('name', 'Name', { half: true }),
    txt('age', o.paeds ? 'Age (e.g. 3 yr 2 mo)' : 'Age', { half: true }),
    ...(o.obg ? [] : [ch('sex', 'Sex', ['Male', 'Female', 'Other'])]),
    txt('occupation', o.paeds ? 'Education / schooling' : 'Occupation', { half: true }),
    txt('address', 'Address', { half: true }),
    ...(o.paeds
      ? [txt('informant', 'Informant', { half: true }), ch('reliability', 'Reliability', ['Reliable', 'Fairly reliable', 'Unreliable']), txt('birthOrder', 'Birth order', { half: true })]
      : []),
    ...(o.obg ? [txt('lmp', 'LMP (date)', { half: true })] : []),
    date('doa', 'Date of admission'),
    date('doe', 'Date of examination'),
  ])

export const pastHistory = (extra: string[] = []): Section =>
  sec('past', 'Past history', [
    fd('pastHx', 'Past illnesses', [
      'Similar complaints in the past', 'Diabetes mellitus', 'Hypertension', 'Tuberculosis', 'Bronchial asthma', 'Epilepsy',
      'Jaundice / hepatitis', 'Thyroid disorder', 'Ischaemic heart disease', 'Stroke / TIA', 'Malignancy', 'Previous surgery',
      'Blood transfusion', 'Drug allergy', 'Food allergy', ...extra,
    ]),
    area('pastNotes', 'Details (treatment taken, dates, drugs)', 'Any other relevant past history'),
  ])

export const familyHistory = (extra: string[] = []): Section =>
  sec('family', 'Family history', [
    fd('famHx', 'In the family', ['Similar illness', 'Diabetes mellitus', 'Hypertension', 'Tuberculosis', 'Asthma / allergy', 'Malignancy', 'Heart disease', 'Congenital / genetic disorder', ...extra]),
    area('famNotes', 'Details'),
  ])

export const personalHistory = (female = true): Section =>
  sec('personal', 'Personal history', [
    ch('diet', 'Diet', ['Vegetarian', 'Non-vegetarian', 'Mixed']),
    ch('appetite', 'Appetite', ['Normal', 'Reduced', 'Increased', 'Loss of appetite']),
    ch('sleep', 'Sleep', ['Normal', 'Disturbed', 'Insomnia', 'Excessive sleep']),
    ch('bowel', 'Bowel habits', ['Regular', 'Constipation', 'Diarrhoea', 'Alternating', 'Altered recently']),
    ch('bladder', 'Bladder habits', ['Normal', 'Increased frequency', 'Dysuria', 'Oliguria', 'Retention', 'Incontinence']),
    fd('habits', 'Habits', ['Smoking', 'Alcohol', 'Tobacco chewing', 'Other substance use', 'Weight loss', 'Travel to endemic area']),
    area('habitNotes', 'Details (pack-years, quantity, duration)'),
  ])

export const menstrualHistory = (): Section =>
  sec('menstrual', 'Menstrual & obstetric history (females)', [
    txt('menarche', 'Age at menarche', { half: true }),
    txt('lmp', 'LMP', { half: true }),
    ch('cycle', 'Cycle', ['Regular', 'Irregular']),
    ch('flow', 'Flow', ['Scanty', 'Normal', 'Excessive']),
    ch('dysmen', 'Pain with periods', ['None', 'Mild dysmenorrhoea', 'Severe dysmenorrhoea']),
    ch('marital', 'Marital status', ['Unmarried', 'Married', 'Widowed', 'Separated']),
    txt('parity', 'Obstetric formula (G P L A)', { half: true }),
    txt('menopause', 'Menopause (age) / postmenopausal bleeding', { half: true }),
  ], 'Skip for male patients.')

export const envSocio = (): Section =>
  sec('env', 'Environmental & socio-economic history', [
    ch('house', 'House', ['Pakka', 'Kutcha', 'Semi-pakka']),
    ch('ventilation', 'Light and ventilation', ['Adequate', 'Inadequate']),
    ch('cooking', 'Cooking fuel', ['LPG', 'Firewood', 'Electric / induction', 'Biomass']),
    ch('water', 'Drinking water', ['Tap / piped', 'Borewell', 'Well', 'Bottled / purified']),
    ch('sanitation', 'Sanitation', ['Toilet in house', 'Community toilet', 'Open defecation']),
    txt('people', 'People in the house', { half: true }),
    txt('income', 'Family income / per capita income', { half: true }),
    ch('ses', 'Socio-economic class (Kuppuswamy)', ['Upper', 'Upper middle', 'Lower middle', 'Upper lower', 'Lower']),
  ])

export const gpe = (extra: string[] = []): Section =>
  sec('gpe', 'General physical examination', [
    ch('consc', 'Patient is', ['Conscious, cooperative, well oriented to time, place and person', 'Conscious but disoriented', 'Drowsy', 'Stuporous', 'Comatose']),
    ch('built', 'Built', ['Well built', 'Moderately built', 'Poorly built', 'Obese']),
    ch('nourish', 'Nourishment', ['Well nourished', 'Moderately nourished', 'Poorly nourished']),
    fd('signs', 'General signs', ['Pallor', 'Icterus', 'Cyanosis', 'Clubbing', 'Pedal oedema', 'Generalised lymphadenopathy', 'Koilonychia', 'Leukonychia', 'Dehydration', 'Raised JVP', ...extra]),
    area('gpeNotes', 'Details of any positive sign (site, size, character)'),
    vitals(),
  ], 'Tap a sign once for PRESENT, again for ABSENT. "Mark rest normal" fills the rest as absent.')

export const closing = (o: { medicine?: boolean } = {}): Section =>
  sec('closing', 'Summary, diagnosis and plan', [
    area('summary', 'Summary of the case'),
    area('provDx', 'Provisional diagnosis'),
    ...(o.medicine
      ? [
          txt('anatDx', 'Anatomical diagnosis'),
          txt('pathDx', 'Pathological diagnosis'),
          txt('etioDx', 'Etiological diagnosis'),
          txt('funcDx', 'Functional diagnosis'),
        ]
      : []),
    area('ddx', 'Differential diagnosis'),
    area('ix', 'Investigations'),
    area('rx', 'Treatment / management'),
  ])
