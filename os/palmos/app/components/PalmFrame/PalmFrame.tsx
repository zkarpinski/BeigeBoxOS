'use client';

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { usePalmSounds } from '../../hooks/usePalmSounds';
import { SilkButton, HomeIcon, MenuIcon, CalcGridIcon, FindIcon } from './SilkButton';
import {
  HardwareButton,
  DateBookHWIcon,
  AddressHWIcon,
  TodoHWIcon,
  NoteHWIcon,
} from './HardwareButton';
import { ScrollRocker } from './ScrollRocker';

const SCREEN_PX = 264;

interface PalmFrameProps {
  children: React.ReactNode;
  onHomeClick?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onCalcClick?: () => void;
  onAppButtonClick?: (app: string) => void;
  onScroll?: (direction: 'up' | 'down') => void;
}

export function PalmFrame({
  children,
  onHomeClick,
  onMenuClick,
  onSearchClick,
  onCalcClick,
  onAppButtonClick,
  onScroll,
}: PalmFrameProps) {
  const { playClick } = usePalmSounds();
  const [mobileScale, setMobileScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const compute = () => {
      setMobileScale(window.innerWidth < 640 ? window.innerWidth / SCREEN_PX : 1);
    };
    compute();
    window.addEventListener('resize', compute);

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      window.removeEventListener('resize', compute);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const isMobile = mobileScale !== 1;

  const click = (fn?: () => void) => () => {
    playClick();
    fn?.();
  };
  const clickApp = (app: string) => () => {
    playClick();
    onAppButtonClick?.(app);
  };

  return (
    <div className="palm-page-wrapper">
      {/* Fullscreen toggle — floats in the dark background above the device */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
        className="palm-fullscreen-btn"
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      {/* Device chassis — silver/gray metallic body */}
      <div className="palm-chassis">
        <div className="palm-logos">
          <span
            style={{
              fontFamily: 'serif',
              fontStyle: 'italic',
              fontSize: '15px',
              fontWeight: 'bold',
            }}
          >
            palm
          </span>
          <span style={{ fontFamily: 'sans-serif', fontSize: '11px', letterSpacing: '1px' }}>
            m505
          </span>
        </div>

        <div className="palm-speaker" />

        {/* Screen — on mobile, strip bezel chrome and scale the fixed 264px content up */}
        {isMobile ? (
          <>
            {/* Mobile toolbar: sits above the screen, holds the expand button */}
            <div className="palm-mobile-toolbar">
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                className="palm-mobile-toolbar-btn"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
            <div
              style={{
                width: '100%',
                height: `${SCREEN_PX * mobileScale}px`,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <div
                className="palm-screen"
                style={{ transform: `scale(${mobileScale})`, transformOrigin: 'top left' }}
              >
                {children}
              </div>
            </div>
          </>
        ) : (
          <div className="palm-bezel">
            <div className="palm-screen">{children}</div>
          </div>
        )}

        {/* Graffiti / silk area */}
        <div className="palm-silk-area">
          <div
            style={{
              width: '38px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              padding: '4px 0',
            }}
          >
            <SilkButton onClick={click(onHomeClick)} title="Home">
              <HomeIcon />
            </SilkButton>
            <SilkButton onClick={click(onMenuClick)} title="Menu">
              <MenuIcon />
            </SilkButton>
          </div>
          <div className="palm-graffiti-container">
            <div className="palm-graffiti-input">abc</div>
            <div className="palm-graffiti-divider" />
            <div className="palm-graffiti-input">123</div>
          </div>
          <div
            style={{
              width: '38px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              padding: '4px 0',
            }}
          >
            <SilkButton onClick={click(onCalcClick)} title="Calculator">
              <CalcGridIcon />
            </SilkButton>
            <SilkButton onClick={click(onSearchClick)} title="Find">
              <FindIcon />
            </SilkButton>
          </div>
        </div>

        {/* Hardware buttons */}
        <div className="palm-hardware-buttons">
          <HardwareButton onClick={clickApp('datebook')} title="Date Book" isMobile={isMobile}>
            <DateBookHWIcon />
          </HardwareButton>
          <HardwareButton onClick={clickApp('address')} title="Address" isMobile={isMobile}>
            <AddressHWIcon />
          </HardwareButton>
          <ScrollRocker
            onScrollUp={click(() => onScroll?.('up'))}
            onScrollDown={click(() => onScroll?.('down'))}
            isMobile={isMobile}
          />
          <HardwareButton onClick={clickApp('todo')} title="To Do List" isMobile={isMobile}>
            <TodoHWIcon />
          </HardwareButton>
          <HardwareButton onClick={clickApp('memo')} title="Note Pad" isMobile={isMobile}>
            <NoteHWIcon />
          </HardwareButton>
        </div>
      </div>
    </div>
  );
}
