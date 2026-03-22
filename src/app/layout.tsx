import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, Great_Vibes } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-great-vibes',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Luxo Reborn — Brinquedos, Pelúcia e Mimos que Encantam',
    template: '%s | Luxo Reborn',
  },
  description: 'Bebês Reborn artesanais, pelúcias delicadas e brinquedos incríveis para todas as idades. Presentes únicos feitos com amor e qualidade. Entrega para todo o Brasil.',
  keywords: ['bebê reborn', 'pelúcia', 'brinquedos', 'presentes', 'reborn artesanal'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Luxo Reborn',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${dmSans.variable} ${greatVibes.variable}`}>
      <body className="font-body bg-cream text-charcoal antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#2d1a24',
              color: '#fff',
              borderRadius: '40px',
              padding: '12px 20px',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#f472b6', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
