/**
 * Minesweeper Game Logic
 */
(function () {
    'use strict';

    const gridEl = document.getElementById('ms-grid');
    const faceBtn = document.getElementById('ms-face');
    const mineCountEl = document.getElementById('ms-mine-count');
    const timerEl = document.getElementById('ms-timer');

    if (!gridEl || !faceBtn || !mineCountEl || !timerEl) return;

    let difficulty = 'beginner';
    const difficulties = {
        beginner: { w: 9, h: 9, mines: 10 },
        intermediate: { w: 16, h: 16, mines: 40 },
        expert: { w: 30, h: 16, mines: 99 }
    };

    let board = [];
    let state = 'ready'; // ready, playing, lost, won
    let timer = 0;
    let timerInterval = null;
    let flags = 0;
    let revealedCount = 0;
    let useMarks = true;

    // Mouse state
    let leftDown = false;
    let rightDown = false;
    let pressedCell = null;
    let chordingCells = [];

    function initGame() {
        stopTimer();
        state = 'ready';
        timer = 0;
        flags = 0;
        revealedCount = 0;
        leftDown = false;
        rightDown = false;
        pressedCell = null;
        chordingCells = [];

        updateTimerDisplay();
        updateMineCountDisplay();
        setFace('smile');

        const { w, h } = difficulties[difficulty];

        // Setup Grid
        gridEl.style.gridTemplateColumns = `repeat(${w}, 16px)`;
        gridEl.innerHTML = '';
        board = Array(h).fill(null).map(() => Array(w).fill(null));

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                gridEl.appendChild(cell);

                board[y][x] = {
                    x, y,
                    isMine: false,
                    isRevealed: false,
                    flagState: 0, // 0: none, 1: flag, 2: question
                    neighborMines: 0,
                    el: cell
                };

                cell.addEventListener('mousedown', handleCellMouseDown);
                cell.addEventListener('mouseenter', handleCellMouseEnter);
                cell.addEventListener('mouseleave', handleCellMouseLeave);
            }
        }
    }

    function placeMines(safeX, safeY) {
        const { w, h, mines } = difficulties[difficulty];
        let minesPlaced = 0;

        while (minesPlaced < mines) {
            const x = Math.floor(Math.random() * w);
            const y = Math.floor(Math.random() * h);

            // Avoid safe spot and its immediate neighbors (to ensure starting with an opening)
            if (Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1) continue;

            if (!board[y][x].isMine) {
                board[y][x].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate neighbors
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (!board[y][x].isMine) {
                    let count = 0;
                    getNeighbors(x, y).forEach(n => {
                        if (n.isMine) count++;
                    });
                    board[y][x].neighborMines = count;
                }
            }
        }
    }

    function getNeighbors(x, y) {
        const neighbors = [];
        const { w, h } = difficulties[difficulty];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    neighbors.push(board[ny][nx]);
                }
            }
        }
        return neighbors;
    }

    function startTimer() {
        if (state === 'ready') {
            state = 'playing';
            timerInterval = setInterval(() => {
                if (timer < 999) {
                    timer++;
                    updateTimerDisplay();
                }
            }, 1000);
        }
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        timerEl.textContent = timer.toString().padStart(3, '0');
    }

    function updateMineCountDisplay() {
        const remaining = difficulties[difficulty].mines - flags;
        let str = remaining.toString();
        if (remaining >= 0) {
            str = str.padStart(3, '0');
        } else {
            // Negative numbers e.g. "-01"
            str = '-' + Math.abs(remaining).toString().padStart(2, '0');
        }
        mineCountEl.textContent = str;
    }

    function setFace(type) {
        const icon = faceBtn.querySelector('.minesweeper-face-icon');
        icon.className = `minesweeper-face-icon face-${type}`;
    }

    function handleCellMouseDown(e) {
        if (state === 'lost' || state === 'won') return;

        const cell = getBoardCell(e.target);
        if (!cell) return;

        if (e.button === 0) leftDown = true;
        if (e.button === 2) rightDown = true;

        // Middle click or Left+Right click for chording
        if (e.button === 1 || (leftDown && rightDown)) {
            leftDown = true;
            rightDown = true;
            chordingCells = getNeighbors(cell.x, cell.y).filter(n => !n.isRevealed && n.flagState !== 1);
            if (!cell.isRevealed && cell.flagState !== 1) chordingCells.push(cell);
            chordingCells.forEach(n => n.el.classList.add('pressed'));
            setFace('surprise');
            return;
        }

        if (leftDown && !rightDown) {
            if (!cell.isRevealed && cell.flagState !== 1) {
                pressedCell = cell;
                pressedCell.el.classList.add('pressed');
                setFace('surprise');
            }
        } else if (rightDown && !leftDown) {
            toggleFlag(cell);
        }
    }

    function handleCellMouseEnter(e) {
        if (state === 'lost' || state === 'won') return;
        const cell = getBoardCell(e.target);
        if (!cell) return;

        if (leftDown && rightDown) {
            chordingCells.forEach(n => n.el.classList.remove('pressed'));
            chordingCells = getNeighbors(cell.x, cell.y).filter(n => !n.isRevealed && n.flagState !== 1);
            if (!cell.isRevealed && cell.flagState !== 1) chordingCells.push(cell);
            chordingCells.forEach(n => n.el.classList.add('pressed'));
        } else if (leftDown && !rightDown) {
            if (pressedCell) pressedCell.el.classList.remove('pressed');
            if (!cell.isRevealed && cell.flagState !== 1) {
                pressedCell = cell;
                pressedCell.el.classList.add('pressed');
            } else {
                pressedCell = null;
            }
        }
    }

    function handleCellMouseLeave(e) {
        if (state === 'lost' || state === 'won') return;
        if (pressedCell) {
            pressedCell.el.classList.remove('pressed');
            pressedCell = null;
        }
        if (leftDown && rightDown) {
            chordingCells.forEach(n => n.el.classList.remove('pressed'));
            chordingCells = [];
        }
    }

    function handleMouseUp(e) {
        if (state === 'lost' || state === 'won') {
            leftDown = false;
            rightDown = false;
            return;
        }

        const wasChording = leftDown && rightDown;

        if (e.button === 0) leftDown = false;
        if (e.button === 2) rightDown = false;

        setFace('smile');

        if (wasChording) {
            chordingCells.forEach(n => n.el.classList.remove('pressed'));
            if (!leftDown && !rightDown) {
                const target = document.elementFromPoint(e.clientX, e.clientY);
                const cell = getBoardCell(target);
                if (cell && cell.isRevealed && cell.neighborMines > 0) {
                    chordCell(cell);
                }
            }
            chordingCells = [];
            return;
        }

        if (e.button === 0 && pressedCell) {
            pressedCell.el.classList.remove('pressed');
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (target === pressedCell.el) {
                revealCell(pressedCell);
            }
            pressedCell = null;
        }
    }

    function getBoardCell(el) {
        if (!el || !el.classList.contains('ms-cell')) return null;
        const x = parseInt(el.dataset.x, 10);
        const y = parseInt(el.dataset.y, 10);
        return board[y][x];
    }

    function toggleFlag(cell) {
        if (cell.isRevealed) return;

        if (cell.flagState === 0) {
            cell.flagState = 1;
            cell.el.classList.add('flag');
            flags++;
        } else if (cell.flagState === 1) {
            cell.el.classList.remove('flag');
            if (useMarks) {
                cell.flagState = 2;
                cell.el.classList.add('question');
            } else {
                cell.flagState = 0;
            }
            flags--;
        } else if (cell.flagState === 2) {
            cell.flagState = 0;
            cell.el.classList.remove('question');
        }
        updateMineCountDisplay();
    }

    function revealCell(cell) {
        if (cell.isRevealed || cell.flagState === 1) return;

        if (state === 'ready') {
            placeMines(cell.x, cell.y);
            startTimer();
        }

        cell.isRevealed = true;
        cell.el.classList.add('revealed');
        if (cell.flagState === 2) {
            cell.el.classList.remove('question');
            cell.flagState = 0;
        }

        if (cell.isMine) {
            cell.el.classList.add('mine-red');
            gameOver(false);
            return;
        }

        revealedCount++;
        if (cell.neighborMines > 0) {
            cell.el.textContent = cell.neighborMines;
            cell.el.dataset.num = cell.neighborMines;
        } else {
            // Flood fill for 0
            getNeighbors(cell.x, cell.y).forEach(n => {
                if (!n.isRevealed && n.flagState !== 1) {
                    revealCell(n);
                }
            });
        }

        checkWin();
    }

    function chordCell(cell) {
        const neighbors = getNeighbors(cell.x, cell.y);
        let flagCount = 0;
        neighbors.forEach(n => {
            if (n.flagState === 1) flagCount++;
        });

        if (flagCount === cell.neighborMines) {
            let hitMine = false;
            neighbors.forEach(n => {
                if (!n.isRevealed && n.flagState !== 1) {
                    if (n.flagState === 2) {
                        n.el.classList.remove('question');
                        n.flagState = 0;
                    }
                    if (n.isMine) {
                        // Don't explode immediately, mark it red but process others too
                        n.isRevealed = true;
                        n.el.classList.add('mine-red');
                        hitMine = true;
                    } else {
                        revealCell(n);
                    }
                }
            });
            if (hitMine) gameOver(false);
        }
    }

    function gameOver(won) {
        state = won ? 'won' : 'lost';
        stopTimer();
        setFace(won ? 'win' : 'dead');

        const { w, h } = difficulties[difficulty];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const cell = board[y][x];
                if (won) {
                    if (cell.isMine && cell.flagState !== 1) {
                        cell.flagState = 1;
                        cell.el.classList.add('flag');
                        flags++;
                    }
                } else {
                    if (cell.isMine && cell.flagState !== 1 && !cell.isRevealed) {
                        cell.el.classList.add('mine');
                    } else if (!cell.isMine && cell.flagState === 1) {
                        cell.el.classList.remove('flag');
                        cell.el.classList.add('mine-cross');
                    }
                }
            }
        }
        if (won) updateMineCountDisplay();
    }

    function checkWin() {
        const { w, h, mines } = difficulties[difficulty];
        if (revealedCount === (w * h) - mines) {
            gameOver(true);
        }
    }

    function setDifficulty(level) {
        difficulty = level;
        document.getElementById('ms-menu-beginner').classList.toggle('checked', level === 'beginner');
        document.getElementById('ms-menu-intermediate').classList.toggle('checked', level === 'intermediate');
        document.getElementById('ms-menu-expert').classList.toggle('checked', level === 'expert');
        initGame();

        // Resize window to fit grid + chrome (approximate padding/borders)
        const win = document.getElementById('minesweeper-window');
        if (win) {
            // Need a tiny delay for DOM to settle maybe? Or just calculate exact sizes
            const { w, h } = difficulties[difficulty];
            const pxWidth = (w * 16) + 20; // 16px per cell + borders/padding
            const pxHeight = (h * 16) + 100; // grid + header + menu + titlebar
            win.style.width = pxWidth + 'px';
            win.style.height = pxHeight + 'px';
        }
    }

    // Event Listeners
    faceBtn.addEventListener('click', initGame);
    faceBtn.addEventListener('mousedown', () => faceBtn.classList.add('pressed'));
    faceBtn.addEventListener('mouseup', () => faceBtn.classList.remove('pressed'));
    faceBtn.addEventListener('mouseleave', () => faceBtn.classList.remove('pressed'));

    document.addEventListener('mouseup', handleMouseUp);

    // Prevent context menu on grid
    gridEl.addEventListener('contextmenu', e => e.preventDefault());

    // Menus
    document.getElementById('ms-menu-new').addEventListener('click', initGame);
    document.getElementById('ms-menu-beginner').addEventListener('click', () => setDifficulty('beginner'));
    document.getElementById('ms-menu-intermediate').addEventListener('click', () => setDifficulty('intermediate'));
    document.getElementById('ms-menu-expert').addEventListener('click', () => setDifficulty('expert'));

    const marksBtn = document.getElementById('ms-menu-marks');
    marksBtn.addEventListener('click', () => {
        useMarks = !useMarks;
        marksBtn.classList.toggle('checked', useMarks);
    });

    document.getElementById('ms-menu-exit').addEventListener('click', () => {
        if (window.Windows97) {
            window.Windows97.hideApp('minesweeper');
        } else {
            document.getElementById('minesweeper-window').style.display = 'none';
        }
    });

    // Handle F2 for new game
    document.addEventListener('keydown', (e) => {
        const win = document.getElementById('minesweeper-window');
        if (e.key === 'F2' && win && !win.classList.contains('app-window-hidden')) {
            initGame();
        }
    });

    // Expose for window.js resizing if needed
    window.Minesweeper98 = {
        init: () => {
            setDifficulty(difficulty); // Force initial resize
        }
    };

})();
