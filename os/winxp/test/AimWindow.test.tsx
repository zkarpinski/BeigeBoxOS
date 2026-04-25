/**
 * Unit and functional tests for AimWindow.
 * Covers buddy list, opening chat with zkarpinski, sending messages, away response.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AimWindow, aimAppConfig } from '../app/components/apps/aim/AimWindow';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

function renderAim() {
  return render(
    <OsShellProvider value={mockOsShell}>
      <WindowManagerProvider registry={[aimAppConfig]} initialOpenAppId="aim">
        <AimWindow />
      </WindowManagerProvider>
    </OsShellProvider>,
  );
}

function getAimWindow(): HTMLElement {
  const win = document.getElementById('aim-window');
  if (!win) throw new Error('aim-window not found');
  return win;
}

function getChatWindow(): HTMLElement | null {
  return document.querySelector('.aim-chat-window');
}

describe('AimWindow', () => {
  test('renders without crashing', () => {
    renderAim();
    expect(getAimWindow()).toBeInTheDocument();
  });

  test('shows menu bar with My AIM, People, Help', () => {
    renderAim();
    const win = getAimWindow();
    expect(win).toHaveTextContent(/My AIM|M.*AIM/i);
    expect(win).toHaveTextContent(/People|P.*eople/i);
    expect(win).toHaveTextContent(/Help|H.*elp/i);
  });

  test('shows buddy list with Buddies group and zkarpinski', () => {
    renderAim();
    const win = getAimWindow();
    expect(win).toHaveTextContent('Buddies');
    expect(win).toHaveTextContent('zkarpinski');
  });

  test('shows status strip with screen name', () => {
    renderAim();
    const win = getAimWindow();
    expect(win).toHaveTextContent('F4$tRunn3r200');
  });

  test('IM button opens chat with zkarpinski', async () => {
    const user = userEvent.setup();
    renderAim();
    const imBtn = screen.getByTitle('Send Instant Message');
    await user.click(imBtn);
    const chat = getChatWindow();
    expect(chat).toBeInTheDocument();
    expect(chat).toHaveTextContent('zkarpinski');
    expect(chat).toHaveTextContent('Instant Message');
  });

  test('double-clicking zkarpinski in buddy list opens chat', async () => {
    const user = userEvent.setup();
    renderAim();
    const win = getAimWindow();
    const buddy = within(win).getByText('zkarpinski');
    await user.dblClick(buddy);
    const chat = getChatWindow();
    expect(chat).toBeInTheDocument();
    expect(chat).toHaveTextContent('zkarpinski');
  });

  test('chat shows away system message for zkarpinski', async () => {
    const user = userEvent.setup();
    renderAim();
    await user.click(screen.getByTitle('Send Instant Message'));
    const chat = getChatWindow()!;
    expect(chat).toHaveTextContent('zkarpinski is away');
    expect(chat).toHaveTextContent('You may still send messages');
  });

  test('sending a message adds it to the chat log', async () => {
    const user = userEvent.setup();
    renderAim();
    await user.click(screen.getByTitle('Send Instant Message'));
    const chat = getChatWindow()!;
    const input = chat.querySelector('.aim-chat-input') as HTMLTextAreaElement;
    const sendBtn = within(chat).getByRole('button', { name: /send/i });
    await user.type(input, 'hey whats up');
    await user.click(sendBtn);
    expect(chat).toHaveTextContent('hey whats up');
    expect(chat).toHaveTextContent('F4$tRunn3r200');
  });

  test('pressing Enter in chat input sends message', async () => {
    const user = userEvent.setup();
    renderAim();
    await user.click(screen.getByTitle('Send Instant Message'));
    const chat = getChatWindow()!;
    const input = chat.querySelector('.aim-chat-input') as HTMLTextAreaElement;
    await user.type(input, 'test{Enter}');
    expect(chat).toHaveTextContent('test');
  });

  test('away auto-response appears after sending to zkarpinski', async () => {
    const user = userEvent.setup();
    renderAim();
    await user.click(screen.getByTitle('Send Instant Message'));
    const chat = getChatWindow()!;
    const input = chat.querySelector('.aim-chat-input') as HTMLTextAreaElement;
    await user.type(input, 'hi');
    await user.click(within(chat).getByRole('button', { name: /send/i }));
    expect(chat).toHaveTextContent('hi');
    await screen.findByText(/Auto response from zkarpinski/i, {}, { timeout: 2500 });
    expect(chat).toHaveTextContent('omg brb');
  });

  test('Set Away opens away dialog', async () => {
    const user = userEvent.setup();
    renderAim();
    const win = getAimWindow();
    const myAimMenu = win.querySelector('.aim-menu-item');
    expect(myAimMenu).toBeInTheDocument();
    await user.click(myAimMenu as HTMLElement);
    const setAway = Array.from(document.querySelectorAll('.aim-menu-dd-item')).find(
      (el) => el.textContent?.includes('Set') && el.textContent?.includes('Away'),
    );
    expect(setAway).toBeInTheDocument();
    await user.click(setAway as HTMLElement);
    expect(screen.getByText('Set Away Message')).toBeInTheDocument();
    expect(document.querySelector('.aim-away-dialog')).toBeInTheDocument();
  });

  test('chat window close button closes chat', async () => {
    const user = userEvent.setup();
    renderAim();
    await user.click(screen.getByTitle('Send Instant Message'));
    expect(getChatWindow()).toBeInTheDocument();
    const chat = getChatWindow()!;
    const closeBtn = chat.querySelector('.title-bar-controls button');
    expect(closeBtn).toBeInTheDocument();
    await user.click(closeBtn as HTMLElement);
    expect(getChatWindow()).not.toBeInTheDocument();
  });
});
