const ShipTypes = [
  { id: 0, fuelTanks: 20, costOfFuel: 1 },
  { id: 1, fuelTanks: 14, costOfFuel: 2 },
];

function test(ship, credits) {
  const shipType = ShipTypes[ship.type];
  const fuelNeeded = shipType.fuelTanks - ship.fuel;
  const fuelCost = fuelNeeded * shipType.costOfFuel;

  console.log(
    `Ship Fuel: ${ship.fuel}/${shipType.fuelTanks}, Credits: ${credits}, Needed: ${fuelNeeded}, Cost: ${fuelCost}`,
  );

  if (ship.fuel < shipType.fuelTanks / 2 && credits > fuelCost) {
    return true;
  }
  return false;
}

console.log('Test 1 (Full):', test({ type: 1, fuel: 14 }, 1000));
console.log('Test 2 (Low):', test({ type: 1, fuel: 5 }, 1000));
console.log('Test 3 (Edge):', test({ type: 1, fuel: 7 }, 1000));
console.log('Test 4 (Affordability):', test({ type: 1, fuel: 5 }, 5));
