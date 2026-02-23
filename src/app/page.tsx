"use client"

import { useState } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('search')

  const codeExamples = {
    search: `// 搜索人类专家
const humans = await mcp.search_humans({
  skills: ["开会", "签名"],
  location: { lat: 31.2304, lon: 121.4737 },
  max_distance: 5000,
  rating_min: 4.5
});

// 返回匹配的人类专家列表
console.log(humans.data)`,

    book: `// 预订人类专家
const booking = await mcp.book_human({
  human_id: "human_123",
  task_description: "代替我出席上海分公司会议",
  task_location: {
    lat: 31.2304,
    lon: 121.4737,
    address: "上海市浦东新区"
  },
  scheduled_time: "2026-02-24T14:00:00Z",
  estimated_duration: 120,
  payment_amount: 100
});

console.log(booking.data.booking_id);`,

    status: `// 获取预订状态
const status = await mcp.get_booking({
  id: "booking_123"
});

// 查看状态
console.log(status.data.status);
// "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

// 完成任务
await mcp.update_booking({
  id: "booking_123",
  status: "COMPLETED",
  proof: "会议纪要已上传"
});`,

    skills: `// 获取所有可用技能
const skills = await mcp.list_skills();

// 按分类获取
console.log(skills.data.categories);
// [
//   { name: "商务服务", skills: [...] },
//   { name: "生活服务", skills: [...] },
//   { name: "专业服务", skills: [...] }
// ]`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-500/20 backdrop-blur-lg bg-purple-900/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-3xl animate-pulse">🤖</span>
            <span className="text-2xl font-bold text-white">HumanAPI</span>
          </div>
          <div className="hidden md:flex space-x-8 text-gray-300">
            <a href="#features" className="hover:text-white transition-all duration-300 hover:scale-105">功能</a>
            <a href="#how-it-works" className="hover:text-white transition-all duration-300 hover:scale-105">如何使用</a>
            <a href="#code" className="hover:text-white transition-all duration-300 hover:scale-105">代码示例</a>
            <a href="#api" className="hover:text-white transition-all duration-300 hover:scale-105">API</a>
            <a href="https://github.com/bit-cook/HumanAPI" className="hover:text-white transition-all duration-300 hover:scale-105">GitHub</a>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="container mx-auto px-4 pt-32 pb-20 text-center relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-block px-4 py-2 mb-6 bg-purple-500/20 rounded-full border border-purple-500/30 text-purple-200 text-sm animate-fade-in">
            ✨ 连接数字世界与物理世界
          </div>
          <h1 className="text-5xl md:text-8xl font-bold text-white mb-6 leading-tight">
            Humans as a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">Service</span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            让 AI Agent 能够调用真实世界的人类能力，<br className="hidden md:block"/>
            突破数字边界，完成物理世界任务
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href="#code"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105"
            >
              🚀 开始集成
            </a>
            <a
              href="https://github.com/bit-cook/HumanAPI"
              className="inline-block border-2 border-purple-400/50 text-purple-200 px-8 py-4 rounded-xl font-semibold hover:bg-purple-400/10 transition-all duration-300 hover:scale-105"
            >
              ⭐ Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* 动画装饰 */}
      <div className="flex justify-center -mt-16 relative z-20">
        <div className="flex space-x-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* 统计数据 */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: '6+', label: 'MCP 工具', icon: '🔌' },
            { num: '10+', label: 'API 端点', icon: '📡' },
            { num: '5⭐', label: '智能匹配', icon: '🎯' },
            { num: '100%', label: '开源免费', icon: '💯' },
          ].map((item, i) => (
            <div key={i} className="group bg-purple-800/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="text-4xl mb-2">{item.icon}</div>
              <div className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">{item.num}</div>
              <div className="text-purple-200">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          核心功能
        </h2>
        <p className="text-purple-200 text-center mb-16 max-w-2xl mx-auto">
          完整的技术栈，让 AI Agent 能够轻松调用人类能力
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: '🤖', title: 'AI Agent 专用', desc: '通过 MCP 协议轻松集成到任何 AI Agent，让 AI 能够调用真实人类完成任务', color: 'from-purple-500 to-pink-500' },
            { icon: '🎯', title: '智能匹配', desc: '5 维度评分系统（技能、位置、评分、可用性、价格），自动找到最合适的专家', color: 'from-pink-500 to-rose-500' },
            { icon: '💬', title: '实时通讯', desc: 'AI、人类、平台三方实时沟通，任务进度透明可追踪', color: 'from-rose-500 to-orange-500' },
            { icon: '💳', title: '支付集成', desc: 'Stripe Connect 集成，支持多币种，自动结算，安全合规', color: 'from-orange-500 to-amber-500' },
            { icon: '🌍', title: '多语言支持', desc: '完整的中英文支持，多币种兼容，全球可用', color: 'from-amber-500 to-green-500' },
            { icon: '🛡️', title: '安全保障', desc: '完善的认证、评价、争议处理机制，保障双方权益', color: 'from-green-500 to-teal-500' },
          ].map((item, i) => (
            <div key={i} className="group bg-gradient-to-br from-purple-800/20 to-pink-800/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className={`text-5xl mb-4 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-purple-200 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 如何工作 */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          如何工作
        </h2>
        <p className="text-purple-200 text-center mb-16 max-w-2xl mx-auto">
          简单四步，让 AI 连接真实世界
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          {[
            { step: '01', title: '集成 MCP', desc: '在 AI Agent 中配置 MCP Server', icon: '🔌' },
            { step: '02', title: '搜索专家', desc: '使用技能、位置等条件搜索', icon: '🔍' },
            { step: '03', title: '预订任务', desc: '指定时间地点预订人类', icon: '📅' },
            { step: '04', title: '完成交付', desc: '实时追踪，确认完成', icon: '✅' },
          ].map((item, i) => (
            <div key={i} className="flex-1 relative">
              {i < 3 && (
                <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 -translate-y-1/2 -z-10"></div>
              )}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white text-3xl font-bold mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="text-purple-400 text-sm font-mono mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-purple-200 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 代码示例 */}
      <section id="code" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          快速集成
        </h2>
        <p className="text-purple-200 text-center mb-12 max-w-2xl mx-auto">
          几行代码，轻松将人类能力集成到你的 AI Agent
        </p>
        
        <div className="max-w-4xl mx-auto">
          {/* Tab 导航 */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {[
              { id: 'search', label: '🔍 搜索专家' },
              { id: 'book', label: '📅 预订任务' },
              { id: 'status', label: '📊 查看状态' },
              { id: 'skills', label: '📋 技能列表' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-purple-800/30 text-purple-200 hover:bg-purple-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 代码展示 */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden">
            <div className="flex items-center px-4 py-3 bg-purple-900/50 border-b border-purple-500/20">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="ml-4 text-purple-300 text-sm font-mono">example.js</div>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm font-mono text-green-400">
                {codeExamples[activeTab as keyof typeof codeExamples]}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* MCP 工具列表 */}
      <section id="api" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          MCP 工具
        </h2>
        <p className="text-purple-200 text-center mb-16 max-w-2xl mx-auto">
          完整的工具集，满足各种场景需求
        </p>
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-800/20 to-pink-800/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: 'search_humans', desc: '搜索可用的人类专家，支持技能、位置、评分筛选', icon: '🔍' },
              { name: 'get_human', desc: '获取专家详细信息、技能、评价', icon: '👤' },
              { name: 'book_human', desc: '预订专家完成任务，支持预约时间', icon: '📅' },
              { name: 'get_booking', desc: '查看预订状态和详细信息', icon: '📊' },
              { name: 'update_booking', desc: '更新预订状态，确认任务完成', icon: '✅' },
              { name: 'list_skills', desc: '列出所有可用的技能分类', icon: '📋' },
            ].map((tool, i) => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-xl bg-purple-900/30 hover:bg-purple-800/40 transition-colors">
                <div className="text-3xl">{tool.icon}</div>
                <div>
                  <div className="font-mono text-purple-300 font-bold">{tool.name}</div>
                  <div className="text-purple-200 text-sm">{tool.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-12 border border-purple-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-4">
              准备好让 AI 连接真实世界了吗？
            </h2>
            <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
              立即集成 HumanAPI MCP Server，让您的 AI Agent 能够调用真实人类的能力
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a
                href="https://github.com/bit-cook/HumanAPI"
                className="inline-flex items-center justify-center bg-white text-purple-900 px-8 py-4 rounded-xl font-bold hover:bg-purple-100 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <span className="text-2xl mr-2">📦</span>
                Clone 项目
              </a>
              <a
                href="/api/mcp"
                className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <span className="text-2xl mr-2">🔌</span>
                查看 API
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-purple-500/20 backdrop-blur-sm bg-purple-900/20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <span className="text-4xl">🤖</span>
              <div>
                <div className="text-xl font-bold text-white">HumanAPI</div>
                <div className="text-purple-400 text-sm">让 AI 连接真实世界</div>
              </div>
            </div>
            <div className="flex space-x-6 text-purple-300">
              <a href="https://github.com/bit-cook/HumanAPI" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://github.com/bit-cook/HumanAPI/blob/main/LICENSE" className="hover:text-white transition-colors">License</a>
              <a href="https://github.com/bit-cook/HumanAPI/issues" className="hover:text-white transition-colors">反馈</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-purple-500/10 text-center text-purple-400 text-sm">
            © 2026 HumanAPI. MIT License. Made with ❤️ by Bit Cook
          </div>
        </div>
      </footer>
    </div>
  )
}