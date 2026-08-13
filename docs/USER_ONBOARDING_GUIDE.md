# User Onboarding Guide - Nexum Protocol

## Goal
Onboard **10+ real users** to interact with Nexum Protocol on Stellar Testnet and collect meaningful feedback.

---

## Quick Start for New Users

### Prerequisites
1. **Freighter Wallet** - Install from [freighter.app](https://freighter.app)
2. **Testnet XLM** - Get free XLM from Stellar Friendbot
3. **Testnet USDC** - Available through the app's swap feature

### Step-by-Step Guide

#### 1. Install Freighter
```
→ Visit freighter.app
→ Click "Install" for your browser
→ Create new wallet or import existing
→ Switch network to "Testnet" in Freighter settings
```

#### 2. Fund Your Testnet Wallet
```
→ Copy your Stellar address from Freighter
→ Visit: https://laboratory.stellar.org/#account-creator?network=test
→ Paste your address and click "Get test network lumens"
→ You'll receive 10,000 testnet XLM
```

#### 3. Access Nexum Protocol
```
→ Visit: [Your Vercel URL]
→ Click "Connect Wallet"
→ Approve connection in Freighter popup
→ You're ready to trade!
```

#### 4. Make Your First Trade
```
→ Navigate to "Trade" tab
→ Select lock period (30D, 90D, or 180D)
→ Enter USDC amount (min: 100 USDC)
→ Set your target APR (recommended: 14-16%)
→ Click "Submit Intent"
→ Approve transaction in Freighter
→ Success! Check your portfolio
```

#### 5. View Your Position
```
→ Navigate to "Portfolio" tab
→ See your active positions with:
  - Lock period
  - Maturity date
  - Current value
  - Accrued interest
→ Claim when matured
```

---

## Onboarding Campaign Strategy

### Phase 1: Soft Launch (Days 1-2)
**Target**: 3-5 users from personal network

**Actions**:
1. Share with 5 developer friends via direct message
2. Post in personal Twitter with demo GIF
3. Share in 1-2 relevant Discord communities

**Message Template**:
```
Hey! I just deployed Nexum Protocol - a fixed-rate yield platform on Stellar.

Would love your feedback on the testnet version:
🔗 [Your URL]

It's fully functional:
✅ Freighter wallet integration
✅ Fixed-rate guarantees
✅ Mobile responsive

Takes ~3 min to test. Let me know what you think!
```

### Phase 2: Community Outreach (Days 3-4)
**Target**: 5-7 users from Stellar community

**Actions**:
1. Post in Stellar Discord #testnet-help
2. Post in Stellar Discord #build-a-business
3. Tweet with #StellarBuild hashtag
4. Comment on recent Stellar blog posts

**Stellar Discord Message**:
```
🚀 Nexum Protocol - Now Live on Testnet!

Fixed-rate yield with rate-or-revert guarantees. Looking for testers!

Features:
• 30/90/180 day lock periods
• Guaranteed APR or transaction reverts
• Full Freighter integration
• Mobile responsive

Testnet: [Your URL]
GitHub: https://github.com/Samrat25/nexum-protocol

Feedback appreciated! 🙏
```

**Twitter Post**:
```
Just shipped Nexum Protocol on @StellarOrg Testnet! 🚀

Fixed-rate yield that either hits your target or reverts completely. No slippage, no surprises.

Try it: [Your URL]
Built with #Soroban #StellarBuild

[Attach demo GIF]
```

### Phase 3: Feedback Collection (Days 5-7)
**Target**: Collect 5+ detailed responses

**Actions**:
1. Send follow-up messages to all users
2. Offer small incentive (e.g., "First 10 testers get recognized in README")
3. Make feedback form easy to find in app

---

## User Tracking

### Metrics to Track

**Via PostHog**:
- Unique wallet addresses connected
- Page views per user
- Average session duration
- Funnel completion rate (Connect → Trade → Success)

**Via Supabase**:
- Transaction hashes
- Trade amounts and tenors
- Success vs. failed transactions

**Manually**:
- Stellar addresses (anonymized as User A, B, C...)
- Testimonials and detailed feedback
- Feature requests

### Documentation Format

Create `docs/WALLET_INTERACTIONS.md`:

```markdown
# Wallet Interactions - Proof of User Onboarding

## Summary
- Total Unique Wallets: 12
- Total Transactions: 28
- Date Range: Jan 15 - Jan 22, 2025

## User List

| ID | Stellar Address | Transactions | First Interaction |
|----|----------------|--------------|-------------------|
| 1  | GABC...XYZ     | 3            | 2025-01-15        |
| 2  | GDEF...123     | 2            | 2025-01-16        |
| 3  | GHIJ...456     | 4            | 2025-01-16        |
...

## Sample Transactions

Verified on Stellar Expert Testnet:

1. **User A** - Initial Deposit
   - TX: [hash] (https://stellar.expert/explorer/testnet/tx/[hash])
   - Amount: 500 USDC
   - Tenor: 90D
   - Date: 2025-01-15

2. **User B** - Withdrawal
   - TX: [hash]
   - Amount: 250 USDC
   - Date: 2025-01-17

[Continue for all key transactions]
```

---

## Feedback Form

### Google Form Questions

**Create form at**: https://forms.google.com

1. **What's your Stellar testnet address?** (for verification)
   - Short answer

2. **How would you rate the overall user experience?**
   - Scale: 1-5 stars

3. **Which feature did you find most valuable?**
   - Multiple choice: Rate guarantee, Multiple tenors, Mobile UI, Analytics, Other

4. **What was confusing or frustrating?**
   - Long answer

5. **What features would you like to see added?**
   - Long answer

6. **Would you use this on mainnet with real funds?**
   - Yes / Maybe / No
   - Follow-up: Why or why not?

7. **Any other feedback or suggestions?**
   - Long answer

### Embedding Form in App

Add to footer or dedicated /feedback route:

```tsx
// src/routes/feedback.tsx
export default function FeedbackPage() {
  return (
    <div className="container mx-auto p-6">
      <h1>We'd Love Your Feedback!</h1>
      <iframe 
        src="https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true"
        width="100%" 
        height="800"
        frameBorder="0"
      >
        Loading...
      </iframe>
    </div>
  );
}
```

---

## Incentives for Early Users

### Recognition
- List top testers in README.md
- "Special thanks to our testnet pioneers" section
- Link to their GitHub/Twitter (with permission)

### Exclusive Access
- "First 10 users get early mainnet access"
- Discord role "Nexum Founder"

### Educational Value
- Users learn Stellar development
- Hands-on experience with Soroban
- Portfolio project for their own GitHub

---

## Timeline

| Day | Goal | Activities |
|-----|------|-----------|
| 1-2 | 3-5 users | Personal network, soft launch |
| 3-4 | 8-10 users | Discord, Twitter, community outreach |
| 5-6 | 12-15 users | Follow-up, feedback collection |
| 7 | Finalize docs | Create WALLET_INTERACTIONS.md, update README |

---

## Troubleshooting Guide for Users

### Common Issues

**"Transaction failed"**
- Ensure sufficient testnet XLM for fees
- Check Freighter is on Testnet network
- Try reducing trade amount

**"Wallet not connecting"**
- Refresh page
- Disconnect and reconnect in Freighter
- Clear browser cache

**"Rate quote unavailable"**
- Vault may have low liquidity on testnet
- Try different amount or tenor
- Check Soroban RPC status

**"Can't get testnet XLM"**
- Use alternative faucet: https://friendbot.stellar.org
- Or use Stellar Laboratory account creator

---

## Success Criteria

- [ ] 10+ unique wallet addresses interacted
- [ ] 5+ detailed feedback responses
- [ ] All transactions verifiable on Stellar Expert
- [ ] User testimonials collected (min 3)
- [ ] No critical bugs reported
- [ ] Average UX rating ≥ 4/5 stars

Once achieved, document everything in submission checklist!

---

## Resources

- **Stellar Friendbot**: https://friendbot.stellar.org
- **Stellar Laboratory**: https://laboratory.stellar.org
- **Freighter Docs**: https://docs.freighter.app
- **Stellar Discord**: https://discord.gg/stellardev
- **Stellar Expert**: https://stellar.expert

Good luck with onboarding! 🚀
