import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Postcraft — AI Content Pipeline',
  description: 'From rough brief to platform-ready posts, crafted and evaluated by an agent pipeline.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
