/**
 * Tax Receipt Generator - Creates and displays tax-deductible donation receipts
 */

export class ReceiptGenerator {
    /**
     * Generate HTML receipt
     */
    generateReceiptHTML(receiptData) {
        const {
            transactionId,
            email,
            amount,
            squares,
            timestamp,
            organizationName,
            organizationEIN,
            receiptNumber,
            notes
        } = receiptData;

        const date = new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const squaresList = squares.length <= 10 
            ? squares.map(s => `(${s.x}, ${s.y})`).join(', ')
            : `${squares.length} squares`;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        background: white;
                        color: #333;
                    }
                    .receipt {
                        border: 2px solid #333;
                        padding: 30px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 24px;
                    }
                    .header p {
                        margin: 5px 0;
                        font-size: 12px;
                    }
                    .section {
                        margin: 20px 0;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        margin: 8px 0;
                        padding: 5px 0;
                    }
                    .label {
                        font-weight: bold;
                    }
                    .amount {
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                        padding: 20px;
                        border: 2px solid #333;
                        margin: 20px 0;
                    }
                    .notes {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px dashed #666;
                        font-size: 11px;
                        line-height: 1.6;
                        color: #666;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 10px;
                        color: #999;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h1>${organizationName}</h1>
                        <p>Tax-Deductible Donation Receipt</p>
                        <p>EIN: ${organizationEIN}</p>
                    </div>

                    <div class="section">
                        <div class="row">
                            <span class="label">Receipt Number:</span>
                            <span>${receiptNumber}</span>
                        </div>
                        <div class="row">
                            <span class="label">Transaction ID:</span>
                            <span>${transactionId}</span>
                        </div>
                        <div class="row">
                            <span class="label">Date:</span>
                            <span>${date}</span>
                        </div>
                        <div class="row">
                            <span class="label">Donor Email:</span>
                            <span>${email}</span>
                        </div>
                    </div>

                    <div class="amount">
                        DONATION AMOUNT: $${amount.toFixed(2)}
                    </div>

                    <div class="section">
                        <div class="row">
                            <span class="label">Squares Claimed:</span>
                            <span>${squares.length}</span>
                        </div>
                        <div class="row">
                            <span class="label">Coordinates:</span>
                            <span>${squaresList}</span>
                        </div>
                        <div class="row">
                            <span class="label">Lock Duration:</span>
                            <span>7 days</span>
                        </div>
                    </div>

                    <div class="notes">
                        <p><strong>Important Tax Information:</strong></p>
                        <p>${notes}</p>
                        <p>No goods or services were provided in exchange for this donation. This receipt serves as proof of your charitable contribution.</p>
                    </div>

                    <div class="footer">
                        <p>Thank you for your contribution to Shield of Athena!</p>
                        <p>Generated on ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Display receipt in a new window
     */
    displayReceipt(receiptData) {
        const html = this.generateReceiptHTML(receiptData);
        const newWindow = window.open('', '_blank', 'width=700,height=900');
        
        if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();
            
            // Auto-print after a short delay
            setTimeout(() => {
                newWindow.print();
            }, 500);
        } else {
            alert('Please allow pop-ups to view your receipt');
        }
    }

    /**
     * Download receipt as HTML file
     */
    downloadReceipt(receiptData) {
        const html = this.generateReceiptHTML(receiptData);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receiptData.receiptNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Generate plain text receipt for email
     */
    generateReceiptText(receiptData) {
        const {
            transactionId,
            email,
            amount,
            squares,
            timestamp,
            organizationName,
            organizationEIN,
            receiptNumber,
            notes
        } = receiptData;

        const date = new Date(timestamp).toLocaleString();
        const squaresList = squares.length <= 10 
            ? squares.map(s => `(${s.x}, ${s.y})`).join(', ')
            : `${squares.length} squares`;

        return `
═══════════════════════════════════════════════════════
  ${organizationName}
  Tax-Deductible Donation Receipt
  EIN: ${organizationEIN}
═══════════════════════════════════════════════════════

Receipt Number: ${receiptNumber}
Transaction ID: ${transactionId}
Date: ${date}
Donor Email: ${email}

DONATION AMOUNT: $${amount.toFixed(2)}

Squares Claimed: ${squares.length}
Coordinates: ${squaresList}
Lock Duration: 7 days

───────────────────────────────────────────────────────
Important Tax Information:

${notes}

No goods or services were provided in exchange for this
donation. This receipt serves as proof of your charitable
contribution.

Thank you for your contribution to Shield of Athena!
═══════════════════════════════════════════════════════
        `.trim();
    }
}

export const receiptGenerator = new ReceiptGenerator();

