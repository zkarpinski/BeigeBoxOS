# @retro-web/assets

Shared Windows-era static assets (icons, sounds) used across Win98 and WinXP.

## Usage

Assets in this package are the source of truth for shared shell icons and sounds.
Each OS copies the relevant assets into its own `public/shell/` directory at build time.

Until a copy script is added, keep these in sync manually when updating shared assets.

## Contents

- icons/ — Common shell icons (folder, drive, recycle bin, etc.)
- sounds/ — System sounds (startup, shutdown, error, notify)
