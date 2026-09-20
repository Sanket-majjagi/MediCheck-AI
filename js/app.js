// ===== MEDICHECK AI — MAIN APP =====
const App = {
  selectedSymptoms: [],
  lastResults: null,
  theme: localStorage.getItem('mc_theme') || 'dark',

  // DOM refs
  $: (id) => document.getElementById(id),

  init() {
    document.documentElement.setAttribute('data-theme', this.theme);
    this.$('themeIcon').textContent = this.theme === 'dark' ? '☀️' : '🌙';
    this.buildSymptomChips();
    this.bindEvents();
    Voice.init(
      (transcript) => this.handleVoiceResult(transcript),
      () => this.updateVoiceUI(false)
    );
    this.addBotMessage("👋 Hi! I'm MediCheck AI. Select your symptoms or type them below, then click <strong>Analyze</strong> for instant health insights.", 0);
    this.addBotMessage("⚠️ I provide general guidance only — always consult a qualified doctor for medical advice.", 600);
  },

  // ===== BIND EVENTS =====
  bindEvents() {
    this.$('btnStart').onclick = () => this.showMain();
    this.$('btnTheme').onclick = () => this.toggleTheme();
    this.$('btnVoice').onclick = () => this.toggleVoice();
    this.$('btnAnalyze').onclick = () => this.analyze();
    this.$('btnClearAll').onclick = () => this.clearAll();
    this.$('btnNewCheck').onclick = () => this.newCheck();
    this.$('btnHistory').onclick = () => this.showHistory();
    this.$('btnCloseHistory').onclick = () => this.$('historyModal').classList.add('hidden');
    this.$('historyModal').querySelector('.modal-backdrop').onclick = () => this.$('historyModal').classList.add('hidden');
    this.$('emergencyDismiss').onclick = () => {
      this.$('emergencyOverlay').classList.add('hidden');
      if (this.lastResults) this.renderDashboard(this.lastResults);
    };
    this.$('btnPrint').onclick = () => this.printReport();
    const input = this.$('chatInput');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleInput(); });
    input.addEventListener('input', () => this.showAutocomplete(input.value));
    input.addEventListener('blur', () => setTimeout(() => this.$('autocomplete').classList.add('hidden'), 150));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.$('emergencyOverlay').classList.add('hidden');
        this.$('historyModal').classList.add('hidden');
      }
    });
  },

  // ===== NAVIGATION =====
  showMain() {
    this.$('heroSection').classList.add('hidden');
    this.$('mainSection').classList.remove('hidden');
  },

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    this.$('themeIcon').textContent = this.theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('mc_theme', this.theme);
  },

  // ===== SYMPTOM CHIPS =====
  buildSymptomChips() {
    const container = this.$('symptomChips');
    container.innerHTML = '';
    SYMPTOMS_LIST.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'symptom-chip';
      btn.textContent = `${s.icon} ${s.name}`;
      btn.dataset.symptom = s.name;
      btn.onclick = () => this.toggleSymptom(s.name, btn);
      container.appendChild(btn);
    });
  },

  toggleSymptom(name, btn) {
    if (this.selectedSymptoms.includes(name)) {
      this.selectedSymptoms = this.selectedSymptoms.filter(s => s !== name);
      btn && btn.classList.remove('selected');
    } else {
      this.selectedSymptoms.push(name);
      btn && btn.classList.add('selected');
    }
    this.updateSelectedBar();
  },

  addSymptom(name) {
    const clean = name.toLowerCase().trim();
    if (!clean || this.selectedSymptoms.includes(clean)) return;
    this.selectedSymptoms.push(clean);
    // Sync chip UI
    const chip = document.querySelector(`.symptom-chip[data-symptom="${clean}"]`);
    if (chip) chip.classList.add('selected');
    this.updateSelectedBar();
  },

  removeSymptom(name) {
    this.selectedSymptoms = this.selectedSymptoms.filter(s => s !== name);
    const chip = document.querySelector(`.symptom-chip[data-symptom="${name}"]`);
    if (chip) chip.classList.remove('selected');
    this.updateSelectedBar();
  },

  updateSelectedBar() {
    const bar = this.$('selectedBar');
    const chips = this.$('selectedChips');
    if (this.selectedSymptoms.length === 0) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    chips.innerHTML = '';
    this.selectedSymptoms.forEach(s => {
      const tag = document.createElement('div');
      tag.className = 'selected-tag';
      const sym = SYMPTOMS_LIST.find(x => x.name === s);
      tag.innerHTML = `${sym ? sym.icon : '•'} ${s} <button onclick="App.removeSymptom('${s}')">✕</button>`;
      chips.appendChild(tag);
    });
  },

  clearAll() {
    this.selectedSymptoms = [];
    document.querySelectorAll('.symptom-chip.selected').forEach(c => c.classList.remove('selected'));
    this.updateSelectedBar();
  },

  // ===== INPUT HANDLING =====
  handleInput() {
    const input = this.$('chatInput');
    const val = input.value.trim();
    if (!val) return;
    // NLP: if sentence (>2 words), try to extract known symptom keywords
    const wordCount = val.split(/\s+/).length;
    if (wordCount > 2) {
      const extracted = this.extractSymptomsFromText(val);
      if (extracted.length > 0) {
        this.addUserMessage(`"${val}"`);
        extracted.forEach(s => this.addSymptom(s));
        this.addBotMessage(`✅ Extracted: <strong>${extracted.join(', ')}</strong>`, 200);
        input.value = '';
        this.$('autocomplete').classList.add('hidden');
        return;
      }
    }
    this.addSymptom(val);
    input.value = '';
    this.$('autocomplete').classList.add('hidden');
    this.addUserMessage(`Added: ${val}`);
  },

  extractSymptomsFromText(text) {
    const lower = text.toLowerCase();
    const found = [];
    // Direct symptom name scan
    for (const s of SYMPTOMS_LIST) {
      if (lower.includes(s.name)) found.push(s.name);
    }
    // Common phrase→symptom mappings
    const phrases = {
      'temperature':'fever','high temp':'fever','hot body':'fever','feeling hot':'fever',
      'running nose':'runny nose','blocked nose':'runny nose','stuffy nose':'runny nose',
      'stomach pain':'abdominal pain','stomach ache':'abdominal pain','tummy ache':'abdominal pain',
      'throwing up':'vomiting','throw up':'vomiting','puking':'vomiting',
      "can't breathe":'shortness of breath','cant breathe':'shortness of breath',
      'hard to breathe':'shortness of breath','difficulty breathing':'shortness of breath',
      'tired':'fatigue','tiredness':'fatigue','exhausted':'fatigue','no energy':'fatigue',
      'weak':'fatigue','weakness':'muscle weakness',
      'throat pain':'sore throat','hurts to swallow':'sore throat',
      'heart racing':'palpitations','fast heartbeat':'palpitations','heart pounding':'palpitations',
      'dizzy':'dizziness','lightheaded':'dizziness','light headed':'dizziness',
      'skin rash':'rash','spots on skin':'rash',
      'yellow skin':'yellowing of skin','yellow eyes':'yellowing of skin',
      'loose motions':'diarrhea','loose stool':'diarrhea',
      'ear ache':'ear pain','back ache':'back pain'
    };
    for (const [phrase, mapped] of Object.entries(phrases)) {
      if (lower.includes(phrase) && !found.includes(mapped)) found.push(mapped);
    }
    return found;
  },

  showAutocomplete(query) {
    const ac = this.$('autocomplete');
    if (!query || query.length < 2) { ac.classList.add('hidden'); return; }
    const matches = SYMPTOMS_LIST.filter(s => s.name.includes(query.toLowerCase())).slice(0, 8);
    if (!matches.length) { ac.classList.add('hidden'); return; }
    ac.innerHTML = '';
    matches.forEach(s => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.innerHTML = `<span class="ac-icon">${s.icon}</span>${s.name}<span class="ac-cat">${s.cat}</span>`;
      div.onmousedown = () => {
        this.addSymptom(s.name);
        this.$('chatInput').value = '';
        ac.classList.add('hidden');
        this.addUserMessage(`Added: ${s.name}`);
      };
      ac.appendChild(div);
    });
    ac.classList.remove('hidden');
  },

  // ===== VOICE =====
  toggleVoice() {
    Voice.toggle();
    this.updateVoiceUI(Voice.isListening);
    if (Voice.isListening) this.addBotMessage("🎤 Listening... Speak your symptoms (e.g. 'fever and headache')", 0);
  },

  updateVoiceUI(listening) {
    const btn = this.$('btnVoice');
    const waves = this.$('voiceWaves');
    const icon = this.$('micIcon');
    if (listening) {
      btn.classList.add('listening');
      waves.classList.remove('hidden');
      icon.style.display = 'none';
    } else {
      btn.classList.remove('listening');
      waves.classList.add('hidden');
      icon.style.display = '';
    }
  },

  handleVoiceResult(transcript) {
    this.updateVoiceUI(false);
    const found = Voice.parseSymptoms(transcript);
    this.addUserMessage(`🎤 "${transcript}"`);
    found.forEach(s => this.addSymptom(s));
    const added = found.join(', ');
    this.addBotMessage(`✅ Recognized: <strong>${added}</strong>. Click <strong>Analyze</strong> when ready, or add more symptoms.`, 400);
  },

  // ===== ANALYSIS =====
  analyze() {
    if (this.selectedSymptoms.length === 0) {
      this.addBotMessage("⚠️ Please select or type at least one symptom before analyzing.", 0);
      return;
    }
    const symptoms = [...this.selectedSymptoms];
    this.addUserMessage(`🔍 Analyzing: ${symptoms.join(', ')}`);
    this.showTyping();

    setTimeout(() => {
      this.removeTyping();
      const { results, emergency } = Engine.analyze(symptoms);
      this.lastResults = { results, symptoms };

      if (results.length === 0) {
        this.addBotMessage("❓ No strong matches found. Try adding more specific symptoms or consult a doctor directly.", 0);
        return;
      }

      // Save to history
      History.save({ symptoms, topResult: results[0].disease.name, severity: results[0].disease.severity });
      this.$('btnPrint').classList.remove('hidden');

      // Show emergency overlay if needed
      if (emergency) {
        this.$('emergencyCondition').textContent = emergency.message;
        this.$('emergencyOverlay').classList.remove('hidden');
      } else {
        this.renderDashboard({ results, symptoms });
      }

      // Chat result cards
      this.renderChatResults(results, symptoms);
    }, 1800);
  },

  // ===== CHAT MESSAGES =====
  addBotMessage(html, delay = 0) {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'message message-bot';
      div.innerHTML = `<div class="msg-avatar">🏥</div><div class="msg-bubble">${html}</div>`;
      this.$('chatMessages').appendChild(div);
      this.scrollChat();
    }, delay);
  },

  addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message message-user';
    div.innerHTML = `<div class="msg-avatar">👤</div><div class="msg-bubble">${text}</div>`;
    this.$('chatMessages').appendChild(div);
    this.scrollChat();
  },

  showTyping() {
    const div = document.createElement('div');
    div.className = 'message message-bot'; div.id = 'typingMsg';
    div.innerHTML = `<div class="msg-avatar">🏥</div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    this.$('chatMessages').appendChild(div);
    this.scrollChat();
  },

  removeTyping() {
    const t = this.$('typingMsg');
    if (t) t.remove();
  },

  scrollChat() {
    const c = this.$('chatMessages');
    c.scrollTop = c.scrollHeight;
  },

  renderChatResults(results, symptoms) {
    const sev = Engine.getFriendlySeverity(results, symptoms.length);

    // Step 1: Common cause reassurance (shown FIRST)
    const commonCause = Engine.getCommonCause(symptoms);
    if (commonCause) {
      this.addBotMessage(`💬 ${commonCause}`, 0);
    } else {
      this.addBotMessage(`💬 I’ve reviewed your symptoms. Based on what you’ve described, here’s what could be happening:`, 0);
    }

    // Step 2: Friendly severity (no number) + hospital link for high severity
    setTimeout(() => {
      this.addBotMessage(`${sev.emoji} <strong>${sev.msg}</strong>`, 300);
      // Feature 5: hospital finder link for high/critical
      if (sev.level === 'high' || sev.level === 'critical') {
        setTimeout(() => HospitalFinder.injectHighSeverityLink(sev.level), 600);
      }
    }, 300);

    // Step 3: Conditions — only show serious ones if 4+ symptoms matched
    const showSerious = symptoms.length >= 4;
    const displayResults = showSerious ? results : results.filter(r =>
      ['mild','moderate'].includes(r.disease.severity) ||
      results.indexOf(r) === 0  // always show top match
    ).slice(0, 2);

    displayResults.forEach((r, i) => {
      setTimeout(() => {
        const conf = Engine.formatConfidenceLabel(r.confidence);
        const barColor = { 'conf-high':'#ef4444', 'conf-med':'#f59e0b', 'conf-low':'#10b981' }[conf.cls];
        const div = document.createElement('div');
        div.className = 'message message-bot';
        div.innerHTML = `<div class="msg-avatar">${r.disease.icon}</div>
          <div class="msg-bubble">
            <div class="result-card-chat">
              <h4>${r.disease.icon} ${r.disease.name} <span style="font-size:11px;color:var(--text3)">— possibility to rule out</span></h4>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span style="font-size:12px;color:var(--text3)">Symptom overlap</span>
                <span class="cc-conf ${conf.cls}">${conf.label}</span>
              </div>
              <div class="confidence-bar-mini"><div class="confidence-fill" style="width:${r.confidence}%;background:${barColor}"></div></div>
              <p style="margin-top:6px">Matching: <strong>${r.matchedSymptoms.join(', ')}</strong></p>
            </div>
          </div>`;
        this.$('chatMessages').appendChild(div);
        this.scrollChat();
      }, i * 400 + 700);
    });

    const prec = Engine.getUniquePrecautions(results);
    const topConf = results[0].confidence;
    const baseDelay = displayResults.length * 400 + 1000;

    // Step 4: Precautions
    setTimeout(() => {
      const precHtml = prec.slice(0, 3).map(p => `${p.icon} ${p.text}`).join('<br>');
      this.addBotMessage(`💊 <strong>What to do now:</strong><br>${precHtml}`, 0);
    }, baseDelay);

    // Step 5: Low confidence guidance
    if (topConf < 35) {
      setTimeout(() => {
        this.addBotMessage(`💡 <strong>Tip:</strong> Add more symptoms for a more accurate picture. The more you describe, the better the guidance.`, 0);
      }, baseDelay + 500);
    }

    // Step 6: Reassuring footer + Doctor Voice Note
    const voiceDelay = baseDelay + (topConf < 35 ? 1100 : 600);
    setTimeout(() => {
      this.addBotMessage(`💚 <em>Remember — most illnesses are temporary and treatable. This is general guidance only, not a medical diagnosis. When in doubt, see a doctor.</em>`, 0);
    }, voiceDelay);

    // Step 7: Build voice script and show Doctor's Note card + auto-speak
    setTimeout(() => {
      const script = Engine.buildVoiceScript(symptoms, results);
      this.showDoctorNote(script);
      // 500ms pause before speaking so it feels natural, not rushed
      setTimeout(() => VoiceSynth.speak(script), 500);
    }, voiceDelay + 800);
  },

  showDoctorNote(script) {
    const div = document.createElement('div');
    div.className = 'message message-bot doctor-note-message';
    div.id = 'doctorNoteCard';
    div.innerHTML = `
      <div class="msg-avatar" style="background:linear-gradient(135deg,#10b981,#059669)">🩺</div>
      <div class="msg-bubble doctor-note-bubble">
        <div class="doctor-note-header">
          <span class="doctor-note-title">🩺 Doctor's Voice Note</span>
          <div class="doctor-note-controls">
            <button id="btnReplay" class="dn-btn" title="Replay" onclick="VoiceSynth.replay()">▶ Replay</button>
            <button id="btnStopVoice" class="dn-btn dn-stop" title="Stop" onclick="VoiceSynth.stop()">⏹ Stop</button>
          </div>
        </div>
        <div class="doctor-note-wave" id="voiceWaveAnim">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <p class="doctor-note-text">${script}</p>
      </div>`;
    this.$('chatMessages').appendChild(div);
    this.scrollChat();
  },

  // ===== DASHBOARD =====
  renderDashboard({ results, symptoms }) {
    this.$('dashboardEmpty').classList.add('hidden');
    this.$('dashboardResults').classList.remove('hidden');

    // Severity gauge — friendly label instead of raw number
    const sev = Engine.getFriendlySeverity(results, symptoms.length);
    const fill = this.$('gaugeFill');
    const dashOffset = 314 - (314 * sev.score / 100);
    fill.style.strokeDashoffset = dashOffset;
    fill.style.stroke = sev.color;
    this.$('gaugeText').textContent = sev.emoji;
    this.$('gaugeLabel').textContent = sev.level.toUpperCase();

    // Conditions
    const cList = this.$('conditionsList');
    cList.innerHTML = '';
    results.forEach(r => {
      const conf = Engine.formatConfidenceLabel(r.confidence);
      const barColor = { 'conf-high':'#ef4444', 'conf-med':'#f59e0b', 'conf-low':'#10b981' }[conf.cls];
      const card = document.createElement('div');
      card.className = 'condition-card';
      card.innerHTML = `
        <div class="cc-header">
          <div class="cc-name">${r.disease.icon} ${r.disease.name}</div>
          <span class="cc-conf ${conf.cls}">${r.confidence}%</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:6px">${r.disease.category}</div>
        <div class="confidence-bar"><div class="confidence-bar-fill" style="width:${r.confidence}%;background:${barColor}"></div></div>`;
      cList.appendChild(card);
    });

    // Precautions
    const pList = this.$('precautionsList');
    pList.innerHTML = '';
    Engine.getUniquePrecautions(results).forEach(p => {
      const item = document.createElement('div');
      item.className = 'precaution-item';
      item.innerHTML = `<span class="pi-icon">${p.icon}</span><span>${p.text}</span>`;
      pList.appendChild(item);
    });

    // Doctor advice
    this.$('doctorAdvice').innerHTML = Engine.getDoctorAdvice(results);

    // Prepare print report
    this.preparePrintReport({ results, symptoms });
  },

  // ===== PRINT REPORT =====
  preparePrintReport({ results, symptoms }) {
    const sev = Engine.getSeverityScore(results);
    this.$('reportDate').textContent = `Generated: ${new Date().toLocaleString('en-IN')}`;
    let html = `
      <div class="report-section">
        <h3>Patient Symptoms</h3>
        <p>${symptoms.join(', ')}</p>
      </div>
      <div class="report-section">
        <h3>Severity Assessment: ${sev.level.toUpperCase()} (${sev.score}/100)</h3>
      </div>
      <div class="report-section">
        <h3>Possible Conditions</h3>
        ${results.map(r => `
          <div class="report-condition">
            <h4>${r.disease.icon} ${r.disease.name} — ${r.confidence}% match</h4>
            <p>Category: ${r.disease.category} | Severity: ${r.disease.severity}</p>
            <p>Matched symptoms: ${r.matchedSymptoms.join(', ')}</p>
          </div>`).join('')}
      </div>
      <div class="report-section">
        <h3>Precautions</h3>
        ${Engine.getUniquePrecautions(results).map(p => `<div class="report-precaution">${p.icon} ${p.text}</div>`).join('')}
      </div>
      <div class="report-section">
        <h3>When to See a Doctor</h3>
        <p>${Engine.getDoctorAdvice(results)}</p>
      </div>
      <div class="report-section" style="margin-top:30px;padding-top:16px;border-top:1px solid #ddd;color:#999;font-size:11px">
        <p>Generated by MediCheck AI — For informational purposes only. NOT a medical diagnosis.</p>
        <p>Emergency: Call 108 (Ambulance) | Consult a licensed physician for proper diagnosis.</p>
      </div>`;
    this.$('reportBody').innerHTML = html;
  },

  printReport() {
    window.print();
  },

  // ===== HISTORY =====
  showHistory() {
    const modal = this.$('historyModal');
    const list = this.$('historyList');
    const history = History.load();
    modal.classList.remove('hidden');
    if (!history.length) { list.innerHTML = '<p class="empty-history">No previous checks yet.</p>'; return; }
    list.innerHTML = history.map((h, i) => `
      <div class="history-item" onclick="App.reloadHistory(${i})">
        <div class="hi-date">${History.formatDate(h.date)}</div>
        <div class="hi-symptoms">Symptoms: ${h.symptoms.join(', ')}</div>
        <div class="hi-result">🏥 ${h.topResult} — <strong>${h.severity}</strong> severity</div>
      </div>`).join('');
  },

  reloadHistory(i) {
    const h = History.load()[i];
    if (!h) return;
    this.$('historyModal').classList.add('hidden');
    this.clearAll();
    h.symptoms.forEach(s => this.addSymptom(s));
    this.addBotMessage(`📋 Loaded history check from <strong>${History.formatDate(h.date)}</strong>. Click Analyze to re-run.`, 0);
  },

  // ===== NEW CHECK =====
  newCheck() {
    this.clearAll();
    this.lastResults = null;
    this.$('dashboardEmpty').classList.remove('hidden');
    this.$('dashboardResults').classList.add('hidden');
    this.$('btnPrint').classList.add('hidden');
    this.$('chatMessages').innerHTML = '';
    VoiceSynth.stop();
    this.addBotMessage("🔄 New health check started! Select your symptoms and click Analyze.", 0);
  }
};

// ===== HOSPITAL FINDER (Google Maps Places API) =====
const HospitalFinder = {
  _map: null,
  _openInModal: false,

  getLocation(openInModal = false) {
    this._openInModal = openInModal;
    const status = document.getElementById('locationStatus');
    if (status) status.textContent = '📡 Detecting your location…';

    if (!navigator.geolocation) {
      this._fallbackOpen();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => this._onSuccess(pos.coords.latitude, pos.coords.longitude),
      ()    => this._fallbackOpen()
    );
  },

  _fallbackOpen() {
    const status = document.getElementById('locationStatus');
    if (status) status.textContent = '⚠️ Location denied — opening Google Maps.';
    window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank');
    if (this._openInModal && typeof App !== 'undefined') {
      App.addBotMessage('⚠️ Location access denied. <a href="https://www.google.com/maps/search/hospitals+near+me" target="_blank" style="color:#f97316;font-weight:600">Search hospitals on Google Maps →</a>', 0);
    }
  },

  _onSuccess(lat, lng) {
    this._updateMapsLink(lat, lng);
    if (this._openInModal) {
      this._initChatMap(lat, lng);
    } else {
      this._initOverlayMap(lat, lng);
    }
  },

  // ---- DARK-STYLED GOOGLE MAP (shared logic) ----
  _buildGoogleMap(container, lat, lng) {
    const darkStyles = [
      { elementType: 'geometry',            stylers: [{ color: '#1a1a2e' }] },
      { elementType: 'labels.text.fill',    stylers: [{ color: '#c9d1d9' }] },
      { elementType: 'labels.text.stroke',  stylers: [{ color: '#1a1a2e' }] },
      { featureType: 'road',                elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
      { featureType: 'water',               elementType: 'geometry', stylers: [{ color: '#0a0a1a' }] },
      { featureType: 'poi',                 elementType: 'geometry', stylers: [{ color: '#1e1e3a' }] }
    ];
    const map = new google.maps.Map(container, {
      center: { lat, lng },
      zoom: 14,
      styles: darkStyles,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false
    });

    console.log('[HospitalFinder] Map created at', lat, lng);

    // Blue dot — user location
    new google.maps.Marker({
      position: { lat, lng },
      map,
      title: 'You are here',
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });

    // Places nearby search — use keyword for broader hospital match
    const request = {
      location: new google.maps.LatLng(lat, lng),
      radius: 5000,
      keyword: 'hospital'
    };

    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results, status) => {
      console.log('[HospitalFinder] Places status:', status);
      console.log('[HospitalFinder] Results:', results);

      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length) {
        results.slice(0, 8).forEach(place => {
          console.log('[HospitalFinder] Hospital found:', place.name);
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map,
            title: place.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });
          const iw = new google.maps.InfoWindow({ content: `<strong>${place.name}</strong>` });
          marker.addListener('click', () => {
            const plLat = place.geometry.location.lat();
            const plLng = place.geometry.location.lng();
            window.open(`https://www.google.com/maps/search/?api=1&query=${plLat},${plLng}`, '_blank');
          });
        });

        // Update status text
        const stat = document.getElementById('locationStatus');
        if (stat) stat.textContent = `✅ Found ${Math.min(results.length, 8)} hospitals within 5 km`;
      } else {
        // Places failed — show fallback button
        console.warn('[HospitalFinder] Places API failed:', status, '— showing fallback');
        const fb = document.getElementById('fallbackBtn');
        if (fb) fb.style.display = 'inline-flex';
        const stat = document.getElementById('locationStatus');
        if (stat) stat.textContent = '⚠️ Places API unavailable — use the button below';
        this._updateMapsLink(lat, lng);
      }
    });

    return map;
  },

  _initOverlayMap(lat, lng) {
    const mapDiv = document.getElementById('hospitalMap');
    const status = document.getElementById('locationStatus');
    if (!mapDiv || typeof google === 'undefined') return;
    mapDiv.style.display = 'block';
    if (status) status.textContent = '✅ Showing hospitals within 3 km';
    this._map = this._buildGoogleMap(mapDiv, lat, lng);
  },

  _initChatMap(lat, lng) {
    if (typeof google === 'undefined') {
      this._showChatHospitalCard(lat, lng);
      return;
    }
    const mapsUrl = `https://www.google.com/maps/search/hospitals/@${lat},${lng},14z`;
    const div = document.createElement('div');
    div.className = 'message message-bot';
    const mapId = 'chatGoogleMap_' + Date.now();
    div.innerHTML = `
      <div class="msg-avatar" style="background:linear-gradient(135deg,#ef4444,#dc2626)">🏥</div>
      <div class="msg-bubble" style="border:1.5px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.05);padding:0;overflow:hidden;min-width:260px">
        <div style="padding:14px 16px 10px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">🏥 Hospitals Near You</div>
          <p style="font-size:12px;color:var(--text3)">Red pins = nearby hospitals · Click a pin to open in Maps</p>
        </div>
        <div id="${mapId}" style="height:260px;width:100%"></div>
        <div style="padding:10px 16px">
          <a href="${mapsUrl}" target="_blank" style="
            display:inline-flex;align-items:center;gap:8px;
            padding:9px 18px;background:linear-gradient(135deg,#ef4444,#dc2626);
            color:#fff;border-radius:50px;font-size:13px;font-weight:700;
            text-decoration:none;box-shadow:0 4px 14px rgba(239,68,68,0.3)">
            📍 Open Full Map
          </a>
        </div>
      </div>`;
    const msgs = document.getElementById('chatMessages');
    if (msgs) { msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; }
    // Init map after DOM insertion
    setTimeout(() => {
      const container = document.getElementById(mapId);
      if (container) this._buildGoogleMap(container, lat, lng);
    }, 100);
  },

  _updateMapsLink(lat, lng) {
    const btn = document.getElementById('mapsBtn');
    if (btn) {
      btn.href = `https://www.google.com/maps/search/hospitals/@${lat},${lng},14z`;
      btn.classList.remove('hidden');
    }
    const stat = document.getElementById('locationStatus');
    if (stat) stat.textContent = '✅ Location found. Hospitals loading…';
  },

  _showChatHospitalCard(lat, lng) {
    const mapsUrl = `https://www.google.com/maps/search/hospitals/@${lat},${lng},14z`;
    const div = document.createElement('div');
    div.className = 'message message-bot';
    div.innerHTML = `
      <div class="msg-avatar" style="background:linear-gradient(135deg,#ef4444,#dc2626)">🏥</div>
      <div class="msg-bubble" style="border:1.5px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.05)">
        <div style="font-weight:700;font-size:14px;margin-bottom:8px">🏥 Nearby Hospitals</div>
        <a href="${mapsUrl}" target="_blank" style="
          display:inline-flex;align-items:center;gap:8px;padding:10px 20px;
          background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;
          border-radius:50px;font-size:13px;font-weight:700;text-decoration:none">
          📍 Open Hospitals in Google Maps
        </a>
      </div>`;
    const msgs = document.getElementById('chatMessages');
    if (msgs) { msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; }
  },

  injectHighSeverityLink(severity) {
    if (severity !== 'high' && severity !== 'critical') return;
    const div = document.createElement('div');
    div.className = 'message message-bot';
    div.innerHTML = `
      <div class="msg-avatar">🏥</div>
      <div class="msg-bubble" style="border:1px solid rgba(249,115,22,0.3);background:rgba(249,115,22,0.05)">
        <p style="font-size:13px">
          🟠 Your condition may need medical attention.
          <a href="#" onclick="HospitalFinder.getLocation(true);return false;"
             style="color:#f97316;font-weight:700;text-decoration:underline">
            Find hospitals near you →
          </a>
        </p>
      </div>`;
    const msgs = document.getElementById('chatMessages');
    if (msgs) { msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; }
  }
};

// ===== VOICE SYNTH — ElevenLabs Primary + Browser TTS Fallback =====
const VoiceSynth = {
  lastScript: '',
  speaking: false,
  _audio: null,
  _utterance: null,
  _keepAlive: null,
  VOICE_ID: 'pNInz6obpgDQGcFmaJgB',

  async speak(script) {
    this.stop();
    this.lastScript = script;
    this._showIndicator(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script })
      });
      if (!response.ok) throw new Error(`ElevenLabs ${response.status}`);
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      this._audio = new Audio(url);
      this.speaking = true;
      this._audio.onended = () => { this.speaking = false; this._showIndicator(false); };
      this._audio.onerror = () => { this._showIndicator(false); this._browserSpeak(script); };
      await this._audio.play();
    } catch (err) {
      console.warn('ElevenLabs failed, using browser TTS:', err.message);
      this._browserSpeak(script);
    }
  },

  _browserSpeak(script) {
    if (!window.speechSynthesis) { this._showIndicator(false); return; }
    this._utterance = new SpeechSynthesisUtterance(script);
    this._utterance.lang  = 'en-IN';
    this._utterance.rate  = 0.78;
    this._utterance.pitch = 1.05;
    this._utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /en.*IN|en.*india/i.test(v.lang))
      || voices.find(v => /en-GB/i.test(v.lang))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) this._utterance.voice = preferred;
    this._utterance.onstart = () => { this.speaking = true; this._showIndicator(true); };
    this._utterance.onend  = () => { this.speaking = false; this._showIndicator(false); };
    // Chromium keepalive fix
    this._keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) clearInterval(this._keepAlive);
    }, 5000);
    window.speechSynthesis.speak(this._utterance);
  },

  replay() {
    if (this.lastScript) this.speak(this.lastScript);
  },

  stop() {
    // Stop ElevenLabs audio
    if (this._audio) {
      this._audio.pause();
      this._audio.src = '';
      this._audio = null;
    }
    // Stop browser TTS
    clearInterval(this._keepAlive);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.speaking = false;
    this._showIndicator(false);
  },

  _showIndicator(active) {
    // Wave animation on the doctor note card
    const wave = document.getElementById('voiceWaveAnim');
    if (wave) active ? wave.classList.add('active') : wave.classList.remove('active');
    // Speaking indicator badge
    let badge = document.getElementById('speakingIndicator');
    if (active && !badge) {
      badge = document.createElement('div');
      badge.id = 'speakingIndicator';
      badge.className = 'speaking-badge';
      badge.innerHTML = '🩺 Doctor is speaking…';
      const msgs = document.getElementById('chatMessages');
      if (msgs) { msgs.appendChild(badge); msgs.scrollTop = msgs.scrollHeight; }
    } else if (!active && badge) {
      badge.remove();
    }
  }
};

// Pre-load voices (Chrome loads them async)
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

document.addEventListener('DOMContentLoaded', () => App.init());
