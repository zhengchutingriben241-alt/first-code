import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminCookieHeader, validateAdminCredentials } from '../../../lib/auth'

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendLoginNotification(email: string, ip: string | undefined) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return
  }

  const body = {
    from: 'no-reply@yourdomain.com',
    to: email,
    subject: '管理后台登录通知',
    html: `<p>您已成功登录管理后台。</p><p>登录时间：${new Date().toLocaleString()}</p><p>登录 IP：${ip || '未知'}</p>`,
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

  const { email, password } = req.body || {}
  if (!email || !password || !validateAdminCredentials(email, password)) {
    return res.status(401).json({ ok: false, message: '邮箱或密码错误。' })
  }

  res.setHeader('Set-Cookie', createAdminCookieHeader())
  sendLoginNotification(email, req.headers['x-forwarded-for'] as string | undefined)
  return res.status(200).json({ ok: true })
}
