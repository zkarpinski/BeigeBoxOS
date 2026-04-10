import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Palm OS 3',
  description: 'Palm OS 3 simulation in the browser',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
