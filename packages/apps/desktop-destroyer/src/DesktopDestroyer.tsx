'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MousePointer2, Hammer, Bug, Flame, Palette, Eraser, Trash2, X } from 'lucide-react';
import { useWindowManager } from '@retro-web/core/context';

type Tool = 'pointer' | 'hammer' | 'ants' | 'flamethrower' | 'paint' | 'repair';

interface DesktopDestroyerProps {
  skin?: 'winxp' | 'karpos';
}

interface Ant {
  x: number;
  y: number;
  angle: number;
}

export function DesktopDestroyer({ skin = 'winxp' }: DesktopDestroyerProps) {
  const [activeTool, setActiveTool] = useState<Tool>('hammer');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationCanvasRef = useRef<HTMLCanvasElement>(null);
  const { hideApp } = useWindowManager();

  // Ants state managed in a ref for performance
  const antsRef = useRef<Ant[]>([]);
  const particlesRef = useRef<any[]>([]);
  const isMouseDownRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fireSoundRef = useRef<any>(null);

  const tools: Tool[] = ['pointer', 'hammer', 'ants', 'flamethrower', 'paint', 'repair'];

  const rotateTool = useCallback(() => {
    setActiveTool((prev) => {
      const index = tools.indexOf(prev);
      return tools[(index + 1) % tools.length];
    });
  }, [tools]);

  // Audio helper
  const playSound = (type: 'hammer' | 'fire' | 'paint' | 'clear') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'hammer') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'fire') {
      // Noise-like sound for fire
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } else if (type === 'paint') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'clear') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // ONLY hijack context menu if we are not in pointer mode
      if (activeTool !== 'pointer') {
        e.preventDefault();
        rotateTool();
        playSound('paint'); // feedback for tool switch
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [rotateTool, activeTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const animCanvas = animationCanvasRef.current;
    if (!canvas || !animCanvas) return;

    const resize = () => {
      const temp = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      animCanvas.width = window.innerWidth;
      animCanvas.height = window.innerHeight;
      if (temp) {
        canvas.getContext('2d')?.putImageData(temp, 0, 0);
      }
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Animation loop for ants
  useEffect(() => {
    let animationFrame: number;
    const animCanvas = animationCanvasRef.current;
    const ctx = animCanvas?.getContext('2d');

    const update = () => {
      if (ctx && animCanvas) {
        ctx.clearRect(0, 0, animCanvas.width, animCanvas.height);
        const damageCtx = canvasRef.current?.getContext('2d');

        // Update Ants
        antsRef.current = antsRef.current.map((ant) => {
          const newAngle = ant.angle + (Math.random() - 0.5) * 0.5;
          const nextX = (ant.x + Math.cos(newAngle) * 2 + animCanvas.width) % animCanvas.width;
          const nextY = (ant.y + Math.sin(newAngle) * 2 + animCanvas.height) % animCanvas.height;

          // Render ant on animation canvas
          ctx.fillStyle = '#000';
          ctx.fillRect(nextX, nextY, 2, 2);

          // Ant "eats" the screen - draw permanent black on damage canvas
          if (damageCtx) {
            damageCtx.fillStyle = '#000';
            damageCtx.fillRect(nextX, nextY, 2, 2);
          }
          return { x: nextX, y: nextY, angle: newAngle };
        });

        // Update Fire Particles
        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.03; // Faster dissipation

          if (p.life > 0) {
            const alpha = p.life;
            ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();

            // Burn the screen - persistent soot
            if (damageCtx && p.life > 0.6) {
              damageCtx.fillStyle = `rgba(0, 0, 0, ${0.05 * p.life})`;
              damageCtx.beginPath();
              damageCtx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
              damageCtx.fill();
            }
            return true;
          }
          return false;
        });
      }
      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    if (activeTool === 'pointer') return;

    const x = e.clientX;
    const y = e.clientY;

    if (activeTool === 'flamethrower') {
      startFireSound();
    }

    handleAction(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || activeTool === 'pointer') return;
    handleAction(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    stopFireSound();
  };

  const handleAction = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Check if we hit an ant with ANY tool (except pointer/repair/ants spawn)
    const HIT_RADIUS = 20;
    const hitAnts = antsRef.current.filter((ant) => {
      const dist = Math.sqrt((ant.x - x) ** 2 + (ant.y - y) ** 2);
      return dist < HIT_RADIUS;
    });

    if (hitAnts.length > 0 && activeTool !== 'ants' && activeTool !== 'repair') {
      hitAnts.forEach((ant) => drawBlood(ctx, ant.x, ant.y));
      antsRef.current = antsRef.current.filter((ant) => !hitAnts.includes(ant));
      if (activeTool === 'hammer') playSound('hammer');
    }

    if (activeTool === 'hammer') {
      drawCracks(ctx, x, y);
      if (hitAnts.length === 0) playSound('hammer');
    } else if (activeTool === 'flamethrower') {
      for (let i = 0; i < 6; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5 - 2,
          life: 1.0,
          size: Math.random() * 20 + 8,
          r: 255,
          g: Math.floor(Math.random() * 180),
          b: 0,
        });
      }
    } else if (activeTool === 'paint') {
      drawPaint(ctx, x, y);
      playSound('paint');
    } else if (activeTool === 'repair') {
      ctx.clearRect(x - 25, y - 25, 50, 50);
    } else if (activeTool === 'ants') {
      for (let i = 0; i < 8; i++) {
        antsRef.current.push({
          x: x + (Math.random() - 0.5) * 25,
          y: y + (Math.random() - 0.5) * 25,
          angle: Math.random() * Math.PI * 2,
        });
      }
    }
  };

  const startFireSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    fireSoundRef.current = { osc, gain };
  };

  const stopFireSound = () => {
    if (fireSoundRef.current) {
      const { osc, gain } = fireSoundRef.current;
      const now = audioContextRef.current?.currentTime || 0;
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      setTimeout(() => {
        try {
          osc.stop();
        } catch {}
      }, 150);
      fireSoundRef.current = null;
    }
  };

  const drawCracks = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      let curX = x;
      let curY = y;
      for (let j = 0; j < 12; j++) {
        curX += (Math.random() - 0.5) * 25;
        curY += (Math.random() - 0.5) * 25;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }
  };

  const drawPaint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawBlood = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = 'rgba(200, 0, 0, 0.95)';
    // Small splatters
    for (let i = 0; i < 12; i++) {
      const rx = x + (Math.random() - 0.5) * 15;
      const ry = y + (Math.random() - 0.5) * 15;
      const size = Math.random() * 3 + 0.5;
      ctx.beginPath();
      ctx.arc(rx, ry, size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Main splatter
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Drip
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 10 + Math.random() * 10);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(200, 0, 0, 0.9)';
    ctx.stroke();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    }
    antsRef.current = [];
    particlesRef.current = [];
    playSound('clear');
  };

  return (
    <div
      className={`desktop-destroyer-overlay skin-${skin}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: activeTool === 'pointer' ? 'none' : 'auto',
        cursor: getCursor(activeTool),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, display: 'block' }} />
      <canvas
        ref={animationCanvasRef}
        style={{ position: 'absolute', top: 0, left: 0, display: 'block', pointerEvents: 'none' }}
      />

      <div
        className="desktop-destroyer-toolbar"
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px',
          padding: '4px',
          background: skin === 'winxp' ? '#f0f0f0' : '#fff',
          border: skin === 'winxp' ? '2px solid #0054E3' : '4px solid #000',
          boxShadow: skin === 'winxp' ? '2px 2px 5px rgba(0,0,0,0.3)' : '8px 8px 0px #000',
          pointerEvents: 'auto',
          zIndex: 10000,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ToolbarButton
          active={activeTool === 'pointer'}
          onClick={() => setActiveTool('pointer')}
          icon={<MousePointer2 size={20} />}
          title="Pointer"
          skin={skin}
        />
        <ToolbarButton
          active={activeTool === 'hammer'}
          onClick={() => setActiveTool('hammer')}
          icon={<Hammer size={20} />}
          title="Hammer"
          skin={skin}
        />
        <ToolbarButton
          active={activeTool === 'ants'}
          onClick={() => setActiveTool('ants')}
          icon={<Bug size={20} />}
          title="Ants"
          skin={skin}
        />
        <ToolbarButton
          active={activeTool === 'flamethrower'}
          onClick={() => setActiveTool('flamethrower')}
          icon={<Flame size={20} />}
          title="Flamethrower"
          skin={skin}
        />
        <ToolbarButton
          active={activeTool === 'paint'}
          onClick={() => setActiveTool('paint')}
          icon={<Palette size={20} />}
          title="Paint"
          skin={skin}
        />
        <div style={{ width: '1px', background: '#ccc', margin: '0 4px' }} />
        <ToolbarButton
          active={activeTool === 'repair'}
          onClick={() => setActiveTool('repair')}
          icon={<Eraser size={20} />}
          title="Repair"
          skin={skin}
        />
        <ToolbarButton
          active={false}
          onClick={handleClear}
          icon={<Trash2 size={20} />}
          title="Clear All"
          skin={skin}
        />
        <ToolbarButton
          active={false}
          onClick={() => hideApp('desktop-destroyer')}
          icon={<X size={20} />}
          title="Close"
          skin={skin}
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .desktop-destroyer-overlay.skin-karpos .desktop-destroyer-toolbar button {
          border: 2px solid #000;
          background: #fff;
          padding: 4px;
          cursor: pointer;
        }
        .desktop-destroyer-overlay.skin-karpos .desktop-destroyer-toolbar button.active {
          background: #000;
          color: #fff;
        }
        .desktop-destroyer-overlay.skin-winxp .desktop-destroyer-toolbar button {
          border: 1px solid #777;
          background: #eee;
          padding: 4px;
          cursor: pointer;
        }
        .desktop-destroyer-overlay.skin-winxp .desktop-destroyer-toolbar button.active {
          background: #ccc;
          box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
        `,
        }}
      />
    </div>
  );
}

function ToolbarButton({ active, onClick, icon, title, skin }: any) {
  return (
    <button
      className={active ? 'active' : ''}
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
      }}
    >
      {icon}
    </button>
  );
}

function getCursor(tool: Tool) {
  switch (tool) {
    case 'pointer':
      return 'default';
    case 'hammer':
      return 'crosshair';
    case 'ants':
      return 'copy';
    case 'flamethrower':
      return 'wait';
    case 'paint':
      return 'cell';
    case 'repair':
      return 'help';
    default:
      return 'default';
  }
}
