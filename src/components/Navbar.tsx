import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Diamond, Menu, X } from "lucide-react";
import { WalletButton } from "./WalletButton";

const links = [
  { to: "/" as const, label: "Home" },
  { to: "/trade" as const, label: "Trade" },
  { to: "/portfolio" as const, label: "Portfolio" },
  { to: "/dashboard" as const, label: "Dashboard" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Diamond className="h-5 w-5 text-primary" fill="currentColor" />
          <span className="text-lg font-bold tracking-tight text-primary">NEXUM</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              activeProps={{ className: "text-foreground bg-accent" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/60"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <WalletButton />
        </div>

        <button
          className="rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="flex flex-col gap-1 p-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "bg-accent text-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              <WalletButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
