import Link from 'next/link'
import { getAllPosts } from '../lib/posts'
import PostCard from '../components/PostCard'

export default function Home({ posts }: { posts: any[] }) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">欢迎来到我的个人网站</h1>
        <p className="mt-4 text-slate-600 leading-8">
          这是一个基于 Next.js 的个人博客站点，包含博客文章、关于我的介绍页，以及未来的更多内容。
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/blog" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
            阅读博客
          </Link>
          <Link href="/about" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
            关于我
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-slate-900">最新文章</h2>
        <div className="mt-6 space-y-4">
          {posts.slice(0, 3).map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  )
}

export async function getStaticProps() {
  const posts = await getAllPosts()
  return { props: { posts } }
}
