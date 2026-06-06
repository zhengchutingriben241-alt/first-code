import { getAdminLoginLogs, requestHasValidAdminAuth } from '../../lib/auth'

const PAGE_SIZE = 20

export default function AdminLogsPage({ logs, page, totalPages, total }: { logs: Array<{ timestamp: string; email: string; ip: string; method: string; success: boolean; reason?: string }>; page: number; totalPages: number; total: number }) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">登录日志</h1>
            <p className="mt-4 text-slate-600 leading-7">这里显示管理员登录与验证码操作记录，支持分页浏览和导出。</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/api/admin/logs/export"
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-700"
            >
              导出 CSV
            </a>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              共 {total} 条，当前第 {page} / {totalPages} 页
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">结果</th>
                <th className="px-4 py-3">原因</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {logs.map((entry, index) => (
                <tr key={`${entry.timestamp}-${index}`}>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{entry.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{entry.ip}</td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize">{entry.method.replace('-', ' ')}</td>
                  <td className={`px-4 py-3 whitespace-nowrap ${entry.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {entry.success ? '成功' : '失败'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{entry.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">每页显示 {PAGE_SIZE} 条</div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              className={`rounded-2xl border px-4 py-2 text-sm ${page <= 1 ? 'cursor-not-allowed border-slate-200 text-slate-400' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              href={`/admin/logs?page=${Math.max(1, page - 1)}`}
            >
              上一页
            </a>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
              <a
                key={pageNumber}
                className={`rounded-2xl px-4 py-2 text-sm ${pageNumber === page ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                href={`/admin/logs?page=${pageNumber}`}
              >
                {pageNumber}
              </a>
            ))}
            <a
              className={`rounded-2xl border px-4 py-2 text-sm ${page >= totalPages ? 'cursor-not-allowed border-slate-200 text-slate-400' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
              href={`/admin/logs?page=${Math.min(totalPages, page + 1)}`}
            >
              下一页
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

export async function getServerSideProps({ req, query }: any) {
  if (!requestHasValidAdminAuth(req)) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    }
  }

  const page = Number(query?.page || 1)
  const pageSize = PAGE_SIZE
  const { logs, total } = getAdminLoginLogs(page, pageSize)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    props: {
      logs,
      page,
      totalPages,
      total,
    },
  }
}
