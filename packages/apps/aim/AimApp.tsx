// TODO(Phase 4): Extract AIM content/chrome split.
//
// The full AimWindow implementation is in:
//   os/win98/app/components/apps/aim/AimWindow.tsx
//
// To properly extract:
// 1. Move all state (buddy list, chat, away, profile) into this file (AimApp)
// 2. Accept onHide as a prop instead of calling ctx.hideApp directly
// 3. Accept screenName, buddies as props (or keep as module-level constants)
// 4. Remove the AppWindow wrapper — os/win98 wraps it in AppWindow itself
// 5. Re-export AimRunningManIcon and AimBanner from here if needed
//
// Blocked because AimWindow renders 4 overlapping panels (buddy list, away dialog,
// chat window, profile dialog) that share the same React tree via AppWindow. Extracting
// requires converting these to portals or separate AppWindows.

export {};
