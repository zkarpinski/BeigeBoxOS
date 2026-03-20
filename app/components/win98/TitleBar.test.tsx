import React from 'react';
import { render, screen } from '@testing-library/react';
import { TitleBar } from './TitleBar';

describe('TitleBar Component', () => {
  it('renders the title text correctly', () => {
    render(<TitleBar title="My Application" />);
    expect(screen.getByText('My Application')).toBeInTheDocument();
  });

  it('renders an icon if provided', () => {
    const icon = <img src="icon.png" alt="app icon" data-testid="app-icon" />;
    render(<TitleBar title="App with Icon" icon={icon} />);
    expect(screen.getByTestId('app-icon')).toBeInTheDocument();
  });

  it('renders default min, max, and close buttons with correct data attributes', () => {
    render(<TitleBar title="Default Buttons" />);

    const minBtn = screen.getByRole('button', { name: /minimize/i });
    expect(minBtn).toBeInTheDocument();
    expect(minBtn).toHaveAttribute('data-win-min');

    const maxBtn = screen.getByRole('button', { name: /maximize/i });
    expect(maxBtn).toBeInTheDocument();
    expect(maxBtn).toHaveAttribute('data-win-max');

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute('data-win-close');
  });

  it('respects showMin, showMax, and showClose props to hide buttons', () => {
    render(
      <TitleBar
        title="Hidden Buttons"
        showMin={false}
        showMax={false}
        showClose={false}
      />
    );

    expect(screen.queryByRole('button', { name: /minimize/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /maximize/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('applies extra custom class names passed via className', () => {
    render(<TitleBar title="Custom Class" className="custom-title-bar my-class" />);

    // The main container should have 'title-bar' and our custom classes
    // We can find the container by looking at the parent of the title text
    const titleEl = screen.getByText('Custom Class');
    // .title-bar-text -> .title-bar
    const container = titleEl.parentElement?.parentElement;

    expect(container).toHaveClass('title-bar');
    expect(container).toHaveClass('custom-title-bar');
    expect(container).toHaveClass('my-class');
  });
});
