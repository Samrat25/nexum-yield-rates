# Nexum Protocol - Demo Video Script

**Duration**: 3-4 minutes  
**Platform**: YouTube (unlisted or public)  
**Recommended Tool**: Loom, OBS Studio, or QuickTime  

---

## Pre-Recording Checklist

- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Freighter wallet installed and funded with testnet XLM
- [ ] Testnet USDC in wallet (or show swap feature)
- [ ] App running smoothly (test connection first)
- [ ] Audio test completed
- [ ] Screen resolution: 1920x1080 recommended
- [ ] Hide bookmarks bar and browser extensions

---

## Script

### Opening [0:00 - 0:15]

**[Show landing page]**

"Hi, I'm [Your Name], and this is **Nexum Protocol** - a fixed-rate yield platform built on Stellar's Soroban smart contracts.

Unlike traditional DeFi where rates fluctuate unpredictably, Nexum lets you lock in a guaranteed APR before committing any funds.

Let me show you how it works."

---

### Wallet Connection [0:15 - 0:35]

**[Navigate to top-right, click Connect Wallet]**

"First, I'll connect my Freighter wallet. Nexum integrates seamlessly with Stellar's ecosystem."

**[Freighter popup appears, click Approve]**

"There we go - wallet connected. You can see my testnet USDC balance and Stellar address in the header."

**[Point to wallet button showing address]**

---

### Trade Flow [0:35 - 2:00]

**[Navigate to Trade tab]**

"Now let's create a fixed-rate deposit. Here's where the magic happens.

**[Fill out form while narrating]**

I'll:
1. Select my preferred lock period - let's go with **90 days**
2. Enter the amount - **500 USDC**
3. Set my target APR - I want **15.2%**

**[Click 'Get Quote' or equivalent button]**

The protocol's Intent Router now checks the vault's available liquidity and calculates whether it can meet my target rate.

**[Quote appears]**

Great! It found a match. Here's the key innovation:

If the implied rate from the vault is **greater than or equal to** my target, the transaction proceeds and I receive PT tokens - Principal Tokens.

If it's **less than** my target, the entire transaction **reverts automatically**. No partial fills. No slippage on rate. My funds stay safe in my wallet.

This is what we call **Rate-or-Revert**.

**[Click Submit Intent]**

Let me execute this trade.

**[Freighter transaction popup appears]**

Freighter shows the transaction details. I'll approve it.

**[Click Approve in Freighter]**

**[Wait for confirmation - should be 3-5 seconds]**

And... done! Transaction confirmed on Stellar testnet in under 5 seconds.

---

### Portfolio View [2:00 - 2:30]

**[Navigate to Portfolio tab]**

"Now let's check my portfolio.

**[Show active positions]**

Here's my 90-day position that just executed. I can see:
- The exact maturity date
- Current value: 500 USDC principal
- Accrued interest calculated in real-time
- The locked APR: 15.2%

**[Scroll to show Position History if available]**

Below are my past positions and their realized returns. Everything is on-chain and verifiable on Stellar Expert."

---

### Dashboard Analytics [2:30 - 3:00]

**[Navigate to Dashboard tab]**

"The analytics dashboard shows protocol-wide metrics:

**[Point to each metric]**

- Total Value Locked across all vaults
- Transaction volume over time
- Active users
- Distribution across different lock periods

All of this data comes from real on-chain interactions tracked via PostHog analytics."

---

### Withdrawal Demo [3:00 - 3:30]

**[Navigate back to Portfolio]**

"When a position matures, I can claim my principal plus interest.

Let me show you a withdrawal. I'll click **Withdraw** on this position.

**[Click Withdraw button]**

I can choose a partial or full withdrawal. Let's withdraw **100 USDC**.

**[Enter amount, click Confirm]**

**[Freighter popup appears]**

Approve the transaction...

**[Click Approve]**

**[Wait for confirmation]**

Success! My USDC balance increased, and the position updated to reflect the partial withdrawal.

Zero slippage. Instant settlement. That's the power of Stellar."

---

### Mobile Demo [3:30 - 3:50]

**[Open Chrome DevTools or switch to phone recording]**

"The entire platform is fully responsive.

**[Show mobile view: Navigate through pages]**

Here's the same trade flow, portfolio, and analytics - all optimized for mobile devices."

---

### Closing [3:50 - 4:00]

**[Return to desktop landing page]**

"Nexum Protocol brings DeFi fixed income to Stellar with:
- ✅ Guaranteed rates via Rate-or-Revert
- ✅ Instant settlement on Soroban
- ✅ Full transparency and on-chain verification

Check out the **GitHub repository** for technical details, deployment guide, and smart contract code.

The link is in the description below.

Thanks for watching!"

**[Fade out or show GitHub URL]**

---

## Post-Recording

### Editing Checklist
- [ ] Trim dead air at start/end
- [ ] Add captions for key terms (Rate-or-Revert, PT Tokens, etc.)
- [ ] Speed up slow parts (waiting for transactions) to 1.5x
- [ ] Add text overlays for:
  - GitHub URL
  - Live demo URL
  - Contract addresses
- [ ] Background music (optional, keep low volume)
- [ ] Export at 1080p

### YouTube Upload
- **Title**: "Nexum Protocol - Fixed-Rate Yield on Stellar Soroban | Demo"
- **Description**:
  ```
  Nexum Protocol is a fixed-rate yield platform built on Stellar's Soroban smart contracts.

  🔗 Live Demo: [Your URL]
  💻 GitHub: https://github.com/Samrat25/nexum-protocol
  📄 Documentation: [Link to README]

  Key Features:
  ✅ Rate-or-Revert guarantees
  ✅ 30/90/180-day lock periods
  ✅ Instant settlement on Stellar
  ✅ Full Freighter wallet integration
  ✅ Mobile responsive

  Smart Contracts (Testnet):
  - Vault: CDWUAGLEHR7DMWX5LLND24OOBJBALUIIBGA6CMI7XQ3OZ5CGEOXIZFES
  - Intent Router: CAD5WJIEMPUHRJGTE6ATJPEAVDDD3QNNPXZMU2E4AO4ZVK5DH73Q5MRF

  Built for Stellar Level 4 Green Belt Bounty 🟢

  Timestamps:
  0:00 Introduction
  0:15 Wallet Connection
  0:35 Trade Flow & Rate-or-Revert
  2:00 Portfolio View
  2:30 Analytics Dashboard
  3:00 Withdrawal Demo
  3:30 Mobile Responsiveness

  #Stellar #Soroban #DeFi #Blockchain #StellarBuild
  ```

- **Tags**: stellar, soroban, defi, blockchain, smart contracts, yield, fixed rate, crypto
- **Thumbnail**: Screenshot of trade page with "FIXED-RATE YIELD" text overlay
- **Visibility**: Unlisted (or Public if you want broader reach)

---

## Alternative: Quick GIF Demo

If video is too time-consuming, create a 30-second GIF for social media:

**Tools**: 
- LICEcap (Windows/Mac)
- ScreenToGif (Windows)
- Kap (Mac)

**Content**:
1. Open app (2s)
2. Connect wallet (3s)
3. Fill trade form (5s)
4. Submit and approve (5s)
5. Show success + portfolio (5s)
6. Text overlay: "Nexum Protocol - Fixed Rates on Stellar" (2s)

**Use for**:
- Twitter posts
- Discord messages
- README.md hero section

---

## Voice-Over Tips

- **Pace**: Speak slightly slower than normal conversation
- **Tone**: Enthusiastic but professional
- **Pauses**: Pause 1-2 seconds when navigating between pages
- **Key phrases**: Emphasize "Rate-or-Revert", "guaranteed", "instant"
- **Energy**: Higher energy at intro and closing, moderate in middle

---

## Technical Setup

### OBS Studio Settings
- **Video**: 1920x1080, 30fps
- **Audio**: 44.1kHz, boost input by +5dB if needed
- **Output**: MP4, H.264 codec
- **Display Capture**: Use Window Capture for cleaner recording

### Loom Settings
- **Camera**: Optional, bottom-right bubble
- **Quality**: High (1080p)
- **Drawing Tools**: Use to highlight important UI elements

---

## Backup Plan

If you can't record a full video immediately:

1. **Create slide deck** with screenshots (Google Slides / PowerPoint)
2. **Record voiceover** over slides
3. **Export as video** (PowerPoint can export to MP4)
4. **Add transitions** to make it dynamic

This is less ideal but still acceptable for bounty submission.

---

Good luck with recording! 🎬
