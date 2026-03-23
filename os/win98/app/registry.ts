import { wordAppConfig } from './components/apps/word';
import { notepadAppConfig } from '@retro-web/core/apps/notepad';
import { aimAppConfig } from './components/apps/aim';
import { minesweeperAppConfig } from './components/apps/minesweeper';
import { calculatorAppConfig } from './components/apps/calculator';
import { paintAppConfig } from './components/apps/paint';
import { msdosAppConfig } from './components/apps/msdos';
import { winampAppConfig } from './components/apps/winamp';
import { ie5AppConfig } from './components/apps/ie5';
import { napsterAppConfig } from './components/apps/napster';
import { navigatorAppConfig } from './components/apps/navigator';
import { defragAppConfig } from './components/apps/defrag';
import { vb6AppConfig } from './components/apps/vb6';
import { controlpanelAppConfig } from './components/apps/controlpanel';
import { mycomputerAppConfig } from './components/apps/mycomputer';
import { thps2AppConfig } from './components/apps/thps2/Thps2Window';
import { timAppConfig } from './components/apps/the_incredible_machine/TimWindow';
import { photoshopAppConfig } from './components/apps/photoshop';
import { aolAppConfig } from './components/apps/aol';
import { reporterAppConfig } from './components/apps/reporter';
import { zonealarmAppConfig } from './components/apps/zonealarm';
import { taskmanagerAppConfig } from './components/apps/taskmanager';
import { avgAppConfig } from './components/apps/avg';
import { wordMuncherAppConfig } from './components/apps/wordmuncher';
import type { AppConfig } from '@retro-web/core/types/app-config';

export const appRegistry: AppConfig[] = [
  mycomputerAppConfig,
  wordAppConfig,
  thps2AppConfig,
  notepadAppConfig,
  minesweeperAppConfig,
  paintAppConfig,
  timAppConfig,
  calculatorAppConfig,
  ie5AppConfig,
  msdosAppConfig,
  winampAppConfig,
  aimAppConfig,
  napsterAppConfig,
  navigatorAppConfig,
  defragAppConfig,
  vb6AppConfig,
  controlpanelAppConfig,
  photoshopAppConfig,
  aolAppConfig,
  reporterAppConfig,
  zonealarmAppConfig,
  taskmanagerAppConfig,
  avgAppConfig,
  wordMuncherAppConfig,
];
