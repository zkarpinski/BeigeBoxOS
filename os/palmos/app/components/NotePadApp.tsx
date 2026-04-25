'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';

interface Note {
  id: string;
  dataURL: string;
}

const STORAGE_KEY = 'palmos-notepad';
// Internal canvas resolution — matches the 264px screen width
const CANVAS_W = 264;
const CANVAS_H = 210;

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: Note[] = raw ? JSON.parse(raw) : [];
    return parsed.length > 0 ? parsed : [{ id: '1', dataURL: '' }];
  } catch {
    return [{ id: '1', dataURL: '' }];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function NotePadApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const { playClick } = usePalmSounds();

  // Load notes once on mount
  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  // Redraw canvas whenever page or notes array length changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || notes.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const note = notes[pageIndex];
    if (note?.dataURL) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = note.dataURL;
    }
  }, [pageIndex, notes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCurrentPage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    setNotes((prev) => {
      const next = prev.map((n, i) => (i === pageIndex ? { ...n, dataURL } : n));
      saveNotes(next);
      return next;
    });
  }, [pageIndex]);

  // Map pointer position to canvas coordinate space (handles CSS scaling)
  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    // Draw a dot at the tap point
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, tool === 'pen' ? 1 : 6, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'pen' ? '#000' : '#fff';
    ctx.fill();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'pen' ? '#000' : '#fff';
    ctx.lineWidth = tool === 'pen' ? 1.5 : 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const onPointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    saveCurrentPage();
  };

  const goToPage = (index: number) => {
    playClick();
    setPageIndex(index);
  };

  const newPage = () => {
    playClick();
    const note: Note = { id: Date.now().toString(), dataURL: '' };
    const next = [...notes, note];
    setNotes(next);
    saveNotes(next);
    setPageIndex(next.length - 1);
  };

  const clearPage = () => {
    playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Persist cleared state
    const dataURL = canvas.toDataURL('image/png');
    setNotes((prev) => {
      const next = prev.map((n, i) => (i === pageIndex ? { ...n, dataURL } : n));
      saveNotes(next);
      return next;
    });
  };

  const deletePage = () => {
    playClick();
    if (notes.length <= 1) {
      clearPage();
      return;
    }
    const next = notes.filter((_, i) => i !== pageIndex);
    setNotes(next);
    saveNotes(next);
    setPageIndex(Math.max(0, pageIndex - 1));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          flex: 1,
          display: 'block',
          width: '100%',
          touchAction: 'none',
          cursor: tool === 'pen' ? 'crosshair' : 'cell',
          imageRendering: 'pixelated',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          padding: '2px 4px',
          borderTop: '1px solid #000',
          background: '#f0f0f0',
          flexShrink: 0,
        }}
      >
        {/* Page navigation */}
        <Btn onClick={() => goToPage(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0}>
          ◀
        </Btn>
        <span
          style={{ fontSize: '9px', whiteSpace: 'nowrap', minWidth: '32px', textAlign: 'center' }}
        >
          {notes.length > 0 ? `${pageIndex + 1} / ${notes.length}` : '1 / 1'}
        </span>
        <Btn
          onClick={() => goToPage(Math.min(notes.length - 1, pageIndex + 1))}
          disabled={pageIndex >= notes.length - 1}
        >
          ▶
        </Btn>

        <div style={{ flex: 1 }} />

        {/* Tool selector */}
        <Btn onClick={() => setTool('pen')} active={tool === 'pen'}>
          Pen
        </Btn>
        <Btn onClick={() => setTool('eraser')} active={tool === 'eraser'}>
          Erase
        </Btn>

        <div
          style={{ width: '1px', alignSelf: 'stretch', background: '#999', margin: '1px 2px' }}
        />

        {/* Page actions */}
        <Btn onClick={newPage}>New</Btn>
        <Btn onClick={deletePage}>Del</Btn>
      </div>
    </div>
  );
}

function Btn({
  onClick,
  children,
  disabled,
  active,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: '1px solid #000',
        background: active ? '#1A1A8C' : 'white',
        color: active ? 'white' : '#000',
        padding: '1px 5px',
        fontSize: '9px',
        fontWeight: 'bold',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}
