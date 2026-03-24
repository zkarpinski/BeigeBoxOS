import { wordAppConfig } from '@win98/components/apps/word';
import { notepadAppConfig } from '@retro-web/core/apps/notepad';
import { aimAppConfig } from '@win98/components/apps/aim';
import { minesweeperAppConfig } from '@retro-web/app-minesweeper';
import { calculatorAppConfig } from '@win98/components/apps/calculator';
import { paintAppConfig } from '@win98/components/apps/paint';
import { msdosAppConfig } from '@win98/components/apps/msdos';
import { winampAppConfig } from '@win98/components/apps/winamp';
import { ie5AppConfig } from '@win98/components/apps/ie5';
import { napsterAppConfig } from '@win98/components/apps/napster';
import { navigatorAppConfig } from '@win98/components/apps/navigator';
import { defragAppConfig } from '@win98/components/apps/defrag';
import { vb6AppConfig } from '@win98/components/apps/vb6';
import { controlpanelAppConfig } from '@win98/components/apps/controlpanel';
import { mycomputerAppConfig } from '@win98/components/apps/mycomputer';
import { thps2AppConfig } from '@win98/components/apps/thps2/Thps2Window';
import { timAppConfig } from '@win98/components/apps/the_incredible_machine/TimWindow';
import { photoshopAppConfig } from '@win98/components/apps/photoshop';
import { aolAppConfig } from '@win98/components/apps/aol';
import { reporterAppConfig } from '@win98/components/apps/reporter';
import { zonealarmAppConfig } from '@win98/components/apps/zonealarm';
import { taskmanagerAppConfig } from '@win98/components/apps/taskmanager';
import { avgAppConfig } from '@win98/components/apps/avg';
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
];
