/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GET /api/patient — Returns current patient state
 * POST /api/patient/vitals — Updates patient vitals
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.json(store.patient);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
