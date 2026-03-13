/** @jest-environment jsdom */

// Mock HTMLCanvasElement globally to prevent JSDOM errors
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    strokeRect: jest.fn(),
    ellipse: jest.fn(),
    putImageData: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }))
}));
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');

describe('Paint 98', () => {
    let mockContext;

    beforeEach(() => {
        // Setup minimal DOM for Paint
        document.body.innerHTML = `
            <div id="paint-canvas-container">
                <canvas id="paint-canvas" width="400" height="300"></canvas>
            </div>
            <div id="paint-palette"></div>
            <div id="paint-color-primary"></div>
            <div id="paint-color-secondary"></div>
            <button class="paint-tool active" data-tool="pencil"></button>
            <button class="paint-tool" data-tool="eraser"></button>
            <div id="paint-status-text"></div>
            <div id="paint-status-coord"></div>
        `;

        mockContext = {
            fillRect: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            clearRect: jest.fn(),
            drawImage: jest.fn(),
            strokeRect: jest.fn(),
            ellipse: jest.fn(),
            putImageData: jest.fn(),
            getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }))
        };

        const canvas = document.getElementById('paint-canvas');
        canvas.getContext = jest.fn((type) => {
            if (type === '2d') return mockContext;
            return null;
        });

        // Initialize Paint via requiring the script
        require('../apps/paint/paint.js');

        // Ensure the initial tool is pencil
        window.Paint98.currentTool = 'pencil';
    });

    afterEach(() => {
        jest.resetModules();
        if (window.Paint98) {
            delete window.Paint98;
        }
    });

    test('Initializes correctly', () => {
        expect(window.Paint98).toBeDefined();
        window.Paint98.init();
        expect(window.Paint98.primaryColor).toBe('#000000');
        expect(window.Paint98.secondaryColor).toBe('#ffffff');
    });

    test('Tool selection updates state', () => {
        window.Paint98.init();
        const eraserBtn = document.querySelector('.paint-tool[data-tool="eraser"]');

        // Trigger click event
        eraserBtn.dispatchEvent(new Event('click'));

        expect(window.Paint98.currentTool).toBe('eraser');
        expect(eraserBtn.classList.contains('active')).toBe(true);
    });

    test('Palette creates color buttons', () => {
        window.Paint98.init();
        const paletteEl = document.getElementById('paint-palette');
        // Colors array has 28 items
        expect(paletteEl.children.length).toBe(28);
    });
});
