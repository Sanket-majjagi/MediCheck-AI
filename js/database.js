const SYMPTOMS_LIST = [
  {name:"fever",icon:"🌡️",cat:"General"},{name:"cough",icon:"😮‍💨",cat:"Respiratory"},
  {name:"headache",icon:"🤕",cat:"Neurological"},{name:"sore throat",icon:"🤒",cat:"ENT"},
  {name:"runny nose",icon:"🤧",cat:"ENT"},{name:"body aches",icon:"💪",cat:"General"},
  {name:"fatigue",icon:"😴",cat:"General"},{name:"chills",icon:"🥶",cat:"General"},
  {name:"nausea",icon:"🤢",cat:"Digestive"},{name:"vomiting",icon:"🤮",cat:"Digestive"},
  {name:"diarrhea",icon:"💊",cat:"Digestive"},{name:"abdominal pain",icon:"🫃",cat:"Digestive"},
  {name:"chest pain",icon:"💔",cat:"Cardiac"},{name:"shortness of breath",icon:"😤",cat:"Respiratory"},
  {name:"dizziness",icon:"🌀",cat:"Neurological"},{name:"rash",icon:"🔴",cat:"Skin"},
  {name:"joint pain",icon:"🦴",cat:"Musculoskeletal"},{name:"swollen lymph nodes",icon:"🔵",cat:"Immune"},
  {name:"loss of appetite",icon:"🍽️",cat:"Digestive"},{name:"night sweats",icon:"💦",cat:"General"},
  {name:"sneezing",icon:"🤧",cat:"ENT"},{name:"eye redness",icon:"👁️",cat:"ENT"},
  {name:"ear pain",icon:"👂",cat:"ENT"},{name:"back pain",icon:"🦴",cat:"Musculoskeletal"},
  {name:"muscle weakness",icon:"💪",cat:"Neurological"},{name:"confusion",icon:"🧠",cat:"Neurological"},
  {name:"numbness",icon:"⚡",cat:"Neurological"},{name:"palpitations",icon:"❤️",cat:"Cardiac"},
  {name:"yellowing of skin",icon:"🟡",cat:"Hepatic"},{name:"dark urine",icon:"🟤",cat:"Urinary"},
  {name:"frequent urination",icon:"🚽",cat:"Urinary"},{name:"burning urination",icon:"🔥",cat:"Urinary"},
  {name:"swelling",icon:"🫧",cat:"General"},{name:"high fever",icon:"🌡️",cat:"General"},
  {name:"stiff neck",icon:"🦴",cat:"Neurological"},{name:"sensitivity to light",icon:"💡",cat:"Neurological"},
  {name:"bleeding",icon:"🩸",cat:"General"},{name:"loss of smell",icon:"👃",cat:"ENT"},
  {name:"loss of taste",icon:"👅",cat:"ENT"},{name:"itching",icon:"🖐️",cat:"Skin"}
];

const DISEASE_DB = [
  {
    id:"flu", name:"Influenza (Flu)", icon:"🤒", category:"Viral Infection",
    symptoms:["fever","cough","body aches","headache","fatigue","chills","sore throat","runny nose"],
    weights:{fever:3,cough:2,"body aches":3,headache:2,fatigue:2,chills:3,"sore throat":1,"runny nose":1},
    severity:"moderate",
    precautions:[
      {icon:"💊","text":"Take paracetamol/ibuprofen to reduce fever"},
      {icon:"💧","text":"Stay well hydrated — drink 8-10 glasses of water daily"},
      {icon:"🛏️","text":"Rest completely for 5-7 days"},
      {icon:"😷","text":"Wear a mask to prevent spreading to others"},
      {icon:"🌡️","text":"Monitor temperature every 4-6 hours"}
    ],
    doctorNote:"See a doctor if fever exceeds 103°F, breathing difficulty occurs, or symptoms worsen after 7 days.",
    emergency:false
  },
  {
    id:"covid", name:"COVID-19", icon:"🦠", category:"Viral Infection",
    symptoms:["fever","cough","fatigue","shortness of breath","loss of smell","loss of taste","body aches","headache","sore throat"],
    weights:{fever:2,cough:2,fatigue:2,"shortness of breath":3,"loss of smell":4,"loss of taste":4,"body aches":1,headache:1},
    severity:"high",
    precautions:[
      {icon:"🔴","text":"Isolate immediately — inform close contacts"},
      {icon:"🧪","text":"Get tested as soon as possible (RAT or RT-PCR)"},
      {icon:"💊","text":"Take doctor-prescribed medications only"},
      {icon:"🌡️","text":"Monitor oxygen levels (SpO2 should be > 95%)"},
      {icon:"💧","text":"Stay hydrated and rest completely"}
    ],
    doctorNote:"Seek immediate care if SpO2 drops below 94%, persistent chest pain, or confusion develops.",
    emergency:false,
    emergencyTriggers:["shortness of breath","chest pain","confusion"]
  },
  {
    id:"malaria", name:"Malaria", icon:"🦟", category:"Parasitic Infection",
    symptoms:["high fever","chills","headache","nausea","vomiting","body aches","fatigue","sweating"],
    weights:{"high fever":4,chills:4,headache:2,nausea:1,vomiting:1,"body aches":2,fatigue:2},
    severity:"high",
    precautions:[
      {icon:"🏥","text":"See a doctor immediately — blood test required"},
      {icon:"💊","text":"Take prescribed antimalarials (do NOT self-medicate)"},
      {icon:"🦟","text":"Use mosquito nets and repellent"},
      {icon:"💧","text":"Stay hydrated with ORS if vomiting"},
      {icon:"🌡️","text":"Monitor for cyclic fever patterns (every 48-72 hrs)"}
    ],
    doctorNote:"Malaria requires laboratory diagnosis. Untreated malaria can be fatal. Seek care within 24 hours.",
    emergency:false
  },
  {
    id:"dengue", name:"Dengue Fever", icon:"🦟", category:"Viral Infection",
    symptoms:["high fever","severe headache","joint pain","rash","eye redness","nausea","vomiting","fatigue"],
    weights:{"high fever":3,"severe headache":3,"joint pain":3,rash:3,"eye redness":2,nausea:1,vomiting:1},
    severity:"high",
    precautions:[
      {icon:"🏥","text":"Seek medical attention — platelet monitoring needed"},
      {icon:"💧","text":"Maintain hydration; avoid dehydration"},
      {icon:"🚫","text":"Do NOT take aspirin or ibuprofen — they worsen bleeding"},
      {icon:"💊","text":"Paracetamol only for fever"},
      {icon:"🩸","text":"Watch for bleeding gums, blood in urine — emergency signs"}
    ],
    doctorNote:"Dengue haemorrhagic fever is life-threatening. Watch for sudden severe abdominal pain, bleeding.",
    emergency:false,
    emergencyTriggers:["bleeding","severe headache","vomiting"]
  },
  {
    id:"typhoid", name:"Typhoid Fever", icon:"🦠", category:"Bacterial Infection",
    symptoms:["fever","headache","abdominal pain","loss of appetite","fatigue","diarrhea","rash","nausea"],
    weights:{fever:3,headache:2,"abdominal pain":3,"loss of appetite":2,fatigue:2,diarrhea:2,rash:1},
    severity:"high",
    precautions:[
      {icon:"🏥","text":"See a doctor — antibiotics required"},
      {icon:"💧","text":"Only drink boiled or purified water"},
      {icon:"🍽️","text":"Eat light, easily digestible foods"},
      {icon:"🤲","text":"Strict hand hygiene — wash before eating"},
      {icon:"🚫","text":"Avoid street food and raw vegetables"}
    ],
    doctorNote:"Typhoid needs antibiotic treatment. Untreated cases can lead to intestinal perforation.",
    emergency:false
  },
  {
    id:"meningitis", name:"Meningitis", icon:"🧠", category:"Neurological Emergency",
    symptoms:["severe headache","stiff neck","high fever","sensitivity to light","vomiting","confusion","rash"],
    weights:{"stiff neck":5,"sensitivity to light":4,"severe headache":3,"high fever":3,confusion:4,vomiting:1,rash:2},
    severity:"critical",
    precautions:[
      {icon:"🚨","text":"CALL 108 IMMEDIATELY — this is a medical emergency"},
      {icon:"🏥","text":"Go to emergency room without delay"},
      {icon:"💊","text":"IV antibiotics must be started within hours"},
      {icon:"🛏️","text":"Keep patient lying down in quiet, dark room"},
      {icon:"📵","text":"Do not give food or water — surgery may be needed"}
    ],
    doctorNote:"EMERGENCY: Bacterial meningitis can cause death within 24 hours. Do not wait.",
    emergency:true,
    emergencyMessage:"POSSIBLE MENINGITIS — Stiff neck + fever + headache = CALL 108 NOW"
  },
  {
    id:"heartattack", name:"Cardiac Event / Heart Attack", icon:"❤️", category:"Cardiac Emergency",
    symptoms:["chest pain","shortness of breath","palpitations","dizziness","sweating","nausea","arm pain","fatigue"],
    weights:{"chest pain":5,"shortness of breath":4,palpitations:3,dizziness:2,sweating:2,nausea:1},
    severity:"critical",
    precautions:[
      {icon:"🚨","text":"CALL 108 NOW — do not drive yourself"},
      {icon:"🛏️","text":"Sit or lie down calmly"},
      {icon:"💊","text":"Chew aspirin 325mg if not allergic and available"},
      {icon:"😮‍💨","text":"Loosen tight clothing around chest"},
      {icon:"📞","text":"Stay on phone with emergency services"}
    ],
    doctorNote:"EMERGENCY: Every minute counts in a heart attack. Immediate hospital care is mandatory.",
    emergency:true,
    emergencyMessage:"CARDIAC EMERGENCY — Chest pain + shortness of breath = CALL 108 IMMEDIATELY"
  },
  {
    id:"pneumonia", name:"Pneumonia", icon:"🫁", category:"Respiratory Infection",
    symptoms:["cough","high fever","shortness of breath","chest pain","fatigue","chills","sweating"],
    weights:{cough:3,"high fever":3,"shortness of breath":4,"chest pain":3,fatigue:2,chills:2},
    severity:"high",
    precautions:[
      {icon:"🏥","text":"See a doctor immediately — X-ray and antibiotics may be needed"},
      {icon:"😮‍💨","text":"Monitor breathing rate — normal is 12-20 breaths/min"},
      {icon:"💊","text":"Complete full antibiotic course if prescribed"},
      {icon:"💧","text":"Stay hydrated to loosen mucus"},
      {icon:"🚫","text":"Avoid smoking — it worsens inflammation"}
    ],
    doctorNote:"Seek emergency care if breathing rate > 30/min, SpO2 < 92%, or lips turn blue.",
    emergency:false,
    emergencyTriggers:["shortness of breath","chest pain"]
  },
  {
    id:"gastro", name:"Gastroenteritis", icon:"🦠", category:"Digestive Infection",
    symptoms:["nausea","vomiting","diarrhea","abdominal pain","fever","fatigue","loss of appetite"],
    weights:{nausea:2,vomiting:3,diarrhea:3,"abdominal pain":3,fever:1,fatigue:1},
    severity:"moderate",
    precautions:[
      {icon:"💧","text":"Drink ORS (oral rehydration solution) frequently"},
      {icon:"🍚","text":"Follow BRAT diet: Bananas, Rice, Applesauce, Toast"},
      {icon:"🚫","text":"Avoid dairy, spicy and fatty foods"},
      {icon:"🤲","text":"Wash hands frequently to prevent spread"},
      {icon:"💊","text":"Probiotics may help restore gut flora"}
    ],
    doctorNote:"See a doctor if vomiting > 24 hrs, blood in stool, or signs of dehydration (sunken eyes, no urination).",
    emergency:false
  },
  {
    id:"uti", name:"Urinary Tract Infection (UTI)", icon:"🚽", category:"Bacterial Infection",
    symptoms:["burning urination","frequent urination","abdominal pain","fever","dark urine","fatigue","nausea"],
    weights:{"burning urination":5,"frequent urination":4,"abdominal pain":2,fever:1,"dark urine":3,fatigue:1},
    severity:"moderate",
    precautions:[
      {icon:"🏥","text":"Consult a doctor — urine culture & antibiotics needed"},
      {icon:"💧","text":"Drink 2-3L of water daily to flush bacteria"},
      {icon:"🚫","text":"Avoid holding urine for long periods"},
      {icon:"🥒","text":"Cranberry juice may help prevent recurrence"},
      {icon:"🤲","text":"Maintain proper personal hygiene"}
    ],
    doctorNote:"UTI reaching kidneys (fever + back pain + chills) requires urgent care.",
    emergency:false
  },
  {
    id:"migraine", name:"Migraine", icon:"🤕", category:"Neurological",
    symptoms:["severe headache","nausea","vomiting","sensitivity to light","dizziness","fatigue","vision changes"],
    weights:{"severe headache":4,nausea:2,vomiting:1,"sensitivity to light":3,dizziness:2,fatigue:1},
    severity:"moderate",
    precautions:[
      {icon:"🌑","text":"Rest in a dark, quiet room"},
      {icon:"💊","text":"Take prescribed migraine medication at onset"},
      {icon:"❄️","text":"Apply cold compress to forehead or neck"},
      {icon:"💧","text":"Stay hydrated — dehydration triggers migraines"},
      {icon:"😴","text":"Maintain regular sleep schedule"}
    ],
    doctorNote:"Seek emergency care if worst headache of your life, sudden onset, or accompanied by fever + stiff neck.",
    emergency:false
  },
  {
    id:"allergy", name:"Allergic Reaction", icon:"🌸", category:"Immune Response",
    symptoms:["sneezing","runny nose","itching","rash","eye redness","swelling","cough","shortness of breath"],
    weights:{sneezing:2,"runny nose":2,itching:3,rash:3,"eye redness":2,swelling:2,cough:1,"shortness of breath":3},
    severity:"mild",
    precautions:[
      {icon:"🚫","text":"Identify and avoid the allergen"},
      {icon:"💊","text":"Take antihistamines (cetirizine/loratadine)"},
      {icon:"👁️","text":"Use saline eye drops for eye redness"},
      {icon:"🌿","text":"Avoid known triggers: pollen, dust, pet dander"},
      {icon:"🏥","text":"Carry prescribed EpiPen if severe allergy diagnosed"}
    ],
    doctorNote:"EMERGENCY if throat swelling, difficulty breathing, or rapid heartbeat — anaphylaxis requires 108 immediately.",
    emergency:false,
    emergencyTriggers:["shortness of breath","swelling"]
  },
  {
    id:"anemia", name:"Anemia", icon:"🩸", category:"Blood Disorder",
    symptoms:["fatigue","dizziness","shortness of breath","palpitations","headache","numbness","muscle weakness","pallor"],
    weights:{fatigue:3,dizziness:2,"shortness of breath":2,palpitations:2,headache:1,numbness:1,"muscle weakness":2},
    severity:"moderate",
    precautions:[
      {icon:"🥩","text":"Eat iron-rich foods: spinach, lentils, meat"},
      {icon:"🍊","text":"Take Vitamin C with iron foods for absorption"},
      {icon:"💊","text":"Iron supplements as prescribed by doctor"},
      {icon:"🚫","text":"Avoid tea/coffee with meals — blocks iron absorption"},
      {icon:"🩸","text":"Get CBC blood test to confirm type of anemia"}
    ],
    doctorNote:"See a doctor for blood tests. Severe anemia may require treatment beyond diet changes.",
    emergency:false
  },
  {
    id:"jaundice", name:"Jaundice / Hepatitis", icon:"🟡", category:"Hepatic",
    symptoms:["yellowing of skin","dark urine","fatigue","abdominal pain","nausea","loss of appetite","fever"],
    weights:{"yellowing of skin":5,"dark urine":4,fatigue:2,"abdominal pain":2,nausea:1,"loss of appetite":2},
    severity:"high",
    precautions:[
      {icon:"🏥","text":"See a doctor urgently — liver tests required"},
      {icon:"🚫","text":"Avoid all alcohol completely"},
      {icon:"💧","text":"Drink plenty of water and fresh juices"},
      {icon:"🍚","text":"Eat light, low-fat, easily digestible foods"},
      {icon:"💊","text":"No self-medication — some drugs worsen jaundice"}
    ],
    doctorNote:"Jaundice from hepatitis B or C or liver failure is a medical emergency. Urgent evaluation needed.",
    emergency:false
  },
  {
    id:"commonCold", name:"Common Cold", icon:"🤧", category:"Viral Infection",
    symptoms:["runny nose","sneezing","sore throat","cough","headache","fatigue","mild fever"],
    weights:{"runny nose":3,sneezing:3,"sore throat":2,cough:2,headache:1,fatigue:1,"mild fever":1},
    severity:"mild",
    precautions:[
      {icon:"🛏️","text":"Rest and allow your body to recover"},
      {icon:"🍵","text":"Drink warm fluids: tea with honey and ginger"},
      {icon:"💊","text":"OTC cold medication for symptom relief"},
      {icon:"💧","text":"Gargle with warm salt water for sore throat"},
      {icon:"😷","text":"Cover your mouth when coughing or sneezing"}
    ],
    doctorNote:"See a doctor if symptoms persist beyond 10 days or fever exceeds 101°F.",
    emergency:false
  },
  {
    id:"stress", name:"Stress / Anxiety Disorder", icon:"🧠", category:"Mental Health",
    symptoms:["headache","fatigue","dizziness","palpitations","shortness of breath","muscle weakness","nausea","insomnia"],
    weights:{headache:2,fatigue:2,dizziness:1,palpitations:2,"shortness of breath":2,"muscle weakness":1,nausea:1},
    severity:"moderate",
    precautions:[
      {icon:"🧘","text":"Practice deep breathing: 4 counts in, hold 4, out 4"},
      {icon:"🏃","text":"30 min of physical activity daily reduces cortisol"},
      {icon:"😴","text":"Maintain 7-9 hours of sleep every night"},
      {icon:"📵","text":"Limit screen time and social media before bed"},
      {icon:"🗣️","text":"Talk to a counselor or mental health professional"}
    ],
    doctorNote:"Chronic stress affects physical health. Consult a doctor if symptoms persist or affect daily life.",
    emergency:false
  }
];

const EMERGENCY_SYMPTOMS = ["chest pain","stiff neck","shortness of breath","confusion","bleeding","high fever","sensitivity to light"];

const PRECAUTION_ICONS = { mild:"💚", moderate:"🟡", high:"🟠", critical:"🔴" };
