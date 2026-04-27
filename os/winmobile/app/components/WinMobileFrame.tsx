import React from 'react';
import { AximDevice3D } from './AximDevice3D';

interface WinMobileFrameProps {
  children: React.ReactNode;
  onPowerBtn?: () => void;
  onHomeBtn?: () => void;
}

export function WinMobileFrame({ children, onHomeBtn, onPowerBtn }: WinMobileFrameProps) {
  return (
    <div className="winmo-page-wrapper">
      <AximDevice3D onHomeBtn={onHomeBtn} onPowerBtn={onPowerBtn}>
        {children}
      </AximDevice3D>
    </div>
  );
}
