# 🩺 AI Health Companion

A universal, AI-powered connected healthcare ecosystem designed specifically for elderly care in India. It features a Universal AI Health Card, a Patient Mobile App, a Smartwatch Companion, Hospital and Pharmacy Portals, a Caregiver Dashboard, and an interactive voice assistant.

---

## 🚀 Key Ecosystem Modules

### 📱 Patient Mobile App
*   **Universal AI Health Card**: A digital health identity showing QR codes, chronic conditions, critical allergies, and primary emergency contacts.
*   **Daily Medication Schedules**: Interactive adherence checklists categorized by time of day (Morning, Afternoon, Evening).
*   **Multilingual Interface**: Full translation capabilities to adapt the dashboard to the user's preferred regional language.

### ⌚ Smartwatch Companion
*   **Real-time Vitals Tracking**: Simulated tracking of active heart rate and SpO2 metrics.
*   **Automatic Fall Detection**: Embedded sensor simulation that auto-triggers emergency alerts if a fall is detected.
*   **Emergency SOS Button**: A single-tap panic button that alerts caregivers and displays immediate emergency medical details.

### 🏥 Hospital Portal (Doctor Terminal)
*   **Patient Intake & Diagnostic Logs**: Enables physicians to view patient vitals, diagnosis history, and current active medications.
*   **Smart Prescription Builder**: Allows doctors to create digital prescriptions with specific dosages, frequencies, and instructions.
*   **AI Drug Interaction Warning**: Uses Gemini AI to analyze drug-drug interactions between current active medicines and new prescriptions in real time.

### 💊 Pharmacy Portal
*   **Prescription Verification**: Pharmacists can verify and fulfill prescriptions directly through the shared digital ledger.
*   **Automatic Adherence Scheduler**: Fulfilling a prescription automatically schedules medication reminder logs for the patient.

### 👥 Caregiver Dashboard
*   **Real-time Monitoring**: Provides family members and doctors with a centralized dashboard to track live vitals, SOS alerts, and medication compliance logs.
*   **Compliance Score**: Computes compliance metrics based on missed vs. taken medication logs.

---

## 🧠 Gemini AI Capabilities

*   **Drug-Drug Interaction Analysis**: Analyzes new and existing active medications to prevent duplicate therapeutic classes, scheduling conflicts, or adverse interactions.
*   **Elderly-Friendly Regional Explanations**: Translates and breaks down complex medical jargon into simple, supportive, and humble explanations in preferred regional languages (Hindi, Tamil, Telugu, etc.).
*   **Geriatric Health Assistant**: A compassionate chatbot built to guide patients through daily health routines, explain side effects, and offer immediate emergency steps.

---

## 🛠️ Local Development

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or copy `.env.example` to `.env`) and add your Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no API key is provided, the application automatically falls back to rule-based mock responses for demo purposes.*

### 3. Run the App Locally
Start the integrated Express backend and Vite frontend development server:
```bash
npx tsx server.ts
```
Once started, open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ☁️ Vercel Deployment

The project is pre-configured to build and deploy seamlessly on Vercel as a hybrid application:
*   **Frontend**: Built with Vite and TailwindCSS, served from the static `dist/` directory.
*   **Backend**: Served via Vercel Serverless Functions in the `api/` directory using `@vercel/node`.

To deploy via Vercel CLI:
```bash
vercel deploy --prod
```
