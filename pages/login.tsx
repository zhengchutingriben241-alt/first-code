import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { requestHasValidAuth } from '../lib/auth'

export default function Login() {
  const router = useRouter()
  const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/blog'
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (response.ok) {
      router.push(redirect)
      return
    }

    const data = await response.json().catch(() => null)
    setError(data?.message || '密码错误，请重试。')
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">文章访问保护</h1>
        <p className="mt-4 text-slate-600">
          请输入访问密码后，才能查看受保护的博客文章。
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              访问密码
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
            {loading ? '验证中...' : '登录查看文章'}
          </button>
        </form>
      </div>
    </main>
  )
}

export async function getServerSideProps({ req, query }: any) {
  if (requestHasValidAuth(req)) {
    const redirect = typeof query.redirect === 'string' && query.redirect ? query.redirect : '/blog'
    return {
      redirect: {
        destination: redirect,
        permanent: false,
      },
    }
  }

  return { props: {} }
}
