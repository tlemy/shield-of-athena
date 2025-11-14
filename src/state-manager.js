/**
 * State Manager - Handles grid state, persistence, and expiry logic
 */

export class StateManager {
    constructor(gridSize, lockDuration) {
        this.gridSize = gridSize;
        this.lockDuration = lockDuration;
        this.storageKey = 'shield-of-athena-grid';
        this.ownershipKey = 'shield-of-athena-ownership';
        this.grid = this.loadState();
        this.ownership = this.loadOwnership();
        this.listeners = [];
    }

    /**
     * Load state from localStorage or initialize empty grid
     */
    loadState() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const grid = JSON.parse(stored);
                this.cleanExpiredSquares(grid);
                return grid;
            }
        } catch (e) {
            console.warn('Failed to load state:', e);
        }
        return {};
    }

    /**
     * Save current state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.grid));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    /**
     * Load ownership data from localStorage
     */
    loadOwnership() {
        try {
            const stored = localStorage.getItem(this.ownershipKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load ownership:', e);
        }
        return {};
    }

    /**
     * Save ownership data to localStorage
     */
    saveOwnership() {
        try {
            localStorage.setItem(this.ownershipKey, JSON.stringify(this.ownership));
        } catch (e) {
            console.error('Failed to save ownership:', e);
        }
    }

    /**
     * Add owned squares for a transaction
     */
    addOwnedSquares(transactionId, squares) {
        this.ownership[transactionId] = {
            squares: squares.map(s => ({ x: s.x, y: s.y })),
            timestamp: Date.now()
        };
        this.saveOwnership();
    }

    /**
     * Check if current user owns a square
     */
    isOwnedSquare(x, y) {
        const key = this.getKey(x, y);
        for (const transactionId in this.ownership) {
            const transaction = this.ownership[transactionId];
            if (transaction.squares.some(s => this.getKey(s.x, s.y) === key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all squares owned by current user
     */
    getOwnedSquares() {
        const owned = [];
        for (const transactionId in this.ownership) {
            const transaction = this.ownership[transactionId];
            transaction.squares.forEach(s => {
                const square = this.getSquare(s.x, s.y);
                if (square) {
                    owned.push({ ...square, transactionId });
                }
            });
        }
        return owned;
    }

    /**
     * Remove expired squares from grid
     */
    cleanExpiredSquares(grid) {
        const now = Date.now();
        let cleaned = false;
        
        Object.keys(grid).forEach(key => {
            if (grid[key].expiryTime && grid[key].expiryTime < now) {
                delete grid[key];
                cleaned = true;
            }
        });

        if (cleaned) {
            this.notifyListeners();
        }
    }

    /**
     * Convert x,y coordinates to storage key
     */
    getKey(x, y) {
        return `${x},${y}`;
    }

    /**
     * Parse storage key back to coordinates
     */
    parseKey(key) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }

    /**
     * Get square data at position
     */
    getSquare(x, y) {
        const key = this.getKey(x, y);
        return this.grid[key] || null;
    }

    /**
     * Check if square is available (not locked or expired)
     */
    isSquareAvailable(x, y) {
        const square = this.getSquare(x, y);
        if (!square) return true;
        
        const now = Date.now();
        if (square.expiryTime && square.expiryTime < now) {
            // Square has expired, remove it
            this.removeSquare(x, y);
            return true;
        }
        
        return false;
    }

    /**
     * Set square data
     */
    setSquare(x, y, data) {
        const key = this.getKey(x, y);
        this.grid[key] = {
            ...data,
            x,
            y,
            timestamp: Date.now(),
            expiryTime: Date.now() + this.lockDuration
        };
        this.saveState();
        this.notifyListeners({ x, y, data: this.grid[key] });
    }

    /**
     * Set multiple squares at once
     */
    setSquares(squares) {
        squares.forEach(({ x, y, color, email }) => {
            const key = this.getKey(x, y);
            this.grid[key] = {
                color,
                email,
                x,
                y,
                timestamp: Date.now(),
                expiryTime: Date.now() + this.lockDuration
            };
        });
        this.saveState();
        this.notifyListeners({ multiple: true, squares });
    }

    /**
     * Update color of an owned square
     */
    updateSquareColor(x, y, newColor) {
        if (!this.isOwnedSquare(x, y)) {
            return false;
        }
        
        const square = this.getSquare(x, y);
        if (!square) {
            return false;
        }
        
        const key = this.getKey(x, y);
        this.grid[key] = {
            ...square,
            color: newColor
        };
        
        this.saveState();
        this.notifyListeners({ x, y, data: this.grid[key], colorUpdate: true });
        return true;
    }

    /**
     * Remove square data
     */
    removeSquare(x, y) {
        const key = this.getKey(x, y);
        delete this.grid[key];
        this.saveState();
        this.notifyListeners({ x, y, removed: true });
    }

    /**
     * Get all squares
     */
    getAllSquares() {
        return Object.values(this.grid);
    }

    /**
     * Get time remaining for a square in milliseconds
     */
    getTimeRemaining(x, y) {
        const square = this.getSquare(x, y);
        if (!square || !square.expiryTime) return 0;
        
        const remaining = square.expiryTime - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Format time remaining as human-readable string
     */
    formatTimeRemaining(ms) {
        if (ms <= 0) return 'Available';
        
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        
        if (days > 0) {
            return `${days}d ${hours}h remaining`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        } else {
            return `${minutes}m remaining`;
        }
    }

    /**
     * Export grid state as JSON
     */
    exportState() {
        return JSON.stringify(this.grid, null, 2);
    }

    /**
     * Import grid state from JSON
     */
    importState(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.grid = imported;
            this.cleanExpiredSquares(this.grid);
            this.saveState();
            this.notifyListeners({ fullRefresh: true });
            return true;
        } catch (e) {
            console.error('Failed to import state:', e);
            return false;
        }
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.grid = {};
        this.saveState();
        this.notifyListeners({ fullRefresh: true });
    }

    /**
     * Add change listener
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove change listener
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners(changeData) {
        this.listeners.forEach(callback => callback(changeData));
    }

    /**
     * Start periodic cleanup of expired squares
     */
    startCleanupTimer() {
        // Clean up every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanExpiredSquares(this.grid);
            this.saveState();
        }, 5 * 60 * 1000);
    }

    /**
     * Stop cleanup timer
     */
    stopCleanupTimer() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

