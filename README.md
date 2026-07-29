# Nexum Protocol

> **Fixed-rate DeFi yield on Stellar** · Rate-or-Revert · Built on Soroban

[![CI](https://github.com/Samrat25/nexum-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/Samrat25/nexum-protocol/actions/workflows/ci.yml)
[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.expert/explorer/testnet)
[![Freighter](https://img.shields.io/badge/Wallet-Freighter-purple)](https://freighter.app)

---

## What is Nexum?

Nexum Protocol lets users lock a **guaranteed fixed APR** on their USDC for 30, 90, or 180 days on Stellar's Soroban smart contract platform.

Unlike variable DeFi yield, Nexum's **Intent Router** ensures your target rate is achieved — or the **entire transaction reverts automatically**. No partial fills. No slippage on rate.

### Core mechanic

```
User → Intent Router → Vault Contract → PT Token Contract
            │
            └─ Rate-or-Revert check:
               implied_rate < target? → REVERT (funds stay)
               implied_rate ≥ target? → MINT PT → user wallet
```

PT (Principal Tokens) mature 1:1 to USDC at expiry, realizing the locked fixed rate.

---

## Live Demo

| Resource | Link |
|----------|------|
| Frontend | `[your-vercel-url]` |
| Vault contract | `[stellar.expert link]` |
| Intent Router | `[stellar.expert link]` |

---

## Architecture

```
nexum-yield-rates/
├── contracts/
│   ├── vault/           ← ERC-4626-style USDC vault (deposit/withdraw/APY)
│   ├── pt_token/        ← Principal Token (mint/burn/maturity)
│   └── intent_router/   ← Rate-or-Revert intent execution + quoting
├── src/
│   ├── routes/          ← TanStack Router pages (Home/Trade/Portfolio/Dashboard)
│   ├── components/      ← Navbar, WalletButton, IntentForm, QuoteDisplay, TxModal
│   ├── store/           ← Zustand (wallet state, positions)
│   └── lib/             ← stellar.ts, analytics.ts, mockData.ts, constants.ts
├── .github/workflows/   ← CI (cargo test + vite build)
└── DEPLOYMENT.md        ← Step-by-step deploy guide
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Rust · Soroban SDK 21 |
| Frontend | React 19 · Vite · TanStack Router |
| Styling | Tailwind CSS v4 |
| Blockchain | Stellar Testnet · Soroban RPC |
| Wallet | Freighter (`@stellar/freighter-api`) |
| SDK | `@stellar/stellar-sdk` |
| Charts | Recharts |
| State | Zustand |
| Data fetching | TanStack Query |
| Analytics | PostHog (stub → real) |

---

## Local Setup

### Prerequisites

- Node.js 20+
- Rust stable + `wasm32-unknown-unknown` target (for contracts)
- [Freighter browser extension](https://freighter.app) (for wallet testing)

### Frontend

```bash
git clone https://github.com/Samrat25/nexum-protocol
cd nexum-protocol

npm install
cp .env.example .env.local   # fill in contract IDs after deployment
npm run dev                   # http://localhost:5173
```

### Smart Contracts

```bash
# Install Rust + Stellar CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt

# Test all contracts
cd contracts && cargo test --workspace

# Build WASM
cargo build --target wasm32-unknown-unknown --release --workspace
```

---

## Contract Addresses (Testnet)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deploy commands and addresses after deployment.

---

## User Feedback

[Add after collecting 5+ responses via Google Form]

---

## Screenshots

[Add: desktop trade page, mobile view, analytics dashboard, wallet interactions]

---

## Contributing

PRs welcome. Please keep commits atomic and avoid rebasing/amending pushed commits (this repo is synced with Lovable).

---

*Built for the Stellar Green Belt Level 4 Bounty*
