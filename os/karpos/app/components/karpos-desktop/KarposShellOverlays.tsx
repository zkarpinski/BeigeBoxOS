'use client';

import { useWindowManager } from '@retro-web/core/context';
import { DialogModal } from '@win98/components/shell/overlays/DialogModal';
import { KarposShutdownOverlay } from './KarposShutdownOverlay';

export function KarposShellOverlays() {
  const { shutdownOpen } = useWindowManager();

  return (
    <>
      <KarposShutdownOverlay open={shutdownOpen} />
      <DialogModal />
    </>
  );
}
