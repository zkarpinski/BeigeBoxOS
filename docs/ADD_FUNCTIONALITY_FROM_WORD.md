# Add functionality from word branch (starting from main)

**Note:** The project was reorganized: `word/` → `apps/word/`, `vb6/` → `apps/vb6/`. Shell-related scripts live in `shell/` (windows97, taskbar, shutdown, windowManager). All paths in this doc refer to the original names; in the repo they are under `apps/word/` or `apps/vb6/`.

**Approach:** Use **main** as the base (better UI). Stay on main’s HTML structure and CSS. Add behavior from **word** one feature at a time, adapting word’s JS to main’s DOM (IDs/classes).

---

## What main already has
- Word window with main’s layout and `style.css`
- Title bar (min/max/close) wired in `windowManager.js`
- Taskbar + Start button + one task “Microsoft Word”
- Start menu with “Microsoft Word” item
- File menu dropdown (File → New / Open / Save / Print / Exit) in `fileMenu.js`
- File open (file input), basic editor in `editor.js`
- Clippy via CDN (clippyjs)

---

## What to add from word (in order)

Do these in sequence so each step builds on the last.

### 1. **Toolbar actions (formatting & standard)** ✅ DONE
- **From word:** `word/toolbar.js` – buttons call `document.execCommand` (bold, italic, underline, font, size, alignment, lists, etc.).
- **On main:** Main’s toolbar has `.tb-btn` but no IDs. Add IDs to the relevant buttons (e.g. `id="cmd-bold"`, `id="cmd-save"`) and hook them up. Reuse word’s `execCommand` logic; point it at main’s `#editor` (or whatever the contenteditable id is on main).
- **Done:** Added `word/word.js`, `word/editor.js`, `word/toolbar.js`; added IDs to all standard and formatting toolbar buttons and selects; zoom uses `.workspace-area`; Save downloads as `.doc`; Open accepts `.txt,.html,.doc,.rtf`; editor.js kept for focus, toolbar active state (bold/italic/underline), and view buttons.

### 2. **Editor behavior** ✅ DONE
- **From word:** `word/editor.js` (exec helper), `word/word.js` (ref to editor), optional `word/resume.js` (default content).
- **On main:** Ensure one contenteditable has a stable id; add the exec helper and any default content you want.
- **Done:** `#editor` is the contenteditable (already on main). Exec helper and refs from Step 1. Added `apps/word/resume.js` so the editor loads with the default resume by default.

### 3. **Save as .doc / open .doc** ✅ DONE
- **From word:** In `word/toolbar.js`, `saveAsDoc()` and the open logic that accepts `.doc`/`.rtf` and treats HTML vs plain text.
- **On main:** Wire Save button and File → Save to the same “build HTML and download as .doc” logic; extend File → Open to handle .doc/.rtf like word.
- **Done:** File input `accept` is `.txt,.html,.doc,.rtf`. File → Open uses same logic as toolbar (read as text, detect HTML, set innerHTML or innerText). File → Save calls `Word97.saveAsDoc()` so it downloads as Document1.doc; fallback to document.html if Word97 not loaded.

### 4. **All menu bar dropdowns (Edit, View, Insert, …)** ✅ DONE
- **From word:** `word/menus.js` – opens dropdowns by `data-menu`, positions them, and handles item clicks (e.g. Hyperlink, Table).
- **On main:** Main only has File dropdown. Add the rest of the menu items and dropdowns (same structure as word or adapted to main’s markup), then port menu open/close and item actions from `word/menus.js`.
- **Done:** Edit, View, Insert, Format, Tools, Table, Window, Help are clickable; each opens a fixed dropdown. File id `menu-file`, open/close in `word/menus.js`. Item actions: Cut/Copy/Paste/Undo, Hyperlink/Table, Normal/Page Layout, Save/Print/Exit, About (opens about-dialog). About dialog + OK + Ctrl+Shift+click icon for Pinball wired.

### 5. **Status bar** ✅ DONE
- **From word:** `word/statusBar.js` – line/col, view buttons, mode toggles.
- **On main:** Add a status bar to the layout and the same update logic, using main’s editor element and any view/mode elements you add.
- **Done:** Status panel ids added; word/statusBar.js created with line/col, view buttons (wordWindow classes), mode double-click toggles; view logic moved from editor.js.

### 6. **Close = hide window + taskbar button** ✅ DONE
- **From word:** `word/window.js` – close asks to save then hides window and deactivates taskbar; taskbar click restores.
- **On main:** In `windowManager.js`, make Close (and Exit) call the save-as-.doc flow when needed, then hide the window and the taskbar task; make taskbar click show the window again. Align with how word does it.
- **Done:** `closeWordWindow()` in windowManager prompts "Do you want to save changes to Document1?", calls `Word97.saveAsDoc()` on Yes, then hides word window and taskbar task. Title Close, menu bar X (doc-close-btn), and File → Exit all call it. Taskbar click restores window when minimized; Start → Microsoft Word restores when closed. Exit handler removed from fileMenu.js.

### 7. **Multi-app shell (optional)** ✅ DONE
- **From word:** `shell/windows97.js` – `registerApp`, `showApp`, `hideApp`, `focusApp`, taskbar per app, Start menu → app.
- **On main:** If you want multiple apps (e.g. Word + VB6), add a “shell” layer: one taskbar button per app, Start menu items that show/focus the right window. You can start with one app (Word) and add the shell when you add a second app.
- **Done:** shell/windows97.js + word/window.js; Word registers with shell; Close/Exit/min/max wired; taskbar and Start → Word go through shell; CSS app-window-hidden, app-taskbar-hidden, minimized; windowManager fallback when no shell.

### 8. **VB6 (optional)** ✅ DONE
- **From word:** VB6 window HTML, `vb6/vb6.css`, `vb6/vb6.js`, `vb6/window.js`, New Project dialog.
- **On main:** Add the VB6 markup and styles; register VB6 with the shell (if you added it); wire title bar and dialog like word.
- **Done:** Minimal VB6 window + vb6.css + vb6/window.js; shell registration; taskbar and Start item.

### 9. **Clippy custom (optional)** — SKIPPED
- **From word:** `word/clippy.js` – custom Clippy UI, drag, “What would you like to do?” popup, letter tip (“Dear” / “letter”).
- **On main:** Either keep main’s clippyjs CDN or replace with word’s custom Clippy and port the popup and tips.

### 10. **Pinball, About, Shut down** ✅ DONE
- **From word:** `word/pinball.js`, About dialog (Help → About, Ctrl+Shift+click icon), `shutdown.js` + shutdown overlay.
- **On main:** Add the same UI (overlay, dialog, Start menu items) and port the event handlers.
- **Done:** Pinball overlay + word/pinball.js; shutdown overlay + shutdown.js; Start items start-pinball, start-shutdown; CSS.

### 11. **Tray clock** ✅ DONE
- **From word:** `tray.js` – updates tray time.
- **On main:** Give the tray clock an id and update it on a timer like word.
- **Done:** Clock id="clock"; taskbar.js updates every 10s.

---

## Unit tests (Node.js only for running tests)

Run `npm install` once, then `npm test`. Tests in `test/*.test.js` use Jest + jsdom: shell (show/hide/focus, registerApp), Word97 editor/exec, status bar line/col algorithm, menu DOM IDs. Setup in `test/setup.js` adds minimal DOM. The app itself is static HTML/CSS/JS and does not require Node to run.

---

## How to work

- **Branch:** Create a branch from `main` (e.g. `main-plus-word-features`). Do all adds there.
- **Reference:** Keep the **word** branch (or a copy of it) open for copy-paste. When you add a feature, find the corresponding file(s) on word and adapt the logic to main’s selectors and structure.
- **One feature at a time:** Finish and test one item from the list before moving to the next.
- **Main’s DOM is truth:** When word uses `#cmd-save` or `.word-window`, and main uses something else, add the needed id/class on main or map the behavior to main’s existing ids/classes.

---

## Quick reference: word files → what they do

| Word file            | Purpose |
|----------------------|--------|
| `shell/windows97.js` | Multi-app: register, show/hide/focus, taskbar + Start |
| `word/word.js`       | Refs: editor, wordWindow |
| `word/editor.js`     | execCommand helper, getSelectionOrDocument |
| `word/toolbar.js`    | All toolbar buttons + save/open .doc |
| `word/menus.js`      | All menu dropdowns + positioning + actions |
| `word/statusBar.js`  | Line/col, view buttons, mode toggles |
| `word/window.js`     | Min/max/close, taskbar click, doc buttons |
| `word/clippy.js`     | Custom Clippy, popup, letter tip |
| `word/pinball.js`    | Pinball easter egg |
| `word/resume.js` | Default document content (resume) |
| `startmenu.js`       | Start button toggle, menu item clicks (or shell handles) |
| `shutdown.js`       | Shut down overlay |
| `tray.js`            | Clock update |
| `vb6/*`              | VB6 window and behavior |

Use this list to know where to look when adding each feature on main.
