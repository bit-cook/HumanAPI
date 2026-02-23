export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            HumanAPI
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Humans as a Service - 让人类成为可调用的 API
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">AI Agents</h3>
              <p className="text-gray-600">连接人类专家完成物理世界任务</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Human Experts</h3>
              <p className="text-gray-600">提供服务，赚取收入</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-2">MCP Integration</h3>
              <p className="text-gray-600">轻松集成到任何 AI Agent</p>
            </div>
          </div>
          <div className="mt-12">
            <a
              href="/api/mcp"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              查看 API 文档
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}