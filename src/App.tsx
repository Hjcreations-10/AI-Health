/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PatientApp from './components/PatientApp';
import Smartwatch from './components/Smartwatch';
import HospitalPortal from './components/HospitalPortal';
import PharmacyPortal from './components/PharmacyPortal';
import CaregiverDashboard from './components/CaregiverDashboard';
import VoiceAssistant from './components/VoiceAssistant';
import { Patient, Prescription, AdherenceLog, LanguageConfig, LanguageCode } from './types';
import { LANGUAGES } from './data';
import { Sparkles, Activity, ShieldAlert, Heart, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<string>('patient');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageConfig>(LANGUAGES[0]); // English default
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScanOnLoad, setAutoScanOnLoad] = useState<boolean>(false);

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  // Poll for SOS updates or real-time cross-view additions every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      silentFetchEcosystemData();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchEcosystemData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [patientRes, rxRes, logsRes] = await Promise.all([
        fetch('/api/patient'),
        fetch('/api/prescriptions'),
        fetch('/api/adherence-logs')
      ]);

      if (!patientRes.ok || !rxRes.ok || !logsRes.ok) {
        throw new Error('Ecosystem sync failure on server nodes');
      }

      const patientData = await patientRes.json();
      const rxData = await rxRes.json();
      const logsData = await logsRes.json();

      setPatient(patientData);
      setPrescriptions(rxData);
      setAdherenceLogs(logsData);
    } catch (err: any) {
      console.error('Error fetching ecosystem:', err);
      setError('Could not connect to the healthcare nodes. Check server terminal.');
    } finally {
      setIsLoading(false);
    }
  };

  const silentFetchEcosystemData = async () => {
    try {
      const [patientRes, rxRes, logsRes] = await Promise.all([
        fetch('/api/patient'),
        fetch('/api/prescriptions'),
        fetch('/api/adherence-logs')
      ]);

      if (patientRes.ok && rxRes.ok && logsRes.ok) {
        const patientData = await patientRes.json();
        const rxData = await rxRes.json();
        const logsData = await logsRes.json();

        setPatient(patientData);
        setPrescriptions(rxData);
        setAdherenceLogs(logsData);
      }
    } catch (err) {
      console.warn('Silent sync lookup interrupted');
    }
  };

  const handleChangeLanguage = (code: LanguageCode) => {
    const found = LANGUAGES.find(l => l.code === code);
    if (found) {
      setCurrentLanguage(found);
    }
  };

  const handleUpdateAdherence = async (logId: string, status: 'Taken' | 'Missed' | 'Pending') => {
    try {
      const res = await fetch('/api/adherence-logs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, status })
      });
      if (res.ok) {
        fetchEcosystemData();
      }
    } catch (err) {
      console.error('Adherence update failed:', err);
    }
  };

  const handleUpdateVitals = async (vitalsUpdate: Partial<Patient['vitals']>) => {
    try {
      const res = await fetch('/api/patient/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vitalsUpdate)
      });
      if (res.ok) {
        const updatedPatient = await res.json();
        setPatient(updatedPatient);
      }
    } catch (err) {
      console.error('Vitals transmission failed:', err);
    }
  };

  const handleAddPrescription = async (prescriptionData: {
    doctorName: string;
    specialty: string;
    hospitalName: string;
    diagnosis: string;
    medicines: any[];
  }) => {
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prescriptionData)
    });
    
    if (!res.ok) {
      throw new Error('Clinical prescription rejected by the network');
    }
    
    const data = await res.json();
    fetchEcosystemData();
    return data; // contains warnings and newly uploaded prescription
  };

  const handleFulfillPrescription = async (prescriptionId: string) => {
    const res = await fetch('/api/prescriptions/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionId })
    });
    
    if (!res.ok) {
      throw new Error('Prescription checkout failed');
    }
    
    fetchEcosystemData();
  };

  const handleClearEmergency = async () => {
    await handleUpdateVitals({ isEmergencyTriggered: false, isFallDetected: false });
  };

  const handleResetEcosystem = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await fetchEcosystemData();
      }
    } catch (err) {
      console.error('Reset ecosystem error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !patient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 space-y-8 bg-dots-pattern" id="ecosystem-loading">
        <div className="relative flex items-center justify-center">
          {/* Outer rings */}
          <span className="absolute h-32 w-32 rounded-full border border-indigo-500/20 animate-ring-expand" />
          <span className="absolute h-24 w-24 rounded-full border border-indigo-500/30 animate-ring-expand delay-300" />
          {/* Spinner */}
          <span className="absolute h-20 w-20 rounded-full border-2 border-indigo-900/50" />
          <span className="absolute h-20 w-20 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
          {/* Logo center */}
          <div className="relative h-14 w-14 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Activity className="h-7 w-7 text-white animate-heartbeat" />
          </div>
        </div>
        <div className="text-center space-y-2 animate-fade-in">
          <h2 className="text-lg font-bold font-display text-white">AI Health <span className="text-gradient-health">Companion</span></h2>
          <p className="text-[11px] text-slate-400 font-mono tracking-[0.2em] uppercase">Synchronizing Healthcare Ecosystem...</p>
          <div className="flex items-center justify-center space-x-1.5 pt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 typing-dot-1" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 typing-dot-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 typing-dot-3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-rose-950/30 to-slate-900 p-6 text-center space-y-6" id="ecosystem-error">
        <div className="glass-dark rounded-3xl p-10 space-y-5 max-w-md animate-fade-in border border-rose-500/20">
          <ShieldAlert className="h-14 w-14 text-rose-400 mx-auto animate-bounce" />
          <h2 className="text-lg font-bold text-white font-display">Connection Error</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={fetchEcosystemData}
            className="w-full px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 cursor-pointer transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Server Synchronization</span>
          </button>
        </div>
      </div>
    );
  }

  const isEmergencyActive = patient?.vitals.isEmergencyTriggered || patient?.vitals.isFallDetected;

  return (
    <div className="min-h-screen text-slate-900 pb-20 relative" style={{background: 'linear-gradient(145deg, #eef2ff 0%, #f0f7ff 35%, #fafafa 70%, #f0fdf4 100%)'}} id="app-viewport">
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      
      {/* Universal Shared Header Switcher */}
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        systemAlert={isEmergencyActive || false}
        onTriggerAlertReset={handleClearEmergency}
      />

      {/* Main View Area with transition logic */}
      <main className="animate-fade-in py-2">
        {currentRole === 'patient' && patient && (
          <PatientApp
            patient={patient}
            prescriptions={prescriptions}
            adherenceLogs={adherenceLogs}
            languages={LANGUAGES}
            currentLanguage={currentLanguage}
            onChangeLanguage={handleChangeLanguage}
            onUpdateAdherence={handleUpdateAdherence}
            onRefreshData={silentFetchEcosystemData}
          />
        )}

        {currentRole === 'watch' && patient && (
          <Smartwatch
            patient={patient}
            prescriptions={prescriptions}
            adherenceLogs={adherenceLogs}
            currentLanguage={currentLanguage}
            onUpdateAdherence={handleUpdateAdherence}
            onUpdateVitals={handleUpdateVitals}
            onRefreshData={silentFetchEcosystemData}
          />
        )}

        {currentRole === 'hospital' && patient && (
          <HospitalPortal
            patient={patient}
            prescriptions={prescriptions}
            onAddPrescription={handleAddPrescription}
            onRefreshAll={fetchEcosystemData}
            autoScanOnLoad={autoScanOnLoad}
            onResetAutoScan={() => setAutoScanOnLoad(false)}
          />
        )}

        {currentRole === 'pharmacy' && (
          <PharmacyPortal
            prescriptions={prescriptions}
            onFulfillPrescription={handleFulfillPrescription}
            onRefreshAll={fetchEcosystemData}
          />
        )}

        {currentRole === 'caregiver' && patient && (
          <CaregiverDashboard
            patient={patient}
            prescriptions={prescriptions}
            adherenceLogs={adherenceLogs}
            onRefreshAll={fetchEcosystemData}
            onClearEmergency={handleClearEmergency}
          />
        )}
      </main>

      {/* Global AI Hands-Free Voice Assistant Companion */}
      <VoiceAssistant
        currentLanguage={currentLanguage}
        onChangeLanguage={handleChangeLanguage}
        onScanTrigger={() => {
          setCurrentRole('hospital');
          setAutoScanOnLoad(true);
        }}
        onEmergencyTrigger={() => {
          handleUpdateVitals({ isEmergencyTriggered: true, isFallDetected: true });
        }}
        onMarkTaken={() => {
          const todayStr = new Date().toISOString().split('T')[0];
          const firstPendingLog = adherenceLogs.find(log => log.date === todayStr && log.status === 'Pending') || null;
          if (firstPendingLog) {
            handleUpdateAdherence(firstPendingLog.id, 'Taken');
          }
        }}
        activeAlert={adherenceLogs.find(log => log.date === new Date().toISOString().split('T')[0] && log.status === 'Pending') || null}
        patient={patient}
      />

      {/* Persistent ecosystem simulator control panel */}
      <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 glass-dark rounded-2xl px-5 py-3 shadow-2xl shadow-black/20 flex items-center space-x-4 z-40 text-xs font-semibold border border-white/10" id="sim-footer">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-lg">
            <Activity className="h-3 w-3 text-white" />
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">AI Health Ecosystem Simulator</span>
        </div>
        <span className="text-slate-700">|</span>
        <button
          onClick={handleResetEcosystem}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition-all cursor-pointer font-mono text-[10px] uppercase tracking-wider group"
          id="simulation-reset-btn"
        >
          <RefreshCw className="h-3 w-3 group-hover:animate-spin" />
          <span>Reset State</span>
        </button>
      </footer>
    </div>
  );
}
