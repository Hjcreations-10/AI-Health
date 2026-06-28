/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Patient, Prescription, AdherenceLog } from '../types';
import { 
  Users, 
  Activity, 
  Heart, 
  ShieldAlert, 
  AlertCircle, 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  UserCheck, 
  PhoneCall, 
  CheckCircle2,
  MapPin,
  CalendarDays
} from 'lucide-react';

interface CaregiverDashboardProps {
  patient: Patient;
  prescriptions: Prescription[];
  adherenceLogs: AdherenceLog[];
  onRefreshAll: () => void;
  onClearEmergency: () => void;
}

export default function CaregiverDashboard({
  patient,
  prescriptions,
  adherenceLogs,
  onRefreshAll,
  onClearEmergency,
}: CaregiverDashboardProps) {
  
  // Calculate Adherence Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = adherenceLogs.filter(l => l.date === todayStr);
  const takenCount = todaysLogs.filter(l => l.status === 'Taken').length;
  const totalCount = todaysLogs.length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;
  
  // Overall Adherence rate calculation over all logs
  const totalLogsCount = adherenceLogs.length;
  const takenLogsCount = adherenceLogs.filter(l => l.status === 'Taken').length;
  const missedLogsCount = adherenceLogs.filter(l => l.status === 'Missed').length;
  const overallAdherence = totalLogsCount > 0 ? Math.round((takenLogsCount / (takenLogsCount + missedLogsCount || 1)) * 100) : 100;

  // Find missed dose warning records
  const missedDoseAlarms = adherenceLogs.filter(l => l.status === 'Missed').slice(-3).reverse();

  // Find low refills medicines
  const refillRequiredMeds: { medName: string; remaining: number; total: number; rxId: string }[] = [];
  prescriptions.forEach(p => {
    if (p.isFulfilled) {
      p.medicines.forEach(m => {
        if (m.refillRemaining <= 18) { // Simulate threshold
          refillRequiredMeds.push({
            medName: m.name,
            remaining: m.refillRemaining,
            total: m.totalDays,
            rxId: p.id
          });
        }
      });
    }
  });

  const isEmergencyActive = patient.vitals.isEmergencyTriggered || patient.vitals.isFallDetected;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="caregiver-dashboard">
      
      {/* 1. SEVERE EMERGENCY ALERT OVERLAY CARD */}
      {isEmergencyActive && (
        <div className="p-6 bg-rose-600 text-white rounded-[28px] border border-rose-500 shadow-xl shadow-rose-200/20 animate-pulse-ring space-y-4" id="caregiver-sos-alarm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white text-rose-600 rounded-2xl shadow-md">
                <ShieldAlert className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg tracking-wide uppercase">
                  CRITICAL EMERGENCY ALARM IN PROGRESS
                </h3>
                <p className="text-xs text-rose-100 font-semibold mt-0.5">
                  Type: {patient.vitals.isFallDetected ? 'Sudden Physical Fall Detected' : 'Manual SOS Triggered via Smartwatch'}
                </p>
              </div>
            </div>

            <button
              onClick={onClearEmergency}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              id="caregiver-sos-resolve-btn"
            >
              Mark Patient Safe
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-rose-200 uppercase tracking-wider font-mono text-[9px] font-bold block">Patient Identity</span>
              <strong className="text-sm block">{patient.name} (Age {patient.age})</strong>
              <span className="text-rose-100 text-[11px] block">Conditions: Diabetes, Hypertension</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-rose-200 uppercase tracking-wider font-mono text-[9px] font-bold block">Active Location Feed</span>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4 text-rose-300" />
                <span className="text-[11px] font-bold text-white tracking-wide">Lat: 17.3850° N, Lon: 78.4867° E</span>
              </div>
              <span className="text-rose-100 text-[11px] block">(Hyderabad, India)</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-rose-200 uppercase tracking-wider font-mono text-[9px] font-bold block">Emergency Contact Dial</span>
              <a 
                href={`tel:${patient.emergencyContactPhone}`}
                className="flex items-center space-x-1.5 text-[11px] font-bold hover:underline"
              >
                <PhoneCall className="h-4.5 w-4.5 text-rose-300 animate-pulse" />
                <span>Call Responder Node ({patient.emergencyContactPhone})</span>
              </a>
              <span className="text-rose-100 text-[11px] block">Relation: {patient.emergencyContactRelation}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Vitals Monitoring & Adherence Metrics */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Adherence Graph Summary */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-6" id="caregiver-adherence-card">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Elderly Compliance Performance</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Remote monitoring of medicine ingestion adherence. Target: &gt;90%.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-mono font-bold text-sm">{overallAdherence}% Adherence</span>
              </div>
            </div>

            {/* Custom SVG Adherence Timeline Bar Graph */}
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                <span>Ingestion Compliance (Last 5 Days)</span>
                <span className="text-emerald-600 font-semibold">96% Average</span>
              </div>

              <div className="grid grid-cols-5 gap-3.5 h-36 items-end pt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {[
                  { day: 'Tue', rate: 100, pills: '5/5 taken' },
                  { day: 'Wed', rate: 80, pills: '4/5 taken' },
                  { day: 'Thu', rate: 100, pills: '5/5 taken' },
                  { day: 'Fri', rate: 100, pills: '5/5 taken' },
                  { day: 'Sat', rate: adherenceRate, pills: `${takenCount}/${totalCount} checked` }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-2 h-full justify-end">
                    <div className="text-[10px] font-mono font-bold text-slate-500">{item.rate}%</div>
                    {/* Simulated bar */}
                    <div className="w-full max-w-[42px] bg-blue-100 hover:bg-blue-200 rounded-md relative transition-all" style={{ height: `${item.rate}%` }}>
                      <div className="absolute inset-0 bg-blue-600 hover:bg-blue-700 rounded-md transition-all duration-300" style={{ height: `${item.rate}%` }} />
                    </div>
                    <div className="text-[11px] font-bold text-slate-700">{item.day}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Total Doses</span>
                  <strong className="text-slate-800 text-sm font-mono mt-0.5 block">{takenLogsCount + missedLogsCount}</strong>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100">
                  <span className="text-emerald-700 block font-medium">Ingested Doses</span>
                  <strong className="text-emerald-800 text-sm font-mono mt-0.5 block">{takenLogsCount}</strong>
                </div>
                <div className="p-3 bg-rose-50 text-rose-800 rounded-2xl border border-rose-100">
                  <span className="text-rose-700 block font-medium">Missed Doses</span>
                  <strong className="text-rose-800 text-sm font-mono mt-0.5 block">{missedLogsCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Smartwatch Realtime Vitals Tracker */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4" id="caregiver-vitals-feed">
            <h3 className="font-display font-bold text-base text-slate-800">Smartwatch Telemetry Feed</h3>
            <p className="text-xs text-slate-500">
              Live vitals relayed from the patient's companion wearable device over cellular cloud networks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Heart rate monitor card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">Heart Rate</span>
                  <div className="flex items-baseline space-x-1.5">
                    <strong className="text-2xl font-mono tracking-tight text-slate-800">
                      {isEmergencyActive ? 112 : patient.vitals.heartRate}
                    </strong>
                    <span className="text-xs text-slate-500 font-semibold">BPM</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Status: {isEmergencyActive ? 'Tachycardia Warning' : 'Normal / Rested'}</span>
                </div>

                <div className={`p-3 bg-rose-50/50 text-rose-500 rounded-2xl border border-rose-100/50 ${isEmergencyActive ? 'animate-pulse-ring' : ''}`}>
                  <Heart className="h-7 w-7 animate-heartbeat" />
                </div>
              </div>

              {/* SpO2 level card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">Oxygen Saturation</span>
                  <div className="flex items-baseline space-x-1.5">
                    <strong className="text-2xl font-mono tracking-tight text-slate-800">{patient.vitals.spo2}%</strong>
                    <span className="text-xs text-slate-500 font-semibold">SpO2</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Status: {patient.vitals.spo2 < 95 ? 'Hypoxia Alert' : 'Normal'}</span>
                </div>

                <div className="p-3 bg-emerald-50/50 text-emerald-500 rounded-2xl border border-emerald-100/50">
                  <Activity className="h-7 w-7" />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Warning Notifications & Low Refills Alarms */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Missed Dose Alarms */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4" id="caregiver-missed-alarms">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-400 font-mono">
              Adherence Alarms
            </h3>

            <div className="space-y-3 text-xs">
              {missedDoseAlarms.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 font-medium">
                  No missed dose alarms recorded today. Great compliance!
                </div>
              ) : (
                missedDoseAlarms.map((alarm) => (
                  <div key={alarm.id} className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center font-bold text-[10px] font-mono text-rose-600">
                      <span>{alarm.date}</span>
                      <span>{alarm.timeSlot}</span>
                    </div>
                    <strong className="text-slate-800 block text-xs">Missed: {alarm.medicineName}</strong>
                    <p className="text-[11px] text-slate-500">
                      The patient did not confirm ingestion within the 1-hour alarm window.
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Refill Refuels Needed Tracker */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-4" id="caregiver-refill-tracker">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-400 font-mono">
              Predictive Refill Alarms
            </h3>

            <div className="space-y-3 text-xs">
              {refillRequiredMeds.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 font-medium">
                  All active medications fully refueled.
                </div>
              ) : (
                refillRequiredMeds.map((med, idx) => {
                  const percentageLeft = Math.round((med.remaining / med.total) * 100);
                  const isLow = med.remaining <= 15;
                  
                  return (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-800 text-xs block truncate max-w-[150px]">{med.medName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">Rx: {med.rxId}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isLow ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {med.remaining} days left
                        </span>
                      </div>

                      {/* progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${isLow ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${percentageLeft}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">AI Refill Alert Active</span>
                        <button
                          onClick={onRefreshAll}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Refill Order
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
