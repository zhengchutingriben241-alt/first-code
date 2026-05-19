import { getAllPosts } from '../lib/posts'
import PostCard from '../components/PostCard'

export default function Blog({ posts }: { posts: any[] }) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-10 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">博客文章</h1>
        <p className="mt-4 text-slate-600 leading-7">
          在这里你可以看到我发布的所有文章，涵盖技术、学习笔记、项目经验等内容。
        </p>
      </header>
      <section className="space-y-4">
        {posts.map(post => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </main>
  )
}

export async function getStaticProps() {
  const posts = await getAllPosts()
  return { props: { posts } }
}