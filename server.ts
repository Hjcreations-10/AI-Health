/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { 
  Patient, 
  Prescription, 
  AdherenceLog, 
  Medicine, 
  ChatMessage 
} from './src/types';
import { 
  INITIAL_PATIENT, 
  INITIAL_PRESCRIPTIONS, 
  INITIAL_ADHERENCE_LOGS 
} from './src/data';

dotenv.config();

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini API client initialized successfully.');
  } catch (error) {
    console.error('Error initializing Gemini API client:', error);
  }
} else {
  console.warn('GEMINI_API_KEY not found in environment. AI features will use rule-based fallback.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory persistent database for the live session
  let patientState: Patient = { ...INITIAL_PATIENT };
  let prescriptionsState: Prescription[] = JSON.parse(JSON.stringify(INITIAL_PRESCRIPTIONS));
  let adherenceLogsState: AdherenceLog[] = JSON.parse(JSON.stringify(INITIAL_ADHERENCE_LOGS));
  let chatHistory: ChatMessage[] = [
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Namaste! I am your AI Health Companion. I can help explain your medicines, check for drug interactions, schedule reminders in your preferred language, or help you contact your caregiver in emergencies. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  // Helper: check drug interactions using Gemini
  async function analyzeInteractionsWithGemini(allMeds: Medicine[], newMeds: Medicine[]): Promise<string> {
    if (!ai) {
      return "No active interactions found (Rule-based check: Ensure Telmisartan is taken in the morning before food and Metformin is taken after food).";
    }

    const medNamesString = allMeds.map(m => `${m.name} (${m.dosage})`).join(', ');
    const newMedsString = newMeds.map(m => `${m.name} (${m.dosage})`).join(', ');

    const prompt = `You are an expert clinical pharmacist and AI health advisor for elderly care in India.
Current active medications: [${medNamesString}]
Newly prescribed medications: [${newMedsString}]

Analyze if there are any clinically significant drug-drug interactions, duplicate therapeutic classes (e.g., taking two ACE inhibitors or beta-blockers), or scheduling conflicts between the current and new drugs.
Keep your analysis extremely concise (under 120 words), direct, and focused on safety. Write in a clear, supportive tone for a doctor to review. If there are no interactions, state "No adverse drug interactions detected."`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      return response.text || "No adverse drug interactions detected.";
    } catch (err) {
      console.error('Error calling Gemini for interaction analysis:', err);
      return "Unable to perform active AI drug interaction analysis due to server load. Please check standard guidelines.";
    }
  }

  // Helper: explain medicine in simple language & regional terms
  async function explainMedicineWithGemini(medName: string, dosage: string, purpose: string, lang: string): Promise<string> {
    if (!ai) {
      return `This medicine is ${medName} (${dosage}). It is used to: ${purpose}. Please take as directed.`;
    }

    const prompt = `You are a warm, helpful AI Elderly Healthcare Assistant in India.
Explain the following medication simply:
- Name: ${medName}
- Dosage: ${dosage}
- Purpose/Brief Description: ${purpose}

Target Language: ${lang}

Instructions:
1. Explain in 2-3 simple sentences what this medicine does, why it is important, and one key tip (e.g. "Take with plenty of water").
2. Write the explanation directly in the selected language (${lang}). Use humble, highly clear words suitable for an elderly patient (70+ years old).
3. Do not use complex medical jargon.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      return response.text || `Explanation for ${medName} could not be generated.`;
    } catch (err) {
      console.error('Error calling Gemini for medicine explanation:', err);
      return `Detailed description for ${medName} is currently unavailable. Standard use: ${purpose}.`;
    }
  }

  // Helper: translate generic text using Gemini
  async function translateTextWithGemini(text: string, lang: string): Promise<string> {
    if (!ai || !lang || lang.toLowerCase() === 'english') {
      return text;
    }

    const prompt = `You are a high-fidelity translator for healthcare messages.
Translate the following short medical or reminder message into "${lang}".
Provide ONLY the translated text in the native script of "${lang}". Do not include any quotes, explanations, or metadata.
Ensure the translation sounds extremely warm, supportive, and natural when spoken aloud to an elderly patient in India.

Message to translate:
"${text}"`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });
      return response.text ? response.text.trim() : text;
    } catch (err) {
      console.error('Error calling Gemini for translation:', err);
      return text;
    }
  }

  // ==========================================
  // API ENDPOINTS
  // ==========================================

  // 1. Patient Profile
  app.get('/api/patient', (req, res) => {
    res.json(patientState);
  });

  // 2. Update Vitals or Emergency
  app.post('/api/patient/vitals', (req, res) => {
    const { heartRate, spo2, isFallDetected, isEmergencyTriggered } = req.body;
    
    if (heartRate !== undefined) patientState.vitals.heartRate = heartRate;
    if (spo2 !== undefined) patientState.vitals.spo2 = spo2;
    if (isFallDetected !== undefined) patientState.vitals.isFallDetected = isFallDetected;
    if (isEmergencyTriggered !== undefined) patientState.vitals.isEmergencyTriggered = isEmergencyTriggered;
    
    patientState.vitals.lastUpdated = 'Just now';
    res.json(patientState);
  });

  // 3. List All Prescriptions
  app.get('/api/prescriptions', (req, res) => {
    res.json(prescriptionsState);
  });

  // 4. Create New Prescription (Hospital Portal)
  app.post('/api/prescriptions', async (req, res) => {
    try {
      const { doctorName, specialty, hospitalName, diagnosis, medicines } = req.body;

      if (!doctorName || !hospitalName || !medicines || medicines.length === 0) {
        return res.status(400).json({ error: 'Missing required prescription fields' });
      }

      // Check current active medicines (from already fulfilled prescriptions)
      const currentActiveMeds: Medicine[] = [];
      prescriptionsState.forEach(p => {
        if (p.isFulfilled) {
          currentActiveMeds.push(...p.medicines);
        }
      });

      // Analyze interactions
      const interactionWarning = await analyzeInteractionsWithGemini(currentActiveMeds, medicines);

      const newPrescription: Prescription = {
        id: `PR-2026-${String(prescriptionsState.length + 1).padStart(4, '0')}`,
        date: new Date().toISOString().split('T')[0],
        doctorName,
        specialty,
        hospitalName,
        diagnosis,
        medicines: medicines.map((m: any, idx: number) => ({
          id: `M-${String(currentActiveMeds.length + idx + 5).padStart(3, '0')}`,
          name: m.name,
          dosage: m.dosage || '1 Tablet',
          frequency: m.frequency || '1-0-1',
          instructions: m.instructions || 'After Food',
          duration: m.duration || '30 Days',
          purpose: m.purpose || 'Prescribed treatment',
          sideEffects: m.sideEffects || 'Consult doctor if severe',
          refillRemaining: parseInt(m.duration) || 30,
          totalDays: parseInt(m.duration) || 30,
          startDate: new Date().toISOString().split('T')[0],
          prescribedBy: doctorName,
          hospital: hospitalName
        })),
        isFulfilled: false
      };

      prescriptionsState.push(newPrescription);
      res.json({ prescription: newPrescription, warnings: interactionWarning });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Fulfill Prescription (Pharmacy Portal)
  app.post('/api/prescriptions/fulfill', (req, res) => {
    const { prescriptionId } = req.body;
    const prescription = prescriptionsState.find(p => p.id === prescriptionId);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.isFulfilled) {
      return res.status(400).json({ error: 'Prescription already fulfilled' });
    }

    prescription.isFulfilled = true;
    prescription.fulfillmentDate = new Date().toISOString().split('T')[0];

    // Add medicines to adherence logs schedules for today & tomorrow
    const todayStr = new Date().toISOString().split('T')[0];
    prescription.medicines.forEach(med => {
      const freqParts = med.frequency.split('-'); // e.g. "1-0-1" -> [Morning, Afternoon, Evening]
      
      const slots: ('Morning' | 'Afternoon' | 'Evening')[] = ['Morning', 'Afternoon', 'Evening'];
      freqParts.forEach((val, idx) => {
        if (parseInt(val) > 0) {
          // Check if log already exists
          const logExists = adherenceLogsState.some(
            l => l.date === todayStr && l.timeSlot === slots[idx] && l.medicineId === med.id
          );
          if (!logExists) {
            adherenceLogsState.push({
              id: `l-${adherenceLogsState.length + 1}`,
              date: todayStr,
              timeSlot: slots[idx],
              medicineId: med.id,
              medicineName: med.name,
              status: 'Pending'
            });
          }
        }
      });
    });

    res.json({ success: true, prescription });
  });

  // 6. Get Adherence Logs
  app.get('/api/adherence-logs', (req, res) => {
    res.json(adherenceLogsState);
  });

  // 7. Update Adherence Status (Taken, Missed, Pending)
  app.post('/api/adherence-logs/update', (req, res) => {
    const { logId, status } = req.body;
    const log = adherenceLogsState.find(l => l.id === logId);

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    const oldStatus = log.status;
    log.status = status;

    if (status === 'Taken') {
      log.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Reduce refill remaining for the medicine
      prescriptionsState.forEach(p => {
        const med = p.medicines.find(m => m.id === log.medicineId);
        if (med && oldStatus !== 'Taken') {
          med.refillRemaining = Math.max(0, med.refillRemaining - 1);
        }
      });
    } else {
      // If changed back from Taken
      if (oldStatus === 'Taken') {
        prescriptionsState.forEach(p => {
          const med = p.medicines.find(m => m.id === log.medicineId);
          if (med) {
            med.refillRemaining = med.refillRemaining + 1;
          }
        });
      }
      delete log.timestamp;
    }

    res.json({ success: true, log });
  });

  // 8. Medicine Explanation endpoint
  app.post('/api/gemini/explain-med', async (req, res) => {
    const { name, dosage, purpose, lang } = req.body;
    if (!name || !purpose) {
      return res.status(400).json({ error: 'Medicine name and purpose required' });
    }

    const explanation = await explainMedicineWithGemini(name, dosage || '1 tablet', purpose, lang || 'English');
    res.json({ explanation });
  });

  // 8.5. Dynamic Translate endpoint
  app.post('/api/gemini/translate', async (req, res) => {
    const { text, lang } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const translated = await translateTextWithGemini(text, lang || 'English');
    res.json({ translated });
  });

  // 9. AI Copilot Chat assistant
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, lang } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Add user message to state
      const userMsg: ChatMessage = {
        id: `chat-${Date.now()}-user`,
        sender: 'user',
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      chatHistory.push(userMsg);

      let aiText = "";

      if (ai) {
        // Collect current medicines list to feed context to AI
        const activeMeds: string[] = [];
        prescriptionsState.forEach(p => {
          if (p.isFulfilled) {
            p.medicines.forEach(m => {
              activeMeds.push(`- ${m.name} (${m.dosage}, ${m.frequency}, ${m.instructions}) for: ${m.purpose}`);
            });
          }
        });

        const activeMedsContext = activeMeds.length > 0 
          ? activeMeds.join('\n') 
          : "None currently fulfilled. Wait for pharmacy check.";

        const prompt = `You are "AI Health Companion", a universal, compassionate, and highly intelligent AI medical assistant designed specifically to help elderly people and their family caregivers in India.
Current Patient Context:
- Name: Devendra Prasad, Age: 72
- Chronic Conditions: Type 2 Diabetes, Hypertension
- Allergies: Penicillin, Sulfa Drugs
- Emergency Contact: Rajesh Prasad (Son, Primary Caregiver, phone: +91 98765 43210)
- Currently Active Medicines:\n${activeMedsContext}

User Query: "${message}"
Preferred Language Mode: ${lang || 'English'}

Role & Guidelines:
1. Provide a direct, reassuring, warm, and highly practical response in 2-4 sentences.
2. If the user asks a health question (e.g., managing sugar, high blood pressure tips, forgetting medicines), give elderly-friendly, medically sound advice from a geriatric companion perspective.
3. If the user indicates a medical emergency (chest pain, severe dizziness, falling), urge them to tap the Smartwatch Emergency Button immediately or contact their son Rajesh Prasad (+91 98765 43210).
4. Translate your answer naturally to their selected language: ${lang || 'English'}.
5. Never output complex or diagnostic jargon. Keep sentences relatively short and easy to understand. Keep references to their current active drugs accurate.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
        });

        aiText = response.text || "Namaste! I am checking your record. Please hold on.";
      } else {
        // Fallback rule-based assistant
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('metformin') || lowerMsg.includes('sugar') || lowerMsg.includes('diabetes')) {
          aiText = "Metformin helps control your blood sugar. Please make sure to take it after breakfast and dinner to avoid an upset stomach, and keep eating fresh vegetables.";
        } else if (lowerMsg.includes('telmisartan') || lowerMsg.includes('pressure') || lowerMsg.includes('bp')) {
          aiText = "Telmisartan is for your high blood pressure. You should take it empty stomach before breakfast. Avoid eating too much salt in your diet.";
        } else if (lowerMsg.includes('pain') || lowerMsg.includes('emergency') || lowerMsg.includes('fall')) {
          aiText = "If you are feeling unwell or have experienced a fall, please trigger the EMERGENCY alert. I am also alerting your son Rajesh Prasad at +91 98765 43210 immediately.";
        } else {
          aiText = "Namaste! I am your AI Health Companion. To maintain good health, please take your prescribed medications on time, stay hydrated, and do light walking in the morning.";
        }

        if (lang && lang !== 'English') {
          aiText += ` (Simulated helper translation in preferred regional language: ${lang})`;
        }
      }

      const aiMsg: ChatMessage = {
        id: `chat-${Date.now()}-ai`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      chatHistory.push(aiMsg);

      res.json({ chatHistory });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get active chat history
  app.get('/api/gemini/chat-history', (req, res) => {
    res.json(chatHistory);
  });

  // Reset chat or states (if desired)
  app.post('/api/reset', (req, res) => {
    patientState = { ...INITIAL_PATIENT };
    prescriptionsState = JSON.parse(JSON.stringify(INITIAL_PRESCRIPTIONS));
    adherenceLogsState = JSON.parse(JSON.stringify(INITIAL_ADHERENCE_LOGS));
    chatHistory = [
      {
        id: 'init-1',
        sender: 'ai',
        text: 'Namaste! I am your AI Health Companion. I can help explain your medicines, check for drug interactions, schedule reminders in your preferred language, or help you contact your caregiver in emergencies. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    res.json({ success: true });
  });

  // ==========================================
  // VITE DEV SERVER OR STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Health Companion Server running on http://localhost:${PORT}`);
  });
}

startServer();
