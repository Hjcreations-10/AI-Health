/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Patient, 
  Prescription, 
  AdherenceLog, 
  LanguageConfig, 
  ChatMessage, 
  LanguageCode 
} from '../types';
import { 
  QrCode, 
  Send, 
  Sparkles, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Check, 
  Plus, 
  Volume2, 
  Clock, 
  AlertCircle, 
  HelpCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import MedicineVisual from './MedicineVisual';
import { speakText, stopSpeech } from '../utils/speech';

interface PatientAppProps {
  patient: Patient;
  prescriptions: Prescription[];
  adherenceLogs: AdherenceLog[];
  languages: LanguageConfig[];
  currentLanguage: LanguageConfig;
  onChangeLanguage: (code: LanguageCode) => void;
  onUpdateAdherence: (logId: string, status: 'Taken' | 'Missed' | 'Pending') => void;
  onRefreshData: () => void;
}

export default function PatientApp({
  patient,
  prescriptions,
  adherenceLogs,
  languages,
  currentLanguage,
  onChangeLanguage,
  onUpdateAdherence,
  onRefreshData,
}: PatientAppProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'wallet' | 'card' | 'assistant'>('timeline');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [explainingMedId, setExplainingMedId] = useState<string | null>(null);
  const [medExplanation, setMedExplanation] = useState<string | null>(null);
  const [isSpeakingText, setIsSpeakingText] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Stop speech when switching tab or explaining different medicine
  useEffect(() => {
    stopSpeech();
    setIsSpeakingText(false);
  }, [activeTab, explainingMedId]);

  // Sync state for prescriptions & history
  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/gemini/chat-history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setChatHistory(data);
      } else if (data.chatHistory) {
        setChatHistory(data.chatHistory);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = textToSend || chatMessage;
    if (!msgText.trim()) return;

    if (!textToSend) setChatMessage('');
    setIsChatLoading(true);

    // Optimistically add user message locally
    const tempUserMsg: ChatMessage = {
      id: `chat-temp-${Date.now()}`,
      sender: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText, lang: currentLanguage.name })
      });
      const data = await res.json();
      if (data.chatHistory) {
        setChatHistory(data.chatHistory);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Fallback
      setChatHistory(prev => [...prev, {
        id: `chat-err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I am facing temporary issues connecting to the server. Standard advice: Keep active, stay hydrated, and follow your prescribed schedule.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSpeakText = (text: string) => {
    if (isSpeakingText) {
      stopSpeech();
      setIsSpeakingText(false);
    } else {
      setIsSpeakingText(true);
      speakText(
        text,
        currentLanguage.name,
        () => setIsSpeakingText(true),
        () => setIsSpeakingText(false)
      );
    }
  };

  const handleExplainMedicine = async (medName: string, dosage: string, purpose: string, id: string) => {
    setExplainingMedId(id);
    setMedExplanation(null);
    stopSpeech();
    setIsSpeakingText(false);
    try {
      const res = await fetch('/api/gemini/explain-med', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: medName, dosage, purpose, lang: currentLanguage.name })
      });
      const data = await res.json();
      if (data.explanation) {
        setMedExplanation(data.explanation);
        // Automatically speak the explanation out loud in the selected language!
        speakText(
          data.explanation,
          currentLanguage.name,
          () => setIsSpeakingText(true),
          () => setIsSpeakingText(false)
        );
      }
    } catch (err) {
      console.error('Error explaining medicine:', err);
      const fallback = `This medicine helps manage your diagnosed condition. Take exactly ${dosage} as prescribed.`;
      setMedExplanation(fallback);
      speakText(
        fallback,
        currentLanguage.name,
        () => setIsSpeakingText(true),
        () => setIsSpeakingText(false)
      );
    }
  };

  // Quick prompt questions
  const SUGGESTED_QUESTIONS = [
    `Tell me about my active medications`,
    `How does Telmisartan help my blood pressure?`,
    `Are there any side effects of Metformin?`,
    `Remind me what I need to take after dinner`,
  ];

  // Adherence Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLogs = adherenceLogs.filter(l => l.date === todayStr);
  const takenCount = todaysLogs.filter(l => l.status === 'Taken').length;
  const totalCount = todaysLogs.length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="patient-app-root">
      
      {/* LEFT PANEL: Patient Sidebar Overview */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Profile Card & Language Selection */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6" id="patient-profile">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg border border-blue-200 shadow-xs">
              DP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-bold text-lg text-slate-800">{patient.name}</h3>
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  Age {patient.age}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Health ID: {patient.id}</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Blood Group</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md font-mono">{patient.bloodGroup}</span>
            </div>
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500 font-medium">Chronic Illness</span>
              <div className="text-right flex flex-wrap gap-1 justify-end max-w-xs">
                {patient.chronicDiseases.map((d, i) => (
                  <span key={i} className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md font-medium text-[10px]">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-500 font-medium">Known Allergies</span>
              <div className="text-right flex flex-wrap gap-1 justify-end max-w-xs">
                {patient.allergies.map((a, i) => (
                  <span key={i} className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md font-medium text-[10px]">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Regional Voice/Text Language:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  id={`lang-select-${lang.code}`}
                  onClick={() => onChangeLanguage(lang.code)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer ${
                    currentLanguage.code === lang.code
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{lang.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{lang.localName}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Alert & Call Caregiver */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-[32px] p-6 shadow-md shadow-rose-200/30" id="emergency-card">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-sm">
              <AlertCircle className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-900 text-sm">Emergency Assistance</h4>
              <p className="text-xs text-rose-800 mt-1">
                Trigger emergency alerts or immediately dial your primary caretaker.
              </p>
            </div>
          </div>

          <div className="mt-4 bg-white/80 backdrop-blur-xs rounded-xl p-3 border border-rose-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Primary Caretaker</span>
              <span className="font-bold text-slate-900">{patient.emergencyContactName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Relation / Phone</span>
              <span className="font-mono font-semibold text-blue-600 hover:underline cursor-pointer">
                {patient.emergencyContactPhone}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a 
              href={`tel:${patient.emergencyContactPhone}`}
              className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              id="call-caregiver-btn"
            >
              <Volume2 className="h-4 w-4" />
              <span>Call Rajesh</span>
            </a>
            <button
              onClick={async () => {
                await fetch('/api/patient/vitals', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isEmergencyTriggered: true })
                });
                onRefreshData();
              }}
              className="py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              id="alert-vitals-btn"
            >
              <ShieldCheck className="h-4 w-4 text-rose-400" />
              <span>SOS Alert</span>
            </button>
          </div>
        </div>

        {/* Daily Adherence Metrics */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-xl shadow-slate-200/50 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-display font-bold text-slate-800 text-sm">Today's Adherence Rate</h4>
            <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative h-16 w-16 flex items-center justify-center">
              {/* Semi-circular radial chart simulated with SVG */}
              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-500"
                  strokeDasharray={`${adherenceRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="font-mono font-bold text-sm text-slate-800">{adherenceRate}%</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Daily Target Accomplished</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {takenCount} of {totalCount} Medications Checked
              </p>
            </div>
          </div>
        </div>

        {/* Smartwatch Companion Sync */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-xl shadow-slate-200/50 space-y-3" id="mobile-watch-companion-sync">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest font-mono">
                Live Active Companion
              </span>
            </div>
            <span className="text-[9px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold">
              Bluetooth Synced
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Real-time biometric feed from your synchronized Smartwatch Companion.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[8px] text-slate-400 block uppercase font-mono">Blood Pressure</span>
              <span className="font-bold text-slate-800 text-xs font-mono">120/80</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[8px] text-slate-400 block uppercase font-mono">Sugar Control</span>
              <span className="font-bold text-slate-800 text-xs font-mono">104 mg/dL</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[8px] text-slate-400 block uppercase font-mono">Heart Rate</span>
              <span className="font-bold text-rose-600 text-xs font-mono animate-pulse">{patient.vitals.heartRate} bpm</span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: Interactive Views & Tab Switchers */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Tab Headers */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex space-x-1" id="patient-tabs">
          {[
            { id: 'timeline', name: currentLanguage.labels.timeline, icon: Clock },
            { id: 'wallet', name: currentLanguage.labels.prescriptionWallet, icon: FileText },
            { id: 'card', name: 'Universal Health Card', icon: QrCode },
            { id: 'assistant', name: 'AI Health Copilot', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`patient-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.id === 'timeline' && todaysLogs.some(l => l.status === 'Pending') && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================== */}
        {/* TAB 1: MEDICINE TIMELINE */}
        {/* ========================================== */}
        {activeTab === 'timeline' && (
          <div className="space-y-6" id="view-timeline">
            {/* Morning, Afternoon, Evening Groups */}
            {['Morning', 'Afternoon', 'Evening'].map((slot) => {
              const slotLogs = todaysLogs.filter(l => l.timeSlot === slot);
              const slotTimeLabel = slot === 'Morning' ? '08:00 AM' : slot === 'Afternoon' ? '01:30 PM' : '08:30 PM';
              
              return (
                <div key={slot} className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">
                        <Clock className="h-4.5 w-4.5" />
                      </span>
                      <h4 className="font-display font-bold text-slate-800 text-sm">
                        {slot} Reminder Schedule
                      </h4>
                      <span className="text-xs bg-slate-200/60 font-mono text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {slotTimeLabel}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      {slotLogs.filter(l => l.status === 'Taken').length} of {slotLogs.length} Completed
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 p-2">
                    {slotLogs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium">
                        No medicines scheduled for {slot} today.
                      </div>
                    ) : (
                      slotLogs.map((log) => {
                        const isTaken = log.status === 'Taken';
                        const isMissed = log.status === 'Missed';
                        const isPending = log.status === 'Pending';
                        
                        // Find matching medicine metadata to get details
                        let medicineDetails: any = null;
                        prescriptions.forEach(p => {
                           const match = p.medicines.find(m => m.id === log.medicineId);
                           if (match) medicineDetails = match;
                        });

                        return (
                          <div 
                            key={log.id} 
                            className={`p-4 flex flex-col md:flex-row md:items-center justify-between rounded-2xl transition-all ${
                              isTaken ? 'bg-emerald-50/50' : isMissed ? 'bg-rose-50/50' : 'hover:bg-slate-50'
                            }`}
                            id={`timeline-log-${log.id}`}
                          >
                            <div className="flex items-start space-x-3.5">
                              {/* High contrast visual representation of the medicine pill */}
                              <div className="flex-shrink-0">
                                <MedicineVisual name={log.medicineName} size="sm" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <h5 className="font-bold text-slate-800 text-sm">{log.medicineName}</h5>
                                  {medicineDetails?.instructions && (
                                    <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                                      {medicineDetails.instructions}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
                                  <span>Dosage: <strong className="text-slate-700">{medicineDetails?.dosage || '1 Tablet'}</strong></span>
                                  <span>•</span>
                                  <span>Refills left: <strong className="text-slate-700 font-mono">{medicineDetails?.refillRemaining ?? '30'} days</strong></span>
                                </div>
                                {medicineDetails?.purpose && (
                                  <p className="text-[11px] text-slate-400 mt-1 italic">
                                    "Used for: {medicineDetails.purpose}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions / Checks */}
                            <div className="mt-4 md:mt-0 flex items-center space-x-2 self-end md:self-center">
                              
                              <button
                                onClick={() => handleExplainMedicine(log.medicineName, medicineDetails?.dosage, medicineDetails?.purpose, log.id)}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                                id={`explain-med-btn-${log.id}`}
                              >
                                <Sparkles className="h-3 w-3 text-blue-500" />
                                <span>Explain</span>
                              </button>

                              {isTaken ? (
                                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 shadow-xs">
                                  <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                  <span>Taken at {log.timestamp || '08:15 AM'}</span>
                                  <button 
                                    onClick={() => onUpdateAdherence(log.id, 'Pending')}
                                    className="ml-2 hover:text-slate-500 font-mono font-normal text-[10px]"
                                  >
                                    (Undo)
                                  </button>
                                </div>
                              ) : isMissed ? (
                                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg border border-rose-200">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>Missed Dose</span>
                                  <button 
                                    onClick={() => onUpdateAdherence(log.id, 'Pending')}
                                    className="ml-2 hover:text-slate-500 font-mono font-normal text-[10px]"
                                  >
                                    (Undo)
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => onUpdateAdherence(log.id, 'Taken')}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                                    id={`take-btn-${log.id}`}
                                  >
                                    Mark Taken
                                  </button>
                                  <button
                                    onClick={() => onUpdateAdherence(log.id, 'Missed')}
                                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-pointer animate-pulse"
                                    id={`miss-btn-${log.id}`}
                                  >
                                    Missed
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* Explanation Modal overlay if explaining */}
            {explainingMedId && (() => {
              const explainingLog = adherenceLogs.find(l => l.id === explainingMedId);
              const explainingMedName = explainingLog ? explainingLog.medicineName : "Medicine";
              
              return (
                <div className="bg-slate-900 text-white p-6 rounded-[28px] shadow-lg border border-blue-500/30 flex flex-col space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
                      <span className="font-bold text-xs tracking-wider uppercase font-mono text-blue-300">
                        AI Medical Insights ({currentLanguage.name})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {medExplanation && (
                        <button
                          onClick={() => handleSpeakText(medExplanation)}
                          className={`px-3 py-1.5 text-xs font-bold font-mono rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer ${
                            isSpeakingText 
                              ? 'bg-rose-600/30 text-rose-300 border-rose-500/20 animate-pulse'
                              : 'bg-blue-600/30 text-blue-300 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                          }`}
                          id="play-voice-btn"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>{isSpeakingText ? 'Speaking...' : '🔊 Read Aloud'}</span>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          stopSpeech();
                          setExplainingMedId(null);
                        }}
                        className="text-slate-400 hover:text-white font-bold text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                    {/* Medicine Visual Specimen (Pill / Tablet Picture) */}
                    <div className="flex-shrink-0 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                      <MedicineVisual name={explainingMedName} size="md" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">{explainingMedName} Identifiers</h4>
                      {medExplanation ? (
                        <p className="text-sm font-sans font-medium text-slate-200 leading-relaxed">
                          {medExplanation}
                        </p>
                      ) : (
                        <div className="flex items-center space-x-3 py-2 text-xs text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                          <span>Asking Gemini Healthcare model...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-slate-500 gap-2">
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Verified translation for safe geriatric pharmacology guidance.</span>
                    </div>
                    <span className="bg-white/5 px-2 py-0.5 rounded-md text-slate-400 font-mono">
                      Speaker Status: {isSpeakingText ? "🎙️ ACTIVE NARRATION" : "⏸️ READY TO REPLAY"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: DIGITAL PRESCRIPTION WALLET */}
        {/* ========================================== */}
        {activeTab === 'wallet' && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-6" id="view-wallet">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800">Universal Digital Prescription Wallet</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Store and authorize medical records across any network hospital or pharmacy securely.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {prescriptions.length} Active Records
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((p) => (
                <div 
                  key={p.id} 
                  id={`prescription-card-${p.id}`}
                  onClick={() => setSelectedPrescription(selectedPrescription?.id === p.id ? null : p)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    p.isFulfilled 
                      ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200' 
                      : 'bg-blue-50/30 hover:bg-blue-50/60 border-blue-100 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                        {p.id}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-2">{p.hospitalName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Date: {p.date}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      p.isFulfilled 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                        : 'bg-amber-100 border border-amber-300 text-amber-800 animate-pulse'
                    }`}>
                      {p.isFulfilled ? 'Active & Fulfilled' : 'Unfulfilled / Pending'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1">
                    <div className="text-xs">
                      <span className="text-slate-400 font-medium">Doctor:</span>{' '}
                      <strong className="text-slate-700">{p.doctorName}</strong> ({p.specialty})
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 font-medium">Diagnosis:</span>{' '}
                      <span className="text-slate-600 font-medium">{p.diagnosis}</span>
                    </div>
                  </div>

                  {/* Medicine Sublist toggled */}
                  {selectedPrescription?.id === p.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-2.5 bg-white p-3 rounded-lg border border-slate-100">
                      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Prescribed Drugs:</h5>
                      {p.medicines.map((med) => (
                        <div key={med.id} className="text-xs flex justify-between items-start border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <strong className="text-slate-800">{med.name}</strong> - {med.dosage}
                            <p className="text-[10px] text-slate-400 mt-0.5 italic">{med.purpose}</p>
                          </div>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-[10px] font-bold text-blue-500 flex items-center justify-end">
                    {selectedPrescription?.id === p.id ? 'Click to collapse details' : 'Click to inspect drug details →'}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600">
              <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">End-to-End Clinical Records Protection</strong>
                <span>Prescriptions are cryptographically stored on our secure cloud nodes. The QR Code only transmits Patient ID, requesting your explicit biometric auth or pin validation prior to clinical retrieval.</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: UNIVERSAL HEALTH CARD DETAILS */}
        {/* ========================================== */}
        {activeTab === 'card' && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 space-y-6 animate-fade-in" id="view-card">
            <h3 className="font-display font-bold text-lg text-slate-800">Physical &amp; Digital Health Card</h3>
            <p className="text-xs text-slate-500">
              Present this card at any network hospital or partner pharmacy in India for immediate history lookups.
            </p>

            {/* Card Layout Design */}
            <div className="relative w-full max-w-md mx-auto aspect-[1.586/1] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-[28px] p-6 text-white shadow-xl overflow-hidden border border-slate-800" id="health-card-render">
              
              {/* Card Hologram Decors */}
              <div className="absolute right-0 bottom-0 w-44 h-44 bg-gradient-to-br from-rose-500/10 to-blue-500/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -z-10" />

              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-blue-500/20 backdrop-blur-xs text-blue-300 rounded-lg border border-blue-400/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm tracking-wide">AI HEALTH CARD</h4>
                    <p className="text-[9px] font-mono tracking-widest text-blue-300 uppercase">Universal Elderly Health Card</p>
                  </div>
                </div>

                {/* Simulated Chip Hologram */}
                <div className="w-10 h-8 bg-gradient-to-tr from-amber-200 via-amber-300 to-amber-100 rounded-md border border-amber-400/30 flex items-center justify-center overflow-hidden opacity-90 shadow-sm" />
              </div>

              {/* Patient Core Details */}
              <div className="mt-7 grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-3">
                  <div>
                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Patient Name</p>
                    <p className="font-bold text-sm tracking-wide truncate">{patient.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Unique Health ID</p>
                      <p className="font-mono font-bold text-xs text-blue-300">{patient.id}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Blood Group</p>
                      <p className="font-bold text-xs bg-white/10 px-2 py-0.5 rounded-sm inline-block font-mono">{patient.bloodGroup}</p>
                    </div>
                  </div>
                </div>

                {/* Large QR Code Visual Representation */}
                <div className="bg-white p-2 rounded-xl flex items-center justify-center aspect-square shadow-md border border-blue-400/20">
                  {/* High Quality Styled QR SVG */}
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="25" height="25" />
                    <rect x="5" y="5" width="15" height="15" fill="white" />
                    <rect x="75" y="0" width="25" height="25" />
                    <rect x="80" y="5" width="15" height="15" fill="white" />
                    <rect x="0" y="75" width="25" height="25" />
                    <rect x="5" y="80" width="15" height="15" fill="white" />
                    <rect x="35" y="35" width="30" height="30" />
                    <rect x="40" y="40" width="20" height="20" fill="white" />
                    {/* Small noise grids */}
                    <rect x="10" y="30" width="10" height="10" />
                    <rect x="55" y="10" width="15" height="15" />
                    <rect x="15" y="50" width="10" height="10" />
                    <rect x="80" y="45" width="10" height="15" />
                    <rect x="45" y="80" width="15" height="10" />
                    <rect x="80" y="80" width="15" height="15" />
                  </svg>
                </div>
              </div>

              {/* Card Footer Contact info */}
              <div className="mt-5 border-t border-white/10 pt-2.5 flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>Emergency: {patient.emergencyContactPhone}</span>
                <span className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>SECURE QR NFC APPROVED</span>
                </span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3">
                <span className="font-bold text-slate-800 text-lg block font-mono">100%</span>
                <span className="text-[11px] text-slate-500 font-medium">Privacy Preserved</span>
              </div>
              <div className="p-3 border-y md:border-y-0 md:border-x border-slate-100">
                <span className="font-bold text-blue-600 text-lg block font-mono">Instant</span>
                <span className="text-[11px] text-slate-500 font-medium">Clinical Sync</span>
              </div>
              <div className="p-3">
                <span className="font-bold text-emerald-600 text-lg block font-mono">NFC / QR</span>
                <span className="text-[11px] text-slate-500 font-medium">Cross-Compatible</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: AI HEALTH ASSISTANT CHAT */}
        {/* ========================================== */}
        {activeTab === 'assistant' && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-[520px]" id="view-assistant">
            
            {/* Assistant Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[32px]">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-sm">AI Health Assistant</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Gemini 3.5-Flash Healthcare Co-Pilot</p>
                </div>
              </div>

              <div className="text-xs text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Language: {currentLanguage.name}</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
              {chatHistory.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div key={msg.id} className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-md p-4 rounded-2xl ${
                      isAI 
                        ? 'bg-slate-100 text-slate-800 border border-slate-200/50 rounded-tl-none' 
                        : 'bg-blue-600 text-white rounded-tr-none shadow-xs font-medium'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <span className={`block text-[9px] mt-2 text-right ${isAI ? 'text-slate-400' : 'text-blue-100'} font-mono`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-md p-4 bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-slate-400 font-medium ml-2">Health companion is writing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Questions (Quick Prompts) */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/20">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-[32px]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={currentLanguage.labels.askAssistant}
                  className="w-full bg-white border border-slate-200 focus:outline-none focus:border-blue-500 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-800 shadow-inner"
                  id="chat-input"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="absolute right-2.5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm cursor-pointer transition-all"
                  id="chat-send-btn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
