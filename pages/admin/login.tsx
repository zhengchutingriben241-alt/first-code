import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { requestHasValidAdminAuth } from '../../lib/auth'

export default function AdminLogin() {
  const router = useRouter()
  const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    setLoading(false)

    if (response.ok) {
      router.push(redirect)
      return
    }

    const data = await response.json().catch(() => null)
    setError(data?.message || '邮箱或密码错误。')
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">管理后台登录</h1>
        <p className="mt-4 text-slate-600">
          使用邮箱和密码登录，管理博客内容与后台功能。
        </p>

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

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}

          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-2xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
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
