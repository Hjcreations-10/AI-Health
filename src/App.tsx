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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4" id="ecosystem-loading">
        <div className="relative h-16 w-16 flex items-center justify-center">
          <span className="absolute inset-0 h-full w-full rounded-full border-4 border-slate-200" />
          <span className="absolute inset-0 h-full w-full rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
          <Activity className="h-6 w-6 text-indigo-600 absolute animate-heartbeat" />
        </div>
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-800 font-display">Synchronizing Healthcare Ecosystem...</h2>
          <p className="text-[11px] text-slate-500 font-mono tracking-wider uppercase mt-1">Connecting Patient Nodes, Wearables, and Clinic Terminals</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center space-y-4" id="ecosystem-error">
        <ShieldAlert className="h-14 w-14 text-rose-500 animate-bounce" />
        <h2 className="text-lg font-bold text-slate-800 font-display">{error}</h2>
        <button
          onClick={fetchEcosystemData}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all flex items-center space-x-1.5"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Server Synchronization</span>
        </button>
      </div>
    );
  }

  const isEmergencyActive = patient?.vitals.isEmergencyTriggered || patient?.vitals.isFallDetected;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16 relative" id="app-viewport">
      
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

      {/* Persistent ecosystem simulator control panel at the bottom center of screen */}
      <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white rounded-full px-5 py-2.5 shadow-xl border border-slate-800 flex items-center space-x-4 z-40 text-xs font-semibold backdrop-blur-md opacity-95">
        <span className="flex items-center space-x-1.5 text-[10px] uppercase font-mono tracking-wider text-indigo-400">
          <Activity className="h-3.5 w-3.5" />
          <span>AI Health Companion Ecosystem Simulator</span>
        </span>
        <span className="text-slate-600">|</span>
        <button
          onClick={handleResetEcosystem}
          className="text-slate-300 hover:text-white transition-all cursor-pointer font-mono text-[10px] uppercase tracking-wider flex items-center space-x-1"
          id="simulation-reset-btn"
        >
          <RefreshCw className="h-3 w-3 animate-spin [animation-duration:6s]" />
          <span>Reset Simulation State</span>
        </button>
      </footer>
    </div>
  );
}
