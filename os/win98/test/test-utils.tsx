/**
 * Wrap Win98 app tests with the same shell context as production {@link Desktop}:
 * `WindowManagerProvider` + `OsShellProvider` (AppWindow, TitleBar, MenuBar, writeFile).
 */
import React from 'react';
import { OsShellProvider, WindowManagerProvider } from '@retro-web/core/context';
import type { AppConfig } from '@/app/types/app-config';
import type { OsShellValue } from '@retro-web/core/types/os-shell';
import { AppWindow, TitleBar, MenuBar } from '@/app/components/win98';
import { writeFile } from '@/app/fileSystem';

let cachedShell: OsShellValue | null = null;

export function getWin98OsShellValue(): OsShellValue {
  if (!cachedShell) {
    cachedShell = { AppWindow, TitleBar, MenuBar, writeFile };
  }
  return cachedShell;
}

export function Win98TestProviders({
  registry,
  children,
  applyOpenByDefault,
  initialOpenAppId,
}: {
  registry: AppConfig[];
  children: React.ReactNode;
  applyOpenByDefault?: boolean;
  initialOpenAppId?: string | null;
}) {
  return (
    <WindowManagerProvider
      registry={registry}
      applyOpenByDefault={applyOpenByDefault}
      initialOpenAppId={initialOpenAppId ?? null}
    >
      <OsShellProvider value={getWin98OsShellValue()}>{children}</OsShellProvider>
    </WindowManagerProvider>
  );
}
