// ===== DIAGNOSIS ENGINE =====
const Engine = {
  analyze(selectedSymptoms) {
    if (!selectedSymptoms || selectedSymptoms.length === 0) return { results: [], emergency: null };

    const lower = selectedSymptoms.map(s => s.toLowerCase().trim());
    const scores = [];

    for (const disease of DISEASE_DB) {
      let score = 0, matchedSymptoms = [], totalWeight = 0;

      // Calculate total possible weight
      for (const sym of disease.symptoms) {
        totalWeight += (disease.weights[sym] || 1);
      }

      // Score matched symptoms
      for (const sym of lower) {
        if (disease.symptoms.includes(sym)) {
          const w = disease.weights[sym] || 1;
          score += w;
          matchedSymptoms.push(sym);
        }
        // Partial match
        else {
          for (const dsym of disease.symptoms) {
            if (dsym.includes(sym) || sym.includes(dsym)) {
              const w = disease.weights[dsym] || 1;
              score += w * 0.5;
              if (!matchedSymptoms.includes(dsym)) matchedSymptoms.push(dsym + '*');
              break;
            }
          }
        }
      }

      if (score === 0) continue;

      const confidence = Math.min(100, Math.round((score / totalWeight) * 100));
      if (confidence < 10) continue;

      scores.push({
        disease,
        score,
        confidence,
        matchedSymptoms,
        matchCount: matchedSymptoms.length
      });
    }

    // Sort by confidence desc
    scores.sort((a, b) => b.confidence - a.confidence);
    const top = scores.slice(0, 4);

    // Emergency check — ONLY specific high-certainty combos, never single symptoms
    let emergency = null;
    const hasChestPain   = lower.includes('chest pain');
    const hasSob         = lower.includes('shortness of breath');
    const hasBleeding    = lower.includes('bleeding');
    const hasStiffNeck   = lower.includes('stiff neck');
    const hasLightSens   = lower.includes('sensitivity to light');
    const hasFever       = lower.includes('fever') || lower.includes('high fever');
    const hasHeadache    = lower.includes('headache') || lower.includes('severe headache');
    const hasConfusion   = lower.includes('confusion');

    if (hasChestPain && hasSob) {
      emergency = { message: "Chest pain combined with breathing difficulty detected. This can be a cardiac emergency — call 108 now.", disease: "Cardiac Emergency" };
    } else if (hasBleeding) {
      emergency = { message: "Severe or unexplained bleeding detected. Please call 108 or go to the nearest emergency room immediately.", disease: "Bleeding Emergency" };
    } else if (hasStiffNeck && hasFever && hasHeadache && (hasLightSens || hasConfusion)) {
      emergency = { message: "Stiff neck + fever + headache combination may indicate meningitis — a medical emergency. Call 108 now.", disease: "Possible Meningitis" };
    }

    return { results: top, emergency };
  },

  getSeverityScore(results, symptomCount = 1) {
    if (!results.length) return { score: 0, level: "none" };
    const top = results[0];
    // Score built from evidence: confidence + matched count + breadth of symptoms
    // Single fever (28% conf, 1 match, 1 symptom) → 15 + 9.8 + 10 + 4 = ~39 (LOW)
    // 4+ symptoms (60% conf, 4 matches) → 15 + 21 + 40 + 16 = ~92 (HIGH)
    let score = 15 + (top.confidence * 0.35) + (top.matchCount * 10) + (symptomCount * 4);
    score = Math.min(Math.round(score), 99);
    let level, color;
    if (score >= 75)      { level = "critical"; color = "#ef4444"; }
    else if (score >= 55) { level = "high";     color = "#f97316"; }
    else if (score >= 38) { level = "moderate"; color = "#f59e0b"; }
    else                  { level = "low";      color = "#10b981"; }
    return { score, level, color };
  },

  getUniquePrecautions(results) {
    const seen = new Set();
    const list = [];
    for (const r of results.slice(0, 2)) {
      for (const p of r.disease.precautions) {
        if (!seen.has(p.text)) { seen.add(p.text); list.push(p); }
        if (list.length >= 6) break;
      }
      if (list.length >= 6) break;
    }
    return list;
  },

  getDoctorAdvice(results) {
    if (!results.length) return "";
    const top = results[0];
    const extra = results.length > 1 ? ` Also consider monitoring for signs of ${results[1].disease.name}.` : "";
    return top.disease.doctorNote + extra;
  },

  formatConfidenceLabel(confidence) {
    if (confidence >= 70) return { label: "High Match", cls: "conf-high" };
    if (confidence >= 40) return { label: "Moderate Match", cls: "conf-med" };
    return { label: "Low Match", cls: "conf-low" };
  },

  // Returns friendly severity object for display (no numbers)
  getFriendlySeverity(results, symptomCount) {
    const sev = this.getSeverityScore(results, symptomCount);
    const map = {
      low:      { msg: "You likely just need rest and fluids",       emoji: "💙", color: "#10b981" },
      moderate: { msg: "Monitor your symptoms for the next 24 hours", emoji: "🟡", color: "#f59e0b" },
      high:     { msg: "Consider visiting a doctor today",            emoji: "🟠", color: "#f97316" },
      critical: { msg: "Please seek medical attention now",           emoji: "🔴", color: "#ef4444" }
    };
    return { ...sev, ...(map[sev.level] || map.low) };
  },

  // Returns a reassuring first-message based on symptoms entered
  getCommonCause(symptoms) {
    const lower = symptoms.map(s => s.toLowerCase());
    const hasFever   = lower.includes('fever') || lower.includes('high fever');
    const hasCough   = lower.includes('cough');
    const hasNose    = lower.includes('runny nose') || lower.includes('sneezing');
    const hasNausea  = lower.includes('nausea') || lower.includes('vomiting');
    const hasAbdomen = lower.includes('abdominal pain') || lower.includes('diarrhea');
    const hasThroat  = lower.includes('sore throat');
    const fewSymptoms = symptoms.length <= 3;

    if (fewSymptoms && hasFever && !lower.includes('chest pain') && !lower.includes('stiff neck')) {
      if (hasCough || hasNose || hasThroat)
        return "These symptoms are most commonly caused by a <strong>common cold or mild viral infection</strong>. Here's how to feel better:";
      return "Fever is usually caused by a <strong>common viral infection</strong>. Here's what to do:";
    }
    if (fewSymptoms && hasNausea && hasAbdomen)
      return "These symptoms often indicate a <strong>mild stomach infection or food sensitivity</strong>. Here's what helps:";
    if (fewSymptoms && hasCough && hasNose)
      return "These symptoms are most commonly a <strong>cold or seasonal allergy</strong>. Here's how to ease them:";
    return null;
  },

  buildVoiceScript(symptoms, results) {
    const lower = symptoms.map(s => s.toLowerCase());
    const sev   = this.getFriendlySeverity(results, symptoms.length);
    const prec  = this.getUniquePrecautions(results).slice(0, 3);
    const strip = html => html.replace(/<[^>]+>/g, '');

    // Reassurance line
    const reassurance = {
      low:      "What you're experiencing is very common, and there is no need to be alarmed.",
      moderate: "While these symptoms deserve some attention, they are manageable with the right care.",
      high:     "I understand this may feel uncomfortable, but with the right steps you will recover well.",
      critical: "Please stay calm — getting the right help quickly is the most important thing right now."
    }[sev.level] || "What you're experiencing is very common, and there is no need to be alarmed.";

    // Simple, non-scary cause
    let cause = "a common temporary condition that usually resolves with rest and basic self-care";
    if (lower.includes('fever') && lower.includes('headache') && lower.includes('body aches'))
      cause = "a common viral infection, similar to the flu, which typically clears in five to seven days";
    else if (lower.includes('fever') && (lower.includes('cough') || lower.includes('runny nose') || lower.includes('sore throat')))
      cause = "a common cold or mild viral infection, which usually passes within a week";
    else if (lower.includes('fever'))
      cause = "a common infection your body is actively fighting — which is a healthy immune response";
    else if (lower.includes('headache') && symptoms.length <= 2)
      cause = "stress, dehydration, or eye strain — all very common in students";
    else if (lower.includes('cough') || lower.includes('runny nose'))
      cause = "a common cold or seasonal allergy, which is completely normal and very treatable";
    else if (lower.includes('nausea') || lower.includes('vomiting') || lower.includes('abdominal pain'))
      cause = "a mild stomach infection or dietary sensitivity, which most people recover from within one to two days";

    // Precautions — plain English
    const p1 = prec[0] ? strip(prec[0].text) : "Get plenty of rest and allow your body to recover";
    const p2 = prec[1] ? strip(prec[1].text) : "Drink plenty of water and stay well hydrated";
    const p3 = prec[2] ? strip(prec[2].text) : "Eat light, easily digestible meals";

    // Days threshold based on severity
    const days = { low: 'two to three', moderate: 'two', high: 'one', critical: 'a few hours' }[sev.level] || 'two to three';

    // Don't add "visit doctor" close for low severity conditions
    const doctorLine = sev.level === 'low'
      ? "Most cases like yours resolve on their own with proper rest."
      : `If your symptoms continue for more than ${days} days, I would suggest visiting a doctor. Most cases like yours resolve well with timely care.`;

    return `Hello. I have looked at your symptoms carefully. ${reassurance} This is most likely ${cause}. Here is what I recommend: ${p1}. Also, ${p2}. ${p3}. ${doctorLine} But please do not worry. Take good care of yourself.`;
  }
};

// ===== VOICE ENGINE =====
const Voice = {
  recognition: null,
  isListening: false,
  supported: false,

  init(onResult, onEnd) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { this.supported = false; return; }
    this.supported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-IN';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      onResult(transcript);
    };
    this.recognition.onend = () => { this.isListening = false; onEnd(); };
    this.recognition.onerror = () => { this.isListening = false; onEnd(); };
  },

  toggle() {
    if (!this.supported) { alert("Voice input not supported in this browser. Try Chrome."); return; }
    if (this.isListening) {
      this.recognition.stop(); this.isListening = false;
    } else {
      this.recognition.start(); this.isListening = true;
    }
  },

  parseSymptoms(transcript) {
    const found = [];
    const words = transcript.toLowerCase();
    for (const s of SYMPTOMS_LIST) {
      if (words.includes(s.name)) found.push(s.name);
    }
    // Common speech patterns
    const patterns = {
      "running nose":"runny nose","running":"runny nose","temperature":"fever",
      "throwing up":"vomiting","throw up":"vomiting","stomach pain":"abdominal pain",
      "stomach ache":"abdominal pain","heart beat":"palpitations","can't breathe":"shortness of breath",
      "hard to breathe":"shortness of breath","tired":"fatigue","weak":"fatigue"
    };
    for (const [pattern, mapped] of Object.entries(patterns)) {
      if (words.includes(pattern) && !found.includes(mapped)) found.push(mapped);
    }
    return found.length > 0 ? found : [words.trim()];
  }
};

// ===== HISTORY STORAGE =====
const History = {
  key: "medicheck_history",

  save(entry) {
    const list = this.load();
    list.unshift({ ...entry, date: new Date().toISOString() });
    if (list.length > 20) list.pop();
    localStorage.setItem(this.key, JSON.stringify(list));
  },

  load() {
    try { return JSON.parse(localStorage.getItem(this.key) || "[]"); }
    catch { return []; }
  },

  formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
};
