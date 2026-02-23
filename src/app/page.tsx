export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 导航栏 */}
      <nav className="border-b border-purple-500/20 backdrop-blur-sm bg-purple-900/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">🤖</span>
            <span className="text-2xl font-bold text-white">HumanAPI</span>
          </div>
          <div className="hidden md:flex space-x-6 text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">功能</a>
            <a href="#api" className="hover:text-white transition-colors">API</a>
            <a href="https://github.com/bit-cook/HumanAPI" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Humans as a Service
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-8">
            让 AI Agent 能够调用真实世界的人类能力，连接数字与物理世界
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href="#api"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              开始使用
            </a>
            <a
              href="https://github.com/bit-cook/HumanAPI"
              className="inline-block border-2 border-purple-400 text-purple-200 px-8 py-4 rounded-lg font-semibold hover:bg-purple-400/10 transition-all"
            >
              查看文档
            </a>
          </div>
        </div>
      </section>

      {/* 统计数据 */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-purple-800/20 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
            <div className="text-4xl font-bold text-white mb-2">6+</div>
            <div className="text-purple-200">MCP 工具</div>
          </div>
          <div className="bg-purple-800/20 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
            <div className="text-4xl font-bold text-white mb-2">10+</div>
            <div className="text-purple-200">API 端点</div>
          </div>
          <div className="bg-purple-800/20 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
            <div className="text-4xl font-bold text-white mb-2">5⭐</div>
            <div className="text-purple-200">匹配算法</div>
          </div>
          <div className="bg-purple-800/20 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
            <div className="text-4xl font-bold text-white mb-2">100%</div>
            <div className="text-purple-200">开源</div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          核心功能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all">
            <div className="text-5xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Agent 专用</h3>
            <p className="text-purple-200">
              通过 MCP 协议轻松集成到任何 AI Agent，让 AI 能够调用真实人类完成任务
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-4">智能匹配</h3>
            <p className="text-purple-200">
              5 维度评分系统（技能、位置、评分、可用性、价格），自动找到最合适的专家
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-2xl font-bold text-white mb-4">实时通讯</h3>
            <p className="text-purple-200">
              AI、人类、平台三方实时沟通，任务进度透明可追踪
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-2xl font-bold text-white mb-4">支付集成</h3>
            <p className="text-purple-200">
              Stripe Connect 集成，支持多币种，自动结算，安全合规
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold text-white mb-4">多语言支持</h3>
            <p className="text-purple-200">
              完整的中英文支持，多币种兼容，全球可用
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all">
            <div className="text-5xl mb-4">🛡️</div>
            <h3 className="text-2xl font-bold text-white mb-4">安全保障</h3>
            <p className="text-purple-200">
              完善的认证、评价、争议处理机制，保障双方权益
            </p>
          </div>
        </div>
      </section>

      {/* MCP 工具列表 */}
      <section id="api" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          MCP 工具
        </h2>
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-800/20 to-pink-800/20 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20">
          <div className="space-y-4">
            <div className="flex items-start space-x-4 text-purple-200">
              <div className="text-2xl">🔍</div>
              <div>
                <div className="font-bold text-white">search_humans</div>
                <div className="text-sm">搜索可用的人类专家，支持技能、位置、评分筛选</div>
              </div>
            </div>
            <div className="flex items-start space-x-4 text-purple-200">
              <div className="text-2xl">👤</div>
              <div>
                <div className="font-bold text-white">get_human</div>
                <div className="text-sm">获取专家详细信息、技能、评价</div>
              </div>
            </div>
            <div className="flex items-start space-x-4 text-purple-200">
              <div className="text-2xl">📅</div>
              <div>
                <div className="font-bold text-white">book_human</div>
                <div className="text-sm">预订专家完成任务，支持预约时间</div>
              </div>
            </div>
            <div className="flex items-start space-x-4 text-purple-200">
              <div className="text-2xl">📊</div>
              <div>
                <div className="font-bold text-white">get_booking</div>
                <div className="text-sm">查看预订状态和详细信息</div>
              </div>
            </div>
            <div className="flex items-start space-x-4 text-purple-200">
              <div className="text-2xl">✅</div>
              <div>
                <div className="font-bold text-white">update_booking</div>
                <div className="text-sm">更新预订状态，确认任务完成</div>
              </div>
            </div>
            <div className="flex items-start space-x-4 text-purple-200">
              <div className="text-2xl">📋</div>
              <div>
                <div className="font-bold text-white">list_skills</div>
                <div className="text-sm">列出所有可用的技能分类</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-12 border border-purple-500/30">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好让 AI 连接真实世界了吗？
          </h2>
          <p className="text-purple-200 mb-8">
            立即集成 HumanAPI MCP Server，让您的 AI Agent 能够调用真实人类的能力
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href="https://github.com/bit-cook/HumanAPI"
              className="inline-block bg-white text-purple-900 px-8 py-4 rounded-lg font-semibold hover:bg-purple-100 transition-all"
            >
              📦 Clone 项目
            </a>
            <a
              href="/api/mcp"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              🔌 查看 API
            </a>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-purple-500/20 backdrop-blur-sm bg-purple-900/10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-purple-200">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <span className="text-2xl">🤖</span>
              <span className="font-bold">HumanAPI</span>
            </div>
            <div className="text-sm space-x-4">
              <a href="https://github.com/bit-cook/HumanAPI" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://github.com/bit-cook/HumanAPI/blob/main/LICENSE" className="hover:text-white transition-colors">License</a>
              <span>MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}