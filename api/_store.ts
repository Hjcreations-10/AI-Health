/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared in-memory store for Vercel serverless functions.
 * ALL types and seed data are inlined here so that no serverless
 * function needs to import from ../src/ (which is not bundled by Vercel).
 *
 * NOTE: State persists only within a single warm Vercel instance.
 * For production persistence, replace with Vercel KV / Redis.
 */

// ─── Inline Types ────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  chronicDiseases: string[];
  allergies: string[];
  vitals: {
    heartRate: number;
    spo2: number;
    lastUpdated: string;
    isFallDetected: boolean;
    isEmergencyTriggered: boolean;
  };
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  duration: string;
  purpose: string;
  sideEffects?: string;
  refillRemaining: number;
  totalDays: number;
  startDate: string;
  prescribedBy: string;
  hospital: string;
}

export interface Prescription {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  hospitalName: string;
  diagnosis: string;
  medicines: Medicine[];
  isFulfilled: boolean;
  fulfillmentDate?: string;
}

export interface AdherenceLog {
  id: string;
  date: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  medicineId: string;
  medicineName: string;
  status: 'Taken' | 'Missed' | 'Pending';
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_PATIENT: Patient = {
  id: 'AIH-882-901-IN',
  name: 'Devendra Prasad',
  age: 72,
  gender: 'Male',
  bloodGroup: 'O+',
  emergencyContactName: 'Rajesh Prasad',
  emergencyContactPhone: '+91 98765 43210',
  emergencyContactRelation: 'Son (Primary Caregiver)',
  chronicDiseases: ['Type 2 Diabetes', 'Hypertension (High Blood Pressure)'],
  allergies: ['Penicillin', 'Sulfa Drugs'],
  vitals: {
    heartRate: 72,
    spo2: 98,
    lastUpdated: 'Just now',
    isFallDetected: false,
    isEmergencyTriggered: false,
  },
};

const SEED_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'PR-2026-0041',
    date: '2026-06-15',
    doctorName: 'Dr. Anjali Mehta',
    specialty: 'Cardiologist',
    hospitalName: 'Apollo Hospitals, Hyderabad',
    diagnosis: 'Primary Hypertension & Diabetic Cardioprotection',
    isFulfilled: true,
    fulfillmentDate: '2026-06-15',
    medicines: [
      {
        id: 'M-001',
        name: 'Metformin XR (500mg)',
        dosage: '1 Tablet',
        frequency: '1-0-1',
        instructions: 'After Food',
        duration: '90 Days',
        purpose: 'Lowers blood sugar levels by improving insulin sensitivity.',
        sideEffects: 'Mild nausea, stomach upset on empty stomach.',
        refillRemaining: 14,
        totalDays: 90,
        startDate: '2026-06-15',
        prescribedBy: 'Dr. Anjali Mehta',
        hospital: 'Apollo Hospitals, Hyderabad',
      },
      {
        id: 'M-002',
        name: 'Telmisartan (40mg)',
        dosage: '1 Tablet',
        frequency: '1-0-0',
        instructions: 'Before Breakfast',
        duration: '90 Days',
        purpose: 'Relaxes blood vessels to lower blood pressure and protect kidneys.',
        sideEffects: 'Lightheadedness, dry throat.',
        refillRemaining: 18,
        totalDays: 90,
        startDate: '2026-06-15',
        prescribedBy: 'Dr. Anjali Mehta',
        hospital: 'Apollo Hospitals, Hyderabad',
      },
    ],
  },
  {
    id: 'PR-2026-0089',
    date: '2026-06-22',
    doctorName: 'Dr. S. K. Nair',
    specialty: 'Geriatric Generalist',
    hospitalName: 'Narayana Health, Bangalore',
    diagnosis: 'Mild Osteoarthritis & Calcium Deficiency',
    isFulfilled: false,
    medicines: [
      {
        id: 'M-003',
        name: 'Calcium + Vitamin D3',
        dosage: '1 Capsule',
        frequency: '0-1-0',
        instructions: 'After Lunch',
        duration: '30 Days',
        purpose: 'Strengthens bones and improves calcium absorption.',
        sideEffects: 'Constipation if fluid intake is low.',
        refillRemaining: 30,
        totalDays: 30,
        startDate: '2026-06-22',
        prescribedBy: 'Dr. S. K. Nair',
        hospital: 'Narayana Health, Bangalore',
      },
      {
        id: 'M-004',
        name: 'Glucosamine Sulfate (500mg)',
        dosage: '1 Tablet',
        frequency: '0-0-1',
        instructions: 'After Dinner',
        duration: '30 Days',
        purpose: 'Supports joint cartilage health and reduces knee pain.',
        sideEffects: 'Mild digestive gas.',
        refillRemaining: 30,
        totalDays: 30,
        startDate: '2026-06-22',
        prescribedBy: 'Dr. S. K. Nair',
        hospital: 'Narayana Health, Bangalore',
      },
    ],
  },
];

// Use today's date for adherence logs so they're always current
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const SEED_ADHERENCE_LOGS: AdherenceLog[] = [
  // Yesterday's logs (completed)
  { id: 'l-001', date: yesterday, timeSlot: 'Morning',   medicineId: 'M-001', medicineName: 'Metformin XR (500mg)',      status: 'Taken',   timestamp: '08:15 AM' },
  { id: 'l-002', date: yesterday, timeSlot: 'Morning',   medicineId: 'M-002', medicineName: 'Telmisartan (40mg)',         status: 'Taken',   timestamp: '07:45 AM' },
  { id: 'l-003', date: yesterday, timeSlot: 'Afternoon', medicineId: 'M-003', medicineName: 'Calcium + Vitamin D3',       status: 'Taken',   timestamp: '01:40 PM' },
  { id: 'l-004', date: yesterday, timeSlot: 'Evening',   medicineId: 'M-001', medicineName: 'Metformin XR (500mg)',      status: 'Taken',   timestamp: '08:22 PM' },
  { id: 'l-005', date: yesterday, timeSlot: 'Evening',   medicineId: 'M-004', medicineName: 'Glucosamine Sulfate (500mg)', status: 'Taken', timestamp: '08:30 PM' },
  // Today's logs (in progress)
  { id: 'l-006', date: today,     timeSlot: 'Morning',   medicineId: 'M-001', medicineName: 'Metformin XR (500mg)',      status: 'Taken',   timestamp: '08:10 AM' },
  { id: 'l-007', date: today,     timeSlot: 'Morning',   medicineId: 'M-002', medicineName: 'Telmisartan (40mg)',         status: 'Taken',   timestamp: '07:55 AM' },
  { id: 'l-008', date: today,     timeSlot: 'Afternoon', medicineId: 'M-003', medicineName: 'Calcium + Vitamin D3',       status: 'Pending' },
  { id: 'l-009', date: today,     timeSlot: 'Evening',   medicineId: 'M-001', medicineName: 'Metformin XR (500mg)',      status: 'Pending' },
  { id: 'l-010', date: today,     timeSlot: 'Evening',   medicineId: 'M-004', medicineName: 'Glucosamine Sulfate (500mg)', status: 'Pending' },
];

const SEED_CHAT: ChatMessage[] = [
  {
    id: 'init-1',
    sender: 'ai',
    text: 'Namaste! I am your AI Health Companion. I can help explain your medicines, check for drug interactions, schedule reminders in your preferred language, or help you contact your caregiver in emergencies. How can I help you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

// ─── Global Store ─────────────────────────────────────────────────────────────

declare global {
  var __healthStore:
    | {
        patient: Patient;
        prescriptions: Prescription[];
        adherenceLogs: AdherenceLog[];
        chatHistory: ChatMessage[];
      }
    | undefined;
}

if (!global.__healthStore) {
  global.__healthStore = {
    patient: { ...SEED_PATIENT },
    prescriptions: JSON.parse(JSON.stringify(SEED_PRESCRIPTIONS)),
    adherenceLogs: JSON.parse(JSON.stringify(SEED_ADHERENCE_LOGS)),
    chatHistory: JSON.parse(JSON.stringify(SEED_CHAT)),
  };
}

export const store = global.__healthStore!;

/** Call this from /api/reset to restore the initial seed state */
export function resetStore(): void {
  const freshToday = new Date().toISOString().split('T')[0];
  const freshYesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const freshLogs: AdherenceLog[] = JSON.parse(JSON.stringify(SEED_ADHERENCE_LOGS));
  freshLogs.forEach((l) => {
    if (l.date === yesterday) l.date = freshYesterday;
    if (l.date === today) l.date = freshToday;
  });

  global.__healthStore = {
    patient: { ...SEED_PATIENT },
    prescriptions: JSON.parse(JSON.stringify(SEED_PRESCRIPTIONS)),
    adherenceLogs: freshLogs,
    chatHistory: [
      {
        id: 'init-1',
        sender: 'ai',
        text: 'Namaste! I am your AI Health Companion. I can help explain your medicines, check for drug interactions, schedule reminders in your preferred language, or help you contact your caregiver in emergencies. How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };
}
