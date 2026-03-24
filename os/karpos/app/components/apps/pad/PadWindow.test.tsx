/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PadWindow } from './PadWindow';
import { PAD_PENDING_KEY, writeFile } from '@/app/virtual-fs';
import { useOsShell, useWindowManager } from '@retro-web/core/context';

jest.mock('@/app/virtual-fs', () => ({
  PAD_PENDING_KEY: 'pad-pending-document',
  writeFile: jest.fn(),
}));

jest.mock('@retro-web/core/context', () => ({
  useOsShell: jest.fn(),
  useWindowManager: jest.fn(),
}));

describe('PadWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();

    (useWindowManager as jest.Mock).mockReturnValue({
      apps: {
        pad: {
          visible: true,
          minimized: false,
          bounds: { left: 40, top: 40, width: 520, height: 560 },
        },
      },
    });

    (useOsShell as jest.Mock).mockReturnValue({
      AppWindow: ({ id, className, titleBar, children }: any) => (
        <section id={id} className={className}>
          {titleBar}
          {children}
        </section>
      ),
      TitleBar: ({ title }: any) => <header>{title}</header>,
    });
  });

  it('loads markdown payload from sessionStorage and renders preview', () => {
    sessionStorage.setItem(
      PAD_PENDING_KEY,
      JSON.stringify({
        filename: 'TODO.md',
        path: '/home/zkarpinski/Desktop/TODO.md',
        content: '# Test Todo\n\n- [ ] First Item',
      }),
    );

    render(<PadWindow />);

    expect(screen.getByRole('heading', { name: 'Test Todo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle First Item')).toBeInTheDocument();
    expect(sessionStorage.getItem(PAD_PENDING_KEY)).toBeNull();
  });

  it('toggles checklist and persists markdown with strike-through source', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      PAD_PENDING_KEY,
      JSON.stringify({
        filename: 'TODO.md',
        path: '/home/zkarpinski/Desktop/TODO.md',
        content: '# Test Todo\n\n- [ ] First Item',
      }),
    );

    render(<PadWindow />);

    await user.click(screen.getByLabelText('Toggle First Item'));

    expect(writeFile).toHaveBeenCalledWith(
      '/home/zkarpinski/Desktop/TODO.md',
      '# Test Todo\n\n- [x] ~~First Item~~',
    );
  });

  it('enters edit mode and saves edited markdown when exiting', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      PAD_PENDING_KEY,
      JSON.stringify({
        filename: 'TODO.md',
        path: '/home/zkarpinski/Desktop/TODO.md',
        content: '# Test Todo\n\n- [ ] First Item',
      }),
    );

    render(<PadWindow />);

    await user.click(screen.getByRole('button', { name: 'Edit markdown' }));
    const editor = screen.getByLabelText('Markdown editor');
    await user.clear(editor);
    await user.type(editor, '# Updated Todo');

    await user.click(screen.getByRole('button', { name: 'Preview markdown' }));

    expect(writeFile).toHaveBeenCalledWith('/home/zkarpinski/Desktop/TODO.md', '# Updated Todo');
    expect(screen.getByRole('heading', { name: 'Updated Todo' })).toBeInTheDocument();
  });
});
