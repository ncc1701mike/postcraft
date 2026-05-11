import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Postcraft',
  description: 'From rough brief to platform-ready posts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
