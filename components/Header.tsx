import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-slate-900">
          我的博客
        </Link>
        <nav className="flex items-center gap-4 text-slate-700">
          <Link href="/" className="hover:text-slate-900">
            首页
          </Link>
          <Link href="/blog" className="hover:text-slate-900">
            博客
          </Link>
          <Link href="/about" className="hover:text-slate-900">
            关于我
          </Link>
          <Link href="/admin/upload" className="hover:text-slate-900">
            管理
          </Link>
        </nav>
      </div>
    </header>
  )
}
