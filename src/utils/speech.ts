/**
 * Regional speech synthesis manager using Web Speech API
 */

// Warm up voices on load
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      console.log(`Loaded ${loadedVoices.length} SpeechSynthesis voices.`);
    };
  }
}

export const BCP47_MAP: Record<string, string> = {
  'English': 'en-IN',
  'Hindi': 'hi-IN',
  'Telugu': 'te-IN',
  'Tamil': 'ta-IN',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Bengali': 'bn-IN'
};

// Module-level reference to prevent garbage collection of the utterance while speaking
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, languageName: string, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn("Speech Synthesis API not supported in this browser.");
    if (onEnd) onEnd();
    return;
  }

  // Cancel any active speech first
  window.speechSynthesis.cancel();

  // If language is English, speak directly without translation
  if (!languageName || languageName.toLowerCase() === 'english') {
    performSpeak(text, languageName, onStart, onEnd);
    return;
  }

  // Fetch translation first from our server API using Gemini!
  console.log(`Speech translation requested for: "${text}" to "${languageName}"...`);
  
  if (onStart) onStart();

  fetch('/api/gemini/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang: languageName })
  })
    .then(res => res.json())
    .then(data => {
      const speechText = data.translated || text;
      console.log(`Translated successfully to ${languageName}: "${speechText}"`);
      // Speak the translated content. Pass undefined for onStart because it was already triggered.
      performSpeak(speechText, languageName, undefined, onEnd);
    })
    .catch(err => {
      console.warn("Translation API failed. Falling back to original text.", err);
      performSpeak(text, languageName, undefined, onEnd);
    });
}

function performSpeak(text: string, languageName: string, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  // Create utterance and store in module scope to prevent GC
  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;
  
  // Set matching BCP-47 locale
  const targetLocale = BCP47_MAP[languageName] || 'en-IN';
  utterance.lang = targetLocale;

  // Geriatric settings: Slightly slower rate (0.82) for clear elderly articulation
  utterance.rate = 0.82;
  utterance.pitch = 1.05; // Slightly cheerful, highly intelligible pitch

  // Set callbacks
  if (onStart) utterance.onstart = onStart;
  utterance.onend = () => {
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    if (onEnd) onEnd();
  };
  utterance.onerror = (e: any) => {
    const errorType = e && typeof e === 'object' && 'error' in e ? e.error : String(e);
    // 'canceled' and 'interrupted' are natural side effects of calling cancel() to start a new utterance
    if (errorType === 'canceled' || errorType === 'interrupted') {
      console.log(`Speech synthesis: Utterance cleared/canceled successfully (${errorType}).`);
    } else {
      console.warn("Speech synthesis error details:", errorType);
    }
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    if (onEnd) onEnd();
  };

  // Find a matching system voice if available using robust case-insensitive matching
  const voices = window.speechSynthesis.getVoices();
  const lowerLocale = targetLocale.toLowerCase().replace('_', '-');
  const targetPrefix = lowerLocale.split('-')[0]; // e.g. 'te', 'hi'

  // Try different matching strategies in order of accuracy
  let voice = voices.find(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === lowerLocale;
  });

  if (!voice) {
    voice = voices.find(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang.startsWith(targetPrefix + '-');
    });
  }

  if (!voice) {
    voice = voices.find(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang === targetPrefix;
    });
  }

  if (!voice) {
    voice = voices.find(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang.includes(targetPrefix);
    });
  }

  if (voice) {
    utterance.voice = voice;
    // Set matching BCP-47 locale matching the voice language to ensure perfect compatibility
    utterance.lang = voice.lang;
    console.log(`Speech synthesis: Matched voice "${voice.name}" (${voice.lang}) for language "${languageName}"`);
  } else {
    console.warn(`Speech synthesis: No exact voice found for "${languageName}" (${targetLocale}). Fallback to browser default.`);
  }

  // Prevent browser-specific SpeechSynthesis pause lockups
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Use a slight 50ms delay before speaking to let the previous cancel finish completely in Chromium
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Resume before speaking just in case it's in a stuck pause state
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    }
  }, 50);
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
