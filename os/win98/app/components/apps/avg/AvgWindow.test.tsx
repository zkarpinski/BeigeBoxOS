/**
 * Unit tests for AVG Free Edition.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AvgWindow, avgAppConfig } from './AvgWindow';
import { Win98TestProviders } from '../../../../test/test-utils';

const registry = [avgAppConfig];

describe('AvgWindow', () => {
  test('renders security status and scan buttons', () => {
    render(
      <Win98TestProviders registry={registry}>
        <AvgWindow />
      </Win98TestProviders>,
    );

    expect(screen.getAllByText(/AVG/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/protected/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete Test/i)).toBeInTheDocument();
  });

  test('renders system status items', () => {
    render(
      <Win98TestProviders registry={registry}>
        <AvgWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByText('Control Center')).toBeInTheDocument();
    expect(screen.getByText('Resident Shield')).toBeInTheDocument();
    expect(screen.getByText('E-mail Scanner')).toBeInTheDocument();
    expect(screen.getByText('Virus Database')).toBeInTheDocument();
  });

  test('renders bottom action buttons', () => {
    render(
      <Win98TestProviders registry={registry}>
        <AvgWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByText('Test Results')).toBeInTheDocument();
    expect(screen.getByText('Scheduler')).toBeInTheDocument();
    expect(screen.getByText('Exit')).toBeInTheDocument();
  });
});
