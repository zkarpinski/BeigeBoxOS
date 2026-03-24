# KarpOS Roadmap

## Core Platform

- [ ] Add durable local file storage with schema versioning and migration support
- [ ] Add import/export for filesystem snapshots (`.json`) and single-file restore
- [ ] Add optional cloud sync mode with conflict resolution (local-first default)
- [ ] Improve startup performance with lazy directory manifests and on-demand file loading
- [ ] Add filesystem search (name + content for text/markdown files)

## Apps and Cross-Platform Support

- [ ] Ship more cross-platform packaged apps shared across Win98, WinXP, and KarpOS
- [ ] Add a lightweight Markdown Notes app with tags, pinning, and recent files
- [ ] Add a cross-platform terminal app with virtual shell history
- [ ] Add media viewer app (image/pdf/audio) with shared core components
- [ ] Create app capability flags so each OS can opt in/out cleanly

## KarpOS UX

- [ ] Add drag-select + keyboard multi-select for desktop icons
- [ ] Add rename, duplicate, and delete actions in desktop context menu
- [ ] Add "New File" and "New Folder" flows directly on desktop
- [ ] Add quick launcher (spotlight-style) with app and file results
- [ ] Add window snapping, tiling presets, and saved workspace layouts

## Reliability and DevEx

- [ ] Add integration tests for public `/fs` hydration + local override behavior
- [ ] Add telemetry hooks for app open time, file open time, and crash boundaries
- [ ] Add offline caching strategy for static `/fs` files and app assets
- [ ] Add feature flags for staged rollout of experimental shell changes
