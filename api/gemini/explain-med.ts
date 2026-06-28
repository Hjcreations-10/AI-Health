/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/gemini/explain-med — Explains a medicine in simple regional language
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { explainMedicineWithGemini } from '../../_gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, dosage, purpose, lang } = req.body;
  if (!name || !purpose) {
    return res.status(400).json({ error: 'Medicine name and purpose required' });
  }

  const explanation = await explainMedicineWithGemini(
    name,
    dosage || '1 tablet',
    purpose,
    lang || 'English'
  );
  return res.json({ explanation });
}
