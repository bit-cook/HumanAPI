const tools = [
  ['search_humans', '按技能、位置、费率和评分搜索专家'],
  ['get_human', '读取单个专家档案与能力信息'],
  ['book_human', '创建任务记录与待处理预约'],
  ['get_booking', '读取预约、支付字段与执行时间'],
  ['update_booking', '更新预约状态与完成凭据字段'],
  ['list_skills', '列出技能分类与技能条目'],
] as const

const workflow = [
  {
    number: '01',
    title: '发现合适的人',
    description: '按技能、费率、评分与位置查询当前可用且已验证的专家档案。',
    route: 'GET /api/humans',
  },
  {
    number: '02',
    title: '记录任务与预约',
    description: '将任务说明、地点、时间和预算写入任务与预约记录，保留清晰的执行上下文。',
    route: 'POST /api/tasks · /api/bookings',
  },
  {
    number: '03',
    title: '查询执行状态',
    description: '通过预约 ID 读取状态、时间与完成凭据，让 Agent 能继续后续流程。',
    route: 'GET /api/bookings/:id',
  },
] as const

const restExample = `const query = new URLSearchParams({
  skills: "现场调研",
  ratingMin: "4",
  rateMax: "200",
  availableNow: "true",
});

const response = await fetch(\`/api/humans?\${query}\`, {
  headers: {
    authorization: \`Bearer \${process.env.HUMANAPI_API_KEY}\`,
  },
});
const { data, count } = await response.json();`

const mcpExample = `const response = await fetch("/api/mcp", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: \`Bearer \${process.env.HUMANAPI_API_KEY}\`,
  },
  body: JSON.stringify({
    tool: "search_humans",
    arguments: {
      skills: ["现场调研"],
      location: { lat: 31.2304, lon: 121.4737 },
      max_distance: 5000,
      rating_min: 4,
    },
  }),
});`

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="8" cy="20" r="4" />
      <circle cx="32" cy="8" r="4" />
      <circle cx="32" cy="32" r="4" />
      <path d="M12 20h8c7 0 5-12 12-12M20 20c7 0 5 12 12 12" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#content">
        跳到主要内容
      </a>

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="HumanAPI 首页">
            <BrandMark />
            <span>HumanAPI</span>
          </a>

          <nav className="site-nav" aria-label="主要导航">
            <ul>
              <li><a href="#how">工作方式</a></li>
              <li><a href="#integrate">接口示例</a></li>
              <li><a href="#tools">MCP 工具</a></li>
              <li><a href="#scope">当前边界</a></li>
            </ul>
          </nav>

          <a className="header-action" href="https://github.com/bit-cook/HumanAPI">
            查看源码 <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main id="content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">
                <span aria-hidden="true" />
                Digital → Physical · Open source
              </p>
              <h1 id="hero-title">
                让 AI 的意图
                <br />
                <em>抵达真实世界</em>
              </h1>
              <p className="hero-lead">
                HumanAPI 是一个连接 AI Agent 与人类专家的开源参考实现：检索能力、记录任务、创建预约，再通过明确的接口查询进度。
              </p>
              <div className="hero-actions">
                <a className="button primary" href="#integrate">
                  查看真实接口 <span aria-hidden="true">↓</span>
                </a>
                <a className="button secondary" href="https://github.com/bit-cook/HumanAPI">
                  阅读 GitHub 源码 <span aria-hidden="true">↗</span>
                </a>
              </div>
              <dl className="hero-facts" aria-label="项目接口概览">
                <div><dt><code>/api/humans</code></dt><dd>REST 检索</dd></div>
                <div><dt><code>/api/mcp</code></dt><dd>工具入口</dd></div>
                <div><dt>MIT</dt><dd>开放许可</dd></div>
              </dl>
            </div>

            <figure className="signal">
              <div className="signal-bar">
                <span>request.trace</span>
                <span><i aria-hidden="true" /> reference</span>
              </div>
              <div className="signal-stage" aria-hidden="true">
                <div className="signal-node">
                  <small>Digital</small>
                  <b className="node-orb agent-orb">AI</b>
                  <strong>Agent</strong>
                  <span>structured intent</span>
                </div>
                <div className="signal-track">
                  <small>REST / MCP</small><i /><b>JSON</b><span>→</span>
                </div>
                <div className="signal-node human-node">
                  <small>Physical</small>
                  <b className="node-orb human-orb">H</b>
                  <strong>Human</strong>
                  <span>real-world action</span>
                </div>
              </div>
              <ol className="trace-list">
                <li><span>01</span><strong>discover</strong><code>GET /api/humans</code></li>
                <li><span>02</span><strong>arrange</strong><code>POST /api/bookings</code></li>
                <li><span>03</span><strong>observe</strong><code>GET /api/bookings/:id</code></li>
              </ol>
              <figcaption>一条从结构化请求到物理执行记录的可读路径。</figcaption>
            </figure>
          </div>
        </section>

        <section className="section ruled" id="how" aria-labelledby="how-title">
          <div className="section-heading split-heading">
            <div>
              <p className="section-label">01 / Workflow</p>
              <h2 id="how-title">把跨越边界的过程，拆成可读的三步。</h2>
            </div>
            <p>HumanAPI 的核心不是一句抽象口号，而是一组可检查的资源与状态：专家、任务、预约。</p>
          </div>

          <ol className="workflow-grid">
            {workflow.map((step) => (
              <li key={step.number}>
                <article>
                  <span>{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <code>{step.route}</code>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className="integration-section" id="integrate" aria-labelledby="integrate-title">
          <div className="section integration-inner">
            <div className="section-heading split-heading">
              <div>
                <p className="section-label">02 / Interface</p>
                <h2 id="integrate-title">示例与当前路由保持一致。</h2>
              </div>
              <p>不使用虚构 SDK。下面的字段直接对应仓库中的 Next.js Route Handlers，便于在本地阅读与验证。</p>
            </div>

            <div className="code-grid">
              <article className="code-window">
                <header>
                  <div><span>REST</span><h3>检索专家</h3></div>
                  <code>GET /api/humans</code>
                </header>
                <pre aria-label="REST 检索专家 JavaScript 示例"><code>{restExample}</code></pre>
                <p>
                  支持 <code>skills</code>、<code>lat</code>、<code>lon</code>、<code>maxDistance</code>、费率、评分与可用性查询字段。
                </p>
              </article>

              <article className="code-window">
                <header>
                  <div><span>MCP route</span><h3>分派工具请求</h3></div>
                  <code>POST /api/mcp</code>
                </header>
                <pre aria-label="MCP 搜索专家 JavaScript 示例"><code>{mcpExample}</code></pre>
                <p>
                  当前路由使用 <code>tool</code> + <code>arguments</code> 请求包络，并要求 Bearer 或 <code>x-api-key</code> 认证。
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section ruled tools-section" id="tools" aria-labelledby="tools-title">
          <div className="tools-intro">
            <p className="section-label">03 / Tools</p>
            <h2 id="tools-title">路由当前声明的六个工具。</h2>
            <p>携带 API Key 访问 <code>GET /api/mcp</code>，可读取同一份工具名称列表、版本与本地基础 URL。</p>
          </div>
          <ol className="tool-list">
            {tools.map(([name, description], index) => (
              <li key={name}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <code>{name}</code>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section scope-section" id="scope" aria-labelledby="scope-title">
          <div className="scope-panel">
            <div className="scope-heading">
              <p className="section-label warm">04 / Reality check</p>
              <h2 id="scope-title">当前边界，明确写在首页上。</h2>
              <p>这是用于开发与评估的开源参考实现，不是对托管服务或生产能力的承诺。</p>
            </div>

            <div className="scope-columns">
              <div>
                <h3>仓库已经包含</h3>
                <ul className="present-list">
                  <li>专家、任务与预约的 REST Route Handlers</li>
                  <li>Prisma 数据模型与匹配逻辑</li>
                  <li>声明六种操作的 MCP 工具入口</li>
                  <li>API Key 校验与输入验证基础</li>
                </ul>
              </div>
              <div>
                <h3>生产使用前仍需完成</h3>
                <ul className="next-list">
                  <li>完整的身份体系、细粒度授权、限流与审计</li>
                  <li>真实支付通道、结算与异常处理</li>
                  <li>生产级实时通讯与通知基础设施</li>
                  <li>独立安全评估、加密方案与合规认证</li>
                </ul>
              </div>
            </div>
            <p className="disclaimer">本项目当前不声称已提供生产支付、实时通讯、端到端加密或 SOC 2 认证。</p>
          </div>
        </section>

        <section className="section start-section" aria-labelledby="start-title">
          <div className="start-copy">
            <p className="section-label">05 / Start locally</p>
            <h2 id="start-title">从源码开始，而不是从承诺开始。</h2>
            <p>克隆仓库，在本地检查数据模型、路由实现与接口返回，再决定下一步如何扩展。</p>
            <a className="button primary" href="https://github.com/bit-cook/HumanAPI">
              打开 GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="terminal" aria-label="本地启动命令">
            <div>
              <span aria-hidden="true"><i /><i /><i /></span>
              <span>local.setup</span>
            </div>
            <pre><code>{`git clone https://github.com/bit-cook/HumanAPI.git
cd HumanAPI
npm install
cp .env.example .env
npx prisma generate
npm run dev`}</code></pre>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div>
            <a className="brand" href="#top" aria-label="返回 HumanAPI 首页顶部">
              <BrandMark /><span>HumanAPI</span>
            </a>
            <p>AI 与物理世界之间的开放桥梁。</p>
          </div>
          <nav aria-label="页脚导航">
            <a href="#how">工作方式</a>
            <a href="#integrate">接口示例</a>
            <a href="#scope">当前边界</a>
            <a href="https://github.com/bit-cook/HumanAPI">GitHub ↗</a>
          </nav>
        </div>
        <div className="footer-meta">
          <span>© 2026 HumanAPI</span><span>MIT License</span><span>Built in the open</span>
        </div>
      </footer>
    </div>
  )
}
