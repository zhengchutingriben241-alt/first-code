import type { NextApiRequest, NextApiResponse } from 'next'
import {
  ADMIN_EMAIL,
  createAdminCookieHeader,
  validateAdminOtpToken,
  getRateLimitStatus,
  recordRateLimitFailure,
  clearRateLimitFailures,
} from '../../../lib/auth'

const RESEND_API_URL = 'https://api.resend.com/emails'

function getClientIp(req: NextApiRequest) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

async function sendLoginNotification(email: string, ip: string | undefined) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return
  }

  const body = {
    from: 'no-reply@yourdomain.com',
    to: email,
    subject: '管理后台登录通知',
    html: `<p>您已使用验证码成功登录管理后台。</p><p>登录时间：${new Date().toLocaleString()}</p><p>登录 IP：${ip || '未知'}</p>`,
  }

  try {
    await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    // 只做通知，发送失败不影响登录流程
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, message: '只允许 POST 请求。' })
  }

  const rateKey = `ip:${getClientIp(req)}`
  const rateStatus = getRateLimitStatus(rateKey)

  if (rateStatus.blocked) {
    return res.status(429).json({ ok: false, message: `登录次数过多，请在 ${Math.ceil(rateStatus.remainingMs / 1000)} 秒后重试。` })
  }

  const { email, code, token } = req.body || {}
  if (!email || !code || !token || email.trim().toLowerCase() !== ADMIN_EMAIL) {
    recordRateLimitFailure(rateKey)
    return res.status(401).json({ ok: false, message: '验证码验证失败。' })
  }

  if (!validateAdminOtpToken(email, code, token)) {
    recordRateLimitFailure(rateKey)
    return res.status(401).json({ ok: false, message: '验证码错误或已过期。' })
  }

  clearRateLimitFailures(rateKey)
  res.setHeader('Set-Cookie', createAdminCookieHeader())
  sendLoginNotification(email, getClientIp(req))
  return res.status(200).json({ ok: true })
}
