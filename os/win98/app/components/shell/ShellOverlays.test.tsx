import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShellOverlays } from './ShellOverlays';
import { useWindowManager } from '@retro-web/core/context';

// Mock useWindowManager
jest.mock('@retro-web/core/context', () => ({
  useWindowManager: jest.fn(),
}));

const mockUseWindowManager = useWindowManager as any;

describe('ShellOverlays', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock state
    mockUseWindowManager.mockReturnValue({
      runDialogOpen: false,
      setRunDialogOpen: jest.fn(),
      shutdownOpen: false,
      setShutdownOpen: jest.fn(),
      bsodState: null,
      dialogState: null,
    });
  });

  describe('RunDialog', () => {
    test('renders RunDialog when runDialogOpen is true', () => {
      mockUseWindowManager.mockReturnValue({
        runDialogOpen: true,
        setRunDialogOpen: jest.fn(),
        shutdownOpen: false,
        setShutdownOpen: jest.fn(),
        bsodState: null,
        dialogState: null,
      });

      render(<ShellOverlays />);
      expect(document.getElementById('run-dialog')).toBeInTheDocument();
    });

    test('Run dialog has OK and Cancel buttons and description', () => {
      mockUseWindowManager.mockReturnValue({
        runDialogOpen: true,
        setRunDialogOpen: jest.fn(),
        shutdownOpen: false,
        setShutdownOpen: jest.fn(),
        bsodState: null,
        dialogState: null,
      });

      render(<ShellOverlays />);
      expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByText(/type the name of a program/i)).toBeInTheDocument();
    });

    test('Run dialog close button calls setRunDialogOpen(false)', () => {
      const setRunDialogOpen = jest.fn();
      mockUseWindowManager.mockReturnValue({
        runDialogOpen: true,
        setRunDialogOpen,
        shutdownOpen: false,
        setShutdownOpen: jest.fn(),
        bsodState: null,
        dialogState: null,
      });

      render(<ShellOverlays />);
      const closeBtn = document.querySelector('#run-dialog .run-titlebtn');
      fireEvent.click(closeBtn!);
      expect(setRunDialogOpen).toHaveBeenCalledWith(false);
    });

    test('does not render RunDialog when runDialogOpen is false', () => {
      render(<ShellOverlays />);
      expect(document.getElementById('run-dialog')).not.toBeInTheDocument();
    });
  });

  describe('ShutdownOverlay', () => {
    test('renders ShutdownOverlay when shutdownOpen is true', () => {
      mockUseWindowManager.mockReturnValue({
        runDialogOpen: false,
        setRunDialogOpen: jest.fn(),
        shutdownOpen: true,
        setShutdownOpen: jest.fn(),
        bsodState: null,
        dialogState: null,
      });

      render(<ShellOverlays />);
      expect(document.querySelector('.shutdown-screen')).toBeInTheDocument();
      expect(screen.getByText(/safe to turn off/i)).toBeInTheDocument();
    });

    test('Shutdown overlay click calls setShutdownOpen(false)', () => {
      const setShutdownOpen = jest.fn();
      mockUseWindowManager.mockReturnValue({
        runDialogOpen: false,
        setRunDialogOpen: jest.fn(),
        shutdownOpen: true,
        setShutdownOpen,
        bsodState: null,
        dialogState: null,
      });

      render(<ShellOverlays />);
      fireEvent.click(document.getElementById('shutdown-overlay')!);
      expect(setShutdownOpen).toHaveBeenCalledWith(false);
    });

    test('does not render ShutdownOverlay when shutdownOpen is false', () => {
      render(<ShellOverlays />);
      expect(document.querySelector('.shutdown-screen')).not.toBeInTheDocument();
    });
  });

  describe('DesktopContextMenu', () => {
    test('renders DesktopContextMenu and it can be opened via right click', () => {
      render(<ShellOverlays />);
      // It's mounted but returns null initially because pos is null
      expect(document.getElementById('desktop-context-menu')).not.toBeInTheDocument();

      // Trigger context menu on document body (or any non-excluded area)
      fireEvent.contextMenu(document.body);

      expect(document.getElementById('desktop-context-menu')).toBeInTheDocument();
    });

    test('does not mount DesktopContextMenu when showDesktopContextMenu is false', () => {
      render(<ShellOverlays showDesktopContextMenu={false} />);

      // Trigger context menu
      fireEvent.contextMenu(document.body);

      // Should not be in document because it wasn't even mounted
      expect(document.getElementById('desktop-context-menu')).not.toBeInTheDocument();
    });
  });

  describe('DialogModal', () => {
    test('renders DialogModal when dialogState is present', () => {
      mockUseWindowManager.mockReturnValue({
        runDialogOpen: false,
        setRunDialogOpen: jest.fn(),
        shutdownOpen: false,
        setShutdownOpen: jest.fn(),
        bsodState: null,
        dialogState: {
          type: 'info',
          title: 'Test Dialog',
          message: 'Hello World',
          buttons: ['OK'],
          resolve: jest.fn(),
        },
      });

      render(<ShellOverlays />);
      expect(document.querySelector('.w97dlg-overlay')).toBeInTheDocument();
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('BsodOverlay', () => {
    test('renders BsodOverlay when bsodState is present', () => {
      mockUseWindowManager.mockReturnValue({
        runDialogOpen: false,
        setRunDialogOpen: jest.fn(),
        shutdownOpen: false,
        setShutdownOpen: jest.fn(),
        bsodState: { type: 'bsod', options: { message: 'Test BSOD' } },
        dialogState: null,
      });

      render(<ShellOverlays />);
      expect(document.querySelector('.w97-bsod')).toBeInTheDocument();
      expect(screen.getByText(/Test BSOD/i)).toBeInTheDocument();
    });
  });
});
