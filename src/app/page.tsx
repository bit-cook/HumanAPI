const tools = [
  ['search_humans', '按技能、位置、评分和预算筛选专家'],
  ['get_human', '读取专家档案、认证与服务记录'],
  ['book_human', '创建任务并预订指定专家'],
  ['get_booking', '查询任务、付款与执行状态'],
  ['update_booking', '推进执行状态并提交完成证明'],
  ['list_skills', '发现平台当前支持的技能目录'],
] as const

const capabilities = [
  ['01', 'Agent 原生入口', '通过 MCP stdio 服务或 REST API，让 Agent 使用结构化参数发现和预订人类专家。'],
  ['02', '五维匹配', '综合技能、距离、评分、可用性与价格，返回可解释的匹配分数。'],
  ['03', '完整任务状态', '从 OPEN 到 COMPLETED，任务和预订状态保持关联，支持完成证明与争议数据。'],
] as const

const example = `const response = await fetch('/api/mcp', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    tool: 'search_humans',
    arguments: {
      skills: ['现场调研', '摄影'],
      location: { lat: 31.2304, lon: 121.4737 },
      max_distance: 5000,
      rating_min: 4.5
    }
  })
})`

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#content">跳到主要内容</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="HumanAPI 首页"><span className="brand-mark">H</span><span>HumanAPI</span></a>
        <nav className="site-nav" aria-label="主要导航"><a href="#how">工作方式</a><a href="#tools">MCP 工具</a><a href="#integrate">集成</a></nav>
        <a className="header-action" href="https://github.com/bit-cook/HumanAPI">查看源码 <span aria-hidden="true">↗</span></a>
      </header>

      <div id="content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span aria-hidden="true" /> AI → API → HUMAN</p>
            <h1 id="hero-title">给 Agent 一双<br /><em>抵达现实的手</em></h1>
            <p className="hero-lead">HumanAPI 把需要现场执行的任务转化为可调用接口：发现合适的人、创建预订、追踪进度，直到真实世界返回结果。</p>
            <div className="hero-actions"><a className="button primary" href="#integrate">开始本地集成</a><a className="button secondary" href="#how">了解工作方式</a></div>
            <dl className="hero-facts"><div><dt>6</dt><dd>MCP 工具</dd></div><div><dt>REST</dt><dd>App Router API</dd></div><div><dt>MIT</dt><dd>开源许可</dd></div></dl>
          </div>

          <div className="signal" aria-label="任务从 Agent 流向人类专家的示意图">
            <div className="signal-node"><span>REQUEST</span><strong>AI Agent</strong><small>需要上海现场拍摄</small></div>
            <div className="signal-track"><i /><span>MCP / REST</span></div>
            <div className="signal-core"><strong>HumanAPI</strong><small>match 94</small></div>
            <div className="signal-track reverse"><i /><span>PROOF</span></div>
            <div className="signal-node"><span>PHYSICAL</span><strong>人类专家</strong><small>接单 · 执行 · 回传</small></div>
          </div>
        </section>

        <section className="section" id="how" aria-labelledby="how-title">
          <div className="section-heading"><p className="eyebrow">HOW IT WORKS</p><h2 id="how-title">一条可追踪的现实任务链</h2><p>平台不替 Agent 假装完成现实任务，而是把责任、状态和结果清楚地连接起来。</p></div>
          <div className="capability-grid">
            {capabilities.map(([marker, title, text]) => <article className="capability" key={marker}><span>{marker}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="section tools-section" id="tools" aria-labelledby="tools-title">
          <div className="section-heading"><p className="eyebrow">TOOL SURFACE</p><h2 id="tools-title">六个动作，覆盖任务生命周期</h2></div>
          <div className="tool-list">
            {tools.map(([name, description], index) => <article className="tool-row" key={name}><span>{String(index + 1).padStart(2, '0')}</span><code>{name}</code><p>{description}</p><b aria-hidden="true">→</b></article>)}
          </div>
        </section>

        <section className="section integration" id="integrate" aria-labelledby="integration-title">
          <div className="integration-copy"><p className="eyebrow">LOCAL FIRST</p><h2 id="integration-title">从一次真实请求开始</h2><p>克隆仓库、配置 PostgreSQL，然后通过统一的 MCP 路由调用工具。配置 API Key 后，请求需要 Bearer 或 <code>x-api-key</code>。</p>
            <ol className="steps"><li><span>1</span><code>npm ci</code></li><li><span>2</span><code>npx prisma migrate deploy</code></li><li><span>3</span><code>npm run dev</code></li></ol>
            <a className="button primary" href="https://github.com/bit-cook/HumanAPI#快速开始">阅读快速开始</a>
          </div>
          <div className="code-window" aria-label="MCP API 调用示例"><div><span>request.ts</span><span>TypeScript</span></div><pre><code>{example}</code></pre></div>
        </section>
      </div>

      <footer className="site-footer"><div><strong>HumanAPI</strong><span>Humans as a Service</span></div><p>MIT License · 接口连接数字世界，责任留在现实世界。</p><a href="https://github.com/bit-cook/HumanAPI">GitHub ↗</a></footer>
    </main>
  )
}
