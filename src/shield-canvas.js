/**
 * Shield Canvas - Main component that orchestrates all modules
 */

import { StateManager } from './state-manager.js';
import { MockAPI } from './api-mock.js';
import { ReceiptGenerator } from './receipt-generator.js';
import { GridRenderer } from './grid-renderer.js';
import { DonationModal } from './donation-modal.js';

class ShieldCanvasComponent {
    constructor() {
        this.instances = new Map();
    }

    /**
     * Initialize Shield Canvas component
     */
    init(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container element with id "${containerId}" not found`);
            return null;
        }

        // Default options
        const config = {
            gridSize: options.gridSize || 250,
            squarePrice: options.squarePrice || 0.07,
            lockDuration: options.lockDuration || (7 * 24 * 60 * 60 * 1000)
        };

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'shield-canvas-wrapper';
        container.appendChild(wrapper);

        // Initialize modules
        const stateManager = new StateManager(config.gridSize, config.lockDuration);
        const mockAPI = new MockAPI();
        const receiptGenerator = new ReceiptGenerator();
        const gridRenderer = new GridRenderer(wrapper, config.gridSize, stateManager);
        const donationModal = new DonationModal(config.squarePrice, mockAPI, receiptGenerator, stateManager);

        // Create control panel
        const controlPanel = this.createControlPanel(wrapper, gridRenderer, donationModal, stateManager);

        // Start cleanup timer
        stateManager.startCleanupTimer();

        // Listen to state changes
        stateManager.addListener(() => {
            gridRenderer.requestRedraw();
        });

        // Store instance
        const instance = {
            container,
            wrapper,
            config,
            stateManager,
            mockAPI,
            receiptGenerator,
            gridRenderer,
            donationModal,
            controlPanel
        };

        this.instances.set(containerId, instance);
        return instance;
    }

    /**
     * Create control panel
     */
    createControlPanel(wrapper, gridRenderer, donationModal, stateManager) {
        const panel = document.createElement('div');
        panel.className = 'control-panel';
        panel.innerHTML = `
            <div class="control-group">
                <button class="btn btn-primary" id="donateBtn" disabled>
                    Donate & Color (<span id="selectedCount">0</span>)
                </button>
                <button class="btn btn-secondary" id="clearSelectionBtn" disabled>
                    Clear Selection
                </button>
            </div>
            <div class="control-group">
                <button class="btn btn-icon" id="zoomInBtn" title="Zoom In">+</button>
                <button class="btn btn-icon" id="zoomOutBtn" title="Zoom Out">-</button>
                <button class="btn btn-icon" id="centerBtn" title="Center View">⌖</button>
            </div>
            <div class="control-group">
                <button class="btn btn-icon" id="prevTransactionBtn" title="Previous Transaction" disabled>◀</button>
                <span id="transactionPosition" class="position-indicator">-</span>
                <button class="btn btn-icon" id="nextTransactionBtn" title="Next Transaction" disabled>▶</button>
            </div>
            <div class="control-group">
                <button class="btn btn-small" id="paintModeBtn" class="paint-mode-btn">🖌 Paint Mode</button>
                <div id="paintColorPicker" class="paint-color-picker" style="display: none;">
                    <input type="color" id="paintColor" value="#4CAF50" title="Paint Color">
                    <div class="color-presets-inline">
                        <button type="button" class="color-preset-small" data-color="#FF0000" style="background: #FF0000;" title="Red"></button>
                        <button type="button" class="color-preset-small" data-color="#00FF00" style="background: #00FF00;" title="Green"></button>
                        <button type="button" class="color-preset-small" data-color="#0000FF" style="background: #0000FF;" title="Blue"></button>
                        <button type="button" class="color-preset-small" data-color="#FFFF00" style="background: #FFFF00;" title="Yellow"></button>
                        <button type="button" class="color-preset-small" data-color="#FF00FF" style="background: #FF00FF;" title="Magenta"></button>
                        <button type="button" class="color-preset-small" data-color="#00FFFF" style="background: #00FFFF;" title="Cyan"></button>
                        <button type="button" class="color-preset-small" data-color="#000000" style="background: #000000;" title="Black"></button>
                        <button type="button" class="color-preset-small" data-color="#FFFFFF" style="background: #FFFFFF; border: 1px solid #ccc;" title="White"></button>
                    </div>
                    <button type="button" id="eraserBtn" class="eraser-btn" title="Reset to original color">↩️</button>
                </div>
                <button class="btn btn-small" id="clearMySquaresBtn" disabled>Clear My Squares</button>
            </div>
        `;

        wrapper.appendChild(panel);

        // Attach event listeners
        this.attachControlListeners(panel, gridRenderer, donationModal, stateManager);

        return panel;
    }

    /**
     * Attach control panel event listeners
     */
    attachControlListeners(panel, gridRenderer, donationModal, stateManager) {
        const donateBtn = panel.querySelector('#donateBtn');
        const clearSelectionBtn = panel.querySelector('#clearSelectionBtn');
        const selectedCountSpan = panel.querySelector('#selectedCount');
        const zoomInBtn = panel.querySelector('#zoomInBtn');
        const zoomOutBtn = panel.querySelector('#zoomOutBtn');
        const centerBtn = panel.querySelector('#centerBtn');
        const prevTransactionBtn = panel.querySelector('#prevTransactionBtn');
        const nextTransactionBtn = panel.querySelector('#nextTransactionBtn');
        const transactionPositionSpan = panel.querySelector('#transactionPosition');
        const paintModeBtn = panel.querySelector('#paintModeBtn');
        const paintColorPickerDiv = panel.querySelector('#paintColorPicker');
        const paintColorInput = panel.querySelector('#paintColor');
        const colorPresetsInline = panel.querySelectorAll('.color-preset-small');
        const eraserBtn = panel.querySelector('#eraserBtn');
        const clearMySquaresBtn = panel.querySelector('#clearMySquaresBtn');
        
        // Navigation state
        let currentTransactionIndex = 0;
        let isPaintMode = false;
        let isEraser = false;

        // Update button states based on selection and ownership
        const updateButtonStates = () => {
            const selectedSquares = gridRenderer.getSelectedSquares();
            const hasSelection = selectedSquares.length > 0;
            const transactions = stateManager.getTransactions();
            const hasTransactions = transactions.length > 0;
            
            donateBtn.disabled = !hasSelection;
            clearSelectionBtn.disabled = !hasSelection;
            selectedCountSpan.textContent = selectedSquares.length;
            
            // Update navigation buttons
            prevTransactionBtn.disabled = !hasTransactions;
            nextTransactionBtn.disabled = !hasTransactions;
            clearMySquaresBtn.disabled = !hasTransactions;
            paintModeBtn.disabled = !hasTransactions;
            
            // Update position indicator
            if (hasTransactions) {
                const transaction = transactions[currentTransactionIndex];
                transactionPositionSpan.textContent = `${currentTransactionIndex + 1} of ${transactions.length} (${transaction ? transaction.count : 0} sq)`;
            } else {
                transactionPositionSpan.textContent = '-';
            }
            
            // Update paint mode button style
            if (isPaintMode) {
                paintModeBtn.classList.add('active');
                paintModeBtn.textContent = '🖌 Exit Paint';
            } else {
                paintModeBtn.classList.remove('active');
                paintModeBtn.textContent = '🖌 Paint Mode';
            }
        };

        // Watch for selection changes
        setInterval(updateButtonStates, 100);

        // Donate button
        donateBtn.addEventListener('click', () => {
            const selectedSquares = gridRenderer.getSelectedSquares();
            if (selectedSquares.length > 0) {
                donationModal.show(selectedSquares, (success) => {
                    if (success) {
                        gridRenderer.clearSelection();
                        updateButtonStates();
                    }
                });
            }
        });

        // Clear selection button
        clearSelectionBtn.addEventListener('click', () => {
            gridRenderer.clearSelection();
            updateButtonStates();
        });

        // Zoom controls
        zoomInBtn.addEventListener('click', () => {
            const newScale = Math.min(gridRenderer.maxScale, gridRenderer.scale * 1.5);
            if (newScale !== gridRenderer.scale) {
                gridRenderer.scale = newScale;
                gridRenderer.requestRedraw();
            }
        });

        zoomOutBtn.addEventListener('click', () => {
            const newScale = Math.max(gridRenderer.minScale, gridRenderer.scale / 1.5);
            if (newScale !== gridRenderer.scale) {
                gridRenderer.scale = newScale;
                gridRenderer.requestRedraw();
            }
        });

        centerBtn.addEventListener('click', () => {
            gridRenderer.centerView();
        });

        // Navigation helper function for transactions
        const navigateToTransaction = (index) => {
            const transactions = stateManager.getTransactions();
            if (transactions.length === 0) return;
            
            // Wrap around if out of bounds
            if (index < 0) index = transactions.length - 1;
            if (index >= transactions.length) index = 0;
            
            currentTransactionIndex = index;
            const transaction = transactions[index];
            const squares = transaction.squares;
            
            // Get bounding box for all squares in transaction
            const bounds = stateManager.getSquaresBounds(squares);
            if (!bounds) return;
            
            // Calculate center and appropriate scale
            const centerGridX = (bounds.minX + bounds.maxX) / 2;
            const centerGridY = (bounds.minY + bounds.maxY) / 2;
            const width = bounds.maxX - bounds.minX + 1;
            const height = bounds.maxY - bounds.minY + 1;
            const maxDimension = Math.max(width, height);
            
            // Zoom to fit all squares with padding
            const padding = 5;
            const scaleX = gridRenderer.canvas.width / ((maxDimension + padding * 2) * gridRenderer.squareSize);
            const scaleY = gridRenderer.canvas.height / ((maxDimension + padding * 2) * gridRenderer.squareSize);
            const targetScale = Math.min(scaleX, scaleY, 4.0); // Cap at 4x
            
            gridRenderer.scale = Math.max(0.5, targetScale);
            
            // Center on the group
            const centerX = (gridRenderer.canvas.width / 2) - (centerGridX * gridRenderer.squareSize * gridRenderer.scale);
            const centerY = (gridRenderer.canvas.height / 2) - (centerGridY * gridRenderer.squareSize * gridRenderer.scale);
            gridRenderer.offsetX = centerX;
            gridRenderer.offsetY = centerY;
            
            gridRenderer.requestRedraw();
            updateButtonStates();
        };

        // Previous transaction button
        prevTransactionBtn.addEventListener('click', () => {
            navigateToTransaction(currentTransactionIndex - 1);
        });

        // Next transaction button
        nextTransactionBtn.addEventListener('click', () => {
            navigateToTransaction(currentTransactionIndex + 1);
        });

        // Paint mode toggle
        paintModeBtn.addEventListener('click', () => {
            isPaintMode = !isPaintMode;
            gridRenderer.setPaintMode(isPaintMode);
            
            // Show/hide color picker
            if (isPaintMode) {
                paintColorPickerDiv.style.display = 'flex';
                gridRenderer.setPaintColor(paintColorInput.value);
            } else {
                paintColorPickerDiv.style.display = 'none';
                // Reset eraser when exiting paint mode
                isEraser = false;
                eraserBtn.classList.remove('active');
                gridRenderer.setEraseMode(false);
            }
            
            updateButtonStates();
        });

        // Paint color input change
        paintColorInput.addEventListener('input', () => {
            isEraser = false;
            eraserBtn.classList.remove('active');
            gridRenderer.setEraseMode(false);
            gridRenderer.setPaintColor(paintColorInput.value);
        });

        // Color preset buttons
        colorPresetsInline.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.getAttribute('data-color');
                paintColorInput.value = color;
                isEraser = false;
                eraserBtn.classList.remove('active');
                gridRenderer.setEraseMode(false);
                gridRenderer.setPaintColor(color);
            });
        });

        // Eraser button
        eraserBtn.addEventListener('click', () => {
            isEraser = !isEraser;
            if (isEraser) {
                eraserBtn.classList.add('active');
                gridRenderer.setEraseMode(true);
            } else {
                eraserBtn.classList.remove('active');
                gridRenderer.setEraseMode(false);
                gridRenderer.setPaintColor(paintColorInput.value);
            }
        });

        // Clear my squares button
        clearMySquaresBtn.addEventListener('click', () => {
            const ownedSquares = stateManager.getOwnedSquares();
            if (ownedSquares.length === 0) return;
            
            if (confirm(`Are you sure you want to clear your ${ownedSquares.length} owned square(s)? This cannot be undone.`)) {
                // Remove each owned square
                ownedSquares.forEach(square => {
                    stateManager.removeSquare(square.x, square.y);
                });
                
                // Clear ownership data
                stateManager.ownership = {};
                stateManager.saveOwnership();
                
                // Reset navigation and paint mode
                currentTransactionIndex = 0;
                isPaintMode = false;
                gridRenderer.setPaintMode(false);
                paintColorPickerDiv.style.display = 'none';
                
                gridRenderer.clearSelection();
                gridRenderer.requestRedraw();
                updateButtonStates();
            }
        });
    }

    /**
     * Destroy instance
     */
    destroy(containerId) {
        const instance = this.instances.get(containerId);
        if (instance) {
            instance.stateManager.stopCleanupTimer();
            instance.gridRenderer.destroy();
            instance.wrapper.remove();
            this.instances.delete(containerId);
        }
    }

    /**
     * Get instance
     */
    getInstance(containerId) {
        return this.instances.get(containerId);
    }
}

// Export singleton instance
export const ShieldCanvas = new ShieldCanvasComponent();

