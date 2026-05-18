import { getPostBySlug, getAllPosts } from '../../lib/posts'
import { MDXRemote } from 'next-mdx-remote'
import { renderMdx } from '../../lib/mdx'
import MDXComponents from '../../components/MDXComponents'

export default function Post({ source, meta }: any) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <article>
        <h1 className="text-3xl font-bold">{meta.title}</h1>
        <p className="text-slate-500">{meta.date}</p>
        <section className="prose mt-6">
          <MDXRemote {...source} components={MDXComponents} />
        </section>
      </article>
    </main>
  )
}

export async function getStaticPaths() {
  const posts = await getAllPosts()
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: any) {
  const { content, meta } = await getPostBySlug(params.slug)
  const mdxSource = await renderMdx(content)
  return { props: { source: mdxSource, meta } }
}
