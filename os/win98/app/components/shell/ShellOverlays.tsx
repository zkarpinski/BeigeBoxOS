'use client';

import { useWindowManager } from '@retro-web/core/context';
import { RunDialog } from './overlays/RunDialog';
import { ShutdownOverlay } from './overlays/ShutdownOverlay';
import { DesktopContextMenu } from './overlays/DesktopContextMenu';
import { DialogModal } from './overlays/DialogModal';
import { BsodOverlay } from './overlays/BsodOverlay';

export type ShellOverlaysProps = {
  /** When false, the desktop right-click menu is not mounted (e.g. KarpOS). */
  showDesktopContextMenu?: boolean;
};

export function ShellOverlays({ showDesktopContextMenu = true }: ShellOverlaysProps = {}) {
  const { runDialogOpen, setRunDialogOpen, shutdownOpen, setShutdownOpen, bsodState } =
    useWindowManager();

  return (
    <>
      <RunDialog open={runDialogOpen} onClose={() => setRunDialogOpen(false)} />
      <ShutdownOverlay open={shutdownOpen} onClose={() => setShutdownOpen(false)} />
      {showDesktopContextMenu ? <DesktopContextMenu /> : null}
      <DialogModal />
      {bsodState && <BsodOverlay state={bsodState} />}
    </>
  );
}
