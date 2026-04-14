# Space Trader: Original vs Implementation Comparison

Source compared against: https://github.com/videogamepreservation/spacetrader/tree/master/Src

---

## Status Key

- ✅ Fixed
- ❌ Not yet fixed
- ⚠️ Partial / simplified

---

## Critical Bugs

### 1. ✅ Buy price formula — `Merchant.ts`

**Original** (`DeterminePrices` in `Trade.c`):

```c
BuyPrice[i] = (SellPrice[i] * (100 - TraderSkill(&Ship))) / 100
```

At max skill (10): player pays 90% of market price (10% discount).
At skill 0: player pays 100% (no discount — buy at market).

**Was:** base of `103` — player always paid ≥3% over market even at max skill.
**Now:** base of `100` — max skill pays market price, skill 0 pays 10% markup.

---

### 2. ✅ `DUBIOUSSCORE` constant was wrong — `Merchant.ts`

**Original** (`spacetrader.h`): `DUBIOUSSCORE = -5`
**Was:** `const DUBIOUSSCORE = -20` → **Now:** `const DUBIOUSSCORE = -5`

---

## Significant Missing Mechanics

### 3. ✅ Encounters — `useSpaceTraderGame.ts` + `Encounter.ts`

**Original** (`Travel.c`): 21 clicks per warp, each rolling `GetRandom(44 - 2*Difficulty)`.

**Was:** One flat 15% check. **Now:** 21-click loop using `determineEncounter()`. Flea ships encounter at half rate. Pirates can only raid once per trip (`alreadyRaided` flag).

---

### 4. ✅ Starting system is always index 0 — `useSpaceTraderGame.ts`

**Original** (`StartNewGame` in `NewGame.c`): Tries up to 200 random systems, requiring
tech level 1–5 and at least 3 other systems reachable within the starting Gnat's fuel range (14 units).

**Was:** Always started at index 0 (Acamar).
**Now:** Up to 200 random candidates checked; picks first with tech level 1–5 and ≥3 reachable neighbors.

---

### 5. ✅ System quantities — `Merchant.ts` + `useSpaceTraderGame.ts`

**Was:** `generateSystemQuantities()` called fresh on every `travelTo()`.
**Now:** Quantities initialized once at galaxy creation into `SolarSystem.qty`, persisted through buy/sell/travel.

---

### 6. ✅ Police record decay — `useSpaceTraderGame.ts`

**Original** (`DoWarp` in `Travel.c`):

```c
if (Days % 3 == 0)
  if (PoliceRecordScore > CLEANSCORE) --PoliceRecordScore;
if (PoliceRecordScore < DUBIOUSSCORE)
  if (Difficulty <= NORMAL) ++PoliceRecordScore;
```

**Was:** Police record never changed during travel.
**Now:** `travelTo` applies both decay rules. Score drifts toward 0 every 3 days; criminals (score < −5) on Normal/easier slowly rehabilitate.

---

### 7. ✅ Ship trade-in value — `useSpaceTraderGame.ts`

**Original** (`Shipyard.c`): When buying a new ship, the player receives:

- 75% of the old ship's base price
- Minus hull repair cost: `(maxHull - hull) * repairCosts`
- Minus fuel refill cost: `(fuelTanks - fuel) * costOfFuel`
- Plus 2/3 of each equipped weapon, shield, and gadget's price

**Was:** Simply deducted `newType.price`. Old ship surrendered for free.
**Now:** Full trade-in value calculated; only the net cost (`newShipPrice - tradeIn`) is charged. Cargo transfers if it fits in the new ship; equipment stays with the traded vessel.

---

## Moderate Bugs

### 8. ✅ Shield strength used type IDs instead of power values — `Encounter.ts`

**Was:** `ship.shield.reduce(...)` summed type IDs (0, 1) instead of power.
**Now:** `ship.shieldStrength` tracks current health per slot; `executeAttack` depletes it directly. `buyShield` initializes `shieldStrength[slot] = shield.power`. Shields reset to full on each warp.

---

### 9. ✅ Lightning Shield added — `DataTypes.ts`

**Original** (`Global.c`): Three shield types:

| Shield            | Power | Price  | Min Tech |
| ----------------- | ----- | ------ | -------- |
| Energy Shield     | 100   | 5,000  | 5        |
| Reflective Shield | 200   | 20,000 | 6        |
| Lightning Shield  | 350   | 45,000 | 8        |

**Was:** Only Energy and Reflective defined. `MAXSHIELDTYPE = 2`.
**Now:** Lightning Shield (id=2, power=350, price=45,000, techLevel=8) added. `MAXSHIELDTYPE = 3`.

---

### 10. ✅ Escape Pod is now a separate flag — `DataTypes.ts` + `useSpaceTraderGame.ts`

**Original**: `EscapePod` is a separate boolean on `PlayerShip`, not in `Gadget[]`.
Five gadget types (indices 0–4). The escape pod has its own purchase path.

**Was**: Stored as gadget id 5, wasting a gadget slot and exceeding `MAXGADGETTYPE`.
**Now**:

- `PlayerShip.escapePod: boolean` — dedicated field, no gadget slot consumed
- `Gadgets[]` trimmed to 5 entries (ids 0–4); `ESCAPE_POD_PRICE`/`ESCAPE_POD_TECH_LEVEL` exported as constants
- `buyEscapePod()` action added to the store
- `takeDamage`: checks `ship.escapePod`; sets it to `false` on activation (pod consumed)
- `buyShip`: `escapePod` transfers to the new vessel
- Equipment view: escape pod row appears at the bottom of the Gadget tab, disabled when already owned

---

### 11. ✅ Wormholes shuffled — `SystemGenerator.ts`

**Original** (`NewGame.c`):

```c
for (i=0; i<MAXWORMHOLE; ++i) {
  j = GetRandom(MAXWORMHOLE);
  x = Wormhole[i]; Wormhole[i] = Wormhole[j]; Wormhole[j] = x;
}
```

**Was**: Wormholes always connected in original placement order.
**Now**: Fisher-Yates shuffle applied after galaxy placement. Each wormhole system stores its `wormholeDest` index (next in the shuffled ring) on the `SolarSystem` object for use by the galactic chart and future wormhole travel.

---

## Likely Original Bug We Accidentally Fixed

### 12. `InitializeTradeitems` size multiplier — `Merchant.ts`

**Original** (`Trade.c`) uses `SolarSystem[i].Size` where `i` is the _trade item_ loop variable — clearly a bug. Our code uses `system.size` (correct).

---

## Data Values Verified Correct

- All 10 trade items (prices, tech levels, variance, resources, statuses)
- All 10 ship types (cargo, weapons, shields, gadgets, crew, fuel, hull, price, bounty, occurrence, thresholds, repair costs, size)
- All 3 weapons (Pulse Laser 15, Beam Laser 25, Military Laser 35)
- Political systems (all 17 with correct fields)
- Galaxy dimensions: 150×110, MINDISTANCE=6, CLOSEDISTANCE=13, MAXWORMHOLE=6
- `PSYCHOPATHSCORE=-70`, `VILLAINSCORE=-30`, `DUBIOUSSCORE=-5` (now fixed)

---

## Fix Priority

| #   | Issue                              | Status   | Priority     |
| --- | ---------------------------------- | -------- | ------------ |
| 1   | Buy price formula inverted         | ✅ Fixed | **Critical** |
| 3   | Encounters never fire              | ✅ Fixed | **Critical** |
| 8   | Shield strength uses IDs not power | ✅ Fixed | **High**     |
| 5   | System quantities reset each visit | ✅ Fixed | **High**     |
| 2   | DUBIOUSSCORE wrong (-20 vs -5)     | ✅ Fixed | Medium       |
| 6   | No police record decay             | ✅ Fixed | Medium       |
| 7   | No ship trade-in value             | ✅ Fixed | Medium       |
| 9   | Lightning Shield missing           | ✅ Fixed | Medium       |
| 4   | Starting system always index 0     | ✅ Fixed | Medium       |
| 10  | Escape pod as gadget slot          | ✅ Fixed | Low          |
| 11  | Wormholes not shuffled             | ✅ Fixed | Low          |
