import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HumanAPI - Humans as a Service',
  description: '连接 AI Agent 与人类专家的开源 REST 与 MCP 任务平台。',
  metadataBase: new URL('https://github.com/bit-cook/HumanAPI'),
  openGraph: {
    title: 'HumanAPI - Humans as a Service',
    description: '让 AI Agent 调用真实世界的人类能力。',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
