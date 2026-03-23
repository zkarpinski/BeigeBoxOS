import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToolbarRow, Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSelect } from './Toolbar';

describe('Toolbar Components', () => {
  describe('ToolbarRow', () => {
    it('renders children with default showGripper=true', () => {
      const { container } = render(
        <ToolbarRow>
          <span>Test Row</span>
        </ToolbarRow>,
      );

      expect(screen.getByText('Test Row')).toBeInTheDocument();
      const gripper = container.querySelector('.toolbar-gripper');
      expect(gripper).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('toolbar-row');
    });

    it('does not render gripper when showGripper is false', () => {
      const { container } = render(
        <ToolbarRow showGripper={false}>
          <span>Test Row</span>
        </ToolbarRow>,
      );

      const gripper = container.querySelector('.toolbar-gripper');
      expect(gripper).not.toBeInTheDocument();
    });

    it('adds extra className when provided', () => {
      const { container } = render(<ToolbarRow className="custom-row">Test</ToolbarRow>);
      expect(container.firstChild).toHaveClass('toolbar-row', 'custom-row');
    });
  });

  describe('Toolbar', () => {
    it('renders children', () => {
      render(
        <Toolbar>
          <span>Test Toolbar Content</span>
        </Toolbar>,
      );
      expect(screen.getByText('Test Toolbar Content')).toBeInTheDocument();
    });

    it('adds extra className when provided', () => {
      const { container } = render(<Toolbar className="custom-toolbar">Test</Toolbar>);
      expect(container.firstChild).toHaveClass('toolbar', 'custom-toolbar');
    });
  });

  describe('ToolbarButton', () => {
    it('renders children and default props', () => {
      render(
        <ToolbarButton>
          <span>Btn Content</span>
        </ToolbarButton>,
      );

      const btn = screen.getByRole('button');
      expect(btn).toHaveTextContent('Btn Content');
      expect(btn).toHaveClass('tb-btn');
      expect(btn).toHaveAttribute('type', 'button');
    });

    it('applies active state class', () => {
      render(<ToolbarButton active>Active Btn</ToolbarButton>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveClass('active');
    });

    it('adds extra className when provided', () => {
      render(<ToolbarButton className="extra-class">Custom Btn</ToolbarButton>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveClass('tb-btn', 'extra-class');
    });

    it('passes down type, title and style attributes', () => {
      render(
        <ToolbarButton type="submit" title="Submit Btn" style={{ color: 'red' }}>
          Submit
        </ToolbarButton>,
      );
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('type', 'submit');
      expect(btn).toHaveAttribute('title', 'Submit Btn');
      expect(btn).toHaveStyle({ color: 'red' });
    });

    it('fires onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<ToolbarButton onClick={handleClick}>Click Me</ToolbarButton>);
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('ToolbarSeparator', () => {
    it('renders vertical separator', () => {
      const { container } = render(<ToolbarSeparator />);
      expect(container.firstChild).toHaveClass('tb-sep');
    });
  });

  describe('ToolbarSelect', () => {
    it('renders select with children and attributes', () => {
      render(
        <ToolbarSelect title="Select Font" className="font-select">
          <option value="Arial">Arial</option>
          <option value="Times">Times</option>
        </ToolbarSelect>,
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('title', 'Select Font');
      expect(select).toHaveClass('tb-select', 'font-select');
      expect(select).toHaveValue('Arial'); // default First option unless overridden
      expect(screen.getByText('Arial')).toBeInTheDocument();
      expect(screen.getByText('Times')).toBeInTheDocument();
    });

    it('handles value and onChange correctly', () => {
      const handleChange = jest.fn();
      render(
        <ToolbarSelect value="Times" onChange={handleChange}>
          <option value="Arial">Arial</option>
          <option value="Times">Times</option>
        </ToolbarSelect>,
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('Times');

      fireEvent.change(select, { target: { value: 'Arial' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('handles defaultValue correctly', () => {
      render(
        <ToolbarSelect defaultValue="Times">
          <option value="Arial">Arial</option>
          <option value="Times">Times</option>
        </ToolbarSelect>,
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('Times');
    });
  });
});
