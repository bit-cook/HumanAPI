import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HumanAPI - Humans as a Service',
  description: 'AI Agent 人类任务租赁平台 - 让人类成为可调用的 API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}