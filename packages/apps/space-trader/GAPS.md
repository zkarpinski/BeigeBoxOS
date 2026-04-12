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

| Screen                       | Status | Notes                                                                                                              |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| NewCommanderForm             | ✅     | Name, difficulty, skill allocation                                                                                 |
| MainForm / BuyCargoForm      | ✅     | Buy/sell/price list tabs; dump cargo for unsellable goods                                                          |
| SellCargoForm                | ✅     | Part of MainTradeView; includes Dump button for contraband/unsellable                                              |
| SystemInformationForm        | ✅     | SystemInfoView                                                                                                     |
| WarpForm (Short Range Chart) | ✅     | GalacticChartView with target/prices sub-screens                                                                   |
| GalacticChartForm            | ✅     | Full map in same view                                                                                              |
| CommanderStatusForm          | ⚠️     | ShipInfoView — missing kill counts, net worth, links to Quests/SpecialCargo                                        |
| CurrentShipForm              | ⚠️     | Part of ShipInfoView — missing separate escape pod status section                                                  |
| ShipYardForm                 | ✅     | Fuel purchase, repair, buy ship all implemented                                                                    |
| BuyShipForm                  | ✅     | Part of ShipYardView                                                                                               |
| ShiptypeInfoForm             | ❌     | Detailed ship spec popup                                                                                           |
| BuyEquipmentForm             | ✅     | EquipmentView — weapons/shields/gadgets/escape pod                                                                 |
| SellEquipmentForm            | ✅     | "Sell" tab in EquipmentView — 50% refund for installed weapons/shields/gadgets                                     |
| DumpCargoForm                | ✅     | Dump button on sell-tab rows for goods not sold at current system; cost = 5×(diff+1) cr/unit                       |
| PlunderForm                  | ✅     | "Loot" button in EncounterForm after victory; transfers NPC cargo to player hold                                   |
| EncounterForm                | ✅     | Full-screen PalmOS encounter view; NPC ship generation, real combat via executeAttack(), bribe/surrender/flee/loot |
| **PersonnelRosterForm**      | ❌     | Mercenary hire/fire; daily salaries; best-of-crew skill                                                            |
| **BankForm**                 | ❌     | Loans (max 25,000 cr), interest accumulates — debt interest on warp ✅ done                                        |
| QuestsForm                   | ❌     | Active quest list                                                                                                  |
| SpecialCargoForm             | ❌     | Tribbles, artifact, antidote, reactor status                                                                       |
| SpecialEventForm             | ❌     | Quest narrative + Accept/Decline                                                                                   |
| NewspaperForm                | ❌     | Dynamic headlines (reputation, quests, politics)                                                                   |
| **RetireForm**               | ❌     | Voluntary retirement end state                                                                                     |
| **UtopiaForm**               | ❌     | Victory — bought the moon                                                                                          |
| DestroyedForm                | ✅     | GameOverView                                                                                                       |
| AveragePricesForm            | ✅     | Sub-screen in GalacticChartView                                                                                    |
| ExecuteWarpForm              | ✅     | Integrated into travelTo()                                                                                         |

---

## Game Mechanics

### Combat (EncounterForm) — ✅ Implemented

- **NPC ship generation**: `generateNPCEncounter()` picks ship type by occurrence weight, equips weapons/shields based on system tech level, scales NPC skills with difficulty.
- **Attack**: uses `executeAttack()` with gadget-boosted player skills (Targeting +3 fighter, Auto-repair +2 engineer, Nav/Cloaking +3 pilot). NPC counterattacks each round.
- **Flee**: pilot-skill-based flee chance (30–70%); NPC fires at fleeing player on failure.
- **Submit to pirates**: pirates take NPC cargo-bay-capacity worth of goods from player hold.
- **Submit/Inspect by police**: checks for narcotics/firearms; confiscates and levies fine on contraband.
- **Bribe police**: costs 5% × credits × (difficulty+1); skips inspection.
- **Kill/Loot**: bounty credited on NPC destruction; pirate kill +1 reputation; police kill −3 record; Loot button transfers NPC cargo.
- **Escape pod**: activated automatically if hull reaches 0; player survives on Flea with no cargo/equipment.

### Financial System — ⚠️ Partial

- **Debt interest**: ✅ 10% per warp (ceil) applied in travelTo(), matches original DoWarp.
- **Bank loans**: ❌ No BankForm. Max 25,000 cr (clean) / 500 cr (criminal). Debt can still exist via future quest/bank implementation.
- **Insurance**: ❌ Requires escape pod; daily fee; up to 90% no-claim discount.

### Equipment — ✅ Mostly done

- **Sell equipment**: ✅ "Sell" tab in EquipmentView — 50% refund price.
- **Dump cargo**: ✅ Dump button on sell rows for items not bought at current system.
- **Gadget skill bonuses**: ✅ Auto-Repair +2 Engineer, Navigating/Cloaking +3 Pilot, Targeting +3 Fighter — applied in all combat calculations.
- **Gadget skill bonuses in ShipInfoView**: ❌ Effective skills not displayed on Commander Status screen yet.
- **Escape pod price**: ✅ 2,000 cr in original; we use 5,000 cr (intentional design choice, noted).

### Travel / Warp — ⚠️ Partial

- **Wormhole travel**: ❌ Shuffled correctly but no travel action or UI option.
- **Auto-fuel on arrival**: ❌ Not in travelTo(). Original refuels if credits available.
- **Auto-repair on arrival**: ❌ Not in travelTo(). Original repairs if credits available.
- **Mercenary salary deduction**: ❌ No mercenaries.
- **Tribble dynamics**: ❌ No tribbles.

### Skills — ⚠️ Partial

- **Gadget bonuses to skills**: ✅ Applied in combat (Auto-Repair, Navigating, Cloaking, Targeting).
- **Gadget bonuses displayed**: ❌ Commander Status screen shows raw skills, not effective skills.
- **Best-of-crew skill**: ❌ Crew max not computed (only own skills + gadget bonuses used).
- **Skill improvement events**: ❌ No random bottles/famous captain events.

### Police/Record System — ⚠️ Partial

- **Contraband detection**: ✅ Police inspect and find narcotics/firearms; fine player.
- **Record decay**: ✅ Police record decays toward clean over time (every 3 warps).
- **Reputation on kills**: ✅ Pirate kill +1 reputation; police kill −3 record.
- **Arrest**: ❌ No full arrest mechanic (cargo confiscated, fine, record penalty) beyond inspection.
- **Record gates**: ❌ Criminal record doesn't restrict loans, quests, or certain events.

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

| Feature                                                        | Priority     | Effort    | Status  |
| -------------------------------------------------------------- | ------------ | --------- | ------- |
| **Full encounter combat** (NPC ship, Attack/Flee/Submit/Bribe) | **Critical** | High      | ✅ Done |
| **Debt interest on warp**                                      | **High**     | Low       | ✅ Done |
| **Fuel purchase in Shipyard**                                  | **High**     | Low       | ✅ Done |
| **Sell equipment**                                             | **High**     | Medium    | ✅ Done |
| **Dump cargo**                                                 | High         | Low       | ✅ Done |
| **Gadget skill bonuses** (combat)                              | High         | Low       | ✅ Done |
| **Reputation updates on combat**                               | High         | Low       | ✅ Done |
| Display effective skills in Commander Status                   | Medium       | Low       | ❌      |
| Bank / loans UI (BankForm)                                     | Medium       | Medium    | ❌      |
| Wormhole travel                                                | Medium       | Medium    | ❌      |
| Full contraband arrest flow                                    | Medium       | Medium    | ❌      |
| Auto-fuel/repair on arrival                                    | Medium       | Low       | ❌      |
| Mercenaries                                                    | Low          | High      | ❌      |
| Quest system                                                   | Low          | Very High | ❌      |
| Tribbles                                                       | Low          | Medium    | ❌      |
| Win condition / Moon                                           | Low          | Medium    | ❌      |
| Newspaper                                                      | Low          | Medium    | ❌      |
