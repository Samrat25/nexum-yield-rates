/**
 * analytics.ts
 *
 * PostHog analytics wrapper with graceful console.log fallback.
 * Call `initAnalytics()` once from the app root (client side only).
 */

let posthogLoaded = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ph: any = null;

export async function initAnalytics(): Promise<void> {
  if (typeof window === "undefined" || posthogLoaded) return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) {
    console.warn("[analytics] VITE_POSTHOG_KEY not set — using console fallback");
    return;
  }
  try {
    const posthog = (await import("posthog-js")).default;
    posthog.init(key, {
      api_host: "https://app.posthog.com",
      capture_pageview: true,
      autocapture: true,
    });
    ph = posthog;
    posthogLoaded = true;
    console.log("[analytics] PostHog initialized");
  } catch (e) {
    console.warn("[analytics] PostHog init failed", e);
  }
}

type Payload = Record<string, unknown>;

function _track(event: string, payload: Payload = {}): void {
  if (ph) {
    try {
      ph.capture(event, payload);
      return;
    } catch {
      /* fall through */
    }
  }
  // Console fallback
  console.log(`[analytics] ${event}`, payload);
}

function _identify(address: string): void {
  if (ph) {
    try {
      ph.identify(address, { wallet: address });
      return;
    } catch {
      /* fall through */
    }
  }
  console.log("[analytics] identify", address);
}

export const analytics = {
  /** Track any custom event with a payload. */
  track(event: string, payload: Payload = {}): void {
    _track(event, payload);
  },

  /** Identify the connected wallet address in PostHog. */
  identify(address: string): void {
    _identify(address);
  },

  // ── Named helpers ─────────────────────────────────────────────────────────
  wallet_connected(address: string): void {
    _identify(address);
    _track("wallet_connected", { address });
  },

  intent_quoted(amount: number, tenor: number, targetApr: number): void {
    _track("intent_quoted", { amount, tenor, targetApr });
  },

  intent_executed(amount: number, tenor: number, lockedApr: number, txHash: string): void {
    _track("intent_executed", { amount, tenor, lockedApr, txHash });
  },

  page_view(page: string): void {
    _track("page_view", { page });
  },
};
