import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Settings,
  Sparkles, Heart, DollarSign, Upload, Shield, ChevronDown, LogOut, User, Bell,
} from "lucide-react";
import type { ReactNode } from "react";
import AccountDropdown from "./AccountDropdown";

type Role = "customer" | "producer" | "admin";

const NAV: Record<Role, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  customer: [
    { to: "/customer/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/customer/orders", label: "Orders", icon: ShoppingBag },
    { to: "/customer/wishlist", label: "Wishlist", icon: Heart },
    { to: "/customer/requests", label: "Open requests", icon: Sparkles },
  ],
  producer: [
    { to: "/producer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/producer/products", label: "Products", icon: Package },
    { to: "/producer/upload", label: "Upload", icon: Upload },
    { to: "/producer/orders", label: "Orders", icon: ShoppingBag },
    { to: "/producer/earnings", label: "Earnings", icon: DollarSign },
    { to: "/producer/analytics", label: "Analytics", icon: BarChart3 },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/settings", label: "Settings", icon: Shield },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer studio",
  producer: "Producer studio",
  admin: "Admin console",
};

export function DashboardLayout({
  role,
  title,
  children,
}: {
  role: Role;
  title: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="border-b border-border/40 bg-secondary/20 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-16 items-center px-6">
            <Link to="/" className="flex items-baseline gap-1.5">
              <span className="font-display text-lg tracking-wider">AL-</span><span className="font-display text-lg tracking-wider text-gold">LERAWY</span>
            </Link>
          </div>
          <div className="px-6 pb-6">
            <p className="text-[10px] uppercase tracking-widest text-gold">{ROLE_LABEL[role]}</p>
          </div>
          <nav className="px-3 pb-6">
            {NAV[role].map((n, i) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.label}
                  to={n.to}
                  className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto hidden border-t border-border/40 p-6 lg:block">
            <Link to="/" className="text-xs text-muted-foreground hover:text-gold">
              ← Back to site
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="px-6 py-10 md:px-10">
          <header className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gold">{ROLE_LABEL[role]}</p>
              <h1 className="mt-1 font-display text-4xl md:text-5xl">{title}</h1>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <AccountDropdown />
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && <span className="text-gold">{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-secondary/20 p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

