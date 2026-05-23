import type { NextApiRequest, NextApiResponse } from 'next'
import { clearAuthCookieHeader } from '../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ ok: false, message: '只允许 GET 或 POST 请求。' })
  }

  res.setHeader('Set-Cookie', clearAuthCookieHeader())
  return res.status(200).json({ ok: true })
}
