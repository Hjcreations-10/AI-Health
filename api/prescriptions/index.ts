/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GET  /api/prescriptions — List all prescriptions
 * POST /api/prescriptions — Create a new prescription (Hospital Portal)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../_store';
import { analyzeInteractionsWithGemini } from '../_gemini';
import { Medicine, Prescription } from '../../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.json(store.prescriptions);
  }

  if (req.method === 'POST') {
    try {
      const { doctorName, specialty, hospitalName, diagnosis, medicines } = req.body;

      if (!doctorName || !hospitalName || !medicines || medicines.length === 0) {
        return res.status(400).json({ error: 'Missing required prescription fields' });
      }

      // Collect current active medicines from already fulfilled prescriptions
      const currentActiveMeds: Medicine[] = [];
      store.prescriptions.forEach(p => {
        if (p.isFulfilled) {
          currentActiveMeds.push(...p.medicines);
        }
      });

      // Analyze interactions with Gemini
      const interactionWarning = await analyzeInteractionsWithGemini(currentActiveMeds, medicines);

      const newPrescription: Prescription = {
        id: `PR-2026-${String(store.prescriptions.length + 1).padStart(4, '0')}`,
        date: new Date().toISOString().split('T')[0],
        doctorName,
        specialty,
        hospitalName,
        diagnosis,
        medicines: medicines.map((m: any, idx: number) => ({
          id: `M-${String(currentActiveMeds.length + idx + 5).padStart(3, '0')}`,
          name: m.name,
          dosage: m.dosage || '1 Tablet',
          frequency: m.frequency || '1-0-1',
          instructions: m.instructions || 'After Food',
          duration: m.duration || '30 Days',
          purpose: m.purpose || 'Prescribed treatment',
          sideEffects: m.sideEffects || 'Consult doctor if severe',
          refillRemaining: parseInt(m.duration) || 30,
          totalDays: parseInt(m.duration) || 30,
          startDate: new Date().toISOString().split('T')[0],
          prescribedBy: doctorName,
          hospital: hospitalName
        })),
        isFulfilled: false
      };

      store.prescriptions.push(newPrescription);
      return res.json({ prescription: newPrescription, warnings: interactionWarning });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
