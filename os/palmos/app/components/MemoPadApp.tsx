'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';

interface Memo {
  id: string;
  body: string;
}

const STORAGE_KEY = 'palmos-memos';

function load(): Memo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function save(memos: Memo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
}

export function MemoPadApp() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { playClick, playSuccess, playError } = usePalmSounds();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMemos(load());
  }, []);

  const update = (next: Memo[]) => {
    setMemos(next);
    save(next);
  };

  const createMemo = () => {
    const m: Memo = { id: Date.now().toString(), body: '' };
    const next = [m, ...memos];
    update(next);
    setSelected(m.id);
    playSuccess();
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const deleteMemo = (id: string) => {
    playClick();
    const next = memos.filter((m) => m.id !== id);
    update(next);
    if (selected === id) setSelected(null);
  };

  const editBody = (id: string, body: string) => {
    update(memos.map((m) => (m.id === id ? { ...m, body } : m)));
  };

  const currentMemo = memos.find((m) => m.id === selected) ?? null;

  const title = (m: Memo) => {
    const first = m.body.split('\n')[0].trim();
    return first || '(untitled)';
  };

  if (currentMemo) {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}
      >
        {/* Detail toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #000',
            padding: '2px 4px',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              setSelected(null);
              playClick();
            }}
            style={{
              border: '1px solid #000',
              background: 'white',
              padding: '0 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ◀ Done
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => deleteMemo(currentMemo.id)}
            style={{
              border: '1px solid #000',
              background: 'white',
              padding: '0 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>

        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={currentMemo.body}
          onChange={(e) => editBody(currentMemo.id, e.target.value)}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            padding: '6px',
            fontSize: '11px',
            lineHeight: '1.5',
            fontFamily: 'inherit',
            color: '#000',
            background: 'white',
          }}
          placeholder="Type your memo here..."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {memos.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '11px', color: '#888', textAlign: 'center' }}>
            No memos. Tap New to create one.
          </div>
        ) : (
          memos.map((m) => (
            <div
              key={m.id}
              style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }}
            >
              <button
                onClick={() => {
                  setSelected(m.id);
                  playClick();
                }}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#000',
                }}
              >
                {title(m)}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderTop: '1px solid #000',
          flexShrink: 0,
        }}
      >
        <button
          onClick={createMemo}
          style={{
            border: '2px solid #000',
            background: 'white',
            padding: '1px 10px',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          New
        </button>
      </div>
    </div>
  );
}
