# Social Media Outreach Templates - Nexum Protocol

Use these templates to promote your testnet app and gather user feedback.

---

## Twitter / X Posts

### Initial Launch Tweet
```
🚀 Nexum Protocol is now LIVE on @StellarOrg Testnet!

Fixed-rate yield with a twist: Rate-or-Revert™
Your transaction only executes if it meets your target APR. No slippage, no surprises.

Try it: [YOUR_URL]
Built with #Soroban

🧵 Here's how it works... (1/5)
```

**Thread continuation**:
```
(2/5) Select your lock period: 30, 90, or 180 days
Set your target APR
Submit your intent

(3/5) The Intent Router checks vault liquidity and calculates the implied rate

(4/5) If rate ≥ target → You get PT tokens
If rate < target → Transaction reverts (your funds stay safe)

(5/5) PT tokens mature 1:1 to USDC at expiry
Full transparency, on-chain verification

Give it a try and let me know what you think! 🙏

[Demo GIF]
```

### Call for Testers
```
Looking for 10 beta testers for Nexum Protocol! 🔬

You'll get:
✅ Early access
✅ Recognition in README
✅ Help shape the product

Requirements:
• 5 mins to test on testnet
• Brief feedback form

DM me if interested! #StellarBuild #Soroban
```

### Feature Highlight
```
Why fixed-rate DeFi matters:

Variable rates make planning impossible
You deposit at 20% APY, wake up to 3%

With Nexum:
📌 Lock your rate BEFORE depositing
📌 Guarantee honored or transaction reverts
📌 Perfect for treasuries & risk-averse investors

Live on @StellarOrg Testnet: [URL]
```

### Technical Deep Dive
```
Under the hood of Nexum Protocol 🧵

5 Soroban smart contracts:
• Vault (ERC-4626-style USDC pool)
• PT Tokens x3 (30D/90D/180D)
• Intent Router (rate verification engine)

All written in Rust, deployed on Testnet

Code: https://github.com/Samrat25/nexum-protocol

#Soroban #StellarDevelopers
```

---

## Stellar Discord Messages

### #testnet-help Channel
```
🚀 **Nexum Protocol - Live on Testnet!**

I just deployed a fixed-rate yield platform and would love your feedback.

**What it does**:
Lock a guaranteed APR for 30/90/180 days. Transaction only executes if your rate is met (Rate-or-Revert).

**Try it**: [YOUR_URL]

**Testnet Setup**:
1. Install Freighter
2. Get XLM from Friendbot
3. Connect wallet → Trade

**Takes ~3 minutes**. Any feedback is super appreciated! 🙏

GitHub: https://github.com/Samrat25/nexum-protocol
```

### #build-a-business Channel
```
Hey builders! 👋

Working on my Level 4 Green Belt submission - **Nexum Protocol** - and looking for testers.

**Problem**: Variable DeFi yields make financial planning impossible
**Solution**: Fixed-rate deposits with Rate-or-Revert guarantees

**Tech stack**:
• 5 Soroban contracts (Rust)
• React 19 + TanStack Router
• Freighter integration
• PostHog analytics

**Testnet**: [YOUR_URL]

Would mean a lot if you could try it out and share feedback. Thanks! 🚀
```

### #soroban-smart-contracts Channel
```
**Smart Contract Deep Dive - Nexum Protocol**

Just deployed an intent-based execution engine on Soroban.

**Architecture**:
1. User submits intent: `(amount, tenor, targetAPR)`
2. Router queries vault for available liquidity
3. Calculates implied rate from PT token pricing
4. If `impliedRate >= targetAPR` → mint PT tokens
5. Else → revert entire transaction

**Interesting challenges**:
• Cross-contract calls between Router ↔ Vault ↔ PT Tokens
• Rate calculation accuracy (bps precision)
• Gas optimization for multi-step flow

Code: https://github.com/Samrat25/nexum-protocol/tree/main/contracts

Open to feedback on contract design! 🙏
```

---

## Reddit Posts

### r/Stellar
```
Title: Built a Fixed-Rate Yield Protocol on Soroban - Feedback Welcome

Body:
Hey r/Stellar! 👋

I just deployed Nexum Protocol on testnet - a fixed-rate DeFi yield platform with a twist.

**The Problem**:
Variable rates in DeFi make it impossible to plan. You might deposit at 15% APY and wake up to 3%.

**The Solution**:
Rate-or-Revert™ - Your transaction only executes if your target rate is met. If not, it reverts and your funds stay in your wallet. No partial fills, no slippage on rate.

**Tech**:
- 5 Soroban smart contracts (Rust)
- React frontend with Freighter integration
- Mobile responsive
- PostHog analytics

**Try it**: [YOUR_URL] (testnet only for now)

**Looking for**:
- Testers who can spend 5 mins trying it out
- Feedback on UX/functionality
- Suggestions for improvements

All code is open source: https://github.com/Samrat25/nexum-protocol

Built for the Stellar Level 4 Green Belt Bounty. Would really appreciate any feedback! 🙏
```

### r/SorobanDev (if exists)
```
Title: Open sourced my Soroban intent router - would love code review

Body:
Working on an intent-based execution engine for fixed-rate yield.

**Challenge**: 
Verify a rate quote from a vault contract and either execute or revert atomically.

**My approach**:
1. Intent router receives: amount, tenor, target_apr
2. Queries vault for liquidity and PT token price
3. Calculates implied rate: `(pt_price / usdc_amount - 1) * (365 / tenor_days)`
4. Checks: `implied_rate >= target_apr`
5. If true → calls pt_token::mint, if false → errors and reverts

**Questions**:
- Is there a more gas-efficient way to handle multi-contract calls?
- Should I use storage or pass data via invocation args?
- Any security concerns with this pattern?

Code: https://github.com/Samrat25/nexum-protocol/blob/main/contracts/intent_router/src/lib.rs

Open to any feedback! Thanks 🙏
```

---

## LinkedIn Post (Professional Angle)

```
🚀 Excited to share: Nexum Protocol is now live on Stellar testnet!

After weeks of building, I've deployed a fixed-rate yield platform that solves a key problem in DeFi: unpredictable returns.

**The Challenge**:
Businesses and treasuries struggle with variable DeFi yields. You can't budget or plan when your 15% APY drops to 3% overnight.

**The Innovation**:
Rate-or-Revert™ guarantees. Set your target rate before depositing. If the market can't meet it, the transaction automatically reverts—no partial fills, no surprises.

**Tech Stack**:
✅ 5 Soroban smart contracts (Rust)
✅ React 19 frontend
✅ Freighter wallet integration
✅ Real-time analytics with PostHog

**What's Next**:
Gathering user feedback from testnet, then launching on mainnet.

Try it: [YOUR_URL]
Code: https://github.com/Samrat25/nexum-protocol

Building on Stellar has been incredible—fast, cheap, and developer-friendly. Big thanks to the @Stellar Development Foundation for the Level 4 bounty opportunity.

Would love to hear thoughts from others in the #DeFi and #Blockchain space!

#Stellar #SmartContracts #Web3 #Fintech
```

---

## Direct Message Template (for developer friends)

```
Hey [Name]! 👋

I just shipped my Stellar project to testnet and would love your quick feedback.

It's Nexum Protocol - fixed-rate yield with a Rate-or-Revert mechanism. Basically, your transaction only goes through if you get the APR you asked for.

Takes ~3 mins to test:
1. Open: [YOUR_URL]
2. Connect Freighter (testnet)
3. Try a trade (testnet USDC provided)

Any thoughts—good or bad—would be super helpful. I'm submitting this for the Stellar Level 4 bounty and need to show real user feedback.

Thanks! Let me know if you have questions 🙏

GitHub: https://github.com/Samrat25/nexum-protocol
```

---

## Email to Crypto Newsletters / Blogs

```
Subject: Nexum Protocol - Fixed-Rate Yield on Stellar Soroban

Hi [Editor Name],

I recently built and deployed Nexum Protocol, a fixed-rate DeFi yield platform on Stellar's Soroban.

**Why it's interesting**:
- Novel "Rate-or-Revert" mechanism (transaction only executes if target APR is met)
- Solves a real problem in DeFi (unpredictable variable rates)
- Leverages Stellar's speed and low costs
- Open source with detailed documentation

**Current Status**:
- Live on testnet: [YOUR_URL]
- 5 smart contracts deployed
- 10+ active testers
- Preparing for mainnet launch

I thought this might be relevant for [Newsletter/Blog Name]'s audience. Would you be interested in covering it or featuring it in an upcoming issue?

Happy to provide more details, demo access, or an interview.

Thanks for your time!

[Your Name]
[Your Email]
[Your Twitter]

Links:
• Live demo: [YOUR_URL]
• GitHub: https://github.com/Samrat25/nexum-protocol
• Twitter: [your handle]
```

---

## Instagram Story / TikTok Script (if you want broad reach)

**Visual**: Screen recording of trade flow

**Text overlays**:
```
Frame 1: "Fixed-rate DeFi on Stellar"
Frame 2: "Set your target APR"
Frame 3: "Get your rate or transaction reverts"
Frame 4: "No slippage. No surprises."
Frame 5: "Try it → [SHORT_URL]"
```

**Voiceover** (if doing TikTok):
"I just built a DeFi app where you lock in your yield before depositing. If the market can't meet your rate, the transaction cancels automatically. It's called Rate-or-Revert. Link in bio to try it."

**Hashtags**: #crypto #defi #stellar #blockchain #web3 #coding #buildinpublic

---

## Posting Schedule

### Day 1 (Launch Day)
- [ ] Twitter launch thread (morning)
- [ ] Stellar Discord (#testnet-help) (morning)
- [ ] LinkedIn post (afternoon)
- [ ] DM 3 developer friends

### Day 2
- [ ] Twitter feature highlight
- [ ] Reddit r/Stellar
- [ ] Stellar Discord (#build-a-business)
- [ ] DM 3 more friends

### Day 3
- [ ] Twitter call for testers
- [ ] Reddit r/CryptoCurrency (if enough karma)
- [ ] Follow up with Day 1-2 DMs

### Day 4
- [ ] Twitter technical deep dive
- [ ] Stellar Discord (#soroban-smart-contracts)
- [ ] Email to crypto newsletters

### Day 5-7
- [ ] Share user testimonials on Twitter
- [ ] Post GIF demo on Twitter
- [ ] Thank testers publicly
- [ ] Announce progress toward bounty goals

---

## Engagement Tips

1. **Respond quickly** to all comments and questions
2. **Be humble** - "Would love your feedback" vs "Check out my amazing app"
3. **Make it easy** - Provide testnet XLM faucet link, clear instructions
4. **Show gratitude** - Thank everyone who tests, even if feedback is negative
5. **Share progress** - "5/10 users onboarded, getting great feedback on X"
6. **Visual content** - GIFs and screenshots get 3x more engagement than text alone

---

## Metrics to Track

- [ ] Twitter impressions and engagement
- [ ] Discord message replies
- [ ] Reddit upvotes and comments
- [ ] Direct messages received
- [ ] Click-throughs to your app (use bit.ly to track)
- [ ] Actual user signups (PostHog or Supabase)

---

Good luck with outreach! 📣
