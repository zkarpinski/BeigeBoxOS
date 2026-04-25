/**
 * Unit tests for ZoneAlarm.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZonealarmWindow, zonealarmAppConfig } from './ZonealarmWindow';
import { Win98TestProviders } from '../../../../test/test-utils';

const registry = [zonealarmAppConfig];

describe('ZonealarmWindow', () => {
  test('renders firewall status and navigation', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ZonealarmWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByText('ZONE')).toBeInTheDocument();
    expect(screen.getByText('LABS')).toBeInTheDocument();
    expect(screen.getByText(/Systems Active/i)).toBeInTheDocument();
  });

  test('renders navigation buttons', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ZonealarmWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Firewall').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Program/i).length).toBeGreaterThan(0);
  });

  test('switches sections', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ZonealarmWindow />
      </Win98TestProviders>,
    );

    fireEvent.click(screen.getByText('Overview'));
    // Find the status text in the overview section specifically
    const firewallStatus = screen.getByText((content, element) => {
      return element?.tagName === 'SPAN' && content.includes('Firewall:');
    });
    expect(firewallStatus).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Firewall')[0]);
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Zones')).toBeInTheDocument();
  });

  test('toggles status when STOP button is clicked', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ZonealarmWindow />
      </Win98TestProviders>,
    );

    const stopBtn = screen.getByText('STOP');
    fireEvent.click(stopBtn);
    expect(screen.getByText(/Stopped/i)).toBeInTheDocument();
    expect(screen.getByText('START')).toBeInTheDocument();
  });
});
