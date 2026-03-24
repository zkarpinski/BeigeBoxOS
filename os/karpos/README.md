# KarpOS

Personal playground “OS” shell — **neo-brutalist** styling inspired by [neobrutalism.dev](https://www.neobrutalism.dev/). It is not a recreation of a legacy desktop; it reuses the Win98 app implementations from `os/win98` with KarpOS window chrome and theme overrides.

## Commands

- `pnpm dev:karpos` — Next.js dev server
- `pnpm build:karpos` — static export to `out/`
- From monorepo root: `pnpm generate-og-images` — rebuilds `public/og-image.png` (1200×630 Open Graph) from the fish icon; run after changing app icons.

## Layout (kebab-case folders)

- `app/components/karpos-shell/` — `AppWindow`, `TitleBar`, `KarpGlobalShim` (`window.KarpOS`)
- `app/components/karpos-desktop/` — `KarpDesktop`, `DesktopIcons` (rounded neo-brutalist tiles; `karposNeoTileColors`), `KarposTaskbarTasks` (open windows only; same palette + hash), `KarposSystemTray`
- `app/karpos-theme.css` — shell + token overrides for shared apps
- `app/karpos-app-brutal.css` — flattens Win98 bevels inside many shared apps
- `app/minesweeper-karpos.css` — **after** brutal; full neo-brutalist skin for Minesweeper (same `MinesweeperWindow` + logic as Win98)

Static assets live in **`os/karpos/public`**. App/game art and shell media are **symlinks** into `os/win98/public` (`apps/`, `shell/`, `boot-check.js`, etc.) so KarpOS reuses the Win98 implementations without duplicating files. **PWA icons, `site.webmanifest`, `robots.txt`, and `sitemap.xml`** are real files here (KarpOS / karpos.zkarpinski.com branding and SEO).
