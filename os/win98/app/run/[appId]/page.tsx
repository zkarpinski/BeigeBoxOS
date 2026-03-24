import type { Metadata } from 'next';
import { RedirectToDesktop } from './RedirectToDesktop';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Static export: avoid importing `appRegistry` into this server file.
 * `appRegistry` is composed from client-only modules, which breaks prerendering.
 */
const APP_IDS = [
  'mycomputer',
  'word',
  'thps2',
  'notepad',
  'minesweeper',
  'paint',
  'the_incredible_machine',
  'calculator',
  'ie5',
  'msdos',
  'winamp',
  'aim',
  'napster',
  'navigator',
  'defrag',
  'vb6',
  'controlpanel',
  'photoshop',
  'aol',
  'reporter',
  'zonealarm',
  'taskmanager',
  'avg',
  'wordmuncher',
] as const;

export const dynamicParams = false;

export async function generateStaticParams() {
  return APP_IDS.map((appId) => ({ appId }));
}

export default async function AppPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  const valid = APP_IDS.includes(appId as (typeof APP_IDS)[number]);
  return <RedirectToDesktop appId={appId} valid={valid} />;
}
