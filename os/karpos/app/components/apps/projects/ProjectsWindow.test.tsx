/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectsWindow } from './ProjectsWindow';
import { useOsShell, useWindowManager } from '@retro-web/core/context';

jest.mock('@retro-web/core/context', () => ({
  useOsShell: jest.fn(),
  useWindowManager: jest.fn(),
}));

describe('ProjectsWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useWindowManager as jest.Mock).mockReturnValue({
      apps: {
        projects: {
          visible: true,
          minimized: false,
          bounds: { left: 40, top: 40, width: 650, height: 750 },
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

  it('renders projects window with initial preview and section headers', () => {
    render(<ProjectsWindow />);

    expect(screen.getByText('Projects Explorer')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Featured Projects' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Legacy & Experiments' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'codeinsight-sdk-python' })).toBeInTheDocument();
  });

  it('updates preview card when selecting a project pill', async () => {
    const user = userEvent.setup();
    render(<ProjectsWindow />);

    const projectButtons = screen.getAllByRole('button', { name: 'T-Driver' });
    await user.click(projectButtons[0]);

    expect(screen.getByRole('heading', { name: 'T-Driver' })).toBeInTheDocument();
    expect(screen.getByText('2014-2016')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View GitHub Repo' })).toHaveAttribute(
      'href',
      'https://github.com/zKarp/T-Driver',
    );
  });
});
