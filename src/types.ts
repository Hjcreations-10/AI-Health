/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  dosage: string; // e.g. "1 Tablet", "5ml"
  frequency: string; // e.g. "1-0-1", "0-1-0", "1-0-0" (Morning, Afternoon, Evening/Night)
  instructions: string; // e.g. "After Breakfast", "Before Dinner", "With Milk"
  duration: string; // e.g. "30 Days", "Until Next Checkup"
  purpose: string; // e.g. "Controls Blood Sugar"
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
  date: string; // YYYY-MM-DD
  timeSlot: 'Morning' | 'Afternoon' | 'Evening'; // Morning (08:00), Afternoon (14:00), Evening (20:00)
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

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'bn';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  localName: string;
  greetings: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  labels: {
    taken: string;
    remindLater: string;
    medInfo: string;
    vitals: string;
    heartRate: string;
    spo2: string;
    fallDetected: string;
    areYouOk: string;
    emergencyTriggered: string;
    adherence: string;
    prescriptionWallet: string;
    aiHealthCard: string;
    timeline: string;
    hospital: string;
    pharmacy: string;
    caregiver: string;
    askAssistant: string;
  };
}
