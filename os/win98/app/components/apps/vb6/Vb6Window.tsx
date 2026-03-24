'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AppWindow,
  TitleBar,
  ToolbarRow,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '../../win98';
import type { AppConfig } from '@/app/types/app-config';

export const vb6AppConfig: AppConfig = {
  id: 'vb6',
  label: 'Microsoft Visual Basic 6',
  icon: 'shell/icons/executable-0.png',
  desktop: false,
  startMenu: { path: ['Programs'] },
  taskbarLabel: 'Microsoft Visual Basic',
};

export function Vb6Window() {
  const [running, setRunning] = useState(false);
  const [runLabel, setRunLabel] = useState('Label1');
  const formPanelRef = useRef<HTMLDivElement>(null);

  const start = () => {
    setRunning(true);
    setRunLabel('Label1');
  };
  const stop = () => setRunning(false);

  // MDI window dragging within the form panel
  useEffect(() => {
    const panel = formPanelRef.current;
    if (!panel) return;
    const mdiWindows = panel.querySelectorAll<HTMLElement>('.vb6-mdi-window');
    let topZIndex = 10;
    const cleanups: (() => void)[] = [];

    mdiWindows.forEach((winEl) => {
      const onFocus = () => {
        winEl.style.zIndex = String(++topZIndex);
      };
      winEl.addEventListener('mousedown', onFocus);

      const titleBar = winEl.querySelector<HTMLElement>('.vb6-mdi-title');
      if (!titleBar) {
        cleanups.push(() => winEl.removeEventListener('mousedown', onFocus));
        return;
      }

      let dragging = false,
        startX = 0,
        startY = 0,
        initLeft = 0,
        initTop = 0;
      const onDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.title-btn')) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initLeft = winEl.offsetLeft;
        initTop = winEl.offsetTop;
        e.preventDefault();
      };
      const onMove = (e: MouseEvent) => {
        if (!dragging) return;
        const parent = winEl.parentElement;
        if (!parent) return;
        winEl.style.left =
          Math.max(
            0,
            Math.min(initLeft + (e.clientX - startX), parent.clientWidth - winEl.offsetWidth),
          ) + 'px';
        winEl.style.top =
          Math.max(
            0,
            Math.min(initTop + (e.clientY - startY), parent.clientHeight - winEl.offsetHeight),
          ) + 'px';
      };
      const onUp = () => {
        dragging = false;
      };

      titleBar.addEventListener('mousedown', onDown as EventListener);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      cleanups.push(() => {
        winEl.removeEventListener('mousedown', onFocus);
        titleBar.removeEventListener('mousedown', onDown as EventListener);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <AppWindow
      id="vb6-window"
      appId="vb6"
      className="vb6-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Project1 - Microsoft Visual Basic [design]"
          icon={
            <div className="title-logo">
              <span className="title-app-icon vb-icon">VB</span>
            </div>
          }
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="vb6-menu-bar">
        <button type="button" className="vb6-menu-item">
          <u>F</u>ile
        </button>
        <button type="button" className="vb6-menu-item">
          <u>E</u>dit
        </button>
        <button type="button" className="vb6-menu-item">
          <u>V</u>iew
        </button>
        <button type="button" className="vb6-menu-item">
          <u>P</u>roject
        </button>
        <button type="button" className="vb6-menu-item">
          F<u>o</u>rmat
        </button>
        <button type="button" className="vb6-menu-item">
          <u>D</u>ebug
        </button>
        <button type="button" className="vb6-menu-item">
          <u>R</u>un
        </button>
        <button type="button" className="vb6-menu-item">
          <u>Q</u>uery
        </button>
        <button type="button" className="vb6-menu-item">
          Dia<u>g</u>ram
        </button>
        <button type="button" className="vb6-menu-item">
          <u>T</u>ools
        </button>
        <button type="button" className="vb6-menu-item">
          <u>A</u>dd-Ins
        </button>
        <button type="button" className="vb6-menu-item">
          <u>W</u>indow
        </button>
        <button type="button" className="vb6-menu-item">
          <u>H</u>elp
        </button>
      </div>
      <ToolbarRow showGripper={false}>
        <Toolbar className="vb6-toolbar">
          <ToolbarButton title="Add File">
            <span className="icon">+</span>
          </ToolbarButton>
          <ToolbarButton title="Open">
            <span className="icon">📂</span>
          </ToolbarButton>
          <ToolbarButton title="Save">
            <span className="icon">💾</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton title="Start" onClick={start}>
            <span className="icon">▶</span>
          </ToolbarButton>
          <ToolbarButton title="Break">
            <span className="icon">| |</span>
          </ToolbarButton>
          <ToolbarButton title="End" onClick={stop}>
            <span className="icon">■</span>
          </ToolbarButton>
        </Toolbar>
      </ToolbarRow>
      <div className="vb6-main">
        {/* Project panel */}
        <div className="vb6-panel vb6-project-panel">
          <div className="vb6-panel-title">Project - Project1</div>
          <div className="vb6-project-tree">
            <div className="vb6-tree-node">
              <div className="vb6-tree-item vb6-tree-folder open">
                <span className="vb6-tree-toggle">−</span>
                <span className="vb6-tree-icon">📁</span>
                <span>Project1 (Project1.vbp)</span>
              </div>
              <div className="vb6-tree-children">
                <div className="vb6-tree-node">
                  <div className="vb6-tree-item vb6-tree-folder open">
                    <span className="vb6-tree-toggle">−</span>
                    <span className="vb6-tree-icon">📄</span>
                    <span>Forms</span>
                  </div>
                  <div className="vb6-tree-children">
                    <div className="vb6-tree-item">
                      <span className="vb6-tree-pad" />
                      <span className="vb6-tree-icon">📋</span>
                      <span>Form1 (Form1.frm)</span>
                    </div>
                  </div>
                </div>
                <div className="vb6-tree-item vb6-tree-folder">
                  <span className="vb6-tree-toggle">+</span>
                  <span className="vb6-tree-icon">📄</span>
                  <span>Modules</span>
                </div>
                <div className="vb6-tree-item vb6-tree-folder">
                  <span className="vb6-tree-toggle">+</span>
                  <span className="vb6-tree-icon">📄</span>
                  <span>Class Modules</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form/code panel */}
        <div className="vb6-panel vb6-form-panel" ref={formPanelRef}>
          <div className="vb6-panel-title">Project1 - Form1 (Form)</div>
          <div className="vb6-form-design">
            {/* Code window */}
            <div className="vb6-mdi-window vb6-code-window">
              <div className="vb6-mdi-title">
                <span className="vb6-mdi-title-text">Project1 - Form1 (Code)</span>
                <div className="vb6-mdi-controls">
                  <button type="button" className="win-btn title-btn">
                    _
                  </button>
                  <button type="button" className="win-btn title-btn">
                    ❐
                  </button>
                  <button type="button" className="win-btn title-btn">
                    X
                  </button>
                </div>
              </div>
              <div className="vb6-code-top">
                <select className="vb6-code-select">
                  <option>Command1</option>
                  <option>Form</option>
                </select>
                <select className="vb6-code-select">
                  <option>Click</option>
                  <option>Load</option>
                </select>
              </div>
              <textarea
                className="vb6-code-area"
                readOnly
                spellCheck={false}
                defaultValue={`Private Sub Command1_Click()\n    Label1.Caption = "hello world"\nEnd Sub`}
              />
            </div>

            {/* Form window */}
            <div className="vb6-mdi-window vb6-form-window">
              <div className="vb6-mdi-title">
                <span className="vb6-mdi-title-text">Project1 - Form1 (Form)</span>
                <div className="vb6-mdi-controls">
                  <button type="button" className="win-btn title-btn">
                    _
                  </button>
                  <button type="button" className="win-btn title-btn">
                    ❐
                  </button>
                  <button type="button" className="win-btn title-btn">
                    X
                  </button>
                </div>
              </div>
              <div className="vb6-form-surface">
                <div className="vb6-form-grid">
                  <div className="vb6-designer-label">Label1</div>
                  <button className="win-btn vb6-designer-btn">
                    Command1
                    <div className="vb6-resize-handle nw" />
                    <div className="vb6-resize-handle n" />
                    <div className="vb6-resize-handle ne" />
                    <div className="vb6-resize-handle e" />
                    <div className="vb6-resize-handle se" />
                    <div className="vb6-resize-handle s" />
                    <div className="vb6-resize-handle sw" />
                    <div className="vb6-resize-handle w" />
                  </button>
                </div>
              </div>
            </div>

            {/* Run window */}
            <div className={`vb6-mdi-window vb6-run-window${running ? '' : ' hidden'}`}>
              <div className="vb6-mdi-title">
                <span className="vb6-mdi-title-text">Form1</span>
                <div className="vb6-mdi-controls">
                  <button type="button" className="win-btn title-btn">
                    _
                  </button>
                  <button type="button" className="win-btn title-btn">
                    ❐
                  </button>
                  <button type="button" className="win-btn title-btn" onClick={stop}>
                    X
                  </button>
                </div>
              </div>
              <div className="vb6-run-surface">
                <div className="vb6-designer-label">{runLabel}</div>
                <button
                  className="win-btn vb6-designer-btn"
                  onClick={() => setRunLabel('hello world')}
                >
                  Command1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div className="vb6-panel vb6-props-panel">
          <div className="vb6-panel-title">Properties - Form1</div>
          <div className="vb6-props-list">
            <div className="vb6-props-row">
              <span className="vb6-props-name">(Name)</span>
              <span className="vb6-props-value">Form1</span>
            </div>
            <div className="vb6-props-row">
              <span className="vb6-props-name">Caption</span>
              <span className="vb6-props-value">Form1</span>
            </div>
            <div className="vb6-props-row">
              <span className="vb6-props-name">BackColor</span>
              <span className="vb6-props-value">&amp;H8000000F&amp;</span>
            </div>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
