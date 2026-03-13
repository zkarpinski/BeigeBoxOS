/**
 * Defrag - Windows 98 Theme
 */
(function() {
    'use strict';

    const STATE_FREE = 0;
    const STATE_UNOPT = 1; // Unoptimized data (cyan)
    const STATE_OPT = 2;   // Optimized data (blue)
    const STATE_READING = 3; // Reading (red)
    const STATE_WRITING = 4; // Writing (red)

    // ~25 rows of 59 columns in screenshot approx
    const COLS = 59;
    const ROWS = 25;
    const TOTAL_BLOCKS = COLS * ROWS;
    const DEFRAG_INTERVAL = 30; // ms per step

    const Defrag98 = {
        blocks: [],
        elements: [],
        currentPos: 0,
        running: false,
        paused: false,
        timerId: null,
        percent: 0,

        init: function() {
            this.gridEl = document.getElementById('defrag-grid');
            this.statusTextEl = document.getElementById('defrag-status-text');
            this.percentTextEl = document.getElementById('defrag-percent-text');
            this.progressBarEl = document.getElementById('defrag-progress-bar');

            this.btnStart = document.getElementById('defrag-btn-start');
            this.btnStop = document.getElementById('defrag-btn-stop');
            this.btnPause = document.getElementById('defrag-btn-pause');
            this.btnLegend = document.getElementById('defrag-btn-legend');
            this.btnDetails = document.getElementById('defrag-btn-details');

            if (!this.gridEl) return;

            // Generate initial state
            this.reset();

            // Bind events
            this.btnStart.addEventListener('click', () => this.start());
            this.btnStop.addEventListener('click', () => this.stop());
            this.btnPause.addEventListener('click', () => this.togglePause());
            this.btnDetails.addEventListener('click', () => this.toggleDetails());

            this.btnLegend.addEventListener('click', () => {
                // Future enhancement: show legend dialog
            });
        },

        reset: function() {
            this.blocks = [];
            this.elements = [];
            this.currentPos = 0;
            this.percent = 0;
            this.gridEl.innerHTML = '';

            // To emulate the picture, we have mostly blue at the top, cyan at bottom, and a boundary
            // where red runs across
            for (let i = 0; i < TOTAL_BLOCKS; i++) {
                let state;
                const rand = Math.random();

                if (i < TOTAL_BLOCKS * 0.4) {
                    state = STATE_OPT; // mostly blue
                } else {
                    state = STATE_UNOPT; // mostly cyan
                }

                // Add some random unoptimized in blue area and blue in cyan area
                if (Math.random() < 0.05) {
                    state = state === STATE_OPT ? STATE_UNOPT : STATE_OPT;
                }

                this.blocks.push(state);

                const el = document.createElement('div');
                el.className = 'defrag-block';
                this.updateClass(el, state);
                this.elements.push(el);
                this.gridEl.appendChild(el);
            }

            // Set currentPos to around 40% to match screenshot
            this.currentPos = Math.floor(TOTAL_BLOCKS * 0.4);
            this.percent = Math.floor((this.currentPos / TOTAL_BLOCKS) * 100);

            this.updateUI();
            if (this.statusTextEl) this.statusTextEl.textContent = 'Ready to defragment.';
        },

        updateClass: function(el, state) {
            el.className = 'defrag-block';
            if (state === STATE_UNOPT) el.classList.add('unoptimized');
            else if (state === STATE_OPT) el.classList.add('optimized');
            else if (state === STATE_READING) el.classList.add('reading');
            else if (state === STATE_WRITING) el.classList.add('writing');
            else el.classList.add('free');
        },

        start: function() {
            if (this.running && !this.paused) return;
            if (this.currentPos >= TOTAL_BLOCKS) this.reset();

            this.running = true;
            this.paused = false;
            this.btnPause.textContent = 'Pause';
            this.statusTextEl.textContent = 'Defragmenting file system...';

            this.timerId = setInterval(() => this.step(), DEFRAG_INTERVAL);
        },

        stop: function() {
            if (!this.running) return;
            this.running = false;
            this.paused = false;
            clearInterval(this.timerId);
            this.statusTextEl.textContent = 'Defragmentation stopped.';

            // Clean up red blocks
            const batchSize = 5;
            const prevStart = this.currentPos - batchSize;
            if (prevStart >= 0) {
                for (let i = prevStart; i < this.currentPos; i++) {
                    if (this.blocks[i] === STATE_READING || this.blocks[i] === STATE_WRITING) {
                        this.blocks[i] = STATE_OPT;
                        this.updateClass(this.elements[i], STATE_OPT);
                    }
                }
            }
        },

        togglePause: function() {
            if (!this.running) {
                this.start();
                return;
            }
            if (this.paused) {
                this.paused = false;
                this.btnPause.textContent = 'Pause';
                this.statusTextEl.textContent = 'Defragmenting file system...';
                this.timerId = setInterval(() => this.step(), DEFRAG_INTERVAL);
            } else {
                this.paused = true;
                this.btnPause.textContent = 'Resume';
                this.statusTextEl.textContent = 'Defragmentation paused.';
                clearInterval(this.timerId);
            }
        },

        toggleDetails: function() {
            const win = document.getElementById('defrag-window');
            if (win.classList.contains('hide-details')) {
                win.classList.remove('hide-details');
                this.btnDetails.textContent = 'Hide Details';
            } else {
                win.classList.add('hide-details');
                this.btnDetails.textContent = 'Show Details';
            }
        },

        step: function() {
            if (this.currentPos >= TOTAL_BLOCKS) {
                this.stop();
                this.percent = 100;
                this.statusTextEl.textContent = 'Defragmentation complete.';
                this.updateUI();
                return;
            }

            // In typical win98 defrag, a block of 5-10 clusters goes red at once, then blue
            // Let's do batches of 5
            const batchSize = 5;

            // Revert prev batch
            const prevStart = this.currentPos - batchSize;
            if (prevStart >= 0) {
                for (let i = prevStart; i < this.currentPos; i++) {
                    this.blocks[i] = STATE_OPT;
                    this.updateClass(this.elements[i], STATE_OPT);
                }
            }

            // Animate current batch
            const end = Math.min(this.currentPos + batchSize, TOTAL_BLOCKS);
            for (let i = this.currentPos; i < end; i++) {
                this.blocks[i] = STATE_READING;
                this.updateClass(this.elements[i], STATE_READING);
            }

            this.currentPos += batchSize;
            this.percent = Math.floor((this.currentPos / TOTAL_BLOCKS) * 100);
            this.updateUI();
        },

        updateUI: function() {
            this.percentTextEl.textContent = `${this.percent}% Complete`;
            this.progressBarEl.style.width = `${this.percent}%`;
        }
    };

    window.Defrag98 = Defrag98;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Defrag98.init());
    } else {
        Defrag98.init();
    }
})();