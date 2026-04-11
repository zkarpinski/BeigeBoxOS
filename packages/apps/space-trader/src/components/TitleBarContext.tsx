import React, { createContext, useContext } from 'react';
import { ViewType } from '../logic/DataTypes';

export interface TitleBarProps {
  title: string;
  onViewChange: (view: ViewType) => void;
}

interface TitleBarContextValue {
  TitleBar: React.ComponentType<TitleBarProps> | null;
}

const TitleBarContext = createContext<TitleBarContextValue>({ TitleBar: null });

export function TitleBarProvider({
  TitleBar,
  children,
}: {
  TitleBar: React.ComponentType<TitleBarProps> | null;
  children: React.ReactNode;
}) {
  return <TitleBarContext.Provider value={{ TitleBar }}>{children}</TitleBarContext.Provider>;
}

export function useTitleBar() {
  return useContext(TitleBarContext);
}
