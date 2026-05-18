import Link from 'next/link'

export default function PostCard({ post }: any) {
  return (
    <article className="p-4 border rounded">
      <h2 className="text-xl font-semibold"><Link href={`/posts/${post.slug}`}>{post.title}</Link></h2>
      <p className="text-slate-500 text-sm">{post.date}</p>
      <p className="mt-2 text-slate-700">{post.description || ''}</p>
    </article>
  )
}
