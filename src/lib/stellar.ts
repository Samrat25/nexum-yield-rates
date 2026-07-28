// Placeholder Stellar helpers. Real @stellar/stellar-sdk integration wires in later.
// Kept intentionally tiny so we can mock wallet + quote flows for the UI.

export interface Quote {
  impliedApr: number;
  ptReceived: number;
  executionCostUsdc: number;
  maturityDate: string;
}

export function computeQuote(amount: number, tenorDays: number, targetApr: number): Quote {
  const baseApr = 15.2;
  // slight jitter to simulate live movement
  const jitter = (Math.random() - 0.5) * 0.6;
  const impliedApr = Math.max(5, Math.min(30, baseApr + jitter + (targetApr - baseApr) * 0.05));
  const ptReceived = amount > 0 ? amount * (1 + (impliedApr / 100) * (tenorDays / 365)) : 0;
  const fee = amount > 0 ? Math.max(0.1, amount * 0.001) : 0;
  const maturity = new Date();
  maturity.setDate(maturity.getDate() + tenorDays);
  return {
    impliedApr: Math.round(impliedApr * 100) / 100,
    ptReceived: Math.round(ptReceived * 100) / 100,
    executionCostUsdc: Math.round(fee * 100) / 100,
    maturityDate: maturity.toISOString(),
  };
}

export function mockConnectWallet(): Promise<{ address: string; balance: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const address =
        "GAXXWXQRZL7NRCVU6YFPZM4CJHVGDTQ7WHJDBZ4CXQZ7VJK3D3M7HXPL";
      resolve({ address, balance: 1000 });
    }, 400);
  });
}
