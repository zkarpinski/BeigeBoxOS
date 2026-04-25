/**
 * Unit tests for Visual Basic 6.
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Vb6Window, vb6AppConfig } from './Vb6Window';
import { Win98TestProviders } from '../../../../test/test-utils';

const registry = [vb6AppConfig];

describe('Vb6Window', () => {
  test('renders project explorer and properties window', () => {
    render(
      <Win98TestProviders registry={registry}>
        <Vb6Window />
      </Win98TestProviders>,
    );

    expect(screen.getByText(/Project - Project1/i)).toBeInTheDocument();
    expect(screen.getByText(/Properties - Form1/i)).toBeInTheDocument();
  });

  test('renders form designer with Form1', () => {
    render(
      <Win98TestProviders registry={registry}>
        <Vb6Window />
      </Win98TestProviders>,
    );

    const formDesigners = screen.getAllByText(/Form1/i);
    expect(formDesigners.length).toBeGreaterThan(1);
  });

  test('renders toolbox with controls', () => {
    render(
      <Win98TestProviders registry={registry}>
        <Vb6Window />
      </Win98TestProviders>,
    );

    expect(screen.getByTitle('Pointer')).toBeInTheDocument();
    expect(screen.getByTitle('Label')).toBeInTheDocument();
    expect(screen.getByTitle('TextBox')).toBeInTheDocument();
    expect(screen.getByTitle('CommandButton')).toBeInTheDocument();
  });

  test('updates property value when input changes', () => {
    render(
      <Win98TestProviders registry={registry}>
        <Vb6Window />
      </Win98TestProviders>,
    );

    const propsPanel = screen.getByText(/Properties - Form1/i).closest('.vb6-panel');
    const captionValue = within(propsPanel as HTMLElement).getAllByText(/Form1/i)[0];
    expect(captionValue).toBeInTheDocument();
  });

  test('can click Start button', () => {
    render(
      <Win98TestProviders registry={registry}>
        <Vb6Window />
      </Win98TestProviders>,
    );

    const startBtn = screen.getByTitle('Start');
    fireEvent.click(startBtn);

    // Check for Form1 in the run window specifically
    const runWindow = screen
      .getByText((content, element) => {
        return element?.classList.contains('vb6-mdi-title-text') && content === 'Form1';
      })
      .closest('.vb6-run-window');

    expect(runWindow).toBeInTheDocument();
  });
});
