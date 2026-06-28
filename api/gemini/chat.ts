/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/gemini/chat — AI Copilot chat assistant with context awareness
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../../_store';
import { chatWithGemini } from '../../_gemini';
import { ChatMessage } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, lang } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add user message to state
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}-user`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    store.chatHistory.push(userMsg);

    let aiText = '';

    // Collect current active medicines for context
    const activeMeds: string[] = [];
    store.prescriptions.forEach(p => {
      if (p.isFulfilled) {
        p.medicines.forEach(m => {
          activeMeds.push(`- ${m.name} (${m.dosage}, ${m.frequency}, ${m.instructions}) for: ${m.purpose}`);
        });
      }
    });
    const activeMedsContext = activeMeds.length > 0
      ? activeMeds.join('\n')
      : 'None currently fulfilled. Wait for pharmacy check.';

    try {
      aiText = await chatWithGemini(message, lang || 'English', activeMedsContext);
    } catch {
      // Rule-based fallback if Gemini is unavailable
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('metformin') || lowerMsg.includes('sugar') || lowerMsg.includes('diabetes')) {
        aiText = 'Metformin helps control your blood sugar. Please make sure to take it after breakfast and dinner to avoid an upset stomach, and keep eating fresh vegetables.';
      } else if (lowerMsg.includes('telmisartan') || lowerMsg.includes('pressure') || lowerMsg.includes('bp')) {
        aiText = 'Telmisartan is for your high blood pressure. You should take it empty stomach before breakfast. Avoid eating too much salt in your diet.';
      } else if (lowerMsg.includes('pain') || lowerMsg.includes('emergency') || lowerMsg.includes('fall')) {
        aiText = 'If you are feeling unwell or have experienced a fall, please trigger the EMERGENCY alert. I am also alerting your son Rajesh Prasad at +91 98765 43210 immediately.';
      } else {
        aiText = 'Namaste! I am your AI Health Companion. To maintain good health, please take your prescribed medications on time, stay hydrated, and do light walking in the morning.';
      }
      if (lang && lang !== 'English') {
        aiText += ` (Simulated helper translation in preferred regional language: ${lang})`;
      }
    }

    const aiMsg: ChatMessage = {
      id: `chat-${Date.now()}-ai`,
      sender: 'ai',
      text: aiText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    store.chatHistory.push(aiMsg);

    return res.json({ chatHistory: store.chatHistory });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
