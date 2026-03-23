'use client';

import React from 'react';

const AIM_ICON_SRC = 'apps/aim/aim-icon.png';

/** Small AIM running man icon (title bar size). */
export function AimRunningManIcon({ size = 14 }: { size?: number }) {
  return (
    <img
      src={AIM_ICON_SRC}
      alt=""
      width={size}
      height={size}
      style={{ marginRight: 4, flexShrink: 0 }}
    />
  );
}
