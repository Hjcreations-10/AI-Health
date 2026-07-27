var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/patient/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => handler
});
module.exports = __toCommonJS(index_exports);

// api/_store.ts
var SEED_PATIENT = {
  id: "AIH-882-901-IN",
  name: "Devendra Prasad",
  age: 72,
  gender: "Male",
  bloodGroup: "O+",
  emergencyContactName: "Rajesh Prasad",
  emergencyContactPhone: "+91 98765 43210",
  emergencyContactRelation: "Son (Primary Caregiver)",
  chronicDiseases: ["Type 2 Diabetes", "Hypertension (High Blood Pressure)"],
  allergies: ["Penicillin", "Sulfa Drugs"],
  vitals: {
    heartRate: 72,
    spo2: 98,
    lastUpdated: "Just now",
    isFallDetected: false,
    isEmergencyTriggered: false
  }
};
var SEED_PRESCRIPTIONS = [
  {
    id: "PR-2026-0041",
    date: "2026-06-15",
    doctorName: "Dr. Anjali Mehta",
    specialty: "Cardiologist",
    hospitalName: "Apollo Hospitals, Hyderabad",
    diagnosis: "Primary Hypertension & Diabetic Cardioprotection",
    isFulfilled: true,
    fulfillmentDate: "2026-06-15",
    medicines: [
      {
        id: "M-001",
        name: "Metformin XR (500mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1",
        instructions: "After Food",
        duration: "90 Days",
        purpose: "Lowers blood sugar levels by improving insulin sensitivity.",
        sideEffects: "Mild nausea, stomach upset on empty stomach.",
        refillRemaining: 14,
        totalDays: 90,
        startDate: "2026-06-15",
        prescribedBy: "Dr. Anjali Mehta",
        hospital: "Apollo Hospitals, Hyderabad"
      },
      {
        id: "M-002",
        name: "Telmisartan (40mg)",
        dosage: "1 Tablet",
        frequency: "1-0-0",
        instructions: "Before Breakfast",
        duration: "90 Days",
        purpose: "Relaxes blood vessels to lower blood pressure and protect kidneys.",
        sideEffects: "Lightheadedness, dry throat.",
        refillRemaining: 18,
        totalDays: 90,
        startDate: "2026-06-15",
        prescribedBy: "Dr. Anjali Mehta",
        hospital: "Apollo Hospitals, Hyderabad"
      }
    ]
  },
  {
    id: "PR-2026-0089",
    date: "2026-06-22",
    doctorName: "Dr. S. K. Nair",
    specialty: "Geriatric Generalist",
    hospitalName: "Narayana Health, Bangalore",
    diagnosis: "Mild Osteoarthritis & Calcium Deficiency",
    isFulfilled: false,
    medicines: [
      {
        id: "M-003",
        name: "Calcium + Vitamin D3",
        dosage: "1 Capsule",
        frequency: "0-1-0",
        instructions: "After Lunch",
        duration: "30 Days",
        purpose: "Strengthens bones and improves calcium absorption.",
        sideEffects: "Constipation if fluid intake is low.",
        refillRemaining: 30,
        totalDays: 30,
        startDate: "2026-06-22",
        prescribedBy: "Dr. S. K. Nair",
        hospital: "Narayana Health, Bangalore"
      },
      {
        id: "M-004",
        name: "Glucosamine Sulfate (500mg)",
        dosage: "1 Tablet",
        frequency: "0-0-1",
        instructions: "After Dinner",
        duration: "30 Days",
        purpose: "Supports joint cartilage health and reduces knee pain.",
        sideEffects: "Mild digestive gas.",
        refillRemaining: 30,
        totalDays: 30,
        startDate: "2026-06-22",
        prescribedBy: "Dr. S. K. Nair",
        hospital: "Narayana Health, Bangalore"
      }
    ]
  }
];
var today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
var yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
var SEED_ADHERENCE_LOGS = [
  // Yesterday's logs (completed)
  { id: "l-001", date: yesterday, timeSlot: "Morning", medicineId: "M-001", medicineName: "Metformin XR (500mg)", status: "Taken", timestamp: "08:15 AM" },
  { id: "l-002", date: yesterday, timeSlot: "Morning", medicineId: "M-002", medicineName: "Telmisartan (40mg)", status: "Taken", timestamp: "07:45 AM" },
  { id: "l-003", date: yesterday, timeSlot: "Afternoon", medicineId: "M-003", medicineName: "Calcium + Vitamin D3", status: "Taken", timestamp: "01:40 PM" },
  { id: "l-004", date: yesterday, timeSlot: "Evening", medicineId: "M-001", medicineName: "Metformin XR (500mg)", status: "Taken", timestamp: "08:22 PM" },
  { id: "l-005", date: yesterday, timeSlot: "Evening", medicineId: "M-004", medicineName: "Glucosamine Sulfate (500mg)", status: "Taken", timestamp: "08:30 PM" },
  // Today's logs (in progress)
  { id: "l-006", date: today, timeSlot: "Morning", medicineId: "M-001", medicineName: "Metformin XR (500mg)", status: "Taken", timestamp: "08:10 AM" },
  { id: "l-007", date: today, timeSlot: "Morning", medicineId: "M-002", medicineName: "Telmisartan (40mg)", status: "Taken", timestamp: "07:55 AM" },
  { id: "l-008", date: today, timeSlot: "Afternoon", medicineId: "M-003", medicineName: "Calcium + Vitamin D3", status: "Pending" },
  { id: "l-009", date: today, timeSlot: "Evening", medicineId: "M-001", medicineName: "Metformin XR (500mg)", status: "Pending" },
  { id: "l-010", date: today, timeSlot: "Evening", medicineId: "M-004", medicineName: "Glucosamine Sulfate (500mg)", status: "Pending" }
];
var SEED_CHAT = [
  {
    id: "init-1",
    sender: "ai",
    text: "Namaste! I am your AI Health Companion. I can help explain your medicines, check for drug interactions, schedule reminders in your preferred language, or help you contact your caregiver in emergencies. How can I help you today?",
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
];
if (!global.__healthStore) {
  global.__healthStore = {
    patient: { ...SEED_PATIENT },
    prescriptions: JSON.parse(JSON.stringify(SEED_PRESCRIPTIONS)),
    adherenceLogs: JSON.parse(JSON.stringify(SEED_ADHERENCE_LOGS)),
    chatHistory: JSON.parse(JSON.stringify(SEED_CHAT))
  };
}
var store = global.__healthStore;

// api/patient/index.ts
function handler(req, res) {
  if (req.method === "GET") {
    return res.json(store.patient);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
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
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GET /api/patient — Returns current patient state
 * POST /api/patient/vitals — Updates patient vitals
 */
