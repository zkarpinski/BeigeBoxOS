'use client';

import {
  MazeScreensaver,
  ScreensaverContainer,
  SpaceScreensaver,
  UnderwaterScreensaver,
} from '@retro-web/core';

export function ScreensaverPage({ name }: { name: string }) {
  const bg = name === 'space' ? '#000010' : '#000';
  return (
    <ScreensaverContainer background={bg}>
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
