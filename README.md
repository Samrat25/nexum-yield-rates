# Stellar Yield Vault

Build a production-ready DeFi web app called "Nexum Protocol" — a fixed-rate yield protocol on Stellar blockchain. This is for a hackathon submission so it needs to look and feel professional, polished, and complete.

---

TECH STACK
- React + Vite + TypeScript
- Tailwind CSS for styling
- React Router for navigation (4 pages)
- Recharts for charts
- Zustand for global state (wallet connection, user positions)
- @stellar/stellar-sdk and @stellar/freighter-api for blockchain
- React Query (TanStack Query) for data fetching and polling
- React Hot Toast for notifications

---

DESIGN SYSTEM
Dark theme only. Background: #0A0A0F. Card surfaces: #12121A. Border color: #1E1E2E.
Primary accent: #7F77DD (purple). Success: #1D9E75 (teal). Warning: #EF9F27 (amber).
Font: Inter (Google Fonts). All numbers use tabular-nums.
Rounded corners: 12px cards, 8px buttons and inputs.
Subtle glow on the primary accent color for highlighted elements.
No gradients except on the hero section (very subtle radial purple glow from center).

---

PAGES AND ROUTES

1. "/" — HOME PAGE
- Full-width hero section: large headline "Lock your yield. Own your rate." subheading "Nexum brings fixed-rate DeFi to Stellar — execute a rate intent and your APR is guaranteed or your funds return automatically." CTA button "Launch App" → /trade
- Three stat cards below hero: "Total Value Locked" showing $0 (placeholder), "Current Vault APY" showing 15.2%, "Active Positions" showing 0
- Three feature cards section: "Rate-or-Revert" (icon: shield-check), "Fixed APR" (icon: lock), "Stellar Native" (icon: zap)
- Simple explanation section: "How it works" — 4 numbered steps: Deposit USDC → Vault mints shares → Intent Router locks your rate → PT tokens mature to par
- Footer with GitHub link placeholder and "Built on Stellar" badge

2. "/trade" — TRADE PAGE (most important page)
- Left column (wider): IntentForm component
  - Section title "Configure Intent"
  - Amount input: labeled "USDC Amount", placeholder "Enter amount...", show user's testnet USDC balance below in gray
  - Tenor selector: three buttons toggling between "30 Days", "90 Days", "180 Days" — styled as pill buttons, selected one filled purple
  - Target APR slider: labeled "Target APR", range 5% to 30%, step 0.1, show current value large next to it
  - Below slider: "Rate or Revert — if achieved APR falls below your target, the entire transaction cancels automatically"
  - Big "Execute Intent" button at bottom — disabled state if wallet not connected showing "Connect Wallet to Trade"

- Right column (narrower): QuoteDisplay component
  - Section title "Live Quote" with a small pulsing green dot indicating live
  - "Implied APR" big number in green
  - "PT Received" amount
  - "Execution cost" in USDC (small fee)
  - "Maturity date" formatted as readable date
  - Below: small disclaimer "Quote updates every 3 seconds. Slippage may occur."
  - Rate comparison bar: shows your target rate vs current implied rate, green if achievable, red if not

- Transaction history table below both columns: columns — Date, Amount, Locked APR, Tenor, Status (Active/Matured). Show "No positions yet" empty state with an icon.

3. "/portfolio" — PORTFOLIO PAGE
- Header: "My Positions" + wallet address truncated (first 6...last 4 chars)
- Summary cards row: "Total Locked" (sum of all positions in USDC), "Avg Locked APR" (weighted average), "Next Maturity" (closest date)
- Positions list: each position as a card showing:
  - PT token amount and tenor badge (30D / 90D / 180D)  
  - Locked APR in large green text
  - Maturity date with countdown (e.g. "23 days remaining")
  - Progress bar showing time elapsed vs total tenor
  - Status badge: Active (purple) or Matured (teal)
  - If matured: "Redeem" button in teal
- Empty state: nice illustration placeholder + "No active positions. Go to Trade to lock your first rate." button

4. "/dashboard" — DASHBOARD PAGE
- Title: "Protocol Dashboard"
- Top metric cards (4 in a row): TVL, Total Intents Executed, Average APR (7d), Unique Users
- APR History chart: line chart using recharts, X axis = dates (last 14 days), Y axis = APR %, show current implied rate as a horizontal dashed line labeled "Current"
- TVL chart: area chart, same date range, area fill is semi-transparent purple
- Recent transactions table: Date, User (truncated address), Amount, APR, Tenor — show 10 rows with placeholder data
- All charts should have dark themed axes (gray text, no grid lines except subtle horizontal ones)

---

GLOBAL COMPONENTS

Navbar (appears on all pages):
- Left: "NEXUM" logo in purple bold text with a small diamond icon before it
- Center: navigation links — Home, Trade, Portfolio, Dashboard
- Right: wallet button — if not connected shows "Connect Wallet" (outlined purple button), if connected shows truncated address in a gray pill with a small green dot
- Mobile: hamburger menu collapsing to a slide-in drawer

WalletProvider (global context using Zustand):
- State: isConnected (bool), address (string), balance (number for USDC)
- connectWallet(): calls window.freighter.getPublicKey(), sets address, sets isConnected true
- disconnectWallet(): clears state
- Mock the balance as 1000 USDC for UI testing (real integration comes later)

---

PLACEHOLDER DATA (use this for all charts and tables while real contract is not connected)

APR history (14 days): [14.2, 14.8, 15.1, 14.9, 15.3, 15.8, 15.2, 14.7, 15.0, 15.4, 15.6, 15.1, 15.3, 15.2]
TVL history: [0, 500, 1200, 2100, 3400, 4200, 5100, 6300, 7800, 8500, 9200, 10100, 11400, 12300]
Recent txns: generate 5 fake rows with random addresses, amounts between 100-5000 USDC, APRs between 14-16%, tenors 30/90/180d

---

MOBILE RESPONSIVE
Every page must work at 375px width.
Navbar collapses to hamburger at mobile.
Trade page: stacks IntentForm on top, QuoteDisplay below.
Dashboard: charts go full width stacked, metric cards become 2x2 grid.
Portfolio: position cards stack full width.

---

LOADING AND ERROR STATES
Every data fetch section has a skeleton loader (gray animated pulse rectangles).
Quote polling shows a spinner on the "Live Quote" dot when refetching.
Transaction submission shows a modal/overlay with: pending (spinner) → success (green checkmark + tx hash) → error (red X + error message).
All error states have a "Retry" button.

---

ANALYTICS HOOKS (stub these out as console.log for now, real PostHog comes later)
- analytics.track('wallet_connected', { address })
- analytics.track('intent_quoted', { amount, tenor, targetApr })
- analytics.track('intent_executed', { amount, tenor, lockedApr, txHash })
Create a lib/analytics.ts file with these three functions stubbed as console.log statements.

---

FILE STRUCTURE TO FOLLOW
src/
  pages/ (Home.tsx, Trade.tsx, Portfolio.tsx, Dashboard.tsx)
  components/ (Navbar.tsx, WalletButton.tsx, IntentForm.tsx, QuoteDisplay.tsx, PositionCard.tsx, TxModal.tsx)
  store/ (walletStore.ts using Zustand)
  lib/ (stellar.ts, analytics.ts, mockData.ts)
  App.tsx (React Router setup)

---

START BY BUILDING: the full app shell with Navbar + routing + all 4 pages with placeholder data and complete UI. The wallet connection can use a mock (just set a fake address on click) for now. Focus on making it look production-quality. Dark theme, clean, minimal, professional DeFi aesthetic.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/aa6a0d13-76f8-4235-b771-d94fcd12b63c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
