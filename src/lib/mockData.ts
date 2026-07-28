export const APR_HISTORY = [14.2, 14.8, 15.1, 14.9, 15.3, 15.8, 15.2, 14.7, 15.0, 15.4, 15.6, 15.1, 15.3, 15.2];
export const TVL_HISTORY = [0, 500, 1200, 2100, 3400, 4200, 5100, 6300, 7800, 8500, 9200, 10100, 11400, 12300];

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

export const aprSeries = () =>
  last14Days().map((date, i) => ({ date, apr: APR_HISTORY[i] }));

export const tvlSeries = () =>
  last14Days().map((date, i) => ({ date, tvl: TVL_HISTORY[i] }));

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
      date: d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      user: randAddr(),
      amount: Math.round((100 + Math.random() * 4900) * 100) / 100,
      apr: Math.round((14 + Math.random() * 2) * 100) / 100,
      tenor: TENORS[Math.floor(Math.random() * TENORS.length)],
    };
  });
}

export const PROTOCOL_STATS = {
  tvl: 12300,
  totalIntents: 148,
  avgApr7d: 15.3,
  uniqueUsers: 42,
};
