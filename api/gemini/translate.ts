/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/gemini/translate — Translates a short healthcare message to the patient's preferred language
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { translateTextWithGemini } from '../../_gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, lang } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const translated = await translateTextWithGemini(text, lang || 'English');
  return res.json({ translated });
}
