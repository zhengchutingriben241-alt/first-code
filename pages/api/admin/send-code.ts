import type { NextApiRequest, NextApiResponse } from 'next'
import {
  ADMIN_EMAIL,
  createAdminOtpToken,
  generateAdminOtpCode,
  getRateLimitStatus,
  recordRateLimitFailure,
} from '../../../lib/auth'

const RESEND_API_URL = 'https://api.resend.com/emails'

function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

async function sendOtpCode(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Resend API key is not configured.')
  }

  const body = {
    from: 'no-reply@yourdomain.com',
    to: email,
    subject: '管理后台登录验证码',
    html: `<p>您的登录验证码是：<strong>${code}</strong></p><p>验证码 10 分钟内有效。</p>`,
  }

  await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: '只允许 POST 请求。' })
  }

  const rateKey = `ip:${getClientIp(req)}`
  const rateStatus = getRateLimitStatus(rateKey)

  if (rateStatus.blocked) {
    return res.status(429).json({ ok: false, message: `发送过于频繁，请 ${Math.ceil(rateStatus.remainingMs / 1000)} 秒后重试。` })
  }

  const { email } = req.body || {}
  if (!email || typeof email !== 'string' || email.trim().toLowerCase() !== ADMIN_EMAIL) {
    recordRateLimitFailure(rateKey)
    return res.status(401).json({ ok: false, message: '邮箱地址不正确。' })
  }

  const code = generateAdminOtpCode()
  const token = createAdminOtpToken(email, code)

  try {
    await sendOtpCode(email, code)
  } catch (error) {
    return res.status(500).json({ ok: false, message: '验证码发送失败，请稍后再试。' })
  }

  return res.status(200).json({ ok: true, token, expiresIn: 600 })
}
