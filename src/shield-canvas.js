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
            gridSize: options.gridSize || 1000,
            squarePrice: options.squarePrice || 0.10,
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

        // Handle owned square clicks for editing
        gridRenderer.onOwnedSquareClick = (x, y) => {
            donationModal.showEditModal(x, y, (success) => {
                if (success) {
                    gridRenderer.requestRedraw();
                }
            });
        };

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
                <button class="btn btn-small" id="exportBtn">Export Grid</button>
                <button class="btn btn-small" id="importBtn">Import Grid</button>
                <button class="btn btn-small" id="clearAllBtn">Clear All</button>
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
        const exportBtn = panel.querySelector('#exportBtn');
        const importBtn = panel.querySelector('#importBtn');
        const clearAllBtn = panel.querySelector('#clearAllBtn');

        // Update button states based on selection
        const updateButtonStates = () => {
            const selectedSquares = gridRenderer.getSelectedSquares();
            const hasSelection = selectedSquares.length > 0;
            
            donateBtn.disabled = !hasSelection;
            clearSelectionBtn.disabled = !hasSelection;
            selectedCountSpan.textContent = selectedSquares.length;
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

        // Export button
        exportBtn.addEventListener('click', () => {
            const json = stateManager.exportState();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shield-of-athena-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // Import button
        importBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const success = stateManager.importState(event.target.result);
                        if (success) {
                            alert('Grid imported successfully!');
                            gridRenderer.requestRedraw();
                        } else {
                            alert('Failed to import grid. Invalid file format.');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });

        // Clear all button
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all grid data? This cannot be undone.')) {
                stateManager.clearAll();
                gridRenderer.clearSelection();
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

