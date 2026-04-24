# PalmOS 5 Improvement Ideas

Ordered by effort-to-impact ratio. Low effort = can be done in a single sitting. High impact = meaningfully improves the PalmOS 5 "feel" for someone who used one.

---

## Tier 1 — Quick Wins (< 1 hour each)

### ~~1. Fix the launcher font size typo~~ (Done)

~~**File:** `PalmLauncher.tsx`
`fontSize: '16x'` should be `'16px'`. Currently browsers silently ignore it, so app labels render in the browser's inherited default size rather than the intended 16px. One character fix, correct icon label sizing.~~

### ~~2. Wire up the scroll rocker~~ (Done)

~~**File:** `PalmDesktop.tsx` + `PalmFrame.tsx`
The `ScrollRocker` component already fires `onScrollUp`/`onScrollDown` events. `PalmFrame` accepts an `onScroll` prop. But `PalmDesktop` never passes it. Wire it so the rocker scrolls the active app's content — in the launcher this scrolls the icon grid, in To Do it scrolls the list. PalmOS users habitually used the rocker for one-handed navigation.~~

### ~~3. Live date/time in Date Book~~ (Done)

~~**File:** `DateBookApp.tsx`
The entire Date Book shows a hardcoded `"Sep 23, 04"`. Replace with `new Date()` so at minimum it reflects the real current date and the day-of-week strip highlights the correct day. Zero logic change — just swap the hardcoded string for live values.~~

### ~~4. App switch fade transition~~ (Done)

~~**File:** `PalmDesktop.tsx` / `globals.css`
Currently app switches are instant DOM swaps. PalmOS 5 used a quick (~150ms) dissolve/fade between screens. Adding a CSS `opacity` transition with a `key` change on the content wrapper gives this for ~10 lines of CSS. This single change does more for "feel" than almost anything else.~~

### ~~5. Launcher categories ("▼ All" dropdown)~~ (Done)

~~**File:** `PalmLauncher.tsx`
The category dropdown is already rendered in the status bar but does nothing. Add a `category` state (`'All' | 'Games' | 'Main' | 'Unfiled'`) and filter the app grid accordingly. Assign `space_trader` to `Games`, the built-in apps to `Main`, everything else to `Unfiled`. This is a core PalmOS navigation pattern — power users switch categories constantly.~~

### ~~6. Authentic PalmOS bitmap font~~ (Done)

~~**Files:** `globals.css`, component inline styles
PalmOS used a compact, anti-aliasing-free UI font. Space Trader already applies `-webkit-font-smoothing: none`. Apply this globally, and consider pulling in a web font like **"Press Start 2P"** (too chunky) or better yet **"Silkscreen"** or the open-source **"Palm OS"** font replica for UI labels. This is the single biggest visual authenticity gap — Courier New and generic sans-serif don't look like a Palm at all.~~

### ~~7. Calculator app~~ (Done)

~~**File:** new `CalcApp.tsx`
The silk area already has a dedicated Calculator button that opens... the stub. A basic 4-function calculator is ~100 lines of React. PalmOS Calc was one of the most-used apps. The hard work (button layout, display) is trivial and the silk button already routes to `calc`.~~

### ~~8. Clock app~~ (Done)

~~**File:** new `ClockApp.tsx`
Clock is listed in the launcher but hits the stub. An analog SVG clock face or large digital display is ~60 lines. PalmOS Clock had a simple interface: large time display, current date, and an alarm setter. Even just the display portion would close a visible gap.~~

### ~~9. Better stub screen~~ (Done)

~~**File:** `PalmDesktop.tsx`
The current "App not implemented yet" screen is a grey box with a "?" — very jarring. Replace it with a proper PalmOS-style dialog: dark border, title bar in navy, message text in the PalmOS font, and an "OK" button. Bonus: show the app name in the message. This doesn't implement anything new but removes a rough edge on every unimplemented app.~~

### ~~10. Static battery → slowly depleting~~ (Done)

~~**File:** `PalmStatusBar.tsx`
The battery is hardcoded at 75%. Store battery level in `localStorage`, decay it by ~1% every few minutes of page-open time (via `setInterval`), recharge to 100% on a simulated "HotSync". Quirky but memorable — the low battery warning at 20% was a classic Palm experience. The visual is already there; just needs the number to change.~~

---

## Tier 2 — Medium Effort, High Impact (a few hours each)

### ~~11. Interactive Date Book~~ (Done)

~~**File:** `DateBookApp.tsx`
Replace the static mockup with a real day-view calendar. Store events in `localStorage`. Allow tapping an hour slot to create an event (just a title + time). The original PalmOS Date Book's hour-slot tap-to-create is the whole UX — nail that one interaction and it feels like a real app. No need for repeating events or alarms to start.~~

### ~~12. Memo Pad (text editor)~~ (Done)

~~**File:** new `MemoPadApp.tsx`
A list of memos, tap one to open a full-screen text area. New/Delete. Save to `localStorage`. This was probably the most personal app on any Palm — people kept everything in Memo Pad. ~150 lines.~~

### ~~13. Address Book (contacts list)~~ (Done)

~~**File:** new `AddressApp.tsx`
The hardware button already routes to `address`. A scrollable list of contacts with a name + phone/email detail view is ~200 lines. Even a read-only set of fake pre-loaded contacts (like the Space Trader contacts — Pieter Spronck, etc.) would feel complete.~~

### ~~14. Graffiti area as keyboard trigger~~ (Done)

~~**File:** `PalmFrame.tsx`
The Graffiti area currently does nothing when tapped. On tap, it should open `PalmKeyboard` (which already exists and is used in Space Trader's new game flow) as a system-level input overlay that routes keypresses to the focused app. This is the second-most-visible missing interaction after app animations — the Graffiti area begged to be tapped.~~

### ~~15. Find (silk button → search overlay)~~ (Done)

~~**File:** `PalmDesktop.tsx`
The Find silk button fires an event but nothing handles it. Add a `findOpen` state that renders a system-level search dialog (title: "Find", text input, "OK" / "Cancel" buttons). Search through todos, memos, and contacts. Even just showing "No results" with correct UI chrome closes this gap.~~

### ~~16. HotSync animation~~ (Done)

~~**File:** new `HotSyncApp.tsx`
Tap the HotSync button → full-screen animation of the two-arrows HotSync logo spinning, a progress-style bar, then "HotSync Complete" message. Recharge battery to 100% at the end. Pure theater, but deeply nostalgic for Palm users. ~80 lines + a CSS animation.~~

---

## Tier 3 — Authenticity Polish (low code, high research)

### ~~17. Correct color palette~~ (Done)

~~The current `--palm-bg: #8c927b` (olive green) is close to the Palm IIIc/Vx era screens. The m505's transflective color LCD had a noticeably lighter, slightly warm-grey background. Reference: approximately `#d4cfc0` for the screen background, `#2c2c2c` for text. The navy `#1A1A8C` title bars are accurate. Cross-reference m505 screenshots for exact values.~~

### ~~18. Screen border/bezel glow~~ (Done)

~~The m505 screen had a subtle inner shadow from the bezel transition. A `box-shadow: inset 0 0 8px rgba(0,0,0,0.3)` on `.palm-screen` would add this for free.~~

### ~~19. Tap feedback (ripple on touch)~~ (Done)

~~PalmOS had no tap animation — the stylus tap was registered on release. But in a web simulation, adding a tiny (50ms) CSS ripple at the tap point makes taps feel registered. The AI controller demo already implements a stylus-tap ripple (`AiController.tsx`) — expose that same mechanic for real user taps.~~

### ~~20. Correct hardware button labels~~ (Done)

~~The current hardware button icons use Lucide SVG icons. The real m505 buttons had app-specific icons silkscreened on the device. Using inline SVGs that match the actual m505 button iconography (or even just getting the shape right — the DateBook icon was a small calendar, etc.) would improve the chassis fidelity. Low code, high authenticity.~~ (Icons were already custom SVGs matching the m505 layout.)

---

## Quick Reference: Effort vs. Impact Matrix

| #      | Item                       | Effort           | Impact               |
| ------ | -------------------------- | ---------------- | -------------------- |
| ~~1~~  | ~~Font size typo fix~~     | ~~Trivial~~      | ~~Low-medium~~       |
| ~~4~~  | ~~App switch fade~~        | ~~30 min~~       | ~~**High**~~         |
| ~~6~~  | ~~Authentic font~~         | ~~30 min~~       | ~~**High**~~         |
| ~~3~~  | ~~Live date in Date Book~~ | ~~15 min~~       | ~~Medium~~           |
| ~~2~~  | ~~Wire scroll rocker~~     | ~~30 min~~       | ~~Medium~~           |
| ~~5~~  | ~~Launcher categories~~    | ~~1 hr~~         | ~~Medium~~           |
| ~~7~~  | ~~Calculator app~~         | ~~1 hr~~         | ~~Medium~~           |
| ~~8~~  | ~~Clock app~~              | ~~1 hr~~         | ~~Medium~~           |
| ~~9~~  | ~~Better stub screen~~     | ~~30 min~~       | ~~Medium~~           |
| ~~10~~ | ~~Depleting battery~~      | ~~45 min~~       | ~~Low-medium (fun)~~ |
| ~~17~~ | ~~Correct color palette~~  | ~~30 min~~       | ~~**High**~~         |
| ~~18~~ | ~~Bezel glow~~             | ~~5 min~~        | ~~Medium~~           |
| ~~19~~ | ~~Tap ripple~~             | ~~45 min~~       | ~~Medium~~           |
| ~~11~~ | ~~Interactive Date Book~~  | ~~3 hr~~         | ~~High~~             |
| ~~12~~ | ~~Memo Pad~~               | ~~2 hr~~         | ~~High~~             |
| ~~14~~ | ~~Graffiti → keyboard~~    | ~~2 hr~~         | ~~High~~             |
| ~~16~~ | ~~HotSync animation~~      | ~~1.5 hr~~       | ~~Medium (fun)~~     |
| ~~13~~ | ~~Address Book~~           | ~~3 hr~~         | ~~Medium~~           |
| ~~15~~ | ~~Find dialog~~            | ~~2 hr~~         | ~~Medium~~           |
| ~~20~~ | ~~Hardware button icons~~  | ~~already done~~ | ~~Medium~~           |
