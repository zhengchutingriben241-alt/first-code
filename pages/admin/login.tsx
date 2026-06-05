import { useRouter } from 'next/router'
import { FormEvent, useEffect, useState } from 'react'
import { requestHasValidAdminAuth } from '../../lib/auth'

export default function AdminLogin() {
  const router = useRouter()
  const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/admin'
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendCooldown, setSendCooldown] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sendCooldown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setSendCooldown(prev => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [sendCooldown])

  async function handleSendCode() {
    setLoading(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/admin/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (response.ok) {
      const data = await response.json()
      setOtpToken(data.token)
      setOtpSent(true)
      setSendCooldown(60)
      setMessage('验证码已发送，请查看邮箱。')
      return
    }

    const data = await response.json().catch(() => null)
    setError(data?.message || '发送验证码失败，请重试。')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const payload = mode === 'password'
      ? { email, password }
      : { email, code, token: otpToken }

    const response = await fetch(mode === 'password' ? '/api/admin/login' : '/api/admin/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (response.ok) {
      router.push(redirect)
      return
    }

    const data = await response.json().catch(() => null)
    setError(data?.message || (mode === 'password' ? '邮箱或密码错误。' : '验证码错误或已过期。'))
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">管理后台登录</h1>
        <p className="mt-4 text-slate-600">
          请选择登录方式：邮箱密码登录或邮箱验证码登录。
        </p>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            className={`flex-1 rounded-2xl px-4 py-3 ${mode === 'password' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
            onClick={() => setMode('password')}
          >
            密码登录
          </button>
          <button
            type="button"
            className={`flex-1 rounded-2xl px-4 py-3 ${mode === 'otp' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
            onClick={() => setMode('otp')}
          >
            验证码登录
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              管理员邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              required
            />
          </div>

          {mode === 'password' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                管理员密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || sendCooldown > 0 || !email}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendCooldown > 0 ? `重新发送 (${sendCooldown}s)` : '发送验证码'}
                </button>
              </div>
              {otpSent ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="code">
                    邮箱验证码
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={event => setCode(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    required
                  />
                </div>
              ) : null}
            </div>
          )}

          {message ? <p className="text-sm text-sky-700">{message}</p> : null}
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}

          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || (mode === 'otp' && (!otpSent || !code))}
          >
            {loading ? '登录中...' : '登录管理后台'}
          </button>
        </form>
      </div>
    </main>
  )
}

export async function getServerSideProps({ req }: any) {
  if (requestHasValidAdminAuth(req)) {
    return {
      redirect: {
        destination: '/admin',
        permanent: false,
      },
    }
  }

  return { props: {} }
}
