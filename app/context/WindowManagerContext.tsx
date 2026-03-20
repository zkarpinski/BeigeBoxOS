'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  useCallback,
} from 'react';
import type { AppConfig } from '../types/app-config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type Bounds = { left: number; top: number; width: number; height: number };

export interface AppState {
  visible: boolean;
  /** Window is running (on taskbar) but the panel is hidden. visible stays true. */
  minimized: boolean;
  zIndex: number;
  /** Last known window bounds — persisted across sessions. */
  bounds?: Bounds;
}

export type DialogType = 'info' | 'warning' | 'question' | 'error';

export interface DialogConfig {
  type?: DialogType;
  title?: string;
  message?: string;
  buttons?: string[];
}

export interface DialogState extends Required<DialogConfig> {
  resolve: (btn: string) => void;
}

export interface BsodOptions {
  message?: string;
  clearStorage?: boolean;
  reload?: boolean;
}

export interface FatalErrorOptions {
  program?: string;
  details?: string;
  clearStorage?: boolean;
  reload?: boolean;
}

export interface BsodState {
  type: 'bsod';
  options: BsodOptions;
}

export interface FatalErrorState {
  type: 'fatalerror';
  options: FatalErrorOptions;
}

interface WindowManagerContextValue {
  apps: Record<string, AppState>;
  showApp: (id: string) => void;
  hideApp: (id: string) => void;
  focusApp: (id: string) => void;
  minimizeApp: (id: string) => void;
  isAppVisible: (id: string) => boolean;
  isMinimized: (id: string) => boolean;
  setBounds: (id: string, bounds: Bounds) => void;
  openDialog: (config: DialogConfig) => Promise<string>;
  openBsod: (opts?: BsodOptions) => void;
  openFatalError: (opts?: FatalErrorOptions) => void;
  clearBsod: () => void;
  dialogState: DialogState | null;
  bsodState: BsodState | FatalErrorState | null;
  runDialogOpen: boolean;
  setRunDialogOpen: (open: boolean) => void;
  shutdownOpen: boolean;
  setShutdownOpen: (open: boolean) => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);

export function useWindowManager(): WindowManagerContextValue {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used inside WindowManagerProvider');
  return ctx;
}

// ── Z-index constants ─────────────────────────────────────────────────────────

const Z_BASE = 10;
const Z_FOCUSED = 11;

// ── localStorage helpers ───────────────────────────────────────────────────────

const BOUNDS_STORAGE_KEY = 'win97-window-bounds';

function loadAllBounds(): Record<string, Bounds> {
  try {
    const raw = localStorage.getItem(BOUNDS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Bounds>;
  } catch {
    return {};
  }
}

function saveAllBounds(all: Record<string, Bounds>): void {
  try {
    localStorage.setItem(BOUNDS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota exceeded or private browsing — ignore */
  }
}

// ── Reducer ────────────────────────────────────────────────────────────────────

type AppsMap = Record<string, AppState>;

type AppAction =
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string }
  | { type: 'FOCUS'; id: string }
  | { type: 'MINIMIZE'; id: string }
  | { type: 'SET_BOUNDS'; id: string; bounds: Bounds };

function appsReducer(state: AppsMap, action: AppAction): AppsMap {
  switch (action.type) {
    case 'SHOW': {
      if (!state[action.id]) return state;
      // Bring to front, clear minimized
      const next: AppsMap = {};
      for (const k of Object.keys(state)) next[k] = { ...state[k], zIndex: Z_BASE };
      next[action.id] = { ...state[action.id], visible: true, minimized: false, zIndex: Z_FOCUSED };
      return next;
    }
    case 'HIDE': {
      if (!state[action.id]) return state;
      const next: AppsMap = {
        ...state,
        [action.id]: { ...state[action.id], visible: false, minimized: false, zIndex: Z_BASE },
      };
      // Focus another visible non-minimized window
      const others = Object.keys(next).filter(
        (k) => k !== action.id && next[k].visible && !next[k].minimized,
      );
      if (others.length > 0) next[others[0]] = { ...next[others[0]], zIndex: Z_FOCUSED };
      return next;
    }
    case 'MINIMIZE': {
      if (!state[action.id]) return state;
      const next: AppsMap = {
        ...state,
        [action.id]: { ...state[action.id], minimized: true, zIndex: Z_BASE },
      };
      // Focus another visible non-minimized window
      const others = Object.keys(next).filter(
        (k) => k !== action.id && next[k].visible && !next[k].minimized,
      );
      if (others.length > 0) next[others[0]] = { ...next[others[0]], zIndex: Z_FOCUSED };
      return next;
    }
    case 'FOCUS': {
      // Only focus if visible and not minimized
      if (!state[action.id] || !state[action.id].visible || state[action.id].minimized)
        return state;
      const next: AppsMap = {};
      for (const k of Object.keys(state)) next[k] = { ...state[k], zIndex: Z_BASE };
      next[action.id] = { ...state[action.id], zIndex: Z_FOCUSED };
      return next;
    }
    case 'SET_BOUNDS': {
      if (!state[action.id]) return state;
      return { ...state, [action.id]: { ...state[action.id], bounds: action.bounds } };
    }
    default:
      return state;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function WindowManagerProvider({
  registry,
  initialOpenAppId = null,
  children,
}: {
  registry: AppConfig[];
  /** If set, only this app starts visible+focused (used for /run/[appId] URLs). */
  initialOpenAppId?: string | null;
  children: React.ReactNode;
}) {
  // Initial state: no bounds (SSR-safe). Bounds are loaded client-side in useEffect below.
  const initialApps: AppsMap = {};
  const openingFromUrl = typeof initialOpenAppId === 'string' && initialOpenAppId.length > 0;
  for (const app of registry) {
    const visible = openingFromUrl ? app.id === initialOpenAppId : !!app.openByDefault;
    const isFocused = visible && (!openingFromUrl || app.id === initialOpenAppId);
    initialApps[app.id] = { visible, minimized: false, zIndex: isFocused ? Z_FOCUSED : Z_BASE };
  }

  const [apps, dispatch] = useReducer(appsReducer, initialApps);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [bsodState, setBsodState] = useState<BsodState | FatalErrorState | null>(null);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);

  useEffect(() => {
    // If the window is small (e.g. mobile), hide apps that were open by default except for AIM
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      if (openingFromUrl) return; // /run/[appId] should always open the requested app
      registry.forEach((app) => {
        if (app.openByDefault && app.id !== 'aim') {
          dispatch({ type: 'HIDE', id: app.id });
        }
      });
    }
  }, [registry, openingFromUrl]);

  // Load persisted bounds from localStorage after mount (client-only, avoids SSR mismatch)
  useEffect(() => {
    const persisted = loadAllBounds();
    for (const [id, bounds] of Object.entries(persisted)) {
      if (initialApps[id]) dispatch({ type: 'SET_BOUNDS', id, bounds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount only

  const showApp = useCallback((id: string) => {
    dispatch({ type: 'SHOW', id });
    window.dispatchEvent(new CustomEvent('win97:showApp', { detail: { id } }));
  }, []);

  const hideApp = useCallback((id: string) => {
    dispatch({ type: 'HIDE', id });
    window.dispatchEvent(new CustomEvent('win97:hideApp', { detail: { id } }));
  }, []);

  const focusApp = useCallback((id: string) => {
    dispatch({ type: 'FOCUS', id });
  }, []);

  const minimizeApp = useCallback((id: string) => {
    dispatch({ type: 'MINIMIZE', id });
  }, []);

  const isAppVisible = useCallback((id: string) => !!(apps[id] && apps[id].visible), [apps]);

  const isMinimized = useCallback((id: string) => !!(apps[id] && apps[id].minimized), [apps]);

  const setBounds = useCallback((id: string, bounds: Bounds) => {
    dispatch({ type: 'SET_BOUNDS', id, bounds });
    // Persist to localStorage
    const all = loadAllBounds();
    all[id] = bounds;
    saveAllBounds(all);
  }, []);

  const openDialog = useCallback((config: DialogConfig): Promise<string> => {
    return new Promise<string>((resolve) => {
      setDialogState({
        type: config.type ?? 'info',
        title: config.title ?? 'Windows',
        message: config.message ?? '',
        buttons: config.buttons ?? ['OK'],
        resolve: (btn: string) => {
          setDialogState(null);
          resolve(btn);
        },
      });
    });
  }, []);

  const openBsod = useCallback((opts?: BsodOptions) => {
    setBsodState({ type: 'bsod', options: opts ?? {} });
  }, []);

  const openFatalError = useCallback((opts?: FatalErrorOptions) => {
    setBsodState({ type: 'fatalerror', options: opts ?? {} });
  }, []);

  const clearBsod = useCallback(() => {
    setBsodState(null);
  }, []);

  // window.Windows97 shim — delegates to React context so legacy JS callers still work
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w['Windows97'] = {
      apps,
      registerApp: () => {},
      showApp,
      hideApp,
      focusApp,
      minimizeApp,
      isAppVisible,
      isMinimized,
      get activeAppId() {
        const focused = Object.entries(apps).find(
          ([, s]) => s.visible && !s.minimized && s.zIndex === Z_FOCUSED,
        );
        return focused ? focused[0] : null;
      },
      handleStartMenuItem: (clickedId: string) => {
        const app = registry.find(
          (a) => `start-menu-${a.id}` === clickedId || `start-${a.id}` === clickedId,
        );
        if (app) {
          if (isAppVisible(app.id) && !isMinimized(app.id)) focusApp(app.id);
          else showApp(app.id);
          return true;
        }
        return false;
      },
      alert: (title: string, msg: string, type?: DialogType) =>
        openDialog({ type: type ?? 'info', title, message: msg, buttons: ['OK'] }),
      confirm: (title: string, msg: string, type?: DialogType) =>
        openDialog({
          type: type ?? 'question',
          title,
          message: msg,
          buttons: ['OK', 'Cancel'],
        }).then((btn) => btn === 'OK'),
      dialog: openDialog,
      bsod: openBsod,
      fatalError: openFatalError,
      _clearBsod: clearBsod,
    };
  }, [
    apps,
    showApp,
    hideApp,
    focusApp,
    minimizeApp,
    isAppVisible,
    isMinimized,
    openDialog,
    openBsod,
    openFatalError,
    clearBsod,
    registry,
  ]);

  const value: WindowManagerContextValue = {
    apps,
    showApp,
    hideApp,
    focusApp,
    minimizeApp,
    isAppVisible,
    isMinimized,
    setBounds,
    openDialog,
    openBsod,
    openFatalError,
    clearBsod,
    dialogState,
    bsodState,
    runDialogOpen,
    setRunDialogOpen,
    shutdownOpen,
    setShutdownOpen,
  };

  return <WindowManagerContext.Provider value={value}>{children}</WindowManagerContext.Provider>;
}
