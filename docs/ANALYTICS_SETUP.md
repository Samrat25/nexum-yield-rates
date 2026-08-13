# Analytics & Monitoring Setup - Nexum Protocol

This guide covers the complete setup of PostHog analytics for tracking user behavior and product metrics.

---

## Why PostHog?

- ✅ Open-source and privacy-friendly
- ✅ Event tracking + session recordings + feature flags
- ✅ No-code funnels and dashboards
- ✅ Free tier: 1M events/month
- ✅ Easy integration with React

---

## PostHog Setup

### 1. Create PostHog Account

```
→ Visit: https://posthog.com
→ Sign up (free)
→ Create new project: "Nexum Protocol"
→ Copy API key from project settings
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
VITE_POSTHOG_KEY=phc_your_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

### 3. Initialize PostHog in App

Create or update `src/lib/analytics.ts`:

```typescript
import posthog from 'posthog-js';

// Initialize PostHog
if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        console.log('PostHog loaded');
      }
    },
    // Enable session recording
    session_recording: {
      maskAllInputs: false, // Set to true to mask sensitive inputs
      maskTextSelector: '.sensitive', // Add class to elements you want masked
    },
    // Capture pageviews automatically
    capture_pageview: true,
    // Capture page leaves
    capture_pageleave: true,
  });
}

// Track custom events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties);
  }
};

// Identify user by wallet address
export const identifyUser = (walletAddress: string) => {
  if (typeof window !== 'undefined') {
    posthog.identify(walletAddress, {
      wallet_type: 'freighter',
      network: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
    });
  }
};

// Reset identity on disconnect
export const resetUser = () => {
  if (typeof window !== 'undefined') {
    posthog.reset();
  }
};

export default posthog;
```

---

## Event Tracking Implementation

### Key Events to Track

| Event Name | Triggered When | Properties |
|------------|----------------|------------|
| `page_view` | User lands on page | `page_name`, `referrer` |
| `wallet_connect_started` | User clicks Connect Wallet | - |
| `wallet_connected` | Freighter approves connection | `wallet_address`, `balance_xlm` |
| `wallet_disconnected` | User disconnects | `session_duration` |
| `trade_form_opened` | User navigates to Trade page | - |
| `trade_tenor_selected` | User selects 30D/90D/180D | `tenor` |
| `trade_quote_requested` | User clicks Get Quote | `amount`, `target_apr`, `tenor` |
| `trade_quote_received` | Quote returns successfully | `implied_apr`, `pt_tokens`, `vault_liquidity` |
| `trade_intent_submitted` | User clicks Submit Intent | `amount`, `tenor`, `target_apr` |
| `trade_executed` | Transaction confirmed on-chain | `tx_hash`, `amount`, `tenor`, `success` |
| `trade_failed` | Transaction reverted | `error_message`, `reason` |
| `portfolio_viewed` | User opens Portfolio page | `position_count` |
| `position_clicked` | User clicks position details | `position_id`, `tenor`, `maturity_date` |
| `withdrawal_initiated` | User starts withdrawal flow | `position_id`, `amount` |
| `withdrawal_completed` | Withdrawal confirmed | `tx_hash`, `amount` |
| `dashboard_viewed` | User opens Dashboard | - |
| `error_occurred` | Any error in app | `error_type`, `component`, `message` |

---

## Code Integration Examples

### 1. Wallet Connection

In `src/components/WalletButton.tsx` or wallet hook:

```typescript
import { trackEvent, identifyUser, resetUser } from '@/lib/analytics';

// On connect
const handleConnect = async () => {
  trackEvent('wallet_connect_started');
  
  try {
    const address = await freighter.getPublicKey();
    
    // Identify user
    identifyUser(address);
    
    trackEvent('wallet_connected', {
      wallet_address: address.slice(0, 4) + '...' + address.slice(-4), // Privacy
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    trackEvent('wallet_connect_failed', {
      error: error.message,
    });
  }
};

// On disconnect
const handleDisconnect = () => {
  trackEvent('wallet_disconnected');
  resetUser();
};
```

### 2. Trade Flow

In `src/routes/trade.tsx`:

```typescript
import { trackEvent } from '@/lib/analytics';

// When user selects tenor
const handleTenorChange = (tenor: '30D' | '90D' | '180D') => {
  setSelectedTenor(tenor);
  trackEvent('trade_tenor_selected', { tenor });
};

// When requesting quote
const handleGetQuote = async () => {
  trackEvent('trade_quote_requested', {
    amount: formData.amount,
    target_apr: formData.targetApr,
    tenor: formData.tenor,
  });
  
  try {
    const quote = await fetchQuote(formData);
    
    trackEvent('trade_quote_received', {
      implied_apr: quote.impliedApr,
      pt_tokens: quote.ptAmount,
      vault_liquidity: quote.availableLiquidity,
    });
  } catch (error) {
    trackEvent('trade_quote_failed', {
      error: error.message,
    });
  }
};

// When submitting trade
const handleSubmit = async () => {
  trackEvent('trade_intent_submitted', {
    amount: formData.amount,
    tenor: formData.tenor,
    target_apr: formData.targetApr,
  });
  
  try {
    const txHash = await executeIntent(formData);
    
    trackEvent('trade_executed', {
      tx_hash: txHash,
      amount: formData.amount,
      tenor: formData.tenor,
      success: true,
    });
  } catch (error) {
    trackEvent('trade_failed', {
      error: error.message,
      reason: error.code || 'unknown',
    });
  }
};
```

### 3. Portfolio

In `src/routes/portfolio.tsx`:

```typescript
import { trackEvent } from '@/lib/analytics';

// On page load
useEffect(() => {
  trackEvent('portfolio_viewed', {
    position_count: positions.length,
  });
}, [positions]);

// When clicking position
const handlePositionClick = (position) => {
  trackEvent('position_clicked', {
    position_id: position.id,
    tenor: position.tenor,
    maturity_date: position.maturityDate,
  });
};
```

### 4. Error Tracking

Create an error boundary wrapper:

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    trackEvent('error_occurred', {
      error_type: 'react_error_boundary',
      component: errorInfo.componentStack,
      message: error.message,
      stack: error.stack,
    });
    
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Wrap your app:

```typescript
// src/router.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <RouterProvider router={router} />
</ErrorBoundary>
```

---

## PostHog Dashboard Configuration

### 1. Create Funnels

Go to PostHog → Insights → New Insight → Funnel

**User Onboarding Funnel**:
1. `page_view` (landing page)
2. `wallet_connect_started`
3. `wallet_connected`
4. `trade_form_opened`

**Trade Completion Funnel**:
1. `trade_quote_requested`
2. `trade_quote_received`
3. `trade_intent_submitted`
4. `trade_executed`

### 2. Key Metrics to Track

Create dashboard with:

**Engagement**:
- Daily Active Users (unique `wallet_connected`)
- Session duration
- Pages per session

**Conversion**:
- Wallet connection rate
- Trade submission rate
- Trade success rate

**Product**:
- Most popular tenor (count by `tenor` property)
- Average trade size
- Error rate by type

**Retention**:
- Day 1, 7, 30 retention
- Returning users

### 3. Session Recordings

Enable in PostHog settings:
- Record all sessions (or sample 50%)
- Watch failed trade attempts
- Identify UX issues

**Privacy**: Mask sensitive data with CSS class `.sensitive`

---

## Testing Analytics

### Local Testing

```typescript
// Test in browser console
import { trackEvent } from './lib/analytics';

trackEvent('test_event', {
  test_property: 'test_value',
  timestamp: new Date().toISOString(),
});
```

Check PostHog dashboard → Events → Live Events to see it appear.

### Validation Checklist

Test each event:
- [ ] `wallet_connected` fires on Freighter approval
- [ ] `trade_executed` fires after transaction
- [ ] `error_occurred` fires on intentional error
- [ ] User properties show up in PostHog (wallet address)
- [ ] Session recordings are capturing

---

## Privacy & Compliance

### Best Practices

1. **Anonymize wallet addresses**: Only log truncated versions
   ```typescript
   const anonymizedAddress = address.slice(0, 4) + '...' + address.slice(-4);
   ```

2. **Don't track sensitive data**:
   - ❌ Full wallet addresses in properties
   - ❌ Private keys (obviously)
   - ❌ Email addresses (if you collect them)
   - ✅ Transaction hashes (public on blockchain)
   - ✅ Aggregated amounts

3. **Add cookie consent** (optional but good practice):
   ```typescript
   // Only initialize PostHog if user consents
   const userConsent = localStorage.getItem('analytics_consent');
   if (userConsent === 'accepted') {
     posthog.init(...);
   }
   ```

---

## Submission Requirements

For Level 4 bounty, include:

1. **Screenshot of PostHog dashboard** showing:
   - At least 10 unique users (distinct wallet addresses)
   - Total events captured (100+)
   - Trade funnel with conversion rates

2. **Event list** in README:
   ```markdown
   ## Analytics Events Tracked
   - wallet_connected
   - trade_executed
   - portfolio_viewed
   [etc.]
   ```

3. **PostHog project link** (optional, for reviewers):
   - Share read-only link to dashboard

---

## Troubleshooting

### Events not showing up
- Check browser console for PostHog errors
- Verify API key in env vars
- Ensure `posthog.init()` runs before events
- Check ad blockers aren't blocking PostHog

### Session recordings not working
- Enable in PostHog project settings
- Check `session_recording` config in init
- Clear browser cache and test

### High event volume
- Add event throttling for high-frequency events
- Sample events (e.g., 10% of page views)

---

## Alternative: Google Analytics

If you prefer GA4:

```bash
npm install react-ga4
```

```typescript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');

// Track pageview
ReactGA.send({ hitType: 'pageview', page: window.location.pathname });

// Track event
ReactGA.event({
  category: 'trade',
  action: 'executed',
  label: 'success',
  value: 500,
});
```

But PostHog is recommended for its feature set and ease of use.

---

## Next Steps

1. Implement event tracking in all key flows
2. Test locally to verify events fire
3. Deploy to production
4. Monitor PostHog dashboard for 2-3 days
5. Take screenshots for submission
6. Document findings in README

Good luck! 📊
