/**
 * Windows 98 Calculator Logic
 */
(function () {
    'use strict';

    window.Calculator98 = {
        displayValue: '0',
        previousValue: null,
        operator: null,
        waitingForNewValue: false,
        overwriteOnNextInput: false,
        memory: 0,
        hasMemory: false,
        error: false,

        init: function () {
            this.displayEl = document.getElementById('calc-display');
            this.memoryIndicatorEl = document.getElementById('calc-memory-indicator');
            this.updateDisplay();

            // Bind events
            const buttons = document.querySelectorAll('.calculator-btn');
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener('click', (e) => {
                    const btn = e.target.closest('.calculator-btn');
                    if (!btn) return;

                    const action = btn.getAttribute('data-action');
                    const val = btn.getAttribute('data-val');
                    this.handleInput(action, val);
                });
            }
        },

        updateDisplay: function () {
            if (this.error) {
                this.displayEl.value = 'Error';
            } else {
                this.displayEl.value = this.displayValue;
            }

            if (this.memoryIndicatorEl) {
                this.memoryIndicatorEl.innerText = this.hasMemory ? 'M' : '';
            }
        },

        handleInput: function (action, val) {
            if (this.error && action !== 'clear') {
                return; // Only allow clear if error
            }

            switch (action) {
                case 'num':
                    this.inputDigit(val);
                    break;
                case 'decimal':
                    this.inputDecimal();
                    break;
                case 'add':
                case 'subtract':
                case 'multiply':
                case 'divide':
                    this.handleOperator(action);
                    break;
                case 'equals':
                    this.calculate();
                    break;
                case 'sqrt':
                    this.handleSqrt();
                    break;
                case 'percent':
                    this.handlePercent();
                    break;
                case 'reciprocal':
                    this.handleReciprocal();
                    break;
                case 'sign':
                    this.handleSign();
                    break;
                case 'backspace':
                    this.handleBackspace();
                    break;
                case 'clear-entry':
                    this.clearEntry();
                    break;
                case 'clear':
                    this.clearAll();
                    break;
                case 'mc':
                    this.memoryClear();
                    break;
                case 'mr':
                    this.memoryRecall();
                    break;
                case 'ms':
                    this.memoryStore();
                    break;
                case 'm-plus':
                    this.memoryAdd();
                    break;
            }

            this.updateDisplay();
        },

        inputDigit: function (digit) {
            if (this.waitingForNewValue || this.overwriteOnNextInput) {
                this.displayValue = digit;
                this.waitingForNewValue = false;
                this.overwriteOnNextInput = false;
            } else {
                this.displayValue = this.displayValue === '0' ? digit : this.displayValue + digit;
            }
        },

        inputDecimal: function () {
            if (this.waitingForNewValue || this.overwriteOnNextInput) {
                this.displayValue = '0.';
                this.waitingForNewValue = false;
                this.overwriteOnNextInput = false;
                return;
            }

            if (!this.displayValue.includes('.')) {
                this.displayValue += '.';
            }
        },

        handleOperator: function (nextOperator) {
            const inputValue = parseFloat(this.displayValue);

            if (this.operator && this.waitingForNewValue && !this.overwriteOnNextInput) {
                this.operator = nextOperator;
                return;
            }

            if (this.previousValue == null) {
                this.previousValue = inputValue;
            } else if (this.operator) {
                const result = this.performCalculation(this.operator, this.previousValue, inputValue);
                if (this.error) return;

                // Format to avoid floating point issues and trailing zeros
                this.displayValue = String(parseFloat(result.toFixed(10)));
                this.previousValue = result;
            }

            this.waitingForNewValue = true;
            this.overwriteOnNextInput = false;
            this.operator = nextOperator;
        },

        performCalculation: function (operator, v1, v2) {
            switch (operator) {
                case 'add': return v1 + v2;
                case 'subtract': return v1 - v2;
                case 'multiply': return v1 * v2;
                case 'divide':
                    if (v2 === 0) {
                        this.error = true;
                        return 0;
                    }
                    return v1 / v2;
                default: return v2;
            }
        },

        calculate: function () {
            if (!this.operator || (this.waitingForNewValue && !this.overwriteOnNextInput)) {
                return; // Nothing to calculate if no operator or waiting for second operand
            }

            const inputValue = parseFloat(this.displayValue);
            const result = this.performCalculation(this.operator, this.previousValue, inputValue);
            if (this.error) return;

            this.displayValue = String(parseFloat(result.toFixed(10)));
            // In classic calc, hitting equals resets the state for the next operation
            this.previousValue = null;
            this.operator = null;
            this.waitingForNewValue = true;
            this.overwriteOnNextInput = false;
        },

        handleSqrt: function () {
            const val = parseFloat(this.displayValue);
            if (val < 0) {
                this.error = true;
                return;
            }
            this.displayValue = String(parseFloat(Math.sqrt(val).toFixed(10)));
            this.overwriteOnNextInput = true;
        },

        handlePercent: function () {
            if (this.previousValue == null) {
                this.displayValue = '0';
                this.overwriteOnNextInput = true;
                return;
            }
            const val = parseFloat(this.displayValue);
            const result = this.previousValue * (val / 100);
            this.displayValue = String(parseFloat(result.toFixed(10)));
            this.overwriteOnNextInput = true;
        },

        handleReciprocal: function () {
            const val = parseFloat(this.displayValue);
            if (val === 0) {
                this.error = true;
                return;
            }
            this.displayValue = String(parseFloat((1 / val).toFixed(10)));
            this.overwriteOnNextInput = true;
        },

        handleSign: function () {
            if (this.displayValue === '0') return;

            if (this.displayValue.startsWith('-')) {
                this.displayValue = this.displayValue.substring(1);
            } else {
                this.displayValue = '-' + this.displayValue;
            }
        },

        handleBackspace: function () {
            if (this.waitingForNewValue || this.overwriteOnNextInput) return;

            if (this.displayValue.length > 1) {
                this.displayValue = this.displayValue.slice(0, -1);
                if (this.displayValue === '-' || this.displayValue === '-0') {
                    this.displayValue = '0';
                }
            } else {
                this.displayValue = '0';
            }
        },

        clearEntry: function () {
            this.displayValue = '0';
            if (this.error) this.error = false;
        },

        clearAll: function () {
            this.displayValue = '0';
            this.previousValue = null;
            this.operator = null;
            this.waitingForNewValue = false;
            this.overwriteOnNextInput = false;
            this.error = false;
        },

        memoryClear: function () {
            this.memory = 0;
            this.hasMemory = false;
        },

        memoryRecall: function () {
            if (this.hasMemory) {
                this.displayValue = String(this.memory);
                this.overwriteOnNextInput = true;
            }
        },

        memoryStore: function () {
            this.memory = parseFloat(this.displayValue);
            this.hasMemory = true;
            this.overwriteOnNextInput = true;
        },

        memoryAdd: function () {
            this.memory += parseFloat(this.displayValue);
            this.hasMemory = true;
            this.overwriteOnNextInput = true;
        }
    };

    // Auto-init if DOM is already ready
    if (document.getElementById('calc-display')) {
        window.Calculator98.init();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.Calculator98.init();
        });
    }
})();
