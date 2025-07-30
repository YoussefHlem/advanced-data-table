import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Advanced Data Table',
  description: 'Advanced data table with advanced filtering, sorting, and export capabilities',
}

interface RootLayoutProps {
  readonly children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        fontFamily: GeistSans.style.fontFamily,
      }}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
