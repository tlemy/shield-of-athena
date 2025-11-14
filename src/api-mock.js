/**
 * Mock API Layer - Simulates backend endpoints for demo purposes
 */

export class MockAPI {
    constructor() {
        this.baseDelay = 500; // Simulate network delay
    }

    /**
     * Simulate network delay
     */
    async delay(ms = this.baseDelay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate unique transaction ID
     */
    generateTransactionId() {
        return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    /**
     * Process donation
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
     * Get grid state (in a real app, this would fetch from backend)
     */
    async getGridState() {
        await this.delay(200);
        
        return {
            success: true,
            message: 'Grid state retrieved'
        };
    }

    /**
     * Generate tax receipt
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
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Send receipt via email (simulated)
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

