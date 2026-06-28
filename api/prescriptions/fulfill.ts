/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/prescriptions/fulfill — Marks a prescription as dispensed (Pharmacy Portal)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../../_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prescriptionId } = req.body;
  const prescription = store.prescriptions.find(p => p.id === prescriptionId);

  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  if (prescription.isFulfilled) {
    return res.status(400).json({ error: 'Prescription already fulfilled' });
  }

  prescription.isFulfilled = true;
  prescription.fulfillmentDate = new Date().toISOString().split('T')[0];

  // Add medicines to adherence log schedules for today
  const todayStr = new Date().toISOString().split('T')[0];
  prescription.medicines.forEach(med => {
    const freqParts = med.frequency.split('-'); // e.g. "1-0-1" → [Morning, Afternoon, Evening]
    const slots: ('Morning' | 'Afternoon' | 'Evening')[] = ['Morning', 'Afternoon', 'Evening'];

    freqParts.forEach((val, idx) => {
      if (parseInt(val) > 0) {
        const logExists = store.adherenceLogs.some(
          l => l.date === todayStr && l.timeSlot === slots[idx] && l.medicineId === med.id
        );
        if (!logExists) {
          store.adherenceLogs.push({
            id: `l-${store.adherenceLogs.length + 1}`,
            date: todayStr,
            timeSlot: slots[idx],
            medicineId: med.id,
            medicineName: med.name,
            status: 'Pending'
          });
        }
      }
    });
  });

  return res.json({ success: true, prescription });
}
