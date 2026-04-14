import {
  TradeItem,
  TradeItems,
  PoliticalSystems,
  SolarSystem,
  NARCOTICS,
  FIREARMS,
  ROBOTS,
} from './DataTypes';

// Max Skill in Spacer Trader is 10
const MAXSKILL = 10;
const DUBIOUSSCORE = -5; // Depending on PoliceRecord, criminals pay more (matches original spacetrader.h)

const getRandom = (max: number) => Math.floor(Math.random() * max);

/**
 * Calculates the standard base price of a good in a specific system
 */
export function getStandardPrice(
  item: TradeItem,
  size: number,
  techLevel: number,
  politicsId: number,
  specialResources: number,
): number {
  const pol = PoliticalSystems[politicsId];

  // Illegal goods in this system
  if (item.id === NARCOTICS && !pol.drugsOk) return 0;
  if (item.id === FIREARMS && !pol.firearmsOk) return 0;

  // Base price based on tech level
  let price = item.priceLowTech + techLevel * item.priceInc;

  // High demand increases price
  if (pol.wanted === item.id) {
    price = Math.floor((price * 4) / 3);
  }

  // Traders activity decreases price
  price = Math.floor((price * (100 - 2 * pol.strengthTraders)) / 100);

  // Large system size = high production decreases price
  price = Math.floor((price * (100 - size)) / 100);

  // Special resources adaptation
  if (specialResources > 0) {
    if (specialResources === item.cheapResource) {
      price = Math.floor((price * 3) / 4);
    }
    if (specialResources === item.expensiveResource) {
      price = Math.floor((price * 4) / 3);
    }
  }

  // If a system can't use something, selling price is 0
  if (techLevel < item.techUsage) return 0;

  return price < 0 ? 0 : price;
}

/**
 * Initializes the quantity of goods available in a system based on its characteristics (from InitializeTradeitems)
 */
export function generateSystemQuantities(system: SolarSystem, difficulty: number): number[] {
  const qty = new Array(10).fill(0);
  const pol = PoliticalSystems[system.politics];

  for (const item of TradeItems) {
    if (item.id === NARCOTICS && !pol.drugsOk) continue;
    if (item.id === FIREARMS && !pol.firearmsOk) continue;
    if (system.techLevel < item.techProduction) continue;

    let q =
      (9 + getRandom(5) - Math.abs(item.techTopProduction - system.techLevel)) * (1 + system.size);

    if (item.id === ROBOTS || item.id === NARCOTICS) {
      q = Math.floor((q * (5 - difficulty)) / (6 - difficulty)) + 1;
    }

    if (system.specialResources === item.cheapResource) {
      q = Math.floor((q * 4) / 3);
    }

    if (system.specialResources === item.expensiveResource) {
      q = Math.floor((q * 3) / 4);
    }

    if (system.status === item.doublePriceStatus) {
      q = Math.floor(q / 5);
    }

    q = q - getRandom(10) + getRandom(10);
    qty[item.id] = q < 0 ? 0 : q;
  }

  return qty;
}

/**
 * Determines exact buy and sell prices in a system
 */
export function determineSystemPrices(
  system: SolarSystem,
  traderSkill: number,
  policeRecordScore: number,
): { buyPrices: number[]; sellPrices: number[] } {
  const buyPrices = new Array(10).fill(0);
  const sellPrices = new Array(10).fill(0);

  for (const item of TradeItems) {
    let price = getStandardPrice(
      item,
      system.size,
      system.techLevel,
      system.politics,
      system.specialResources,
    );

    if (price <= 0) continue;

    // Special status adaptations (e.g. at war, drought)
    if (system.status === item.doublePriceStatus) {
      price = Math.floor((price * 3) / 2);
    }

    // Variance
    price = price + getRandom(item.variance) - getRandom(item.variance);

    if (price <= 0) continue;

    sellPrices[item.id] = price;

    // Criminals have to pay an intermediary to sell goods
    if (policeRecordScore < DUBIOUSSCORE) {
      sellPrices[item.id] = Math.floor((sellPrices[item.id] * 90) / 100);
    }

    buyPrices[item.id] = price;
  }

  // Recalculate buy prices based on trader skill
  for (const item of TradeItems) {
    if (buyPrices[item.id] > 0) {
      buyPrices[item.id] = Math.floor(
        (buyPrices[item.id] * (100 + (MAXSKILL - traderSkill))) / 100,
      );
      if (buyPrices[item.id] <= sellPrices[item.id]) {
        buyPrices[item.id] = sellPrices[item.id] + 1;
      }
    }
  }

  return { buyPrices, sellPrices };
}
