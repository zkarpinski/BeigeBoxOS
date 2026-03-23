'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager, useOsShell } from '@retro-web/core/context';
import type { AppConfig } from '@/app/types/app-config';

export const photoshopAppConfig: AppConfig = {
  id: 'photoshop',
  label: 'Adobe Photoshop 5',
  icon: 'apps/photoshop/photoshop-icon.png',
  desktop: true,
  startMenu: { path: ['Programs'] },
  taskbarLabel: 'Adobe Photoshop',
};

const POPUP_MESSAGES = [
  {
    title: 'VIRUS ALERT!!!',
    body: 'Your computer has 47 viruses!<br>Click OK to remove them NOW!',
  },
  {
    title: 'Congratulations!!!',
    body: "You've been selected to win a FREE iPod!<br>Click OK to claim your prize!",
  },
  {
    title: 'SYSTEM WARNING',
    body: 'Your PC is running dangerously slow!<br>Download SpeedBooster Pro — FREE!',
  },
  {
    title: 'Security Alert',
    body: 'SPYWARE detected on your computer!<br>Click OK to remove immediately!',
  },
  {
    title: 'FREE OFFER!!!',
    body: 'Download 1,000+ FREE emoticons for MSN Messenger!<br>Limited time only!',
  },
  {
    title: 'Limited Time Offer!',
    body: 'GET PHOTOSHOP FOR FREE!!<br>This offer expires in <b>00:02:34</b><br>Click OK to download!',
  },
  {
    title: 'URGENT: Your PC Is At Risk',
    body: 'Your Internet Explorer is OUTDATED!<br>Update NOW to avoid security risks!',
  },
  {
    title: 'Fatal Error',
    body: 'Exception OE at 0028:C006023E in VxD<br>Click OK to ignore and continue.',
  },
  {
    title: 'WIN FREE MUSIC!!!',
    body: 'Download FREE music with Kazaa Lite!<br>Over 1,000,000 songs available NOW!',
  },
  {
    title: 'Memory Upgrade!!!',
    body: 'Your computer has been chosen<br>for a FREE memory upgrade!<br>Click OK to begin!',
  },
  {
    title: 'YOU ARE A WINNER!',
    body: 'You are the <b>1,000,000th</b> visitor!<br>Click OK to claim your prize NOW!',
  },
  {
    title: 'FREE Ringtones!!!',
    body: 'Get 100 FREE ringtones for your<br>Nokia 3310! Click OK to download!',
  },
  {
    title: 'Install Complete',
    body: 'Photoshop 5.0 installed successfully.<br>Activating license...',
  },
  {
    title: 'DOWNLOAD NOW!!!',
    body: 'BonziBUDDY — your friendly<br>desktop companion — is FREE!<br>Click OK to install!',
  },
];

const SPLASH_STATUSES = [
  'Initializing...',
  'Loading plug-ins...',
  'Loading default brushes...',
  'Reading preferences...',
  'Loading color tables...',
  'Loading filters...',
  'Preparing workspace...',
  'Registering license...',
];

const BSOD_MSG =
  'A fatal exception OE has occurred at 0028:C006023E in VxD PHOTOSHP(01) +\n' +
  '00040E23. The current application will be terminated.\n\n' +
  '* Press any key to terminate the current application.\n' +
  '* Press CTRL+ALT+DELETE to restart your computer. You will\n' +
  '  lose any unsaved information in all applications.\n\n' +
  'Press any key to continue _';

let _popupIdx = 0;

function spawnPopup(mode: 'random' | 'cursor', mx: number, my: number) {
  const popup = document.createElement('div');
  popup.className = 'ps5-virus-popup';
  popup.setAttribute('data-ps5-popup', '');

  const msg = POPUP_MESSAGES[_popupIdx % POPUP_MESSAGES.length];
  _popupIdx++;

  const W = 290,
    H = 148;
  let left: number, top: number;

  if (mode === 'cursor') {
    left = Math.max(0, Math.min(mx, window.innerWidth - W));
    top = Math.max(0, Math.min(my + 6, window.innerHeight - H));
  } else {
    left = Math.floor(Math.random() * Math.max(1, window.innerWidth - W));
    top = Math.floor(Math.random() * Math.max(1, window.innerHeight - H));
  }

  popup.style.cssText = `left:${left}px;top:${top}px;z-index:${9000 + _popupIdx}`;
  popup.innerHTML = `
    <div class="ps5-popup-title">
      <span>⚠ ${msg.title}</span>
      <button class="ps5-popup-close" aria-label="Close">✕</button>
    </div>
    <div class="ps5-popup-body">
      <span class="ps5-popup-body-icon">⚠️</span>
      <p>${msg.body}</p>
    </div>
    <div class="ps5-popup-footer">
      <button class="ps5-popup-btn">OK</button>
      <button class="ps5-popup-btn">Cancel</button>
    </div>
  `;

  popup.querySelectorAll<HTMLButtonElement>('.ps5-popup-close, .ps5-popup-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.remove();
    });
  });

  document.body.appendChild(popup);
}

function clearAllPopups() {
  document.querySelectorAll('[data-ps5-popup]').forEach((el) => el.remove());
}

export function PhotoshopWindow() {
  const { apps, openBsod } = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();
  const isVisible = apps['photoshop']?.visible ?? false;

  const [phase, setPhase] = useState<'idle' | 'splash' | 'virus'>('idle');
  const [statusIdx, setStatusIdx] = useState(0);

  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeRef = useRef(false);

  // Track mouse position globally
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  // Visibility → phase transitions
  useEffect(() => {
    if (isVisible) {
      activeRef.current = true;
      _popupIdx = 0;
      setStatusIdx(0);
      setPhase('splash');
    } else {
      activeRef.current = false;
      clearAllPopups();
      setPhase('idle');
      setStatusIdx(0);
    }
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Splash: cycle status text, then kick off virus phase
  useEffect(() => {
    if (phase !== 'splash') return;
    const ivl = setInterval(() => setStatusIdx((i) => i + 1), 380);
    const t = setTimeout(() => setPhase('virus'), 2600);
    return () => {
      clearInterval(ivl);
      clearTimeout(t);
    };
  }, [phase]);

  // Virus: spam popups every 300ms for 8s, then BSOD
  useEffect(() => {
    if (phase !== 'virus') return;

    const INTERVAL_MS = 300;
    const TOTAL = Math.floor(8000 / INTERVAL_MS); // 26 popups
    let count = 0;
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      if (!activeRef.current) return;
      if (count >= TOTAL) {
        clearAllPopups();
        openBsod({ message: BSOD_MSG, reload: true, clearStorage: false });
        return;
      }
      const mode = count % 2 === 0 ? 'random' : 'cursor';
      spawnPopup(mode, mouseRef.current.x, mouseRef.current.y);
      count++;
      timer = setTimeout(tick, INTERVAL_MS);
    }

    tick();

    return () => {
      clearTimeout(timer);
      clearAllPopups();
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppWindow
      id="photoshop-window"
      appId="photoshop"
      className="photoshop-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Adobe Photoshop"
          icon={
            <img
              src="shell/icons/executable-0.png"
              alt=""
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      {phase !== 'virus' ? (
        <div className="ps5-splash">
          <div className="ps5-splash-logo">
            <span className="ps5-feather">🪶</span>
            <div className="ps5-logo-text">
              <span className="ps5-adobe">adobe</span>
              <span className="ps5-product">Photoshop</span>
            </div>
          </div>
          <div className="ps5-version">5.0</div>
          <div className="ps5-progress-wrap">
            {phase === 'splash' && (
              <div className="ps5-progress-track">
                <div className="ps5-progress-fill" />
              </div>
            )}
          </div>
          <div className="ps5-status">
            {phase === 'splash' ? SPLASH_STATUSES[statusIdx % SPLASH_STATUSES.length] : ''}
          </div>
          <div className="ps5-copyright">
            © 1989-1998 Adobe Systems Incorporated. All rights reserved.
          </div>
        </div>
      ) : (
        <div className="ps5-virus-screen">
          <span className="ps5-virus-skull">💀</span>
          <p className="ps5-virus-text">INSTALLING PHOTOSHOP...</p>
        </div>
      )}
    </AppWindow>
  );
}
