/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GET /api/gemini/chat-history — Returns the current AI chat session history
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { store } from '../_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.json(store.chatHistory);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
