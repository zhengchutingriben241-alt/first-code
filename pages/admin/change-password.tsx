import { FormEvent, useState } from 'react'
import { requestHasValidAdminAuth } from '../../lib/auth'

export default function AdminChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setIsSuccess(false)

    if (newPassword !== confirmPassword) {
      setMessage('两次输入的新密码不一致。')
      return
    }

    const response = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const result = await response.json()
    if (!result.ok) {
      setMessage(result.message || '修改密码失败，请重试。')
      return
    }

    setMessage('密码修改成功。请妥善保存新密码。')
    setIsSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">修改管理员密码</h1>
        <p className="mt-4 text-slate-600 leading-7">请输入当前密码和新的密码，修改后系统将使用新密码进行登录验证。</p>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">当前密码</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {message ? (
            <div className={`rounded-2xl px-4 py-3 text-sm ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message}
            </div>
          ) : null}

          <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-700">
            保存新密码
          </button>
        </form>
      </div>
    </main>
  )
}

export async function getServerSideProps({ req }: any) {
  if (!requestHasValidAdminAuth(req)) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    }
  }

  return { props: {} }
}
