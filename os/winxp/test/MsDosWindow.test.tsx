import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MsDosWindow } from '../app/components/apps/msdos/MsDosWindow';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

describe('MsDosWindow', () => {
  const mockShowApp = jest.fn();
  const mockHideApp = jest.fn();

  const renderMsDos = () => {
    return render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider
          registry={[{ id: 'msdos', label: 'Command Prompt', icon: '', desktop: false }]}
          initialOpenAppId="msdos"
        >
          <MsDosWindow />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
  };

  test('renders command prompt with initial lines', () => {
    renderMsDos();
    expect(screen.getByText(/Microsoft Windows XP \[Version 5\.1\.2600\]/i)).toBeInTheDocument();
    expect(screen.getByText(/Copyright 1985-2001 Microsoft Corp\./i)).toBeInTheDocument();
  });

  test('executes help command', () => {
    renderMsDos();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(
      screen.getByText(/CD\s+Displays the name of or changes the current directory/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/CLS\s+Clears the screen/i)).toBeInTheDocument();
  });

  test('executes echo command', () => {
    renderMsDos();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'echo hello world' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  test('executes cls command', () => {
    renderMsDos();
    const input = screen.getByRole('textbox');

    // First confirm text is there
    expect(screen.getByText(/Microsoft Windows XP/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'cls' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByText(/Microsoft Windows XP/i)).not.toBeInTheDocument();
  });

  test('executes cd and dir commands', () => {
    renderMsDos();
    const input = screen.getByRole('textbox');

    // Default prompt should contain C:\Documents and Settings\zkarpinski
    expect(screen.getByText(/C:\\Documents and Settings\\zkarpinski>/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'cd ..' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText(/C:\\Documents and Settings>/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'dir' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText(/Directory of C:\\Documents and Settings/i)).toBeInTheDocument();
  });

  test('handles unknown command', () => {
    renderMsDos();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'foobar' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(
      screen.getByText(/'foobar' is not recognized as an internal or external command/i),
    ).toBeInTheDocument();
  });
});
