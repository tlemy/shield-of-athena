# Getting Started with Shield of Athena

## Quick Test

1. Open `index.html` in your browser:
   ```bash
   # Option 1: Direct open
   open index.html
   
   # Option 2: Use a local server (recommended)
   python3 -m http.server 8000
   # Then visit: http://localhost:8000
   ```

2. You should see a 1000x1000 pixel grid with controls at the top

## Testing the Features

### 1. Navigation
- **Scroll** with your mouse wheel to zoom in/out
- **Click and drag** to pan around the grid
- Use the **+/- buttons** in the control panel for zoom
- Click the **⌖ button** to center the view

### 2. Selecting Squares
- **Click** on any white square to select it
- **Click and drag** to select multiple squares
- Selected squares show a green border
- Locked squares (colored) show remaining lock time on hover

### 3. Making a Donation
- Select one or more squares
- Click **"Donate & Color"** button
- Choose a color from the picker or presets
- Enter your email address
- Check the agreement box
- Click the donation button

### 4. Editing Your Squares
- Your owned squares display a **gold corner badge** (⭐)
- Click any owned square to edit its color
- Choose a new color (free, unlimited changes!)
- Update instantly during your 7-day lock period
- Hover over owned squares to see "Click to edit" message

### 5. Viewing Receipt
- After donation, you'll see a success screen
- Click **"View Receipt"** to open in new window
- Click **"Download Receipt"** to save as HTML file
- Receipt includes transaction ID and tax information

### 5. Data Management
- **Export Grid**: Save current state to JSON file
- **Import Grid**: Load previously saved state
- **Clear All**: Reset entire grid (with confirmation)

## What to Test

### Basic Functionality
- [x] Grid renders correctly
- [x] Zoom in/out works smoothly
- [x] Pan around grid works
- [x] Square selection works
- [x] Multi-square selection works
- [x] Hover shows square info

### Donation Flow
- [x] Modal opens with correct square count
- [x] Color picker works
- [x] Color presets work
- [x] Email validation works
- [x] Processing animation shows
- [x] Success screen appears
- [x] Receipt generates correctly

### Color Editing
- [x] Owned squares show gold corner badge
- [x] Click on owned square opens edit modal
- [x] Edit modal shows current color
- [x] Color can be changed
- [x] Changes save instantly
- [x] Unlimited edits during lock period
- [x] Hover shows "Click to edit" for owned squares

### State Management
- [x] Squares stay colored after donation
- [x] Squares lock for 7 days
- [x] Time remaining shows on hover
- [x] Data persists on page reload (localStorage)
- [x] Export/import works

### Responsive Design
- [x] Works on desktop
- [x] Works on tablet
- [x] Works on mobile (touch controls)

## Known Limitations (Demo Mode)

1. **Mock Payments**: Uses simulated payment processing
2. **LocalStorage**: Data stored locally, not synced across devices
3. **No Authentication**: No user accounts or login
4. **Receipt Email**: Simulated, not actually sent
5. **Single User**: No real-time collaboration (for demo purposes)

## Next Steps for Production

To use this in production, you would need to:

1. **Replace Mock API** (`api-mock.js`) with real backend
2. **Integrate Payment Processor** (Stripe, PayPal, etc.)
3. **Add Database** to store grid state permanently
4. **Implement Email Service** for sending receipts
5. **Add User Authentication** (optional)
6. **Add WebSocket Support** for real-time updates
7. **Add Rate Limiting** to prevent abuse
8. **Add Analytics** to track donations

## Troubleshooting

### Grid doesn't appear
- Check browser console for errors
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Try clearing localStorage: `localStorage.clear()`

### Colors don't persist
- Check if localStorage is enabled in your browser
- Check browser console for quota errors

### Modal doesn't open
- Check if pop-ups are blocked
- Check browser console for JavaScript errors

### Receipt doesn't open
- Allow pop-ups for this page
- Try downloading instead of viewing

## Browser Compatibility

Tested and working on:
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓
- Mobile Safari ✓
- Chrome Mobile ✓

## Performance Tips

For best performance:
- Use Chrome or Edge (best canvas performance)
- Close other tabs to free up memory
- Don't zoom in too far (renders more squares)
- Limit selection to < 1000 squares at once

## Questions?

Check the main `README.md` for:
- API documentation
- Integration guide
- Architecture details
- Customization options

---

**Have fun creating collaborative pixel art!** 🎨

