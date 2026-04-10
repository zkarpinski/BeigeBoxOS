import type { AppConfig } from '@retro-web/core/types/app-config';

export const desktopDestroyerAppConfig: AppConfig = {
  id: 'desktop-destroyer',
  name: 'Desktop Destroyer',
  icon: '/apps/desktop-destroyer/icon.png',
  category: 'Games',
  startMenu: {
    path: ['Programs'],
    label: 'Desktop Destroyer',
  },
  desktop: true,
};
