/**
 * KarpOS desktop shortcuts that open URLs in a new browser tab.
 * Edit `url` (and optional `label`) to point at your profiles or other sites.
 */
export type KarposDesktopLink = {
  id: string;
  label: string;
  /** Absolute https URL */
  url: string;
  icon: string;
};

export const KARPOS_DESKTOP_LINKS: KarposDesktopLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/zkarpinski/',
    icon: '/apps/navigator/github-logo.png',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/zacharykarpinski/',
    icon: '/apps/navigator/linkedin-logo.png',
  },
];
