'use client';

import {
  MazeScreensaver,
  ScreensaverContainer,
  SpaceScreensaver,
  UnderwaterScreensaver,
} from '@retro-web/core';

export function ScreensaverOverlay({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  const bg = name === 'space' ? '#000010' : '#000';
  return (
    <ScreensaverContainer onDismiss={onDismiss} background={bg}>
      {name === 'space' ? (
        <SpaceScreensaver />
      ) : name === 'maze' ? (
        <MazeScreensaver />
      ) : (
        <UnderwaterScreensaver />
      )}
    </ScreensaverContainer>
  );
}
