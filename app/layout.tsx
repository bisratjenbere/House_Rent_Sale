import type { Metadata } from 'next'
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { Toaster } from 'sonner'

const fraunces = Fraunces({ 
  subsets: ['latin'], 
  variable: '--font-display', 
  weight: ['500', '600'],
  display: 'swap',
})

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-body',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  variable: '--font-data', 
  weight: ['500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HouseHub - House Rent & Sale Platform',
  description: 'Find and list houses for rent and sale. Connect with property owners and agents.',
}

export default function RootLayout({
  children,
}: {
  children: React.NodeNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="font-body bg-background text-foreground antialiased">
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
