# Space Trader: Original vs Implementation Comparison

Source compared against: https://github.com/videogamepreservation/spacetrader/tree/master/Src

---

## Critical Bugs

### 1. Buy price formula is inverted — `Merchant.ts`

**Original** (`DeterminePrices` in `Trade.c`):

```c
Price = ((SellPrice * (100 - TraderSkill(&Ship))) / 100)
```

Higher trader skill **reduces** what you pay (up to 10% off at skill 10).

**Ours** (`Merchant.ts`):

```ts
buyPrices[item.id] = Math.floor((buyPrices[item.id] * (103 + (MAXSKILL - traderSkill))) / 100);
```

This applies a markup that shrinks with skill — but the player always pays _more_ than the sell price. The formula is inverted; skill should give a discount, not reduce a surcharge.

---

### 2. `DUBIOUSSCORE` constant is wrong — `Merchant.ts`

**Original** (`spacetrader.h`): `DUBIOUSSCORE = -5`
**Ours** (`Merchant.ts`): `const DUBIOUSSCORE = -20`

The threshold at which criminals receive a 10% sell-price penalty is way too permissive. The criminal penalty doesn't kick in until a score of −20 instead of −5.

---

## Significant Missing Mechanics

### 3. Encounters never fire — `useSpaceTraderGame.ts` + `Encounter.ts`

**Original** (`Travel.c`): Sets `Clicks = 21` per warp and loops 21 times, rolling for an encounter on each click using `GetRandom(44 - 2*Difficulty)` compared against strength thresholds.

**Ours**: One flat 15% check per warp. `Encounter.ts`'s `determineEncounter()` function exists but is never called by the travel system. Real encounter rate is far higher than 15% per trip in the original, and multi-encounter trips are impossible in our version.

---

### 4. Starting system is always index 0 — `useSpaceTraderGame.ts`

**Original** (`StartNewGame` in `NewGame.c`): Tries up to 200 random systems, requiring tech level 1–5 and at least 3 other systems reachable within the starting ship's fuel range.

**Ours**:

```ts
const startSystem = 0; // always Acamar
```

The player always starts at Acamar regardless of its tech level or neighbor count.

---

### 5. System quantities reset every visit — `Merchant.ts` + `useSpaceTraderGame.ts`

**Original** (`NewGame.c`): `InitializeTradeitems(i)` is called once per system during galaxy generation. Quantities are stored persistently and only change when the player trades; markets can be depleted.

**Ours**: `generateSystemQuantities()` is called fresh on every `travelTo()`, regenerating quantities each visit. Markets never deplete and the economy has no memory.

---

### 6. No police record decay — `useSpaceTraderGame.ts`

**Original** (`DoWarp` in `Travel.c`):

```c
if (Days % 3 == 0)
  if (PoliceRecordScore > CLEANSCORE) --PoliceRecordScore;
if (PoliceRecordScore < DUBIOUSSCORE)
  if (Difficulty <= NORMAL) ++PoliceRecordScore;
```

Score decays toward clean over time; criminals slowly rehabilitate.

**Ours**: Police record score never changes automatically during travel.

---

### 7. Ship trade-in value missing — `useSpaceTraderGame.ts`

**Original** (`Shipyard.c`): When buying a new ship the player receives:

- 75% of old ship's base price
- Minus repair cost for hull damage
- Minus cost to fill fuel
- Plus 2/3 of equipped weapons, shields, and gadgets

**Ours**: Simply deducts `newType.price` from credits. The old ship is surrendered for free.

---

## Moderate Bugs

### 8. Shield strength sums type IDs, not power values — `Encounter.ts`

**Original**: `ShieldStrength[]` is a separate array tracking current health per slot. Shield power comes from `Shieldtype[Shield[i]].Power`.

**Ours** (`Encounter.ts`):

```ts
return ship.shield.reduce((acc, curr) => (curr >= 0 ? acc + curr : acc), 0);
```

`curr` is a shield type ID (0 = Energy, 1 = Reflective), not its power value (100, 200). A ship with one Energy Shield has effective shield strength of `0`.

---

### 9. Lightning Shield missing — `DataTypes.ts`

**Original** (`Global.c`): Three shield types:
| Shield | Power | Price | Min Tech |
|---|---|---|---|
| Energy Shield | 100 | 5,000 | 2 |
| Reflective Shield | 200 | 20,000 | 6 |
| Lightning Shield | 350 | 45,000 | 8 |

**Ours**: Only Energy and Reflective are defined.

---

### 10. Escape Pod should be a flag, not a gadget slot — `DataTypes.ts` + `useSpaceTraderGame.ts`

**Original**: `EscapePod` is a separate boolean flag in `PlayerShip`, not stored in `Gadget[]`. `MAXGADGETTYPE = 4` (indices 0–4, five gadgets). The escape pod has its own purchase/activation path.

**Ours**: Stored as gadget index 5 in a 6-item array, wasting a gadget slot.

---

### 11. Wormholes not shuffled — `SystemGenerator.ts`

**Original** (`NewGame.c`): After placing systems, wormhole endpoint assignments are randomly shuffled among themselves:

```c
for (i=0; i<MAXWORMHOLE; ++i) {
  j = GetRandom(MAXWORMHOLE);
  x = Wormhole[i]; Wormhole[i] = Wormhole[j]; Wormhole[j] = x;
}
```

**Ours**: Wormholes always connect in original placement order.

---

### 12. Police record score decay missing on travel — `useSpaceTraderGame.ts`

See item #6 above.

---

## Likely Original Bug We Accidentally Fixed

### 13. `InitializeTradeitems` size multiplier — `Merchant.ts`

**Original** (`Trade.c`) uses `SolarSystem[i].Size` where `i` is the _trade item_ loop variable — clearly a bug, it should be the system being initialized. Our code uses `system.size` (correct). We unintentionally fixed an original bug.

---

## Data Values Verified Correct

- All 10 trade items (prices, tech levels, variance, resources, statuses)
- All 10 ship types (cargo, weapons, shields, gadgets, crew, fuel, hull, price, bounty, occurrence, thresholds, repair costs, size)
- All 3 weapons (Pulse Laser 15, Beam Laser 25, Military Laser 35)
- Political systems (all 17 with correct fields)
- Galaxy dimensions: 150×110, MINDISTANCE=6, CLOSEDISTANCE=13, MAXWORMHOLE=6
- `PSYCHOPATHSCORE=-70`, `VILLAINSCORE=-30`

---

## Fix Priority

| #   | Issue                              | Priority     |
| --- | ---------------------------------- | ------------ |
| 1   | Buy price formula inverted         | **Critical** |
| 3   | Encounters never fire              | **Critical** |
| 8   | Shield strength uses IDs not power | **High**     |
| 5   | System quantities reset each visit | **High**     |
| 2   | DUBIOUSSCORE wrong (-20 vs -5)     | Medium       |
| 6   | No police record decay             | Medium       |
| 7   | No ship trade-in value             | Medium       |
| 9   | Lightning Shield missing           | Medium       |
| 4   | Starting system always index 0     | Medium       |
| 10  | Escape pod as gadget slot          | Low          |
| 11  | Wormholes not shuffled             | Low          |
