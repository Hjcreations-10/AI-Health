/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Patient, 
  Prescription, 
  AdherenceLog, 
  LanguageConfig 
} from '../types';
import { 
  Heart, 
  BellRing, 
  Watch, 
  ShieldCheck, 
  Smartphone, 
  AlertOctagon, 
  MapPin, 
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
  Volume2,
  VolumeX
} from 'lucide-react';
import MedicineVisual from './MedicineVisual';
import { speakText, stopSpeech } from '../utils/speech';

interface SmartwatchProps {
  patient: Patient;
  prescriptions: Prescription[];
  adherenceLogs: AdherenceLog[];
  currentLanguage: LanguageConfig;
  onUpdateAdherence: (logId: string, status: 'Taken' | 'Missed' | 'Pending') => void;
  onUpdateVitals: (vitals: Partial<Patient['vitals']>) => void;
  onRefreshData: () => void;
}

export default function Smartwatch({
  patient,
  prescriptions,
  adherenceLogs,
  currentLanguage,
  onUpdateAdherence,
  onUpdateVitals,
  onRefreshData,
}: SmartwatchProps) {
  const [fallCountdown, setFallCountdown] = useState<number | null>(null);
  const [activeAlert, setActiveAlert] = useState<AdherenceLog | null>(null);
  const [watchScreen, setWatchScreen] = useState<'vitals' | 'alert' | 'emergency'>('vitals');
  const [simulatedHeartRate, setSimulatedHeartRate] = useState(72);
  const [simulatedSpO2, setSimulatedSpO2] = useState(98);
  const [explainingMedText, setExplainingMedText] = useState<string | null>(null);
  const [isSpeakingText, setIsSpeakingText] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stop voice when switching watch screen or alert changes
  useEffect(() => {
    stopSpeech();
    setIsSpeakingText(false);
  }, [watchScreen, activeAlert]);

  // Vitals simulation loops
  useEffect(() => {
    const heartRateInterval = setInterval(() => {
      // Simulate normal minor variation
      const drift = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const isSOS = patient.vitals.isEmergencyTriggered || fallCountdown !== null;
      const targetBase = isSOS ? 112 : 72;
      
      setSimulatedHeartRate(prev => {
        let next = prev + drift;
        if (isSOS) {
          next = Math.max(95, Math.min(130, next));
        } else {
          next = Math.max(60, Math.min(88, next));
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(heartRateInterval);
  }, [patient.vitals.isEmergencyTriggered, fallCountdown]);

  // Find active pending alerts
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingToday = adherenceLogs.find(l => l.date === todayStr && l.status === 'Pending');
    if (pendingToday) {
      const isNewAlert = !activeAlert || activeAlert.id !== pendingToday.id || watchScreen !== 'alert';
      setActiveAlert(pendingToday);
      setWatchScreen('alert');
      
      if (isNewAlert) {
        // Automatically speak out the alert so they can hear the voice notification!
        speakAlertText(pendingToday);
      }
    } else {
      setActiveAlert(null);
      if (watchScreen === 'alert') {
        setWatchScreen('vitals');
      }
    }
  }, [adherenceLogs]);

  // Fall detection countdown trigger
  useEffect(() => {
    if (patient.vitals.isFallDetected && fallCountdown === null) {
      setFallCountdown(10);
      setWatchScreen('emergency');
    } else if (!patient.vitals.isFallDetected) {
      setFallCountdown(null);
      if (watchScreen === 'emergency') {
        setWatchScreen('vitals');
      }
    }
  }, [patient.vitals.isFallDetected]);

  // Fall countdown countdown decrease
  useEffect(() => {
    if (fallCountdown !== null && fallCountdown > 0) {
      const timer = setTimeout(() => {
        setFallCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (fallCountdown === 0) {
      // Trigger full SOS alert
      onUpdateVitals({ isEmergencyTriggered: true, isFallDetected: false });
      setFallCountdown(null);
    }
  }, [fallCountdown]);

  // Push vitals updates back to patient context
  useEffect(() => {
    onUpdateVitals({ heartRate: simulatedHeartRate, spo2: simulatedSpO2 });
  }, [simulatedHeartRate, simulatedSpO2]);

  const handleTakenOnWatch = (logId: string) => {
    onUpdateAdherence(logId, 'Taken');
    setWatchScreen('vitals');
  };

  const handlePostponeAlert = () => {
    // Simply clear/postpone watch alert visual
    setWatchScreen('vitals');
  };

  function speakAlertText(alert: AdherenceLog) {
    let medInstructions = "Take exactly as directed.";
    prescriptions.forEach(p => {
      const match = p.medicines.find(m => m.name === alert.medicineName);
      if (match) {
        medInstructions = `${match.instructions || "Take exactly as directed"}.`;
      }
    });

    const speechMessage = `Reminding you to take ${alert.medicineName}. ${medInstructions}`;
    setIsSpeakingText(true);
    speakText(
      speechMessage,
      currentLanguage.name,
      () => setIsSpeakingText(true),
      () => setIsSpeakingText(false)
    );
  }

  const handleSpeakText = (text: string) => {
    setIsSpeakingText(true);
    speakText(
      text,
      currentLanguage.name,
      () => setIsSpeakingText(true),
      () => setIsSpeakingText(false)
    );
  };

  const handleGetMedInfo = async (medName: string) => {
    setExplainingMedText("Analyzing pharmacological properties...");
    // Find matching medicine dosage & purpose
    let medDosage = "1 tablet";
    let medPurpose = "Standard clinical dosage";
    prescriptions.forEach(p => {
      const match = p.medicines.find(m => m.name === medName);
      if (match) {
        medDosage = match.dosage;
        medPurpose = match.purpose;
      }
    });

    try {
      const res = await fetch('/api/gemini/explain-med', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: medName, dosage: medDosage, purpose: medPurpose, lang: currentLanguage.name })
      });
      const data = await res.json();
      if (data.explanation) {
        setExplainingMedText(data.explanation);
        // Automatically speak the explanation for hands-free convenience!
        speakText(
          data.explanation,
          currentLanguage.name,
          () => setIsSpeakingText(true),
          () => setIsSpeakingText(false)
        );
      }
    } catch (err) {
      const fallback = `${medName} handles cardiac & glucose care. Take exactly as prescribed.`;
      setExplainingMedText(fallback);
      speakText(
        fallback,
        currentLanguage.name,
        () => setIsSpeakingText(true),
        () => setIsSpeakingText(false)
      );
    }
  };

  const isEmergencyActive = patient.vitals.isEmergencyTriggered || patient.vitals.isFallDetected;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8" id="smartwatch-viewport">
      
      {/* LEFT CONTENT: Watch Frame Representation */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4 py-8">
        <h3 className="font-display font-bold text-slate-800 text-sm uppercase tracking-widest font-mono">
          Smartwatch Wear OS Simulator
        </h3>

        {/* Real Smartwatch Outer Frame */}
        <div className={`relative w-80 h-96 bg-slate-900 rounded-[50px] shadow-2xl border-[12px] border-slate-800 flex flex-col items-center justify-center p-3 overflow-hidden ring-4 transition-all duration-500 ${isEmergencyActive ? 'ring-rose-500/80 glow-red animate-pulse' : 'ring-slate-700/50 glow-blue'}`} id="watch-hardware-frame">
          
          {/* Watch Glass glare overlay */}
          <div className="absolute top-0 left-0 w-full h-full bg-linear-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none rounded-[36px]" />

          {/* Watch Core Screen */}
          <div className="w-full h-full bg-black rounded-[32px] flex flex-col justify-between p-5 text-white relative font-sans">
            
            {/* Watch Top Row Status */}
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-b border-slate-800/60 pb-1 mb-1">
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5" />
                <span className="font-bold text-emerald-400">Live Active</span>
              </span>
              <span>10:30 AM</span>
            </div>

            {/* Micro Vitals Bar (BP, Sugar, Session HR) */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950/80 border border-slate-800/50 py-1 px-1.5 rounded-lg text-[8px] font-mono text-slate-300 text-center">
              <div>
                <span className="text-slate-500 block text-[6.5px] uppercase tracking-wider scale-90">BP</span>
                <span className="font-bold text-slate-200">120/80</span>
              </div>
              <div className="border-x border-slate-800/80">
                <span className="text-slate-500 block text-[6.5px] uppercase tracking-wider scale-90">Sugar</span>
                <span className="font-bold text-slate-200">104 mg</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[6.5px] uppercase tracking-wider scale-90">Session HR</span>
                <span className="font-bold text-rose-400">{patient.vitals.isEmergencyTriggered ? 112 : simulatedHeartRate}</span>
              </div>
            </div>

            {/* SCREEN 1: Standard Vitals Display */}
            {watchScreen === 'vitals' && (
              <div className="flex-1 flex flex-col justify-center space-y-3 py-2">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Namaste, {patient.name.split(' ')[0]}</p>
                  <p className="text-[10px] font-semibold text-emerald-400 mt-0.5">All Vitals Protected</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center space-y-0.5">
                    <Heart className="h-4.5 w-4.5 text-rose-500 mx-auto animate-heartbeat" />
                    <span className="text-sm font-bold font-mono tracking-tight block">
                      {patient.vitals.isEmergencyTriggered ? 112 : simulatedHeartRate}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">HR (Session)</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center space-y-0.5">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 mx-auto" />
                    <span className="text-sm font-bold font-mono tracking-tight block">
                      {simulatedSpO2}%
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">SpO2 Level</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center space-y-0.5">
                    <div className="text-[10px] text-blue-400 font-bold mx-auto leading-none mb-1">BP</div>
                    <span className="text-sm font-bold font-mono tracking-tight block">
                      120/80
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">Pressure</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center space-y-0.5">
                    <div className="text-[10px] text-amber-400 font-bold mx-auto leading-none mb-1">SUGAR</div>
                    <span className="text-sm font-bold font-mono tracking-tight block">
                      104
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">Control Rate</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="inline-block text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    GPS: 17.3850° N, 78.4867° E
                  </span>
                </div>
              </div>
            )}

            {/* SCREEN 2: Pill Reminders */}
            {watchScreen === 'alert' && activeAlert && (() => {
              const activeInstructions = prescriptions
                .flatMap(p => p.medicines)
                .find(m => m.name === activeAlert.medicineName)?.instructions || "Take exactly as directed by doctor.";
              
              return (
                <div className="flex-1 flex flex-col justify-between py-1 bg-slate-950 rounded-2xl p-2.5 border border-amber-500/20">
                  <div className="text-center space-y-0.5">
                    <div className="flex items-center justify-center space-x-1.5 text-amber-400 text-[9px] font-bold uppercase tracking-wider font-mono">
                      <BellRing className="h-3 w-3 animate-bounce" />
                      <span>Medicine Alert</span>
                    </div>
                    <h4 className="font-bold text-xs tracking-wide text-slate-100 truncate max-w-[190px] mx-auto">
                      {activeAlert.medicineName}
                    </h4>
                    <p className="text-[9px] text-slate-400">
                      Slot: <strong className="text-slate-200">{activeAlert.timeSlot}</strong>
                    </p>
                  </div>

                  {/* High Contrast Medicine Picture for the watch screen */}
                  <div className="flex justify-center my-0.5 transform scale-[0.8]">
                    <MedicineVisual name={activeAlert.medicineName} size="sm" />
                  </div>

                  {/* Info Text & Narrator button */}
                  <div className="bg-slate-900 p-1.5 rounded-xl text-[10px] text-slate-300 border border-slate-800 text-center flex flex-col items-center space-y-1">
                    <span className="leading-snug block text-[9px] text-slate-200 font-medium">
                      {activeInstructions}
                    </span>
                    <button
                      onClick={() => speakAlertText(activeAlert)}
                      className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[8px] font-bold font-mono transition-all cursor-pointer border ${
                        isSpeakingText 
                          ? 'bg-rose-600/30 text-rose-300 border-rose-500/20 animate-pulse'
                          : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white border-blue-500/20'
                      }`}
                      id="watch-hear-voice-btn"
                    >
                      <Volume2 className="h-2.5 w-2.5" />
                      <span>{isSpeakingText ? 'Speaking...' : '🔊 Hear Voice'}</span>
                    </button>
                  </div>

                  {/* Interaction Actions */}
                  <div className="space-y-1">
                    <button
                      onClick={() => handleTakenOnWatch(activeAlert.id)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                      id="watch-take-btn"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{currentLanguage.labels.taken}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={handlePostponeAlert}
                        className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded-lg cursor-pointer"
                      >
                        {currentLanguage.labels.remindLater}
                      </button>
                      <button
                        onClick={() => {
                          handleGetMedInfo(activeAlert.medicineName);
                        }}
                        className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-semibold rounded-lg cursor-pointer"
                      >
                        {currentLanguage.labels.medInfo}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SCREEN 3: Emergency Fall countdown or alarm */}
            {watchScreen === 'emergency' && (
              <div className="flex-1 flex flex-col justify-between py-3">
                <div className="text-center space-y-2">
                  <AlertOctagon className="h-10 w-10 text-rose-500 mx-auto animate-bounce" />
                  
                  {fallCountdown !== null ? (
                    <>
                      <h4 className="font-display font-bold text-sm text-rose-400">FALL DETECTED</h4>
                      <p className="text-xs text-slate-300">
                        {currentLanguage.labels.areYouOk}
                      </p>
                      <div className="h-12 w-12 rounded-full border-4 border-rose-500 flex items-center justify-center mx-auto font-mono text-lg font-bold text-rose-400 mt-2">
                        {fallCountdown}
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="font-display font-bold text-sm text-rose-500">SOS TRIGGERED</h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        Alerting primary caregiver Rajesh Prasad immediately.
                      </p>
                      <p className="text-[9px] font-mono text-blue-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md inline-block">
                        GPS Coordinates Dispatched
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      onUpdateVitals({ isFallDetected: false, isEmergencyTriggered: false });
                      setFallCountdown(null);
                      setWatchScreen('vitals');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                    id="watch-dismiss-btn"
                  >
                    I am Okay (Cancel Alert)
                  </button>
                </div>
              </div>
            )}

            {/* Watch Screen Footer Indicator */}
            <div className="flex justify-center items-center space-x-1.5 pt-2">
              <span className={`h-1 w-3 rounded-full ${watchScreen === 'vitals' ? 'bg-blue-500' : 'bg-slate-700'}`} />
              <span className={`h-1 w-3 rounded-full ${watchScreen === 'alert' ? 'bg-blue-500' : 'bg-slate-700'}`} />
              <span className={`h-1 w-3 rounded-full ${watchScreen === 'emergency' ? 'bg-blue-500' : 'bg-slate-700'}`} />
            </div>

          </div>
        </div>

        {/* Outer watch band decors */}
        <div className="w-16 h-12 bg-slate-800 rounded-b-xl border-x-4 border-slate-700/60 shadow-sm" />
      </div>

      {/* RIGHT CONTENT: Control Panels for the Wearable */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Hardware / Sensor Controls simulation panel */}
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100/80 shadow-premium p-6 space-y-6 hover-lift" id="watch-sensors-controls">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800">Smartwatch Sensor Controls</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate standard smartwatch hardware actions and medical situations to trigger alarms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Fall Simulator Trigger */}
            <div className="p-4 bg-slate-50/50 backdrop-blur-xs rounded-xl border border-slate-200/80 space-y-3 hover-lift shadow-xs">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <AlertOctagon className="h-4.5 w-4.5" />
                <span>Simulate Fall Event</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                elderly patients often fail to call for help after falls. Click below to simulate a sudden physical fall detection.
              </p>
              <button
                disabled={patient.vitals.isFallDetected || patient.vitals.isEmergencyTriggered}
                onClick={() => {
                  onUpdateVitals({ isFallDetected: true });
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  patient.vitals.isFallDetected
                    ? 'bg-slate-200 text-slate-400 border-0 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-premium glow-red'
                }`}
                id="sensor-trigger-fall-btn"
              >
                <span>Trigger Sudden Fall Sensor</span>
              </button>
            </div>

            {/* Abnormal Heart rate simulator */}
            <div className="p-4 bg-slate-50/50 backdrop-blur-xs rounded-xl border border-slate-200/80 space-y-3 hover-lift shadow-xs">
              <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
                <Heart className="h-4.5 w-4.5" />
                <span>Simulate Vitals Drift</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Elderly cardiac monitoring can experience sudden drifts. Force vital stats into critical alarms.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSimulatedHeartRate(118);
                    setSimulatedSpO2(91); // Force bad vitals
                  }}
                  className="py-2 bg-blue-50/80 border border-blue-200/60 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition-all hover-lift"
                  id="vitals-drift-cardiac"
                >
                  Cardiac Spike (118)
                </button>
                <button
                  onClick={() => {
                    setSimulatedHeartRate(71);
                    setSimulatedSpO2(98); // Restore normal
                  }}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all hover-lift"
                  id="vitals-drift-normal"
                >
                  Restore Normal
                </button>
              </div>
            </div>

          </div>

          {/* AI Wearable Medicine Explanations Feed from the watch */}
          {explainingMedText && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-blue-500/30 space-y-2.5 animate-fadeIn">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div className="flex items-center space-x-1.5 text-blue-400">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">Watch-Requested AI Medicine Explainer</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleSpeakText(explainingMedText)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold border border-blue-500/20 cursor-pointer transition-all"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>🔊 Speak</span>
                  </button>
                  <button 
                    onClick={() => {
                      stopSpeech();
                      setExplainingMedText(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white font-mono bg-white/5 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-line">{explainingMedText}</p>
              <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono pt-1 border-t border-white/5">
                <span className="flex items-center space-x-1">
                  <Smartphone className="h-3 w-3 text-emerald-400" />
                  <span>Synchronized with Bluetooth Low Energy (BLE) Client Node</span>
                </span>
                <span className="text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-sm">Language: {currentLanguage.name}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600">
            <Watch className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 block">Universal Bluetooth Wearable Sync</strong>
              <span>Smartwatch Companion operates as a standalone low-latency hub. If the watch detects critical fall parameters and hears no voice cancellation within 10 seconds, it launches a priority network uplink to dispatch coordinates.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
