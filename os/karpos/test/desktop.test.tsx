/**
 * Unit tests for KarpDesktop.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { KarpDesktop } from '../app/components/karpos-desktop/desktop';

// Mock initFileSystem to avoid side effects
jest.mock('../app/fileSystem', () => ({
  initFileSystem: jest.fn(),
  writeFile: jest.fn(),
  listDir: jest.fn().mockReturnValue([]),
  MY_DOCUMENTS_PATH: '/home/zkarpinski/Documents',
  DESKTOP_PATH: '/home/zkarpinski/Desktop',
}));

describe('KarpDesktop', () => {
  test('renders desktop without crashing', () => {
    render(<KarpDesktop />);
    expect(screen.getByText(/KarpOS/)).toBeInTheDocument();
  });

  test('renders taskbar and desktop icons', () => {
    render(<KarpDesktop />);
    expect(document.getElementById('taskbar')).toBeInTheDocument();
    expect(document.getElementById('desktop-icons')).toBeInTheDocument();
  });

  test('renders apps in the background', () => {
    render(<KarpDesktop />);
    expect(document.querySelector('.seo-intro')).toBeInTheDocument();
  });
});
