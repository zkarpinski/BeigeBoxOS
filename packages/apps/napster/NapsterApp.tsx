// TODO(Phase 4): Extract Napster content/chrome split.
//
// The full NapsterWindow implementation is in:
//   os/win98/app/components/apps/napster/NapsterWindow.tsx
//
// To properly extract:
// 1. Move all state (activeTab, results, downloads, library) into NapsterApp
// 2. Accept onClose as a prop instead of relying on AppWindow's data-win-close button
// 3. Remove the AppWindow wrapper — os/win98 wraps it in AppWindow itself
// 4. Export as NapsterApp
//
// Also needed: move the napster.css file here (currently in each OS's app directory).

export {};
