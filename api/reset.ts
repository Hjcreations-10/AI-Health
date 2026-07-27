/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * POST /api/reset — Resets the entire ecosystem simulation to initial seed state
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resetStore } from './_store.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  resetStore();
  return res.json({ success: true });
}
