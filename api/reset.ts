/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/reset — Resets the entire ecosystem simulation to initial state
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../_store';
import { INITIAL_PATIENT, INITIAL_PRESCRIPTIONS, INITIAL_ADHERENCE_LOGS } from '../../src/data';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  store.patient = { ...INITIAL_PATIENT };
  store.prescriptions = JSON.parse(JSON.stringify(INITIAL_PRESCRIPTIONS));
  store.adherenceLogs = JSON.parse(JSON.stringify(INITIAL_ADHERENCE_LOGS));
  store.chatHistory = [
    {
      id: 'init-1',
      sender: 'ai',
      text: 'Namaste! I am your AI Health Companion. I can help explain your medicines, check for drug interactions, schedule reminders in your preferred language, or help you contact your caregiver in emergencies. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  return res.json({ success: true });
}
