# 🏥 MediCheck AI — Smart Symptom Checker

An AI-powered symptom checker built for students, offering instant health guidance, emergency detection, and nearby hospital lookup — all running client-side.

## 🚀 Key Features
- **Symptom Matching Engine:** Weighted scoring algorithm matches selected symptoms against a database of 25+ conditions, returning ranked results with confidence scores
- **Emergency Detection:** Flags high-risk symptom combinations (e.g. chest pain + shortness of breath) and surfaces an emergency alert with one-tap ambulance calling (108)
- **Hospital Finder:** Uses geolocation to find and link to nearby hospitals via Google Maps
- **Voice Input & Output:** Speech-to-text symptom entry, plus AI voice narration of results (ElevenLabs, with browser speech synthesis as fallback)
- **Health Reports:** Printable, auto-generated report summarizing matched conditions, precautions, and doctor guidance
- **Check History:** Stores past symptom checks locally for reference

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (no framework — fully client-side)
- **Voice AI:** ElevenLabs Text-to-Speech (via a secured serverless proxy — see below)
- **Maps:** Google Maps JavaScript API
- **Diagnosis Engine:** Custom weighted symptom-matching algorithm (`js/engine.js`)

## 🔒 Security Note
The ElevenLabs API key is never exposed client-side. `api/tts.js` is a serverless function (deploy target: Vercel) that holds the key server-side via an environment variable (`ELEVENLABS_API_KEY`) and proxies text-to-speech requests. The frontend calls `/api/tts` — it never talks to ElevenLabs directly.

## 📂 Project Structure

## ⚙️ Running Locally
This is a static frontend — open `index.html` directly in a browser, or serve it with any static server:
```bash
npx serve .
```
Note: the voice narration feature (ElevenLabs) requires deploying `api/tts.js` as a serverless function (e.g. on Vercel) with `ELEVENLABS_API_KEY` set as an environment variable. Without it, the app automatically falls back to the browser's built-in speech synthesis.

## ⚖️ Disclaimer
MediCheck AI provides general health information only. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
