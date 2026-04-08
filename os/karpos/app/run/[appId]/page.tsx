import type { Metadata } from 'next';
import { RedirectToDesktop } from './redirect-to-desktop';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const APP_IDS = [
  'pdf-reader',
  'notepad',
  'minesweeper',
  'calculator',
  'pinball',
  'projects',
  'pad',
] as const;

export const dynamicParams = false;

export async function generateStaticParams() {
  return APP_IDS.map((appId) => ({ appId }));
}

export default async function RunAppPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  const valid = APP_IDS.includes(appId as (typeof APP_IDS)[number]);
  return <RedirectToDesktop appId={appId} valid={valid} />;
}
