/**
 * State Manager - Handles grid state, persistence, and expiry logic
 */

export class StateManager {
    /**
     * Creates a new StateManager for grid persistence and expiry logic
     * @param {number} gridSize - Size of the grid (squares per side)
     * @param {number} lockDuration - Duration squares remain locked in milliseconds
     */
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
     * Loads grid state from localStorage or initializes empty grid
     * Automatically cleans expired squares
     * @returns {Object} Grid state object with square data keyed by "x,y"
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
     * Persists current grid state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.grid));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    /**
     * Loads ownership tracking data from localStorage
     * @returns {Object} Ownership data keyed by transaction ID
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
     * Persists ownership tracking data to localStorage
     */
    saveOwnership() {
        try {
            localStorage.setItem(this.ownershipKey, JSON.stringify(this.ownership));
        } catch (e) {
            console.error('Failed to save ownership:', e);
        }
    }

    /**
     * Records squares as owned by current user for a transaction
     * @param {string} transactionId - Unique transaction identifier
     * @param {Array<{x: number, y: number}>} squares - Array of square coordinates
     * @param {string} originalColor - Original color hex code chosen at purchase
     * @param {string} url - Optional URL associated with this section
     * @param {string} username - Username of the owner
     */
    addOwnedSquares(transactionId, squares, originalColor, url = null, username = 'Anonymous') {
        this.ownership[transactionId] = {
            squares: squares.map(s => ({ x: s.x, y: s.y })),
            timestamp: Date.now(),
            originalColor: originalColor,
            url: url,
            username: username
        };
        this.saveOwnership();
        
        // Trigger leaderboard update
        this.notifyListeners({ leaderboardUpdate: true });
    }

    /**
     * Gets the URL associated with a square's section
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {string|null} URL or null if not set
     */
    getSquareUrl(x, y) {
        const key = this.getKey(x, y);
        for (const transactionId in this.ownership) {
            const transaction = this.ownership[transactionId];
            if (transaction.squares.some(s => this.getKey(s.x, s.y) === key)) {
                return transaction.url || null;
            }
        }
        return null;
    }

    /**
     * Checks if the current user owns a square at given coordinates
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {boolean} True if user owns this square
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
     * Returns all squares owned by the current user
     * @returns {Array<Object>} Array of square objects with transactionId
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
     * Gets the original color chosen when square was purchased
     * Used for erase/reset functionality
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {string} Hex color code of original color
     */
    getOriginalColor(x, y) {
        const key = this.getKey(x, y);
        for (const transactionId in this.ownership) {
            const transaction = this.ownership[transactionId];
            if (transaction.squares.some(s => this.getKey(s.x, s.y) === key)) {
                return transaction.originalColor || '#f5f5f5';
            }
        }
        return '#f5f5f5';
    }

    /**
     * Returns all transactions with their associated squares
     * Sorted by timestamp (newest first)
     * @returns {Array<Object>} Array of transaction objects
     */
    getTransactions() {
        const transactions = [];
        for (const transactionId in this.ownership) {
            const transaction = this.ownership[transactionId];
            const squares = [];
            
            transaction.squares.forEach(s => {
                const square = this.getSquare(s.x, s.y);
                if (square) {
                    squares.push(square);
                }
            });
            
            if (squares.length > 0) {
                transactions.push({
                    transactionId,
                    timestamp: transaction.timestamp,
                    squares,
                    count: squares.length,
                    url: transaction.url || null,
                    username: transaction.username || 'Anonymous'
                });
            }
        }
        
        // Sort by timestamp (newest first)
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        return transactions;
    }

    /**
     * Gets leaderboard data aggregated by username
     * @returns {Array<{username: string, squareCount: number, rank: number}>} Sorted leaderboard
     */
    getLeaderboard() {
        const userStats = {};
        
        // Aggregate squares by username
        for (const transactionId in this.ownership) {
            const transaction = this.ownership[transactionId];
            const username = transaction.username || 'Anonymous';
            
            if (!userStats[username]) {
                userStats[username] = 0;
            }
            userStats[username] += transaction.squares.length;
        }
        
        // Convert to array and sort
        const leaderboard = Object.entries(userStats)
            .map(([username, squareCount]) => ({ username, squareCount }))
            .sort((a, b) => b.squareCount - a.squareCount);
        
        // Add ranks
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        return leaderboard;
    }

    /**
     * Calculates the bounding box for a set of squares
     * @param {Array<{x: number, y: number}>} squares - Array of square coordinates
     * @returns {{minX: number, maxX: number, minY: number, maxY: number}|null} Bounding box or null if empty
     */
    getSquaresBounds(squares) {
        if (squares.length === 0) return null;
        
        let minX = squares[0].x;
        let maxX = squares[0].x;
        let minY = squares[0].y;
        let maxY = squares[0].y;
        
        squares.forEach(s => {
            minX = Math.min(minX, s.x);
            maxX = Math.max(maxX, s.x);
            minY = Math.min(minY, s.y);
            maxY = Math.max(maxY, s.y);
        });
        
        return { minX, maxX, minY, maxY };
    }

    /**
     * Removes expired squares from the grid based on expiry time
     * @param {Object} grid - Grid object to clean
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
     * Converts x,y coordinates to storage key string
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {string} Key in format "x,y"
     */
    getKey(x, y) {
        return `${x},${y}`;
    }

    /**
     * Parses a storage key string back to coordinates
     * @param {string} key - Key in format "x,y"
     * @returns {{x: number, y: number}} Coordinate object
     */
    parseKey(key) {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
    }

    /**
     * Retrieves square data at given coordinates
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {Object|null} Square data object or null if not found
     */
    getSquare(x, y) {
        const key = this.getKey(x, y);
        return this.grid[key] || null;
    }

    /**
     * Checks if a square is available for donation (not locked or expired)
     * Automatically removes expired squares
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {boolean} True if square is available
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
     * Sets data for a single square with timestamp and expiry
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {Object} data - Square data (color, email, etc.)
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
     * Sets data for multiple squares at once (batch operation)
     * @param {Array<{x: number, y: number, color: string, email: string}>} squares - Array of square data
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
     * Updates the color of an owned square (paint functionality)
     * Only works if current user owns the square
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {string} newColor - New hex color code
     * @returns {boolean} True if update succeeded
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
     * Removes square data from the grid
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     */
    removeSquare(x, y) {
        const key = this.getKey(x, y);
        delete this.grid[key];
        this.saveState();
        this.notifyListeners({ x, y, removed: true });
    }

    /**
     * Returns all squares in the grid as an array
     * @returns {Array<Object>} Array of all square data objects
     */
    getAllSquares() {
        return Object.values(this.grid);
    }

    /**
     * Gets remaining lock time for a square in milliseconds
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {number} Remaining time in milliseconds (0 if expired/available)
     */
    getTimeRemaining(x, y) {
        const square = this.getSquare(x, y);
        if (!square || !square.expiryTime) return 0;
        
        const remaining = square.expiryTime - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Formats time remaining as a human-readable string
     * @param {number} ms - Time in milliseconds
     * @returns {string} Formatted string (e.g., "2d 5h remaining")
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
     * Exports grid state as formatted JSON string
     * @returns {string} JSON string of grid state
     */
    exportState() {
        return JSON.stringify(this.grid, null, 2);
    }

    /**
     * Imports grid state from JSON string and validates/cleans it
     * @param {string} jsonString - JSON string containing grid state
     * @returns {boolean} True if import succeeded
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
     * Clears all grid data and persists the empty state
     */
    clearAll() {
        this.grid = {};
        this.saveState();
        this.notifyListeners({ fullRefresh: true });
    }

    /**
     * Registers a callback to be notified of state changes
     * @param {Function} callback - Callback function receiving change data
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Unregisters a previously registered change listener
     * @param {Function} callback - Callback function to remove
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notifies all registered listeners of a state change
     * @param {Object} changeData - Information about what changed
     */
    notifyListeners(changeData) {
        this.listeners.forEach(callback => callback(changeData));
    }

    /**
     * Starts periodic cleanup timer to remove expired squares every 5 minutes
     */
    startCleanupTimer() {
        // Clean up every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanExpiredSquares(this.grid);
            this.saveState();
        }, 5 * 60 * 1000);
    }

    /**
     * Stops the periodic cleanup timer
     */
    stopCleanupTimer() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

