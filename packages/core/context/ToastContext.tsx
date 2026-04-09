'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number; // ms; 0 = persist until dismissed
}

export interface ToastOptions {
  type?: ToastType;
  /** Auto-dismiss after this many ms. Default 3500. Pass 0 to persist. */
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, opts?: ToastOptions) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

let _nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, opts?: ToastOptions): string => {
    const id = `toast-${_nextId++}`;
    const duration = opts?.duration ?? 3500;
    const type = opts?.type ?? 'info';
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      const t = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, t);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}
