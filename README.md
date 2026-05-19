# Next.js 博客脚手架

快速开始：

```bash
npm install
npm run dev
```

主要文件：
- [package.json](package.json#L1)
- [pages/index.tsx](pages/index.tsx#L1)
- [pages/posts/[slug].tsx](pages/posts/[slug].tsx#L1)
- [content/posts/hello-world.mdx](content/posts/hello-world.mdx#L1)

Docker 运行（推荐，需先安装 Docker）：

构建并运行：

```bash
docker compose up --build
```

或只用 Dockerfile 构建镜像：

```bash
docker build -t nextjs-blog .
docker run -p 3000:3000 nextjs-blog
```

本地开发（不使用容器）：
```bash
npm install
npm run dev
```

配置自动提交到 GitHub（可选）
--
如果你希望通过网站上的上传表单自动把文章提交到 GitHub（由服务器创建 commit 并 push），请按下面步骤安全配置：

1. 在 GitHub 创建一个 Personal Access Token：
	- 进入 GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic) 或创建 Fine-grained token。
	- Classic token 选择 `repo`（或至少 `public_repo`）权限。
	- Fine-grained token 为目标仓库授予 `Contents: Read and write` 权限。
	- 生成后复制令牌（此令牌只显示一次）。

2. 在 Vercel 上配置（推荐生产环境）：
	- 打开项目设置 -> Environment Variables。
	- 添加 `GITHUB_TOKEN`（值为上一步生成的 token），`GITHUB_REPO`（格式 `owner/repo`，例如 `zhengchutingriben241-alt/first-code`）。
	- 部署时 Vercel 的 Serverless 函数会使用这些变量进行文件提交。

3. 在本地开发中测试（开发环境）：
	- 在项目根目录创建 `.env.local`（不要将其提交到仓库）：

```text
GITHUB_TOKEN=ghp_xxx...yourtoken...
GITHUB_REPO=owner/repo
GIT_COMMIT_NAME=Your Name (optional)
GIT_COMMIT_EMAIL=you@example.com (optional)
```

	- 重新启动开发服务器：`npm run dev`

安全提示：
- 永远不要把 token 提交到仓库。使用 Vercel 环境变量或本地 `.env.local`（已加入 `.gitignore`）来保护密钥。
- 为生产使用建议创建具有最小权限的细粒度令牌（只授予仓库文件写入权限）。

