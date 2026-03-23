'use client';

import React from 'react';

/** AOL AIM banner SVG. */
export function AimBanner() {
  return (
    <div className="aim-banner">
      <svg
        viewBox="0 0 220 60"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="220" height="60" fill="#00006b" />
        <polygon points="130,0 220,0 220,60 100,60" fill="#003399" />
        <polygon points="155,0 185,0 220,35 220,0" fill="#0055cc" opacity="0.5" />
        <circle cx="185" cy="18" r="8" fill="#FFB900" />
        <line
          x1="185"
          y1="26"
          x2="181"
          y2="42"
          stroke="#FFB900"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="183"
          y1="32"
          x2="175"
          y2="29"
          stroke="#FFB900"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="183"
          y1="32"
          x2="191"
          y2="35"
          stroke="#FFB900"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="181"
          y1="42"
          x2="175"
          y2="55"
          stroke="#FFB900"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="181"
          y1="42"
          x2="190"
          y2="51"
          stroke="#FFB900"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text
          x="8"
          y="32"
          fontSize="26"
          fill="#FFD700"
          fontFamily="Arial Black, Arial, sans-serif"
          fontWeight="900"
        >
          AOL
        </text>
        <text
          x="8"
          y="46"
          fontSize="10"
          fill="#ffffff"
          fontFamily="Arial, sans-serif"
          fontStyle="italic"
        >
          Instant
        </text>
        <text
          x="8"
          y="57"
          fontSize="10"
          fill="#ffffff"
          fontFamily="Arial, sans-serif"
          fontStyle="italic"
        >
          Messenger™
        </text>
      </svg>
    </div>
  );
}
