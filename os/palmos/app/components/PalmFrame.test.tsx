import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PalmFrame } from './PalmFrame';
import { usePalmSounds } from '../hooks/usePalmSounds';

jest.mock('../hooks/usePalmSounds');

const mockSounds = {
  playClick: jest.fn(),
};

describe('PalmFrame Component', () => {
  beforeEach(() => {
    (usePalmSounds as jest.Mock).mockReturnValue(mockSounds);
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <PalmFrame>
        <div data-testid="child">Screen Content</div>
      </PalmFrame>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Screen Content')).toBeInTheDocument();
  });

  it('calls onHomeClick when home silk button is clicked', () => {
    const onHomeClick = jest.fn();
    render(
      <PalmFrame onHomeClick={onHomeClick}>
        <div>Content</div>
      </PalmFrame>,
    );

    const homeBtn = screen.getByTitle('Home');
    fireEvent.click(homeBtn);

    expect(onHomeClick).toHaveBeenCalled();
    expect(mockSounds.playClick).toHaveBeenCalled();
  });

  it('calls onMenuClick when menu silk button is clicked', () => {
    const onMenuClick = jest.fn();
    render(
      <PalmFrame onMenuClick={onMenuClick}>
        <div>Content</div>
      </PalmFrame>,
    );

    const menuBtn = screen.getByTitle('Menu');
    fireEvent.click(menuBtn);

    expect(onMenuClick).toHaveBeenCalled();
    expect(mockSounds.playClick).toHaveBeenCalled();
  });

  it('calls onCalcClick when calc silk button is clicked', () => {
    const onCalcClick = jest.fn();
    render(
      <PalmFrame onCalcClick={onCalcClick}>
        <div>Content</div>
      </PalmFrame>,
    );

    const calcBtn = screen.getByTitle('Calculator');
    fireEvent.click(calcBtn);

    expect(onCalcClick).toHaveBeenCalled();
    expect(mockSounds.playClick).toHaveBeenCalled();
  });

  it('calls onSearchClick when search silk button is clicked', () => {
    const onSearchClick = jest.fn();
    render(
      <PalmFrame onSearchClick={onSearchClick}>
        <div>Content</div>
      </PalmFrame>,
    );

    const searchBtn = screen.getByTitle('Find');
    fireEvent.click(searchBtn);

    expect(onSearchClick).toHaveBeenCalled();
    expect(mockSounds.playClick).toHaveBeenCalled();
  });

  it('calls onAppButtonClick with correct app ID for hardware buttons', () => {
    const onAppButtonClick = jest.fn();
    render(
      <PalmFrame onAppButtonClick={onAppButtonClick}>
        <div>Content</div>
      </PalmFrame>,
    );

    fireEvent.click(screen.getByTitle('Date Book'));
    expect(onAppButtonClick).toHaveBeenCalledWith('datebook');

    fireEvent.click(screen.getByTitle('Address'));
    expect(onAppButtonClick).toHaveBeenCalledWith('address');

    fireEvent.click(screen.getByTitle('To Do List'));
    expect(onAppButtonClick).toHaveBeenCalledWith('todo');

    fireEvent.click(screen.getByTitle('Note Pad'));
    expect(onAppButtonClick).toHaveBeenCalledWith('memo');

    expect(mockSounds.playClick).toHaveBeenCalledTimes(4);
  });

  it('calls onScroll with correct direction for rocker buttons', () => {
    const onScroll = jest.fn();
    render(
      <PalmFrame onScroll={onScroll}>
        <div>Content</div>
      </PalmFrame>,
    );

    // Rocker up
    fireEvent.click(screen.getByTitle('Scroll Up'));
    expect(onScroll).toHaveBeenCalledWith('up');

    // Rocker down
    fireEvent.click(screen.getByTitle('Scroll Down'));
    expect(onScroll).toHaveBeenCalledWith('down');

    expect(mockSounds.playClick).toHaveBeenCalled();
  });
});
