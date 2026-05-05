import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ScreensaverPage } from './ScreensaverPage';

export const metadata: Metadata = {
  title: 'Underwater Screensaver | Windows 98',
  robots: { index: false, follow: false },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ name: 'underwater' }];
}

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (name !== 'underwater') notFound();
  return <ScreensaverPage />;
}
