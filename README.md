# 🌌 Nexum Protocol — Fixed-Rate Yield & Intent Engine on Stellar

> **Production-Ready MVP | Level 4 Green Belt Submission**  
> *Fixed-rate DeFi intents on Stellar Testnet powered by Soroban smart contracts, Horizon settlement, and LangGraph AI market intelligence.*

[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-blue?style=flat-square&logo=stellar)](https://stellar.org)
[![Soroban Contracts](https://img.shields.io/badge/Soroban-5%20Contracts-purple?style=flat-square)](https://soroban.stellar.org)
[![Commits](https://img.shields.io/badge/Commits-32%2B-success?style=flat-square)](https://github.com/Samrat25/nexum-yield-rates/commits/main)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🌟 Overview

**Nexum Protocol** addresses fixed-yield rate volatility on Stellar by allowing users to construct **single-transaction rate intents**. Users specify their minimum desired APR and tenor duration (30D, 90D, 180D). Nexum's smart router executes or reverts the transaction on-chain, minting **Principal Tokens (PT)** that guarantee a fixed rate until maturity.

---

## 🚀 Key Features

- 🔒 **Rate-or-Revert Execution:** Smart router contracts enforce minimum target APR on-chain.
- ⚡ **Freighter Wallet Integration:** Direct Horizon payment settlement showing exact XLM and USDC transfer amounts in Freighter popups.
- 💸 **Partial & Full Early Withdrawals:** Presets (25%, 50%, 75%, 100%) and custom input with real-time early exit penalty calculation and gas checks.
- 🤖 **LangGraph AI Market Intelligence:** Real-time AI advisory engine evaluating market rate curves, slippage probabilities, and execution recommendations.
- 📊 **Live Portfolio & Telemetry:** Dynamic yield ticking every 10 seconds, active vs archived positions separation, and complete transaction log backed by Supabase.

---

## 📜 Smart Contract Deployment (Stellar Testnet)

All 5 contracts are deployed and verified on Stellar Testnet:

| Contract Component | Contract Address ID | Explorer Link |
|---|---|---|
| **Vault Contract** | `CDWUAGLEHR7DMWX5LLND24OOBJBALUIIBGA6CMI7XQ3OZ5CGEOXIZFES` | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDWUAGLEHR7DMWX5LLND24OOBJBALUIIBGA6CMI7XQ3OZ5CGEOXIZFES) |
| **PT 30D Token** | `CA433DJVYAXD32VM3A3ALO4Z3VO35KSIBSAD5H3ONT5AXBKLJD3PBSF5` | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CA433DJVYAXD32VM3A3ALO4Z3VO35KSIBSAD5H3ONT5AXBKLJD3PBSF5) |
| **PT 90D Token** | `CD2B37RWEBG5PBTV4II27CHAFYYDA2BMIY3U5WDDHGYDWDWXN5X35JOF` | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CD2B37RWEBG5PBTV4II27CHAFYYDA2BMIY3U5WDDHGYDWDWXN5X35JOF) |
| **PT 180D Token** | `CBA4OHMVJ62BD5S6TJVE4QRGNISH6HJT3WKNU4HFXW4YRS66Q34DX6LI` | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBA4OHMVJ62BD5S6TJVE4QRGNISH6HJT3WKNU4HFXW4YRS66Q34DX6LI) |
| **Intent Router** | `CBKYDXU6HEDR2J4X24W56V5YRPP4FCSB563D5XFF3D35RCSX53T244S7` | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBKYDXU6HEDR2J4X24W56V5YRPP4FCSB563D5XFF3D35RCSX53T244S7) |

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TanStack Start (SSR), TanStack Router, Tailwind CSS, Lucide Icons, Recharts
- **Blockchain SDK:** `@stellar/stellar-sdk`, `@stellar/freighter-api`
- **Smart Contracts:** Rust, Soroban SDK
- **Backend / Telemetry:** Supabase (PostgreSQL), Local Storage Mirror Fallback
- **AI Intelligence:** LangGraph Yield Curve Analysis

---

## 💻 Local Development Setup

### Prerequisites
- Node.js >= 18.0.0
- [Freighter Wallet Extension](https://www.freighter.app/) set to **Stellar Testnet**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Samrat25/nexum-yield-rates.git
cd nexum-yield-rates

# 2. Install dependencies
npm install

# 3. Create environment file (.env)
cp .env.example .env

# 4. Start local development server
npm run dev
```

App will be live at `http://localhost:8081/`.

---

## 🧪 Submission Checklist (Level 4 Green Belt)

- [x] **Production MVP:** Fully functional dApp with real wallet transactions & live yield.
- [x] **Public GitHub Repo:** [Samrat25/nexum-yield-rates](https://github.com/Samrat25/nexum-yield-rates)
- [x] **15+ Commits:** 32+ commits in git history.
- [x] **Proof of 10+ Wallet Interactions:** Indexed transaction table in submission dossier.
- [x] **User Feedback Integration:** Incorporated early withdrawal sliders & live yield ticking based on user testing.
- [x] **Mobile Responsiveness:** Tested and verified across desktop & mobile screen sizes.

---

## 📄 License

MIT License © 2026 Nexum Protocol Team
