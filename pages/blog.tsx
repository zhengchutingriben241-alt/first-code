import { getAllPosts } from '../lib/posts'
import PostCard from '../components/PostCard'
import { requestHasValidAuth } from '../lib/auth'

export default function Blog({ posts }: { posts: any[] }) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-10 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">博客文章</h1>
        <p className="mt-4 text-slate-600 leading-7">
          本站文章已开启访问保护，登录后可查看完整内容。
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

export async function getServerSideProps(context: any) {
  if (!requestHasValidAuth(context.req)) {
    return {
      redirect: {
        destination: `/login?redirect=/blog`,
        permanent: false,
      },
    }
  }

  const posts = await getAllPosts()
  return { props: { posts } }
}