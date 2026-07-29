// ─── APR History (14 days) ────────────────────────────────────────────────────
export const APR_HISTORY = [
  14.2, 14.8, 15.1, 14.9, 15.3, 15.8, 15.2, 14.7, 15.0, 15.4, 15.6, 15.1, 15.3, 15.2,
];

// ─── TVL History (14 days, in USDC) ──────────────────────────────────────────
export const TVL_HISTORY = [
  0, 500, 1200, 2100, 3400, 4200, 5100, 6300, 7800, 8500, 9200, 10100, 11400, 12300,
];

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function last14Days(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return out;
}

export const aprSeries = () => last14Days().map((date, i) => ({ date, apr: APR_HISTORY[i] }));
export const tvlSeries = () => last14Days().map((date, i) => ({ date, tvl: TVL_HISTORY[i] }));

// ─── Address helpers ──────────────────────────────────────────────────────────
function randAddr(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let s = "G";
  for (let i = 0; i < 55; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

// ─── Recent transactions ──────────────────────────────────────────────────────
const TENORS = [30, 90, 180] as const;

export interface RecentTxn {
  id: string;
  date: string;
  user: string;
  amount: number;
  apr: number;
  tenor: number;
}

export function generateRecentTxns(n = 10): RecentTxn[] {
  const now = Date.now();
  return Array.from({ length: n }).map((_, i) => {
    const d = new Date(now - i * 1000 * 60 * 60 * 6);
    return {
      id: `tx-${i}`,
      date: d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      user: randAddr(),
      amount: Math.round((100 + Math.random() * 4900) * 100) / 100,
      apr: Math.round((14 + Math.random() * 2) * 100) / 100,
      tenor: TENORS[Math.floor(Math.random() * TENORS.length)],
    };
  });
}

// ─── Static mock txns for dashboard table ─────────────────────────────────────
export const mockTxns = [
  { date: "Jul 28 14:32", addr: "GABY...X4QW", amount: 2500, apr: 15.2, tenor: "30D", status: "Active" },
  { date: "Jul 27 09:11", addr: "GCFT...L9RK", amount: 500,  apr: 14.9, tenor: "90D", status: "Active" },
  { date: "Jul 26 21:05", addr: "GDNX...W2MQ", amount: 1000, apr: 15.6, tenor: "30D", status: "Active" },
  { date: "Jul 25 16:44", addr: "GBVP...K8ZJ", amount: 750,  apr: 15.1, tenor: "180D",status: "Active" },
  { date: "Jul 24 08:30", addr: "GCMA...R3NP", amount: 3000, apr: 14.7, tenor: "90D", status: "Active" },
];

// ─── Protocol-level stats (updated post-deployment) ──────────────────────────
export const PROTOCOL_STATS = {
  tvl: 12300,
  totalIntents: 148,
  avgApr7d: 15.3,
  uniqueUsers: 42,
};
