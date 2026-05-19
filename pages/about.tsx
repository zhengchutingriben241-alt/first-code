export default function About() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">关于我</h1>
        <p className="mt-6 text-slate-600 leading-8">
          你好！我是一个热爱编程和写作的开发者，喜欢用博客记录学习过程、分享项目经验，并不断提升自己的前端技能。
        </p>
        <div className="mt-8 space-y-6 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">我的使命</h2>
            <p className="mt-3">
              我希望通过博客把学习到的知识整理成文章，帮助自己复盘，同时也让其他朋友能够更快上手技术。
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">擅长方向</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Next.js 与 React 应用开发</li>
              <li>MDX 和博客内容管理</li>
              <li>前端样式与 Tailwind CSS</li>
              <li>静态网站部署与性能优化</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">联系方式</h2>
            <p className="mt-3">
              如果你对我的文章感兴趣，可以随时联系我，或者在项目上线后通过留言、社交媒体与我一起交流。
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}