import { notepadAppConfig } from '@retro-web/core/apps/notepad';
import { minesweeperAppConfig } from '@retro-web/app-minesweeper';
import { calculatorAppConfig } from '@retro-web/app-calculator';
import { pdfReaderAppConfig } from '@retro-web/app-pdf-reader';
import { finderAppConfig } from './components/apps/finder/FinderWindow';
import type { AppConfig } from '@retro-web/core/types/app-config';

export const appRegistry: AppConfig[] = [
  finderAppConfig,
  pdfReaderAppConfig,
  notepadAppConfig,
  minesweeperAppConfig,
  calculatorAppConfig,
];
