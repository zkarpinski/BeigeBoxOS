import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import './style.css';
import './components/shell/shell.css';
import './components/shell/taskbar.css';
import './components/shell/desktop.css';
import './components/shell/dialog.css';
import './components/shell/run.css';
import './components/shell/boot.css';
import './components/shell/shutdown.css';
import './components/shell/bsod.css';
import './components/win98/toolbar/toolbar.css';
import './components/apps/word/word.css';
import './components/apps/thps2/thps2.css';
import './components/apps/vb6/vb6.css';
import './components/apps/napster/napster.css';
import './components/apps/aim/aim.css';
import './components/apps/navigator/navigator.css';
import './components/apps/winamp/winamp.css';
// Notepad styles come from @retro-web/core via NotepadContent
import './components/apps/minesweeper/minesweeper.css';
import './components/apps/paint/paint.css';
import './components/apps/the_incredible_machine/tim.css';
import './components/apps/calculator/calculator.css';
import './components/apps/ie5/ie5.css';
import './components/apps/defrag/defrag.css';
import './components/apps/mycomputer/mycomputer.css';
import './components/apps/controlpanel/controlpanel.css';
import './components/apps/msdos/msdos.css';
import './components/apps/photoshop/photoshop.css';
import './components/apps/reporter/reporter.css';
import './components/apps/zonealarm/zonealarm.css';
import './components/apps/taskmanager/taskmanager.css';
import './components/apps/avg/avg.css';
import './components/apps/aol/aol.css';

export const metadata: Metadata = {
  title: 'Windows 98 | Zachary Karpinski',
  description:
    'A nostalgic Windows 98 experience in the browser. Edit documents, Clippy, Winamp, Napster, AIM, Navigator, and more. By Zachary Karpinski.',
  keywords:
    "Windows 98, retro, browser, Clippy, Zachary Karpinski, portfolio, Winamp, Napster, AIM, Navigator, Tony Hawk's Pro Skater 2, Minesweeper, Paint, The Incredible Machine, Notepad, Calculator",
  robots: 'index, follow',
  authors: [{ name: 'Zachary Karpinski' }],
  openGraph: {
    type: 'website',
    title: 'Windows 98 in the Browser | Zachary Karpinski',
    description:
      'A nostalgic Windows 98 experience in the browser. Edit documents, Clippy, Winamp, Napster, AIM, Navigator, and more.',
    url: 'https://win98.zkarpinski.com/',
    siteName: 'Windows 98 in the Browser',
    images: [{ url: 'https://win98.zkarpinski.com/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Windows 98 in the Browser | Zachary Karpinski',
    description:
      'A nostalgic Windows 98 experience in the browser. Edit documents, Clippy, Winamp, Napster, AIM, Navigator, and more.',
    images: ['https://win98.zkarpinski.com/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        {/* Ensure relative asset URLs (e.g. "apps/…", "shell/…") resolve from the site root. */}
        <base href="/" />
        <link rel="canonical" href="https://win98.zkarpinski.com" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <Script src="/boot-check.js" strategy="beforeInteractive" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Windows 98 in the Browser',
              description:
                'A nostalgic Windows 98 experience in the browser. Edit documents, Clippy, Winamp, Napster, AIM, Navigator, Minesweeper, Paint, The Incredible Machine, Notepad, Calculator, and more.',
              url: 'https://win98.zkarpinski.com',
              author: { '@type': 'Person', name: 'Zachary Karpinski' },
              applicationCategory: 'MultimediaApplication',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
      </head>
      <body className="booting">{children}</body>
    </html>
  );
}
