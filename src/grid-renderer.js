/**
 * Grid Renderer - Canvas-based rendering with zoom and pan
 */

export class GridRenderer {
    /**
     * Creates a new GridRenderer instance for canvas-based grid visualization
     * @param {HTMLElement} container - DOM container for the canvas
     * @param {number} gridSize - Size of the grid (number of squares per side)
     * @param {StateManager} stateManager - State management service
     */
    constructor(container, gridSize, stateManager) {
        this.container = container;
        this.gridSize = gridSize;
        this.stateManager = stateManager;
        
        // Canvas setup
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Viewport state
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 0.5; // Start zoomed out to see more of the grid
        this.minScale = 0.1;
        this.maxScale = 10;
        
        // Interaction state
        this.isDragging = false;
        this.isSelecting = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.hoveredSquare = null;
        this.selectedSquares = new Set();
        this.selectionStart = null;
        
        // Rendering optimization
        this.squareSize = 10; // Base size of each square in pixels
        this.needsRedraw = true;
        
        // Paint mode
        this.isPaintMode = false;
        this.paintColor = '#FF0000';
        this.isPainting = false;
        this.isEraseMode = false;
        
        this.init();
    }

    /**
     * Initializes the renderer by setting up canvas and starting render loop
     */
    init() {
        this.setupCanvas();
        this.attachEventListeners();
        this.centerView();
        this.startRenderLoop();
    }

    /**
     * Sets up the canvas element and appends it to container
     * Configures resize handling
     */
    setupCanvas() {
        this.canvas.className = 'shield-canvas';
        this.container.appendChild(this.canvas);
        this.resize();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Resizes canvas to match container dimensions
     * Called on window resize events
     */
    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.needsRedraw = true;
    }

    /**
     * Centers the viewport on the grid
     * Adjusts offset to position grid center in canvas center
     */
    centerView() {
        const centerX = (this.canvas.width / 2) - (this.gridSize * this.squareSize * this.scale / 2);
        const centerY = (this.canvas.height / 2) - (this.gridSize * this.squareSize * this.scale / 2);
        this.offsetX = centerX;
        this.offsetY = centerY;
        this.needsRedraw = true;
    }

    /**
     * Attaches all mouse and touch event listeners for canvas interaction
     * Handles pan, zoom, selection, and paint interactions
     */
    attachEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Context menu (right click)
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Converts screen (canvas) coordinates to grid coordinates
     * @param {number} screenX - X coordinate on canvas in pixels
     * @param {number} screenY - Y coordinate on canvas in pixels
     * @returns {{x: number, y: number}} Grid coordinates
     */
    screenToGrid(screenX, screenY) {
        const gridX = Math.floor((screenX - this.offsetX) / (this.squareSize * this.scale));
        const gridY = Math.floor((screenY - this.offsetY) / (this.squareSize * this.scale));
        return { x: gridX, y: gridY };
    }

    /**
     * Converts grid coordinates to screen (canvas) coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {{x: number, y: number}} Screen coordinates in pixels
     */
    gridToScreen(gridX, gridY) {
        const screenX = gridX * this.squareSize * this.scale + this.offsetX;
        const screenY = gridY * this.squareSize * this.scale + this.offsetY;
        return { x: screenX, y: screenY };
    }

    /**
     * Validates if grid coordinates are within bounds
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {boolean} True if coordinates are valid
     */
    isValidGridCoord(x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    /**
     * Handles mouse down events for selection, panning, and painting
     * @param {MouseEvent} e - Mouse event object
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const gridCoord = this.screenToGrid(mouseX, mouseY);
        
        if (e.button === 0) { // Left click
            if (this.isPaintMode && this.isValidGridCoord(gridCoord.x, gridCoord.y)) {
                // Paint mode: start painting owned squares
                const square = this.stateManager.getSquare(gridCoord.x, gridCoord.y);
                if (square && this.stateManager.isOwnedSquare(gridCoord.x, gridCoord.y)) {
                    this.isPainting = true;
                    this.paintSquare(gridCoord.x, gridCoord.y);
                }
            } else if (e.shiftKey || e.ctrlKey) {
                // Multi-select mode
                this.isSelecting = true;
                this.selectionStart = gridCoord;
            } else if (this.isValidGridCoord(gridCoord.x, gridCoord.y)) {
                // Single select or start drag-select
                if (this.stateManager.isSquareAvailable(gridCoord.x, gridCoord.y)) {
                    this.isSelecting = true;
                    this.selectionStart = gridCoord;
                    this.toggleSquareSelection(gridCoord.x, gridCoord.y);
                } else {
                    // Start panning if clicking on locked square
                    this.isDragging = true;
                }
            } else {
                // Start panning
                this.isDragging = true;
            }
        } else if (e.button === 2) { // Right click - always pan
            this.isDragging = true;
        }
        
        this.dragStartX = mouseX;
        this.dragStartY = mouseY;
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }

    /**
     * Handles mouse move events for panning, selecting, and painting
     * @param {MouseEvent} e - Mouse event object
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (this.isPainting) {
            // Paint mode: paint owned squares as we drag
            const gridCoord = this.screenToGrid(mouseX, mouseY);
            if (this.isValidGridCoord(gridCoord.x, gridCoord.y)) {
                const square = this.stateManager.getSquare(gridCoord.x, gridCoord.y);
                if (square && this.stateManager.isOwnedSquare(gridCoord.x, gridCoord.y)) {
                    this.paintSquare(gridCoord.x, gridCoord.y);
                }
            }
        } else if (this.isDragging) {
            // Pan the view
            const dx = mouseX - this.lastMouseX;
            const dy = mouseY - this.lastMouseY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.needsRedraw = true;
        } else if (this.isSelecting && this.selectionStart) {
            // Drag selection
            const currentCoord = this.screenToGrid(mouseX, mouseY);
            if (this.isValidGridCoord(currentCoord.x, currentCoord.y)) {
                this.updateDragSelection(this.selectionStart, currentCoord);
            }
        } else {
            // Update hover state
            const gridCoord = this.screenToGrid(mouseX, mouseY);
            if (this.isValidGridCoord(gridCoord.x, gridCoord.y)) {
                const key = `${gridCoord.x},${gridCoord.y}`;
                const prevKey = this.hoveredSquare ? `${this.hoveredSquare.x},${this.hoveredSquare.y}` : null;
                
                if (key !== prevKey) {
                    this.hoveredSquare = gridCoord;
                    this.needsRedraw = true;
                }
            } else if (this.hoveredSquare) {
                this.hoveredSquare = null;
                this.needsRedraw = true;
            }
        }
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }

    /**
     * Handles mouse up events to end interactions
     * @param {MouseEvent} e - Mouse event object
     */
    handleMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.isDragging = false;
        this.isSelecting = false;
        this.isPainting = false;
        this.selectionStart = null;
    }

    /**
     * Handles mouse leaving canvas to reset interaction states
     * @param {MouseEvent} e - Mouse event object
     */
    handleMouseLeave(e) {
        this.isDragging = false;
        this.isSelecting = false;
        this.hoveredSquare = null;
        this.selectionStart = null;
        this.needsRedraw = true;
    }

    /**
     * Handles mouse wheel events for zooming in/out
     * Zooms toward mouse cursor position
     * @param {WheelEvent} e - Wheel event object
     */
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom towards mouse cursor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoomFactor));
        
        if (newScale !== this.scale) {
            // Adjust offset to zoom towards cursor
            const gridCoord = this.screenToGrid(mouseX, mouseY);
            this.scale = newScale;
            const newScreen = this.gridToScreen(gridCoord.x, gridCoord.y);
            this.offsetX += mouseX - newScreen.x;
            this.offsetY += mouseY - newScreen.y;
            this.needsRedraw = true;
        }
    }

    /**
     * Handles touch start events for mobile support
     * @param {TouchEvent} e - Touch event object
     */
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0,
                shiftKey: false,
                ctrlKey: false
            });
        }
    }

    /**
     * Handles touch move events for mobile support
     * @param {TouchEvent} e - Touch event object
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    }

    /**
     * Handles touch end events for mobile support
     * @param {TouchEvent} e - Touch event object
     */
    handleTouchEnd(e) {
        this.handleMouseUp(e);
    }

    /**
     * Toggles selection state of a square at given coordinates
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     */
    toggleSquareSelection(x, y) {
        const key = `${x},${y}`;
        if (this.selectedSquares.has(key)) {
            this.selectedSquares.delete(key);
        } else {
            if (this.stateManager.isSquareAvailable(x, y)) {
                this.selectedSquares.add(key);
            }
        }
        this.needsRedraw = true;
    }

    /**
     * Updates selection based on drag area (rectangular selection)
     * @param {{x: number, y: number}} start - Starting grid coordinates
     * @param {{x: number, y: number}} end - Ending grid coordinates
     */
    updateDragSelection(start, end) {
        // Clear previous selection
        this.selectedSquares.clear();
        
        // Select rectangle
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                if (this.isValidGridCoord(x, y) && this.stateManager.isSquareAvailable(x, y)) {
                    this.selectedSquares.add(`${x},${y}`);
                }
            }
        }
        
        this.needsRedraw = true;
    }

    /**
     * Clears all selected squares
     */
    clearSelection() {
        this.selectedSquares.clear();
        this.needsRedraw = true;
    }

    /**
     * Returns currently selected squares as an array of coordinate objects
     * @returns {Array<{x: number, y: number}>} Array of selected square coordinates
     */
    getSelectedSquares() {
        return Array.from(this.selectedSquares).map(key => {
            const [x, y] = key.split(',').map(Number);
            return { x, y };
        });
    }

    /**
     * Starts the continuous render loop using requestAnimationFrame
     * Only renders when needsRedraw flag is true for performance
     */
    startRenderLoop() {
        const render = () => {
            if (this.needsRedraw) {
                this.render();
                this.needsRedraw = false;
            }
            requestAnimationFrame(render);
        };
        render();
    }

    /**
     * Main render function that draws the grid to canvas
     * Implements viewport culling for performance
     */
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        
        // Calculate visible grid range
        const startX = Math.max(0, Math.floor(-this.offsetX / (this.squareSize * this.scale)));
        const startY = Math.max(0, Math.floor(-this.offsetY / (this.squareSize * this.scale)));
        const endX = Math.min(this.gridSize, Math.ceil((width - this.offsetX) / (this.squareSize * this.scale)));
        const endY = Math.min(this.gridSize, Math.ceil((height - this.offsetY) / (this.squareSize * this.scale)));
        
        const squareScreenSize = this.squareSize * this.scale;
        
        // Draw grid squares
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const screenPos = this.gridToScreen(x, y);
                const square = this.stateManager.getSquare(x, y);
                const key = `${x},${y}`;
                const isSelected = this.selectedSquares.has(key);
                const isHovered = this.hoveredSquare && this.hoveredSquare.x === x && this.hoveredSquare.y === y;
                const isOwned = square && this.stateManager.isOwnedSquare(x, y);
                
                // Determine square color
                let fillColor = '#f5f5f5'; // Default: available (light gray for better contrast)
                if (square) {
                    fillColor = square.color;
                }
                
                // Draw square
                ctx.fillStyle = fillColor;
                ctx.fillRect(screenPos.x, screenPos.y, squareScreenSize, squareScreenSize);
                
                // Draw ownership indicator (corner badge)
                if (isOwned && squareScreenSize > 8) {
                    const badgeSize = Math.max(3, squareScreenSize * 0.25);
                    ctx.fillStyle = '#FFD700'; // Gold color for owned
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x + squareScreenSize, screenPos.y);
                    ctx.lineTo(screenPos.x + squareScreenSize - badgeSize, screenPos.y);
                    ctx.lineTo(screenPos.x + squareScreenSize, screenPos.y + badgeSize);
                    ctx.closePath();
                    ctx.fill();
                }
                
                // Draw selection highlight
                if (isSelected) {
                    ctx.strokeStyle = '#4CAF50';
                    ctx.lineWidth = Math.max(2, squareScreenSize * 0.1);
                    ctx.strokeRect(screenPos.x, screenPos.y, squareScreenSize, squareScreenSize);
                }
                
                // Draw hover highlight
                if (isHovered) {
                    ctx.strokeStyle = isOwned ? '#FFD700' : (square ? '#ff9800' : '#2196F3');
                    ctx.lineWidth = Math.max(2, squareScreenSize * 0.1);
                    ctx.strokeRect(screenPos.x, screenPos.y, squareScreenSize, squareScreenSize);
                }
                
                // Draw grid lines (only when zoomed in enough)
                if (squareScreenSize > 5) {
                    ctx.strokeStyle = '#e0e0e0';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(screenPos.x, screenPos.y, squareScreenSize, squareScreenSize);
                }
            }
        }
        
        // Draw UI overlay
        this.drawUI();
    }

    /**
     * Draws UI overlay with info panel showing zoom level, selection, and hovered square
     */
    drawUI() {
        const ctx = this.ctx;
        
        const ownedCount = this.stateManager.getOwnedSquares().length;
        const infoHeight = this.hoveredSquare ? (ownedCount > 0 ? 130 : 110) : 70;
        
        // Draw info text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 280, infoHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText(`Zoom: ${(this.scale * 100).toFixed(0)}%`, 20, 30);
        ctx.fillText(`Selected: ${this.selectedSquares.size} squares`, 20, 50);
        
        if (ownedCount > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`⭐ You own: ${ownedCount} squares`, 20, 70);
        }
        
        if (this.hoveredSquare) {
            const { x, y } = this.hoveredSquare;
            const square = this.stateManager.getSquare(x, y);
            const isOwned = square && this.stateManager.isOwnedSquare(x, y);
            
            ctx.fillStyle = '#ffffff';
            const yOffset = ownedCount > 0 ? 90 : 70;
            ctx.fillText(`Square: (${x}, ${y})`, 20, yOffset);
            
            if (square) {
                const remaining = this.stateManager.getTimeRemaining(x, y);
                ctx.fillText(`Locked: ${this.stateManager.formatTimeRemaining(remaining)}`, 20, yOffset + 20);
                
                if (isOwned) {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillText(`⭐ Your square`, 20, yOffset + 40);
                }
            } else {
                ctx.fillText(`Status: Available`, 20, yOffset + 20);
            }
        }
    }

    /**
     * Flags the renderer to redraw on next frame
     */
    requestRedraw() {
        this.needsRedraw = true;
    }

    /**
     * Enables or disables paint mode for coloring owned squares
     * @param {boolean} enabled - Whether to enable paint mode
     */
    setPaintMode(enabled) {
        this.isPaintMode = enabled;
        this.isPainting = false;
        
        // Update cursor
        if (enabled) {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'grab';
        }
        
        this.needsRedraw = true;
    }

    /**
     * Sets the color to use for painting squares
     * @param {string} color - Hex color code (e.g., '#FF0000')
     */
    setPaintColor(color) {
        this.paintColor = color;
    }

    /**
     * Enables or disables erase mode to reset squares to original color
     * @param {boolean} enabled - Whether to enable erase mode
     */
    setEraseMode(enabled) {
        this.isEraseMode = enabled;
        
        // Update cursor for reset mode
        if (this.isPaintMode) {
            if (enabled) {
                // Use a different cursor to indicate reset mode
                this.canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 4l-8 8h6v8h4v-8h6z\' fill=\'%23fbc02d\' stroke=\'%23333\' stroke-width=\'1.5\'/%3E%3C/svg%3E") 12 12, auto';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }

    /**
     * Paints or erases a square (resets to original color if in erase mode)
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     */
    paintSquare(x, y) {
        if (this.isEraseMode) {
            // Erase mode: restore to original purchase color
            const originalColor = this.stateManager.getOriginalColor(x, y);
            const success = this.stateManager.updateSquareColor(x, y, originalColor);
            if (success) {
                this.needsRedraw = true;
            }
        } else {
            // Paint mode: update color
            const success = this.stateManager.updateSquareColor(x, y, this.paintColor);
            if (success) {
                this.needsRedraw = true;
            }
        }
    }

    /**
     * Cleans up and removes the canvas element
     */
    destroy() {
        this.canvas.remove();
    }
}

