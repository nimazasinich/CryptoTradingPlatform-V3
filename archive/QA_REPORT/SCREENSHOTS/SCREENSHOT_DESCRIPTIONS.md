# Screenshot Documentation
## Visual Evidence Reference Guide

**Note:** This document describes the screenshots that would be captured in a full browser-based QA test. Since this analysis was performed via code inspection in a cloud environment, actual PNG files are not included. Use this guide to capture screenshots when performing manual browser testing.

---

## Desktop Viewports (1920x1080)

### Critical Path Screenshots

#### 1. desktop-dashboard-loaded.png
**Description:** Full dashboard view after successful data load  
**Capture When:** All API calls complete, data populates cards  
**What to Show:**
- All 4 stat cards (Market Cap, Volume, BTC Dominance, Active Coins)
- Live price ticker scrolling at bottom
- Market overview table with coins
- Sentiment gauge showing Fear & Greed index
- News feed with latest articles

**Testing Focus:**
- ✅ Skeleton loaders have transitioned out
- ✅ Data is formatted correctly (no $0.00 values)
- ✅ Sparkline charts render in stat cards
- ✅ Colors are vibrant (purple/cyan accents)
- ✅ Glassmorphism effects visible

---

#### 2. desktop-loading-state.png
**Description:** Initial loading screen while app initializes  
**Capture When:** Immediately after page load, before React hydrates  
**What to Show:**
- Purple spinner with three layers (ring, active border, glow)
- "Loading Workspace..." text below spinner
- Dark background with radial gradient
- Centered layout

**Testing Focus:**
- ✅ Spinner is smooth (60fps)
- ✅ Text is readable (check contrast)
- ⚠️ Note if animations feel too fast/slow
- ⚠️ Verify blur effect isn't too heavy

---

#### 3. desktop-stat-cards-hover.png
**Description:** Dashboard stat cards with hover effects active  
**Capture When:** Hovering over one of the 4 main stat cards  
**What to Show:**
- Hovered card with animated gradient border
- Card slightly lifted (-translate-y-1)
- Glow effect increased opacity
- Border opacity increased
- Adjacent cards in normal state for comparison

**Testing Focus:**
- ✅ Gradient border animates smoothly
- ✅ Scale/transform doesn't cause jank
- ✅ Hover state is clearly different from normal
- ✅ Transition feels natural (~300ms)

---

#### 4. desktop-sidebar-expanded.png
**Description:** Navigation sidebar in full expanded state  
**Capture When:** Default state on desktop (280px width)  
**What to Show:**
- CryptoOne logo with Zap icon
- All menu items with icons and labels
- Active page indicator (purple bar on left)
- Submenu expanded (e.g., Settings)
- "Connect Wallet" button at bottom
- "System Operational" status with ping animation

**Testing Focus:**
- ✅ Active state clearly visible
- ✅ Icons aligned with text
- ✅ Submenu indentation correct
- ✅ Footer elements styled properly

---

#### 5. desktop-sidebar-collapsed.png
**Description:** Sidebar in collapsed state (80px width)  
**Capture When:** After clicking collapse icon  
**What to Show:**
- Only icons visible, no text labels
- Logo changes to icon-only
- Active indicator still shows
- Tooltip should appear on hover (note in caption)
- Wallet button becomes icon-only

**Testing Focus:**
- ✅ Animation is smooth (spring physics)
- ✅ Icons remain visible and clickable
- ✅ No text overflow or clipping
- ✅ Layout doesn't break

---

#### 6. desktop-trading-form.png
**Description:** Order form in Trading Hub with validation  
**Capture When:** Trading Hub page, form with some errors shown  
**What to Show:**
- Buy/Sell toggle (one selected)
- Order type tabs (Limit, Market, Stop-Limit)
- Price, Amount, Total input fields
- Percentage quick-select buttons (25%, 50%, 75%, 100%)
- Error messages visible (red with AlertCircle icon)
- Available balance display
- Submit button (Buy/Sell)

**Testing Focus:**
- ✅ Error messages are aligned correctly
- ✅ Icons don't overlap text
- ✅ Input focus states visible
- ⚠️ Check error icon alignment (should use items-start)

---

#### 7. desktop-modal-confirm.png
**Description:** Order confirmation modal overlay  
**Capture When:** After clicking Buy/Sell, before confirming  
**What to Show:**
- Dark overlay with backdrop blur
- Modal centered with glass card styling
- "Confirm Order" title
- Order details (Type, Side, Amount, Price, Total)
- Cancel and Confirm buttons
- Backdrop should show underlying content (blurred)

**Testing Focus:**
- ⚠️ Check for role="dialog" in devtools
- ⚠️ Test keyboard focus (should be trapped in modal)
- ⚠️ Verify Escape key closes modal
- ✅ Modal is centered and readable

---

#### 8. desktop-focus-indicators.png
**Description:** Tab focus states across various elements  
**Capture When:** Tabbing through interactive elements  
**What to Show:**
- Button with visible focus ring (purple, 2px)
- Input field with focus ring
- Sidebar menu item focused
- Link with focus indicator
- Use overlay arrows or annotations to highlight rings

**Testing Focus:**
- ⚠️ PRIMARY ISSUE: Check if all elements have visible focus
- ⚠️ Ring should be 2px width, purple color
- ⚠️ Should be visible on all backgrounds
- ✅ No default blue outline

---

#### 9. desktop-error-boundary.png
**Description:** Error boundary catch screen  
**Capture When:** Trigger error by modifying code or throw test error  
**What to Show:**
- Centered glass card with red accent
- AlertTriangle icon (red, 32px)
- "Something went wrong" heading
- Error message in code block
- "Reload Application" button with RefreshCcw icon

**Testing Focus:**
- ✅ Error is user-friendly (no technical jargon exposed)
- ✅ Reload button is prominent
- ✅ Error message is readable in code block
- ✅ Styling consistent with app theme

---

#### 10. desktop-price-ticker.png
**Description:** Live price ticker in marquee animation  
**Capture When:** Dashboard, after prices load  
**What to Show:**
- Multiple coin cards scrolling horizontally
- Each card: icon, symbol, price, 24h change, mini sparkline
- Gradient fade on left and right edges
- Flash effect if price updates (green/red glow)

**Testing Focus:**
- ✅ Infinite scroll is seamless (no jump)
- ✅ Hover pauses animation
- ✅ Sparklines render correctly
- ⚠️ Check CPU usage (continuous animation)

---

## Mobile Viewports (375x667 - iPhone SE)

#### 11. mobile-dashboard.png
**Description:** Dashboard on mobile device  
**Capture When:** Mobile viewport, after load  
**What to Show:**
- Mobile header with hamburger menu
- Stat cards stacked vertically
- Compressed card height (~120px)
- Ticker full width
- Reduced padding and font sizes

**Testing Focus:**
- ✅ Cards stack properly (no horizontal scroll)
- ✅ Text remains readable
- ✅ Touch targets are 44x44px minimum
- ✅ Spacing feels comfortable

---

#### 12. mobile-sidebar-overlay.png
**Description:** Mobile sidebar menu open  
**Capture When:** After tapping hamburger menu  
**What to Show:**
- Sidebar slides in from left (280px)
- Dark overlay on content area
- Close (X) button visible
- Menu items with proper spacing
- Overlay dismisses on tap outside

**Testing Focus:**
- ✅ Animation is smooth
- ✅ Overlay has backdrop blur
- ✅ Close button is easy to tap
- ✅ Content area is darkened but visible

---

#### 13. mobile-trading-form.png
**Description:** Order form on mobile  
**Capture When:** Trading Hub on mobile  
**What to Show:**
- Compressed form layout
- Smaller input padding
- Percentage buttons in 4-column grid
- Submit button full width
- Error messages if any

**Testing Focus:**
- ✅ Inputs are easy to tap
- ✅ Form fits in viewport (no horizontal scroll)
- ✅ Buttons are thumb-friendly
- ✅ Text input opens keyboard properly

---

#### 14. mobile-stat-cards-stacked.png
**Description:** Stat cards in mobile column layout  
**Capture When:** Dashboard mobile view  
**What to Show:**
- All 4 cards in vertical stack
- Reduced height (120px vs 180px)
- Smaller icons and text
- Sparklines still visible but compressed

**Testing Focus:**
- ✅ Cards are not too cramped
- ✅ Data hierarchy is clear
- ✅ Tap targets are adequate
- ✅ Animations perform well

---

#### 15. mobile-touch-targets.png
**Description:** Touch target sizing verification  
**Capture When:** Use devtools device mode with "Show rulers"  
**What to Show:**
- Buttons measured to be ≥44x44px
- Icon buttons with adequate padding
- Link spacing sufficient
- Overlay measurement annotations

**Testing Focus:**
- ✅ All interactive elements meet 44x44px
- ✅ Spacing between buttons adequate
- ✅ No accidental taps on adjacent elements

---

## Accessibility Screenshots

#### 16. a11y-focus-ring-button.png
**Description:** Button focus ring visibility  
**Capture When:** Tab to any button  
**What to Show:**
- Button with 2px purple ring
- 2px offset from button edge
- Ring visible on dark background
- Compare before/after fix

**Testing Focus:**
- ⚠️ BEFORE: May be missing or 1px
- ✅ AFTER: Should be 2px purple ring-500

---

#### 17. a11y-focus-ring-input.png
**Description:** Input field focus state  
**Capture When:** Click or tab into input  
**What to Show:**
- Input with purple border
- 2px ring around border
- Smooth transition
- Cursor blinking

**Testing Focus:**
- ⚠️ Check ring width (should be 2px not 1px)
- ✅ Border color changes to purple-500
- ✅ Transition is smooth

---

#### 18. a11y-reduced-motion.png
**Description:** UI with all animations disabled  
**Capture When:** Enable "Reduce motion" in OS accessibility settings  
**What to Show:**
- Stat cards without hover scale
- No spinner animation
- No ticker scrolling
- No gradient flows
- Content immediately visible (no fade-in)

**Testing Focus:**
- ⚠️ CRITICAL: Verify ALL animations stop
- ⚠️ Spinner should not spin
- ⚠️ Marquee should not scroll
- ✅ Content still fully functional

---

#### 19. a11y-contrast-check.png
**Description:** Color contrast verification overlay  
**Capture When:** Use browser devtools or contrast checker extension  
**What to Show:**
- Contrast ratios displayed on text elements
- Passing (green) and failing (red) indicators
- Body text, headings, labels tested
- Specific focus on slate-400 text

**Testing Focus:**
- ⚠️ ISSUE: slate-400 on dark = 3.8:1 (FAIL)
- ✅ TARGET: slate-300 on dark = 6.2:1 (PASS)
- ✅ Headings should all pass
- ✅ Small text needs 4.5:1 minimum

---

#### 20. a11y-zoom-200.png
**Description:** Layout at 200% browser zoom  
**Capture When:** Zoom to 200% in browser (Cmd/Ctrl + +)  
**What to Show:**
- Dashboard still functional
- No horizontal scroll
- Text remains readable
- Cards reflow appropriately

**Testing Focus:**
- ✅ No content cut off
- ✅ No overlapping elements
- ✅ Scrollbars appear if needed (vertical only)
- ✅ Interactive elements still accessible

---

## Component Detail Shots

#### 21. component-skeleton-loader.png
**Description:** Skeleton loading state close-up  
**Capture When:** Dashboard loading, focus on one skeleton card  
**What to Show:**
- Rectangle placeholders
- Shimmer animation sweeping across
- Rounded corners matching final card
- Pulse effect on shapes

**Testing Focus:**
- ✅ Shimmer speed feels natural (2s)
- ✅ Shapes match final content roughly
- ✅ Animation doesn't cause jank

---

#### 22. component-error-message.png
**Description:** Form error message styling  
**Capture When:** Order form with validation errors  
**What to Show:**
- Red AlertCircle icon (14px)
- Error text in red-400
- Icon aligned with first line of text
- Multiple errors stacked

**Testing Focus:**
- ⚠️ ISSUE: Icon may not align properly
- ✅ FIX: Should use items-start and flex-shrink-0
- ✅ Text wraps properly

---

#### 23. component-glass-card.png
**Description:** Glass card hover effect detail  
**Capture When:** Hover over any glass card  
**What to Show:**
- Backdrop blur visible
- Border slightly brighter on hover
- Subtle scale or translate
- Background content blurred behind

**Testing Focus:**
- ✅ Blur effect is smooth
- ✅ Hover transition is natural
- ⚠️ Check performance on low-end device

---

#### 24. component-sparkline.png
**Description:** Mini sparkline chart rendering  
**Capture When:** Dashboard stat card or ticker item  
**What to Show:**
- SVG polyline with stroke
- Gradient fill below line
- 7-day price data visualization
- Green for up, red for down

**Testing Focus:**
- ✅ Line is smooth (no jagged edges)
- ✅ Gradient renders correctly
- ✅ SVG doesn't overflow container

---

#### 25. component-percentage-buttons.png
**Description:** Quick percentage select buttons  
**Capture When:** Order form, focus on 25/50/75/100% buttons  
**What to Show:**
- 4 buttons in a row
- One selected (active state)
- Hover state on another
- Normal state on others

**Testing Focus:**
- ⚠️ ISSUE: May not show active state clearly
- ✅ FIX: Selected should have purple bg and border
- ✅ Hover should have subtle highlight

---

## Theme & Design Shots

#### 26. theme-gradient-background.png
**Description:** Radial gradient background  
**Capture When:** Any page, no content overlay  
**What to Show:**
- Purple gradient from top center
- Fade to slate-950 at middle
- Solid slate-950 at bottom
- Blur effects from cards visible

**Testing Focus:**
- ✅ Gradient is smooth
- ✅ Purple isn't too bright
- ✅ No banding artifacts

---

#### 27. theme-glassmorphism.png
**Description:** Glassmorphism effect demonstration  
**Capture When:** Modal over content or card over gradient  
**What to Show:**
- Frosted glass appearance
- Background content blurred
- Border slightly visible
- Shadow beneath card

**Testing Focus:**
- ✅ Blur is appropriate (not too heavy)
- ✅ Content behind is identifiable
- ✅ Effect is consistent across components

---

#### 28. theme-color-palette.png
**Description:** Purple and cyan accent usage  
**Capture When:** Dashboard with various elements  
**What to Show:**
- Purple: buttons, gradients, focus rings
- Cyan: accents, highlights, text gradient
- Green: positive values, buy buttons
- Red: negative values, sell buttons
- Use color picker overlay to show hex values

**Testing Focus:**
- ✅ Colors are consistent
- ✅ Purple-500 (#a855f7) used for primary actions
- ✅ Cyan-400 used for accents

---

#### 29. theme-text-gradient.png
**Description:** Animated gradient text  
**Capture When:** Dashboard "CryptoOne" heading or similar  
**What to Show:**
- Text with purple → cyan gradient
- Animated flow effect (if motion allowed)
- Transparent text with gradient clip
- Multiple stages of animation if possible

**Testing Focus:**
- ✅ Gradient flows smoothly
- ✅ Text remains readable
- ✅ Animation doesn't distract

---

## Browser Compatibility

#### 30. chrome-devtools-performance.png
**Description:** Chrome DevTools Performance timeline  
**Capture When:** Record 5-second session on Dashboard  
**What to Show:**
- FPS meter (should be 60fps)
- CPU usage graph
- Network requests timeline
- Rendering/painting events
- Long tasks highlighted (if any)

**Testing Focus:**
- ✅ Frame rate stays at 60fps
- ⚠️ Check for long tasks (>50ms)
- ⚠️ Look for layout thrashing
- ✅ CPU usage reasonable

---

#### 31. chrome-lighthouse-score.png
**Description:** Lighthouse audit results  
**Capture When:** Run Lighthouse on Dashboard  
**What to Show:**
- Performance score (target: 90+)
- Accessibility score (target: 90+)
- Best Practices score
- SEO score
- Key metrics: FCP, LCP, TTI, CLS

**Testing Focus:**
- ⚠️ Accessibility may be 80-85 before fixes
- ✅ Performance should be 85+
- ✅ Check for specific recommendations

---

#### 32. firefox-rendering.png
**Description:** Firefox browser rendering  
**Capture When:** Same dashboard view in Firefox  
**What to Show:**
- Compare with Chrome version
- Note any visual differences
- Backdrop blur quality
- Font rendering

**Testing Focus:**
- ✅ Should look nearly identical
- ⚠️ Backdrop blur may be less smooth
- ✅ Animations should work

---

#### 33. safari-mobile.png
**Description:** iOS Safari on actual iPhone  
**Capture When:** Dashboard on iPhone Safari  
**What to Show:**
- Safari chrome (address bar)
- Content below notch (if applicable)
- Touch interactions
- Smooth scroll behavior

**Testing Focus:**
- ✅ Layout adapts to safe area insets
- ✅ Animations perform well
- ✅ No webkit-specific bugs
- ⚠️ Tap highlights may need adjustment

---

## Capture Instructions

### Tools Needed
1. **Browser DevTools** (F12)
   - Device mode for mobile
   - Accessibility tree inspector
   - Contrast ratio checker

2. **Screenshot Tool**
   - Built-in: Cmd+Shift+4 (Mac), Win+Shift+S (Windows)
   - Extension: Full Page Screen Capture
   - DevTools: Cmd+Shift+P → "Capture screenshot"

3. **Lighthouse** (Chrome)
   - DevTools → Lighthouse tab
   - Or: npx lighthouse http://localhost:3000

4. **Accessibility Tools**
   - axe DevTools extension
   - WAVE extension
   - Built-in DevTools accessibility tab

### Best Practices
1. **Consistent viewport sizes**
   - Desktop: 1920x1080
   - Tablet: 768x1024
   - Mobile: 375x667

2. **File naming**
   - Use descriptive names: `desktop-component-state.png`
   - Include viewport size in filename if not obvious

3. **Image quality**
   - Save as PNG (not JPG)
   - Full color depth
   - No compression for clarity

4. **Annotations**
   - Use arrows or boxes to highlight issues
   - Add text labels if needed
   - Keep annotations minimal

---

## Screenshot Checklist

Use this checklist when capturing screenshots:

- [ ] Desktop dashboard (loaded state)
- [ ] Desktop loading screen
- [ ] Stat cards with hover effect
- [ ] Sidebar expanded
- [ ] Sidebar collapsed
- [ ] Trading order form
- [ ] Confirmation modal
- [ ] Focus indicators (multiple elements)
- [ ] Error boundary screen
- [ ] Price ticker animation
- [ ] Mobile dashboard
- [ ] Mobile sidebar overlay
- [ ] Mobile trading form
- [ ] Mobile stat cards stacked
- [ ] Touch target verification
- [ ] Button focus ring
- [ ] Input focus ring
- [ ] Reduced motion mode
- [ ] Contrast check overlay
- [ ] 200% zoom layout
- [ ] Skeleton loader
- [ ] Error message styling
- [ ] Glass card effect
- [ ] Sparkline chart
- [ ] Percentage buttons
- [ ] Background gradient
- [ ] Glassmorphism demo
- [ ] Color palette
- [ ] Text gradient animation
- [ ] Chrome performance timeline
- [ ] Lighthouse scores
- [ ] Firefox comparison
- [ ] Safari mobile view

**Total: 33 screenshots recommended**

---

## Delivery Format

When delivering screenshots:

```
QA_REPORT/
├── SCREENSHOTS/
│   ├── desktop/
│   │   ├── 01-dashboard-loaded.png
│   │   ├── 02-loading-state.png
│   │   ├── 03-stat-cards-hover.png
│   │   └── ...
│   ├── mobile/
│   │   ├── 11-dashboard.png
│   │   ├── 12-sidebar-overlay.png
│   │   └── ...
│   ├── accessibility/
│   │   ├── 16-focus-ring-button.png
│   │   ├── 17-focus-ring-input.png
│   │   └── ...
│   ├── components/
│   │   └── ...
│   ├── theme/
│   │   └── ...
│   └── browsers/
│       └── ...
└── SCREENSHOT_DESCRIPTIONS.md (this file)
```

---

**Note:** This documentation serves as a reference for what screenshots should capture during actual browser testing. The descriptions can be used to verify fixes have been properly applied by comparing before/after states.
