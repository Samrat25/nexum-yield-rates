import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { IntentForm } from "@/components/IntentForm";
import { useWalletStore } from "@/store/walletStore";
import { Inbox } from "lucide-react";

export const Route = createFileRoute("/trade")({
  head: () => ({
    meta: [
      { title: "Trade — Nexum Protocol" },
      {
        name: "description",
        content: "Configure a fixed-rate yield intent on Stellar. Rate-or-revert execution.",
      },
      { property: "og:title", content: "Trade — Nexum Protocol" },
      {
        property: "og:description",
        content: "Lock your APR with a single intent. Fixed-rate DeFi on Stellar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TradePage,
});

function TradePage() {
  const positions = useWalletStore((s) => s.positions);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Trade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your intent and execute at your target rate.
          </p>
        </div>

        <IntentForm />

        <section className="mt-10 rounded-xl border border-border bg-surface">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-semibold">Transaction History</h2>
          </div>
          {positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="rounded-full border border-border bg-background p-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No positions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium">Locked APR</th>
                    <th className="px-5 py-3 text-right font-medium">Tenor</th>
                    <th className="px-5 py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const matured = new Date(p.maturityAt).getTime() <= Date.now();
                    return (
                      <tr key={p.id} className="border-b border-border/60 last:border-none">
                        <td className="px-5 py-4 text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right tabular">{p.amount.toFixed(2)} USDC</td>
                        <td className="px-5 py-4 text-right tabular text-success">
                          {p.lockedApr.toFixed(2)}%
                        </td>
                        <td className="px-5 py-4 text-right">{p.tenorDays}D</td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`rounded-md px-2 py-1 text-xs ${
                              matured ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                            }`}
                          >
                            {matured ? "Matured" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
