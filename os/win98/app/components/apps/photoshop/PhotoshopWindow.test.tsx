/**
 * Unit tests for Photoshop (Virus Edition).
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { PhotoshopWindow, photoshopAppConfig } from './PhotoshopWindow';
import { Win98TestProviders } from '../../../../test/test-utils';

const registry = [photoshopAppConfig];

describe('PhotoshopWindow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders splash screen when first opened', () => {
    render(
      <Win98TestProviders registry={registry} initialOpenAppId="photoshop">
        <PhotoshopWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByText('adobe')).toBeInTheDocument();
    expect(screen.getByText('Photoshop')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  test('cycles splash status messages', () => {
    render(
      <Win98TestProviders registry={registry} initialOpenAppId="photoshop">
        <PhotoshopWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByText('Initializing...')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(screen.getByText('Loading plug-ins...')).toBeInTheDocument();
  });

  test('enters virus phase after splash and escapes HTML in popup titles', () => {
    render(
      <Win98TestProviders registry={registry} initialOpenAppId="photoshop">
        <PhotoshopWindow />
      </Win98TestProviders>,
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText('INSTALLING PHOTOSHOP...')).toBeInTheDocument();
    expect(screen.getByText('💀')).toBeInTheDocument();

    const popupTitles = document.querySelectorAll('.ps5-popup-title span');
    expect(popupTitles.length).toBeGreaterThan(0);
    popupTitles.forEach((titleEl) => {
      expect(titleEl.innerHTML).not.toContain('<script>');
    });
  });

  test('escapes popup title HTML special characters when virus popups spawn', () => {
    render(
      <Win98TestProviders registry={registry} initialOpenAppId="photoshop">
        <PhotoshopWindow />
      </Win98TestProviders>,
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const popups = document.querySelectorAll('.ps5-virus-popup');
    expect(popups.length).toBeGreaterThan(0);
    popups.forEach((popup) => {
      const titleEl = popup.querySelector('.ps5-popup-title span');
      expect(titleEl?.innerHTML).not.toMatch(/<script/i);
    });
  });
});
