import type { Metadata } from 'next'
import { Fraunces, Inter, IBM_Plex_Mono, Geist } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'sonner'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(fraunces.variable, inter.variable, plexMono.variable, "font-sans", geist.variable)}>
      <body className="font-body bg-background text-foreground antialiased">
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <ErrorBoundary>
              <main className="flex-1">{children}</main>
            </ErrorBoundary>
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  )
}
