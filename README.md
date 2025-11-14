# Shield of Athena - Donation Pixel Grid

A collaborative pixel art canvas where users donate to claim and color squares. Each square costs $0.05 and remains locked for 7 days. Perfect for donation campaigns, fundraising events, and community engagement.

## Features

- **1000x1000 Grid**: One million squares for collaborative art
- **Donation-Based**: $0.05 per square with tax-deductible receipts
- **Time Lock**: Squares locked for 7 days after claiming
- **Color Editing**: Free unlimited color changes for owned squares during lock period
- **Ownership Tracking**: Browser-based ownership with visual gold badge indicators
- **Interactive Canvas**: Zoom, pan, and multi-select functionality
- **Tax Receipts**: Automatic generation and download
- **No Dependencies**: Pure vanilla JavaScript (ES6+)
- **Easy Integration**: Single div + script tag
- **Persistent State**: LocalStorage for demo/development
- **Mobile Friendly**: Touch controls and responsive design

## Quick Start

### Basic Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Donation Campaign</title>
    <link rel="stylesheet" href="src/styles.css">
</head>
<body>
    <div id="shield-canvas"></div>

    <script type="module" src="src/state-manager.js"></script>
    <script type="module" src="src/api-mock.js"></script>
    <script type="module" src="src/receipt-generator.js"></script>
    <script type="module" src="src/grid-renderer.js"></script>
    <script type="module" src="src/donation-modal.js"></script>
    <script type="module" src="src/shield-canvas.js"></script>
    <script type="module">
        import { ShieldCanvas } from './src/shield-canvas.js';
        
        window.addEventListener('DOMContentLoaded', () => {
            ShieldCanvas.init('shield-canvas', {
                gridSize: 1000,
                squarePrice: 0.05,
                lockDuration: 7 * 24 * 60 * 60 * 1000
            });
        });
    </script>
</body>
</html>
```

### Configuration Options

```javascript
ShieldCanvas.init('container-id', {
    gridSize: 1000,           // Size of grid (default: 1000)
    squarePrice: 0.05,        // Price per square in USD (default: 0.05)
    lockDuration: 604800000   // Lock duration in ms (default: 7 days)
});
```

## Usage Guide

### For Users

1. **Navigate the Grid**
   - Scroll to zoom in/out
   - Click and drag to pan
   - Use zoom buttons for precise control

2. **Select Squares**
   - Click on white (available) squares to select
   - Click and drag to select multiple squares
   - Hold Shift/Ctrl for multi-select mode

3. **Make a Donation**
   - Click "Donate & Color" button
   - Choose your color from picker or presets
   - Enter your email for tax receipt
   - Complete donation

4. **Edit Your Squares**
   - Your owned squares show a gold corner badge
   - Click any owned square to edit its color
   - Change color unlimited times (free!)
   - Edits available during 7-day lock period

5. **Receive Receipt**
   - View receipt in browser
   - Download HTML receipt file
   - Receipt includes transaction ID and tax info

### For Developers

#### API Reference

##### ShieldCanvas.init(containerId, options)

Initialize the component in a container element.

```javascript
const instance = ShieldCanvas.init('my-container', {
    gridSize: 1000,
    squarePrice: 0.05,
    lockDuration: 7 * 24 * 60 * 60 * 1000
});
```

**Parameters:**
- `containerId` (string): ID of container element
- `options` (object): Configuration options
  - `gridSize` (number): Grid dimensions (default: 1000)
  - `squarePrice` (number): Price per square USD (default: 0.05)
  - `lockDuration` (number): Lock period in milliseconds (default: 7 days)

**Returns:** Instance object with access to all modules

##### ShieldCanvas.destroy(containerId)

Clean up and remove component instance.

```javascript
ShieldCanvas.destroy('my-container');
```

##### ShieldCanvas.getInstance(containerId)

Get existing instance.

```javascript
const instance = ShieldCanvas.getInstance('my-container');
console.log(instance.stateManager.getAllSquares());
```

#### State Manager API

Access via `instance.stateManager`

```javascript
const instance = ShieldCanvas.getInstance('my-container');
const stateManager = instance.stateManager;

// Get square data
const square = stateManager.getSquare(x, y);

// Check if square is available
const isAvailable = stateManager.isSquareAvailable(x, y);

// Check if user owns a square
const isOwned = stateManager.isOwnedSquare(x, y);

// Get all owned squares
const ownedSquares = stateManager.getOwnedSquares();

// Update color of owned square
const success = stateManager.updateSquareColor(x, y, '#FF0000');

// Get all squares
const allSquares = stateManager.getAllSquares();

// Export/Import state
const json = stateManager.exportState();
stateManager.importState(json);

// Clear all data
stateManager.clearAll();

// Listen to changes
stateManager.addListener((changeData) => {
    console.log('State changed:', changeData);
});
```

#### Grid Renderer API

Access via `instance.gridRenderer`

```javascript
const renderer = instance.gridRenderer;

// Get selected squares
const selected = renderer.getSelectedSquares();

// Clear selection
renderer.clearSelection();

// Center view
renderer.centerView();

// Request redraw
renderer.requestRedraw();
```

## Architecture

### Component Structure

```
shield-of-athena/
├── index.html                  # Demo page
├── README.md                   # This file
└── src/
    ├── shield-canvas.js        # Main orchestrator
    ├── state-manager.js        # State & persistence
    ├── grid-renderer.js        # Canvas rendering
    ├── donation-modal.js       # Donation UI
    ├── api-mock.js            # Mock backend API
    ├── receipt-generator.js    # Tax receipts
    └── styles.css             # Component styles
```

### Module Responsibilities

- **shield-canvas.js**: Main component that initializes and coordinates all modules
- **state-manager.js**: Manages grid state, localStorage persistence, expiry logic
- **grid-renderer.js**: Canvas-based rendering with zoom, pan, selection
- **donation-modal.js**: User interface for donations and color selection
- **api-mock.js**: Simulates backend endpoints for demo purposes
- **receipt-generator.js**: Generates and displays tax-deductible receipts
- **styles.css**: All styling for components and UI elements

## Data Structure

### Grid State

Each square is stored with the following structure:

```javascript
{
    "x,y": {
        x: 0,                    // Grid X coordinate
        y: 0,                    // Grid Y coordinate
        color: "#4CAF50",        // Hex color code
        email: "user@example.com", // Donor email
        timestamp: 1699999999999,  // Donation timestamp
        expiryTime: 1700604799999  // Lock expiry (timestamp + 7 days)
    }
}
```

### Receipt Data

```javascript
{
    transactionId: "TXN-123456789-ABC123",
    receiptNumber: "RCP-1699999999999",
    email: "user@example.com",
    amount: 1.50,
    squares: [{x: 0, y: 0}, ...],
    timestamp: "2024-11-14T12:00:00.000Z",
    organizationName: "Shield of Athena Foundation",
    organizationEIN: "12-3456789",
    deductible: true,
    notes: "Tax-deductible charitable donation..."
}
```

## Backend Integration

The component uses a mock API layer (`api-mock.js`) for demo purposes. To integrate with a real backend:

1. **Replace MockAPI class** with real API calls
2. **Implement endpoints**:
   - `POST /api/donate` - Process payment and update grid
   - `GET /api/grid/state` - Fetch current grid state
   - `POST /api/receipt` - Generate and send receipt

### Example Backend Integration

```javascript
// Create real-api.js
export class RealAPI {
    async processDonation(donationData) {
        const response = await fetch('/api/donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donationData)
        });
        return response.json();
    }
    
    async getGridState() {
        const response = await fetch('/api/grid/state');
        return response.json();
    }
    
    async generateReceipt(receiptData) {
        const response = await fetch('/api/receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(receiptData)
        });
        return response.json();
    }
}
```

Then update `shield-canvas.js` to use `RealAPI` instead of `MockAPI`.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with ES6 support

## Performance

- **Viewport Culling**: Only visible squares are rendered
- **Efficient Redraw**: Partial updates minimize CPU usage
- **Canvas Rendering**: Hardware-accelerated graphics
- **Optimized for 1M pixels**: Smooth performance on modern hardware

## Customization

### Styling

Customize appearance by modifying `styles.css`:

```css
/* Change primary color */
.btn-primary {
    background: #YOUR_COLOR;
}

/* Adjust canvas height */
.shield-canvas-wrapper {
    height: 600px; /* Your preferred height */
}
```

### Grid Size

Adjust grid size in configuration:

```javascript
ShieldCanvas.init('container', {
    gridSize: 500  // Smaller 500x500 grid
});
```

## Development

### Running Locally

1. Clone the repository
2. Open `index.html` in a browser
3. No build step required!

### Testing

The component includes a mock API layer that simulates:
- Network delays
- Payment processing
- Receipt generation
- Email delivery

All data is stored in localStorage for persistence across sessions.

## Security Considerations

For production use, ensure:

1. **Server-side validation**: Never trust client-side data
2. **Payment processing**: Use secure payment gateways (Stripe, PayPal)
3. **Email verification**: Verify email addresses
4. **Rate limiting**: Prevent abuse
5. **HTTPS**: Always use encrypted connections
6. **CSRF protection**: Implement CSRF tokens
7. **Input sanitization**: Clean all user inputs

## License

This is a demo project. Adapt as needed for your use case.

## Support

For issues or questions, please refer to the source code comments or create an issue in the repository.

## Credits

Built with vanilla JavaScript. No external dependencies.

---

**Note**: This is a demonstration component using mock payment processing and localStorage. For production use, integrate with real payment processors, backend APIs, and databases.

