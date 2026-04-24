import type { Metadata } from 'next';
import { Silkscreen } from 'next/font/google';
import './globals.css';
import '@retro-web/app-space-trader/themes/palmos.css';

const silkscreen = Silkscreen({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-palm',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Palm OS 5',
  description: 'Palm OS 5 simulation in the browser',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={silkscreen.variable}>
      <body>{children}</body>
    </html>
  );
}
