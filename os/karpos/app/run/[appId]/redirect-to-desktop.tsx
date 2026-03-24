'use client';

import { useEffect } from 'react';

export function RedirectToDesktop({ appId, valid }: { appId: string; valid: boolean }) {
  useEffect(() => {
    const target = valid ? `/?app=${encodeURIComponent(appId)}` : '/';
    window.location.replace(target);
  }, [appId, valid]);
  return null;
}
