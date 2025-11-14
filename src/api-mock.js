/**
 * Mock API Layer - Simulates backend endpoints for demo purposes
 */

export class MockAPI {
    /**
     * Creates a new MockAPI instance
     * Simulates backend API endpoints with realistic network delays
     */
    constructor() {
        this.baseDelay = 500; // Simulate network delay
    }

    /**
     * Simulates network delay for API calls
     * @param {number} ms - Delay duration in milliseconds (default: baseDelay)
     * @returns {Promise<void>} Resolves after the specified delay
     */
    async delay(ms = this.baseDelay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generates a unique transaction ID for donation tracking
     * @returns {string} Unique transaction ID in format TXN-{timestamp}-{random}
     */
    generateTransactionId() {
        return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    /**
     * Processes a donation request and validates input data
     * @param {Object} donationData - The donation information
     * @param {string} donationData.email - Donor's email address
     * @param {Array<{x: number, y: number}>} donationData.squares - Selected grid squares
     * @param {string} donationData.color - Selected color for the squares
     * @param {number} donationData.totalAmount - Total donation amount in dollars
     * @returns {Promise<Object>} Result object with success status and transaction details
     */
    async processDonation(donationData) {
        await this.delay();

        const { email, squares, color, totalAmount } = donationData;

        // Validate input
        if (!email || !this.isValidEmail(email)) {
            return {
                success: false,
                error: 'Invalid email address'
            };
        }

        if (!squares || squares.length === 0) {
            return {
                success: false,
                error: 'No squares selected'
            };
        }

        if (!color) {
            return {
                success: false,
                error: 'No color selected'
            };
        }

        // Simulate payment processing
        const transactionId = this.generateTransactionId();
        
        return {
            success: true,
            transactionId,
            email,
            squares,
            color,
            amount: totalAmount,
            timestamp: new Date().toISOString(),
            message: 'Donation processed successfully'
        };
    }

    /**
     * Retrieves current grid state from backend (simulated)
     * In production, this would fetch the actual grid data
     * @returns {Promise<Object>} Result object with grid state data
     */
    async getGridState() {
        await this.delay(200);
        
        return {
            success: true,
            message: 'Grid state retrieved'
        };
    }

    /**
     * Generates a tax-deductible receipt for a donation
     * @param {Object} receiptData - Receipt information
     * @param {string} receiptData.transactionId - Unique transaction identifier
     * @param {string} receiptData.email - Donor's email address
     * @param {number} receiptData.amount - Donation amount in dollars
     * @param {Array<{x: number, y: number}>} receiptData.squares - Donated squares
     * @param {string} receiptData.timestamp - ISO timestamp of transaction
     * @returns {Promise<Object>} Result with receipt details
     */
    async generateReceipt(receiptData) {
        await this.delay(300);

        const { transactionId, email, amount, squares, timestamp } = receiptData;

        return {
            success: true,
            receipt: {
                transactionId,
                email,
                amount,
                squares,
                timestamp,
                organizationName: 'Shield of Athena Foundation',
                organizationEIN: '12-3456789', // Mock EIN
                receiptNumber: `RCP-${Date.now()}`,
                deductible: true,
                notes: 'This is a tax-deductible charitable donation. Please keep this receipt for your records.'
            }
        };
    }

    /**
     * Validates email address format using regex
     * @param {string} email - Email address to validate
     * @returns {boolean} True if email format is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Sends receipt via email (simulated - logs to console)
     * In production, this would trigger an actual email send
     * @param {string} email - Recipient email address
     * @param {Object} receipt - Receipt data to send
     * @returns {Promise<Object>} Result with success status and message
     */
    async sendReceiptEmail(email, receipt) {
        await this.delay();
        
        console.log(`[MOCK] Sending receipt to ${email}:`, receipt);
        
        return {
            success: true,
            message: `Receipt sent to ${email}`
        };
    }
}

export const mockAPI = new MockAPI();

