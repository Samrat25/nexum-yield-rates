# Wallet Interactions - Proof of User Onboarding

**Project**: Nexum Protocol  
**Submission Date**: [Fill in when ready]  
**Tracking Period**: [Start Date] - [End Date]  

---

## Executive Summary

- **Total Unique Wallets**: [X]
- **Total Transactions**: [Y]
- **Successful Trades**: [Z]
- **Failed Transactions**: [F]
- **Average Trade Size**: [Amount] USDC
- **Most Popular Tenor**: [30D/90D/180D]
- **Network**: Stellar Testnet

All wallet addresses and transactions are verifiable on [Stellar Expert Testnet](https://stellar.expert/explorer/testnet).

---

## User List

| User ID | Stellar Address (Truncated) | Transaction Count | First Interaction | Last Interaction | Feedback Provided |
|---------|----------------------------|-------------------|-------------------|------------------|-------------------|
| User A  | GABC...XYZ                 | 3                 | 2025-01-15        | 2025-01-17       | ✅                |
| User B  | GDEF...123                 | 2                 | 2025-01-16        | 2025-01-16       | ✅                |
| User C  | GHIJ...456                 | 4                 | 2025-01-16        | 2025-01-18       | ✅                |
| User D  | GKLM...789                 | 1                 | 2025-01-17        | 2025-01-17       | ❌                |
| User E  | GNOP...ABC                 | 5                 | 2025-01-17        | 2025-01-19       | ✅                |
| User F  | GQRS...DEF                 | 2                 | 2025-01-18        | 2025-01-18       | ✅                |
| User G  | GTUV...GHI                 | 3                 | 2025-01-18        | 2025-01-19       | ❌                |
| User H  | GWXY...JKL                 | 2                 | 2025-01-19        | 2025-01-19       | ✅                |
| User I  | GZAB...MNO                 | 1                 | 2025-01-19        | 2025-01-19       | ❌                |
| User J  | GCDE...PQR                 | 2                 | 2025-01-20        | 2025-01-20       | ✅                |
| User K  | GFGH...STU                 | 3                 | 2025-01-20        | 2025-01-21       | ❌                |
| User L  | GIJK...VWX                 | 4                 | 2025-01-21        | 2025-01-22       | ✅                |

**Note**: Addresses are truncated for privacy while remaining verifiable on-chain.

---

## Detailed Transaction Log

### User A - GABC...XYZ (3 transactions)

**Transaction 1: Initial Deposit**
- **Date**: 2025-01-15 14:32 UTC
- **Type**: Trade (Deposit)
- **Amount**: 500 USDC
- **Tenor**: 90D
- **Target APR**: 15.2%
- **Status**: ✅ Success
- **TX Hash**: `abc123def456...`
- **Stellar Expert**: [View TX](https://stellar.expert/explorer/testnet/tx/abc123def456...)
- **Contract Called**: Intent Router → Vault → PT Token 90D

**Transaction 2: Partial Withdrawal**
- **Date**: 2025-01-17 10:15 UTC
- **Type**: Withdrawal (Partial)
- **Amount**: 100 USDC
- **Position**: 90D #1
- **Status**: ✅ Success
- **TX Hash**: `def789ghi012...`
- **Stellar Expert**: [View TX](https://stellar.expert/explorer/testnet/tx/def789ghi012...)

**Transaction 3: Another Deposit**
- **Date**: 2025-01-17 16:45 UTC
- **Type**: Trade (Deposit)
- **Amount**: 1000 USDC
- **Tenor**: 180D
- **Target APR**: 16.0%
- **Status**: ✅ Success
- **TX Hash**: `ghi345jkl678...`
- **Stellar Expert**: [View TX](https://stellar.expert/explorer/testnet/tx/ghi345jkl678...)

---

### User B - GDEF...123 (2 transactions)

**Transaction 1: Test Deposit**
- **Date**: 2025-01-16 09:20 UTC
- **Type**: Trade (Deposit)
- **Amount**: 100 USDC
- **Tenor**: 30D
- **Target APR**: 14.5%
- **Status**: ✅ Success
- **TX Hash**: `jkl901mno234...`
- **Stellar Expert**: [View TX](https://stellar.expert/explorer/testnet/tx/jkl901mno234...)

**Transaction 2: Failed Trade (Rate Not Met)**
- **Date**: 2025-01-16 11:40 UTC
- **Type**: Trade (Deposit)
- **Amount**: 2000 USDC
- **Tenor**: 90D
- **Target APR**: 25.0% (too high)
- **Status**: ❌ Reverted (Rate-or-Revert triggered)
- **TX Hash**: `mno567pqr890...`
- **Stellar Expert**: [View TX](https://stellar.expert/explorer/testnet/tx/mno567pqr890...)
- **Note**: User set unrealistic APR, transaction correctly reverted

---

### User C - GHIJ...456 (4 transactions)

**Transaction 1**: [Date] - [Type] - [Amount] - ✅
**Transaction 2**: [Date] - [Type] - [Amount] - ✅
**Transaction 3**: [Date] - [Type] - [Amount] - ✅
**Transaction 4**: [Date] - [Type] - [Amount] - ✅

[Continue for all users...]

---

## Transaction Statistics

### By Transaction Type
| Type | Count | Success Rate |
|------|-------|--------------|
| Deposit (Trade) | 18 | 94% (17/18) |
| Withdrawal | 7 | 100% (7/7) |
| Failed/Reverted | 3 | N/A |
| **Total** | **28** | **96%** |

### By Tenor Selection
| Tenor | Trades | Percentage |
|-------|--------|------------|
| 30D   | 4      | 22%        |
| 90D   | 8      | 45%        |
| 180D  | 6      | 33%        |

### By Amount Range
| Range | Count |
|-------|-------|
| < 100 USDC | 2 |
| 100-500 USDC | 12 |
| 500-1000 USDC | 3 |
| > 1000 USDC | 1 |

### Daily Activity
| Date | New Users | Transactions |
|------|-----------|--------------|
| 2025-01-15 | 1 | 1 |
| 2025-01-16 | 2 | 5 |
| 2025-01-17 | 3 | 6 |
| 2025-01-18 | 2 | 5 |
| 2025-01-19 | 3 | 6 |
| 2025-01-20 | 2 | 4 |
| 2025-01-21 | 1 | 1 |

---

## Verification Method

### How to Verify These Transactions

1. **Visit Stellar Expert Testnet**:  
   https://stellar.expert/explorer/testnet

2. **Search by Transaction Hash**:  
   Copy any TX hash from above and paste into search

3. **Search by Wallet Address**:  
   Search any user's full address to see all their transactions

4. **Filter by Contract**:  
   Search contract IDs to see all interactions:
   - Vault: `CDWUAGLEHR7DMWX5LLND24OOBJBALUIIBGA6CMI7XQ3OZ5CGEOXIZFES`
   - Intent Router: `CAD5WJIEMPUHRJGTE6ATJPEAVDDD3QNNPXZMU2E4AO4ZVK5DH73Q5MRF`

### Alternative: PostHog Analytics

All wallet connections and trades are also tracked in PostHog:
- Dashboard: [Your PostHog project link]
- Events tracked: `wallet_connected`, `trade_executed`, `withdrawal_completed`
- Unique user count: [X]

---

## User Acquisition Sources

| Source | Users Acquired | Conversion Rate |
|--------|----------------|-----------------|
| Stellar Discord | 6 | 30% (6/20 reached out) |
| Twitter | 3 | 15% (3/20 impressions) |
| Direct DM | 5 | 100% (5/5 responded) |
| Reddit | 2 | 10% (2/20 views) |
| Other | 1 | N/A |

---

## Notable User Behaviors

### Power User: User E (5 transactions)
- Tested all three tenors (30D, 90D, 180D)
- Tried both small (100 USDC) and large (1500 USDC) amounts
- Provided detailed feedback on UX
- Quote: "Love the rate guarantee feature. Very intuitive."

### Edge Case Tester: User B
- Intentionally set unrealistic APR (25%) to test Rate-or-Revert
- Confirmed transaction reverted correctly
- Appreciated the error message clarity
- Quote: "The revert worked perfectly. Clear error message helped me understand."

### Mobile User: User F
- All transactions done on mobile device (verified via PostHog user-agent)
- Confirmed responsive design works well
- Quote: "Surprised how well this works on my phone."

---

## Common User Issues & Resolutions

| Issue | Occurrences | Resolution |
|-------|-------------|------------|
| Insufficient testnet XLM | 3 | Provided Friendbot link |
| Freighter not on Testnet | 2 | Guided to switch network |
| Transaction timeout | 1 | Resubmitted successfully |
| Confusion about PT tokens | 4 | Explained in DM, added tooltip to UI |

---

## User Feedback Highlights

### Positive
- ✅ "Rate guarantee gives me confidence" - User A
- ✅ "Faster than other testnet dApps I've tried" - User C
- ✅ "Clean UI, easy to understand" - User B
- ✅ "Love seeing PT tokens in my Freighter" - User E
- ✅ "Mobile experience is great" - User F

### Constructive
- 🔄 "Would like more tenor options (15D, 365D)" - User G
- 🔄 "Add a calculator for expected returns" - User H
- 🔄 "Support for other assets beyond USDC" - User J

### Bug Reports
- 🐛 Loading spinner sometimes stuck (fixed in v1.1)
- 🐛 Toast notification didn't show on mobile Safari (investigating)

---

## Compliance Statement

All user data has been:
- ✅ Collected with implicit consent (public blockchain interactions)
- ✅ Anonymized for privacy (truncated addresses)
- ✅ Used solely for bounty submission purposes
- ✅ Verifiable on public blockchain (Stellar testnet)

No personal information (email, name, location) was collected or stored.

---

## Supporting Evidence

### Files Included
1. `docs/screenshots/posthog-dashboard.png` - Analytics overview
2. `docs/screenshots/stellar-expert-tx.png` - Sample transaction
3. `docs/USER_FEEDBACK.md` - Detailed user testimonials
4. This document

### External Links
- PostHog Dashboard: [Link with read-only access]
- Supabase Transaction Log: [Optional, if you implemented]
- GitHub Commit History: Shows continuous development

---

## Reviewer Notes

To verify these wallet interactions:

1. **Check Transaction Hashes**: All TX hashes are valid and verifiable on Stellar Expert testnet
2. **Check Contract Calls**: Each transaction shows correct contract invocations
3. **Check Timestamps**: Activity span covers [X] days showing real usage
4. **Check PostHog**: Unique wallet addresses match transaction count

If you need any clarification or additional proof, please reach out.

---

**Last Updated**: [Date]  
**Contact**: [Your Email/GitHub/Twitter]

---

## Appendix: Full Transaction List

[Optional: Include CSV export or full table of all 28+ transactions]

```csv
UserID,StellarAddress,TxHash,Type,Amount,Tenor,Date,Status
UserA,GABC...XYZ,abc123...,Deposit,500,90D,2025-01-15,Success
UserA,GABC...XYZ,def789...,Withdrawal,100,90D,2025-01-17,Success
...
```

---

🎯 **Target Achieved**: 10+ unique users ✅  
🎯 **Transaction Volume**: 25+ transactions ✅  
🎯 **All Verifiable**: On-chain evidence ✅
