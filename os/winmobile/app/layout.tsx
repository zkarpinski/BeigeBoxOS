import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Windows Mobile 2003',
  description: 'Windows Mobile 2003 simulation on a Dell Axim X3i',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
