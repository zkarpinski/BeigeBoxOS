'use client';

import { useWindowManager } from '@retro-web/core/context';
import { DialogModal } from '@win98/components/shell/overlays/DialogModal';
import { KarposShutdownOverlay } from './KarposShutdownOverlay';
import { KarposStartupOverlay } from './KarposStartupOverlay';

export function KarposShellOverlays() {
  const { shutdownOpen } = useWindowManager();

  return (
    <>
      <KarposStartupOverlay />
      <KarposShutdownOverlay open={shutdownOpen} />
      <DialogModal />
    </>
  );
}
