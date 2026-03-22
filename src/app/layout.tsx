import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, Great_Vibes } from 'next/font/google'
import Script from 'next/script'
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

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${dmSans.variable} ${greatVibes.variable}`}>
      <body className="font-body bg-cream text-charcoal antialiased">
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        )}

        {metaPixelId && (
          <>
            <Script id="meta-pixel-init" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

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
