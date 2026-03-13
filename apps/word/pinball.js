/**
 * Word 97 Pinball easter egg - fully playable pinball with credits window.
 * Controls: Z = left flipper, M = right flipper, Esc = exit.
 * Launch: Start menu "Word 97 Pinball", or Help > About Microsoft Word then Ctrl+Shift+click the Word icon.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('pinball-canvas');
  const overlay = document.getElementById('pinball-overlay');
  if (!canvas || !overlay) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const TABLE = {
    left: 50,
    right: 370,
    top: 20,
    bottom: 365,
    pinchX: 210,
    pinchY: 200,
    plungerLeft: 370,
    plungerRight: 430,
  };

  function getWalls() {
    const L = TABLE.left, R = TABLE.right, T = TABLE.top, B = TABLE.bottom;
    const PX = TABLE.pinchX, PY = TABLE.pinchY, PR = TABLE.plungerRight;
    return [
      [L, T, PX, PY], [PX, PY, R, PY], [R, PY, R, B], [R, B, PX, B],
      [PX, B, L, B], [L, B, L, T], [L, T, R, T], [R, T, PR, T],
      [PR, T, PR, B], [PR, B, R, B],
    ];
  }

  const BUMPERS = [
    { x: 240, y: 130, r: 14 }, { x: 200, y: 95, r: 14 },
    { x: 280, y: 95, r: 14 }, { x: 240, y: 65, r: 14 },
  ];

  const GRAVITY = 0.35, DAMPING = 0.998, BALL_R = 6, FLIPPER_LEN = 52;
  const FLIPPER_LEFT_REST = (Math.PI * 10) / 180;
  const FLIPPER_RIGHT_REST = (Math.PI * -10) / 180;
  const FLIPPER_UP_ANGLE = (Math.PI * -35) / 180;

  let ball = { x: W / 2, y: 280, vx: 0, vy: 0 };
  let leftFlipperAngle = FLIPPER_LEFT_REST, rightFlipperAngle = FLIPPER_RIGHT_REST;
  let leftFlipperHeld = false, rightFlipperHeld = false;
  let animId = null, creditsScrollId = null;

  const leftFlipperPivot = { x: 130, y: 358 }, rightFlipperPivot = { x: 290, y: 358 };

  function flipperEnd(pivot, angle) {
    return {
      x: pivot.x + FLIPPER_LEN * Math.cos(angle),
      y: pivot.y + FLIPPER_LEN * Math.sin(angle),
    };
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1e-6;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
    const nx = x1 + t * dx - px, ny = y1 + t * dy - py;
    return Math.hypot(nx, ny);
  }

  function nearestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1e-6;
    let t = ((px - x1) * dx + (py - y1) * dy) / (len * len);
    t = Math.max(0, Math.min(1, t));
    return { x: x1 + t * dx, y: y1 + t * dy };
  }

  function bounceOffWall(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1e-6;
    const nx = dy / len, ny = -dx / len;
    const pt = nearestPointOnSegment(ball.x, ball.y, x1, y1, x2, y2);
    const dist = Math.hypot(ball.x - pt.x, ball.y - pt.y);
    if (dist >= BALL_R) return;
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot >= 0) return;
    ball.vx -= 2 * dot * nx;
    ball.vy -= 2 * dot * ny;
    ball.x = pt.x + nx * (BALL_R + 1);
    ball.y = pt.y + ny * (BALL_R + 1);
  }

  function tick() {
    ball.vy += GRAVITY;
    ball.vx *= DAMPING;
    ball.vy *= DAMPING;
    ball.x += ball.vx;
    ball.y += ball.vy;
    getWalls().forEach(([x1, y1, x2, y2]) => bounceOffWall(x1, y1, x2, y2));
    BUMPERS.forEach((b) => {
      const d = Math.hypot(ball.x - b.x, ball.y - b.y);
      if (d < BALL_R + b.r) {
        const nx = (ball.x - b.x) / d || 0, ny = (ball.y - b.y) / d || 0;
        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;
          ball.vx *= 1.05;
          ball.vy *= 1.05;
        }
        ball.x = b.x + (BALL_R + b.r + 1) * nx;
        ball.y = b.y + (BALL_R + b.r + 1) * ny;
      }
    });
    const leftEnd = flipperEnd(leftFlipperPivot, leftFlipperAngle);
    const rightEnd = flipperEnd(rightFlipperPivot, rightFlipperAngle);
    [[leftFlipperPivot, leftEnd, leftFlipperAngle], [rightFlipperPivot, rightEnd, rightFlipperAngle]].forEach(([pivot, end]) => {
      const d = distToSegment(ball.x, ball.y, pivot.x, pivot.y, end.x, end.y);
      if (d < BALL_R) {
        const nx = (ball.x - (pivot.x + end.x) / 2), ny = (ball.y - (pivot.y + end.y) / 2);
        const len = Math.hypot(nx, ny) || 1e-6;
        const nxx = nx / len, nyy = ny / len;
        const dot = ball.vx * nxx + ball.vy * nyy;
        if (dot < 0) {
          ball.vx -= 2 * dot * nxx;
          ball.vy -= 2 * dot * nyy;
          ball.vy -= 2;
        }
        ball.x += (BALL_R - d + 1) * nxx;
        ball.y += (BALL_R - d + 1) * nyy;
      }
    });
    if (ball.y > H + 20) {
      ball.x = W / 2;
      ball.y = 280;
      ball.vx = 0;
      ball.vy = 0;
    }
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const L = TABLE.left, R = TABLE.right, T = TABLE.top, B = TABLE.bottom;
    const PX = TABLE.pinchX, PY = TABLE.pinchY, PR = TABLE.plungerRight;
    ctx.moveTo(L, T);
    ctx.lineTo(PX, PY);
    ctx.lineTo(R, PY);
    ctx.lineTo(R, B);
    ctx.lineTo(PR, B);
    ctx.lineTo(PR, T);
    ctx.lineTo(R, T);
    ctx.lineTo(R, PY);
    ctx.lineTo(PX, B);
    ctx.lineTo(L, B);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#00f';
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 1.5;
    BUMPERS.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    const leftEnd = flipperEnd(leftFlipperPivot, leftFlipperAngle);
    const rightEnd = flipperEnd(rightFlipperPivot, rightFlipperAngle);
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftFlipperPivot.x, leftFlipperPivot.y);
    ctx.lineTo(leftEnd.x, leftEnd.y);
    ctx.moveTo(rightFlipperPivot.x, rightFlipperPivot.y);
    ctx.lineTo(rightEnd.x, rightEnd.y);
    ctx.stroke();
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(leftFlipperPivot.x, leftFlipperPivot.y, 4, 0, Math.PI * 2);
    ctx.arc(rightFlipperPivot.x, rightFlipperPivot.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b0b0b0';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateFlippers() {
    leftFlipperAngle += (leftFlipperHeld ? FLIPPER_UP_ANGLE : FLIPPER_LEFT_REST - leftFlipperAngle) * 0.25;
    rightFlipperAngle += (rightFlipperHeld ? FLIPPER_UP_ANGLE : FLIPPER_RIGHT_REST - rightFlipperAngle) * 0.25;
  }

  function gameLoop() {
    updateFlippers();
    tick();
    draw();
    animId = requestAnimationFrame(gameLoop);
  }

  function startCreditsScroll() {
    const list = document.getElementById('pinball-credits-list');
    if (!list) return;
    let y = 0;
    function scroll() {
      y += 0.3;
      list.style.transform = 'translateY(' + (-y % (list.offsetHeight + 40)) + 'px)';
      creditsScrollId = requestAnimationFrame(scroll);
    }
    scroll();
  }

  function stopCreditsScroll() {
    if (creditsScrollId != null) cancelAnimationFrame(creditsScrollId);
    creditsScrollId = null;
  }

  function openPinball() {
    overlay.hidden = false;
    ball = { x: W / 2, y: 280, vx: 0, vy: 0 };
    leftFlipperAngle = FLIPPER_LEFT_REST;
    rightFlipperAngle = FLIPPER_RIGHT_REST;
    leftFlipperHeld = false;
    rightFlipperHeld = false;
    startCreditsScroll();
    gameLoop();
    overlay.focus();
  }

  function closePinball() {
    overlay.hidden = true;
    if (animId != null) cancelAnimationFrame(animId);
    animId = null;
    stopCreditsScroll();
  }

  overlay.addEventListener('keydown', (e) => {
    if (e.code === 'KeyZ') leftFlipperHeld = true;
    if (e.code === 'KeyM') rightFlipperHeld = true;
    if (e.key === 'Escape') {
      closePinball();
      e.preventDefault();
    }
  });
  overlay.addEventListener('keyup', (e) => {
    if (e.code === 'KeyZ') leftFlipperHeld = false;
    if (e.code === 'KeyM') rightFlipperHeld = false;
  });

  document.getElementById('start-pinball')?.addEventListener('click', () => {
    const startMenu = document.getElementById('start-menu');
    if (startMenu) startMenu.classList.add('hidden');
    openPinball();
    overlay.focus();
  });

  window.openPinball = openPinball;
  window.closePinball = closePinball;
})();
