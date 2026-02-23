"use client"

import { useState, useEffect } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const features = [
    { icon: "🤖", title: "AI Agent 专用", desc: "MCP 协议原生集成，AI Agent 可直接调用人类能力", gradient: "from-violet-500 to-purple-500" },
    { icon: "🎯", title: "智能匹配", desc: "5维度评分系统，自动匹配最合适的专家", gradient: "from-purple-500 to-fuchsia-500" },
    { icon: "⚡", title: "实时通讯", desc: "AI、人类、平台三方实时沟通协作", gradient: "from-fuchsia-500 to-pink-500" },
    { icon: "💳", title: "支付集成", desc: "Stripe Connect 多币种支付，安全合规", gradient: "from-pink-500 to-rose-500" },
    { icon: "🌐", title: "全球覆盖", desc: "支持多语言、多币种、全球可用", gradient: "from-rose-500 to-orange-500" },
    { icon: "🛡️", title: "企业级安全", desc: "SOC2 认证，端到端加密保护", gradient: "from-orange-500 to-amber-500" },
  ]

  const codeExamples = [
    {
      title: "搜索人类专家",
      code: `const experts = await mcp.search_humans({
  skills: ["会议演讲", "商务谈判"],
  location: { lat: 31.2304, lon: 121.4737 },
  rating_min: 4.5,
  max_distance: 5000
});`,
      icon: "🔍"
    },
    {
      title: "预订任务",
      code: `const booking = await mcp.book_human({
  human_id: "expert_123",
  task: "代替参加重要会议",
  location: "上海市浦东新区",
  time: "2026-02-24T14:00:00Z",
  duration: 120,
  budget: 150
});`,
      icon: "📅"
    },
    {
      title: "追踪状态",
      code: `const status = await mcp.get_booking({
  id: "booking_456"
});

// status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
console.log(status.data.state);`,
      icon: "📊"
    },
    {
      title: "完成任务",
      code: `await mcp.complete_booking({
  id: "booking_456",
  proof: "会议纪要.pdf",
  rating: 5,
  feedback: "非常专业！"
});`,
      icon: "✅"
    }
  ]

  const stats = [
    { value: "6+", label: "MCP 工具", icon: "🔌" },
    { value: "10+", label: "API 端点", icon: "📡" },
    { value: "5⭐", label: "智能匹配", icon: "🎯" },
    { value: "100%", label: "开源免费", icon: "💯" },
  ]

  return (
    <div className={`min-h-screen bg-black text-white transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* 动态背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* 渐变光晕 */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px] transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
            left: mousePosition.x > 0 ? mousePosition.x - 300 : '50%',
            top: mousePosition.y > 0 ? mousePosition.y - 300 : '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* 底部光晕 */}
        <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-purple-900/20 to-transparent"></div>
        
        {/* 顶部光晕 */}
        <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-violet-900/10 to-transparent"></div>
      </div>

      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <span className="text-3xl">🧬</span>
              <div className="absolute inset-0 blur-lg bg-purple-500/50 animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">HumanAPI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {['功能', '代码示例', '文档', 'GitHub'].map((item, i) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-300 relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </div>

          <a 
            href="#get-started"
            className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm transition-all duration-300"
          >
            开始使用
          </a>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          {/* 标签 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-purple-300">连接 AI 与真实世界</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Humans as a
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient">
              Service
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            让 AI Agent 能够调用真实世界的人类能力<br/>
            突破数字边界，完成物理世界任务
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <a 
              href="#code-example"
              className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full font-semibold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>🚀</span>
                <span>开始集成</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
            
            <a 
              href="https://github.com/bit-cook/HumanAPI"
              className="group px-8 py-4 border border-white/10 rounded-full font-semibold flex items-center gap-2 hover:bg-white/5 transition-all duration-300"
            >
              <span>⭐</span>
              <span>GitHub</span>
            </a>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {[
              { value: "6+", label: "MCP 工具", icon: "🔌" },
              { value: "10+", label: "API 端点", icon: "📡" },
              { value: "5⭐", label: "智能匹配", icon: "🎯" },
              { value: "100%", label: "开源免费", icon: "💯" },
            ].map((stat, i) => (
              <div 
                key={i}
                className="p-6 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white/10 transition-all duration-500"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 滚动指示器 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-500">向下滚动</span>
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* 功能展示 */}
      <section id="features" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                核心功能
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              完整的技术栈，让 AI Agent 能够轻松调用人类能力
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group p-8 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white/10 transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 代码示例 */}
      <section id="code-example" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                几行代码
              </span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> 轻松集成</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              像调用普通 API 一样调用真实世界的人类
            </p>
          </div>

          {/* Tab 导航 */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {codeExamples.map((example, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === i
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{example.icon}</span>
                <span>{example.title}</span>
              </button>
            ))}
          </div>

          {/* 代码展示 */}
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden">
            {/* 窗口装饰 */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="ml-4 text-xs text-gray-500 font-mono">example.ts</div>
            </div>
            
            {/* 代码内容 */}
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed">
                <code className="text-gray-300">
                  {codeExamples[activeTab].code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-gray-600 w-8 select-none">{i + 1}</span>
                      <span className={
                        line.includes('const') || line.includes('await') ? 'text-purple-400' :
                        line.includes('//') ? 'text-gray-500' :
                        line.includes('{') || line.includes('}') ? 'text-yellow-300' :
                        line.includes(':') ? 'text-blue-300' :
                        'text-gray-300'
                      }>{line}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* 渐变边框效果 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* MCP 工具 */}
      <section id="docs" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                MCP 工具
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              完整的工具集，满足各种场景需求
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "search_humans", desc: "搜索可用的人类专家", icon: "🔍" },
              { name: "get_human", desc: "获取专家详细信息", icon: "👤" },
              { name: "book_human", desc: "预订专家完成任务", icon: "📅" },
              { name: "get_booking", desc: "查看预订状态", icon: "📊" },
              { name: "update_booking", desc: "更新预订状态", icon: "✏️" },
              { name: "list_skills", desc: "列出可用技能", icon: "📋" },
            ].map((tool, i) => (
              <div 
                key={i}
                className="group p-5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all duration-300 flex items-center gap-4"
              >
                <div className="text-2xl">{tool.icon}</div>
                <div>
                  <div className="font-mono text-purple-300 font-medium">{tool.name}</div>
                  <div className="text-sm text-gray-500">{tool.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="relative bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-pink-900/30 border border-purple-500/20 rounded-3xl p-12 text-center overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-pink-500/10"></div>
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4 text-white">
                准备好让 AI 连接真实世界了吗？
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                立即集成 HumanAPI MCP Server，让您的 AI Agent 能够调用真实人类的能力
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <a 
                  href="https://github.com/bit-cook/HumanAPI"
                  className="px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                >
                  📦 Clone 项目
                </a>
                <a 
                  href="#code-example"
                  className="px-8 py-4 border border-white/20 text-white rounded-full font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  📖 查看文档
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧬</span>
              <div>
                <div className="font-bold text-white">HumanAPI</div>
                <div className="text-sm text-gray-500">让 AI 连接真实世界</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://github.com/bit-cook/HumanAPI" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">文档</a>
              <a href="#" className="hover:text-white transition-colors">许可</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            © 2026 HumanAPI. MIT License.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}