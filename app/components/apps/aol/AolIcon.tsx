'use client';

import React from 'react';

export function AolIconSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 1 L11 10 L1 10 Z" fill="#0000A0" />
      <circle cx="6" cy="6.5" r="2" fill="#fff" />
    </svg>
  );
}

export function AolLogoLarge() {
  return (
    <div className="aol-logo-large">
      <img src="/apps/aol/america_online_logo.png" alt="America Online" className="aol-logo-img" />
    </div>
  );
}
