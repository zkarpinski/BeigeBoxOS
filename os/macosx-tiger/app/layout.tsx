import type { Metadata } from 'next';
import './globals.css';
import './styles/macosx-theme.css';
import './styles/macosx-shell.css';
import './styles/macosx-apps.css';
import './components/apps/finder/finder.css';
import '@retro-web/app-minesweeper/themes/win98.css';
import '@retro-web/app-calculator/themes/win98.css';

export const metadata: Metadata = {
  title: 'Mac OS X 10.4 Tiger | Zachary Karpinski',
  description:
    'A faithful recreation of Mac OS X 10.4 Tiger with the classic Aqua interface in the browser. Notepad, Minesweeper, Calculator, and PDF Reader. By Zachary Karpinski.',
  keywords: 'Mac OS X, Tiger, Aqua, retro, browser, desktop, Zachary Karpinski, portfolio',
  robots: 'index, follow',
  authors: [{ name: 'Zachary Karpinski' }],
  openGraph: {
    type: 'website',
    title: 'Mac OS X 10.4 Tiger in the Browser | Zachary Karpinski',
    description: 'A faithful recreation of Mac OS X 10.4 Tiger with the classic Aqua interface.',
    url: 'https://macosx.zkarpinski.com/',
    siteName: 'Mac OS X in the Browser',
    locale: 'en_US',
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
        <base href="/" />
      </head>
      <body className="macosx-desktop">{children}</body>
    </html>
  );
}
