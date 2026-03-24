import type { Metadata } from 'next';
import Script from 'next/script';
import './styles/shell.css';
import './styles/apps.css';
import './styles/karpos-theme.css';
import './styles/karpos-app-brutal.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://karpos.zkarpinski.com'),
  title: 'KarpOS | Zachary Karpinski',
  description:
    'KarpOS — a neo-brutalist playground desktop in the browser. Apps, experiments, and portfolio by Zachary Karpinski.',
  keywords:
    'KarpOS, Zachary Karpinski, neo-brutalism, portfolio, retro, browser, desktop, playground',
  robots: 'index, follow',
  authors: [{ name: 'Zachary Karpinski' }],
  openGraph: {
    type: 'website',
    title: 'KarpOS | Zachary Karpinski',
    description: 'A neo-brutalist playground desktop in your browser.',
    url: 'https://karpos.zkarpinski.com/',
    siteName: 'KarpOS',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KarpOS — neo-brutalist desktop in the browser',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KarpOS | Zachary Karpinski',
    description: 'A neo-brutalist playground desktop in your browser.',
    images: ['/og-image.png'],
  },
  /** Raster sizes generated from `public/shell/karpos-logo-trimmed.png` (see `scripts/generate-karpos-icons.sh`) */
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <base href="/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..1000;1,9..40,400..1000&family=Space+Grotesk:wght@400..700&display=swap"
          rel="stylesheet"
        />
        <Script src="/boot-check.js" strategy="beforeInteractive" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'KarpOS',
              description:
                'A neo-brutalist playground desktop in the browser — apps and portfolio by Zachary Karpinski.',
              url: 'https://karpos.zkarpinski.com/',
              image: 'https://karpos.zkarpinski.com/og-image.png',
              author: { '@type': 'Person', name: 'Zachary Karpinski' },
              applicationCategory: 'MultimediaApplication',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
      </head>
      <body className="karpos-desktop">{children}</body>
    </html>
  );
}
