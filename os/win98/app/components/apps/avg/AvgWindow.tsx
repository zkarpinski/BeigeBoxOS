'use client';

import React from 'react';
import type { AppConfig } from '@/app/types/app-config';
import type { MenuItemConfig } from '@retro-web/core/types/os-shell';
import { useOsShell } from '@retro-web/core/context';

export const avgAppConfig: AppConfig = {
  id: 'avg',
  label: 'AVG Anti-Virus',
  icon: 'apps/avg/avg-icon.jpg',
  openByDefault: false,
  desktop: false,
  startMenu: { path: ['Programs', 'System Tools'] },
  taskbarLabel: 'AVG Anti-Virus System',
};

const menuItems: MenuItemConfig[] = [
  {
    label: 'Program',
    dropdown: [{ label: 'Exit', shortcutChar: 'E', onClick: () => console.log('Exit') }],
  },
  { label: 'Tests' },
  { label: 'Results' },
  { label: 'Service' },
  { label: 'Help' },
];

export function AvgWindow() {
  const { AppWindow, TitleBar, MenuBar } = useOsShell();
  return (
    <AppWindow
      id="avg-window"
      appId="avg"
      className="avg-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="AVG Anti-Virus System - FREE Edition"
          icon={
            <img src={avgAppConfig.icon} alt="" style={{ width: 16, height: 16, marginRight: 4 }} />
          }
          showMin
          showMax={false}
          showClose
        />
      }
    >
      <MenuBar items={menuItems} />

      <div className="avg-body">
        {/* Left Side: Logo and System Status */}
        <div className="avg-left-panel">
          <div className="avg-logo-section">
            <div className="avg-shield-icon"></div>
            <div className="avg-logo-text">
              <span className="avg-logo-main">AVG</span>
              <span className="avg-logo-sub">Free Edition</span>
              <span className="avg-logo-slogan">you are protected</span>
            </div>
          </div>

          <div className="avg-status-section">
            <div className="avg-status-title">AVG System Status</div>
            <div className="avg-status-box">
              <div className="avg-status-item">
                <div className="avg-status-icon check-icon"></div>
                <div className="avg-status-text">
                  <div className="avg-status-name">Control Center</div>
                  <div className="avg-status-desc">Active and Functional</div>
                </div>
              </div>

              <div className="avg-status-item">
                <div className="avg-status-icon check-icon"></div>
                <div className="avg-status-text">
                  <div className="avg-status-name">Resident Shield</div>
                  <div className="avg-status-desc">Active and Functional</div>
                </div>
              </div>

              <div className="avg-status-item">
                <div className="avg-status-icon check-icon"></div>
                <div className="avg-status-text">
                  <div className="avg-status-name">E-mail Scanner</div>
                  <div className="avg-status-desc">Active and Functional</div>
                </div>
              </div>

              <div className="avg-status-item">
                <div className="avg-status-icon check-icon"></div>
                <div className="avg-status-text">
                  <div className="avg-status-name">Virus Database</div>
                  <div className="avg-status-desc">Database is up-to-date.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tests and Bottom Buttons */}
        <div className="avg-right-panel">
          <div className="avg-tests-section">
            <div className="avg-test-block">
              <div className="avg-test-header">
                <div className="avg-test-title-col">
                  <h2 className="avg-test-title">Complete Test</h2>
                  <p className="avg-test-desc">
                    It checks all hard drives on your computer. If a virus is found, AVG will remove
                    it or will provide you with step-by-step instructions for its removal.
                  </p>
                  <button className="avg-test-btn">
                    Run <u>C</u>omplete Test
                  </button>
                </div>
                <div className="avg-test-icon complete-test-icon"></div>
              </div>
            </div>

            <div className="avg-test-block">
              <div className="avg-test-header">
                <div className="avg-test-title-col">
                  <h2 className="avg-test-title">Removable Media Test</h2>
                  <p className="avg-test-desc">
                    It is used to check floppy disks, CDs, optical disks, external hard drives, or
                    any media not already installed in your computer.
                  </p>
                  <button className="avg-test-btn">
                    Run Removable <u>M</u>edia Test
                  </button>
                </div>
                <div className="avg-test-icon media-test-icon"></div>
              </div>
            </div>
          </div>

          <div className="avg-bottom-buttons">
            <button className="avg-bottom-btn">
              <div className="avg-btn-icon info-icon"></div>
              <span>Info</span>
            </button>
            <button className="avg-bottom-btn">
              <div className="avg-btn-icon help-icon"></div>
              <span>Help</span>
            </button>
            <button className="avg-bottom-btn">
              <div className="avg-btn-icon results-icon"></div>
              <span>Test Results</span>
            </button>
            <button className="avg-bottom-btn">
              <div className="avg-btn-icon scheduler-icon"></div>
              <span>Scheduler</span>
            </button>
            <button className="avg-bottom-btn">
              <div className="avg-btn-icon exit-icon"></div>
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>

      <div className="avg-statusbar">
        <span className="avg-statusbar-text">For Help, press F1</span>
      </div>
    </AppWindow>
  );
}
