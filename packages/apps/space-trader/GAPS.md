# Space Trader: Feature Gaps & Missing Screens

Sources: GameFAQs FAQ (gamefaqs.gamespot.com/palmos/917550-space-trader/faqs/23321)
Original C source (github.com/videogamepreservation/spacetrader)

---

## Status Key

- ✅ Implemented
- ⚠️ Partial / stub
- ❌ Not implemented

---

## Screens (28 in original)

| Screen                       | Status | Notes                                                                       |
| ---------------------------- | ------ | --------------------------------------------------------------------------- |
| NewCommanderForm             | ✅     | Name, difficulty, skill allocation                                          |
| MainForm / BuyCargoForm      | ✅     | Buy/sell/price list tabs                                                    |
| SellCargoForm                | ✅     | Part of MainTradeView                                                       |
| SystemInformationForm        | ✅     | SystemInfoView                                                              |
| WarpForm (Short Range Chart) | ✅     | GalacticChartView with target/prices sub-screens                            |
| GalacticChartForm            | ✅     | Full map in same view                                                       |
| CommanderStatusForm          | ⚠️     | ShipInfoView — missing kill counts, net worth, links to Quests/SpecialCargo |
| CurrentShipForm              | ⚠️     | Part of ShipInfoView — missing separate escape pod status section           |
| ShipYardForm                 | ⚠️     | Missing **fuel purchase** and **escape pod** buy; has repair and buy ship   |
| BuyShipForm                  | ✅     | Part of ShipYardView                                                        |
| ShiptypeInfoForm             | ❌     | Detailed ship spec popup                                                    |
| BuyEquipmentForm             | ✅     | EquipmentView — weapons/shields/gadgets/escape pod                          |
| **SellEquipmentForm**        | ❌     | No way to sell installed equipment                                          |
| **DumpCargoForm**            | ❌     | No way to jettison unwanted cargo                                           |
| **PlunderForm**              | ❌     | Post-combat loot screen                                                     |
| EncounterForm                | ⚠️     | Modal exists but combat is stub (hardcoded damage values)                   |
| **PersonnelRosterForm**      | ❌     | Mercenary hire/fire; daily salaries; best-of-crew skill                     |
| **BankForm**                 | ❌     | Loans (max 25,000 cr), interest, insurance, no-claim discount               |
| QuestsForm                   | ❌     | Active quest list                                                           |
| SpecialCargoForm             | ❌     | Tribbles, artifact, antidote, reactor status                                |
| SpecialEventForm             | ❌     | Quest narrative + Accept/Decline                                            |
| NewspaperForm                | ❌     | Dynamic headlines (reputation, quests, politics)                            |
| **RetireForm**               | ❌     | Voluntary retirement end state                                              |
| **UtopiaForm**               | ❌     | Victory — bought the moon                                                   |
| DestroyedForm                | ✅     | GameOverView                                                                |
| AveragePricesForm            | ✅     | Sub-screen in GalacticChartView                                             |
| ExecuteWarpForm              | ✅     | Integrated into travelTo()                                                  |

---

## Game Mechanics

### Combat (EncounterForm) — ⚠️ Stub

- **Attack**: currently hardcodes 20 damage to player. Should use `executeAttack()` with NPC ship.
- **Flee**: currently 50% chance of 10 damage. Should use pilot skill vs NPC pilot skill.
- **Submit to pirates**: no cargo stolen. Should take NPC cargo bay capacity worth of goods.
- **Submit/Inspect by police**: no contraband check. Should fine/arrest for narcotics/firearms.
- **Bribe police**: not available. Cost = player worth × bribe level / 7.
- **NPC ships**: no NPC ship generated; damage/outcome is arbitrary.
- **Kill counter**: not tracked (reputation doesn't update on NPC death).
- **Trader encounters**: no buy/sell in space option.
- **Famous Captains** (Ahab, Conrad, Huie): not implemented.
- **Special ships** (Space Monster, Dragonfly, Scarab, Mantis): not implemented.

### Financial System — ⚠️ Partial

- **Debt interest**: ❌ Not applied on warp. Original: `ceil(debt × 10%)` per warp.
- **Bank loans**: ❌ No BankForm. Max 25,000 cr (clean) / 500 cr (criminal).
- **Insurance**: ❌ Requires escape pod; daily fee; up to 90% no-claim discount.
- **Fuel cost**: ❌ ShipYard has no fuel purchase UI (only repair + buy ship).

### Equipment — ⚠️ Partial

- **Sell equipment**: ❌ No way to sell installed weapons/shields/gadgets.
- **Dump cargo**: ❌ No jettison option. Cost = 5 cr × (difficulty+1) per unit.
- **Gadget skill bonuses**: ❌ Not wired. Auto-Repair → +Engineer, Navigating/Cloaking → +Pilot, Targeting → +Fighter.
- **Escape pod in Shipyard**: ⚠️ Available in Equipment view (correct) but original also sold at Shipyard.
- **Price in original**: 2,000 cr (we have 5,000 cr).

### Travel / Warp — ⚠️ Partial

- **Wormhole travel**: ❌ Shuffled correctly but no travel action or UI option.
- **Auto-fuel on arrival**: ❌ Not in travelTo(). Original refuels if credits available.
- **Auto-repair on arrival**: ❌ Not in travelTo(). Original repairs if credits available.
- **Mercenary salary deduction**: ❌ No mercenaries.
- **Tribble dynamics**: ❌ No tribbles.

### Skills — ⚠️ Partial

- **Gadget bonuses to skills**: ❌ Auto-Repair (+Engineer), Navigating/Cloaking (+Pilot), Targeting (+Fighter) not applied.
- **Best-of-crew skill**: ❌ Crew max not computed (only own skills used).
- **Skill improvement events**: ❌ No random bottles/famous captain events.

### Police/Record System — ⚠️ Partial

- **Contraband detection**: ❌ Police inspect but never find illegal goods.
- **Arrest**: ❌ No arrest mechanic (cargo confiscated, fine, record penalty).
- **Record gates**: ❌ Criminal record doesn't restrict loans, quests, or certain events.
- **Reputation on kills**: ❌ Killing pirates doesn't increase reputation score.

### Quest System — ❌ Not implemented

39 special events across 14 quest chains:

- Morgan's Reactor (GETREACTOR → REACTORDELIVERED → GETSPECIALLASER)
- Scarab (SCARAB → SCARABDESTROYED → GETHULLUPGRADED)
- Dragonfly chain (5 steps → INSTALLLIGHTNINGSHIELD)
- Gemulon Invasion (time-sensitive → GETFUELCOMPACTOR)
- Alien Artifact (ALIENARTIFACT → ARTIFACTDELIVERY)
- Space Monster (SPACEMONSTER → MONSTERKILLED)
- Moon retirement (MOONFORSALE × 4 → MOONBOUGHT → UtopiaForm win)
- Japori Disease (JAPORIDISEASE → MEDICINEDELIVERY → +2 skills)
- Ambassador Jarek, Jonathan Wild, Experiment
- Famous Captains (skill trades)
- One-off events: skill bottles, record erasure, cargo for sale, tribble

### Mercenaries — ❌ Not implemented

- 31 named crew members placed on random systems
- Hire/fire from PersonnelRosterForm
- Best-of-crew skill selection
- Daily salary (40–95 cr) deducted before each warp

### Tribbles — ❌ Not implemented

- Acquired via special event
- Breed each warp; consume food cargo; die from narcotics
- 3 systems will buy them

### Win Condition — ❌ Not implemented

- Net worth ≥ 400,000 cr unlocks 4 Moon-for-sale systems
- Pay 500,000 cr → UtopiaForm victory screen

---

## Implementation Priority

| Feature                                                        | Priority     | Effort    |
| -------------------------------------------------------------- | ------------ | --------- |
| **Full encounter combat** (NPC ship, Attack/Flee/Submit/Bribe) | **Critical** | High      |
| **Debt interest on warp**                                      | **High**     | Low       |
| **Fuel purchase in Shipyard**                                  | **High**     | Low       |
| **Sell equipment**                                             | **High**     | Medium    |
| **Dump cargo**                                                 | High         | Low       |
| **Gadget skill bonuses**                                       | High         | Low       |
| **Reputation updates on combat**                               | High         | Low       |
| Bank / loans                                                   | Medium       | Medium    |
| Wormhole travel                                                | Medium       | Medium    |
| Contraband arrest flow                                         | Medium       | Medium    |
| Sell equipment value (trade-in %)                              | Medium       | Low       |
| Auto-fuel/repair on arrival                                    | Medium       | Low       |
| Mercenaries                                                    | Low          | High      |
| Quest system                                                   | Low          | Very High |
| Tribbles                                                       | Low          | Medium    |
| Win condition / Moon                                           | Low          | Medium    |
| Newspaper                                                      | Low          | Medium    |
