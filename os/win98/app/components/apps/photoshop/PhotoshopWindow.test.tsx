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

  test('enters virus phase after splash', () => {
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
  });
});
