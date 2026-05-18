import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDir = path.join(process.cwd(), 'content', 'posts')

type PostMeta = {
  title: string
  date: string
  description?: string
}

type Post = PostMeta & {
  slug: string
}

export async function getAllPosts() {
  const files = fs.readdirSync(postsDir)
  const posts: Post[] = files.map(file => {
    const full = path.join(postsDir, file)
    const raw = fs.readFileSync(full, 'utf-8')
    const { data } = matter(raw)
    const slug = file.replace(/\.mdx?$/, '')
    return { ...(data as PostMeta), slug }
  })
  posts.sort((a, b) => (a.date < b.date ? 1 : -1))
  return posts
}

export async function getPostBySlug(slug: string) {
  const full = path.join(postsDir, `${slug}.mdx`)
  const raw = fs.readFileSync(full, 'utf-8')
  const { data, content } = matter(raw)
  return { meta: data as PostMeta, content }
}
