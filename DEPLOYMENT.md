# Nexum Protocol — Deployment Guide

## Overview

Three contracts must be deployed on Stellar Testnet in order:
1. `vault` → stores USDC, manages shares
2. `pt_token` × 3 (one per tenor: 30D, 90D, 180D)
3. `intent_router` → wires everything together

---

## Prerequisites

```bash
# Install Rust + wasm target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Generate or import a testnet keypair
stellar keys generate --global alice --network testnet
stellar keys fund alice --network testnet    # get free XLM from Friendbot
```

---

## Step 1 — Build all contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release --workspace
```

Output WASMs: `target/wasm32-unknown-unknown/release/*.wasm`

---

## Step 2 — Deploy Vault

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/vault.wasm \
  --source alice \
  --network testnet
# → prints VAULT_CONTRACT_ID
```

### Initialize Vault

```bash
stellar contract invoke \
  --id <VAULT_CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- initialize \
  --admin <YOUR_PUBLIC_KEY> \
  --usdc_token <USDC_SAC_ADDRESS> \
  --initial_apy_bps 1520
```

> The USDC SAC (Stellar Asset Contract) address on testnet:
> `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`

---

## Step 3 — Deploy PT Tokens (×3)

Repeat for each tenor. Replace `30` / `90` / `180` and the name/symbol:

```bash
# 30D
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/pt_token.wasm \
  --source alice \
  --network testnet
# → PT30D_CONTRACT_ID

stellar contract invoke \
  --id <PT30D_CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- initialize \
  --admin <YOUR_PUBLIC_KEY> \
  --vault <VAULT_CONTRACT_ID> \
  --maturity_timestamp <UNIX_TS_30_DAYS_FROM_NOW> \
  --name "Nexum PT 30D" \
  --symbol "nPT30"
```

> Unix timestamp: `date -d "+30 days" +%s`

---

## Step 4 — Deploy Intent Router

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/intent_router.wasm \
  --source alice \
  --network testnet
# → ROUTER_CONTRACT_ID

stellar contract invoke \
  --id <ROUTER_CONTRACT_ID> \
  --source alice \
  --network testnet \
  -- initialize \
  --admin <YOUR_PUBLIC_KEY> \
  --vault <VAULT_CONTRACT_ID> \
  --pt_30d <PT30D_CONTRACT_ID> \
  --pt_90d <PT90D_CONTRACT_ID> \
  --pt_180d <PT180D_CONTRACT_ID>
```

---

## Step 5 — Configure Frontend

Copy `.env.example` to `.env.local` and fill in the deployed IDs:

```bash
cp .env.example .env.local
```

```env
VITE_VAULT_ID=<VAULT_CONTRACT_ID>
VITE_PT30D_ID=<PT30D_CONTRACT_ID>
VITE_PT90D_ID=<PT90D_CONTRACT_ID>
VITE_PT180D_ID=<PT180D_CONTRACT_ID>
VITE_ROUTER_ID=<ROUTER_CONTRACT_ID>
VITE_POSTHOG_KEY=<your_posthog_key>   # optional
```

---

## Step 6 — Build & Deploy Frontend

```bash
npm run build

# Vercel (recommended)
npx vercel --prod

# Or drag the dist/ folder to https://vercel.com/new
```

---

## Testnet Contract Addresses

| Contract        | Address               |
|-----------------|-----------------------|
| Vault           | [after deploy]        |
| PT Token 30D    | [after deploy]        |
| PT Token 90D    | [after deploy]        |
| PT Token 180D   | [after deploy]        |
| Intent Router   | [after deploy]        |

> Update this table and commit after deployment.

---

## Useful links

- Stellar Expert (testnet): https://stellar.expert/explorer/testnet
- Soroban RPC: https://soroban-testnet.stellar.org
- Freighter wallet: https://freighter.app
- StellaRide (test deployed contracts): https://stellaride.vercel.app
