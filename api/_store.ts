/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared in-memory store for Vercel serverless functions.
 * NOTE: On Vercel, each function invocation may be cold-started,
 * so state persists only within a single warm instance.
 * For production, replace with a database (e.g., Vercel KV / Redis).
 */

import { Patient, Prescription, AdherenceLog, ChatMessage } from '../src/types';
import { INITIAL_PATIENT, INITIAL_PRESCRIPTIONS, INITIAL_ADHERENCE_LOGS } from '../src/data';

// Use global to persist state across invocations in the same warm instance
declare global {
  var __healthStore: {
    patient: Patient;
    prescriptions: Prescription[];
    adherenceLogs: AdherenceLog[];
    chatHistory: ChatMessage[];
  } | undefined;
}

if (!global.__healthStore) {
  global.__healthStore = {
    patient: { ...INITIAL_PATIENT },
    prescriptions: JSON.parse(JSON.stringify(INITIAL_PRESCRIPTIONS)),
    adherenceLogs: JSON.parse(JSON.stringify(INITIAL_ADHERENCE_LOGS)),
    chatHistory: [
      {
        id: 'init-1',
        sender: 'ai',
        text: 'Namaste! I am your AI Health Companion. I can help explain your medicines, check for drug interactions, schedule reminders in your preferred language, or help you contact your caregiver in emergencies. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  };
}

export const store = global.__healthStore!;
