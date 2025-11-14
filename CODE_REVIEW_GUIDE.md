# Code Review Guide - Shield of Athena

This guide provides a structured approach to reviewing the Shield of Athena codebase. Follow this order to understand the architecture from the ground up.

---

## Review Order

### 1. Start with the Entry Point: `index.html`
**Location:** `/index.html`

**What to review:**
- Overall HTML structure and how components are initialized
- Script imports and their order
- DOM containers and how they're set up
- Basic page layout and meta information

**Key points:**
- Look for `ShieldCanvas.init()` call - this is where everything starts
- Note the container element that hosts the canvas
- Check script loading order (all modules are ES6 imports)

---

### 2. Core State Management: `state-manager.js`
**Location:** `/src/state-manager.js`

**What to review:**
- How grid state is stored and persisted (localStorage)
- Ownership tracking mechanism
- Square expiry logic and cleanup
- Listener pattern for state changes

**Key functions to understand:**
- `constructor()` - Initialization with grid size and lock duration
- `loadState()` / `saveState()` - Persistence layer
- `setSquare()` / `setSquares()` - How squares are marked as donated
- `isSquareAvailable()` - Availability logic with expiry checking
- `addOwnedSquares()` / `isOwnedSquare()` - Ownership tracking
- `getTransactions()` - Transaction navigation
- `startCleanupTimer()` - Automatic cleanup of expired squares

**Important concepts:**
- Grid squares are stored by key format "x,y"
- Each square has color, email, timestamp, and expiryTime
- Ownership is tracked separately to allow color editing
- State changes trigger listener callbacks

---

### 3. Mock API Layer: `api-mock.js`
**Location:** `/src/api-mock.js`

**What to review:**
- Simulated backend API calls
- Validation logic for donations
- Transaction ID generation
- Receipt generation

**Key functions:**
- `processDonation()` - Main donation processing with validation
- `generateReceipt()` - Receipt data structure
- `isValidEmail()` - Email validation
- `delay()` - Network delay simulation

**Production considerations:**
- This is a mock - replace with real API calls in production
- All validation here should also exist on backend
- Transaction IDs need to come from backend in production

---

### 4. Canvas Rendering: `grid-renderer.js`
**Location:** `/src/grid-renderer.js`

**What to review:**
- Canvas-based rendering system
- Pan and zoom functionality
- Mouse/touch interaction handling
- Selection and paint modes

**Key functions:**
- `constructor()` - Setup of canvas and interaction state
- `render()` - Main rendering loop with viewport culling
- `screenToGrid()` / `gridToScreen()` - Coordinate transformations
- `handleMouseDown()` / `handleMouseMove()` / `handleMouseUp()` - Interaction
- `handleWheel()` - Zoom functionality
- `updateDragSelection()` - Rectangle selection
- `setPaintMode()` / `paintSquare()` - Color editing for owned squares

**Performance considerations:**
- Viewport culling: only renders visible squares
- RequestAnimationFrame with needsRedraw flag
- Efficient coordinate transformations

**Interaction modes:**
- Selection mode: Click/drag to select available squares
- Pan mode: Right-click or clicking locked squares to pan view
- Paint mode: Color owned squares by dragging

---

### 5. Donation Modal UI: `donation-modal.js`
**Location:** `/src/donation-modal.js`

**What to review:**
- Modal creation and lifecycle
- Form handling and validation
- Color selection interface
- Success/error states

**Key functions:**
- `show()` - Display modal with selected squares
- `createModal()` - DOM generation
- `attachModalListeners()` - Event wiring
- `handleSubmit()` - Form processing and API calls
- `showSuccess()` - Receipt display after donation

**User flow:**
1. User selects squares on canvas
2. Clicks donate button
3. Modal shows with square count and total
4. User picks color and enters email
5. Form submits → API call → State update → Receipt generation

---

### 6. Receipt Generation: `receipt-generator.js`
**Location:** `/src/receipt-generator.js`

**What to review:**
- HTML receipt generation
- Print functionality
- Download as file
- Plain text format for email

**Key functions:**
- `generateReceiptHTML()` - Creates formatted HTML receipt
- `displayReceipt()` - Opens in new window with print dialog
- `downloadReceipt()` - Saves as HTML file
- `generateReceiptText()` - Plain text version

**Tax considerations:**
- Receipt includes EIN number
- Marked as tax-deductible
- Includes all required donation details

---

### 7. Main Orchestrator: `shield-canvas.js`
**Location:** `/src/shield-canvas.js`

**What to review:**
- How all modules are wired together
- Control panel creation and event handling
- Instance management (multiple canvases possible)
- Configuration options

**Key functions:**
- `init()` - Entry point that creates all components
- `createControlPanel()` - UI controls creation
- `attachControlListeners()` - All button event handlers
- `destroy()` - Cleanup and resource management

**Component interaction:**
- ShieldCanvas creates all other components
- StateManager is central hub for data
- GridRenderer handles visualization
- DonationModal manages user input
- All components communicate through state changes

**Control panel features:**
- Donate button (triggers modal)
- Zoom controls (in/out/center)
- Transaction navigation (browse owned squares)
- Paint mode toggle (edit colors)
- Clear buttons (selection and owned squares)

---

### 8. Styling: `styles.css`
**Location:** `/src/styles.css`

**What to review:**
- CSS architecture and organization
- Responsive design considerations
- Component-specific styles
- Animation and transitions

**Key sections:**
1. Base styles and resets
2. Layout and containers
3. Canvas and control panel
4. Modal styles
5. Button styles
6. Color picker components
7. Responsive breakpoints

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│          index.html (Entry Point)            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│       shield-canvas.js (Orchestrator)        │
│  - Creates and wires all components          │
│  - Manages control panel                     │
└────┬────┬────┬────┬────┬──────────────────┬─┘
     │    │    │    │    │                  │
     ▼    ▼    ▼    ▼    ▼                  ▼
  ┌────┐┌────┐┌────┐┌────┐┌────┐      ┌─────────┐
  │Grid││Dona││Rec.││Mock││State│      │styles   │
  │Rend││tion││Gen ││API ││Mgr  │      │.css     │
  │    ││Mod.││    ││    ││     │      │         │
  └────┘└────┘└────┘└────┘└────┘      └─────────┘
    │      │      │      │      │
    └──────┴──────┴──────┴──────┘
              │
              ▼
        localStorage
```

---

## Key Design Patterns

### 1. Single Responsibility Principle
- **StateManager**: Only handles data and persistence
- **GridRenderer**: Only handles visualization
- **DonationModal**: Only handles user input
- **MockAPI**: Only handles backend simulation
- **ReceiptGenerator**: Only handles receipt creation

### 2. Observer Pattern
- StateManager implements listener pattern
- Components register callbacks for state changes
- GridRenderer auto-redraws on state updates

### 3. Separation of Concerns
- Business logic (StateManager, MockAPI)
- Presentation (GridRenderer, DonationModal)
- Coordination (ShieldCanvas)

---

## Testing Checklist

When reviewing code for quality, verify:

### Functionality
- [ ] Can select available squares
- [ ] Can pan and zoom canvas
- [ ] Can donate selected squares
- [ ] Receipt generates correctly
- [ ] Owned squares show gold badge
- [ ] Can paint owned squares
- [ ] Can reset to original color
- [ ] Transaction navigation works
- [ ] Squares expire after 7 days
- [ ] State persists across page reload

### Code Quality
- [ ] Each function has single responsibility
- [ ] Functions are documented with JSDoc
- [ ] Variable names are descriptive
- [ ] No magic numbers (constants are named)
- [ ] Error handling is present
- [ ] Input validation exists
- [ ] No code duplication

### Performance
- [ ] Canvas only renders visible squares (viewport culling)
- [ ] Redraw only when necessary (needsRedraw flag)
- [ ] localStorage operations are efficient
- [ ] No memory leaks (cleanup in destroy)

### User Experience
- [ ] Hover shows square information
- [ ] Visual feedback for all interactions
- [ ] Loading states during processing
- [ ] Clear error messages
- [ ] Responsive design works
- [ ] Touch support for mobile

---

## Common Issues to Look For

### State Management
- Check for race conditions in async operations
- Verify state is saved after every change
- Ensure expired squares are properly cleaned

### Canvas Rendering
- Look for coordinate calculation errors
- Verify transformations handle edge cases
- Check for performance issues with large grids

### User Input
- Validate all form inputs
- Check email format validation
- Ensure color format is valid hex

### Memory Management
- Event listeners are cleaned up
- Intervals are cleared on destroy
- No circular references

---

## Extension Points

Areas where the codebase can be extended:

1. **Backend Integration**: Replace MockAPI with real API calls
2. **Authentication**: Add user accounts and authentication
3. **Payment Processing**: Integrate real payment gateway
4. **Social Features**: Share owned squares, view global stats
5. **Advanced Editing**: More paint tools, patterns, gradients
6. **Analytics**: Track user behavior and donation patterns
7. **Notifications**: Email confirmations, expiry warnings
8. **Export**: Download grid as image, share on social media

---

## Questions to Ask During Review

1. **Architecture**: Does each module have a clear, single purpose?
2. **Maintainability**: Can a new developer understand this code?
3. **Scalability**: Will this handle 1000x1000 grid? 10000 users?
4. **Security**: Are inputs validated? Is user data safe?
5. **Accessibility**: Can users with disabilities use this?
6. **Documentation**: Are complex algorithms explained?
7. **Testing**: How would you unit test this?
8. **Production**: What needs to change before going live?

---

## Production Readiness Checklist

Before deploying to production:

- [ ] Replace MockAPI with real backend
- [ ] Add authentication and authorization
- [ ] Implement actual payment processing
- [ ] Add server-side validation
- [ ] Set up error logging and monitoring
- [ ] Add rate limiting and abuse prevention
- [ ] Implement proper session management
- [ ] Add CSRF protection
- [ ] Set up CDN for static assets
- [ ] Optimize bundle size and loading
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment variables
- [ ] Add privacy policy and terms of service
- [ ] Implement GDPR compliance
- [ ] Set up backup and disaster recovery

---

## Contact and Support

For questions about the codebase:
1. Check inline code comments
2. Review function JSDoc documentation
3. Refer to README.md for setup instructions
4. Check GETTING_STARTED.md for usage guide
5. Review COLOR_EDITING_FEATURE.md for paint mode details

---

**Last Updated:** November 14, 2025
**Version:** 1.0

