/**
 * MS Paint 98 Clone Logic
 */
(function() {
    'use strict';

    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const colors = [
        '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000',
        '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'
    ];

    window.Paint98 = {
        canvas: canvas,
        ctx: ctx,
        currentTool: 'pencil',
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        isDrawing: false,
        startX: 0,
        startY: 0,
        tempCanvas: document.createElement('canvas'),
        tempCtx: null,
        history: [],
        historyStep: -1,

        init: function() {
            this.tempCtx = this.tempCanvas.getContext('2d');
            this.resize(400, 300);
            this.clearCanvas();
            this.setupPalette();
            this.setupTools();
            this.setupEvents();
            this.saveState();
        },

        resize: function(width, height) {
            const oldData = ctx.getImageData(0, 0, canvas.width || 1, canvas.height || 1);
            canvas.width = width;
            canvas.height = height;
            this.tempCanvas.width = width;
            this.tempCanvas.height = height;
            this.clearCanvas();
            if (oldData && oldData.width > 1) {
                ctx.putImageData(oldData, 0, 0);
            }
        },

        clearCanvas: function() {
            ctx.fillStyle = this.secondaryColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        },

        setupPalette: function() {
            const paletteEl = document.getElementById('paint-palette');
            const primaryEl = document.getElementById('paint-color-primary');
            const secondaryEl = document.getElementById('paint-color-secondary');

            if (!paletteEl || !primaryEl || !secondaryEl) return;

            paletteEl.innerHTML = '';
            colors.forEach(color => {
                const el = document.createElement('div');
                el.className = 'paint-color';
                el.style.backgroundColor = color;

                el.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { // Left click
                        this.primaryColor = color;
                        primaryEl.style.backgroundColor = color;
                    } else if (e.button === 2) { // Right click
                        this.secondaryColor = color;
                        secondaryEl.style.backgroundColor = color;
                    }
                });

                el.addEventListener('contextmenu', e => e.preventDefault());
                paletteEl.appendChild(el);
            });
        },

        setupTools: function() {
            const tools = document.querySelectorAll('.paint-tool');
            tools.forEach(tool => {
                tool.addEventListener('click', (e) => {
                    tools.forEach(t => t.classList.remove('active'));
                    tool.classList.add('active');
                    this.currentTool = tool.dataset.tool;
                    const statusText = document.getElementById('paint-status-text');
                    if (statusText) statusText.textContent = `Selected tool: ${this.currentTool}`;
                });
            });
        },

        setupEvents: function() {
            canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
            canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
            document.addEventListener('mouseup', this.onMouseUp.bind(this)); // Bind to document to catch outside release
            canvas.addEventListener('contextmenu', e => e.preventDefault());
        },

        getMousePos: function(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: Math.floor((e.clientX - rect.left) / (rect.width / canvas.width)),
                y: Math.floor((e.clientY - rect.top) / (rect.height / canvas.height))
            };
        },

        onMouseDown: function(e) {
            this.isDrawing = true;
            const pos = this.getMousePos(e);
            this.startX = pos.x;
            this.startY = pos.y;

            const color = (e.button === 2) ? this.secondaryColor : this.primaryColor;

            this.tempCtx.clearRect(0, 0, canvas.width, canvas.height);
            this.tempCtx.drawImage(canvas, 0, 0);

            this.draw(pos.x, pos.y, color, true);
        },

        onMouseMove: function(e) {
            const pos = this.getMousePos(e);
            const coordEl = document.getElementById('paint-status-coord');
            if (coordEl) coordEl.textContent = `${pos.x}, ${pos.y}`;

            if (!this.isDrawing) return;

            const color = (e.buttons === 2) ? this.secondaryColor : this.primaryColor;
            this.draw(pos.x, pos.y, color, false);
        },

        onMouseUp: function(e) {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.saveState();
            }
        },

        draw: function(x, y, color, isFirstPoint) {
            ctx.fillStyle = color;
            ctx.strokeStyle = color;

            if (this.currentTool === 'pencil') {
                ctx.lineWidth = 1;
                ctx.lineCap = 'square';

                if (isFirstPoint) {
                    ctx.fillRect(x, y, 1, 1);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }

                this.startX = x;
                this.startY = y;
            }
            else if (this.currentTool === 'brush') {
                const brushSize = 4;
                if (isFirstPoint) {
                    ctx.beginPath();
                    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.lineWidth = brushSize;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }

                this.startX = x;
                this.startY = y;
            }
            else if (this.currentTool === 'eraser') {
                const eraserSize = 8;
                const eraseColor = this.secondaryColor;
                ctx.fillStyle = eraseColor;
                ctx.strokeStyle = eraseColor;

                if (isFirstPoint) {
                    ctx.fillRect(x - eraserSize / 2, y - eraserSize / 2, eraserSize, eraserSize);
                } else {
                    ctx.lineWidth = eraserSize;
                    ctx.lineCap = 'square';
                    ctx.lineJoin = 'miter';
                    ctx.beginPath();
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }

                this.startX = x;
                this.startY = y;
            }
            else if (this.currentTool === 'line') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(this.tempCanvas, 0, 0);

                ctx.lineWidth = 1;
                ctx.lineCap = 'square';
                ctx.beginPath();
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            else if (this.currentTool === 'rectangle') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(this.tempCanvas, 0, 0);

                ctx.lineWidth = 1;
                ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
            }
            else if (this.currentTool === 'ellipse') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(this.tempCanvas, 0, 0);

                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(
                    this.startX + (x - this.startX) / 2,
                    this.startY + (y - this.startY) / 2,
                    Math.abs((x - this.startX) / 2),
                    Math.abs((y - this.startY) / 2),
                    0, 0, 2 * Math.PI
                );
                ctx.stroke();
            }
            else if (this.currentTool === 'fill' && isFirstPoint) {
                this.floodFill(x, y, color);
            }
        },

        floodFill: function(startX, startY, fillColor) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Helper to get pixel index
            const getIndex = (x, y) => (y * canvas.width + x) * 4;

            const startIdx = getIndex(startX, startY);
            const startR = data[startIdx];
            const startG = data[startIdx + 1];
            const startB = data[startIdx + 2];
            const startA = data[startIdx + 3];

            // Parse fillColor (assumes #RRGGBB format)
            const r = parseInt(fillColor.slice(1, 3), 16);
            const g = parseInt(fillColor.slice(3, 5), 16);
            const b = parseInt(fillColor.slice(5, 7), 16);
            const a = 255;

            if (startR === r && startG === g && startB === b && startA === a) return;

            const matchStartColor = (idx) => {
                return data[idx] === startR && data[idx + 1] === startG && data[idx + 2] === startB && data[idx + 3] === startA;
            };

            const setColor = (idx) => {
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = a;
            };

            const stack = [[startX, startY]];

            while (stack.length > 0) {
                const [x, y] = stack.pop();

                let idx = getIndex(x, y);

                if (!matchStartColor(idx)) continue;

                setColor(idx);

                if (x > 0) stack.push([x - 1, y]);
                if (x < canvas.width - 1) stack.push([x + 1, y]);
                if (y > 0) stack.push([x, y - 1]);
                if (y < canvas.height - 1) stack.push([x, y + 1]);
            }

            ctx.putImageData(imgData, 0, 0);
        },

        saveState: function() {
            this.historyStep++;
            this.history = this.history.slice(0, this.historyStep);
            this.history.push(canvas.toDataURL());
        },

        undo: function() {
            if (this.historyStep > 0) {
                this.historyStep--;
                const img = new Image();
                img.src = this.history[this.historyStep];
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                };
            }
        }
    };

    // Auto-init won't run yet because the canvas isn't in DOM when this parses,
    // it will be called by window.js or a document load event.
})();
