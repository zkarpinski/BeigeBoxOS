import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@retro-web/core/context';

// ── Helpers ──────────────────────────────────────────────────────────────────

function Trigger({
  message,
  type,
  duration,
}: {
  message: string;
  type?: string;
  duration?: number;
}) {
  const { addToast } = useToast();
  return (
    <button
      onClick={() =>
        addToast(message, {
          type: type as never,
          duration,
        })
      }
    >
      add
    </button>
  );
}

function ToastList() {
  const { toasts, removeToast } = useToast();
  return (
    <ul>
      {toasts.map((t) => (
        <li key={t.id} data-testid={`toast-${t.id}`} data-type={t.type}>
          {t.message}
          <button onClick={() => removeToast(t.id)}>dismiss</button>
        </li>
      ))}
    </ul>
  );
}

function setup(props: { message?: string; type?: string; duration?: number } = {}) {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(
    <ToastProvider>
      <Trigger message={props.message ?? 'hello'} type={props.type} duration={props.duration} />
      <ToastList />
    </ToastProvider>,
  );
  return { user, add: () => user.click(screen.getByRole('button', { name: 'add' })) };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ToastProvider / useToast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('throws when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow('useToast must be used inside ToastProvider');
    spy.mockRestore();
  });

  test('addToast renders a toast with correct message and default type', async () => {
    const { add } = setup({ message: 'world' });
    await add();
    expect(screen.getByText('world')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-type', 'info');
  });

  test('addToast respects explicit type', async () => {
    const { add } = setup({ type: 'success' });
    await add();
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-type', 'success');
  });

  test('multiple toasts stack', async () => {
    const { user } = setup({ message: 'ping' });
    const btn = screen.getByRole('button', { name: 'add' });
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  test('auto-dismisses after duration', async () => {
    const { add } = setup({ duration: 1000 });
    await add();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  test('duration=0 does not auto-dismiss', async () => {
    const { add } = setup({ duration: 0 });
    await add();
    act(() => jest.advanceTimersByTime(60_000));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  test('removeToast dismisses immediately', async () => {
    const { user, add } = setup({ duration: 0 });
    await add();
    await user.click(screen.getByRole('button', { name: 'dismiss' }));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  test('removeToast cancels pending auto-dismiss timer', async () => {
    const { user, add } = setup({ duration: 5000 });
    await add();
    await user.click(screen.getByRole('button', { name: 'dismiss' }));
    // Advancing past the original duration should not throw or re-add the toast
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  test('addToast returns a unique id for each toast', async () => {
    const ids: string[] = [];
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    function Capturer() {
      const { addToast } = useToast();
      return (
        <button
          onClick={() => {
            ids.push(addToast('a'));
            ids.push(addToast('b'));
          }}
        >
          add
        </button>
      );
    }
    render(
      <ToastProvider>
        <Capturer />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'add' }));
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
