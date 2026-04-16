import { getSpecialCargoBays } from '../store/questSlice';

describe('getSpecialCargoBays', () => {
  it('returns 0 when no special cargo is on board', () => {
    expect(
      getSpecialCargoBays({
        antidoteOnBoard: false,
        reactorOnBoard: false,
        jarekOnBoard: false,
        wildOnBoard: false,
        artifactOnBoard: false,
      }),
    ).toBe(0);
  });

  it('returns 10 for antidote', () => {
    expect(
      getSpecialCargoBays({
        antidoteOnBoard: true,
        reactorOnBoard: false,
        jarekOnBoard: false,
        wildOnBoard: false,
        artifactOnBoard: false,
      }),
    ).toBe(10);
  });

  it('returns 5 for reactor', () => {
    expect(
      getSpecialCargoBays({
        antidoteOnBoard: false,
        reactorOnBoard: true,
        jarekOnBoard: false,
        wildOnBoard: false,
        artifactOnBoard: false,
      }),
    ).toBe(5);
  });

  it('returns 1 each for passengers and artifact', () => {
    expect(
      getSpecialCargoBays({
        antidoteOnBoard: false,
        reactorOnBoard: false,
        jarekOnBoard: true,
        wildOnBoard: false,
        artifactOnBoard: false,
      }),
    ).toBe(1);

    expect(
      getSpecialCargoBays({
        antidoteOnBoard: false,
        reactorOnBoard: false,
        jarekOnBoard: false,
        wildOnBoard: true,
        artifactOnBoard: false,
      }),
    ).toBe(1);

    expect(
      getSpecialCargoBays({
        antidoteOnBoard: false,
        reactorOnBoard: false,
        jarekOnBoard: false,
        wildOnBoard: false,
        artifactOnBoard: true,
      }),
    ).toBe(1);
  });

  it('sums all special cargo correctly', () => {
    expect(
      getSpecialCargoBays({
        antidoteOnBoard: true,
        reactorOnBoard: true,
        jarekOnBoard: true,
        wildOnBoard: true,
        artifactOnBoard: true,
      }),
    ).toBe(18); // 10 + 5 + 1 + 1 + 1
  });
});
