import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import '../../win98/app/style.css';
import '../../win98/app/components/shell/shell.css';
import '../../win98/app/components/shell/taskbar.css';
import '../../win98/app/components/shell/desktop.css';
import '../../win98/app/components/shell/dialog.css';
import '../../win98/app/components/shell/run.css';
import '../../win98/app/components/shell/shutdown.css';
import '../../win98/app/components/shell/bsod.css';
import '../../win98/app/components/win98/toolbar/toolbar.css';
import '../../win98/app/components/apps/word/word.css';
import '../../win98/app/components/apps/thps2/thps2.css';
import '../../win98/app/components/apps/vb6/vb6.css';
import '../../win98/app/components/apps/napster/napster.css';
import '../../win98/app/components/apps/aim/aim.css';
import '../../win98/app/components/apps/navigator/navigator.css';
import '../../win98/app/components/apps/winamp/winamp.css';
import '@retro-web/app-minesweeper/themes/win98.css';
import '@retro-web/app-minesweeper/themes/karpos.css';
import '../../win98/app/components/apps/paint/paint.css';
import '../../win98/app/components/apps/the_incredible_machine/tim.css';
import '../../win98/app/components/apps/calculator/calculator.css';
import '../../win98/app/components/apps/ie5/ie5.css';
import '../../win98/app/components/apps/defrag/defrag.css';
import '../../win98/app/components/apps/mycomputer/mycomputer.css';
import '../../win98/app/components/apps/controlpanel/controlpanel.css';
import '../../win98/app/components/apps/msdos/msdos.css';
import '../../win98/app/components/apps/photoshop/photoshop.css';
import '../../win98/app/components/apps/reporter/reporter.css';
import '../../win98/app/components/apps/zonealarm/zonealarm.css';
import '../../win98/app/components/apps/taskmanager/taskmanager.css';
import '../../win98/app/components/apps/avg/avg.css';
import '../../win98/app/components/apps/aol/aol.css';
import './karpos-theme.css';
import './karpos-app-brutal.css';
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
