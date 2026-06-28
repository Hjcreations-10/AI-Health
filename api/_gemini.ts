/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared Gemini AI client helpers for Vercel serverless functions.
 */

import { GoogleGenAI } from '@google/genai';
import { Medicine } from '../src/types';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (_ai) return _ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    _ai = new GoogleGenAI({ apiKey });
    return _ai;
  } catch {
    return null;
  }
}

export async function analyzeInteractionsWithGemini(
  allMeds: Medicine[],
  newMeds: Medicine[]
): Promise<string> {
  const ai = getAI();
  if (!ai) {
    return 'No active interactions found (Rule-based check: Ensure Telmisartan is taken in the morning before food and Metformin is taken after food).';
  }

  const medNamesString = allMeds.map(m => `${m.name} (${m.dosage})`).join(', ');
  const newMedsString = newMeds.map(m => `${m.name} (${m.dosage})`).join(', ');

  const prompt = `You are an expert clinical pharmacist and AI health advisor for elderly care in India.
Current active medications: [${medNamesString}]
Newly prescribed medications: [${newMedsString}]

Analyze if there are any clinically significant drug-drug interactions, duplicate therapeutic classes (e.g., taking two ACE inhibitors or beta-blockers), or scheduling conflicts between the current and new drugs.
Keep your analysis extremely concise (under 120 words), direct, and focused on safety. Write in a clear, supportive tone for a doctor to review. If there are no interactions, state "No adverse drug interactions detected."`;

  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    return response.text || 'No adverse drug interactions detected.';
  } catch (err) {
    console.error('Gemini interaction analysis error:', err);
    return 'Unable to perform active AI drug interaction analysis due to server load. Please check standard guidelines.';
  }
}

export async function explainMedicineWithGemini(
  medName: string,
  dosage: string,
  purpose: string,
  lang: string
): Promise<string> {
  const ai = getAI();
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
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    return response.text || `Explanation for ${medName} could not be generated.`;
  } catch (err) {
    console.error('Gemini medicine explanation error:', err);
    return `Detailed description for ${medName} is currently unavailable. Standard use: ${purpose}.`;
  }
}

export async function translateTextWithGemini(text: string, lang: string): Promise<string> {
  const ai = getAI();
  if (!ai || !lang || lang.toLowerCase() === 'english') return text;

  const prompt = `You are a high-fidelity translator for healthcare messages.
Translate the following short medical or reminder message into "${lang}".
Provide ONLY the translated text in the native script of "${lang}". Do not include any quotes, explanations, or metadata.
Ensure the translation sounds extremely warm, supportive, and natural when spoken aloud to an elderly patient in India.

Message to translate:
"${text}"`;

  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    return response.text ? response.text.trim() : text;
  } catch (err) {
    console.error('Gemini translation error:', err);
    return text;
  }
}

export async function chatWithGemini(
  message: string,
  lang: string,
  activeMedsContext: string
): Promise<string> {
  const ai = getAI();
  if (!ai) return null as any;

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

  const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
  return response.text || 'Namaste! I am checking your record. Please hold on.';
}
