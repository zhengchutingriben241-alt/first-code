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
