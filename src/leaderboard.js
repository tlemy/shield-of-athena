/**
 * Leaderboard - Displays top contributors by square count
 */

export class Leaderboard {
    /**
     * Creates a new Leaderboard instance
     * @param {HTMLElement} container - Container element for the leaderboard
     * @param {StateManager} stateManager - State management service
     */
    constructor(container, stateManager) {
        this.container = container;
        this.stateManager = stateManager;
        this.leaderboardElement = null;
        this.mockUsers = this.generateMockUsers();
        this.init();
    }

    /**
     * Generates mock users with random square counts
     * @returns {Array<{username: string, squareCount: number}>} Mock user data
     */
    generateMockUsers() {
        const mockNames = [
            'PixelMaster',
            'ArtLover99',
            'ColorKing',
            'GridQueen',
            'DonateHero',
            'SquareOne',
            'PaintPro',
            'CanvasChamp',
            'MosaicMaker',
            'BitArtist',
            'NeonDreamer',
            'RetroGamer',
            'CyberArtist',
            'PixelWizard',
            'VaporWave',
            'DigitalNinja',
            'ChromaCraft',
            'ArtisanKev',
            'BlockBuilder',
            'MegaPixel',
            'TileKing',
            'SquareHero',
            'GridMaster2000',
            'PaintLegend',
            'ColorCrush',
            'PixelPundit',
            'ArtDeco88',
            'MosaicQueen',
            'ByteBeauty',
            'CanvasKnight'
        ];
        
        // Create users with decreasing square counts
        // Top user gets ~1000, then decreases gradually
        const users = mockNames.map((username, index) => {
            let squareCount;
            if (index === 0) {
                // Top user: 950-1050
                squareCount = Math.floor(Math.random() * 100) + 950;
            } else if (index < 5) {
                // Top 5: 500-900
                squareCount = Math.floor(Math.random() * 400) + 500;
            } else if (index < 10) {
                // Top 10: 200-500
                squareCount = Math.floor(Math.random() * 300) + 200;
            } else if (index < 20) {
                // Top 20: 50-200
                squareCount = Math.floor(Math.random() * 150) + 50;
            } else {
                // Rest: 10-50
                squareCount = Math.floor(Math.random() * 40) + 10;
            }
            
            return { username, squareCount };
        });
        
        // Shuffle to make it less predictable
        return users.sort(() => Math.random() - 0.5);
    }

    /**
     * Initializes the leaderboard UI
     */
    init() {
        this.create();
        this.update();
        
        // Listen for state changes
        this.stateManager.addListener((changeData) => {
            if (changeData && changeData.leaderboardUpdate) {
                this.update();
            }
        });
    }

    /**
     * Creates the leaderboard HTML structure
     */
    create() {
        this.leaderboardElement = document.createElement('div');
        this.leaderboardElement.className = 'leaderboard';
        this.leaderboardElement.innerHTML = `
            <div class="leaderboard-header">
                <h3>🏆 Leaderboard</h3>
                <p class="leaderboard-subtitle">Top 15 Contributors</p>
            </div>
            <div class="leaderboard-list" id="leaderboardList">
                <div class="leaderboard-loading">Loading...</div>
            </div>
        `;
        this.container.appendChild(this.leaderboardElement);
    }

    /**
     * Updates the leaderboard with current data
     */
    update() {
        const realLeaderboard = this.stateManager.getLeaderboard();
        
        // Merge real users with mock users
        const combinedData = [...realLeaderboard];
        
        // Add mock users that don't conflict with real usernames
        const realUsernames = new Set(realLeaderboard.map(u => u.username));
        this.mockUsers.forEach(mockUser => {
            if (!realUsernames.has(mockUser.username)) {
                combinedData.push(mockUser);
            }
        });
        
        // Sort by square count
        combinedData.sort((a, b) => b.squareCount - a.squareCount);
        
        // Add ranks
        combinedData.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        // Take top 15
        const top15 = combinedData.slice(0, 15);
        
        this.render(top15, realUsernames);
    }

    /**
     * Renders the leaderboard entries
     * @param {Array} entries - Leaderboard entries to render
     * @param {Set} realUsernames - Set of real usernames to highlight
     */
    render(entries, realUsernames) {
        const listElement = this.leaderboardElement.querySelector('#leaderboardList');
        
        if (entries.length === 0) {
            listElement.innerHTML = '<div class="leaderboard-empty">No contributors yet</div>';
            return;
        }
        
        listElement.innerHTML = entries.map(entry => {
            const isCurrentUser = realUsernames.has(entry.username);
            const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
            const userClass = isCurrentUser ? 'current-user' : 'mock-user';
            const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
            
            return `
                <div class="leaderboard-entry ${rankClass} ${userClass}">
                    <div class="leaderboard-rank">
                        ${rankEmoji ? rankEmoji : `#${entry.rank}`}
                    </div>
                    <div class="leaderboard-username">
                        ${entry.username}
                        ${isCurrentUser ? '<span class="you-badge">YOU</span>' : ''}
                    </div>
                    <div class="leaderboard-count">
                        ${entry.squareCount} sq
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Destroys the leaderboard
     */
    destroy() {
        if (this.leaderboardElement) {
            this.leaderboardElement.remove();
        }
    }
}

