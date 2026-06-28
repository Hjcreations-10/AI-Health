/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/adherence-logs/update — Marks a medicine dose as Taken, Missed, or Pending
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../../_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { logId, status } = req.body;
  const log = store.adherenceLogs.find(l => l.id === logId);

  if (!log) {
    return res.status(404).json({ error: 'Log not found' });
  }

  const oldStatus = log.status;
  log.status = status;

  if (status === 'Taken') {
    log.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Reduce refill remaining for the medicine
    store.prescriptions.forEach(p => {
      const med = p.medicines.find(m => m.id === log.medicineId);
      if (med && oldStatus !== 'Taken') {
        med.refillRemaining = Math.max(0, med.refillRemaining - 1);
      }
    });
  } else {
    // If changed back from Taken, restore the refill count
    if (oldStatus === 'Taken') {
      store.prescriptions.forEach(p => {
        const med = p.medicines.find(m => m.id === log.medicineId);
        if (med) {
          med.refillRemaining = med.refillRemaining + 1;
        }
      });
    }
    delete log.timestamp;
  }

  return res.json({ success: true, log });
}
