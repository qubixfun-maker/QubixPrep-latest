// Textbook order for Rapid Revision Notes.
// Each subject has ordered units, and each unit has its chapters in the order the standard textbook prints them.
// The notes chapters saved in Firestore are matched to these names by title, then shown unit by unit in this order.
// A chapter that matches nothing is not lost: it goes into "More chapters" at the end.

import { tokens } from "./top100-link"

export type Unit = { name: string; chapters: string[] }
export type Layout = { book: string; exact?: string[]; contains?: string[]; units: Unit[] }

const L = (s: string) => s.split("|").map((x) => x.trim()).filter(Boolean)
const U = (name: string, chapters: string): Unit => ({ name, chapters: L(chapters) })

/* ------------------------------ Anatomy (Vishram Singh, BD Chaurasia, Sangeeta) ------------------------------ */
const ANATOMY: Unit[] = [
  U("Upper Limb", "Introduction to the Upper Limb|Bones of the Upper Limb|Pectoral Region|Axilla (Armpit)|Back of the Body and Scapular Region|Shoulder Joint Complex (Joints of Shoulder Girdle)|Cutaneous Innervation, Venous Drainage and Lymphatic Drainage of the Upper Limb|Arm|Forearm|Elbow and Radio-ulnar Joints|Hand|Joints and Movements of the Hand|Major Nerves of the Upper Limb"),
  U("Lower Limb", "Introduction to the Lower Limb|Bones of the Lower Limb|Front of the Thigh|Medial Side of the Thigh|Gluteal Region|Back of the Thigh and Popliteal Fossa|Hip Joint|Front of the Leg and Dorsum of the Foot|Lateral and Medial Sides of the Leg|Back of the Leg|Sole of the Foot|Arches of the Foot|Joints of the Lower Limb|Venous and Lymphatic Drainage of the Lower Limb|Innervation of the Lower Limb"),
  U("Abdomen", "Introduction and Overview of the Abdomen|Osteology of the Abdomen|Anterior Abdominal Wall|Inguinal Region/Groin|Male External Genital Organs|Abdominal Cavity and Peritoneum|Abdominal Part of Esophagus, Stomach, and Spleen|Liver and Extrahepatic Biliary Apparatus|Duodenum, Pancreas, and Portal Vein|Small and Large Intestines|Kidneys, Ureters, and Suprarenal Glands|Posterior Abdominal Wall and Associated Structures|Pelvis|Pelvic Walls and Associated Soft Tissue Structures|Perineum|Urinary Bladder and Urethra|Male Genital Organs|Female Genital Organs|Rectum and Anal Canal"),
  U("Thorax", "Introduction to Thorax and Thoracic Cage|Bones and Joints of the Thorax|Thoracic Wall and Mechanism of Respiration|Pleural Cavities|Lungs (Pulmones)|Mediastinum|Pericardium and Heart|Superior Vena Cava, Aorta, Pulmonary Trunk, and Thymus|Trachea and Esophagus|Thoracic Duct, Azygos and Hemiazygos Veins, and Thoracic Sympathetic Trunks"),
  U("Head and Neck", "Living Anatomy of the Head and Neck|Osteology of the Head and Neck|Scalp, Temple, and Face|Skin, Superficial Fascia, and Deep Fascia of the Neck|Side of the Neck|Anterior Region of the Neck|Back of the Neck and Cervical Spinal Column|Parotid Region|Submandibular Region|Infratemporal Fossa, Temporomandibular Joint, and Pterygopalatine Fossa|Thyroid and Parathyroid Glands, Trachea, and Esophagus|Pre- and Paravertebral Regions and Root of the Neck|Oral Cavity|Pharynx and Palate|Larynx|Blood Supply and Lymphatic Drainage of the Head and Neck|Nose and Paranasal Air Sinuses|Ear|Orbit and Eyeball|Vertebral Canal and Its Contents|Cranial Cavity|Cranial Nerves"),
  U("Neuroanatomy", "Development of the Nervous System|Organization and Functions of the Nervous System|Peripheral Nerves and Ganglia|Receptors and Effectors|Dermatomes and Muscular Activity|Central Nervous System: An Overview|Spinal Cord|Brainstem|Nuclei, Functional Components and Distribution of Cranial Nerves|Cerebellum and Fourth Ventricle|Diencephalon and Third Ventricle|Cerebrum|Basal Nuclei (Basal Ganglia)|White Matter of the Cerebrum and Lateral Ventricles|Blood Supply of the Brain|Meninges and Cerebrospinal Fluid|Somatic Motor and Sensory Pathways|Special Senses and Their Neural Pathways|Reticular Formation and Limbic System|Autonomic Nervous System|General Plan and Membranes of the Brain"),
  U("Histology", "Microscope|Tissue Preparation|Epithelium|Glands|Connective Tissue|Cartilage|Bone|Muscular Tissue|Nervous Tissue|Circulatory System|Lymphatic Tissue|Integumentary System|Placenta and Umbilical Cord|Oral Cavity|Gastrointestinal Tract|Liver, Gall Bladder, Pancreas|Respiratory System|Urinary System|Male Reproductive System|Female Reproductive System|Endocrine Glands|Central Nervous System|Eye Ball and Eyelid"),
  U("General Anatomy", "Introduction|Skeleton|Joints|Muscles|Cardiovascular System|Lymphatic System|Nervous System|Skin and Fasciae|Connective Tissue, Ligaments and Raphe|Principles of Radiography"),
  U("Embryology", "Introduction to Human Embryology|Reproductive System|Cell Division and Gametogenesis|Fertilization and Formation of Germ Layers|Formation of Primitive Streak, Notochord, Neural Tube, Subdivisions of Intraembryonic Mesoderm, and Folding of Embryo|Extraembryonic Membranes and Twinning|Integumentary System|Skeletal System|Muscular System|Pharyngeal Apparatus|Development of Tongue and Thyroid|Development of Face, Nose, and Palate|Digestive Tract|Major Digestive Glands and Spleen|Development of Oral Cavity (Mouth)|Respiratory System|Body Cavities and Diaphragm|Development of Heart|Development of Blood Vessels|Development of Urinary System|Genital System|Development of Nervous System|Pituitary, Pineal, and Adrenal Glands|Eye and Ear|Medical Genetics|Application of Embryology in Clinical Practice"),
]

/* ------------------------------ Physiology (G.K. Pal) ------------------------------ */
const PHYSIOLOGY: Unit[] = [
  U("Section 1: General Physiology", "Defining the Role of Physiology in Modern Medicine|Functional Organization of Human Body|Principles of Homeostasis|Cellular Organization and Intercellular Connections|Physiology of Genetics and Apoptosis|Transport Across the Cell Membrane|Membrane Potential|Body Fluids"),
  U("Section 2: Blood and Immunity", "Composition and Functions of Blood and Plasma Proteins|Bone Marrow and Hemopoiesis|Red Blood Cells|Erythropoiesis|Destruction of Red Blood Cells|Hemoglobin and Blood Indices|Pathophysiology of Anemia and Polycythemia|Blood Groups and Physiological Basis of Blood Transfusion|White Blood Cells|Thymus, Lymphoid Tissues and Lymph|Physiology of Immunity|Platelets and Their Role in Hemostasis|Blood Coagulation"),
  U("Section 3: Nerve and Muscle", "Structure and Functions of Neurons|Nerve Potentials|Properties, Classification and Applied Aspects of Nerve Fibers|Neuromuscular Transmission|Structure of Skeletal Muscle: Physiological Aspects|Mechanism of Skeletal Muscle Contraction|Skeletal Muscle: Properties, Fiber Types and Applied Aspects|Smooth Muscle and Cardiac Muscle"),
  U("Section 4: Autonomic Nervous System", "Functional Organization of Autonomic Nervous System|Sympathetic System|Parasympathetic System|Control of Autonomic Functions and Applied Aspects|Autonomic Function Tests|Heart Rate Variability"),
  U("Section 5: Gastrointestinal System", "Functional Organization of GI System and Principles of GI Regulations|Gastrointestinal Hormones|Principles of GI Secretion and Secretion of Saliva|Gastric Secretion|Pancreatic Secretion|Physiology of Liver, Liver Function Tests and Pathophysiology of Jaundice|Biliary Secretion|Intestinal Secretion|Secretion of Large Intestine|Introduction to GI Motility|Chewing and Deglutition|Esophageal Motility|Gastric Motility|Small Intestinal Motility|Motility of Large Intestine|Principles of Digestion and Absorption"),
  U("Section 6: Endocrine Physiology", "Introduction to Endocrinology|Mechanisms of Hormone Action|Hypothalamus and Hypothalamo-pituitary Axis|Pituitary Gland: The Anterior Pituitary|Posterior Pituitary|Thyroid Gland|Adrenal Gland: The Adrenal Medulla|Adrenal Cortex|Endocrine Pancreas|Calcium and Phosphate Metabolism and Physiology of Bone|Parathyroid Gland, Calcitonin and Vitamin D|Pineal Gland|Local Hormones"),
  U("Section 7: Reproductive System", "Sex Differentiation and Development, Puberty and Menopause|Physiology of Puberty and Menopause|Male Reproductive System|Female Reproductive System: Functional Anatomy, Oogenesis and Follicular Development|Menstrual Cycle and Ovulation|Ovarian Hormones and Control of Ovarian Functions|Physiology of Copulation|Pregnancy and Parturition|Physiology of Breast Development and Lactation|Physiology of Contraception"),
  U("Section 8: Renal System", "General Introduction and Functional Anatomy of Kidney|Renal Blood Flow|Glomerular Filtration|Tubular Functions|Mechanisms of Urine Concentration and Dilution|Water Excretion, Diuresis, and Diuretics|Acidification of Urine|Kidney Function Tests and Pathophysiology of Renal Failure|Physiology of Micturition and Bladder Dysfunctions"),
  U("Section 9: Cardiovascular System", "Functional Organization of Cardiovascular System|Functional Anatomy of Heart, Cardiac Muscle, Conducting System, and Cardiac Innervation|Properties of Cardiac Muscle|Electrophysiology of the Heart|Electrocardiogram|Cardiac Cycle|Cardiac Output|Heart Rate and Arterial Pulse|Principles of Hemodynamics|Arterial System|Venous System|Capillary Circulation|Regulation of Blood Pressure|Integrated Regulation of Cardiovascular Functions|Regional Circulations|Fetal Circulation|Pathophysiology of Hypertension and Hypotension|Pathophysiology of Shock|Pathophysiology of Heart Failure"),
  U("Section 10: Respiratory System", "Functional Organization of Respiratory System|Mechanics of Breathing|Alveolar Ventilation and Gas Exchange in Lungs|Pulmonary Circulation and Ventilation-Perfusion Ratio|Transport of Gases in Blood|Regulation of Respiration|Physiological Changes at High Altitude|Hypoxia and Oxygen Therapy|Hazards of Deep Sea Diving and Effects of Increased Barometric Pressure|Respiration in Abnormal Conditions and Abnormal Respirations|Artificial Ventilation and Cardiopulmonary Resuscitation|Pulmonary Function Tests"),
  U("Section 11: Neurophysiology", "Functional Organization of Nervous System|Synaptic Transmission in Central Nervous System|Introduction to Sensory System and Physiology of Receptors|Sensory Communication to Spinal Cord|Ascending Pathways|Physiology of Pain, Itch and Temperature|Trigeminal System|Thalamus|Sensory Cortex|Sensory Abnormalities|Introduction to and Organization of Motor System|Segmental Organization of Motor System|Muscle Spindle and Golgi Tendon Organ|Spinal Reflexes|Descending Pathways|Regulation of Posture and Movement|Basal Ganglia|Cerebellum|Vestibular Apparatus|Functions of Hypothalamus|Physiology of Reticular Activating System|Electroencephalogram and Sleep|Limbic System|Physiology of Learning and Memory|Physiology of Language and Speech|Association Cortex, Cerebral Asymmetry, Lobes of the Brain, and Cortical Plasticity|Cerebrospinal Fluid"),
  U("Section 12: Special Senses", "Functional Anatomy of Eye|Image-forming Mechanism|Photoreceptor Mechanism|Visual Pathway and Visual Cortex|Visual Acuity, Visual Field, Light and Dark Adaptations, and Visual Reflexes|Color Vision|Movements of the Eye|Functional Anatomy and Functions of the Ear|Auditory Pathways|Mechanism of Hearing|Hearing Defects and Hearing Tests|Physiology of Smell|Physiology of Taste"),
  U("Section 13: Integrative Physiology", "Structure and Functions of the Skin|Regulation of Body Temperature and Acclimatization to Hot and Cold Environments|Physiology of Exercise and Sports Science|Principles of Acid-Base Homeostasis|Regulation of Volume, Composition and Osmolality of Body Fluid Compartments|Physiology of Growth and Development|Physiology of Nutrition|Physiology of Aging and Oxidative Stress, Prevention of Aging and Physiology of Yoga"),
]

/* ------------------------------ Biochemistry (Textbook of Biochemistry) ------------------------------ */
const BIOCHEM: Unit[] = [
  U("Section A: Chemical Basis of Life", "Biochemical Perspective to Medicine|Subcellular Organelles and Cell Membranes|Amino Acids: Structure and Properties|Proteins: Structure and Function|Enzymology: General Concepts and Enzyme Kinetics|Chemistry of Carbohydrates|Chemistry of Lipids"),
  U("Section B: General Metabolism", "Overview of Metabolism|Major Metabolic Pathways of Glucose|Minor Metabolic Pathways of Carbohydrates|Metabolism of Fatty Acids|Cholesterol and Lipoproteins|MCFA, PUFA, Prostaglandins and Compound Lipids|General Amino Acid Metabolism (Urea Cycle, One Carbon Metabolism)|Simple, Hydroxy and Sulfur Containing Amino Acids (Glycine, Serine, Methionine, Cysteine)|Acidic, Basic and Branched Chain Amino Acids|Aromatic Amino Acids and Amino Acidurias (Phenylalanine, Tyrosine, Tryptophan, Proline)|Citric Acid Cycle|Biological Oxidation and Electron Transport Chain|Free Radicals and Anti-Oxidants|Heme Synthesis and Breakdown|Hemoglobin (Structure, Oxygen and Carbon Dioxide, Transport, Abnormal Hemoglobins)"),
  U("Section C: Clinical and Applied Biochemistry", "Clinical Enzymology and Biomarkers|Regulation of Blood Glucose, Insulin and Diabetes Mellitus|Cardiovascular Diseases and Hyperlipidemias|Liver and Gastric Function Tests|Kidney Function Tests|Plasma Proteins|Acid-Base Balance and pH|Electrolyte and Water Balance|Body Fluids (Milk, CSF, Amniotic Fluid)|Clinical Laboratory: Screening of Metabolic Diseases; Quality Control"),
  U("Section D: Nutrition", "Fat Soluble Vitamins (A, D, E, K)|Water Soluble Vitamins (Thiamine, Riboflavin, Niacin, Pyridoxine, Pantothenic acid, Biotin, Folic acid, Vitamin B12 and Ascorbic acid)|Mineral Metabolism and Abnormalities|Energy Metabolism and Nutrition|Detoxification and Biotransformation of Xenobiotics|Environmental Pollution and Heavy Metal Poisons"),
  U("Section E: Molecular Biology", "Nucleotides: Chemistry and Metabolism|Deoxyribo Nucleic Acid (DNA): Structure and Replication|Transcription and Translation|Inheritance, Mutations and Control of Gene Expression|Recombinant DNA Technology and Gene Therapy"),
  U("Section F: Hormones", "Mechanisms of Action of Hormones|Hypothalamic and Pituitary Hormones|Steroid Hormones|Thyroid Hormones|Signal Molecules and Growth Factors"),
  U("Section G: Advanced Biochemistry", "Immunochemistry|Biochemistry of AIDS and HIV|Biochemistry of Cancer|Tissue Proteins in Health and Disease|Applications of Isotopes in Medicine|General Techniques for Separation, Purification and Quantitation|Molecular Diagnostics"),
]

/* ------------------------------ Pharmacology (KD Tripathi) ------------------------------ */
const PHARM: Unit[] = [
  U("Section 1: General Pharmacological Principles", "Introduction, Routes of Drug Administration|Pharmacokinetics: Membrane Transport, Absorption and Distribution of Drugs|Pharmacokinetics: Metabolism and Excretion of Drugs, Kinetics of Elimination|Pharmacodynamics: Mechanism of Drug Action; Receptor Pharmacology|Aspects of Pharmacotherapy; Clinical Pharmacology and Drug Development|Adverse Drug Effects"),
  U("Section 2: Drugs Acting on Autonomic Nervous System", "Autonomic Nervous System: General Considerations|Cholinergic System and Drugs|Anticholinergic Drugs and Drugs Acting on Autonomic Ganglia|Adrenergic System and Drugs|Antiadrenergic Drugs (Adrenergic Receptor Antagonists) and Drugs for Glaucoma"),
  U("Section 3: Autacoids and Related Drugs", "Histamine and Antihistaminics|5-Hydroxytryptamine, its Antagonists and Drug Therapy of Migraine|Prostaglandins, Leukotrienes (Eicosanoids) and Platelet Activating Factor|Nonsteroidal Antiinflammatory Drugs and Antipyretic-Analgesics|Antirheumatoid and Antigout Drugs"),
  U("Section 4: Respiratory System Drugs", "Drugs for Cough and Bronchial Asthma"),
  U("Section 5: Hormones and Related Drugs", "Anterior Pituitary Hormones|Thyroid Hormone and Thyroid Inhibitors|Insulin, Oral Hypoglycaemic Drugs and Glucagon|Corticosteroids|Androgens and Drugs for Erectile Dysfunction|Estrogens, Progestins and Contraceptives|Oxytocin and Other Drugs Acting on Uterus|Drugs Affecting Calcium Balance"),
  U("Section 6: Drugs Acting on Peripheral (Somatic) Nervous System", "Skeletal Muscle Relaxants|Local Anaesthetics"),
  U("Section 7: Drugs Acting on Central Nervous System", "General Anaesthetics|Ethyl and Methyl Alcohols|Sedative-Hypnotics|Antiepileptic Drugs|Antiparkinsonian Drugs|Drugs Used in Mental Illness: Antipsychotic and Antimanic Drugs|Drugs Used in Mental Illness: Antidepressant and Antianxiety Drugs|Opioid Analgesics and Antagonists|CNS Stimulants and Cognition Enhancers"),
  U("Section 8: Cardiovascular Drugs", "Drugs Affecting Renin-Angiotensin System and Plasma Kinins|Cardiac Glycosides and Drugs for Heart Failure|Antiarrhythmic Drugs|Antianginal and Other Anti-ischaemic Drugs|Antihypertensive Drugs"),
  U("Section 9: Drugs Acting on Kidney", "Diuretics|Antidiuretics"),
  U("Section 10: Drugs Affecting Blood and Blood Formation", "Haematinics and Erythropoietin|Drugs Affecting Coagulation, Bleeding and Thrombosis|Hypolipidaemic Drugs and Plasma Expanders"),
  U("Section 11: Gastrointestinal Drugs", "Drugs for Peptic Ulcer|Drugs for Emesis, Reflux and Digestive Disorders|Drugs for Constipation and Diarrhoea"),
  U("Section 12: Antimicrobial Drugs", "Antimicrobial Drugs: General Considerations|Sulfonamides, Cotrimoxazole and Quinolones|Beta-Lactam Antibiotics|Tetracyclines and Chloramphenicol (Broad-Spectrum Antibiotics)|Aminoglycoside Antibiotics|Macrolide, Lincosamide, Glycopeptide and Other Antibacterial Antibiotics; Urinary Antiseptics|Antitubercular Drugs|Antileprotic Drugs|Antifungal Drugs|Antiviral Drugs|Antimalarial Drugs|Antiamoebic and Other Antiprotozoal Drugs|Anthelmintic Drugs"),
  U("Section 13: Chemotherapy of Neoplastic Diseases", "Anticancer Drugs"),
  U("Section 14: Miscellaneous Drugs", "Immunosuppressants, Gene Therapy|Drugs Acting on Skin and Mucous Membranes|Antiseptics, Disinfectants and Ectoparasiticides|Chelating Agents|Vitamins|Vaccines and Sera|Drug Interactions"),
]

/* ------------------------------ Pathology (Textbook of Pathology) ------------------------------ */
const PATH: Unit[] = [
  U("Section I: General Pathology and Basic Techniques", "Introduction to Pathology|Techniques for the Study of Pathology|Cell Injury and Cellular Adaptations|Immunopathology Including Amyloidosis|Derangements of Homeostasis and Haemodynamics|Inflammation and Healing|Infectious and Parasitic Diseases|Neoplasia|Environmental and Nutritional Diseases|Genetic and Paediatric Diseases|Basic Diagnostic Cytology"),
  U("Section II: Haematology and Lymphoreticular Tissues", "Introduction to Haematopoietic System and Disorders of Erythroid Series|Disorders of Platelets, Bleeding Disorders and Basic Transfusion Medicine|Disorders of Leucocytes and Lymphoreticular Tissues"),
  U("Section III: Systemic Pathology", "The Blood Vessels and Lymphatics|The Heart|The Respiratory System|The Eye, ENT and Neck|The Oral Cavity and Salivary Glands|The Gastrointestinal Tract|The Liver, Biliary Tract and Exocrine Pancreas|The Kidney and Lower Urinary Tract|The Male Reproductive System and Prostate|The Female Genital Tract|The Breast|The Skin|The Endocrine System|The Musculoskeletal System|Soft Tissue Tumours|The Nervous System"),
  U("Appendix", "Normal Values"),
]

/* ------------------------------ Microbiology (Apurba Sastry) ------------------------------ */
const MICRO: Unit[] = [
  U("Part I, Section 1: General Microbiology", "Introduction and History|Microscopy|General Bacteriology|Bacterial Taxonomy|Morphology and Physiology of Bacteria|Laboratory Diagnosis of Bacterial Infections|Bacterial Genetics|Antimicrobial Agents and Antimicrobial Resistance|Pathogenesis of Bacterial Infections|Overview of Bacterial Infections|General Virology and Overview of Viral Infections|General Parasitology and Overview of Parasitic Infections|General Mycology and Overview of Fungal Infections|Normal Human Microbiota|Epidemiology of Infectious Diseases"),
  U("Part I, Section 2: Immunology", "Immunity (Innate and Acquired)|Antigen|Antibody|Antigen-antibody Reaction|Complement|Components of Immune System: Organs, Cells and Products|Immune Responses: Cell-mediated and Antibody-mediated|Hypersensitivity|Autoimmunity|Immunodeficiency Disorders|Transplant and Cancer Immunology|Immunoprophylaxis"),
  U("Part I, Section 3: Hospital Infection Control", "Healthcare-associated Infections|Major Healthcare-associated Infection Types|Sterilization and Disinfection|Biomedical Waste Management|Needle Stick Injury|Antimicrobial Stewardship|Environmental Surveillance (Bacteriology of Water, Air and Surface)"),
  U("Part II, Section 4: Bloodstream and Cardiovascular System Infections", "Cardiovascular System Infections: Infective Endocarditis and Acute Rheumatic Fever|Bloodstream Infections|Enteric Fever (Salmonella Typhi and Salmonella Paratyphi)|Rickettsial Infections|Miscellaneous Bacterial Bloodstream Infections: Brucellosis, Leptospirosis and Borreliosis|HIV/AIDS|Viral Hemorrhagic Fever (VHF)|Malaria and Babesiosis|Visceral Leishmaniasis and Trypanosomiasis|Lymphatic Filariasis|Systemic Candidiasis and Systemic Mycoses"),
  U("Part II, Section 5: Gastrointestinal Infections", "Gastrointestinal Infective Syndromes|Food Poisoning: S. aureus, Bacillus cereus, Clostridium botulinum and Others|Gastrointestinal Infections due to Enterobacteriaceae: Diarrheagenic Escherichia coli, Shigellosis, Nontyphoidal Salmonellosis and Yersiniosis|Cholera, Halophilic Vibrio and Aeromonas Infections|Miscellaneous Bacterial Infections of Gastrointestinal System: Helicobacter, Campylobacter and Clostridioides difficile Infections|Viral Gastroenteritis: Rotaviruses and Others|Intestinal Protozoan Infections: Intestinal Amoebiasis, Giardiasis, Coccidian Parasitic Infections, Balantidiasis, Blastocystosis, and Others|Intestinal Helminthic Infections"),
  U("Part II, Section 6: Hepatobiliary System Infections", "Infective Syndromes of Hepatobiliary System and Abdomen|Viruses Causing Hepatitis: Hepatitis Viruses, Yellow Fever and Others|Parasitic Infections of Hepatobiliary System"),
  U("Part II, Section 7: Skin, Soft Tissue and Musculoskeletal System Infections", "Infective Syndromes of Skin, Soft Tissue and Musculoskeletal Systems|Staphylococcal Infections|Beta-hemolytic Streptococcal Infections|Gas Gangrene (Clostridium perfringens) and Infections due to Nonsporing Anaerobes|Leprosy (Mycobacterium leprae)|Miscellaneous Bacterial Infections of Skin and Soft Tissues: Anthrax, Actinomycosis, Nocardiosis, Nonvenereal Treponematoses and Others|Viral Exanthems and Other Cutaneous Viral Infections|Parasitic Infections of Skin, Soft Tissue and Musculoskeletal System|Fungal Infections of Skin, Soft Tissue and Musculoskeletal System"),
  U("Part II, Section 8: Respiratory Tract Infections", "Infective Syndromes of Respiratory Tract|Bacterial Pharyngitis: Streptococcus pyogenes Pharyngitis, Diphtheria and Others|Bacterial Lobar Pneumonia: Pneumococcal Pneumonia, Haemophilus influenzae Pneumonia and Others|Bacterial Atypical (Interstitial) Pneumonia: Mycoplasma, Chlamydia, Legionella and Others|Tuberculosis and Nontuberculous Mycobacteria Infections|Pertussis (Bordetella pertussis)|Infections due to Non-fermenting Gram-negative Bacilli: Pseudomonas, Acinetobacter, Burkholderia and Others|Myxovirus Infections of Respiratory Tract: Influenza, Parainfluenza, Mumps, Respiratory Syncytial Virus and Others|Coronavirus Infections Including COVID-19|Miscellaneous Viral Infections of Respiratory Tract: Rhinovirus, Adenovirus and Infectious Mononucleosis (Epstein-Barr Virus)|Parasitic and Fungal Infections of Respiratory Tract"),
  U("Part II, Section 9: Central Nervous System Infections", "Infective Syndromes of Central Nervous System|Bacterial Meningitis|Tetanus|Viral Meningitis and Myelitis: Poliomyelitis, Coxsackievirus Infections, and Others|Viral Encephalitis and Encephalopathy: Rabies, HSV Encephalitis, Arboviral Encephalitis, Nipah and Hendra, Slow Virus Disease, Prion Disease|Parasitic and Fungal Infections of Central Nervous System"),
  U("Part II, Section 10: Urogenital Tract Infections", "Infective Syndromes of Urinary Tract and Sexually-transmitted Infections|Infective Syndromes of Genital Tract"),
  U("Part II, Section 11: Miscellaneous Infective Syndromes", "Ocular and Ear Infections|Congenital Infections|Organisms with Oncogenic Potential|Zoonotic Infections: Plague, Tularaemia and Bite Wound Infections"),
  U("Annexures", "Opportunistic Infections|Transplant Infections|Emerging and Re-emerging Infections|Microbial Agents of Bioterrorism|Laboratory Acquired Infections|National Health Programmes for Communicable Diseases|Vector-borne Infections and Ectoparasite Infestations|Transfusion-transmitted Infections|AETCOM in Microbiology|Pandemic Management"),
]

/* ------------------------------ Community Medicine (Park style: chapter, then its topics) ------------------------------ */
const COMMUNITY: Unit[] = [
  U("1. Man and Medicine: Towards Health for All", ""),
  U("2. Concept of Health and Disease", ""),
  U("3. Principles of Epidemiology and Epidemiologic Methods", "Aims of Epidemiology|Epidemiological Approach|Measurement of Mortality|Rates and Ratios|Measurement of Morbidity|Epidemiologic Methods|Descriptive Epidemiology|Analytical Epidemiology|Cohort Study|Experimental Epidemiology|Association and Causation|Uses of Epidemiology|Infectious Disease Epidemiology|Disease Transmission|Immunity|Immunizing Agents|Cold Chain|Open Vial Policy|Adverse Events After Immunization|Disease Prevention and Control|Immunization Schedule|Disinfection|Investigation of an Epidemic"),
  U("4. Screening for Disease", "Concept of Screening|Uses of Screening|Criteria for Screening|Sensitivity and Specificity|Problems of the Borderline"),
  U("5. Epidemiology of Communicable Diseases", "Smallpox|Chickenpox|Measles|Rubella|Mumps|Influenza|Diphtheria|Whooping Cough|Meningococcal Meningitis|Acute Respiratory Infections|SARS|COVID-19|Tuberculosis|Poliomyelitis|Viral Hepatitis|Acute Diarrhoeal Diseases|Cholera|Typhoid Fever|Food Poisoning|Amoebiasis|Ascariasis|Hookworm Infection|Dracunculiasis|Dengue Syndrome|Malaria|Lymphatic Filariasis|Zika Virus Disease|Chikungunya Fever|Rabies|Yellow Fever|Nipah Virus Infection|Japanese Encephalitis|Kyasanur Forest Disease|Brucellosis|Leptospirosis|Plague|Human Salmonellosis|Rickettsial Zoonoses|Scrub Typhus|Murine Typhus|Tick Typhus|Q Fever|Taeniasis|Hydatid Disease|Leishmaniasis|Trachoma|Tetanus|Leprosy|Sexually Transmitted Diseases|Yaws|AIDS|Emerging and Re-emerging Infectious Diseases|Hospital Acquired Infections"),
  U("6. Epidemiology of Chronic Non-Communicable Diseases and Conditions", "Cardiovascular Diseases|Coronary Heart Disease|Hypertension|Stroke|Rheumatic Heart Disease|Cancer|Diabetes|Obesity|Blindness|Oral Diseases|Accidents and Injuries"),
  U("7. Health Programmes in India", ""),
  U("8. Demography and Family Planning", ""),
  U("9. Preventive Medicine in Obstetrics, Paediatrics and Geriatrics", ""),
  U("10. Health Care of the Community", ""),
  U("11. Nutrition and Health", ""),
  U("12. Medicine and Social Sciences", ""),
  U("13. Tribal Health in India", ""),
  U("14. Sustainable Development Goals", ""),
  U("15. Environment and Health", ""),
  U("16. Hospital Waste Management", ""),
  U("17. Disaster Management", ""),
  U("18. Occupational Health", ""),
  U("19. Genetics and Health", ""),
  U("20. Mental Health", ""),
  U("21. Health Information and Basic Medical Statistics", ""),
  U("22. Communication for Health Education", ""),
  U("23. Health Planning and Management", ""),
  U("24. Essential Medicines and Counterfeit Medicines", ""),
  U("25. International Health", ""),
]

/* ------------------------------ Forensic Medicine and Toxicology ------------------------------ */
const FMT: Unit[] = [
  U("Section 1: Forensic Medicine", "Introduction|Legal Procedure|Medical Law and Ethics|Identification|Medicolegal Autopsy|Death and its Cause|Postmortem Changes|Mechanical Injuries|Regional Injuries|Medicolegal Aspects of Wounds|Thermal Deaths|Starvation|Mechanical Asphyxia|Anesthetic and Operative Deaths|Impotence and Sterility|Virginity, Pregnancy and Delivery|Abortion|Sexual Offences|Infant Deaths|Blood Stains|Artefacts|Forensic Science Laboratory|Forensic Psychiatry"),
  U("Section 2: Toxicology", "General Considerations|Agricultural Poisons|Corrosive Poisons|Metallic Poisons|Inorganic Irritant Poisons|Inebriant Poisons|Asphyxiants|Pharmaceutical Toxicology|Biotoxicology|Sociomedical Toxicology|Environmental Toxicology|Miscellaneous Poisons"),
]

/* ------------------------------ Medicine (Boloor, Exam Preparatory Manual) ------------------------------ */
const MEDICINE: Unit[] = [
  U("1. Nutrition and Environmental Medicine", "Vitamin A|Vitamin B Complex|Vitamin C|Vitamin D|Trace Elements|Fluorosis|Enteral and Parenteral Nutrition Support|Protein-Energy Malnutrition|Obesity|Environmental Diseases|Radiation Exposure|Illness at High Altitude|Heatstroke|Drowning (Submersion Injuries)"),
  U("2. Endocrinology", "Disorders of Pituitary and Hypothalamus|Acromegaly|Diabetes Insipidus|Thyroid Disorders|Thyrotoxicosis|Hypothyroidism|Thyroiditis|Parathyroid Disorders|Hypercalcemia|Adrenal Gland Disorders|Pheochromocytoma|Gonadal Disorders"),
  U("3. Diabetes Mellitus", "Definition and Classification|Pathogenesis|Clinical Features of Diabetes Mellitus|Diagnosis of Diabetes Mellitus|Management of Diabetes Mellitus|Oral Hypoglycemic (Glucose-Lowering) Drugs|Insulin Therapy|Diabetic Ketoacidosis|Hyperglycemic Hyperosmolar State|Hypoglycemia|Chronic Complications of Diabetes|Metabolic Syndrome"),
  U("4. Infectious Diseases", "Pyrexia (Fever) of Unknown Origin|Streptococcal Infections|Pneumococcal Infections|Tetanus|Enteric Fever|Food Poisoning|Amebiasis|Cholera|Leprosy|Leptospirosis|Rickettsial Diseases|Viral Infections|Herpes Virus Infections|Dengue|Rabies|Fungal Infections|Opportunistic Mycoses|Malaria|Leishmaniasis|Cestodes (Tapeworms)|Filariasis|Ectoparasites|Gonorrhea|Chlamydial Infections|Granuloma Inguinale (Donovanosis)|Syphilis|Nosocomial Infections (Hospital Infections)|Sepsis|Anti-infective Therapy"),
  U("5. HIV Infection and AIDS", "Etiology|Pathogenesis of HIV Infection and AIDS|Natural History of HIV Infection|Important Infections and Presenting Problems in AIDS|Cancers in HIV|Diagnosis of HIV Infection or AIDS|Management of a Patient with HIV Infection|Postexposure Care of a Healthcare Worker"),
  U("6. Respiratory System", "Introduction, Basic Approach, Symptomatology and Investigations|Bronchial Asthma|Chronic Obstructive Pulmonary Disease|Pulmonary Tuberculosis|Antituberculous Drugs|Extrapulmonary Tuberculosis|Bronchiectasis|Lung Abscess|Pleural Effusion|Pneumothorax|Pneumonia|Diffuse Parenchymal Lung Disease/Interstitial Lung Disease|Occupational Lung Diseases|Lung Cancer (Bronchial Carcinoma)|Mediastinum|Respiratory Failure|Sleep Apnea/Hypopnea Syndrome|Acute Respiratory Distress Syndrome|Sarcoidosis|Hemoptysis|Dyspnea|Pulmonary Eosinophilic Syndromes"),
  U("7. Cardiology", "Introduction and Symptomatology|Arterial Pulse|Jugular Venous Pressure|Apical Impulse|Heart Sounds|Murmurs|Conduction System of the Heart|Electrocardiogram|Ischemic Heart Disease|Acute Coronary Syndrome|Hypertension|Rheumatic Heart Disease|Mitral Stenosis|Mitral Regurgitation|Aortic Stenosis|Aortic Regurgitation|Infective Endocarditis|Heart Failure|Cardiac Arrhythmias|Diseases of the Myocardium|Congenital Heart Diseases|Diseases of the Pericardium|Pulmonary Hypertension|Sudden Cardiac Death|Cardiac Arrest|Cor Pulmonale|Diseases of Vessels|Raynaud's Phenomenon and Raynaud's Disease|Circulatory Failure: Shock|Pulmonary Embolism and Venous Thrombosis|Disorders of Blood Lipids and Lipoproteins|Valsalva Maneuver"),
  U("8. Hematology", "Anemia|Iron Deficiency Anemia|Macrocytic Anemia|Hemolytic Anemias|Sickle Cell Disease|Hereditary Spherocytosis|Thalassemia Syndrome|Glucose-6-Phosphate Dehydrogenase Deficiency|Miscellaneous Anemias|Non-neoplastic Disorders of WBC|Acute Leukemias|Chronic Myeloid Leukemia|Chronic Lymphocytic Leukemia|Myeloproliferative Neoplasms|Plasma Cell Neoplasms|Hodgkin Lymphoma|Non-Hodgkin Lymphoma|Immune Thrombocytopenic Purpura|Thrombocytosis|Hemophilia|von Willebrand's Disease|Microangiopathic Hemolytic States and Thrombocytopenias|Disseminated Intravascular Coagulation|Transfusion Medicine|Hematopoietic Stem Cell Transplantation|Drugs Used in Hematological Diseases|Spleen|Disorders of Heme Synthesis: The Porphyrias"),
  U("9. Rheumatology and Connective Tissue Disorders", "Rheumatoid Arthritis|Systemic Lupus Erythematosus|Spondyloarthropathies (Spondyloarthritides)|Vasculitis|Osteoarthritis|Systemic Sclerosis (Scleroderma)|Sjögren's Syndrome|Crystal Arthropathies|Osteoporosis|Antiphospholipid Antibody Syndrome|Inflammatory Muscle Diseases"),
  U("10. Gastroenterology", "Symptomatology and Evaluation of Gastrointestinal Disease|Gastrointestinal Bleeding|Approach to Diarrhea|Diseases of the Esophagus|Gastroesophageal Reflux Disease|Diseases of the Stomach and Duodenum|Peptic Ulcer Disease|Malabsorption Syndrome|Irritable Bowel Syndrome|Inflammatory Bowel Disease|Probiotics and Prebiotics"),
  U("11. Hepatobiliary System", "Liver Function Tests|Diagnostic Procedures|Jaundice|Congenital Nonhemolytic Hyperbilirubinemias|Viral Hepatitis|Chronic Hepatitis|Acute Liver Failure|Fatty Liver|Non-alcoholic Fatty Liver Disease|Alcoholic Liver Disease|Cirrhosis|Portal Hypertension|Hepatic Encephalopathy|Ascites|Drug and Toxin-induced Hepatitis|Hepatic Venous Outflow Tract Obstruction|Hepatocellular Carcinoma|Liver Transplantation|Liver Abscess|Metabolic Liver Disease|Biliary Cirrhosis|Noncirrhotic Portal Fibrosis"),
  U("12. Pancreas", "Acute Pancreatitis|Chronic Pancreatitis|Pancreatic Cancer|Endocrine Tumors of Pancreas"),
  U("13. Kidney", "Functional Anatomy of Kidney|Approach to Renal Diseases|Acute Kidney Injury (Acute Renal Failure)|Glomerulonephritis|Nephrotic Syndrome|Tubulointerstitial Diseases|Renal Tubular Acidosis|Chronic Kidney Disease|Cystic Diseases of Kidney|Obstructive Uropathy|Nephrolithiasis|Urinary Tract Infections|Acute Pyelonephritis|Chronic Pyelonephritis|Tuberculosis of the Urinary Tract|Renal Replacement Therapies|Renal Transplantation"),
  U("14. Fluid and Electrolyte Disturbances", "Volume Depletion (Hypovolemia)|Disorders of Sodium Balance|Disorders of Potassium Balance|Acid-Base Balance|Edema"),
  U("15. Neurology", "Weakness and Paralysis|Vertigo|Abnormal Speech and Language|Apraxia|Agnosia|Dysarthrias|Headache|Stroke and Cerebrovascular Disease|Cerebral Venous Thrombosis|Demyelinating Diseases|Multiple Sclerosis|Seizures and Epilepsy|Meningitis|Encephalitis|Diseases of the Spinal Cord|Motor Neuron Diseases|Neurogenic Bladder|Diseases of the Peripheral Nervous System|Guillain-Barré Syndrome|Myasthenia Gravis|Diseases of Muscle|Disorders of Cerebellar Function|Parkinson's Disease|Chorea|Tremor|Coma|Brain Death|Diseases of Cranial Nerves|Bell's Palsy|Intracranial Pressure|Tumors of the Nervous System|Miscellaneous|Lathyrism"),
  U("16. Toxicology", "Clinical Assessment of Ingested Poison|Organophosphate and Carbamate Poisoning|Organochlorine Poisoning|Snakebite|Scorpion Bite|Sedative Drug Poisoning|Analgesic Poisoning|Cyanide Poisoning|Neurotoxic Plant Poisons|Cardiotoxic Plant Poisons|Gastrointestinal Toxic Plant Poisons|Opioid Poisoning|Aluminium Phosphide Poisoning|Rodenticide Poisoning"),
  U("17. Oncology", "Hallmarks of Cancer|Cancer Treatment|Oncologic Emergencies|Investigations in Oncology|Paraneoplastic Syndromes|Positron Emission Tomography|Oncogenic Viruses"),
  U("18. Psychiatry", "Psycho Pharmacology|Electroconvulsive Therapy|Mood Disorders|Psychotic Disorders|Schizophrenia|Anxiety Disorders|Obsessive-Compulsive Disorder|Somatoform Disorders|Psychosomatic Disorder|Conversion Disorder|Factitious Disorder|Impulse Disorders|Delirium|Alcohol Misuse and Dependence|Substance-Related Disorders|Sleep Disorders|Eating Disorders|Puerperal Disorders|Nipah Virus Encephalitis"),
  U("19. Genetics", "Common Genetic and Chromosomal Disorders|Down Syndrome (Trisomy 21)|Klinefelter's Syndrome|Turner's Syndrome|Mental Retardation/Insufficiency|Inheritance|Gene Therapy|Human Genome Project|Polymerase Chain Reaction and its Applications"),
  U("20. Immunology", "Cytokines|Complement System|Immunodeficiency|Hypersensitivity Reactions|Autoimmunity|Transplantation Immunology|Immunomodulators|Adult Immunization|Amyloidosis"),
  U("21. Geriatrics", "Biology of Aging|Comprehensive Geriatric Assessment|Common Clinical Problems of Aging|Alzheimer's Disease"),
  U("22. Dermatology", "Psoriasis|Lichen Planus|Acanthosis Nigricans|Eczema|Blistering (Bullous) Disorders of Skin|Reactive Disorders of Skin|Pigmentary Disorders of Skin|Skin Tumors|Phakomatoses|Disorders of Skin Appendages|Hair Disorders|Leg Ulcers|Xerostomia|Pruritus|Panniculitis"),
  U("23. Clinical Pharmacology", "Adverse Drug Reaction|Drug Interaction|Drugs Used in Liver Disorder|Drugs Use in Kidney Disorders|Drugs Use in Pregnancy|Clinical Trials Basic Concepts"),
  U("24. Emergencies in Medical Practice", "Management of Severe Hyperkalemia|Metabolic Acidosis|Hypoglycemia|Management of Acute Pulmonary Edema|Management of Severe Hypercalcemia|Tension Pneumothorax|Myxedema Coma|Thyrotoxic Crisis/Thyroid Storm|Acute Adrenal Insufficiency|Management of Status Epilepticus|Management of Coma|Management of Snake Bite|Management of Hypovolemia|Management of Shock|Ischemic Stroke|Hyperventilation|Acute Pulmonary Embolism|Management of Hemoptysis|Hypertensive Emergency/Crisis|Severe Dehydration|Management of Cardiac Arrest|Management of Ventricular Fibrillation|Upper Gastrointestinal Bleed|Emergency Management of Acute Myocardial Infarction|Organophosphate Poisoning|Management of Anaphylaxis|Management of Angina|Management of Acute Severe Asthma|Management of Diabetic Ketoacidosis"),
]

/* ------------------------------ Surgery (Manipal Manual of Surgery) ------------------------------ */
const SURGERY: Unit[] = [
  U("Section I: Basic Principles of Surgery", "Doctor–Patient Relationship|Communication and Counselling|Ethics in General Surgery|Surgical Audit|Principles and Steps of Clinical Research in General Surgery|Perioperative Care|Pain Management|Biohazard Disposal/Biomedical Waste Management|Investigation and Interpretation|Asepsis, Sterilization and Disinfection|Nutrition in Surgical Patients|Prophylactic and Therapeutic Antibiotics in Surgery|Day Case/Care Surgery|Principles of Safe General Surgery|Metabolic Response to Injury|Postoperative Complications|Shock and Haemorrhage|Blood Transfusion|Acid-Base Balance|Fluids and Electrolytes"),
  U("Section II: General Surgery", "Wound, Keloid and Hypertrophic Scar|Acute Infections and Surgical Site Infections; Transmissible Viral Infections|Tetanus and Gas Gangrene|Hand and Foot Infections|Chronic Infectious Disease and Tendon Transfer|Differential Diagnosis of Leg Ulcer and Pressure Sore|Lower Limb Ischaemia and Popliteal Aneurysm|Upper Limb Ischaemia and Gangrene|Lymphatics, Lymphoedema, Tuberculous Lymphadenitis and Lymphoma|Varicose Veins and Deep Vein Thrombosis|Skin Tumours|Burns and Skin Grafting|Tumours and Soft Tissue Sarcoma|Cystic Swellings, Neck Swellings and Metastatic Lymph Node Neck|Oral Cavity, Odontomes, Lip and Palate|Salivary Glands|Thyroid Gland|Parathyroid and Adrenals|Breast"),
  U("Section III: Urology", "Investigations of the Urinary Tract|Congenital Anomalies of the Genitourinary Tract|Kidney and Ureter|Urinary Bladder and Urethra|Prostate and Seminal Vesicles|Penis, Testis and Scrotum|Haematuria and Urinary Tract Infections"),
  U("Section IV: Specialities", "Chest Trauma and Cardiothoracic Surgery|Neurosurgery|Principles of Anaesthesiology|Organ Transplantation|Principles of Clinical Radiation Oncology and Chemotherapy"),
  U("Section V: Gastrointestinal Surgery", "Oesophagus and Diaphragm|Stomach and Duodenum|Gallbladder and Pancreas|Liver|Spleen|Peritoneum, Peritoneal Cavity, Mesentery and Retroperitoneum|Small Intestine|Large Intestine (Colon)|Intestinal Obstruction|Rectum and Anal Canal|Lower Gastrointestinal Bleeding|Appendix|Hernia|Umbilicus, Wound Dehiscence and Abdominal Wall Swellings|Trauma—Initial Management, Blunt Abdominal Trauma, War and Blast Injuries and Triage"),
  U("Section VI: Viva Voce Examination", "Principles of Radiology and Imaging|Instruments, Sutures, Needles, Skin and Anastomosis|Specimens|Operative Surgery, Laparoscopic Surgery and Accessories"),
]

/* ------------------------------ Obstetrics and Gynaecology (DC Dutta) ------------------------------ */
const OBG: Unit[] = [
  U("Obstetrics", "Anatomy of Female Reproductive Organs|Fundamentals of Reproduction|Placenta and Fetal Membranes|The Fetus|Physiological Changes During Pregnancy|Endocrinology in Relation to Reproduction|Diagnosis of Pregnancy|The Fetus-in-Utero|Fetal Skull and Maternal Pelvis|Antenatal Care, Preconceptional Counseling and Care|Antenatal Assessment of Fetal Wellbeing|Prenatal Genetic Counseling, Screening and Diagnosis|Normal Labor: Intrapartum Care for a Positive Child Birth Experience|Normal Puerperium|Nausea and Vomiting in Pregnancy|Hemorrhage in Early Pregnancy|Multiple Pregnancy, Amniotic Fluid Disorders, Abnormalities of Placenta and Cord|Hypertensive Disorders in Pregnancy|Antepartum Hemorrhage|Medical and Surgical Illnesses Complicating Pregnancy|Gynecological Disorders in Pregnancy|Preterm Labor and Birth, Preterm Rupture of the Membranes, Prolonged Pregnancy, Intrauterine Fetal Death|Complicated Pregnancy|Contracted Pelvis|Abnormal Uterine Action|Complicated Labor: Malposition, Malpresentation and Cord Prolapse|Prolonged Labor, Obstructed Labor, Dystocia Caused by Fetal Anomalies|Complications of the Third Stage of Labor|Injuries to the Birth Canal|Abnormalities of the Puerperium|The Term Newborn Infant|Low Birth Weight Baby|Diseases of the Fetus and the Newborn|Pharmacotherapeutics in Obstetrics|Induction of Labor|Population Dynamics and Control of Conception|Operative Obstetrics|Safe Motherhood, Epidemiology of Obstetrics|Special Topics in Obstetrics|Current Topics in Obstetrics|Imaging in Obstetrics (USG, MRI, CT, Radiology), Amniocentesis and Guides to Clinical Tests|Practical Obstetrics"),
  U("Gynaecology", "Anatomy of the Female Pelvic Organs|Blood Vessels, Lymphatic Drainage and Innervation of Pelvic Organs|Development of Genital Organs and Gonads|Congenital Malformation of Female Genital Organs|Puberty—Normal and Abnormal|Menopause and Care of Mature Women|Neuroendocrinology in Relation to Reproduction|Menstruation|Examination of a Gynecological Patient and the Diagnostic Procedures|Imaging Techniques, Other Diagnostic Procedures and Laser in Gynecology|Pelvic Infection|Sexually Transmitted Infections|Infections of the Individual Pelvic Organ|Dysmenorrhea and Other Disorders of Menstrual Cycles|Abnormal Uterine Bleeding|Pelvic Organ Prolapse and Other Displacements of the Uterus|Infertility|Benign Lesions of the Vulva and Vagina|Benign Lesions of the Cervix|Benign Lesions of the Uterus|Benign Neoplasms of the Ovary|Endometriosis and Adenomyosis|Premalignant Lesions|Genital Malignancy|Urinary Problems in Gynecology|Genitourinary Fistula|Genital Tract Injuries and Anorectal Dysfunctions|Disorders of Sexual Development|Amenorrhea|Basic Principles of Radiation Therapy, Chemotherapy, Immunotherapy and Gene Therapy in Gynecology|Hormones in Gynecological Practice|Gynecological Problems from Birth to Adolescence|Special Topics|Operative Gynecology|Endoscopic Surgery in Gynecology|Current Topics in Gynecology|Practical Gynecology"),
]

/* ------------------------------ Single-book subjects ------------------------------ */
const PAEDS: Unit[] = [U("", "Introduction to Pediatrics|Normal Growth and Its Disorders|Development|Adolescent Health and Development|Fluid and Electrolyte Disturbances|Nutrition|Micronutrients in Health and Disease|Newborn Infants|Immunization and Immunodeficiency|Infections and Infestations|Diseases of Gastrointestinal System and Liver|Hematological Disorders|Otolaryngology|Disorders of Respiratory System|Disorders of Cardiovascular System|Disorders of Kidney and Urinary Tract|Endocrine and Metabolic Disorders|Central Nervous System|Neuromuscular Disorders|Childhood Malignancies|Rheumatological Disorders|Genetic Disorders|Inborn Errors of Metabolism|Eye Disorders|Skin Disorders|Poisonings, Injuries and Accidents|Pediatric Critical Care|Common Medical Procedures|Rational Drug Therapy|Integrated Management of Neonatal and Childhood Illness|Rights of Children")]

const ORTHO: Unit[] = [U("", "Orthopaedic Trauma: Introduction|Anatomy of Bone and Fracture Healing|Treatment of Fractures: General Principles|Splints and Tractions|Recent Advances in the Treatment of Fractures|Approach to a Patient with Limb Injury|Complications of Fractures|Injury to Joints: Dislocation and Subluxation|Fractures in Children|Peripheral Nerve Injuries|Deformities and Their Management|Treatment of Orthopaedic Disorders: A General Review|Injuries Around the Shoulder, Fracture Humerus|Injuries Around the Elbow|Injuries of the Forearm and Wrist|Hand Injuries|Pelvic Fractures|Injuries Around the Hip|Fracture Shaft of Femur|Injuries Around the Knee|Injuries to the Leg, Ankle and Foot|Infections of Bones and Joints|Tuberculosis of Bones and Joints|Infections of the Hand|Congenital Talipes Equino Varus (CTEV)|Congenital Dislocation of the Hip and Other Malformations|Poliomyelitis and Other Neuromuscular Disorders|Bone Tumours|Prolapsed Intervertebral Disc|Approach to a Patient with Back Pain|Spinal Injuries|Traumatic Paraplegia|Scoliosis and Other Spinal Deformities|Arthritis and Related Diseases|Degenerative Disorders|Affections of the Soft Tissues|Metabolic Bone Diseases|Miscellaneous Affections of the Bone|Miscellaneous Regional Diseases|Amputations, Prosthetics and Orthotics|Arthroscopic Surgery|Joint Replacement Surgery|Clinical Methods|Orthopaedic Terminology|Orthopaedic Instruments and Implants")]

const PSYCH: Unit[] = [U("", "Introduction to Psychiatry|Psychopathology|Schizophrenia and Other Psychotic Disorders|Depressive Disorders|Bipolar Disorder|Stress, Trauma and Related Disorders|Anxiety and Related Disorders|Obsessive Compulsive Disorder|Somatization Disorders|Neurocognitive Disorders|Eating Disorders|Sex, Gender and Related Disorders|Sleep and Related Disorders|Personality and Related Disorders|Substance Use and Related Addictive Disorders|Child and Adolescent Psychiatry|Emergency Psychiatry and Somatic Treatments in Psychiatry|Psychopharmacology|Psychology|Psychological Therapies and Assessments|Public Health, Legal and Other Related Topics")]

const DERM: Unit[] = [U("", "Basics in Dermatology: Part 1|Basics in Dermatology: Part 2|Papulosquamous Diseases: Part 1|Papulosquamous Diseases: Part 2|Appendages and Disorders: Part 1|Appendages and Disorders: Part 2|Bullous Disorders: Part 1|Bullous Disorders: Part 2|Bacterial Infections of Skin|Mycobacterial Infections of Skin|Viral Infections of Skin|Fungal Infections of Skin|Parasitic Infections of Skin|Sexually Transmitted Infections: Part 1|Sexually Transmitted Infections: Part 2|Hansen's Disease: Part 1|Hansen's Disease: Part 2|Pigmentary Diseases|Eczema|Genodermatoses|Histamine Related Disorders|Cutaneous Drug Reactions|Skin in Rheumatology and Immunology|Skin and Systems|Short Topics in Dermatology")]

const ENT: Unit[] = [
  U("Section I: Diseases of Ear", "Anatomy of Ear|Peripheral Receptors and Physiology of Auditory and Vestibular Systems|Audiology and Acoustics|Assessment of Hearing|Hearing Loss|Assessment of Vestibular Functions|Disorders of Vestibular System|Diseases of External Ear|Eustachian Tube and Its Disorders|Disorders of Middle Ear|Cholesteatoma and Chronic Otitis Media|Complications of Suppurative Otitis Media|Otosclerosis|Facial Nerve and Its Disorders|Ménière's Disease|Tumours of External Ear|Tumours of Middle Ear and Mastoid|Acoustic Neuroma|The Deaf Child|Rehabilitation of the Hearing Impaired|Otalgia (Earache)|Tinnitus"),
  U("Section II: Diseases of Nose and Paranasal Sinuses", "Anatomy of Nose|Physiology of Nose|Diseases of External Nose and Nasal Vestibule|Nasal Septum and Its Diseases|Acute and Chronic Rhinitis|Granulomatous Diseases of Nose|Miscellaneous Disorders of Nasal Cavity|Allergic Rhinitis|Vasomotor and Other Forms of Nonallergic Rhinitis|Nasal Polypi|Epistaxis|Trauma to the Face|Anatomy and Physiology of Paranasal Sinuses|Acute Rhinosinusitis|Chronic Rhinosinusitis|Complications of Sinusitis|Benign and Malignant Neoplasms of Nasal Cavity|Neoplasms of Paranasal Sinuses|Proptosis"),
  U("Section III: Diseases of Oral Cavity and Salivary Glands", "Anatomy of Oral Cavity|Common Disorders of Oral Cavity|Tumours of Oral Cavity|Non-neoplastic Disorders of Salivary Glands|Neoplasms of Salivary Glands"),
  U("Section IV: Diseases of Pharynx", "Anatomy and Physiology of Pharynx|Adenoids and Other Inflammations of Nasopharynx|Tumours of Nasopharynx|Acute and Chronic Pharyngitis|Acute and Chronic Tonsillitis|Head and Neck Space Infections|Tumours of Oropharynx|Tumours of the Hypopharynx and Pharyngeal Pouch|Snoring and Sleep Apnoea"),
  U("Section V: Diseases of Larynx and Trachea", "Anatomy and Physiology of Larynx|Laryngotracheal Trauma|Acute and Chronic Inflammations of Larynx|Congenital Lesions of Larynx and Stridor|Laryngeal Paralysis|Benign Tumours of Larynx|Cancer Larynx|Voice and Speech Disorders|Tracheostomy and Other Procedures for Airway Management|Foreign Bodies of Air Passages"),
  U("Section VI: Thyroid Gland and Its Disorders", "Thyroid Gland and Its Disorders"),
  U("Section VII: Diseases of Oesophagus", "Anatomy and Physiology of Oesophagus|Disorders of Oesophagus|Dysphagia|Foreign Bodies of Food Passage"),
  U("Section VIII: Recent Advances", "Laser Surgery, Radiofrequency Surgery, Hyperbaric Oxygen Therapy and Coblation|Cryosurgery|Radiotherapy in Head and Neck Cancers|Chemotherapy for Head and Neck Cancer|HIV Infection/AIDS and ENT Manifestations"),
  U("Section IX: Clinical Methods in ENT and Neck Masses", "Clinical Methods in ENT|Neck Masses"),
  U("Section X: Operative Surgery", "Myringotomy (Tympanostomy)|Ear Surgery and Approaches|Cortical Mastoidectomy|Radical Mastoidectomy|Modified Radical Mastoidectomy|Myringoplasty|Proof Puncture (Antral Lavage)|Intranasal Inferior Meatal Antrostomy|Caldwell-Luc (Anterior Antrostomy) Operation|Submucous Resection of Nasal Septum (SMR Operation)|Septoplasty|Diagnostic Nasal Endoscopy|Endoscopic Sinus Surgery|Direct Laryngoscopy|Bronchoscopy|Oesophagoscopy|Tonsillectomy|Adenoidectomy|Some Imaging Techniques in ENT"),
  U("Appendices", "Some Memorable Nuggets for Rapid Review|Instruments"),
]

const OPHTHAL: Unit[] = [
  U("Section I: Anatomy and Physiology of Eye", "Anatomy and Development of Eye|Physiology of Eye and Vision"),
  U("Section II: Optics and Refraction", "Elementary and Physiological Optics|Errors of Refraction and Accommodation"),
  U("Section III: Diseases of Eye and Ocular Adnexa", "Diseases of Conjunctiva|Diseases of Cornea|Diseases of Sclera|Diseases of Uveal Tract|Diseases of Lens|Glaucoma|Diseases of Vitreous|Diseases of Retina|Neuro-ophthalmology|Ocular Motility and Strabismus|Disorders of Eyelids|Diseases of Lacrimal Apparatus|Diseases of Orbit|Ocular Injuries"),
  U("Section IV: Ocular Therapeutics", "Ocular Pharmacology|Lasers and Cryotherapy in Ophthalmology"),
  U("Section V: Systemic and Community Ophthalmology", "Systemic Ophthalmology|Community Ophthalmology"),
  U("Section VI: Practical Ophthalmology", "Clinical Methods in Ophthalmology|Clinical Ophthalmic Cases|Darkroom Procedures|Ophthalmic Instruments and Operative Ophthalmology"),
]

/*
 * Order matters: the first layout that fits a subject wins.
 * "exact" names must equal the subject's name (letters and numbers only, any case); "contains" names may sit inside it.
 */
export const LAYOUTS: Layout[] = [
  { book: "Park's Textbook of Preventive and Social Medicine", exact: ["psm", "spm", "communitymedicine", "preventiveandsocialmedicine"], contains: ["community", "preventive"], units: COMMUNITY },
  { book: "Forensic Medicine and Toxicology", exact: ["fmt", "fm", "forensic", "forensicmedicine"], contains: ["forensic", "toxicolog"], units: FMT },
  { book: "Vishram Singh, BD Chaurasia and Sangeeta", contains: ["anatom"], units: ANATOMY },
  { book: "G.K. Pal Comprehensive Textbook of Medical Physiology", contains: ["physiolog"], units: PHYSIOLOGY },
  { book: "Textbook of Biochemistry", contains: ["biochem"], units: BIOCHEM },
  { book: "KD Tripathi Essentials of Medical Pharmacology", contains: ["pharmacolog"], units: PHARM },
  { book: "Textbook of Pathology", contains: ["patholog"], units: PATH },
  { book: "Apurba Sastry Essentials of Medical Microbiology", contains: ["microbio"], units: MICRO },
  { book: "Obstetrics and Gynaecology (DC Dutta)", exact: ["obg", "ob", "og", "obgyn", "obgy"], contains: ["obstetric", "gynae", "gynec"], units: OBG },
  { book: "Exam Preparatory Manual for Undergraduates: Medicine", exact: ["medicine", "generalmedicine", "internalmedicine"], units: MEDICINE },
  { book: "Manipal Manual of Surgery", exact: ["surgery", "generalsurgery"], units: SURGERY },
  { book: "OP Ghai Essential Pediatrics", contains: ["paediatric", "pediatric"], exact: ["paeds", "peds"], units: PAEDS },
  { book: "Maheshwari Essential Orthopaedics", contains: ["orthop"], units: ORTHO },
  { book: "Psychiatry (Marrow)", contains: ["psychiatr"], units: PSYCH },
  { book: "Dermatology (Marrow)", contains: ["dermat"], exact: ["dvl", "skin"], units: DERM },
  { book: "Dhingra Diseases of Ear, Nose and Throat", exact: ["ent", "earnoseandthroat", "earnosethroat", "otorhinolaryngology", "orl"], contains: ["otorhino", "earnose"], units: ENT },
  { book: "AK Khurana Comprehensive Ophthalmology", contains: ["ophthal"], exact: ["eye"], units: OPHTHAL },
]

const flat = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "")

export function layoutFor(subjectId: string, subjectName?: string): Layout | null {
  const names = [flat(subjectName || ""), flat(subjectId || "")].filter(Boolean)
  for (const l of LAYOUTS) {
    if (names.some((n) => l.exact?.includes(n) || l.contains?.some((c) => n.includes(c)))) return l
  }
  return null
}

/* ------------------------------ matching a saved chapter title to a textbook chapter ------------------------------ */

// "Chapter 12: Cardiac Output", "12. Cardiac Output", "Ch 12 - Cardiac Output" all become "Cardiac Output"
const cleanTitle = (t: string) => (t || "").replace(/^\s*(chapter|ch\.?)?\s*\d+\s*[.:)\-–—]*\s*/i, "").trim()

/** 0 to 1. Counts shared words; a name that sits wholly inside the other (2+ words) also counts as a strong match. */
export function titleScore(a: string, b: string): number {
  const A = tokens(a), B = tokens(b)
  if (!A.length || !B.length) return 0
  const sa = new Set(A), sb = new Set(B)
  let inter = 0
  sa.forEach((w) => { if (sb.has(w)) inter++ })
  if (!inter) return 0
  const jaccard = inter / (sa.size + sb.size - inter)
  const small = Math.min(sa.size, sb.size)
  const contained = inter === small && small >= 2
  let score = contained ? Math.max(jaccard, 0.8) : jaccard
  // a short note title that opens a longer textbook title ("Stroke" in "Stroke and Cerebrovascular Disease") is a good sign
  if (A.length < B.length && B.slice(0, A.length).join(" ") === A.join(" ")) score = Math.max(score, 0.75)
  return score
}

const THRESHOLD = 0.5
const unitLabel = (n: string) => n.replace(/^\s*\d+\.\s*/, "").replace(/^(part\s+[ivx]+,\s*)?section\s+[a-z0-9]+\s*:\s*/i, "")

export type Group<T> = { name: string; items: T[]; extra?: boolean }

/**
 * Puts saved chapters under their textbook units, in textbook order.
 * Chapters that match nothing go to a last group called "More chapters", sorted by title.
 */
export function groupChapters<T extends { chapterTitle?: string }>(items: T[], layout: Layout | null): Group<T>[] {
  const byTitle = (a: T, b: T) => String(a.chapterTitle || "").localeCompare(String(b.chapterTitle || ""))
  if (!layout) return [{ name: "", items: [...items].sort(byTitle) }]

  const buckets: { c: number; i: number }[][] = layout.units.map(() => [])
  const rest: T[] = []

  items.forEach((item, i) => {
    const title = cleanTitle(String(item.chapterTitle || ""))
    let best = { s: 0, u: -1, c: -1 }
    layout.units.forEach((unit, u) => {
      unit.chapters.forEach((ch, c) => {
        const s = titleScore(title, ch)
        if (s > best.s) best = { s, u, c }
      })
    })
    if (best.s >= THRESHOLD) { buckets[best.u].push({ c: best.c, i }); return }
    // some units (Community Medicine) are whole chapters with nothing listed under them
    let bestUnit = { s: 0, u: -1 }
    layout.units.forEach((unit, u) => {
      const s = unit.name ? titleScore(title, unitLabel(unit.name)) : 0
      if (s > bestUnit.s) bestUnit = { s, u }
    })
    if (bestUnit.s >= 0.6) buckets[bestUnit.u].push({ c: 9999, i })
    else rest.push(item)
  })

  const groups: Group<T>[] = []
  layout.units.forEach((unit, u) => {
    const list = buckets[u]
      .sort((a, b) => a.c - b.c || byTitle(items[a.i], items[b.i]))
      .map((x) => items[x.i])
    if (list.length) groups.push({ name: unit.name, items: list })
  })
  if (rest.length) groups.push({ name: groups.length ? "More chapters" : "", items: rest.sort(byTitle), extra: true })
  return groups
}
