# Ship Sprite Rendering - Original PalmOS Space Trader

Research notes on how ships are drawn, colored, and damaged in the original PalmOS Space Trader source code (`https://github.com/videogamepreservation/spacetrader/tree/master/Src`).

## Bitmap System - Four Variants Per Ship Type

Each ship type has up to **4 bitmap variants** loaded from PalmOS bitmap family resources:

| Array                             | Purpose                            | Resource Base ID                                    |
| --------------------------------- | ---------------------------------- | --------------------------------------------------- |
| `ShipBmpPtr[type]`                | Normal/intact ship                 | `FleaBitmapFamily (2200) + type*400`                |
| `DamagedShipBmpPtr[type]`         | Damaged ship (hull damage visible) | `FleaDamagedBitmapFamily (2300) + type*400`         |
| `ShieldedShipBmpPtr[type]`        | Ship with active shields           | `FireflyShieldedBitmapFamily (3200) + (type-2)*400` |
| `DamagedShieldedShipBmpPtr[type]` | Damaged + shielded                 | `FireflyShDamBitmapFamily (3300) + (type-2)*400`    |

Ships with `ShieldSlots <= 0` (Flea, Gnat, Space Monster, Scarab, Bottle) reuse the normal/damaged bitmaps for shielded variants. Only ships with shield slots (Firefly and above) get distinct shielded bitmaps.

## Ship Type Indices (15 total: MAXSHIPTYPE=10 + EXTRASHIPS=5)

| Index | Ship          | ShieldSlots | Has distinct shield bitmaps? |
| ----- | ------------- | ----------- | ---------------------------- |
| 0     | Flea          | 0           | No                           |
| 1     | Gnat          | 0           | No                           |
| 2     | Firefly       | 1           | Yes                          |
| 3     | Mosquito      | 1           | Yes                          |
| 4     | Bumblebee     | 2           | Yes                          |
| 5     | Beetle        | 1           | Yes                          |
| 6     | Hornet        | 2           | Yes                          |
| 7     | Grasshopper   | 2           | Yes                          |
| 8     | Termite       | 3           | Yes                          |
| 9     | Wasp          | 2           | Yes                          |
| 10    | Space Monster | 0           | No                           |
| 11    | Dragonfly     | 3           | Yes                          |
| 12    | Mantis        | 1           | Yes                          |
| 13    | Scarab        | 0           | No                           |
| 14    | Bottle        | 0           | No                           |

## Color System

Three build variants existed:

- `BW.h`: 1-bit black and white
- `Gray.h`: 4-bit grayscale (16 shades)
- `Color.h`: 8-bit color (256 colors)

**All coloring was baked into the bitmap resources** (`.rsrc` files: `Merchant.rsrc`, `MerchantBW.rsrc`, `MerchantColor.rsrc`, `MerchantGray.rsrc`). There are no programmatic color constants in the C code. PalmOS automatically selected the correct bitmap density/depth from the family based on screen mode.

## Damage Rendering - Three-Region Horizontal Clipping (ShowShip in Encounter.c)

The original uses a **three-region horizontal clipping** system (left-to-right), NOT vertical:

### Step 1: Calculate two x-coordinate thresholds

```c
// startdamage: pixel x where damage begins (sweeps right-to-left as hull decreases)
startdamage = x + GetBitmapWidth(ShipBmpPtr[Sh->Type]) -
    ((Sh->Hull * GetBitmapWidth(ShipBmpPtr[Sh->Type])) / HullStrength);

// startshield: pixel x where shield begins (sweeps right-to-left as shields deplete)
startshield = x2 + GetBitmapWidth(ShieldedShipBmpPtr[Sh->Type]) -
    (TotalShieldStrength(Sh) * GetBitmapWidth(ShieldedShipBmpPtr[Sh->Type])) /
    TotalShields(Sh));
```

At full hull/shields, the threshold is at the right edge (no damage visible). As damage increases, the threshold moves leftward, revealing more of the damaged bitmap.

### Step 2: Composite three clipped horizontal regions

```c
// REGION 1 (leftmost): Worst state - damaged, no shield
WinSetClip(x2 to min(startdamage, startshield));
WinDrawBitmap(DamagedShipBmpPtr[type]);

// REGION 2 (middle): Intermediate state
WinSetClip(min threshold to max threshold);
if (startdamage < startshield)
    WinDrawBitmap(ShipBmpPtr[type]);               // Intact, unshielded
else
    WinDrawBitmap(DamagedShieldedShipBmpPtr[type]); // Damaged, shielded

// REGION 3 (rightmost): Best state - intact + shielded
WinSetClip(max threshold to right edge);
WinDrawBitmap(ShieldedShipBmpPtr[type]);
```

**Key insight: Damage sweeps LEFT-TO-RIGHT horizontally, not top-to-bottom.** The ship is a horizontal composite of up to 3 different bitmaps clipped together.

## Ship Centering

Ships are centered in a 64x52 rendering region at y=18:

```c
x = offset + ((64 - GetBitmapWidth(ShipBmpPtr[type])) >> 1);
y = 18 + ((52 - GetBitmapHeight(ShipBmpPtr[type])) >> 1);
```

- Player ship offset: 6
- Opponent ship offset: 80

## Encounter Type Icons

Small icons drawn at position (143, 13) to identify the opponent type:

| Index | Icon           | Condition                         |
| ----- | -------------- | --------------------------------- |
| 0     | Pirate         | Pirate encounter (non-Mantis)     |
| 1     | Police         | Police encounter                  |
| 2     | Trader         | Trader encounter                  |
| 3     | Alien (Mantis) | Mantis ship type                  |
| 4     | Special        | Captain Huie, Marie Celeste, etc. |

## Current Implementation vs Original

### What our SVG sprites have

- Outline-only pixel art (all `fill="#000000"`, 1x1 rects)
- SVG morphological close filter to flood-fill interior
- Two-tone coloring: one fill color + one outline color
- Faction-based colors: player=blue, npc=green, damage=red
- **Vertical** clip-based damage (CSS `clipPath: inset(...)`, top-to-bottom)

### What the original had

- Multi-color bitmap resources with per-pixel coloring baked in
- 4 separate bitmaps per ship (normal, damaged, shielded, damaged+shielded)
- Ship-type-specific colors (each ship has its own palette, not faction-based)
- **Horizontal** clip-based damage (left-to-right via `WinSetClip`)
- 3-region compositing of different bitmaps

### Gaps to close

1. ~~**Damage direction**: Change from vertical (top-to-bottom) to horizontal (left-to-right)~~ **FIXED**
2. ~~**Ship colors**: Change from faction-based to ship-type-specific colors~~ **FIXED**
3. ~~**Interior pixels**: SVGs only have outlines; originals had multi-color filled bitmaps~~ **FIXED** — generated multi-color sprites with flood-filled interiors and 4-zone gradient coloring
4. ~~**Shield rendering**: Original had separate shielded bitmaps; we have no shield visual~~ **FIXED** — 3-region compositing with gold outline for shielded portion
5. **Damaged bitmap**: Original had a separate damaged bitmap variant; we recolor red — close approximation, would need per-pixel redraw for exact match

## Changes Made

### Fix 1: Horizontal damage clipping (matches original `WinSetClip`)

- **Before**: Damage clipped vertically (top-to-bottom via `inset(0 0 X% 0)`)
- **After**: Damage clipped horizontally (left-to-right via `inset(0 0 0 X%)`)
- Right side = intact (best state), left side = damaged (worst state)
- Matches original PalmOS `ShowShip()` in `Encounter.c` which sweeps `startdamage` from right to left
- File: `src/components/views/EncounterModal.tsx` — `ColoredShip` component

### Fix 2: Per-ship-type colors (replaces faction-based coloring)

- **Before**: 3 faction filters: `ship-fill-player` (blue), `ship-fill-npc` (green), `ship-fill-damage` (red)
- **After**: 10 ship-type filters (`ship-type-0` through `ship-type-9`) + 1 damage filter (`ship-damage`)
- Each ship type has its own fill + outline colors derived from reference screenshots:
  - Flea: light blue (#88aadd / #2244aa)
  - Gnat: green (#77bb77 / #226622)
  - Firefly: gold (#ddaa44 / #885500)
  - Mosquito: orange (#cc7744 / #773311)
  - Bumblebee: yellow (#ddcc44 / #887700)
  - Beetle: teal (#55aa77 / #226644)
  - Hornet: blue (#5577cc / #1a1a6c)
  - Grasshopper: olive-green (#77aa55 / #335522)
  - Termite: brown (#aa8866 / #664422)
  - Wasp: sage (#99aa77 / #556633)
- Removed `filterId` prop from `ColoredShip`; filter is now auto-selected from `spriteIndex`
- File: `src/components/views/EncounterModal.tsx` — `SHIP_COLORS`, `ShipFilterDefs`, `ColoredShip`

### Fix 3: Shield rendering (3-region horizontal compositing)

- **Before**: No shield visual at all
- **After**: Full 3-region horizontal compositing matching original PalmOS `ShowShip()`:
  - Region 1 (leftmost): damaged, no shield — red recolor
  - Region 2 (middle): intact no-shield OR damaged shielded (depending on which threshold is further left)
  - Region 3 (rightmost): intact + shielded — gold/yellow outline (#ccaa00)
- Added `shieldedColors()` helper + `ship-shield-{N}` filter variants for each ship type
- Added `shieldRatio` prop to `ColoredShip` (calculated from `getTotalShieldStrength() / maxShields`)
- Shield portion sweeps right-to-left as shields deplete, matching original `startshield` calculation
- File: `src/components/views/EncounterModal.tsx` — `ShipFilterDefs`, `ColoredShip`, shield ratio calc

### Fix 4: Multi-color interior pixels (replaces morphological close filter)

- **Before**: SVG sprites contained only black outline pixels (`<g fill="#000000">`). A morphological close SVG filter approximated interior fill at render time with a single flat color.
- **After**: Interior pixels generated programmatically via flood-fill and baked into `ShipSprites.tsx` with 4 color zones per ship:
  - **Accent** (cockpit/front-center): lightest, brightest shade
  - **Highlight** (top third): lighter shade
  - **Body** (middle third): main ship color
  - **Shadow** (bottom third): darker shade
- Each SVG now has multiple `<g>` groups (body, highlight, shadow, accent fills behind, black outline on top)
- Removed per-ship-type morphological close filters from `ShipFilterDefs` — normal rendering uses baked-in colors directly with no filter
- Simplified to just 2 filters: `ship-damage` (red SourceAlpha recolor) and `ship-shield` (gold drop-shadow glow)
- `ShipInformationView` also benefits — ships now render in color instead of black outlines
- Generation script: `scripts/generate-colored-sprites.js`
- File: `src/assets/ships/ShipSprites.tsx`, `src/components/views/EncounterModal.tsx`

## Reference Images

Located in `docs/images/reference/`:

- `ScrPirateColor.gif` - Pirate encounter showing hornet with blue/navy coloring
- `ScrPoliceColor.gif` - Police encounter showing wasp with gray/olive/yellow coloring
- `ScrStartColor.gif` - Starting screen with colored ship

## Source Files Referenced

- `Src/Merchant.c` - Bitmap resource loading in `MerchantPilotMain()`
- `Src/Encounter.c` - `ShowShip()`, `DrawEncounterForm()`, `EncounterDisplayShips()`
- `Src/Global.c` - Bitmap handle/pointer arrays, `Shiptype[]` array
- `Rsc/MerchantGraphics.h` - Bitmap family resource ID constants
- `Src/spacetrader.h` - Ship type indices, encounter type macros
