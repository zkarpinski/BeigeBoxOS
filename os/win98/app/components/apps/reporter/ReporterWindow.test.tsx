/**
 * Unit tests for Feature Request & Bug Reporter.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReporterWindow, reporterAppConfig } from './ReporterWindow';
import { Win98TestProviders } from '../../../../test/test-utils';

const registry = [reporterAppConfig];

describe('ReporterWindow', () => {
  test('renders heading and introductory text', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ReporterWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByText(/Report a bug/i)).toBeInTheDocument();
  });

  test('toggles details panel when Details... is clicked', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ReporterWindow />
      </Win98TestProviders>,
    );

    expect(screen.queryByText('Type:')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Details...'));
    expect(screen.getByText('Type:')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Details...'));
    expect(screen.queryByText('Type:')).not.toBeInTheDocument();
  });

  test('updates comment textarea', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ReporterWindow />
      </Win98TestProviders>,
    );

    const textarea = screen.getByPlaceholderText(/Add a comment/);
    fireEvent.change(textarea, { target: { value: 'This is a bug report' } });
    expect(textarea).toHaveValue('This is a bug report');
  });

  test('submits report via mailto when Submit Report is clicked', () => {
    window.open = jest.fn();
    render(
      <Win98TestProviders registry={registry}>
        <ReporterWindow />
      </Win98TestProviders>,
    );

    const textarea = screen.getByPlaceholderText(/Add a comment/);
    fireEvent.change(textarea, { target: { value: 'Something is wrong' } });

    fireEvent.click(screen.getByText('Submit Report'));

    expect(window.open).toHaveBeenCalledTimes(1);
    const [url, target] = (window.open as jest.Mock).mock.calls[0];
    expect(url).toContain('mailto:zkarpinski@protonmail.com');
    expect(url).toContain('Something%20is%20wrong');
    expect(target).toBe('_blank');
  });

  test('toggles email field when checkbox is clicked', () => {
    render(
      <Win98TestProviders registry={registry}>
        <ReporterWindow />
      </Win98TestProviders>,
    );

    expect(screen.queryByPlaceholderText('your@email.com')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Email me/i));
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
  });
});
