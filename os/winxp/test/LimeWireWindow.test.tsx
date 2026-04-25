import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LimeWireWindow } from '../app/components/apps/limewire/LimeWireWindow';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

describe('LimeWireWindow', () => {
  const renderLimeWire = () => {
    return render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider
          registry={[{ id: 'limewire', label: 'LimeWire', icon: '', desktop: false }]}
          initialOpenAppId="limewire"
        >
          <LimeWireWindow />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
  };

  test('renders LimeWire window and performs search', async () => {
    renderLimeWire();
    expect(screen.getByText(/LimeWire: Enabling Open Information Sharing/i)).toBeInTheDocument();

    const artistInput = screen.getAllByRole('textbox')[0]; // First textbox is artist
    fireEvent.change(artistInput, { target: { value: 'Daft Punk' } });

    // Use more specific selector for search button to avoid ambiguity with the Search tab
    const searchBtn = screen.getByRole('button', { name: /^search$/i });
    fireEvent.click(searchBtn);

    expect(screen.getByText(/Searching the network/i)).toBeInTheDocument();

    // Results should appear after timeout (mocked in component)
    await waitFor(
      () => {
        expect(screen.queryByText(/Searching the network/i)).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  test('switching tabs', async () => {
    renderLimeWire();
    const monitorTab = screen.getByText('Monitor');
    const libraryTab = screen.getByText('Library');
    const searchTab = screen.getAllByText('Search')[0]; // The tab label

    fireEvent.click(monitorTab);
    expect(screen.getByText('Status')).toBeInTheDocument(); // Column in monitor

    fireEvent.click(libraryTab);
    expect(screen.getByText(/No songs yet/i)).toBeInTheDocument();

    fireEvent.click(searchTab);
    expect(screen.getByText('Quality')).toBeInTheDocument(); // Column in search
  });

  test('downloading a file', async () => {
    renderLimeWire();

    // Wait for initial search results
    await waitFor(
      () => {
        expect(screen.queryByText(/Searching the network/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Use a more robust way to find results
    const results = await screen.findAllByText(/mp3/i);
    fireEvent.click(results[0]);

    const downloadBtn = screen.getByTitle('Download');
    fireEvent.click(downloadBtn);

    // Should switch to Monitor tab
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Initially it might be "Getting Info..." or "Downloading..."
    await waitFor(
      () => {
        const statusText =
          screen.queryByText(/Getting Info/i) ||
          screen.queryByText(/Downloading/i) ||
          screen.queryByText(/Connecting/i);
        expect(statusText).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
