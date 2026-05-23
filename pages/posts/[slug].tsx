import { getPostBySlug } from '../../lib/posts'
import { MDXRemote } from 'next-mdx-remote'
import { renderMdx } from '../../lib/mdx'
import MDXComponents from '../../components/MDXComponents'
import { requestHasValidAuth } from '../../lib/auth'

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

export async function getServerSideProps(context: any) {
  if (!requestHasValidAuth(context.req)) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(context.resolvedUrl || '/blog')}`,
        permanent: false,
      },
    }
  }

  const { slug } = context.params
  const { content, meta } = await getPostBySlug(slug)
  const mdxSource = await renderMdx(content)
  return { props: { source: mdxSource, meta } }
}
