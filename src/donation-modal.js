/**
 * Donation Modal - Handles donation UI and user interaction
 */

export class DonationModal {
    /**
     * Creates a new DonationModal instance
     * @param {number} squarePrice - Price per square in dollars
     * @param {MockAPI} mockAPI - API service for processing donations
     * @param {ReceiptGenerator} receiptGenerator - Service for generating receipts
     * @param {StateManager} stateManager - State management service
     */
    constructor(squarePrice, mockAPI, receiptGenerator, stateManager) {
        this.squarePrice = squarePrice;
        this.mockAPI = mockAPI;
        this.receiptGenerator = receiptGenerator;
        this.stateManager = stateManager;
        this.modal = null;
        this.onComplete = null;
    }

    /**
     * Displays the donation modal with selected squares
     * @param {Array<{x: number, y: number}>} selectedSquares - Squares to be donated
     * @param {Function} onComplete - Callback function called after donation completes
     */
    show(selectedSquares, onComplete) {
        this.onComplete = onComplete;
        this.createModal(selectedSquares);
    }

    /**
     * Hides and removes the modal from the DOM
     */
    hide() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    /**
     * Creates and displays the modal DOM element with form
     * @param {Array<{x: number, y: number}>} selectedSquares - Squares for donation
     */
    createModal(selectedSquares) {
        // Remove existing modal if any
        this.hide();
        
        const totalAmount = selectedSquares.length * this.squarePrice;
        
        this.modal = document.createElement('div');
        this.modal.className = 'donation-modal';
        this.modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Complete Your Donation</h2>
                    <button class="close-btn" aria-label="Close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="donation-summary">
                        <div class="summary-row">
                            <span>Squares Selected:</span>
                            <strong>${selectedSquares.length}</strong>
                        </div>
                        <div class="summary-row">
                            <span>Price per Square:</span>
                            <strong>$${this.squarePrice.toFixed(2)}</strong>
                        </div>
                        <div class="summary-row total">
                            <span>Total Donation:</span>
                            <strong>$${totalAmount.toFixed(2)}</strong>
                        </div>
                    </div>
                    
                    <form class="donation-form" id="donationForm">
                        <div class="form-group">
                            <label for="colorPicker">Choose Your Color:</label>
                        <div class="color-picker-wrapper">
                            <input type="color" id="colorPicker" name="color" value="#4CAF50" required>
                            <div class="color-presets">
                                <button type="button" class="color-preset" data-color="#FF0000" style="background: #FF0000;" title="Red"></button>
                                <button type="button" class="color-preset" data-color="#00FF00" style="background: #00FF00;" title="Green"></button>
                                <button type="button" class="color-preset" data-color="#0000FF" style="background: #0000FF;" title="Blue"></button>
                                <button type="button" class="color-preset" data-color="#FFFF00" style="background: #FFFF00;" title="Yellow"></button>
                                <button type="button" class="color-preset" data-color="#FF00FF" style="background: #FF00FF;" title="Magenta"></button>
                            <button type="button" class="color-preset" data-color="#00FFFF" style="background: #00FFFF;" title="Cyan"></button>
                            <button type="button" class="color-preset" data-color="#000000" style="background: #000000;" title="Black"></button>
                            <button type="button" class="color-preset" data-color="#FFFFFF" style="background: #FFFFFF; border: 1px solid #ddd;" title="White"></button>
                            </div>
                        </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email Address:</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                placeholder="your.email@example.com"
                                required
                            >
                            <small>For your tax-deductible receipt</small>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="terms" required>
                                <span>I understand this is a charitable donation and my squares will be locked for 7 days</span>
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="submitBtn">
                                Donate $${totalAmount.toFixed(2)}
                            </button>
                        </div>
                        
                        <div class="processing-message" style="display: none;">
                            <div class="spinner"></div>
                            <p>Processing your donation...</p>
                        </div>
                        
                        <div class="error-message" style="display: none;"></div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        this.attachModalListeners(selectedSquares, totalAmount);
        
        // Focus on email input
        setTimeout(() => {
            const emailInput = this.modal.querySelector('#email');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    /**
     * Attaches all event listeners to modal elements
     * Handles close, color selection, and form submission
     * @param {Array<{x: number, y: number}>} selectedSquares - Squares for donation
     * @param {number} totalAmount - Total donation amount in dollars
     */
    attachModalListeners(selectedSquares, totalAmount) {
        const closeBtn = this.modal.querySelector('.close-btn');
        const cancelBtn = this.modal.querySelector('#cancelBtn');
        const overlay = this.modal.querySelector('.modal-overlay');
        const form = this.modal.querySelector('#donationForm');
        const colorPicker = this.modal.querySelector('#colorPicker');
        const colorPresets = this.modal.querySelectorAll('.color-preset');
        
        // Close handlers
        const closeModal = () => this.hide();
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // ESC key to close
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Color preset buttons
        colorPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.getAttribute('data-color');
                colorPicker.value = color;
            });
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(selectedSquares, totalAmount);
        });
    }

    /**
     * Handles donation form submission and processes the donation
     * Validates input, calls API, updates grid state, and generates receipt
     * @param {Array<{x: number, y: number}>} selectedSquares - Squares to donate
     * @param {number} totalAmount - Total donation amount in dollars
     */
    async handleSubmit(selectedSquares, totalAmount) {
        const form = this.modal.querySelector('#donationForm');
        const submitBtn = this.modal.querySelector('#submitBtn');
        const processingMsg = this.modal.querySelector('.processing-message');
        const errorMsg = this.modal.querySelector('.error-message');
        const colorPicker = this.modal.querySelector('#colorPicker');
        const emailInput = this.modal.querySelector('#email');
        
        // Get form values
        const color = colorPicker.value;
        const email = emailInput.value.trim();
        
        // Disable form
        submitBtn.disabled = true;
        processingMsg.style.display = 'block';
        errorMsg.style.display = 'none';
        
        try {
            // Process donation through mock API
            const donationResult = await this.mockAPI.processDonation({
                email,
                squares: selectedSquares,
                color,
                totalAmount
            });
            
            if (!donationResult.success) {
                throw new Error(donationResult.error || 'Donation failed');
            }
            
            // Update grid state
            const squaresWithColor = selectedSquares.map(s => ({
                ...s,
                color,
                email
            }));
            this.stateManager.setSquares(squaresWithColor);
            
            // Track ownership with original color
            this.stateManager.addOwnedSquares(donationResult.transactionId, selectedSquares, color);
            
            // Generate receipt
            const receiptResult = await this.mockAPI.generateReceipt({
                transactionId: donationResult.transactionId,
                email,
                amount: totalAmount,
                squares: selectedSquares,
                timestamp: donationResult.timestamp
            });
            
            if (receiptResult.success) {
                // Show success and display receipt
                this.showSuccess(receiptResult.receipt);
            }
            
            // Notify completion
            if (this.onComplete) {
                this.onComplete(true);
            }
            
        } catch (error) {
            // Show error
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            processingMsg.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    /**
     * Displays success message and receipt actions after donation
     * @param {Object} receiptData - Receipt information for the completed donation
     */
    showSuccess(receiptData) {
        const modalBody = this.modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="success-message">
                <div class="success-icon">✓</div>
                <h3>Donation Successful!</h3>
                <p>Thank you for your contribution!</p>
                <p>Your squares have been locked for 7 days.</p>
                
                <div class="receipt-actions">
                    <button class="btn btn-primary" id="viewReceiptBtn">View Receipt</button>
                    <button class="btn btn-secondary" id="downloadReceiptBtn">Download Receipt</button>
                </div>
                
                <button class="btn btn-text" id="closeSuccessBtn">Close</button>
            </div>
        `;
        
        // Attach receipt actions
        const viewBtn = this.modal.querySelector('#viewReceiptBtn');
        const downloadBtn = this.modal.querySelector('#downloadReceiptBtn');
        const closeBtn = this.modal.querySelector('#closeSuccessBtn');
        
        viewBtn.addEventListener('click', () => {
            this.receiptGenerator.displayReceipt(receiptData);
        });
        
        downloadBtn.addEventListener('click', () => {
            this.receiptGenerator.downloadReceipt(receiptData);
        });
        
        closeBtn.addEventListener('click', () => {
            this.hide();
        });
    }

}

