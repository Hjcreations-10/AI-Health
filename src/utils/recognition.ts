/**
 * Speech recognition helper utilizing Web Speech Recognition API
 */

export interface SpeechListenerConfig {
  onResult: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onListeningStateChange?: (listening: boolean) => void;
}

let recognitionInstance: any = null;

export function startVoiceListening({
  onResult,
  onEnd,
  onError,
  onListeningStateChange
}: SpeechListenerConfig): () => void {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Speech recognition is not supported in this browser.");
    if (onError) onError(new Error("Browser does not support Speech Recognition."));
    return () => {};
  }

  // Cancel any existing instance
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch (e) {}
  }

  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = false;
  // Support mixed regional languages for multilingual voice-activation (English/Indian accents, Hindi, Telugu)
  rec.lang = 'en-IN'; 

  rec.onstart = () => {
    if (onListeningStateChange) onListeningStateChange(true);
  };

  rec.onresult = (event: any) => {
    const lastResultIdx = event.results.length - 1;
    const transcript = event.results[lastResultIdx][0].transcript;
    if (transcript) {
      onResult(transcript.trim());
    }
  };

  rec.onerror = (event: any) => {
    console.error("Speech recognition error:", event.error);
    if (onError) onError(event);
  };

  rec.onend = () => {
    if (onListeningStateChange) onListeningStateChange(false);
    if (onEnd) onEnd();
  };

  try {
    rec.start();
    recognitionInstance = rec;
  } catch (err) {
    console.error("Error starting speech recognition:", err);
  }

  return () => {
    try {
      rec.stop();
    } catch (e) {}
    if (recognitionInstance === rec) {
      recognitionInstance = null;
    }
    if (onListeningStateChange) onListeningStateChange(false);
  };
}

export function stopVoiceListening() {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch (e) {}
    recognitionInstance = null;
  }
}
