# 🚀 Crypto Trading Platform - Phase-by-Phase Build Guide

## ⚠️ CRITICAL RULES - READ FIRST

```
🔴 BUILD ONE PHASE AT A TIME
🔴 COMPLETE ALL TASKS IN CURRENT PHASE
🔴 CHECK ALL CHECKBOXES ✅
🔴 GET CONFIRMATION BEFORE NEXT PHASE
🔴 NEVER SKIP OR BUILD MULTIPLE PHASES
🔴 WRITE REAL CODE - NO PSEUDO CODE
🔴 USE ONLY THE SPECIFIED API - NO EXTERNAL APIs
```

### How This Works:
1. Read entire Phase instructions
2. Build all tasks in that Phase
3. Write COMPLETE, WORKING code (not pseudo code)
4. Use ONLY this API: `https://really-amin-datasourceforcryptocurrency-2.hf.space`
5. Check every checkbox
6. Reply "Phase X Complete ✓"
7. Wait for "Start Phase X+1" command
8. Repeat until Phase 15

### CODE REQUIREMENTS - CRITICAL:
```
✅ Write REAL, COMPLETE code
✅ All functions must be fully implemented
✅ All imports must be included
✅ All types must be defined
✅ Code must be production-ready

❌ NO pseudo code like "// fetch data here"
❌ NO placeholder comments like "// implement later"
❌ NO incomplete functions
❌ NO missing implementations
```

### API REQUIREMENTS - CRITICAL:
```
✅ ONLY use: https://really-amin-datasourceforcryptocurrency-2.hf.space
✅ Use endpoints defined in Phase 1
✅ Implement proper error handling
✅ Add retry logic for failed requests

❌ DO NOT use Google APIs
❌ DO NOT use external cryptocurrency APIs
❌ DO NOT use your own API suggestions
❌ DO NOT add dependencies on external services
```

---

## 🎨 GLOBAL DESIGN SYSTEM (SAVE FOR ALL 14 PHASES)

### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion  
- Lucide React icons
- API: `https://really-amin-datasourceforcryptocurrency-2.hf.space`

### Design Rules - APPLY TO EVERYTHING

**Colors:**
```
Background: slate-950 → purple-950 gradients
Cards: glassmorphic (backdrop-blur-xl, bg-white/5)
Text: white (primary), slate-300 (secondary)
Accent: purple-500, cyan-400, pink-500
Success: green-500 | Error: red-500 | Warning: yellow-500
```

**Spacing:**
```
Use 4px scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
Cards: p-6 or p-8
Gaps: gap-4, gap-6, gap-8
Margins: px-4 (mobile), px-8 (tablet), px-12 (desktop)
```

**Animations:**
```
Duration: 300ms (standard), 500ms (complex)
Easing: ease-in-out
Hover: scale-[1.02], glow effect
Loading: shimmer (NOT spinner)
Stagger: 50-100ms delay for lists
```

**UI Quality Standards:**
```
✓ Premium feel - looks expensive
✓ Smooth animations everywhere
✓ Clear visual hierarchy
✓ Proper spacing and alignment
✓ Glassmorphic effects
✓ Beautiful hover states
✓ Loading skeletons (not spinners)
✓ Error handling with retry
✓ Mobile responsive
✓ Accessibility (ARIA, keyboard)
```

---

## 🎯 PHASE 1/14 - Project Foundation

### 📋 PHASE GOAL:
Set up project structure, configs, and global utilities

### ✅ TASKS:

#### TASK 1.1: API Configuration
- [ ] Create `/src/config/api.ts`
- [ ] Add `API_CONFIG` object (BASE_URL, TIMEOUT, RETRY)
- [ ] Add `API_ENDPOINTS` object (all 15+ endpoints)
- [ ] Add `getApiUrl()` helper function
- [ ] Verify imports work

#### TASK 1.2: TypeScript Types
- [ ] Create `/src/types/index.ts`
- [ ] Add `CryptoPrice` interface
- [ ] Add `MarketOverview` interface  
- [ ] Add `GlobalSentiment` interface
- [ ] Add `NewsArticle` interface
- [ ] Add `ApiResponse<T>` generic type
- [ ] Export all types

#### TASK 1.3: Tailwind Configuration
- [ ] Create `/tailwind.config.js`
- [ ] Add custom purple colors
- [ ] Add custom animations (shimmer, pulse-slow)
- [ ] Add backdrop-blur utilities
- [ ] Test config compiles

#### TASK 1.4: Global Styles
- [ ] Create `/src/styles/globals.css`
- [ ] Add dark gradient background
- [ ] Add `.glass-card` class
- [ ] Add `.glass-card-hover` class
- [ ] Add `.btn-primary` and `.btn-secondary`
- [ ] Add `.input-glass` class
- [ ] Add `.skeleton` loading class
- [ ] Add custom scrollbar styles
- [ ] Test styles load

### 🔍 COMPLETION CHECKLIST:
- [ ] All 4 files created
- [ ] No TypeScript errors
- [ ] Tailwind compiles successfully
- [ ] `npm run typecheck` passes
- [ ] `npm run dev` starts without errors
- [ ] Browser console clean (no errors)

### 📢 WHEN PHASE 1 COMPLETE:

Reply with:
```
✅ PHASE 1 COMPLETE
□ Task 1.1: API Config ✓
□ Task 1.2: TypeScript Types ✓
□ Task 1.3: Tailwind Config ✓
□ Task 1.4: Global Styles ✓
□ All checkboxes checked ✓
□ No errors ✓

Ready for Phase 2 instructions.
```

❌ **DO NOT START PHASE 2 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 2/14 - Sidebar Navigation

### 📋 PHASE GOAL:
Build beautiful, animated sidebar with navigation menu

### ✅ TASKS:

#### TASK 2.1: Sidebar Component Structure
- [ ] Create `/src/components/Sidebar/Sidebar.tsx`
- [ ] Set up component state (collapsed, active, expanded menus)
- [ ] Create header section (logo + collapse button)
- [ ] Create main menu section
- [ ] Create footer section (status indicators)
- [ ] Add mobile overlay support

#### TASK 2.2: Menu Items Implementation
- [ ] Add 9 main menu items with icons:
  - [ ] 📊 Dashboard
  - [ ] 📈 Market Analysis (with submenu)
  - [ ] 💹 Trading Hub (with submenu)
  - [ ] 🤖 AI Lab (with submenu)
  - [ ] 📉 Risk Management
  - [ ] ⚙️ Settings
  - [ ] 👤 Profile
  - [ ] 🔔 Notifications
  - [ ] 🔧 Admin (with submenu)
- [ ] Implement active state highlighting
- [ ] Add hover effects

#### TASK 2.3: Submenu System
- [ ] Market Analysis submenu (3 items)
- [ ] Trading Hub submenu (4 items)
- [ ] AI Lab submenu (4 items)
- [ ] Admin submenu (3 items)
- [ ] Smooth expand/collapse animation
- [ ] Click to toggle submenu

#### TASK 2.4: Visual Design & Animations
- [ ] Width: 280px (desktop), overlay (mobile)
- [ ] Glassmorphic background
- [ ] Active item: gradient border + glow
- [ ] Hover: scale + backdrop glow (duration: 300ms)
- [ ] Collapse animation (smooth width transition)
- [ ] Mobile: slide-in from left with backdrop

#### TASK 2.5: Footer Status
- [ ] API status indicator (green dot)
- [ ] "Connected" or "Offline" text
- [ ] Last update timestamp
- [ ] Divider line above footer

### 🔍 COMPLETION CHECKLIST:
- [ ] Sidebar renders correctly
- [ ] All 9 menu items display
- [ ] Icons show properly (Lucide React)
- [ ] Active state works
- [ ] Hover effects smooth
- [ ] Submenus expand/collapse
- [ ] Collapse button works
- [ ] Mobile overlay works
- [ ] Animations smooth (300ms)
- [ ] No console errors
- [ ] Beautiful and professional

### 📢 WHEN PHASE 2 COMPLETE:

Reply with:
```
✅ PHASE 2 COMPLETE
□ Task 2.1: Component Structure ✓
□ Task 2.2: Menu Items ✓
□ Task 2.3: Submenu System ✓
□ Task 2.4: Visual Design ✓
□ Task 2.5: Footer Status ✓
□ All animations smooth ✓
□ Mobile responsive ✓

Ready for Phase 3 instructions.
```

❌ **DO NOT START PHASE 3 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 3/14 - Dashboard Hero Stats

### 📋 PHASE GOAL:
Create main dashboard page with 4 hero statistics cards

### ✅ TASKS:

#### TASK 3.1: Dashboard Page Setup
- [ ] Create `/src/views/Dashboard.tsx`
- [ ] Set up page layout (header + content)
- [ ] Add page title "Dashboard"
- [ ] Create stats grid container

#### TASK 3.2: Data Fetching Hook
- [ ] Create `useDashboardData()` hook
- [ ] Fetch from `/api/market/top`
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Auto-refresh every 30 seconds
- [ ] Return data, loading, error

#### TASK 3.3: Hero Stat Cards (Build all 4)

**Card 1: Total Market Cap**
- [ ] Icon: 💎 (gradient colored)
- [ ] Title: "Total Market Cap"
- [ ] Large number with $ (count-up animation)
- [ ] 24h change % (colored, with arrow)
- [ ] Mini sparkline chart (7 days)
- [ ] Glass card with hover effect

**Card 2: 24h Volume**
- [ ] Icon: 📊 (cyan gradient)
- [ ] Title: "24h Trading Volume"
- [ ] Large number with $
- [ ] Trend indicator
- [ ] Mini sparkline
- [ ] Glass card with hover

**Card 3: BTC Dominance**
- [ ] Icon: ₿ (bitcoin symbol)
- [ ] Title: "BTC Dominance"
- [ ] Circular progress (180° arc)
- [ ] Percentage in center (large)
- [ ] Color gradient: yellow → green
- [ ] Glass card with hover

**Card 4: Active Cryptocurrencies**
- [ ] Icon: 🪙 (gold gradient)
- [ ] Title: "Active Cryptocurrencies"
- [ ] Counter number (count-up animation)
- [ ] Subtitle: "Listed Coins"
- [ ] Glass card with hover

#### TASK 3.4: Animations & Effects
- [ ] Count-up animation for numbers (1 second duration)
- [ ] Card entrance stagger (100ms delay each)
- [ ] Hover: scale(1.02) + glow
- [ ] Loading: skeleton shimmer (not spinner)
- [ ] Data update: smooth number transitions

#### TASK 3.5: Responsive Grid
- [ ] Desktop: 4 columns
- [ ] Tablet: 2 columns
- [ ] Mobile: 1 column
- [ ] Consistent gap: 24px
- [ ] Equal card heights

### 🔍 COMPLETION CHECKLIST:
- [ ] Dashboard page renders
- [ ] All 4 cards display
- [ ] Data fetches from API
- [ ] Numbers animate (count-up)
- [ ] Sparklines show (where applicable)
- [ ] Hover effects work
- [ ] Loading skeletons show
- [ ] Error handling works
- [ ] Auto-refresh works (30s)
- [ ] Responsive on all screens
- [ ] Beautiful and smooth
- [ ] No console errors

### 📢 WHEN PHASE 3 COMPLETE:

Reply with:
```
✅ PHASE 3 COMPLETE
□ Task 3.1: Dashboard Setup ✓
□ Task 3.2: Data Fetching ✓
□ Task 3.3: All 4 Hero Cards ✓
□ Task 3.4: Animations ✓
□ Task 3.5: Responsive Grid ✓
□ All cards beautiful ✓
□ API integration works ✓

Ready for Phase 4 instructions.
```

❌ **DO NOT START PHASE 4 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 4/14 - Live Price Ticker

### 📋 PHASE GOAL:
Horizontal auto-scrolling ticker showing real-time crypto prices

### ✅ TASKS:

#### TASK 4.1: Ticker Component Setup
- [ ] Create `/src/components/Dashboard/PriceTicker.tsx`
- [ ] Set up auto-scroll animation (CSS keyframes)
- [ ] Add pause-on-hover functionality
- [ ] Fetch top 10-15 coins from API

#### TASK 4.2: Ticker Card Design (per coin)
- [ ] Width: 200px, Height: 80px
- [ ] Glass card effect
- [ ] Coin icon + symbol (top)
- [ ] Current price (large, center)
- [ ] 24h change % (colored, bottom)
- [ ] Mini sparkline (7-day chart)
- [ ] Hover: slight scale effect

#### TASK 4.3: Auto-Scroll Animation
- [ ] Infinite horizontal scroll
- [ ] Duration: 30 seconds per loop
- [ ] Seamless loop (duplicate data)
- [ ] Smooth animation (no jumps)
- [ ] Pause on hover
- [ ] Resume after mouse leaves

#### TASK 4.4: Price Flash Effect
- [ ] When price increases: green flash (300ms)
- [ ] When price decreases: red flash (300ms)
- [ ] Pulse animation on change
- [ ] Track previous price for comparison

#### TASK 4.5: Data Management
- [ ] Fetch from `/api/market/trending`
- [ ] Update every 10 seconds
- [ ] Handle loading state
- [ ] Handle errors gracefully
- [ ] Optional: WebSocket for real-time updates

### 🔍 COMPLETION CHECKLIST:
- [ ] Ticker renders correctly
- [ ] Auto-scroll works smoothly
- [ ] Pause on hover works
- [ ] Shows 10+ coins
- [ ] Price updates automatically
- [ ] Flash animation on price change
- [ ] Sparklines render
- [ ] Cards are clickable
- [ ] Infinite loop is seamless
- [ ] No visual glitches
- [ ] Beautiful design
- [ ] Responsive

### 📢 WHEN PHASE 4 COMPLETE:

Reply with:
```
✅ PHASE 4 COMPLETE
□ Task 4.1: Ticker Setup ✓
□ Task 4.2: Card Design ✓
□ Task 4.3: Auto-Scroll ✓
□ Task 4.4: Flash Effects ✓
□ Task 4.5: Data Management ✓
□ Smooth infinite scroll ✓
□ Real-time updates work ✓

Ready for Phase 5 instructions.
```

❌ **DO NOT START PHASE 5 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 5/14 - Market Overview Grid

### 📋 PHASE GOAL:
Three-section grid showing top gainers, losers, and volume leaders

### ✅ TASKS:

#### TASK 5.1: Market Overview Container
- [ ] Create `/src/components/Dashboard/MarketOverview.tsx`
- [ ] Set up 3-column grid (desktop)
- [ ] Add section titles
- [ ] Fetch data from `/api/market/top`
- [ ] Sort and filter data for each section

#### TASK 5.2: Top Gainers Section (Left)
- [ ] Glass card container
- [ ] Header: "🔥 Top Gainers" + "View All" link
- [ ] Mini table: 5 coins
- [ ] Columns: Rank, Name, Price, 24h %
- [ ] Green color theme
- [ ] Row hover: highlight effect
- [ ] Click row: navigate to coin detail

#### TASK 5.3: Top Losers Section (Center)
- [ ] Glass card container
- [ ] Header: "📉 Top Losers" + "View All" link
- [ ] Mini table: 5 coins
- [ ] Same columns as gainers
- [ ] Red color theme
- [ ] Row hover: highlight effect
- [ ] Click row: navigate to coin detail

#### TASK 5.4: Volume Leaders Section (Right)
- [ ] Glass card container
- [ ] Header: "💹 Volume Leaders" + "View All" link
- [ ] Horizontal bar chart: 5 coins
- [ ] Bar: gradient fill (purple → cyan)
- [ ] Labels: Coin name + volume
- [ ] Animated bar growth on load
- [ ] Hover: highlight bar

#### TASK 5.5: Responsive Layout
- [ ] Desktop: 3 columns (33% each)
- [ ] Tablet: 2 columns (volume full width)
- [ ] Mobile: 1 column (stack)
- [ ] Consistent spacing: gap-6
- [ ] Equal heights

#### TASK 5.6: Loading & Error States
- [ ] Loading: skeleton rows (5 per section)
- [ ] Error: retry button with message
- [ ] Empty state: "No data available"

### 🔍 COMPLETION CHECKLIST:
- [ ] All 3 sections render
- [ ] Data fetches correctly
- [ ] Tables display 5 items each
- [ ] Colors correct (green/red/gradient)
- [ ] Hover effects work
- [ ] Sorting is correct
- [ ] Bar chart animates
- [ ] Responsive layout works
- [ ] Loading skeletons show
- [ ] Error handling works
- [ ] Beautiful design
- [ ] No console errors

### 📢 WHEN PHASE 5 COMPLETE:

Reply with:
```
✅ PHASE 5 COMPLETE
□ Task 5.1: Container Setup ✓
□ Task 5.2: Top Gainers ✓
□ Task 5.3: Top Losers ✓
□ Task 5.4: Volume Leaders ✓
□ Task 5.5: Responsive Layout ✓
□ Task 5.6: Loading/Error ✓
□ All 3 sections beautiful ✓
□ Data displays correctly ✓

Ready for Phase 6 instructions.
```

❌ **DO NOT START PHASE 6 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 6/15 - Sentiment Widget & News Feed

### 📋 PHASE GOAL:
Build sentiment gauge and live news feed components

### ✅ TASKS:

#### TASK 6.1: Sentiment Gauge Component
- [ ] Create `/src/components/Dashboard/SentimentGauge.tsx`
- [ ] Implement 180° circular gauge (0-100 score)
- [ ] Add animated needle pointing to current score
- [ ] Color gradient: Red (0) → Yellow (50) → Green (100)
- [ ] Display sentiment text: "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
- [ ] Fetch from `/api/sentiment/global`
- [ ] Auto-refresh every 60 seconds

#### TASK 6.2: News Feed Component
- [ ] Create `/src/components/Dashboard/NewsFeed.tsx`
- [ ] Display 5 latest news articles
- [ ] Each item: thumbnail, title, source, time ago
- [ ] Glass card design with hover effect
- [ ] Click to open article in new tab
- [ ] Fetch from `/api/news/latest`
- [ ] Auto-refresh every 5 minutes

#### TASK 6.3: Integration with Dashboard
- [ ] Add both components to Dashboard page
- [ ] Layout: Sentiment left (40%), News right (60%)
- [ ] Responsive: stack on mobile
- [ ] Loading skeletons for both
- [ ] Error handling with retry

### 🔍 COMPLETION CHECKLIST:
- [ ] Sentiment gauge renders correctly
- [ ] Gauge animates smoothly
- [ ] Colors match sentiment level
- [ ] News feed displays 5 items
- [ ] Images load properly
- [ ] Links work correctly
- [ ] Auto-refresh works
- [ ] Beautiful design
- [ ] No console errors

### 📢 WHEN PHASE 6 COMPLETE:
Reply with:
```
✅ PHASE 6 COMPLETE
□ Sentiment Gauge ✓
□ News Feed ✓
□ Dashboard Integration ✓
□ All animations smooth ✓

Ready for Phase 7 instructions.
```

❌ **DO NOT START PHASE 7 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 7/15 - Market Analysis Page

### 📋 PHASE GOAL:
Build comprehensive market analysis page with tabs and filters

### ✅ TASKS:

#### TASK 7.1: Page Setup & Tab Navigation
- [ ] Create `/src/views/MarketAnalysis.tsx`
- [ ] Implement tab system: Market | Trending | Categories | Technical
- [ ] Active tab highlighting with animation
- [ ] Tab content switching

#### TASK 7.2: Market Tab (All Coins Table)
- [ ] Sortable table with 50 rows
- [ ] Columns: Rank, Name, Price, 24h%, 7d%, Market Cap, Volume
- [ ] Click column header to sort
- [ ] Pagination (10 items per page)
- [ ] Search bar for filtering
- [ ] Fetch from `/api/coins/top`

#### TASK 7.3: Trending Tab
- [ ] Grid of trending coins (12 items)
- [ ] Card design: icon, name, price, change
- [ ] Sparkline chart per card
- [ ] Click to navigate to coin detail
- [ ] Fetch from `/api/market/trending`

#### TASK 7.4: Categories Tab
- [ ] Category cards: DeFi, NFT, Gaming, Metaverse, etc.
- [ ] Show top 3 coins per category
- [ ] Total market cap per category
- [ ] Click to filter by category

#### TASK 7.5: Technical Analysis Tab
- [ ] Quick TA for selected coin
- [ ] Indicators: RSI, MACD, Moving Averages
- [ ] Buy/Sell/Hold recommendation
- [ ] Fetch from `/api/technical/ta-quick/{symbol}`

### 🔍 COMPLETION CHECKLIST:
- [ ] All 4 tabs render
- [ ] Tab switching works smoothly
- [ ] Table sorting works
- [ ] Search filters correctly
- [ ] Pagination works
- [ ] All data fetches correctly
- [ ] Beautiful design
- [ ] Responsive layout
- [ ] No console errors

### 📢 WHEN PHASE 7 COMPLETE:
Reply with:
```
✅ PHASE 7 COMPLETE
□ All 4 tabs implemented ✓
□ Table with sorting ✓
□ Search & pagination ✓
□ Beautiful UI ✓

Ready for Phase 8 instructions.
```

❌ **DO NOT START PHASE 8 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 8/15 - Trading Hub (Spot Trading)

### 📋 PHASE GOAL:
Build complete trading interface with charts and order panel

### ✅ TASKS:

#### TASK 8.1: Trading Page Layout
- [ ] Create `/src/views/TradingHub.tsx`
- [ ] Split layout: Chart (60%) | Order Panel (40%)
- [ ] Responsive: stack on mobile
- [ ] Coin selector dropdown

#### TASK 8.2: Price Chart Component
- [ ] TradingView-style candlestick chart
- [ ] Timeframe selector: 1m, 5m, 15m, 1h, 4h, 1d
- [ ] Volume bars below chart
- [ ] Fetch from `/api/ohlcv/{symbol}`
- [ ] Update on timeframe change

#### TASK 8.3: Order Panel - Order Book
- [ ] Real-time order book display
- [ ] Bids (green) and Asks (red)
- [ ] Show price, amount, total
- [ ] Depth visualization bars

#### TASK 8.4: Order Panel - Order Form
- [ ] Order type selector: Market | Limit | Stop
- [ ] Buy/Sell toggle buttons
- [ ] Amount input with slider
- [ ] Price input (for limit orders)
- [ ] Total calculation
- [ ] Submit button with confirmation

#### TASK 8.5: Order Panel - Recent Trades
- [ ] Live trade feed
- [ ] Show: price, amount, time
- [ ] Color: green (buy), red (sell)
- [ ] Auto-scroll to top on new trade

### 🔍 COMPLETION CHECKLIST:
- [ ] Layout renders correctly
- [ ] Chart displays candlesticks
- [ ] Timeframe switching works
- [ ] Order book updates
- [ ] Order form works
- [ ] All calculations correct
- [ ] Recent trades display
- [ ] Beautiful design
- [ ] No console errors

### 📢 WHEN PHASE 8 COMPLETE:
Reply with:
```
✅ PHASE 8 COMPLETE
□ Trading layout ✓
□ Chart with timeframes ✓
□ Order book ✓
□ Order form ✓
□ Recent trades ✓

Ready for Phase 9 instructions.
```

❌ **DO NOT START PHASE 9 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 9/15 - AI Lab (Signals & Scanner)

### 📋 PHASE GOAL:
Build AI-powered trading signals and market scanner

### ✅ TASKS:

#### TASK 9.1: AI Lab Page Setup
- [ ] Create `/src/views/AILab.tsx`
- [ ] Tab navigation: Signals | Scanner | Backtest | Strategy
- [ ] Tab switching animation

#### TASK 9.2: Trading Signals Tab
- [ ] Display AI-generated signals
- [ ] Signal cards: Buy/Sell badge, confidence score
- [ ] Show: entry price, target price, stop loss
- [ ] AI reasoning section (expandable)
- [ ] Fetch from `/api/ai/signals`
- [ ] Filter by confidence level

#### TASK 9.3: Market Scanner Tab
- [ ] Scan criteria builder
- [ ] Filters: price range, volume, change %, market cap
- [ ] Real-time scan results table
- [ ] Export results button
- [ ] Save scan presets

#### TASK 9.4: Backtest Tab (Basic)
- [ ] Strategy selector dropdown
- [ ] Date range picker
- [ ] Initial capital input
- [ ] Run backtest button
- [ ] Display: total return, win rate, max drawdown
- [ ] Equity curve chart

#### TASK 9.5: Strategy Builder (Basic)
- [ ] Visual builder for simple strategies
- [ ] Conditions: price crosses MA, RSI levels, volume spikes
- [ ] Logic: AND/OR conditions
- [ ] Save strategy button
- [ ] Load saved strategies

### 🔍 COMPLETION CHECKLIST:
- [ ] All 4 tabs render
- [ ] Signals display correctly
- [ ] Confidence scores show
- [ ] Scanner filters work
- [ ] Results table displays
- [ ] Backtest runs successfully
- [ ] Charts render correctly
- [ ] Beautiful design
- [ ] No console errors

### 📢 WHEN PHASE 9 COMPLETE:
Reply with:
```
✅ PHASE 9 COMPLETE
□ All 4 AI Lab tabs ✓
□ Signals with confidence ✓
□ Market scanner ✓
□ Backtest feature ✓

Ready for Phase 10 instructions.
```

❌ **DO NOT START PHASE 10 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 10/15 - Risk Management Dashboard

### 📋 PHASE GOAL:
Build portfolio risk analysis and management tools

### ✅ TASKS:

#### TASK 10.1: Risk Dashboard Setup
- [ ] Create `/src/views/RiskManagement.tsx`
- [ ] Layout: 4 stat cards at top, main content below

#### TASK 10.2: Portfolio Summary Cards
- [ ] Card 1: Total Portfolio Value (with chart)
- [ ] Card 2: Today's P&L (profit/loss)
- [ ] Card 3: Risk Score (0-100 gauge)
- [ ] Card 4: Open Positions Count

#### TASK 10.3: Holdings Table
- [ ] Display all holdings
- [ ] Columns: Asset, Amount, Value, Allocation %, P&L
- [ ] Total row at bottom
- [ ] Pie chart showing allocation
- [ ] Bar chart showing performance

#### TASK 10.4: Risk Assessment Section
- [ ] Risk score circular gauge
- [ ] Risk level: Low, Medium, High, Extreme
- [ ] Risk factors breakdown
- [ ] Recommendations cards
- [ ] Diversification score

#### TASK 10.5: Alerts & Notifications
- [ ] Price alerts setup
- [ ] Alert list with status
- [ ] Edit/delete alerts
- [ ] Notification preferences
- [ ] Alert history

### 🔍 COMPLETION CHECKLIST:
- [ ] All sections render
- [ ] Stats cards display correctly
- [ ] Holdings table works
- [ ] Charts render properly
- [ ] Risk gauge accurate
- [ ] Alerts can be created
- [ ] Beautiful design
- [ ] Responsive layout
- [ ] No console errors

### 📢 WHEN PHASE 10 COMPLETE:
Reply with:
```
✅ PHASE 10 COMPLETE
□ Portfolio summary ✓
□ Holdings table ✓
□ Risk assessment ✓
□ Alerts system ✓

Ready for Phase 11 instructions.
```

❌ **DO NOT START PHASE 11 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 11/15 - Settings & Admin Pages

### 📋 PHASE GOAL:
Build settings and admin dashboard

### ✅ TASKS:

#### TASK 11.1: Settings Page
- [ ] Create `/src/views/Settings.tsx`
- [ ] Tab navigation: Profile | API Keys | Preferences | Data Sources

#### TASK 11.2: Profile Tab
- [ ] User avatar upload
- [ ] Name, email fields
- [ ] Password change form
- [ ] Two-factor authentication toggle
- [ ] Save button

#### TASK 11.3: API Keys Tab
- [ ] Display masked API keys
- [ ] Add new key button
- [ ] Delete key with confirmation
- [ ] Key permissions settings
- [ ] Usage statistics per key

#### TASK 11.4: Preferences Tab
- [ ] Theme selector (though we use dark)
- [ ] Language selector
- [ ] Notification preferences
- [ ] Default timeframes
- [ ] Auto-refresh intervals

#### TASK 11.5: Admin Dashboard
- [ ] Create `/src/views/Admin.tsx`
- [ ] Tab navigation: Health | Monitoring | Logs

#### TASK 11.6: System Health Tab
- [ ] API status indicators
- [ ] Response time metrics
- [ ] Error rate chart
- [ ] Uptime percentage
- [ ] Fetch from `/api/health`

#### TASK 11.7: Monitoring Tab
- [ ] Real-time metrics dashboard
- [ ] Active users count
- [ ] Requests per minute
- [ ] Database queries
- [ ] Memory usage

#### TASK 11.8: Logs Tab
- [ ] Log viewer with search
- [ ] Filter by: level, source, time
- [ ] Auto-refresh toggle
- [ ] Export logs button
- [ ] Clear logs button

### 🔍 COMPLETION CHECKLIST:
- [ ] Settings page complete
- [ ] All 4 settings tabs work
- [ ] Admin page complete
- [ ] All 3 admin tabs work
- [ ] Health metrics display
- [ ] Logs viewer works
- [ ] Beautiful design
- [ ] Proper access control
- [ ] No console errors

### 📢 WHEN PHASE 11 COMPLETE:
Reply with:
```
✅ PHASE 11 COMPLETE
□ Settings page ✓
□ Admin dashboard ✓
□ All tabs functional ✓
□ Health monitoring ✓

Ready for Phase 12 instructions.
```

❌ **DO NOT START PHASE 12 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 12/15 - API Services Layer

### 📋 PHASE GOAL:
Build robust API client with caching and error handling

### ✅ TASKS:

#### TASK 12.1: HTTP Client
- [ ] Create `/src/services/httpClient.ts`
- [ ] Axios instance with base URL
- [ ] Request interceptor (add auth headers)
- [ ] Response interceptor (handle errors)
- [ ] Retry logic (3 attempts, exponential backoff)
- [ ] Timeout handling (30 seconds)

#### TASK 12.2: Market Data Service
- [ ] Create `/src/services/marketDataService.ts`
- [ ] Functions for all market endpoints
- [ ] Type-safe responses using TypeScript interfaces
- [ ] Error handling per function
- [ ] Cache layer (30 seconds TTL)

#### TASK 12.3: Sentiment Service
- [ ] Create `/src/services/sentimentService.ts`
- [ ] Global sentiment fetch
- [ ] Asset-specific sentiment
- [ ] Cache layer (60 seconds TTL)

#### TASK 12.4: News Service
- [ ] Create `/src/services/newsService.ts`
- [ ] Latest news fetch
- [ ] Search news by keyword
- [ ] Filter by date range
- [ ] Cache layer (5 minutes TTL)

#### TASK 12.5: AI Service
- [ ] Create `/src/services/aiService.ts`
- [ ] Fetch trading signals
- [ ] Get AI decision for coin
- [ ] Market scan function
- [ ] No caching (always fresh)

#### TASK 12.6: WebSocket Service (Optional but recommended)
- [ ] Create `/src/services/websocketService.ts`
- [ ] Connect to price updates
- [ ] Subscribe to specific coins
- [ ] Handle reconnection
- [ ] Emit events for React components

#### TASK 12.7: Custom React Hooks
- [ ] Create `/src/hooks/useMarketData.ts`
- [ ] Create `/src/hooks/useSentiment.ts`
- [ ] Create `/src/hooks/useNews.ts`
- [ ] Create `/src/hooks/useLivePrice.ts`
- [ ] Each hook: loading, error, data states
- [ ] Auto-fetch on mount
- [ ] Cleanup on unmount

### 🔍 COMPLETION CHECKLIST:
- [ ] All service files created
- [ ] HTTP client configured
- [ ] Retry logic works
- [ ] All endpoints mapped
- [ ] TypeScript types correct
- [ ] Caching implemented
- [ ] Hooks created and working
- [ ] Error handling robust
- [ ] No console errors

### 📢 WHEN PHASE 12 COMPLETE:
Reply with:
```
✅ PHASE 12 COMPLETE
□ HTTP client ✓
□ All services implemented ✓
□ Caching layer ✓
□ React hooks ✓
□ Error handling ✓

Ready for Phase 13 instructions.
```

❌ **DO NOT START PHASE 13 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 13/15 - State Management & Polish

### 📋 PHASE GOAL:
Implement global state, polish UI, and add final touches

### ✅ TASKS:

#### TASK 13.1: Context Providers
- [ ] Create `/src/context/AppContext.tsx`
- [ ] Global app state: theme, sidebar collapsed, notifications
- [ ] Create `/src/context/UserContext.tsx`
- [ ] User state: profile, preferences, authentication
- [ ] Create `/src/context/DataContext.tsx`
- [ ] Shared data: watchlist, recent coins, favorites

#### TASK 13.2: Wrap App with Providers
- [ ] Update `/src/App.tsx`
- [ ] Wrap with all context providers
- [ ] Add error boundary
- [ ] Add loading screen for initial load
- [ ] Remove any artificial delays

#### TASK 13.3: Loading States Everywhere
- [ ] Audit all components
- [ ] Replace spinners with skeleton loaders
- [ ] Add shimmer effect to skeletons
- [ ] Ensure consistent loading UX

#### TASK 13.4: Toast Notifications
- [ ] Install/create toast system
- [ ] Success toast (green)
- [ ] Error toast (red)
- [ ] Info toast (blue)
- [ ] Warning toast (yellow)
- [ ] Position: top-right
- [ ] Auto-dismiss after 3 seconds

#### TASK 13.5: Error Boundaries
- [ ] Create `/src/components/ErrorBoundary.tsx`
- [ ] Catch React errors
- [ ] Display friendly error message
- [ ] "Reload" button
- [ ] Report error to console

#### TASK 13.6: Page Transitions
- [ ] Add route transition animations
- [ ] Fade in new pages (300ms)
- [ ] Smooth scroll to top on navigation
- [ ] Loading bar at top during navigation

#### TASK 13.7: Accessibility Improvements
- [ ] Add ARIA labels to buttons
- [ ] Keyboard navigation support
- [ ] Focus visible styles
- [ ] Alt text for images
- [ ] Semantic HTML elements

#### TASK 13.8: Final UI Polish
- [ ] Review all spacing consistency
- [ ] Ensure all hover effects work
- [ ] Check all animations are smooth
- [ ] Verify color consistency
- [ ] Test all interactive elements
- [ ] Fix any alignment issues

### 🔍 COMPLETION CHECKLIST:
- [ ] Context providers working
- [ ] App wrapped correctly
- [ ] Loading states consistent
- [ ] Toasts work properly
- [ ] Error boundaries catch errors
- [ ] Page transitions smooth
- [ ] Keyboard navigation works
- [ ] UI polished and consistent
- [ ] No console errors or warnings

### 📢 WHEN PHASE 13 COMPLETE:
Reply with:
```
✅ PHASE 13 COMPLETE
□ State management ✓
□ Loading states ✓
□ Toast notifications ✓
□ Error boundaries ✓
□ Accessibility ✓
□ Final polish ✓

Ready for Phase 14 instructions.
```

❌ **DO NOT START PHASE 14 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 14/15 - Testing & Optimization

### 📋 PHASE GOAL:
Test everything, optimize performance, prepare for deployment

### ✅ TASKS:

#### TASK 14.1: Manual Testing Checklist
- [ ] Test all navigation links
- [ ] Test all buttons and interactions
- [ ] Test all forms (validation, submission)
- [ ] Test API calls (success and error cases)
- [ ] Test loading states appear
- [ ] Test error handling displays errors
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test all hover effects
- [ ] Test all animations

#### TASK 14.2: Performance Optimization
- [ ] Run Lighthouse audit
- [ ] Lazy load routes with React.lazy()
- [ ] Optimize images (compress, lazy load)
- [ ] Code splitting (separate chunks per route)
- [ ] Remove unused dependencies
- [ ] Minimize bundle size
- [ ] Add service worker for caching (optional)

#### TASK 14.3: Bundle Analysis
- [ ] Run `npm run build`
- [ ] Analyze bundle size
- [ ] Identify large dependencies
- [ ] Consider alternatives if too large
- [ ] Target: < 500kb gzipped main bundle

#### TASK 14.4: Fix All Console Errors/Warnings
- [ ] Open browser console
- [ ] Fix all errors (red)
- [ ] Fix all warnings (yellow)
- [ ] Remove console.log statements
- [ ] Test in different browsers

#### TASK 14.5: Empty States
- [ ] Add empty states for all lists/tables
- [ ] Friendly message + illustration/icon
- [ ] Call-to-action button where appropriate

#### TASK 14.6: Final Verification
- [ ] All API calls use correct endpoint
- [ ] No external APIs used (Google, etc.)
- [ ] All code is complete (no TODO comments)
- [ ] All functions implemented (no pseudo code)
- [ ] TypeScript strict mode passes
- [ ] Production build succeeds

#### TASK 14.7: Documentation
- [ ] Create comprehensive README.md
- [ ] Installation instructions
- [ ] Environment variables needed
- [ ] How to run development server
- [ ] How to build for production
- [ ] API endpoints documented
- [ ] Known issues (if any)

### 🔍 COMPLETION CHECKLIST:
- [ ] All manual tests pass
- [ ] Performance optimized
- [ ] Bundle size reasonable
- [ ] No console errors
- [ ] Empty states added
- [ ] All code complete
- [ ] README created
- [ ] Ready for deployment

### 📢 WHEN PHASE 14 COMPLETE:
Reply with:
```
✅ PHASE 14 COMPLETE
□ All tests passed ✓
□ Performance optimized ✓
□ Bundle optimized ✓
□ Documentation complete ✓

Ready for Phase 15 instructions.
```

❌ **DO NOT START PHASE 15 UNTIL YOU GET CONFIRMATION**

---

## 🎯 PHASE 15/15 - FINAL VERIFICATION & COMPLIANCE CHECK

### 📋 PHASE GOAL:
Final review to ensure ALL requirements met and project ready

### ⚠️ CRITICAL VERIFICATION TASKS:

#### TASK 15.1: CODE COMPLETENESS AUDIT
- [ ] Search entire codebase for "TODO"
- [ ] Search for "FIXME"
- [ ] Search for "// implement"
- [ ] Search for "// add later"
- [ ] Search for "pseudo" or "placeholder"
- [ ] Verify NO pseudo code exists
- [ ] Verify ALL functions are fully implemented
- [ ] Verify ALL components render actual content

#### TASK 15.2: API USAGE COMPLIANCE
- [ ] Search codebase for "googleapis"
- [ ] Search for "google.com/api"
- [ ] Search for any external API URLs
- [ ] Verify ONLY using: `https://really-amin-datasourceforcryptocurrency-2.hf.space`
- [ ] Check ALL fetch/axios calls point to correct API
- [ ] Verify NO dependencies on external services
- [ ] Confirm NO Google API keys in .env

#### TASK 15.3: DESIGN SYSTEM COMPLIANCE
- [ ] All cards use glassmorphic effect
- [ ] All animations are 300ms ease-in-out
- [ ] All hover effects scale(1.02)
- [ ] All colors match purple/slate/cyan theme
- [ ] All spacing uses 4px scale
- [ ] All text uses correct font sizes
- [ ] Consistent border-radius (rounded-2xl for cards)
- [ ] Consistent shadows (shadow-2xl shadow-purple-500/10)

#### TASK 15.4: FUNCTIONAL COMPLETENESS
- [ ] Dashboard loads and displays all sections
- [ ] Sidebar navigation works completely
- [ ] All pages are accessible
- [ ] All API endpoints are used correctly
- [ ] All forms submit properly
- [ ] All tables sort correctly
- [ ] All charts render with real data
- [ ] All filters work correctly

#### TASK 15.5: RESPONSIVE DESIGN VERIFICATION
- [ ] Test mobile view (< 768px)
- [ ] Test tablet view (768px - 1024px)
- [ ] Test desktop view (> 1024px)
- [ ] Sidebar collapses properly on mobile
- [ ] All grids stack correctly
- [ ] All text remains readable
- [ ] No horizontal scroll
- [ ] All interactive elements accessible

#### TASK 15.6: PERFORMANCE & QUALITY
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] No console errors in browser
- [ ] No console warnings in browser
- [ ] Page load time < 3 seconds
- [ ] All animations run at 60fps

#### TASK 15.7: REAL CODE VERIFICATION
- [ ] Open 5 random component files
- [ ] Verify they contain REAL, working code
- [ ] Verify NO pseudo code patterns like:
  - "// fetch data here"
  - "// implement functionality"
  - "// add logic later"
  - "const data = mockData // TODO: replace with real API"
- [ ] Verify ALL API calls are implemented
- [ ] Verify ALL event handlers do something real

#### TASK 15.8: FINAL CHECKLIST
```
CRITICAL REQUIREMENTS - ALL MUST BE TRUE:

□ ZERO pseudo code in entire project
□ ZERO TODOs or FIXMEs
□ ZERO placeholder comments
□ ZERO external APIs used (only specified API)
□ ZERO Google API dependencies
□ ALL components render real content
□ ALL functions are fully implemented
□ ALL API calls use correct endpoint
□ ALL design system rules followed
□ ALL pages are responsive
□ ZERO console errors
□ ZERO TypeScript errors
□ Build succeeds
□ Performance is good

IF ANY CHECKBOX ABOVE IS UNCHECKED:
❌ Project is NOT complete
❌ Fix issues before proceeding
```

### 🔍 FINAL COMPLETION CHECKLIST:
- [ ] All 8 verification tasks complete
- [ ] All critical requirements TRUE
- [ ] Project is production-ready
- [ ] No compromises made
- [ ] Quality is excellent

### 📢 WHEN PHASE 15 COMPLETE:

Reply with:
```
🎉 PHASE 15 COMPLETE - PROJECT READY

VERIFICATION RESULTS:
□ Code completeness: ✓
□ API compliance: ✓
□ Design system: ✓
□ All features working: ✓
□ Responsive design: ✓
□ Performance: ✓
□ Real code only: ✓
□ All critical requirements: ✓

PROJECT STATUS: PRODUCTION READY ✅

No pseudo code found.
No external APIs used.
All functionality implemented.
All design requirements met.

Ready for deployment! 🚀
```

---

## 📊 PROGRESS TRACKER

```
Phase Status:
□ 1/15 - Project Foundation
□ 2/15 - Sidebar Navigation
□ 3/15 - Dashboard Hero Stats
□ 4/15 - Live Price Ticker
□ 5/15 - Market Overview Grid
□ 6/15 - Sentiment & News
□ 7/15 - Market Analysis
□ 8/15 - Trading Hub
□ 9/15 - AI Lab
□ 10/15 - Risk Management
□ 11/15 - Settings & Admin
□ 12/15 - API Services
□ 13/15 - State & Polish
□ 14/15 - Testing & Deploy
□ 15/15 - Final Verification ⭐
```

---

## 🎬 HOW TO USE THIS GUIDE

### Step-by-Step Process:

1. **READ** the entire Phase instructions carefully
2. **BUILD** all tasks in that Phase with REAL, COMPLETE code
3. **CHECK** every checkbox ✅
4. **TEST** what you built thoroughly
5. **VERIFY** no pseudo code or TODOs remain
6. **REPLY** "Phase X Complete ✓"
7. **WAIT** for "Start Phase X+1" command
8. **REPEAT** until Phase 15

### Critical Rules:

✅ **DO:**
- Read entire phase before coding
- Write COMPLETE, working code only
- Build one phase at a time
- Check all checkboxes
- Test thoroughly after each phase
- Follow design system exactly
- Use ONLY the specified API
- Make it beautiful with smooth animations
- Handle all errors properly
- Implement ALL functions fully

❌ **DON'T:**
- Write pseudo code or placeholders
- Leave TODO or FIXME comments
- Skip any phases
- Build multiple phases at once
- Ignore checkboxes
- Skip testing
- Use external APIs (Google, etc.)
- Use generic or lazy UI
- Forget animations
- Ignore responsive design
- Leave console errors
- Make incomplete implementations

### Code Quality Standards:

```javascript
// ❌ BAD - Pseudo code:
function fetchData() {
  // TODO: implement API call
  return mockData;
}

// ✅ GOOD - Real implementation:
async function fetchData() {
  try {
    const response = await fetch(
      getApiUrl(API_ENDPOINTS.MARKET_TOP)
    );
    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
```

### API Usage Requirements:

```javascript
// ❌ BAD - External API:
const API = 'https://api.coingecko.com/api/v3';

// ❌ BAD - Google API:
const API = 'https://googleapis.com/crypto';

// ✅ GOOD - Specified API only:
const API = 'https://really-amin-datasourceforcryptocurrency-2.hf.space';
```

---

## 🚀 START BUILDING

**READ THIS BEFORE STARTING:**

1. You MUST write REAL, COMPLETE code - NO pseudo code
2. You MUST use ONLY this API: `https://really-amin-datasourceforcryptocurrency-2.hf.space`
3. You MUST NOT use any external APIs (Google, CoinGecko, etc.)
4. You MUST complete ALL tasks before moving to next phase
5. You MUST check ALL checkboxes
6. You MUST follow the design system EXACTLY
7. You MUST implement ALL functions fully
8. You MUST NOT leave TODO or FIXME comments
9. You MUST test everything you build
10. You MUST proceed one phase at a time

**Your first message should be:**

```
I have read and understood the complete build guide.

I confirm:
✓ I will write REAL, COMPLETE code only (no pseudo code)
✓ I will use ONLY the specified API endpoint
✓ I will NOT use external APIs
✓ I will complete ALL tasks per phase
✓ I will check ALL checkboxes
✓ I will follow the design system exactly
✓ I will wait for confirmation between phases

Starting Phase 1 - Project Foundation now.
```

Then build Phase 1 completely, check all boxes, test it, and reply with the Phase 1 completion message.

After Phase 15 is complete, the entire project will be production-ready with:
- ✅ Beautiful, professional UI
- ✅ All features fully implemented
- ✅ Real API integration
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Error handling
- ✅ NO pseudo code
- ✅ NO external dependencies

**Let's build something amazing! 🎯**
