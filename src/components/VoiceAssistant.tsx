import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, HelpCircle, X, Sparkles, Languages } from 'lucide-react';
import { startVoiceListening, stopVoiceListening } from '../utils/recognition';
import { speakText, stopSpeech } from '../utils/speech';
import { LanguageConfig, AdherenceLog, Patient } from '../types';

interface VoiceAssistantProps {
  currentLanguage: LanguageConfig;
  onChangeLanguage: (code: any) => void;
  onScanTrigger: () => void;
  onEmergencyTrigger: () => void;
  onMarkTaken: () => void;
  activeAlert: AdherenceLog | null;
  patient: Patient | null;
}

export default function VoiceAssistant({
  currentLanguage,
  onChangeLanguage,
  onScanTrigger,
  onEmergencyTrigger,
  onMarkTaken,
  activeAlert,
  patient
}: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [assistantResponse, setAssistantResponse] = useState<string>('Hello! I am your hands-free companion. Click the microphone or say commands like "Scan Card" or "Emergency".');
  const [showCommands, setShowCommands] = useState(false);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stop listening when assistant closes
  useEffect(() => {
    return () => {
      stopVoiceListening();
    };
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      stopVoiceListening();
      setIsListening(false);
      setTranscript('');
    } else {
      setAssistantResponse('Listening closely for voice controls...');
      setIsListening(true);
      
      startVoiceListening({
        onResult: (text) => {
          setTranscript(text);
          processVoiceCommand(text);
        },
        onError: (err) => {
          console.error("Speech Recognition Error:", err);
          setIsListening(false);
        },
        onListeningStateChange: (state) => {
          setIsListening(state);
        }
      });
    }
  };

  const speakReply = (text: string) => {
    setAssistantResponse(text);
    speakText(text, currentLanguage.name);
  };

  const processVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase();

    // 1. Scan Card Command
    if (text.includes('scan') || text.includes('card') || text.includes('identity')) {
      speakReply("Scanning Health Card now. Patient identity verified successfully.");
      onScanTrigger();
      return;
    }

    // 2. Emergency Trigger Command
    if (text.includes('emergency') || text.includes('help') || text.includes('sos') || text.includes('fall')) {
      speakReply("Emergency voice hotkey detected! Dispatching first responders and caregiver notifications now.");
      onEmergencyTrigger();
      return;
    }

    // 3. Mark Medication Taken Command
    if (text.includes('taken') || text.includes('took') || text.includes('medicine done') || text.includes('done')) {
      if (activeAlert) {
        speakReply(`Acknowledged! Marking your ${activeAlert.medicineName} as taken successfully.`);
        onMarkTaken();
      } else {
        speakReply("You have no pending medicine reminders on your smartwatch right now.");
      }
      return;
    }

    // 4. Read / Narrative Commands
    if (text.includes('read') || text.includes('explain') || text.includes('tell me') || text.includes('speak')) {
      if (activeAlert) {
        const textToSpeak = `Reminder for ${activeAlert.medicineName}. Take with warm water as directed.`;
        speakReply(textToSpeak);
      } else {
        speakReply("There is no active reminder to read. Simply ask to explain medicine on the dashboard.");
      }
      return;
    }

    // 5. Language Switching Command
    if (text.includes('hindi') || text.includes('hindi language')) {
      onChangeLanguage('hi');
      speakReply("Language changed to Hindi.");
      return;
    }
    if (text.includes('telugu') || text.includes('telugu language')) {
      onChangeLanguage('te');
      speakReply("Language changed to Telugu.");
      return;
    }
    if (text.includes('tamil') || text.includes('tamil language')) {
      onChangeLanguage('ta');
      speakReply("Language changed to Tamil.");
      return;
    }
    if (text.includes('english') || text.includes('english language')) {
      onChangeLanguage('en');
      speakReply("Language changed to English.");
      return;
    }

    // Default friendly response
    speakReply(`Heard "${rawText}". Try saying: "Scan Card", "Mark Taken", or "Emergency".`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="voice-assistant-companion">
      {/* Expanded Dialog Box */}
      {isOpen ? (
        <div className="mb-3 w-80 bg-slate-900 border border-slate-800 rounded-[28px] shadow-2xl p-5 text-white flex flex-col space-y-4 animate-fadeIn">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
              <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">
                AI Hands-Free Companion
              </span>
            </div>
            <button
              onClick={() => {
                stopSpeech();
                stopVoiceListening();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Glowing Animated Waveform when listening */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-950/50 border border-white/5 rounded-2xl relative overflow-hidden">
            {isListening && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 animate-pulse" />
            )}
            
            <div className="flex items-end justify-center space-x-1.5 h-10 mb-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 bg-blue-500 rounded-full transition-all duration-150 ${
                    isListening 
                      ? 'animate-bounce' 
                      : 'h-2 bg-slate-700'
                  }`}
                  style={{
                    animationDelay: `${i * 100}ms`,
                    height: isListening ? `${Math.floor(Math.random() * 28) + 10}px` : '6px'
                  }}
                />
              ))}
            </div>

            <span className={`text-[11px] font-bold font-mono tracking-wide ${
              isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
            }`}>
              {isListening ? '🎙️ LISTENING...' : 'MIC STANDBY'}
            </span>
          </div>

          {/* Transcript bubble */}
          {transcript && (
            <div className="p-2.5 bg-blue-950/40 border border-blue-900/30 rounded-xl">
              <span className="text-[10px] text-blue-400 uppercase font-mono font-bold block mb-0.5">You Said:</span>
              <p className="text-xs text-slate-200 italic font-medium">"{transcript}"</p>
            </div>
          )}

          {/* Assistant Response Bubble */}
          <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl text-xs space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Assistant Reply:</span>
            <p className="text-slate-200 font-medium leading-relaxed">{assistantResponse}</p>
          </div>

          {/* Help toggle / commands list */}
          <div>
            <button
              onClick={() => setShowCommands(!showCommands)}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-mono cursor-pointer"
            >
              <HelpCircle className="h-3 w-3" />
              <span>{showCommands ? 'Hide commands guide' : 'Show voice commands guide'}</span>
            </button>

            {showCommands && (
              <div className="mt-2 p-2 bg-slate-950/80 border border-white/5 rounded-xl text-[10px] text-slate-400 space-y-1 font-mono leading-relaxed">
                <p className="font-bold text-slate-300">💡 Voice Commands You Can Say:</p>
                <p>• <strong className="text-blue-300">"Scan Card"</strong> - Scans clinical health ID card</p>
                <p>• <strong className="text-emerald-300">"Taken"</strong> - Marks medicine reminder as taken</p>
                <p>• <strong className="text-blue-300">"Read"</strong> - Narrates medicine instructions</p>
                <p>• <strong className="text-rose-300">"Emergency"</strong> - Triggers fall emergency alert</p>
                <p>• <strong className="text-yellow-300">"Hindi" / "Telugu" / "English"</strong> - Switches interface language</p>
              </div>
            )}
          </div>

          {/* Quick Mic Control Bar */}
          <button
            onClick={handleToggleListening}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span>{isListening ? 'Stop Listening' : 'Start Listening (Hands-Free)'}</span>
          </button>
        </div>
      ) : null}

      {/* Primary Floating Trigger Button */}
      <button
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) {
            // Friendly greeting when opened - call synchronously to bypass browser autoplay blocks
            speakText("Voice Companion is active. Click the microphone or say commands like Scan Card, Taken, or Emergency.", currentLanguage.name);
          } else {
            stopSpeech();
            stopVoiceListening();
          }
        }}
        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:shadow-blue-600/30'
        }`}
        id="floating-voice-assistant-trigger"
        title="Voice-Activated Assistant"
      >
        {isListening ? (
          <div className="relative">
            <Mic className="h-6 w-6 text-emerald-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        ) : (
          <Mic className="h-6 w-6 animate-pulse" />
        )}
      </button>
    </div>
  );
}
