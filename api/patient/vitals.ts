/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/patient/vitals — Updates patient vitals or emergency flags
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../../_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { heartRate, spo2, isFallDetected, isEmergencyTriggered } = req.body;

  if (heartRate !== undefined) store.patient.vitals.heartRate = heartRate;
  if (spo2 !== undefined) store.patient.vitals.spo2 = spo2;
  if (isFallDetected !== undefined) store.patient.vitals.isFallDetected = isFallDetected;
  if (isEmergencyTriggered !== undefined) store.patient.vitals.isEmergencyTriggered = isEmergencyTriggered;

  store.patient.vitals.lastUpdated = 'Just now';

  return res.json(store.patient);
}
