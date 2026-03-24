'use client';

// TODO(Phase 3.4): AIM content extraction — see packages/apps/aim/AimApp.tsx for details.
// The content/chrome split is non-trivial because AIM renders chat, away, and profile dialogs
// alongside the AppWindow. Not yet importing from @retro-web/app-aim.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppWindow } from '../../winxp/AppWindow';
import { TitleBar } from '../../winxp/TitleBar';
import { AimRunningManIcon } from './AimRunningManIcon';
import { AimBanner } from './AimBanner';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager } from '@retro-web/core/context';

const SCREEN_NAME = 'F4$tRunn3r200';

interface Buddy {
  name: string;
  status: 'online' | 'away' | 'offline';
  group: string;
  away?: string;
}

interface ChatMessage {
  type: 'sent' | 'system' | 'away-response';
  name: string;
  text: string;
}

const EMOJIS: Record<string, string> = {
  ':-)': '🙂',
  ':)': '🙂',
  ':-(': '😞',
  ':(': '😞',
  ':-P': '😛',
  ':P': '😛',
  ';-)': '😉',
  ';)': '😉',
  ':-D': '😄',
  ':D': '😄',
  ':-O': '😮',
  ':O': '😮',
  ':-|': '😐',
  ':|': '😐',
  '<3': '❤️',
  '^_^': '😊',
};

function replaceEmojis(text: string): string {
  let out = text;
  for (const [k, v] of Object.entries(EMOJIS)) {
    out = out.split(k).join(v);
  }
  return out;
}

const BUDDIES: Buddy[] = [
  {
    name: 'zkarpinski',
    status: 'away',
    group: 'Buddies',
    away: 'omg brb!!! listening 2 blink-182 ~all the small things~ n doin sum hw. ttyl!!! :-)',
  },
  { name: 'sk8erBoi99', status: 'offline', group: 'Offline' },
  { name: 'xXDarkAngelXx', status: 'offline', group: 'Offline' },
  { name: 'NSync4ever_gurl', status: 'offline', group: 'Offline' },
  { name: 'TRL_addict_2003', status: 'offline', group: 'Offline' },
];

const GROUPS = ['Buddies', 'Offline'];

export const aimAppConfig: AppConfig = {
  id: 'aim',
  label: 'AIM',
  icon: 'apps/aim/aim-icon.png',
  openByDefault: true,
  desktop: false,
  startMenu: { path: ['Programs', 'Internet'] },
  taskbarLabel: 'AIM',
  tray: true,
};

export function AimWindow() {
  const ctx = useWindowManager();

  // Buddy list state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['Offline']));
  const [selectedBuddy, setSelectedBuddy] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Away state
  const [awayMessage, setAwayMessage] = useState<string | null>(null);
  const [awayDialogOpen, setAwayDialogOpen] = useState(false);
  const [awayDialogInput, setAwayDialogInput] = useState('brb!! back in a few :-)');

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [currentBuddy, setCurrentBuddy] = useState<Buddy | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingText, setTypingText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const awayReplySentRef = useRef(false);

  // Profile dialog
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const chatLogRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, typingText]);

  // Drag chat window by title bar (chat is not an AppWindow, so wire drag here)
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el || !chatOpen) return;
    const titleBar = el.querySelector('.title-bar') as HTMLElement | null;
    if (!titleBar) return;
    const onTitleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = rect.left;
      const startTop = rect.top;
      const onMove = (e: MouseEvent) => {
        el.style.left = Math.max(0, startLeft + (e.clientX - startX)) + 'px';
        el.style.top = Math.max(0, startTop + (e.clientY - startY)) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
    titleBar.addEventListener('mousedown', onTitleMouseDown);
    return () => titleBar.removeEventListener('mousedown', onTitleMouseDown);
  }, [chatOpen]);

  // Close menus on outside click
  useEffect(() => {
    if (!activeMenu) return;
    const handler = () => setActiveMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [activeMenu]);

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function openChat(buddy: Buddy) {
    setCurrentBuddy(buddy);
    setChatOpen(true);
    awayReplySentRef.current = false;
    const initMsgs: ChatMessage[] = [];
    if (buddy.status === 'away') {
      initMsgs.push({
        type: 'system',
        name: '',
        text: `${buddy.name} is away. You may still send messages.`,
      });
    }
    setMessages(initMsgs);
    setTypingText('');
    setSelectedBuddy(null);
  }

  function sendMessage() {
    const text = chatInput.trim();
    if (!text || !currentBuddy) return;
    setChatInput('');
    setMessages((prev) => [...prev, { type: 'sent', name: SCREEN_NAME, text }]);

    if (currentBuddy.status === 'away' && !awayReplySentRef.current) {
      awayReplySentRef.current = true;
      setTypingText(`${currentBuddy.name} is typing a message...`);
      setTimeout(() => {
        setTypingText('');
        setMessages((prev) => [
          ...prev,
          {
            type: 'away-response',
            name: '',
            text: `Auto response from ${currentBuddy.name}: ${currentBuddy.away}`,
          },
        ]);
      }, 1400);
    }
  }

  function handleMenuAction(action: string) {
    setActiveMenu(null);
    switch (action) {
      case 'aim-set-away':
        setAwayDialogOpen(true);
        break;
      case 'aim-cancel-away':
        setAwayMessage(null);
        break;
      case 'aim-edit-profile':
        window.alert(
          `Edit Profile\n\nScreen Name: ${SCREEN_NAME}\n\nProfile editing is not supported in this version.`,
        );
        break;
      case 'aim-sign-off':
        ctx?.hideApp('aim');
        setChatOpen(false);
        break;
      case 'aim-send-im': {
        const name = window.prompt('Send Instant Message to:');
        if (name) openChat({ name, status: 'offline', group: 'Buddies' });
        break;
      }
      case 'aim-add-buddy':
        window.alert('Add Buddy\n\nBuddy list management is not available in this version.');
        break;
    }
  }

  const screenNameDisplay = awayMessage ? `${SCREEN_NAME} (Away)` : SCREEN_NAME;
  const onlineCount = BUDDIES.filter((b) => b.status === 'online' || b.status === 'away').length;
  const totalBuddies = BUDDIES.filter((b) => b.group === 'Buddies').length;
  const offlineCount = BUDDIES.filter((b) => b.status === 'offline').length;

  return (
    <>
      <AppWindow
        id="aim-window"
        appId="aim"
        className="aim-window app-window app-window-hidden"
        titleBar={
          <TitleBar
            title={screenNameDisplay}
            icon={<AimRunningManIcon size={14} />}
            showMin
            showMax
            showClose
          />
        }
      >
        {/* Menu bar */}
        <div className="aim-menu-bar">
          {[
            {
              id: 'aim-menu-myaim',
              label: (
                <>
                  <u>M</u>y AIM
                </>
              ),
            },
            {
              id: 'aim-menu-people',
              label: (
                <>
                  <u>P</u>eople
                </>
              ),
            },
            {
              id: 'aim-menu-help',
              label: (
                <>
                  <u>H</u>elp
                </>
              ),
            },
          ].map(({ id, label }) => (
            <span
              key={id}
              className={`aim-menu-item${activeMenu === id ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === id ? null : id);
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Menu dropdowns */}
        {activeMenu === 'aim-menu-myaim' && (
          <div className="aim-menu-dropdown open" style={{ position: 'absolute' }}>
            <div className="aim-menu-dd-item" onClick={() => handleMenuAction('aim-edit-profile')}>
              <u>E</u>dit Profile...
            </div>
            <div className="aim-menu-dd-divider" />
            <div className="aim-menu-dd-item" onClick={() => handleMenuAction('aim-set-away')}>
              Set <u>A</u>way Message...
            </div>
            <div className="aim-menu-dd-item" onClick={() => handleMenuAction('aim-cancel-away')}>
              Cancel Away Message
            </div>
            <div className="aim-menu-dd-divider" />
            <div className="aim-menu-dd-item disabled">Preferences...</div>
            <div className="aim-menu-dd-divider" />
            <div className="aim-menu-dd-item" onClick={() => handleMenuAction('aim-sign-off')}>
              Sign <u>O</u>ff
            </div>
          </div>
        )}
        {activeMenu === 'aim-menu-people' && (
          <div className="aim-menu-dropdown open" style={{ position: 'absolute' }}>
            <div className="aim-menu-dd-item" onClick={() => handleMenuAction('aim-send-im')}>
              Send Instant <u>M</u>essage...
            </div>
            <div className="aim-menu-dd-item" onClick={() => handleMenuAction('aim-add-buddy')}>
              <u>A</u>dd a Buddy...
            </div>
            <div className="aim-menu-dd-divider" />
            <div className="aim-menu-dd-item disabled">Find a Buddy...</div>
          </div>
        )}
        {activeMenu === 'aim-menu-help' && (
          <div className="aim-menu-dropdown open" style={{ position: 'absolute' }}>
            <div className="aim-menu-dd-item disabled">AIM Help</div>
            <div className="aim-menu-dd-divider" />
            <div className="aim-menu-dd-item disabled">About AIM</div>
          </div>
        )}

        <AimBanner />

        {/* Status strip */}
        <div className={`aim-status-strip${awayMessage ? ' aim-status-away' : ''}`}>
          <span>
            <span className="aim-status-strip-dot" />
            <span className="aim-status-strip-name">{screenNameDisplay}</span>
          </span>
          <span style={{ fontSize: 10, color: awayMessage ? '#cc8800' : '#008800' }}>
            {awayMessage ? 'Away' : 'Online'}
          </span>
        </div>

        {/* Buddy list */}
        <div className="aim-buddy-list">
          {GROUPS.map((group) => {
            const groupBuddies = BUDDIES.filter((b) => b.group === group);
            const onlineCnt = groupBuddies.filter((b) => b.status !== 'offline').length;
            const isCollapsed = collapsedGroups.has(group);
            return (
              <div key={group} className={`aim-group${isCollapsed ? ' collapsed' : ''}`}>
                <div className="aim-group-header" onClick={() => toggleGroup(group)}>
                  <span className="aim-group-arrow">▼</span>
                  {group} ({onlineCnt}/{groupBuddies.length})
                </div>
                <div className="aim-group-body">
                  {groupBuddies.map((buddy) => (
                    <div
                      key={buddy.name}
                      className={`aim-buddy-item ${buddy.status}`}
                      style={
                        selectedBuddy === buddy.name ? { background: '#0000a0', color: '#fff' } : {}
                      }
                      onClick={() => setSelectedBuddy(buddy.name)}
                      onDoubleClick={() => {
                        if (buddy.status !== 'offline') openChat(buddy);
                      }}
                    >
                      <span className="aim-buddy-icon">
                        {buddy.status === 'away' ? <AimAwayIconSmall /> : <AimOfflineIconSmall />}
                      </span>
                      {buddy.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="aim-bottom-bar">
          <button className="aim-bottom-btn" title="Setup">
            <span className="aim-bottom-icon">⚙️</span>
            <span>Setup</span>
          </button>
          <button
            type="button"
            className="aim-bottom-btn"
            title="Send Instant Message"
            onClick={() => openChat(BUDDIES[0])}
          >
            <span className="aim-bottom-icon">💬</span>
            <span>IM</span>
          </button>
          <button className="aim-bottom-btn" title="Chat Rooms">
            <span className="aim-bottom-icon">👥</span>
            <span>Chat</span>
          </button>
          <button
            type="button"
            className="aim-bottom-btn"
            title="Set Away"
            onClick={() => setAwayDialogOpen(true)}
          >
            <span className="aim-bottom-icon">🏃</span>
            <span>Away</span>
          </button>
          <button
            type="button"
            className="aim-bottom-btn"
            title="Sign Off"
            onClick={() => {
              ctx?.hideApp('aim');
              setChatOpen(false);
            }}
          >
            <span className="aim-bottom-icon">🚪</span>
            <span>Sign Off</span>
          </button>
        </div>
      </AppWindow>

      {/* Away dialog */}
      {awayDialogOpen && (
        <div className="aim-away-dialog open">
          <div className="title-bar">
            <div className="title-bar-text">
              <span className="title-text">Set Away Message</span>
            </div>
            <div className="title-bar-controls">
              <button
                type="button"
                className="win-btn title-btn"
                onClick={() => setAwayDialogOpen(false)}
              >
                <span className="icon-close">X</span>
              </button>
            </div>
          </div>
          <div className="aim-away-dialog-body">
            <label>Away message:</label>
            <textarea
              className="aim-away-textarea"
              value={awayDialogInput}
              onChange={(e) => setAwayDialogInput(e.target.value)}
            />
          </div>
          <div className="aim-away-dialog-footer">
            <button
              type="button"
              className="aim-dialog-btn"
              onClick={() => {
                setAwayMessage(awayDialogInput.trim() || null);
                setAwayDialogOpen(false);
              }}
            >
              OK
            </button>
            <button
              type="button"
              className="aim-dialog-btn"
              onClick={() => setAwayDialogOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat window */}
      {chatOpen && currentBuddy && (
        <div ref={chatWindowRef} className="aim-chat-window" style={{ display: 'flex' }}>
          <div className="title-bar">
            <div className="title-bar-text">
              <AimRunningManIcon size={14} />
              <span className="title-text">{currentBuddy.name} - Instant Message</span>
            </div>
            <div className="title-bar-controls">
              <button
                type="button"
                className="win-btn title-btn"
                onClick={() => setChatOpen(false)}
              >
                <span className="icon-close">X</span>
              </button>
            </div>
          </div>
          <div className="aim-chat-menu-bar">
            <span className="aim-chat-menu-item">
              <u>F</u>ile
            </span>
            <span className="aim-chat-menu-item">
              <u>E</u>dit
            </span>
            <span className="aim-chat-menu-item">
              <u>I</u>nsert
            </span>
            <span className="aim-chat-warning-label">
              {currentBuddy.name}&apos;s Warning Level: 0%
            </span>
          </div>
          <div className="aim-chat-log" ref={chatLogRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`aim-msg ${msg.type}`}>
                {msg.type === 'system' || msg.type === 'away-response' ? (
                  msg.text
                ) : (
                  <>
                    <span className="aim-msg-name">{msg.name}:</span> {replaceEmojis(msg.text)}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="aim-typing-indicator">{typingText}</div>
          <div className="aim-format-bar">
            <button type="button" className="aim-fmt-btn" title="Bold">
              <b>B</b>
            </button>
            <button type="button" className="aim-fmt-btn" title="Italic">
              <i>I</i>
            </button>
            <button type="button" className="aim-fmt-btn" title="Underline">
              <u>U</u>
            </button>
          </div>
          <textarea
            className="aim-chat-input"
            placeholder="Type a message and press Enter to send..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="aim-chat-actions">
            <button
              type="button"
              className="aim-action-btn"
              onClick={() =>
                window.alert(`You have warned ${currentBuddy.name}.\n\nWarning Level: 10%`)
              }
            >
              <span className="aim-action-icon">⚡</span>
              <span>
                <u>W</u>arn
              </span>
            </button>
            <button
              type="button"
              className="aim-action-btn"
              onClick={() => window.alert(`${currentBuddy.name} has been blocked.`)}
            >
              <span className="aim-action-icon">🚫</span>
              <span>
                <u>B</u>lock
              </span>
            </button>
            <button type="button" className="aim-action-btn">
              <span className="aim-action-icon">➕</span>
              <span>Add Buddy</span>
            </button>
            <button type="button" className="aim-action-btn">
              <span className="aim-action-icon">📞</span>
              <span>
                <u>T</u>alk
              </span>
            </button>
            <button
              type="button"
              className="aim-action-btn"
              onClick={() => setProfileDialogOpen(true)}
            >
              <span className="aim-action-icon">🪪</span>
              <span>Get Info</span>
            </button>
            <div className="aim-action-sep" />
            <div className="aim-send-wrap">
              <button type="button" className="aim-send-btn" onClick={sendMessage}>
                <span className="aim-send-icon">📨</span>
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile dialog */}
      {profileDialogOpen && currentBuddy && (
        <div className="aim-profile-dialog open">
          <div className="title-bar">
            <div className="title-bar-text">
              <span className="title-text">Get Info</span>
            </div>
            <div className="title-bar-controls">
              <button
                type="button"
                className="win-btn title-btn"
                onClick={() => setProfileDialogOpen(false)}
              >
                <span className="icon-close">X</span>
              </button>
            </div>
          </div>
          <div
            className="aim-profile-content"
            dangerouslySetInnerHTML={{
              __html:
                `<b>Screen Name:</b> ${currentBuddy.name}<br>` +
                `<b>Member Since:</b> February 1998<br>` +
                `<b>Last On:</b> Today<br><br><hr>` +
                `<i>:: my info ::</i><br>` +
                `hey wats up lol. im just here chillin. add me if u kno me<br><br>` +
                `music: blink-182, linkin park, good charlotte, simple plan<br>` +
                `movies: the matrix, hackers, fight club<br>` +
                `quote: "punk's not dead" -- unless ur a poser lol<br><br>` +
                `<font color="#0000ff">~*~ zkarpinski ~*~ AIM since '98 ~*~</font>`,
            }}
          />
        </div>
      )}
    </>
  );
}

function AimAwayIconSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="2.5" r="2" fill="#FFB900" />
      <line x1="8" y1="4.5" x2="6.5" y2="8" stroke="#FFB900" strokeWidth="1.2" />
      <line x1="7.5" y1="6" x2="5" y2="5" stroke="#FFB900" strokeWidth="1" />
      <line x1="7.5" y1="6" x2="10" y2="7" stroke="#FFB900" strokeWidth="1" />
      <line x1="6.5" y1="8" x2="4.5" y2="11" stroke="#FFB900" strokeWidth="1.2" />
      <line x1="6.5" y1="8" x2="9" y2="10.5" stroke="#FFB900" strokeWidth="1.2" />
    </svg>
  );
}

function AimOfflineIconSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="3" r="2" fill="#888" />
      <line x1="6" y1="5" x2="6" y2="9" stroke="#888" strokeWidth="1.5" />
      <line x1="6" y1="7" x2="3.5" y2="6" stroke="#888" strokeWidth="1.2" />
      <line x1="6" y1="7" x2="8.5" y2="6" stroke="#888" strokeWidth="1.2" />
      <line x1="6" y1="9" x2="4" y2="12" stroke="#888" strokeWidth="1.2" />
      <line x1="6" y1="9" x2="8" y2="12" stroke="#888" strokeWidth="1.2" />
    </svg>
  );
}
