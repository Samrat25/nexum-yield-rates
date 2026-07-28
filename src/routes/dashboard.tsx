import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  aprSeries,
  generateRecentTxns,
  PROTOCOL_STATS,
  truncateAddress,
  tvlSeries,
} from "@/lib/mockData";
import { useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nexum Protocol" },
      {
        name: "description",
        content: "Protocol-wide metrics for Nexum: TVL, APR history, and recent intents.",
      },
      { property: "og:title", content: "Dashboard — Nexum Protocol" },
      {
        property: "og:description",
        content: "TVL, APR history, and recent intents on Nexum Protocol.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const AXIS = { stroke: "oklch(0.65 0.02 280)", fontSize: 11 };

function DashboardPage() {
  const apr = useMemo(() => aprSeries(), []);
  const tvl = useMemo(() => tvlSeries(), []);
  const txns = useMemo(() => generateRecentTxns(10), []);
  const currentApr = apr[apr.length - 1].apr;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold sm:text-3xl">Protocol Dashboard</h1>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="TVL" value={`$${PROTOCOL_STATS.tvl.toLocaleString()}`} />
          <MetricCard label="Total Intents" value={PROTOCOL_STATS.totalIntents.toLocaleString()} />
          <MetricCard label="Avg APR (7d)" value={`${PROTOCOL_STATS.avgApr7d}%`} accent />
          <MetricCard label="Unique Users" value={PROTOCOL_STATS.uniqueUsers.toLocaleString()} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ChartCard title="APR History" subtitle="Last 14 days">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={apr} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="oklch(0.25 0.025 280)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="date" {...AXIS} tickLine={false} axisLine={false} />
                <YAxis {...AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.2 0.025 280)",
                    border: "1px solid oklch(0.25 0.025 280)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "oklch(0.65 0.02 280)" }}
                />
                <ReferenceLine
                  y={currentApr}
                  stroke="oklch(0.65 0.15 285)"
                  strokeDasharray="4 4"
                  label={{ value: "Current", fill: "oklch(0.65 0.15 285)", fontSize: 10, position: "insideTopRight" }}
                />
                <Line
                  type="monotone"
                  dataKey="apr"
                  stroke="oklch(0.62 0.13 175)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="TVL" subtitle="Last 14 days">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={tvl} margin={{ top: 10, right: 12, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="tvlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.15 285)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="oklch(0.65 0.15 285)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.25 0.025 280)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="date" {...AXIS} tickLine={false} axisLine={false} />
                <YAxis
                  {...AXIS}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.2 0.025 280)",
                    border: "1px solid oklch(0.25 0.025 280)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "oklch(0.65 0.02 280)" }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "TVL"]}
                />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke="oklch(0.65 0.15 285)"
                  strokeWidth={2}
                  fill="url(#tvlFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-surface">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-right font-medium">APR</th>
                  <th className="px-5 py-3 text-right font-medium">Tenor</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-none">
                    <td className="px-5 py-3 text-muted-foreground">{t.date}</td>
                    <td className="px-5 py-3 tabular text-foreground/80">
                      {truncateAddress(t.user)}
                    </td>
                    <td className="px-5 py-3 text-right tabular">{t.amount.toFixed(2)} USDC</td>
                    <td className="px-5 py-3 text-right tabular text-success">
                      {t.apr.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-right">{t.tenor}D</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`tabular mt-2 text-2xl font-bold ${accent ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
