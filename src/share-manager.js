/**
 * Share Manager - Handles section sharing and image generation
 */

export class ShareManager {
    /**
     * Creates a new ShareManager instance
     * @param {StateManager} stateManager - State management service
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Generates a canvas image of a section (group of squares)
     * @param {Array<{x: number, y: number, color: string}>} squares - Squares to render
     * @param {number} squareSize - Size of each square in pixels
     * @returns {HTMLCanvasElement} Canvas with rendered section
     */
    generateSectionImage(squares, squareSize = 20) {
        if (!squares || squares.length === 0) {
            throw new Error('No squares to render');
        }

        const bounds = this.stateManager.getSquaresBounds(squares);
        if (!bounds) {
            throw new Error('Could not calculate bounds');
        }

        const width = bounds.maxX - bounds.minX + 1;
        const height = bounds.maxY - bounds.minY + 1;
        const padding = 2;

        const canvas = document.createElement('canvas');
        canvas.width = (width + padding * 2) * squareSize;
        canvas.height = (height + padding * 2) * squareSize;
        const ctx = canvas.getContext('2d', { alpha: false });

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        squares.forEach(square => {
            const x = square.x - bounds.minX + padding;
            const y = square.y - bounds.minY + padding;
            
            ctx.fillStyle = square.color || '#f5f5f5';
            ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
            
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            ctx.strokeRect(x * squareSize, y * squareSize, squareSize, squareSize);
        });

        return canvas;
    }

    /**
     * Converts canvas to blob for download or sharing
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {string} format - Image format (default: 'image/png')
     * @returns {Promise<Blob>} Image blob
     */
    async canvasToBlob(canvas, format = 'image/png') {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, format);
        });
    }

    /**
     * Downloads section as an image file
     * @param {string} transactionId - Transaction ID to download
     */
    async downloadSection(transactionId) {
        const transactions = this.stateManager.getTransactions();
        const transaction = transactions.find(t => t.transactionId === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const canvas = this.generateSectionImage(transaction.squares);
        const blob = await this.canvasToBlob(canvas);
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shield-section-${transactionId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Generates shareable URL with image data
     * @param {string} transactionId - Transaction ID to share
     * @returns {Promise<string>} Data URL of the image
     */
    async getShareImageDataUrl(transactionId) {
        const transactions = this.stateManager.getTransactions();
        const transaction = transactions.find(t => t.transactionId === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const canvas = this.generateSectionImage(transaction.squares);
        return canvas.toDataURL('image/png');
    }

    /**
     * Opens social media share dialog
     * @param {string} platform - Social media platform ('twitter', 'facebook', 'linkedin')
     * @param {string} transactionId - Transaction ID to share
     */
    async shareToSocial(platform, transactionId) {
        const transactions = this.stateManager.getTransactions();
        const transaction = transactions.find(t => t.transactionId === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const baseUrl = window.location.href.split('?')[0];
        const shareUrl = transaction.url || baseUrl;
        const text = `Check out my contribution to Shield of Athena! ${transaction.count} squares of collaborative pixel art. 🎨`;

        let socialUrl;
        switch (platform) {
            case 'twitter':
                socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'facebook':
                socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'linkedin':
                socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'reddit':
                socialUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`;
                break;
            default:
                throw new Error('Unsupported platform');
        }

        window.open(socialUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    }

    /**
     * Shows share modal with options
     * @param {string} transactionId - Transaction ID to share
     */
    showShareModal(transactionId) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content share-modal-content">
                <div class="modal-header">
                    <h2>Share Your Section</h2>
                    <button class="close-btn" aria-label="Close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="share-preview" id="sharePreview"></div>
                    
                    <div class="share-actions">
                        <h3>Share on Social Media</h3>
                        <div class="social-buttons">
                            <button class="btn btn-social btn-twitter" data-platform="twitter">
                                <span>🐦</span> Twitter
                            </button>
                            <button class="btn btn-social btn-facebook" data-platform="facebook">
                                <span>👤</span> Facebook
                            </button>
                            <button class="btn btn-social btn-linkedin" data-platform="linkedin">
                                <span>💼</span> LinkedIn
                            </button>
                            <button class="btn btn-social btn-reddit" data-platform="reddit">
                                <span>🤖</span> Reddit
                            </button>
                        </div>
                        
                        <h3>Download Image</h3>
                        <button class="btn btn-primary btn-download" id="downloadBtn">
                            📥 Download PNG
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const transactions = this.stateManager.getTransactions();
        const transaction = transactions.find(t => t.transactionId === transactionId);
        if (transaction) {
            const canvas = this.generateSectionImage(transaction.squares, 15);
            canvas.style.maxWidth = '100%';
            canvas.style.border = '2px solid #ddd';
            canvas.style.borderRadius = '4px';
            const preview = modal.querySelector('#sharePreview');
            preview.appendChild(canvas);
        }

        const closeBtn = modal.querySelector('.close-btn');
        const overlay = modal.querySelector('.modal-overlay');
        const socialButtons = modal.querySelectorAll('.btn-social');
        const downloadBtn = modal.querySelector('#downloadBtn');

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        socialButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const platform = btn.getAttribute('data-platform');
                try {
                    await this.shareToSocial(platform, transactionId);
                } catch (error) {
                    alert('Failed to share: ' + error.message);
                }
            });
        });

        downloadBtn.addEventListener('click', async () => {
            try {
                await this.downloadSection(transactionId);
            } catch (error) {
                alert('Failed to download: ' + error.message);
            }
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
}

