# Organizing Apps as Components

Recommended structure so each app is **modular and reusable** while staying compatible with the existing shell (taskbar, window chrome, `attachWindowChrome`).

---

## 1. Shared Win98 primitives (`app/components/win98/`)

Use these in every app so behavior and look stay consistent.

| Component     | Purpose                                                                                                                      | Props (conceptual)                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **TitleBar**  | Window title + icon + min/max/close. Renders `data-win-min`, `data-win-max`, `data-win-close` so `attachWindowChrome` works. | `title`, `icon?`, `showMin`, `showMax`, `showClose`  |
| **AppWindow** | Outer frame for an app: correct `id` and `className`, TitleBar, then children (menu, body, status).                          | `id`, `className`, `titleBar`, `children`            |
| **MenuBar**   | Horizontal menu with dropdowns (File, Edit, …). Handles Win98 styling and underlines.                                        | `items[]` with `label`, `shortcutChar?`, `dropdown?` |
| **Toolbar**   | Row of buttons + separators (optional).                                                                                      | `buttons[]`, `separators?`                           |

- **CSS**: Keep using the existing app stylesheets (e.g. `notepad.css`). The shell expects specific class names and structure; components should output that same structure.
- **IDs**: Shell and legacy scripts rely on `#<app>-window`, `#taskbar-<app>`, and element ids inside the window. Components must preserve these (e.g. pass `id="notepad-window"` into `AppWindow`).

---

## 2. Per-app components (`app/components/apps/<name>/`)

Each app is **one main component** that composes shared primitives and app-specific pieces.

```
app/components/apps/notepad/
  NotepadWindow.tsx    ← Main export: <NotepadWindow /> (id="notepad-window", etc.)
  NotepadMenuBar.tsx   ← File / Edit / Search / Help (can use shared MenuBar or custom)
  NotepadBody.tsx      ← Textarea + file input (optional split)
```

- **NotepadWindow** = `AppWindow` + `TitleBar` + `NotepadMenuBar` + `NotepadBody`.
- **Word** could be: `AppWindow` + `TitleBar` + `WordMenuBar` + `WordToolbar` + `WordEditor` + `WordStatusBar`, with subcomponents under `apps/word/`.
- **Calculator** = `AppWindow` + `TitleBar` + `CalculatorBody` (display + buttons).

Reuse where it makes sense:

- **MenuBar** is shared; app-specific part is the list of items and dropdowns (can be a config object or a small wrapper like `NotepadMenuBar`).
- **Toolbar** is shared for simple icon rows; Word’s formatting toolbar can be a custom component that still uses the same CSS classes.

---

## 3. What stays “app-specific” vs shared

- **Shared**: Title bar chrome, menu bar layout/dropdowns, toolbar layout, generic dialogs (e.g. “Save as”), window frame (min/max/close, drag, resize).
- **App-specific**: App body (editor, canvas, buttons, address bar, etc.), menu items and actions, toolbar buttons and behavior, any custom dialogs.

Keep **behavior** in the existing vanilla JS for now (or move it gradually into React). Components only need to render the **same DOM** (same ids/classes/data attributes) so `attachWindowChrome`, `Windows98.registerApp` (or the per-OS shim), and app scripts still work.

---

## 4. Migration path

1. **Phase 1 (current)**  
   Desktop is one blob of markup; legacy scripts run after load. No need to change this until you want to migrate an app.

2. **Phase 2 – One app as component**
   - Add shared components (`TitleBar`, `AppWindow`, `MenuBar`, etc.).
   - Implement one app (e.g. Notepad) as `<NotepadWindow />` with the same DOM as today.
   - Remove that app’s HTML from the extracted desktop markup and render `<NotepadWindow />` in its place (e.g. in the same container as the rest of the desktop). Legacy Notepad JS still runs and finds `#notepad-window`.

3. **Phase 3 – More apps**
   - Convert other apps to components using the same pattern.
   - Optionally move app logic (event handlers, state) into React (hooks, context) and reduce or remove the legacy app JS.

4. **Phase 4 – Full component desktop** ✅ _Complete_
   - Desktop is fully component-based: BootScreen, DesktopIcons, Taskbar, StartMenuTree, and individual app components. `desktop-markup.js` and `scripts/extract-desktop-markup.js` have been removed.

**When you add a new app to the page**: create `app/components/apps/<name>/<Name>Window.tsx` exporting `<Name>Window` and `<name>AppConfig`, add an `index.ts` re-export, add the config to `app/registry.ts`, and render `<NameWindow />` in `app/page.tsx`.

---

## 5. Example: Notepad

```tsx
// app/components/apps/notepad/NotepadWindow.tsx
import { AppWindow, TitleBar } from '@/app/components/win98';
import NotepadMenuBar from './NotepadMenuBar';

export function NotepadWindow() {
  return (
    <AppWindow
      id="notepad-window"
      className="notepad-window app-window app-window-hidden"
      titleBar={
        <TitleBar title="Untitled - Notepad" icon={<img src="..." alt="Notepad" />} showMax />
      }
    >
      <NotepadMenuBar />
      <div className="notepad-textarea-container">
        <textarea id="notepad-textarea" className="notepad-textarea" spellcheck={false} />
      </div>
    </AppWindow>
  );
}
```

- `NotepadMenuBar` can be implemented with the shared `MenuBar` and a list of items, or as custom JSX that matches the current notepad menu DOM and ids so `notepad.js` still works.

---

## 6. File layout summary

```
app/
  components/
    win98/
      TitleBar.tsx
      AppWindow.tsx
      MenuBar.tsx
      Toolbar.tsx      (optional)
    apps/
      notepad/
        NotepadWindow.tsx
        NotepadMenuBar.tsx
      calculator/
        CalculatorWindow.tsx
        CalculatorBody.tsx
      word/
        WordWindow.tsx
        WordMenuBar.tsx
        WordToolbar.tsx
        WordEditor.tsx
        ...
```

Use **shared** components for anything that repeats across apps (title bar, menus, toolbars). Use **app-specific** components only where the UI or behavior is unique to that app.
