import type { NextApiRequest, NextApiResponse } from 'next'
import { getAllAdminLoginLogs, requestHasValidAdminAuth } from '../../../../lib/auth'

function escapeCsvValue(value: string) {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, message: '只允许 GET 请求。' })
  }

  if (!requestHasValidAdminAuth(req)) {
    return res.status(401).json({ ok: false, message: '请先登录管理员账号。' })
  }

  const logs = getAllAdminLoginLogs()
  const header = ['timestamp', 'email', 'ip', 'method', 'success', 'reason']
  const rows = logs.map(log => [
    log.timestamp,
    log.email,
    log.ip,
    log.method,
    String(log.success),
    log.reason || '',
  ])

  const csv = [header.map(escapeCsvValue).join(','), ...rows.map(row => row.map(escapeCsvValue).join(','))].join('\r\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="admin-login-logs.csv"')
  res.status(200).send(csv)
}
