import type { AppConfig } from '@retro-web/core/types/app-config';

export const desktopDestroyerAppConfig: AppConfig = {
  id: 'desktop-destroyer',
  label: 'Desktop Destroyer',
  icon: '/apps/desktop-destroyer/icon.png',
  startMenu: {
    path: ['Programs'],
    label: 'Desktop Destroyer',
  },
  desktop: true,
};
