import { notepadAppConfig } from '@retro-web/core/apps/notepad';
import { aimAppConfig } from './components/apps/aim';
import { minesweeperAppConfig } from './components/apps/minesweeper';
import { calculatorAppConfig } from './components/apps/calculator';
import { pdfReaderAppConfig } from '@retro-web/app-pdf-reader';
import { paintAppConfig } from './components/apps/paint';
import { winampAppConfig } from './components/apps/winamp';
import { limewireAppConfig } from './components/apps/limewire';
import { itunes8AppConfig } from './components/apps/itunes8';
import { controlpanelAppConfig } from './components/apps/controlpanel';
import { mycomputerAppConfig } from './components/apps/mycomputer';
import { taskmanagerAppConfig } from './components/apps/taskmanager';
import { cmdAppConfig } from './components/apps/msdos';
import { ie6AppConfig } from './components/apps/ie6';
import { desktopDestroyerAppConfig } from '@retro-web/app-desktop-destroyer';
import type { AppConfig } from '@retro-web/core/types/app-config';

export const appRegistry: AppConfig[] = [
  mycomputerAppConfig,
  notepadAppConfig,
  calculatorAppConfig,
  pdfReaderAppConfig,
  paintAppConfig,
  minesweeperAppConfig,
  taskmanagerAppConfig,
  controlpanelAppConfig,
  cmdAppConfig,
  aimAppConfig,
  limewireAppConfig,
  itunes8AppConfig,
  winampAppConfig,
  ie6AppConfig,
  desktopDestroyerAppConfig,
];
