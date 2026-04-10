import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PalmTodoApp } from './PalmTodoApp';
import { usePalmSounds } from '../hooks/usePalmSounds';

jest.mock('../hooks/usePalmSounds');

const mockSounds = {
  playClick: jest.fn(),
  playSuccess: jest.fn(),
  playError: jest.fn(),
};

describe('PalmTodoApp Component', () => {
  beforeEach(() => {
    (usePalmSounds as jest.Mock).mockReturnValue(mockSounds);
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders the Todo list title', () => {
    render(<PalmTodoApp />);
    expect(screen.getByText('To Do List')).toBeInTheDocument();
  });

  it('adds a new todo item', () => {
    render(<PalmTodoApp />);

    // Click New
    fireEvent.click(screen.getByText('New'));

    // Fill input
    const input = screen.getByPlaceholderText('New task...');
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(mockSounds.playSuccess).toHaveBeenCalled();
  });

  it('toggles a todo item completion', () => {
    render(<PalmTodoApp />);
    fireEvent.click(screen.getByText('New'));
    const input = screen.getByPlaceholderText('New task...');
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    const checkbox = screen.getAllByRole('button').find((b) => !b.textContent);
    if (checkbox) fireEvent.click(checkbox);

    expect(screen.getByText('Buy milk')).toHaveClass('line-through');
    expect(mockSounds.playClick).toHaveBeenCalled();
  });
});
