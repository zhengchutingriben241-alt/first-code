import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

type Body = {
  title: string
  slug: string
  date?: string
  description?: string
  content: string
}

async function pushToGithub(repo: string, token: string, filePath: string, contentBase64: string, message: string, committer?: { name?: string; email?: string }) {
  const api = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(filePath)}`
  const headers: any = {
    Authorization: `token ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  }

  // Check if file exists to obtain sha for update
  let sha: string | undefined
  try {
    const r = await fetch(api, { headers })
    if (r.ok) {
      const j = await r.json()
      sha = j.sha
    }
  } catch (err) {
    // ignore — we'll try to create the file
  }

  const body: any = {
    message,
    content: contentBase64,
  }
  if (sha) body.sha = sha
  if (committer) body.committer = committer

  const putRes = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) })
  if (!putRes.ok) {
    const errText = await putRes.text()
    throw new Error(`GitHub API error: ${putRes.status} ${errText}`)
  }
  return await putRes.json()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body as Body
  if (!body || !body.title || !body.slug || !body.content) {
    return res.status(400).json({ error: 'Missing required fields: title, slug, content' })
  }

  // Sanitize slug
  const slug = body.slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const date = body.date || new Date().toISOString().slice(0, 10)
  const frontmatter = `---\ntitle: "${body.title.replace(/"/g, '\\"')}"\ndate: "${date}"\ndescription: "${(body.description || '').replace(/"/g, '\\"')}"\n---\n\n`
  const mdx = frontmatter + body.content

  const postsDir = path.join(process.cwd(), 'content', 'posts')
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true })
  const filePathLocal = path.join(postsDir, `${slug}.mdx`)

  try {
    fs.writeFileSync(filePathLocal, mdx, 'utf-8')
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to write file locally: ' + err.message })
  }

  // If GitHub token and repo provided, push commit to repo (creates or updates file)
  const ghToken = process.env.GITHUB_TOKEN
  const ghRepo = process.env.GITHUB_REPO // expected format: owner/repo
  if (ghToken && ghRepo) {
    try {
      const repoPath = `content/posts/${slug}.mdx`
      const contentBase64 = Buffer.from(mdx, 'utf-8').toString('base64')
      const message = `Add/update blog post ${slug} via upload API`
      const committer = process.env.GIT_COMMIT_NAME || process.env.GITHUB_ACTOR || undefined
        ? { name: process.env.GIT_COMMIT_NAME || process.env.GITHUB_ACTOR, email: process.env.GIT_COMMIT_EMAIL || undefined }
        : undefined

      const result = await pushToGithub(ghRepo, ghToken, repoPath, contentBase64, message, committer)
      return res.status(200).json({ ok: true, path: `/content/posts/${slug}.mdx`, github: { content: result.content?.path, commit: result.commit?.sha } })
    } catch (err: any) {
      // If GitHub push fails, still return success for local write but inform about error
      return res.status(200).json({ ok: true, path: `/content/posts/${slug}.mdx`, warning: 'GitHub push failed: ' + err.message })
    }
  }

  return res.status(200).json({ ok: true, path: `/content/posts/${slug}.mdx` })
}
