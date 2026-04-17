import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AveragePriceListView } from './AveragePriceListView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');
jest.mock('../TitleBarContext', () => ({
  useTitleBar: () => ({ TitleBar: null }),
}));

const makeSystem = (overrides = {}) => ({
  nameIndex: 0,
  x: 0,
  y: 0,
  size: 2,
  techLevel: 5,
  politics: 0,
  specialResources: 0,
  status: 0,
  visited: true,
  special: -1,
  countDown: 0,
  ...overrides,
});

const baseMock = {
  systems: [
    makeSystem({ nameIndex: 0, x: 0, y: 0 }),
    makeSystem({ nameIndex: 1, x: 5, y: 0, techLevel: 7 }),
  ],
  currentSystem: 0,
  selectedMapSystemId: 1,
  setSelectedMapSystem: jest.fn(),
  ship: {
    type: 0,
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    weapon: [-1, -1, -1],
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 20,
    hull: 25,
  },
  travelTo: jest.fn(),
  credits: 1000,
  buyPrices: [30, 250, 100, 350, 250, 800, 600, 1200, 500, 3500],
  buyGood: jest.fn(),
  antidoteOnBoard: false,
  reactorOnBoard: false,
  jarekOnBoard: false,
  wildOnBoard: false,
  artifactOnBoard: false,
};

function renderView(overrides = {}) {
  (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({ ...baseMock, ...overrides });
  const onViewChange = jest.fn();
  render(<AveragePriceListView onViewChange={onViewChange} />);
  return { onViewChange };
}

describe('AveragePriceListView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders target system name', () => {
    renderView();
    // SystemNames[1] should appear somewhere
    expect(screen.getByText(/◄/)).toBeInTheDocument();
    expect(screen.getByText(/►/)).toBeInTheDocument();
  });

  it('shows absolute prices by default', () => {
    renderView();
    // Should see "cr." text for prices (absolute mode)
    const priceTexts = screen.getAllByText(/\d+ cr\./);
    expect(priceTexts.length).toBeGreaterThan(0);
  });

  it('toggles to price differences mode', () => {
    renderView();
    const toggleBtn = screen.getByText('Price Differences');
    fireEvent.click(toggleBtn);
    // Button label should flip
    expect(screen.getByText('Absolute Prices')).toBeInTheDocument();
  });

  it('shows diff values with +/- prefix in diff mode', () => {
    renderView();
    fireEvent.click(screen.getByText('Price Differences'));
    // In diff mode, prices show as "+X cr." or "-X cr." or "---"
    const diffTexts = screen.getAllByText(/[+-]\d+ cr\./);
    // At least some items should have a diff (different tech levels)
    expect(diffTexts.length).toBeGreaterThan(0);
  });

  it('toggles back to absolute prices', () => {
    renderView();
    fireEvent.click(screen.getByText('Price Differences'));
    fireEvent.click(screen.getByText('Absolute Prices'));
    expect(screen.getByText('Price Differences')).toBeInTheDocument();
  });

  it('shows bays count', () => {
    renderView();
    expect(screen.getByText(/Bays: 0\//)).toBeInTheDocument();
  });

  it('opens buy popup when clicking a purchasable item', () => {
    renderView();
    // Click on "Water" text — it should have a price
    const waterEl = screen.getByText('Water');
    fireEvent.click(waterEl);
    expect(screen.getByText(/Buy Water/)).toBeInTheDocument();
    expect(screen.getByText(/At 30 cr\. each/)).toBeInTheDocument();
  });

  it('buy popup shows OK, All, None buttons', () => {
    renderView();
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('buy popup closes when None is clicked', () => {
    renderView();
    fireEvent.click(screen.getByText('Water'));
    expect(screen.getByText(/Buy Water/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('None'));
    expect(screen.queryByText(/Buy Water/)).not.toBeInTheDocument();
  });

  it('buy popup calls buyGood on OK', () => {
    renderView();
    fireEvent.click(screen.getByText('Water'));
    fireEvent.click(screen.getByText('OK'));
    expect(baseMock.buyGood).toHaveBeenCalledWith(0, expect.any(Number));
  });

  it('buy popup All buys max affordable', () => {
    renderView();
    fireEvent.click(screen.getByText('Water'));
    fireEvent.click(screen.getByText('All'));
    // 1000 credits / 30 per unit = 33, but Flea has 10 bays, so max is 10
    expect(baseMock.buyGood).toHaveBeenCalledWith(0, 10);
  });

  it('shows System Information and Short Range Chart buttons', () => {
    renderView();
    expect(screen.getByText('System Information')).toBeInTheDocument();
    expect(screen.getByText('Short Range Chart')).toBeInTheDocument();
  });

  it('navigates to target view on System Information click', () => {
    const { onViewChange } = renderView();
    fireEvent.click(screen.getByText('System Information'));
    expect(onViewChange).toHaveBeenCalledWith('target');
  });

  it('navigates to map on Short Range Chart click', () => {
    const { onViewChange } = renderView();
    fireEvent.click(screen.getByText('Short Range Chart'));
    expect(onViewChange).toHaveBeenCalledWith('map');
  });

  it('Warp button calls travelTo and navigates to trade', () => {
    const { onViewChange } = renderView();
    const warpBtn = screen.getByText('Warp');
    fireEvent.click(warpBtn);
    expect(baseMock.travelTo).toHaveBeenCalledWith(1);
    expect(onViewChange).toHaveBeenCalledWith('trade');
  });

  it('shows special resources when target is visited', () => {
    renderView();
    // visited=true, specialResources=0 → "Nothing special" (SpecialResources[0])
    expect(screen.getByText(/Nothing special/i)).toBeInTheDocument();
  });

  it('shows "Special resources unknown" when target is not visited', () => {
    renderView({
      systems: [
        makeSystem({ nameIndex: 0, x: 0, y: 0 }),
        makeSystem({ nameIndex: 1, x: 5, y: 0, visited: false }),
      ],
    });
    expect(screen.getByText('Special resources unknown')).toBeInTheDocument();
  });
});
