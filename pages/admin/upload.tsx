import { useState } from 'react'

export default function UploadPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, date, description, content }),
      })
      const json = await res.json()
      if (res.ok) {
        setMessage('上传成功：' + json.path)
        setTitle('')
        setSlug('')
        setDate('')
        setDescription('')
        setContent('')
      } else {
        setMessage('上传失败：' + (json.error || res.statusText))
      }
    } catch (err: any) {
      setMessage('上传出错：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">上传博客文章</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Slug（用于 URL，例：hello-world）</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">日期（YYYY-MM-DD，可选）</label>
          <input value={date} onChange={e => setDate(e.target.value)} placeholder="2026-05-19" className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">描述（可选）</label>
          <input value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">内容（MDX）</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} className="mt-1 w-full rounded border px-3 py-2 font-mono" />
        </div>
        <div>
          <button disabled={loading} className="rounded bg-slate-900 px-4 py-2 text-white">
            {loading ? '上传中...' : '上传'}
          </button>
        </div>
      </form>
      {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
      <p className="mt-6 text-xs text-slate-500">提示：此接口会把文章写入仓库的 <code>content/posts/</code> 目录。若部署在 Vercel 等平台，服务器写入不可持久化，请改用 Git 或 Headless CMS 来管理文章。</p>
    </main>
  )
}
