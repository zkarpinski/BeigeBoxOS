import { notepadAppConfig } from '@retro-web/core/apps/notepad';
import { minesweeperAppConfig } from '@retro-web/app-minesweeper';
import { calculatorAppConfig } from '@retro-web/app-calculator';
import { pdfReaderAppConfig } from '@retro-web/app-pdf-reader';
import { pinballAppConfig } from '@retro-web/app-pinball';
import { spaceTraderAppConfig } from '@retro-web/app-space-trader';
import { projectsAppConfig } from './components/apps/projects/ProjectsWindow';
import { padAppConfig } from './components/apps/pad/PadWindow';
import type { AppConfig } from '@retro-web/core/types/app-config';

export const appRegistry: AppConfig[] = [
  pdfReaderAppConfig,
  notepadAppConfig,
  minesweeperAppConfig,
  spaceTraderAppConfig,
  calculatorAppConfig,
  pinballAppConfig,
  projectsAppConfig,
  padAppConfig,
];
