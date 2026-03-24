'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useOsShell, useWindowManager } from '@retro-web/core/context';
import {
  ALL_PROJECTS,
  FEATURED_PROJECTS,
  LEGACY_AND_EXPERIMENTS,
  type ProjectItem,
} from './projectsData';
import styles from './ProjectsWindow.module.css';

const PROJECTS_ICON = '/karpos/folder-icon.png';

export const projectsAppConfig: AppConfig = {
  id: 'projects',
  label: 'Projects',
  icon: PROJECTS_ICON,
  desktop: false,
  startMenu: false,
  taskbarLabel: 'Projects',
};

function MarqueeRow({
  title,
  direction,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  direction: 'left' | 'right';
  items: ProjectItem[];
  selectedId: string;
  onSelect: (item: ProjectItem) => void;
}) {
  const repeated = useMemo(() => [...items, ...items], [items]);
  const [isHovered, setIsHovered] = useState(false);
  return (
    <section className={styles.projectsMarqueeRow}>
      <h3 className={styles.projectsRowTitle}>{title}</h3>
      <div className={styles.projectsMarqueeMask}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`${styles.projectsMarqueeTrack} ${
            direction === 'right' ? styles.dirRight : styles.dirLeft
          } ${isHovered ? styles.paused : ''}`.trim()}
        >
          {repeated.map((item, index) => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={`${item.id}-${index}`}
                type="button"
                className={`${styles.projectsPill} ${isSelected ? styles.selected : ''}`.trim()}
                onClick={() => onSelect(item)}
                title={item.summary}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProjectsWindow() {
  const { apps } = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();
  const [selectedProject, setSelectedProject] = useState<ProjectItem>(ALL_PROJECTS[0]);
  const prevShowRef = useRef(false);

  const appState = apps.projects;
  const showWindow = !!(appState?.visible && !appState?.minimized);

  useEffect(() => {
    if (!showWindow) {
      prevShowRef.current = false;
      return;
    }
    const justShown = !prevShowRef.current;
    prevShowRef.current = true;
    if (!justShown) return;
    if (appState?.bounds) return;

    const t = window.setTimeout(() => {
      const win = document.getElementById('projects-window');
      if (!win || win.classList.contains('maximized')) return;

      const rect = win.getBoundingClientRect();
      const width = rect.width || 650;
      const height = rect.height || 750;
      const taskbarReserve = document.body.classList.contains('karpos-desktop') ? 52 : 28;
      const availableHeight = Math.max(0, window.innerHeight - taskbarReserve);
      const left = Math.max(8, Math.round((window.innerWidth - width) / 2));
      const top = Math.max(8, Math.round((availableHeight - height) / 2));
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    }, 0);

    return () => window.clearTimeout(t);
  }, [appState?.bounds, showWindow]);

  return (
    <AppWindow
      id="projects-window"
      appId="projects"
      className={`${styles.projectsWindow} app-window app-window-hidden`}
      allowResize
      titleBar={
        <TitleBar
          title="Projects Explorer"
          icon={
            <img src={PROJECTS_ICON} alt="" style={{ width: 16, height: 16, marginRight: 4 }} />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      <div className={styles.projectsRoot}>
        <header className={styles.projectsPreviewCard}>
          <div className={styles.projectsPreviewShotWrap}>
            <img
              className={styles.projectsPreviewShot}
              src={selectedProject.screenshotUrl}
              alt={`${selectedProject.title} preview`}
            />
          </div>
          <p className={styles.projectsKicker}>{selectedProject.category}</p>
          <p className={styles.projectsYear}>{selectedProject.year}</p>
          <h2 className={styles.projectsTitle}>{selectedProject.title}</h2>
          <p className={styles.projectsSummary}>{selectedProject.summary}</p>
          {selectedProject.githubUrl ? (
            <p className={styles.projectsLinks}>
              <a
                className={styles.projectsRepoLink}
                href={selectedProject.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                View GitHub Repo
              </a>
            </p>
          ) : null}
          <div className={styles.projectsTags}>
            {selectedProject.tags.map((tag) => (
              <span key={tag} className={styles.projectsTag}>
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className={styles.projectsStack}>
          <MarqueeRow
            title="Featured Projects"
            direction="left"
            items={FEATURED_PROJECTS}
            selectedId={selectedProject.id}
            onSelect={setSelectedProject}
          />
          <MarqueeRow
            title="Legacy & Experiments"
            direction="right"
            items={LEGACY_AND_EXPERIMENTS}
            selectedId={selectedProject.id}
            onSelect={setSelectedProject}
          />
        </div>
      </div>
    </AppWindow>
  );
}
