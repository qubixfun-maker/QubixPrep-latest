// 200 EXPERT Ward Round cases (ward-101 .. ward-300). Format: group | topic | setting
// Harder, multi-step: 9 stages with two procedures, a mid-case complication and counselling.
export const EXPERT_RAW = `
Medicine|Anterior wall STEMI with cardiogenic shock|emergency
Medicine|Complete heart block after inferior MI|icu
Medicine|Acute aortic dissection (Stanford type A)|emergency
Medicine|Cardiac tamponade|emergency
Medicine|Hypertrophic obstructive cardiomyopathy with syncope|opd
Medicine|Aortic stenosis with exertional syncope|opd
Medicine|Peripartum cardiomyopathy|icu
Medicine|Torsades de pointes from QT prolongation|icu
Medicine|Wolff-Parkinson-White with pre-excited atrial fibrillation|emergency
Medicine|Pulmonary hypertension with right heart failure|ward
Medicine|Massive haemoptysis|emergency
Medicine|ARDS from sepsis|icu
Medicine|Pneumothorax in a COPD patient|emergency
Medicine|Pleural effusion needing diagnostic tapping|ward
Medicine|Sarcoidosis with bilateral hilar lymphadenopathy|opd
Medicine|Interstitial lung disease with respiratory failure|ward
Medicine|Multidrug-resistant tuberculosis|ward
Medicine|Tubercular meningitis with hydrocephalus|ward
Medicine|Cryptococcal meningitis in HIV|ward
Medicine|Pneumocystis pneumonia in new HIV|ward
Medicine|Cerebral toxoplasmosis in HIV|ward
Medicine|Septic shock from urosepsis|icu
Medicine|Scrub typhus with multi-organ dysfunction|ward
Medicine|Leptospirosis with Weil disease|ward
Medicine|Typhoid with intestinal perforation|emergency
Medicine|Cerebral malaria|icu
Medicine|Dengue shock syndrome|icu
Medicine|Tetanus with autonomic instability|icu
Medicine|Hyperosmolar hyperglycaemic state|emergency
Medicine|Thyroid storm|icu
Medicine|Myxoedema coma|icu
Medicine|Phaeochromocytoma crisis|emergency
Medicine|Primary hyperparathyroidism with hypercalcaemic crisis|ward
Medicine|Pituitary apoplexy|emergency
Medicine|Hyponatraemia with SIADH|ward
Medicine|Hypokalaemic periodic paralysis|emergency
Medicine|Lupus nephritis flare|ward
Medicine|Rapidly progressive glomerulonephritis|ward
Medicine|Acute tubular necrosis after contrast|ward
Medicine|Diabetic nephropathy with uraemic emergency|emergency
Medicine|Upper GI bleed from a bleeding peptic ulcer|emergency
Medicine|Acute liver failure from paracetamol|icu
Medicine|Spontaneous bacterial peritonitis|ward
Medicine|Hepatorenal syndrome|icu
Medicine|Wilson disease|opd
Medicine|Haemochromatosis|opd
Medicine|Ulcerative colitis with toxic megacolon|ward
Medicine|Crohn disease with enterocutaneous fistula|ward
Medicine|Myasthenic crisis|icu
Medicine|Subarachnoid haemorrhage|emergency
Medicine|Cerebral venous sinus thrombosis|emergency
Medicine|Parkinson disease with neuroleptic malignant syndrome|icu
Medicine|Multiple sclerosis relapse|ward
Medicine|Wernicke encephalopathy|emergency
Medicine|Rheumatoid arthritis with atlantoaxial subluxation|opd
Medicine|Systemic sclerosis with renal crisis|ward
Surgery|Acute mesenteric ischaemia|emergency
Surgery|Sigmoid volvulus|emergency
Surgery|Acute cholangitis (Charcot triad)|emergency
Surgery|Necrotising pancreatitis with infected collection|icu
Surgery|Perforated appendicitis with peritonitis|emergency
Surgery|Obstructing carcinoma of the colon|emergency
Surgery|Lower GI bleed from diverticular disease|emergency
Surgery|Achalasia cardia|opd
Surgery|Boerhaave syndrome|emergency
Surgery|Carcinoma stomach with gastric outlet obstruction|ward
Surgery|Obstructive jaundice from choledocholithiasis|ward
Surgery|Hydatid cyst of the liver|ward
Surgery|Liver abscess (amoebic)|ward
Surgery|Retroperitoneal haematoma after trauma|emergency
Surgery|Flail chest with pulmonary contusion|emergency
Surgery|Massive haemothorax|emergency
Surgery|Cardiac injury from penetrating chest trauma|emergency
Surgery|Pelvic fracture with haemorrhagic shock|emergency
Surgery|Urethral injury after pelvic fracture|emergency
Surgery|Ruptured abdominal aortic aneurysm|emergency
Surgery|Acute pancreatitis with abdominal compartment syndrome|icu
Surgery|Necrotising fasciitis|emergency
Surgery|Fournier gangrene|emergency
Surgery|Testicular torsion|emergency
Surgery|Obstructive uropathy with infected hydronephrosis|emergency
Surgery|Thyroid cancer with airway compromise|ward
Surgery|Post-thyroidectomy neck haematoma|ot
Surgery|Paediatric intussusception|paeds
Surgery|Malignant large bowel obstruction in the elderly|ward
Surgery|Acute appendicitis in the third trimester of pregnancy|emergency
Obstetrics & Gynaecology|Severe pre-eclampsia with HELLP syndrome|labour
Obstetrics & Gynaecology|Uterine rupture|labour
Obstetrics & Gynaecology|Shoulder dystocia|labour
Obstetrics & Gynaecology|Cord prolapse|labour
Obstetrics & Gynaecology|Amniotic fluid embolism|labour
Obstetrics & Gynaecology|Placenta accreta with massive haemorrhage|ot
Obstetrics & Gynaecology|Uterine inversion|labour
Obstetrics & Gynaecology|Peripartum sepsis|ward
Obstetrics & Gynaecology|Rh-negative mother with isoimmunisation|opd
Obstetrics & Gynaecology|Preterm labour with PPROM|labour
Obstetrics & Gynaecology|Twin pregnancy with twin-to-twin transfusion|opd
Obstetrics & Gynaecology|Molar pregnancy|ward
Obstetrics & Gynaecology|Hyperemesis gravidarum|ward
Obstetrics & Gynaecology|Intrahepatic cholestasis of pregnancy|opd
Obstetrics & Gynaecology|Heart disease in pregnancy in labour|labour
Obstetrics & Gynaecology|Breech presentation in labour|labour
Obstetrics & Gynaecology|Ovarian torsion|emergency
Obstetrics & Gynaecology|Ovarian hyperstimulation syndrome|ward
Obstetrics & Gynaecology|Endometrial carcinoma with postmenopausal bleeding|opd
Obstetrics & Gynaecology|Tubo-ovarian abscess|emergency
Obstetrics & Gynaecology|Eclampsia with a refractory seizure|labour
Obstetrics & Gynaecology|Postpartum psychosis|ward
Paediatrics|Neonatal sepsis|paeds
Paediatrics|Respiratory distress syndrome in a preterm baby|paeds
Paediatrics|Necrotising enterocolitis|paeds
Paediatrics|Hypoxic ischaemic encephalopathy|paeds
Paediatrics|Neonatal hypoglycaemia with seizures|paeds
Paediatrics|Haemolytic disease of the newborn|paeds
Paediatrics|Congenital diaphragmatic hernia|paeds
Paediatrics|Tracheo-oesophageal fistula|paeds
Paediatrics|Duct-dependent congenital heart disease|paeds
Paediatrics|Severe pneumonia with respiratory failure in a child|paeds
Paediatrics|Acute epiglottitis|paeds
Paediatrics|Croup with stridor at rest|paeds
Paediatrics|Foreign body in the airway with respiratory arrest|paeds
Paediatrics|Status asthmaticus in a child|paeds
Paediatrics|Diabetic ketoacidosis in a child with cerebral oedema|paeds
Paediatrics|Nephrotic syndrome with peritonitis|paeds
Paediatrics|Haemolytic uraemic syndrome|paeds
Paediatrics|Henoch-Schonlein purpura|paeds
Paediatrics|Dengue haemorrhagic fever in a child|paeds
Paediatrics|Complicated severe malnutrition with shock|paeds
Paediatrics|Neonatal tetanus|paeds
Paediatrics|Duchenne muscular dystrophy|opd
Emergency & Toxicology|Aluminium phosphide poisoning|emergency
Emergency & Toxicology|Organophosphate poisoning with intermediate syndrome|icu
Emergency & Toxicology|Viperine snakebite with coagulopathy|emergency
Emergency & Toxicology|Methanol poisoning|emergency
Emergency & Toxicology|Dhatura poisoning|emergency
Emergency & Toxicology|Paraquat poisoning|emergency
Emergency & Toxicology|Tricyclic antidepressant overdose|emergency
Emergency & Toxicology|Salicylate toxicity|emergency
Emergency & Toxicology|Digoxin toxicity|emergency
Emergency & Toxicology|Scorpion sting with pulmonary oedema|emergency
Emergency & Toxicology|Drowning with hypothermia|emergency
Emergency & Toxicology|Electrical burns|emergency
Emergency & Toxicology|Smoke inhalation injury|emergency
Emergency & Toxicology|Traumatic brain injury with raised intracranial pressure|emergency
Emergency & Toxicology|Cervical spine injury|emergency
Emergency & Toxicology|Polytrauma primary survey|emergency
Emergency & Toxicology|Pulseless electrical activity|emergency
Emergency & Toxicology|Cardiac arrest in pregnancy|emergency
Orthopaedics|Open tibial fracture (Gustilo type III)|emergency
Orthopaedics|Fat embolism syndrome|icu
Orthopaedics|Cauda equina syndrome|emergency
Orthopaedics|Posterior hip dislocation|emergency
Orthopaedics|Osteomyelitis in a child|paeds
Orthopaedics|Spinal tuberculosis with paraplegia|ward
Orthopaedics|Slipped capital femoral epiphysis|paeds
Orthopaedics|Developmental dysplasia of the hip|paeds
ENT|Ludwig angina|emergency
ENT|Peritonsillar abscess with trismus|emergency
ENT|Acute epiglottitis in an adult|emergency
ENT|Sudden sensorineural hearing loss|opd
ENT|Juvenile nasopharyngeal angiofibroma|opd
ENT|Carcinoma larynx needing tracheostomy|ward
Ophthalmology|Open globe injury|emergency
Ophthalmology|Retinal detachment|emergency
Ophthalmology|Orbital cellulitis|emergency
Ophthalmology|Endophthalmitis after cataract surgery|ward
Ophthalmology|Giant cell arteritis with visual loss|emergency
Ophthalmology|Retinoblastoma|paeds
Dermatology|Toxic epidermal necrolysis|icu
Dermatology|Pemphigus vulgaris|ward
Dermatology|Erythema nodosum leprosum|ward
Dermatology|DRESS syndrome|ward
Dermatology|Pyoderma gangrenosum|ward
Dermatology|Secondary syphilis|opd
Psychiatry|Neuroleptic malignant syndrome|icu
Psychiatry|Serotonin syndrome|emergency
Psychiatry|Lithium toxicity|emergency
Psychiatry|Catatonia|ward
Psychiatry|Acute psychosis with agitation|emergency
Psychiatry|Suicidal ideation after self-harm|emergency
Psychiatry|Opioid withdrawal and overdose|emergency
Psychiatry|Panic disorder mimicking myocardial infarction|emergency
Community Medicine|Diphtheria outbreak|community
Community Medicine|Hepatitis A outbreak in a hostel|community
Community Medicine|Maternal death audit|community
Community Medicine|Vaccine cold-chain failure|community
Forensic Medicine|Asphyxial death - ligature strangulation|forensic
Forensic Medicine|Firearm injury - entry and exit wound|forensic
Forensic Medicine|Rape survivor - medicolegal examination|forensic
Forensic Medicine|Death in custody - post-mortem|forensic
Anaesthesia|Difficult airway - can't intubate can't ventilate|ot
Anaesthesia|Local anaesthetic systemic toxicity|ot
Anaesthesia|Anaphylaxis under anaesthesia|ot
Anaesthesia|Total spinal block|ot
Anaesthesia|Post-dural puncture headache|ward
Anaesthesia|Aspiration at induction|ot
Haematology|Disseminated intravascular coagulation|icu
Haematology|Acute promyelocytic leukaemia|ward
Haematology|Thrombotic thrombocytopenic purpura|icu
Haematology|Massive transfusion and transfusion reaction|emergency
`
