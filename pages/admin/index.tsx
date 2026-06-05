import { useRouter } from 'next/router'
import { requestHasValidAdminAuth } from '../../lib/auth'

export default function AdminDashboard() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">管理后台</h1>
        <p className="mt-4 text-slate-600 leading-7">
          已登录管理员身份。你可以在此访问后台功能、上传新文章或管理内容。
        </p>

        <div className="mt-10 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">快速入口</h2>
            <ul className="mt-4 space-y-3 text-slate-700">
              <li>
                <a className="font-medium text-sky-700 hover:text-sky-900" href="/admin/upload">
                  上传博客文章
                </a>
              </li>
              <li>
                <a className="font-medium text-sky-700 hover:text-sky-900" href="/blog">
                  查看文章列表
                </a>
              </li>
            </ul>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-2xl bg-rose-600 px-5 py-3 text-white transition hover:bg-rose-700"
          >
            退出登录
          </button>
        </div>
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
