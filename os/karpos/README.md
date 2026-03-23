# KarpOS

Personal playground “OS” shell — **neo-brutalist** styling inspired by [neobrutalism.dev](https://www.neobrutalism.dev/). It is not a recreation of a legacy desktop; it reuses the Win98 app implementations from `os/win98` with KarpOS window chrome and theme overrides.

## Commands

- `pnpm dev:karpos` — Next.js dev server
- `pnpm build:karpos` — static export to `out/`

## Layout (kebab-case folders)

- `app/components/karpos-shell/` — `AppWindow`, `TitleBar`, `KarpGlobalShim` (`window.KarpOS`)
- `app/components/karpos-desktop/` — `KarpDesktop`, `DesktopIcons` (Karpos virtual FS + `karpos-fs-change`)
- `app/karpos-theme.css` — shell + token overrides for shared apps
- `app/karpos-app-brutal.css` — **loaded last**; flattens Win98 bevels inside apps (Navigator, IE5, Word toolbars, `win-border-*`, etc.)

Static assets are symlinked from `os/win98/public`.
