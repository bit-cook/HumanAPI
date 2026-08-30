import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HumanAPI | 连接 AI 与真实世界的开放接口',
  description:
    'HumanAPI 是一个开源参考实现，提供 REST 路由与 MCP 工具入口，用于探索 AI Agent 如何检索并预约人类专家。',
  applicationName: 'HumanAPI',
  keywords: ['HumanAPI', 'AI Agent', 'MCP', 'REST API', '开源'],
  authors: [{ name: 'HumanAPI contributors' }],
  creator: 'HumanAPI contributors',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    title: 'HumanAPI | 连接 AI 与真实世界的开放接口',
    description:
      '面向开发与评估的开源参考实现：检索专家、记录任务与预约，并通过明确接口查询状态。',
    siteName: 'HumanAPI',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#08070d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
