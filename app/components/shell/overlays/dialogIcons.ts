import type { DialogType } from '../../../context/WindowManagerContext';

export const DIALOG_ICONS: Record<DialogType, string> = {
  warning:
    '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
    '<polygon points="16,3 31,29 1,29" fill="#ffcc00" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<text x="16" y="27" text-anchor="middle" font-size="17" font-weight="900" font-family="Arial,sans-serif" fill="#000">!</text>' +
    '</svg>',
  question:
    '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="16" cy="16" r="14" fill="#ffcc00" stroke="#000" stroke-width="1.5"/>' +
    '<text x="16" y="23" text-anchor="middle" font-size="19" font-weight="900" font-family="Arial,sans-serif" fill="#000">?</text>' +
    '</svg>',
  info:
    '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="16" cy="16" r="14" fill="#0055cc" stroke="#000" stroke-width="1.5"/>' +
    '<text x="16" y="13" text-anchor="middle" font-size="13" font-weight="900" font-family="Arial,sans-serif" fill="#fff">i</text>' +
    '<rect x="13" y="16" width="6" height="10" rx="1" fill="#fff"/>' +
    '</svg>',
  error:
    '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="16" cy="16" r="14" fill="#cc0000" stroke="#000" stroke-width="1.5"/>' +
    '<line x1="10" y1="10" x2="22" y2="22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
    '<line x1="22" y1="10" x2="10" y2="22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
    '</svg>',
};
