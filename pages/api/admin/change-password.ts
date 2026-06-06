import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminConfig, validateAdminCredentials, setAdminPassword, recordAdminLoginLog, requestHasValidAdminAuth } from '../../../lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: '只允许 POST 请求。' })
  }

  if (!requestHasValidAdminAuth(req)) {
    return res.status(401).json({ ok: false, message: '请先登录管理员账号。' })
  }

  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ ok: false, message: '请填写当前密码和新密码。' })
  }

  const adminConfig = getAdminConfig()
  const email = adminConfig.email

  if (!validateAdminCredentials(email, currentPassword)) {
    recordAdminLoginLog({
      timestamp: new Date().toISOString(),
      email,
      ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
      method: 'password',
      success: false,
      reason: 'incorrect_current_password',
    })
    return res.status(401).json({ ok: false, message: '当前密码不正确。' })
  }

  setAdminPassword(newPassword)
  recordAdminLoginLog({
    timestamp: new Date().toISOString(),
    email,
    ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
    method: 'password',
    success: true,
    reason: 'password_changed',
  })
  return res.status(200).json({ ok: true })
}
