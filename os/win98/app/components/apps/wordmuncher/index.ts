import { AppConfig } from '@retro-web/core/types/app-config';
import { WordMuncherWindow } from './WordMuncherWindow';

export const wordMuncherAppConfig: AppConfig = {
  id: 'wordmuncher',
  label: 'Word Muncher',
  icon: 'apps/wordmuncher/icon.png',
  startMenu: { path: ['Programs', 'Games'] },
  desktop: true,
};

export { WordMuncherWindow };
