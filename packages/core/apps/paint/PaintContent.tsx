'use client';

// ── Paint inner UI ─────────────────────────────────────────────────────────────
// This component contains the Paint logic and UI without any window chrome
// (no AppWindow wrapper, no shell-specific imports). Wrap it in an AppWindow in
// the os-specific layer.

import React, { useState, useRef, useEffect } from 'react';
import './paint.css';

const MIN_CANVAS_W = 50;
const MIN_CANVAS_H = 50;
const MAX_CANVAS_W = 2000;
const MAX_CANVAS_H = 2000;
const DEFAULT_CANVAS_W = 400;
const DEFAULT_CANVAS_H = 300;

const COLORS = [
  '#000000',
  '#808080',
  '#800000',
  '#808000',
  '#008000',
  '#008080',
  '#000080',
  '#800080',
  '#808040',
  '#004040',
  '#0080ff',
  '#004080',
  '#4000ff',
  '#804000',
  '#ffffff',
  '#c0c0c0',
  '#ff0000',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#ff00ff',
  '#ffff80',
  '#00ff80',
  '#80ffff',
  '#8080ff',
  '#ff0080',
  '#ff8040',
];

const TOOLS = [
  { id: 'select', icon: '⬚', title: 'Select' },
  { id: 'eraser', icon: '▰', title: 'Eraser/Color Eraser', iconStyle: { color: '#ffb6c1' } },
  { id: 'fill', icon: '🪣', title: 'Fill With Color' },
  { id: 'picker', icon: '💉', title: 'Pick Color' },
  { id: 'magnifier', icon: '🔍', title: 'Magnifier' },
  { id: 'pencil', icon: '✏️', title: 'Pencil' },
  { id: 'brush', icon: '🖌️', title: 'Brush' },
  { id: 'text', icon: 'A', title: 'Text' },
  {
    id: 'line',
    icon: '|',
    title: 'Line',
    iconStyle: { transform: 'rotate(-45deg)', display: 'inline-block' },
  },
  { id: 'curve', icon: '~', title: 'Curve' },
  { id: 'rectangle', icon: '⬜', title: 'Rectangle' },
  { id: 'polygon', icon: '⬠', title: 'Polygon' },
  { id: 'ellipse', icon: '◯', title: 'Ellipse' },
  {
    id: 'roundrect',
    icon: '',
    title: 'Rounded Rectangle',
    iconStyle: { borderRadius: '4px', border: '1px solid black', width: '10px', height: '10px' },
  },
] as const;

export function PaintContent() {
  const [currentTool, setCurrentTool] = useState('pencil');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [statusText, setStatusText] = useState('For Help, click Help Topics on the Help Menu.');
  const [coordText, setCoordText] = useState('');
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_W);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_CANVAS_H);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<string[]>([]);
  const histStepRef = useRef(-1);

  // Sync refs with state for use inside draw callbacks
  const currentToolRef = useRef(currentTool);
  const primaryColorRef = useRef(primaryColor);
  const secondaryColorRef = useRef(secondaryColor);
  currentToolRef.current = currentTool;
  primaryColorRef.current = primaryColor;
  secondaryColorRef.current = secondaryColor;

  function saveState() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    histStepRef.current++;
    historyRef.current = historyRef.current.slice(0, histStepRef.current);
    historyRef.current.push(canvas.toDataURL());
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = secondaryColorRef.current;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  void clearCanvas; // referenced for completeness

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctxRef.current = ctx;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = DEFAULT_CANVAS_W;
    tempCanvas.height = DEFAULT_CANVAS_H;
    tempCanvasRef.current = tempCanvas;

    canvas.width = DEFAULT_CANVAS_W;
    canvas.height = DEFAULT_CANVAS_H;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, DEFAULT_CANVAS_W, DEFAULT_CANVAS_H);

    histStepRef.current++;
    historyRef.current.push(canvas.toDataURL());
  }, []);

  const resizeTargetRef = useRef({ w: 0, h: 0 });

  // Canvas resize via handles (e, s, se): preserve image and update bitmap size
  const handleCanvasResize = (handle: 'e' | 's' | 'se') => (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = canvas.width;
    const startH = canvas.height;
    resizeTargetRef.current = { w: startW, h: startH };

    const onMove = (moveEvent: MouseEvent) => {
      let newW = startW;
      let newH = startH;
      if (handle === 'e' || handle === 'se') {
        newW = Math.min(
          MAX_CANVAS_W,
          Math.max(MIN_CANVAS_W, startW + (moveEvent.clientX - startX)),
        );
      }
      if (handle === 's' || handle === 'se') {
        newH = Math.min(
          MAX_CANVAS_H,
          Math.max(MIN_CANVAS_H, startH + (moveEvent.clientY - startY)),
        );
      }
      resizeTargetRef.current = { w: newW, h: newH };
      setCanvasWidth(newW);
      setCanvasHeight(newH);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      const canvasEl = canvasRef.current;
      const ctxEl = ctxRef.current;
      if (!canvasEl || !ctxEl) return;
      const { w: newW, h: newH } = resizeTargetRef.current;
      if (newW === canvasEl.width && newH === canvasEl.height) return;

      const oldW = canvasEl.width;
      const oldH = canvasEl.height;
      const temp = document.createElement('canvas');
      temp.width = oldW;
      temp.height = oldH;
      const tCtx = temp.getContext('2d');
      if (tCtx) tCtx.drawImage(canvasEl, 0, 0);

      canvasEl.width = newW;
      canvasEl.height = newH;
      ctxEl.fillStyle = '#ffffff';
      ctxEl.fillRect(0, 0, newW, newH);
      ctxEl.drawImage(temp, 0, 0, oldW, oldH, 0, 0, Math.min(newW, oldW), Math.min(newH, oldH));

      const tc = tempCanvasRef.current;
      if (tc) {
        tc.width = newW;
        tc.height = newH;
      }

      histStepRef.current++;
      historyRef.current.push(canvasEl.toDataURL());
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Keyboard shortcut: Ctrl+Z undo
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (histStepRef.current > 0) {
          histStepRef.current--;
          const img = new Image();
          img.src = historyRef.current[histStepRef.current];
          img.onload = () => {
            const ctx = ctxRef.current;
            const canvas = canvasRef.current;
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Global mouseup listener
  useEffect(() => {
    function onMouseUp() {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        saveState();
      }
    }
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  function getPos(e: React.MouseEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / (rect.width / canvas.width)),
      y: Math.floor((e.clientY - rect.top) / (rect.height / canvas.height)),
    };
  }

  function floodFill(startX: number, startY: number, fillColor: string) {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const getIdx = (x: number, y: number) => (y * canvas.width + x) * 4;
    const si = getIdx(startX, startY);
    const sr = data[si],
      sg = data[si + 1],
      sb = data[si + 2],
      sa = data[si + 3];
    const r = parseInt(fillColor.slice(1, 3), 16);
    const g = parseInt(fillColor.slice(3, 5), 16);
    const b = parseInt(fillColor.slice(5, 7), 16);
    if (sr === r && sg === g && sb === b && sa === 255) return;
    const match = (idx: number) =>
      data[idx] === sr && data[idx + 1] === sg && data[idx + 2] === sb && data[idx + 3] === sa;
    const set = (idx: number) => {
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    };
    const stack: [number, number][] = [[startX, startY]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      const idx = getIdx(x, y);
      if (!match(idx)) continue;
      set(idx);
      if (x > 0) stack.push([x - 1, y]);
      if (x < canvas.width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < canvas.height - 1) stack.push([x, y + 1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function draw(x: number, y: number, color: string, isFirst: boolean) {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!canvas || !ctx) return;
    const tool = currentToolRef.current;

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    if (tool === 'pencil') {
      ctx.lineWidth = 1;
      ctx.lineCap = 'square';
      if (isFirst) {
        ctx.fillRect(x, y, 1, 1);
      } else {
        ctx.beginPath();
        ctx.moveTo(startXRef.current, startYRef.current);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      startXRef.current = x;
      startYRef.current = y;
    } else if (tool === 'brush') {
      const bs = 4;
      if (isFirst) {
        ctx.beginPath();
        ctx.arc(x, y, bs / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.lineWidth = bs;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(startXRef.current, startYRef.current);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      startXRef.current = x;
      startYRef.current = y;
    } else if (tool === 'eraser') {
      const es = 8;
      const ec = secondaryColorRef.current;
      ctx.fillStyle = ec;
      ctx.strokeStyle = ec;
      if (isFirst) {
        ctx.fillRect(x - es / 2, y - es / 2, es, es);
      } else {
        ctx.lineWidth = es;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(startXRef.current, startYRef.current);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      startXRef.current = x;
      startYRef.current = y;
    } else if (tool === 'line' && tempCanvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.lineWidth = 1;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(startXRef.current, startYRef.current);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'rectangle' && tempCanvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        startXRef.current,
        startYRef.current,
        x - startXRef.current,
        y - startYRef.current,
      );
    } else if (tool === 'ellipse' && tempCanvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(
        startXRef.current + (x - startXRef.current) / 2,
        startYRef.current + (y - startYRef.current) / 2,
        Math.abs((x - startXRef.current) / 2),
        Math.abs((y - startYRef.current) / 2),
        0,
        0,
        2 * Math.PI,
      );
      ctx.stroke();
    } else if (tool === 'fill' && isFirst) {
      floodFill(x, y, color);
    } else if (tool === 'picker' && isFirst) {
      const imgData = ctx.getImageData(x, y, 1, 1).data;
      const hex =
        '#' +
        [imgData[0], imgData[1], imgData[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
      setPrimaryColor(hex);
      primaryColorRef.current = hex;
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    const pos = getPos(e);
    isDrawingRef.current = true;
    startXRef.current = pos.x;
    startYRef.current = pos.y;

    const color = e.button === 2 ? secondaryColorRef.current : primaryColorRef.current;

    const tempCanvas = tempCanvasRef.current;
    const canvas = canvasRef.current;
    if (tempCanvas && canvas) {
      const tc = tempCanvas.getContext('2d');
      tc?.clearRect(0, 0, canvas.width, canvas.height);
      tc?.drawImage(canvas, 0, 0);
    }

    draw(pos.x, pos.y, color, true);
  }

  function handleMouseMove(e: React.MouseEvent) {
    const pos = getPos(e);
    setCoordText(`${pos.x}, ${pos.y}`);
    if (!isDrawingRef.current) return;
    const color = e.buttons === 2 ? secondaryColorRef.current : primaryColorRef.current;
    draw(pos.x, pos.y, color, false);
  }

  function selectTool(toolId: string) {
    setCurrentTool(toolId);
    currentToolRef.current = toolId;
    setStatusText(`Selected tool: ${toolId}`);
  }

  function handleColorClick(color: string, e: React.MouseEvent) {
    e.preventDefault();
    if (e.button === 2) {
      setSecondaryColor(color);
      secondaryColorRef.current = color;
    } else {
      setPrimaryColor(color);
      primaryColorRef.current = color;
    }
  }

  return (
    <>
      <div className="paint-menu-bar">
        <div className="paint-menu-item">
          <u>F</u>ile
        </div>
        <div className="paint-menu-item">
          <u>E</u>dit
        </div>
        <div className="paint-menu-item">
          <u>V</u>iew
        </div>
        <div className="paint-menu-item">
          <u>I</u>mage
        </div>
        <div className="paint-menu-item">
          <u>O</u>ptions
        </div>
        <div className="paint-menu-item">
          <u>H</u>elp
        </div>
      </div>
      <div className="paint-body">
        <div className="paint-toolbox">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`paint-tool${currentTool === tool.id ? ' active' : ''}`}
              title={tool.title}
              onClick={() => selectTool(tool.id)}
            >
              <span
                className="paint-tool-icon"
                style={'iconStyle' in tool ? (tool.iconStyle as React.CSSProperties) : undefined}
              >
                {tool.icon}
              </span>
            </button>
          ))}
        </div>
        <div className="paint-canvas-container">
          <div className="paint-canvas-wrap" style={{ width: canvasWidth, height: canvasHeight }}>
            <canvas
              ref={canvasRef}
              id="paint-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div
              className="paint-canvas-handle e"
              onMouseDown={handleCanvasResize('e')}
              role="separator"
              aria-label="Resize canvas width"
            />
            <div
              className="paint-canvas-handle s"
              onMouseDown={handleCanvasResize('s')}
              role="separator"
              aria-label="Resize canvas height"
            />
            <div
              className="paint-canvas-handle se"
              onMouseDown={handleCanvasResize('se')}
              role="separator"
              aria-label="Resize canvas"
            />
          </div>
        </div>
      </div>
      <div className="paint-bottom">
        <div className="paint-color-box">
          <div className="paint-selected-colors">
            <div className="paint-color-primary" style={{ backgroundColor: primaryColor }} />
            <div className="paint-color-secondary" style={{ backgroundColor: secondaryColor }} />
          </div>
          <div className="paint-palette">
            {COLORS.map((color) => (
              <div
                key={color}
                className="paint-color"
                style={{ backgroundColor: color }}
                onMouseDown={(e) => handleColorClick(color, e)}
                onContextMenu={(e) => e.preventDefault()}
              />
            ))}
          </div>
        </div>
        <div className="paint-status-bar">
          <div className="paint-status-text">{statusText}</div>
          <div className="paint-status-coord">{coordText}</div>
        </div>
      </div>
    </>
  );
}
