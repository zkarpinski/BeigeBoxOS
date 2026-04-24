# PalmOS 5 — Next Improvements

All 20 items from `IMPROVEMENTS.md` are complete. This file picks up where that left off, again ordered by effort-to-impact ratio.

---

## Tier 1 — Quick Wins (< 30 min each)

### 1. Wire the silk Calculator button

**File:** `PalmDesktop.tsx`
`PalmFrame` already accepts `onCalcClick` and the silk area renders the grid icon. But `PalmDesktop` never passes `onCalcClick`, so tapping the silk Calculator does nothing. One-line fix: `onCalcClick={() => openApp('calc')}`. Users naturally tap the silk Calculator button.

### 2. Note Pad ruled lines

**File:** `NotePadApp.tsx`
The real Palm Note Pad drew faint horizontal lines on the canvas so handwriting stayed level. Draw them in the `useEffect` that clears/redraws the canvas: a loop of `ctx.fillRect` every 18px in a light grey (`#e8e8e8`), drawn before `drawImage`. Zero logic change, pure authenticity.

### 3. To Do priority cycling

**File:** `PalmTodoApp.tsx`
The priority number (`1`) renders but tapping it does nothing. Make it a button that cycles `1 → 2 → 3 → 1`. Sort the list by priority ascending, completed items at the bottom. Real PalmOS To Do users lived by priority numbers — this is the most-used interaction after the checkbox.

### 4. Palm-style scrollbar in MemoPadApp

**File:** `MemoPadApp.tsx`
The Launcher has a full custom Palm scrollbar (up arrow, draggable thumb, down arrow). Memo Pad's list has none — it just uses browser default overflow. Port the same 13px scrollbar column from `PalmLauncher.tsx` into `MemoPadApp`'s list view. Consistency matters.

### 5. Swipe between Note Pad pages

**File:** `NotePadApp.tsx`
Add touch swipe detection (left = next page, right = previous page) to the canvas. Use `onPointerDown`/`onPointerUp` delta-X detection: if the pointer didn't move more than a few pixels vertically but moved ≥40px horizontally, treat it as a swipe rather than a drawing stroke. Natural stylus navigation.

---

## Tier 2 — Medium Effort, High Impact (1–3 hours each)

### 6. Expense app

**File:** new `ExpenseApp.tsx`
Expense was bundled on every Palm and synced with desktop spreadsheets. The UX is simple: a list of expense entries (date, amount, category, note), plus a "New" form. Categories: Airfare, Hotel, Meals, Entertainment, Fuel, Mileage, Other. Show a running total at the bottom. ~200 lines. Currently goes to the stub — closing this gap fills one of the last launcher holes.

### 7. Mail app (read-only inbox)

**File:** new `MailApp.tsx`
Palm Mail was a core part of the m505 experience. A read-only pre-seeded inbox with 4–5 fake emails (sender, subject, date, body) is ~150 lines. Tap an email to open a detail view. No real send/receive needed — this is the same approach as the pre-loaded Address contacts. Add a "New" button that opens the system keyboard for composing (but doesn't actually send). Very high nostalgic impact.

### 8. Add / Edit contacts in Address Book

**File:** `AddressApp.tsx`
The Address app is currently read-only. Add a "New" button in the footer and an edit form (first name, last name, company, phone, email, address fields). The form should use the system `<input>` elements so the graffiti area opens the keyboard. On "Done", save to localStorage. This turns Address from a demo into a real app.

### 9. Prefs app

**File:** new `PrefsApp.tsx`
Prefs is in the launcher (Unfiled category) and currently stubs. A minimal Prefs app with three screens covers the most-used settings:

- **General:** System sounds on/off (persisted to localStorage, read by `usePalmSounds`)
- **Date & Time:** Display format (12h/24h toggle), shown in Clock and DateBook
- **Owner:** Name/company text fields shown on the lock screen
  ~150 lines. Makes the OS feel configurable.

### 10. Security lock screen

**File:** new `SecurityApp.tsx` + hook into `PalmDesktop.tsx`
Security was the app people tapped before handing their Palm to someone. Implement:

- Security app: set a 4-digit PIN (stored in localStorage as a simple hash)
- When PIN is set, add a "Lock Now" button
- On lock: replace the entire screen with a lock overlay (above `PalmFrame`) showing the Owner name from Prefs and a PIN entry keypad
- Correct PIN dismisses the lock
  ~200 lines + integration in PalmDesktop.

### 11. App menus (Menu silk button)

**File:** `PalmDesktop.tsx` + per-app menu data
The Menu silk button currently fires `menuOpen` which only does something in Space Trader. Build a system-level menu dropdown that renders per-app menu items:

- **To Do:** Record (New Item, Delete Item), Options (Font, Preferences)
- **Memo Pad:** Record (New Memo, Delete Memo), Edit (Undo, Cut, Copy, Paste, Select All)
- **Address:** Record (New Contact, Delete Contact), Options (Rename Fields)
- **Date Book:** Record (New Event, Delete Event), Options (Preferences)
  Most menu actions map to functions already in each app — just need the chrome and wiring. The Menu button is one of the most-tapped silk buttons; leaving it dead is a jarring gap.

### 12. Date Book — early morning + evening hours

**File:** `DateBookApp.tsx`
The timeline currently runs 8:00–6:00 (11 slots). The real Palm Date Book showed 7:00 AM–9:00 PM with an "All Day" banner at the top. Extend `HOURS` array and add a fixed "All Day" slot at the top (no time label). Low code, high completeness.

---

## Tier 3 — Polish & Authenticity

### 13. Custom bitmap-style launcher icons

**File:** `PalmLauncher.tsx`
All launcher icons are Lucide SVG icons — clean, modern, nothing like Palm. The real Palm OS icons were 32×32 monochrome bitmaps with a distinctive chunky style. Replace each Lucide icon with a hand-crafted inline SVG that mimics the actual m505 icon for that app (Date Book = calendar grid, Memo = notepad lines, To Do = checklist, etc.). Low code, extremely high visual authenticity.

### 14. Beam / infrared send animation

**File:** new modal in `PalmDesktop.tsx`
Every Palm had an infrared port and "Beam" was a social ritual — you'd beam business cards, games, memos to other Palm users. Add a "Beam" option to app menus that triggers a 2-second animation: a dialog shows "Beaming…" with a pulsing IR icon, then "Beam Complete" or a fake "No receiver found" error. Pure theater, but deeply embedded in Palm culture.

### 15. "Beam Received" notification

**File:** `PalmDesktop.tsx`
Complement #14: after HotSync completes, show a brief "Item received via Infrared: Meeting Notes" toast notification (small banner at top of screen, auto-dismisses after 3s). Adds to the illusion that the device is connected to a world.

### 16. To Do "Show…" filter dialog

**File:** `PalmTodoApp.tsx`
The "Show…" button in the To Do footer exists but does nothing. Implement a modal with checkboxes:

- Show Completed Items (toggle)
- Show Only Due Items (toggle)
- Sort by: Priority / Due Date / Alphabetical
  Saves preference to localStorage. This is the core power-user feature of Palm To Do.

### 17. Note Pad pen thickness options

**File:** `NotePadApp.tsx`
Add a thin/medium/thick pen selector to the toolbar (three small line-width icons). Store the selected width as state. Real Palm Note Pad had a "Pen" menu with thin, medium, thick options. Low code — just expose `lineWidth` as a selectable value.

### 18. Clock alarm setter

**File:** `ClockApp.tsx`
The Clock app shows the time but has no alarm. Add a simple alarm time picker (tap hour/minute fields to increment) and an on/off toggle. When the alarm time is reached, play `playSuccess()` and show a modal "Alarm!" dialog with an OK button. Store in localStorage. The alarm setter was the second reason people opened the Clock app.

---

## Quick Reference

| #   | Item                   | Effort | Impact       |
| --- | ---------------------- | ------ | ------------ |
| 1   | Wire silk Calc button  | 5 min  | Medium       |
| 2   | Note Pad ruled lines   | 15 min | Medium       |
| 3   | To Do priority cycling | 30 min | **High**     |
| 4   | Memo Pad scrollbar     | 30 min | Medium       |
| 5   | Swipe Note Pad pages   | 30 min | Medium       |
| 6   | Expense app            | 2 hr   | **High**     |
| 7   | Mail app (read-only)   | 2 hr   | **High**     |
| 8   | Add/Edit contacts      | 1.5 hr | **High**     |
| 9   | Prefs app              | 1.5 hr | Medium       |
| 10  | Security lock screen   | 2 hr   | Medium       |
| 11  | App menus              | 2 hr   | **High**     |
| 12  | Date Book more hours   | 20 min | Low-medium   |
| 13  | Bitmap launcher icons  | 2 hr   | **High**     |
| 14  | Beam animation         | 1 hr   | Medium (fun) |
| 15  | Beam received toast    | 30 min | Low (fun)    |
| 16  | To Do Show… filter     | 1 hr   | Medium       |
| 17  | Note Pad pen thickness | 20 min | Low-medium   |
| 18  | Clock alarm setter     | 1.5 hr | Medium       |
