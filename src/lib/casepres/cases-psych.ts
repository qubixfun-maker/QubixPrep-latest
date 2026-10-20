import type { CaseDef, Section } from './types'
import { txt, area, ch, fd, sym, sec, at } from './dsl'
import { mk } from './cases-util'

/** Mental status examination, shared by all psychiatry cases (each case adds its own options). */
const mse = (o: { app?: string[]; speech?: string[]; mood?: string[]; thought?: string[]; percept?: string[]; cog?: string[]; extra?: Section[] } = {}): Section[] => [
  sec('app', 'Mental status: appearance and behaviour', [
    fd('appF', 'Findings', ['Poor self-care or unkempt', 'Psychomotor retardation', 'Psychomotor agitation', 'Poor eye contact', 'Suspicious or guarded', 'Inappropriate or disinhibited behaviour', 'Bizarre mannerisms or posturing', 'Aggressive or hostile', 'Tearful', 'Rapport difficult to establish', ...(o.app || [])]),
    area('appN', 'Describe dress, grooming, eye contact and rapport'),
  ]),
  sec('speech', 'Mental status: speech', [
    fd('spF', 'Findings', ['Reduced amount of speech (poverty)', 'Increased amount of speech (pressure)', 'Slow and low-pitched', 'Loud and rapid', 'Delayed reaction time', 'Monotonous', 'Mute', ...(o.speech || [])]),
  ]),
  sec('mood', 'Mental status: mood and affect', [
    fd('moodF', 'Findings', ['Depressed mood', 'Elevated mood', 'Irritable mood', 'Anxious mood', 'Blunted affect', 'Flat affect', 'Labile affect', 'Incongruent affect', 'Restricted affect', ...(o.mood || [])]),
    area('moodN', 'Subjective mood in the patient\'s own words; objective affect'),
  ]),
  sec('thought', 'Mental status: thought', [
    fd('thF', 'Findings', ['Flight of ideas', 'Loosening of association', 'Thought blocking', 'Circumstantiality', 'Tangentiality', 'Poverty of thought content', 'Delusion of persecution', 'Delusion of reference', 'Delusion of grandeur', 'Delusion of guilt or worthlessness', 'Hypochondriacal delusion', 'Thought insertion', 'Thought withdrawal', 'Thought broadcasting', 'Delusion of control (passivity)', 'Obsessions', 'Phobias', 'Preoccupation with death', 'Suicidal ideas', ...(o.thought || [])]),
    area('thN', 'Describe the content of delusions, preoccupations or ideas'),
  ]),
  sec('percept', 'Mental status: perception', [
    fd('perF', 'Findings', ['Auditory hallucinations', 'Visual hallucinations', 'Tactile hallucinations', 'Olfactory hallucinations', 'Command hallucinations', 'Illusions', 'Depersonalisation', 'Derealisation', ...(o.percept || [])]),
  ]),
  sec('cog', 'Mental status: cognition', [
    fd('cogF', 'Findings', ['Disoriented to time', 'Disoriented to place', 'Disoriented to person', 'Impaired attention (serial 7 subtraction)', 'Impaired recent memory', 'Impaired remote memory', 'Impaired abstract thinking', 'Poor general information', ...(o.cog || [])]),
    area('cogN', 'Orientation, attention, memory (immediate, recent, remote), MMSE score if done'),
  ]),
  sec('insight', 'Mental status: insight and judgement', [
    fd('insF', 'Findings', ['Insight absent (denies illness)', 'Partial insight', 'Impaired judgement']),
    ch('insG', 'Insight grade', ['Grade 1: complete denial of illness', 'Grade 2: slight awareness, denies need for help', 'Grade 3: aware but blames external factors', 'Grade 4: illness due to something unknown in self', 'Grade 5: intellectual insight', 'Grade 6: true emotional insight']),
  ]),
  ...(o.extra || []),
]

const depression = mk({
  id: 'psy-depression', subject: 'psychiatry', title: 'Depression (mood disorder)', blurb: 'Depressive episode, suicide risk assessment, bipolar depression, postpartum depression',
  complaints: ['Low mood', 'Loss of interest', 'Easy fatigability', 'Sleep disturbance', 'Reduced appetite', 'Poor concentration', 'Feeling worthless or guilty', 'Hopelessness', 'Thoughts of death or self-harm', 'Crying spells', 'Multiple body aches', 'Social withdrawal', 'Irritability'],
  hpi: [
    sym('lowmood', 'Persistent low mood', ['onset', 'duration', 'progression', at('diur', 'Diurnal variation', ['Worse in the morning', 'Worse in the evening', 'No variation']), at('react', 'Reactivity', ['Mood brightens with good news', 'Mood does not react'])]),
    sym('anhedonia', 'Loss of interest and pleasure', ['onset', 'duration', at('ass', 'Withdrawn from', ['Hobbies', 'Work or studies', 'Family and friends', 'Religious activity'], true)]),
    sym('energy', 'Fatigue / loss of energy', ['onset', 'duration', 'progression']),
    sym('sleepdist', 'Sleep disturbance', ['onset', 'duration', at('type', 'Type', ['Early morning awakening', 'Difficulty falling asleep', 'Frequent awakenings', 'Excessive sleep (hypersomnia)'], true)]),
    sym('appwt', 'Appetite and weight change', ['onset', 'duration', at('type', 'Change', ['Loss of appetite', 'Increased appetite', 'Weight loss', 'Weight gain'], true)]),
    sym('conc', 'Poor concentration / indecisiveness', ['onset', 'duration']),
    sym('guilt', 'Guilt / worthlessness / hopelessness', ['onset', 'duration', at('ass', 'Features', ['Feels a burden to others', 'Feels punished for past deeds', 'Sees no future'], true)]),
    sym('suicide', 'Suicidal thoughts', ['onset', 'duration', at('ass', 'Features', ['Passive wish to be dead', 'Active suicidal ideation', 'Plan made', 'Intent present', 'Previous attempt'], true)]),
    sym('retard', 'Psychomotor change', ['onset', at('type', 'Type', ['Slowing of movement and speech', 'Agitation or restlessness'], true)]),
    sym('somatic', 'Somatic complaints', ['onset', 'duration', at('ass', 'Complaints', ['Headache', 'Body aches', 'Constipation', 'Loss of libido', 'Palpitations', 'Dryness of mouth'], true)]),
    sym('psychotic', 'Psychotic features', ['onset', at('ass', 'Features', ['Delusions of guilt or poverty', 'Nihilistic delusions', 'Derogatory voices', 'Stupor'], true)]),
    sym('mania', 'Past manic or hypomanic episodes', ['duration', at('ass', 'Features', ['Elevated mood', 'Decreased need for sleep', 'Overactivity', 'Spending spree'], true)]),
    sym('stress', 'Precipitating stressors', ['onset', at('ass', 'Stressor', ['Bereavement', 'Financial loss', 'Examination failure', 'Relationship breakup', 'Job loss', 'Chronic illness', 'Childbirth (postpartum)', 'No clear stressor'], true)]),
  ],
  middle: [
    sec('risk', 'Suicide risk assessment', [
      fd('riskF', 'Risk factors', ['Previous attempt', 'Family history of suicide', 'Access to means', 'Alcohol or substance use', 'Social isolation', 'Chronic medical illness', 'Recent loss', 'Hopelessness', 'Psychotic features', 'Impulsivity']),
      area('riskN', 'Plan, intent, availability of means and protective factors (family, religion, children)'),
    ]),
    sec('premorbid', 'Premorbid personality and treatment', [
      ch('prem', 'Premorbid personality', ['Anxious', 'Obsessional', 'Dependent', 'Sensitive', 'Extroverted', 'Introverted', 'Well adjusted'], true),
      fd('rxHx', 'Treatment so far', ['On antidepressants', 'Irregular compliance', 'Previous ECT', 'Counselling or psychotherapy', 'Faith healers', 'No treatment taken']),
      area('rxN', 'Drugs, doses and response'),
    ]),
  ],
  pastExtra: ['Previous depressive episode', 'Previous psychiatric treatment', 'Head injury', 'Chronic pain', 'Cancer or chronic illness'],
  familyExtra: ['Depression or other mental illness', 'Suicide', 'Alcohol dependence', 'Bipolar disorder'],
  exam: mse({ thought: ['Nihilistic delusion'] }),
})

const mania = mk({
  id: 'psy-mania', subject: 'psychiatry', title: 'Mania / bipolar disorder', blurb: 'Manic episode, hypomania, mixed states, relapse and compliance', noMenstrual: false,
  complaints: ['Elevated or irritable mood', 'Excessive talking', 'Decreased need for sleep', 'Overactivity', 'Grandiose ideas', 'Spending spree', 'Aggressive behaviour', 'Disinhibited behaviour', 'Not taking treatment', 'Low mood in the past'],
  hpi: [
    sym('elated', 'Elevated or irritable mood', ['onset', 'duration', 'progression', at('type', 'Type', ['Euphoric', 'Irritable', 'Expansive', 'Labile'], true)]),
    sym('talk', 'Excessive talking', ['onset', 'duration', at('ass', 'Features', ['Pressured speech', 'Jumping from topic to topic', 'Easily distracted'], true)]),
    sym('sleepneed', 'Decreased need for sleep', ['onset', 'duration', at('hrs', 'Sleep per night', ['Less than 4 hours', '4 to 5 hours', 'None for days'])]),
    sym('active', 'Increased activity', ['onset', 'duration', at('ass', 'Features', ['Restless', 'Many new projects', 'Increased sexual interest', 'Travelling without purpose', 'Increased socialising'], true)]),
    sym('grand', 'Grandiosity', ['onset', 'duration', at('ass', 'Features', ['Inflated self-esteem', 'Special powers or mission', 'Wealth or fame claims'], true)]),
    sym('reckless', 'Reckless behaviour', ['onset', 'duration', at('ass', 'Behaviour', ['Overspending', 'Gambling', 'Risky sexual behaviour', 'Reckless driving', 'Bad investments'], true)]),
    sym('aggr', 'Aggressive behaviour', ['onset', 'duration', at('ass', 'Features', ['Verbal abuse', 'Physical violence', 'Property damage'], true)]),
    sym('psychotic', 'Psychotic symptoms', ['onset', at('ass', 'Features', ['Delusions of grandeur', 'Persecutory delusions', 'Hearing voices', 'Delusion of reference'], true)]),
    sym('dep', 'Past depressive episodes', ['duration', at('ass', 'Features', ['Low mood for 2 weeks or more', 'Suicidal thoughts', 'Treated with antidepressants'], true)]),
    sym('trig', 'Precipitants', ['onset', at('ass', 'Factor', ['Stopped lithium or mood stabiliser', 'Antidepressant started', 'Sleep loss', 'Steroids', 'Substance use', 'Stress', 'None identified'], true)]),
  ],
  middle: [
    sec('course', 'Course of illness', [
      txt('episodes', 'Number of manic and depressive episodes', { half: true }), txt('lastEp', 'Duration of the current episode', { half: true }),
      fd('rxHx', 'Treatment so far', ['On lithium', 'On valproate', 'On antipsychotic', 'Poor compliance', 'Previous ECT', 'Previous admissions', 'No treatment taken']),
      area('rxN', 'Drugs, doses, levels and response'),
    ]),
  ],
  pastExtra: ['Previous manic episode', 'Previous depression', 'Hypothyroidism', 'Head injury', 'Previous psychiatric admission'],
  familyExtra: ['Bipolar disorder', 'Depression', 'Suicide', 'Schizophrenia'],
  exam: mse({ mood: ['Euphoric mood'], speech: ['Clang association'], thought: ['Grandiose ideas'], app: ['Over-familiar', 'Colourful dress and make-up'] }),
})

const schizo = mk({
  id: 'psy-schizo', subject: 'psychiatry', title: 'Psychosis (schizophrenia)', blurb: 'Hallucinations, delusions, first-rank symptoms, negative symptoms, relapse',
  complaints: ['Hearing voices', 'Suspiciousness', 'Fearfulness', 'Talking to self', 'Muttering and smiling to self', 'Social withdrawal', 'Poor self-care', 'Aggressive behaviour', 'Sleep disturbance', 'Fixed false beliefs', 'Reduced speech', 'Stopped working or studying', 'Not taking medicines'],
  hpi: [
    sym('ah', 'Auditory hallucinations', ['onset', 'duration', 'progression', at('type', 'Type', ['Second person voices', 'Third person voices', 'Running commentary', 'Voices discussing the patient', 'Command voices'], true), at('ass', 'Content', ['Abusive', 'Threatening', 'Instructing to harm', 'Instructing to self-harm'], true)]),
    sym('delus', 'Delusions', ['onset', 'duration', at('type', 'Type', ['Persecutory', 'Reference', 'Control', 'Grandiose', 'Jealousy', 'Somatic', 'Religious'], true)]),
    sym('fr', 'Passivity and thought disorder', ['onset', 'duration', at('type', 'Experiences', ['Thought insertion', 'Thought withdrawal', 'Thought broadcasting', 'Made feelings', 'Made actions', 'Somatic passivity'], true)]),
    sym('behav', 'Disorganised or odd behaviour', ['onset', 'duration', at('ass', 'Behaviour', ['Muttering and smiling to self', 'Wandering', 'Inappropriate laughing', 'Odd dress', 'Hoarding'], true)]),
    sym('neg', 'Negative symptoms', ['onset', 'duration', 'progression', at('ass', 'Symptoms', ['Social withdrawal', 'Apathy and lack of drive', 'Reduced speech', 'Blunted emotion', 'Poor self-care', 'Decline in work or studies'], true)]),
    sym('aggr', 'Aggression or self-harm', ['onset', at('ass', 'Behaviour', ['Violence on command', 'Violence due to fear', 'Self-harm', 'Suicidal ideas'], true)]),
    sym('moodsx', 'Mood symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Depressed mood', 'Elevated mood', 'Anxiety'], true)]),
    sym('subst', 'Substance use', ['duration', at('ass', 'Substance', ['Cannabis', 'Alcohol', 'Stimulants', 'Opioids'], true)]),
    sym('stress', 'Precipitating factors', ['onset', at('ass', 'Factor', ['Stopped medication', 'Stress', 'Substance use', 'Childbirth', 'None'], true)]),
  ],
  middle: [
    sec('course', 'Course, premorbid functioning and treatment', [
      ch('onsetT', 'Mode of onset', ['Acute (less than 2 weeks)', 'Subacute', 'Insidious (months)']),
      txt('prodrome', 'Prodrome and duration of illness', { half: true }), txt('episodes', 'Number of relapses and admissions', { half: true }),
      ch('prem', 'Premorbid personality', ['Schizoid (shy, loner)', 'Paranoid', 'Well adjusted', 'Anxious'], true),
      fd('rxHx', 'Treatment so far', ['On antipsychotics', 'Irregular compliance', 'Depot injection', 'Clozapine', 'Previous ECT', 'Faith healers', 'No treatment taken']),
      area('rxN', 'Drugs, doses, side effects (stiffness, tremors, restlessness, weight gain)'),
    ]),
  ],
  pastExtra: ['Previous psychiatric admission', 'Head injury', 'Epilepsy', 'Substance use disorder'],
  familyExtra: ['Schizophrenia or psychosis', 'Mood disorder', 'Suicide', 'Substance use disorder'],
  exam: mse({ speech: ['Neologisms', 'Word salad', 'Echolalia'], thought: ['Thought echo'], app: ['Catatonic posturing', 'Waxy flexibility', 'Negativism', 'Stereotypies', 'Mannerisms'], mood: ['Apathy'] }).concat([
    sec('ep', 'Side effects of antipsychotics', [
      fd('epF', 'Findings', ['Rigidity', 'Tremors', 'Bradykinesia', 'Akathisia', 'Acute dystonia', 'Tardive dyskinesia', 'Weight gain', 'Galactorrhoea', 'Postural hypotension']),
      area('epN', 'Describe'),
    ]),
  ]),
})

const anxiety = mk({
  id: 'psy-anxiety', subject: 'psychiatry', title: 'Anxiety, OCD and somatic complaints', blurb: 'Generalised anxiety, panic disorder, phobia, OCD, somatic symptom disorder',
  complaints: ['Excessive worry', 'Palpitations', 'Trembling', 'Sweating', 'Fear of impending doom', 'Panic attacks', 'Repetitive thoughts', 'Repetitive washing or checking', 'Avoidance of situations', 'Multiple body aches', 'Difficulty sleeping', 'Breathlessness without cause', 'Dizziness'],
  hpi: [
    sym('worry', 'Excessive worry', ['onset', 'duration', 'progression', at('ass', 'About', ['Health', 'Family', 'Money', 'Work or studies', 'Everything'], true)]),
    sym('panic', 'Panic attacks', ['onset', 'duration', 'episodes', at('ass', 'During the attack', ['Palpitations', 'Chest pain', 'Breathlessness', 'Choking', 'Trembling', 'Sweating', 'Fear of dying', 'Fear of going mad', 'Numbness or tingling', 'Derealisation'], true), at('peak', 'Attack peaks within', ['Less than 10 minutes', '10 to 30 minutes'])]),
    sym('phobia', 'Phobic avoidance', ['onset', 'duration', at('type', 'Type', ['Social situations', 'Crowds, open or closed spaces (agoraphobia)', 'Specific object or animal', 'Heights', 'Blood or injury'], true)]),
    sym('obs', 'Obsessions', ['onset', 'duration', at('type', 'Theme', ['Contamination', 'Doubt', 'Symmetry or order', 'Aggressive thoughts', 'Sexual thoughts', 'Religious thoughts'], true), at('ins', 'Recognised as own and senseless', ['Yes, resists them', 'No'])]),
    sym('comp', 'Compulsions', ['onset', 'duration', at('type', 'Type', ['Washing', 'Checking', 'Counting', 'Ordering', 'Repeating', 'Mental rituals', 'Hoarding'], true), at('time', 'Time spent per day', ['Less than 1 hour', '1 to 3 hours', 'More than 3 hours'])]),
    sym('somatic', 'Unexplained bodily symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Chest pain', 'Headache', 'Abdominal discomfort', 'Back pain', 'Burning sensations', 'Weakness', 'Dizziness'], true)]),
    sym('autonomic', 'Autonomic symptoms', ['duration', at('ass', 'Symptoms', ['Palpitations', 'Sweating', 'Tremors', 'Dry mouth', 'Frequency of urine', 'Loose stools', 'Hot flushes'], true)]),
    sym('sleepdist', 'Sleep disturbance', ['duration', at('type', 'Type', ['Difficulty falling asleep', 'Frequent awakenings', 'Nightmares'], true)]),
    sym('depr', 'Associated depression', ['duration', at('ass', 'Features', ['Low mood', 'Loss of interest', 'Hopelessness'], true)]),
    sym('doctor', 'Repeated medical consultations', ['duration', at('ass', 'Pattern', ['Many doctors consulted', 'Repeated investigations normal', 'Not reassured', 'Doctor shopping'], true)]),
    sym('stress', 'Stressors and trauma', ['onset', at('ass', 'Factor', ['Examination or work stress', 'Marital conflict', 'Bereavement', 'Accident or assault', 'Financial problems', 'None identified'], true)]),
  ],
  middle: [
    sec('contrib', 'Contributing factors', [
      fd('contF', 'Factors', ['Excess caffeine', 'Tobacco', 'Alcohol use', 'Substance use', 'Thyroid disorder', 'Cardiac cause excluded', 'Recent medication change']),
      area('contN', 'Details'),
    ]),
  ],
  pastExtra: ['Previous anxiety episodes', 'Asthma', 'Thyroid disorder', 'Cardiac evaluation done'],
  familyExtra: ['Anxiety disorder', 'Obsessive compulsive disorder', 'Depression', 'Alcohol dependence'],
  exam: mse({ thought: ['Health anxiety'] }).concat([
    sec('anxsigns', 'Physical signs of anxiety', [
      fd('axF', 'Findings', ['Tachycardia', 'Tremors of outstretched hands', 'Cold clammy hands', 'Hyperventilation', 'Brisk reflexes', 'Dilated pupils', 'Sweating', 'Goitre', 'Eye signs of thyrotoxicosis']),
      area('axN', 'Details'),
    ]),
  ]),
})

const alcohol = mk({
  id: 'psy-alcohol', subject: 'psychiatry', title: 'Alcohol and substance use disorder', blurb: 'Alcohol dependence, withdrawal, delirium tremens, Wernicke, opioid and cannabis use',
  complaints: ['Excessive drinking', 'Tremors', 'Craving for alcohol', 'Sleeplessness', 'Fits', 'Seeing things or hearing voices', 'Morning vomiting', 'Family problems', 'Job loss', 'Yellowish eyes', 'Abdominal pain', 'Black stools', 'Memory lapses', 'Aggressive behaviour'],
  hpi: [
    sym('pattern', 'Drinking pattern', ['onset', 'duration', 'progression', at('type', 'Pattern', ['Daily', 'Binge', 'Weekend only', 'Morning drinking'], true)]),
    sym('craving', 'Craving and loss of control', ['duration', at('ass', 'Features', ['Strong craving', 'Unable to stop once started', 'Failed attempts to quit', 'Drinks more than planned', 'Hides drinking'], true)]),
    sym('withd', 'Withdrawal symptoms', ['onset', 'duration', at('ass', 'Symptoms', ['Tremors', 'Sweating', 'Nausea and vomiting', 'Anxiety', 'Insomnia', 'Palpitations', 'Restlessness'], true), at('rel', 'Relieved by', ['Drinking again'])]),
    sym('fits', 'Withdrawal seizures', ['onset', 'episodes', at('ass', 'Timing', ['6 to 48 hours after last drink', 'Generalised tonic-clonic', 'Multiple fits'], true)]),
    sym('dt', 'Delirium tremens', ['onset', 'duration', at('ass', 'Features', ['Disorientation', 'Visual hallucinations (small animals)', 'Tremulousness', 'Fever and sweating', 'Agitation', 'Sleeplessness'], true), at('time', 'Started', ['48 to 96 hours after last drink'])]),
    sym('wern', 'Neurological complications', ['onset', 'duration', at('ass', 'Symptoms', ['Confusion', 'Unsteady gait', 'Double vision', 'Numbness or tingling of feet', 'Memory loss (confabulation)', 'Blackouts'], true)]),
    sym('liver', 'Liver and GI complications', ['onset', 'duration', at('ass', 'Symptoms', ['Jaundice', 'Abdominal distension', 'Haematemesis', 'Melaena', 'Epigastric pain', 'Pedal oedema'], true)]),
    sym('psych', 'Psychiatric symptoms', ['onset', at('ass', 'Symptoms', ['Depression', 'Suicidal thoughts', 'Jealousy of spouse (morbid jealousy)', 'Hearing voices (alcoholic hallucinosis)'], true)]),
    sym('social', 'Social and occupational consequences', ['duration', at('ass', 'Problems', ['Marital discord', 'Domestic violence', 'Job loss', 'Debts', 'Legal problems', 'Accidents or drunk driving'], true)]),
    sym('other', 'Other substance use', ['duration', at('ass', 'Substance', ['Cannabis', 'Opioids', 'Benzodiazepines', 'Tobacco', 'Injectable drugs'], true)]),
  ],
  middle: [
    sec('substance', 'Substance use history', [
      ch('agent', 'Substance', ['Alcohol', 'Cannabis', 'Opioid', 'Tobacco', 'Benzodiazepine', 'Stimulant', 'Inhalant'], true),
      txt('age1', 'Age at first use', { half: true }), txt('qty', 'Quantity and frequency (units per day)', { half: true }),
      txt('lastDrink', 'Time of last drink or use', { half: true }), txt('years', 'Years of regular use', { half: true }),
      fd('cage', 'CAGE questions (present = yes)', ['Tried to Cut down', 'Annoyed by criticism', 'felt Guilty about drinking', 'Eye-opener drink in the morning']),
      fd('depend', 'Dependence syndrome (ICD-10)', ['Strong craving', 'Impaired control', 'Withdrawal state', 'Tolerance', 'Neglect of other interests', 'Persistent use despite harm', 'Narrowing of drinking repertoire']),
      ch('motiv', 'Motivation to quit (stage of change)', ['Pre-contemplation', 'Contemplation', 'Preparation', 'Action', 'Maintenance']),
    ]),
  ],
  pastExtra: ['Withdrawal seizures', 'Delirium tremens', 'Liver disease', 'Pancreatitis', 'Previous de-addiction treatment', 'Head injury'],
  familyExtra: ['Alcohol dependence', 'Substance use disorder', 'Psychiatric illness'],
  gpeExtra: ['Alcohol odour in breath', 'Facial flushing', 'Parotid enlargement', 'Spider naevi', 'Palmar erythema', 'Gynaecomastia', 'Dupuytren contracture', 'Tremors of hands', 'Tongue tremors', 'Poor hygiene'],
  exam: mse({ cog: ['Confabulation', 'Impaired immediate recall'], percept: ['Formication'], thought: ['Morbid jealousy'] }).concat([
    sec('sys', 'Systemic examination and withdrawal assessment', [
      fd('sysF', 'Findings', ['Hepatomegaly', 'Ascites', 'Splenomegaly', 'Jaundice', 'Ataxic gait', 'Nystagmus', 'Ophthalmoplegia', 'Peripheral neuropathy', 'Asterixis', 'Delirium (fluctuating consciousness)', 'Withdrawal tremors', 'Autonomic overactivity (tachycardia, sweating, fever)']),
      area('sysN', 'CIWA-Ar score if done, and other findings'),
    ]),
  ]),
})

const organic = mk({
  id: 'psy-organic', subject: 'psychiatry', title: 'Delirium and dementia (organic mental disorders)', blurb: 'Acute confusion, Alzheimer, vascular dementia, pseudodementia, cognitive assessment',
  complaints: ['Forgetfulness', 'Confusion', 'Disorientation', 'Wandering', 'Getting lost', 'Irrelevant talk', 'Seeing things that are not there', 'Sleep reversal', 'Change in personality', 'Difficulty in daily activities', 'Urinary incontinence', 'Aggressive behaviour', 'Fluctuating consciousness', 'Fever', 'Recent fall'],
  hpi: [
    sym('onset', 'Mode of onset', ['onset', 'duration', 'progression', at('pat', 'Pattern', ['Acute (hours to days)', 'Insidious (months to years)', 'Stepwise deterioration', 'Fluctuating through the day', 'Worse at night'])]),
    sym('memory', 'Memory loss', ['onset', 'duration', 'progression', at('type', 'Type', ['Recent memory first', 'Forgets names', 'Repeats questions', 'Misplaces things', 'Forgets appointments', 'Remote memory spared early'], true)]),
    sym('disor', 'Disorientation', ['onset', 'duration', at('type', 'To', ['Time', 'Place', 'Person'], true)]),
    sym('adl', 'Difficulty in daily activities', ['onset', 'progression', at('ass', 'Unable to', ['Manage money', 'Cook or use appliances', 'Dress', 'Bathe', 'Use the toilet', 'Recognise family'], true)]),
    sym('lang', 'Language and higher function', ['onset', 'duration', at('ass', 'Problems', ['Word-finding difficulty', 'Getting lost in familiar places', 'Difficulty using objects (apraxia)', 'Poor judgement'], true)]),
    sym('behav', 'Behavioural change', ['onset', 'duration', at('ass', 'Change', ['Personality change', 'Disinhibition', 'Apathy', 'Aggression', 'Suspiciousness', 'Wandering', 'Sundowning'], true)]),
    sym('hallu', 'Hallucinations', ['onset', 'duration', at('type', 'Type', ['Visual (people, animals)', 'Auditory', 'Tactile'], true)]),
    sym('sleepdist', 'Sleep-wake disturbance', ['onset', at('type', 'Pattern', ['Day-night reversal', 'Restless at night', 'Excess daytime sleep'], true)]),
    sym('delirium', 'Acute precipitants (delirium)', ['onset', at('ass', 'Cause', ['Fever or infection', 'New drugs', 'Dehydration', 'Head injury', 'Alcohol withdrawal', 'Urinary retention', 'Metabolic derangement', 'Surgery'], true)]),
    sym('vasc', 'Vascular and other risks', ['duration', at('ass', 'Risk', ['Hypertension', 'Diabetes', 'Stroke', 'Atrial fibrillation', 'Head injury', 'Alcohol', 'Hypothyroidism', 'Vitamin B12 deficiency'], true)]),
    sym('urine', 'Incontinence and gait', ['onset', at('ass', 'Features', ['Urinary incontinence', 'Falls', 'Magnetic gait (hydrocephalus)', 'Tremor or rigidity'], true)]),
  ],
  middle: [
    sec('informant', 'Informant account and function', [
      ch('infrel', 'Informant', ['Spouse', 'Son or daughter', 'Caregiver', 'Neighbour']),
      ch('depend', 'Dependence', ['Independent', 'Needs prompting', 'Needs help with daily tasks', 'Fully dependent']),
      area('infN', 'Time course and impact on daily life'),
    ]),
  ],
  pastExtra: ['Stroke', 'Transient ischaemic attack', 'Head injury', 'Parkinson disease', 'Depression', 'Alcohol dependence', 'Hypothyroidism', 'Previous delirium'],
  familyExtra: ['Dementia', 'Parkinson disease', 'Stroke'],
  exam: mse({ cog: ['Impaired registration', 'Impaired recall of 3 objects', 'Impaired naming', 'Cannot copy intersecting pentagons', 'Impaired clock drawing', 'Disorganised thinking'], percept: ['Visual misperceptions'], app: ['Fluctuating level of consciousness', 'Inattentive', 'Perseveration'] }).concat([
    sec('neuro', 'Neurological examination', [
      fd('neuroF', 'Findings', ['Frontal release signs (grasp, snout)', 'Focal weakness', 'Extensor plantar', 'Rigidity', 'Resting tremor', 'Magnetic (shuffling) gait', 'Papilloedema', 'Asterixis', 'Neck stiffness', 'Aphasia', 'Apraxia']),
      area('neuroN', 'Details'),
    ]),
  ]),
})

export const PSYCH_CASES: CaseDef[] = [depression, mania, schizo, anxiety, alcohol, organic]
