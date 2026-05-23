import type { NextApiRequest, NextApiResponse } from 'next'
import { createAuthCookieHeader, validatePassword } from '../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: '只允许 POST 请求。' })
  }

  const { password } = req.body || {}

  if (!password || !validatePassword(password)) {
    return res.status(401).json({ ok: false, message: '密码错误，访问被拒绝。' })
  }

  res.setHeader('Set-Cookie', createAuthCookieHeader())
  return res.status(200).json({ ok: true })
}
