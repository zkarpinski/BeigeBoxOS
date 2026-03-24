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
import './components/winxp/toolbar/toolbar.css';
import './components/apps/limewire/limewire.css';
import './components/apps/aim/aim.css';
import './components/apps/winamp/winamp.css';
// Notepad styles come from @retro-web/core via NotepadContent
import './components/apps/minesweeper/minesweeper.css';
// Paint + Calculator styles come from @retro-web/core via PaintContent / CalculatorContent
import './components/apps/mycomputer/mycomputer.css';
import './components/apps/controlpanel/controlpanel.css';
import './components/apps/msdos/msdos.css';
import './components/apps/taskmanager/taskmanager.css';

export const metadata: Metadata = {
  title: 'Windows XP | Zachary Karpinski',
  description:
    'A nostalgic Windows XP experience in the browser. Winamp, LimeWire, AIM, Minesweeper, Paint, Notepad, MS-DOS, Task Manager, Control Panel, and more. By Zachary Karpinski.',
  keywords:
    'Windows XP, retro, browser, Zachary Karpinski, portfolio, Winamp, LimeWire, AIM, Minesweeper, Paint, Notepad, Calculator, MS-DOS, Task Manager, Control Panel, My Computer, Windows Media Player, Internet Explorer',
  robots: 'index, follow',
  authors: [{ name: 'Zachary Karpinski' }],
  openGraph: {
    type: 'website',
    title: 'Windows XP in the Browser | Zachary Karpinski',
    description:
      'A nostalgic Windows XP experience in the browser. Winamp, LimeWire, AIM, Minesweeper, Paint, Notepad, MS-DOS, Task Manager, Control Panel, and more.',
    url: 'https://winxp.zkarpinski.com/',
    siteName: 'Windows XP in the Browser',
    images: [{ url: 'https://zkarpinski.com/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Windows XP in the Browser | Zachary Karpinski',
    description:
      'A nostalgic Windows XP experience in the browser. Winamp, LimeWire, AIM, Minesweeper, Paint, Notepad, MS-DOS, Task Manager, Control Panel, and more.',
    images: ['https://winxp.zkarpinski.com/og-image.png'],
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
        <link rel="canonical" href="https://winxp.zkarpinski.com" />
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
              name: 'Windows XP in the Browser',
              description:
                'A nostalgic Windows XP experience in the browser. Winamp, LimeWire, AIM, Minesweeper, Paint, Notepad, MS-DOS, Task Manager, Control Panel, My Computer, and more.',
              url: 'https://winxp.zkarpinski.com',
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
