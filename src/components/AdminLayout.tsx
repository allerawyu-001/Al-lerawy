import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCircle2,
  Store,
  Package,
  ShoppingBag,
  Sparkles,
  Tags,
  CreditCard,
  Star,
  Bell,
  FileBarChart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Search,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNotifications, notificationsStore, iconFor, relativeTime } from "@/lib/notifications-store";

export const ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/customers", label: "Customers", icon: UserCircle2 },
  { to: "/admin/producers", label: "Producers", icon: Store },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/requests", label: "Custom Requests", icon: Sparkles },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function SidebarNav({ onNavigate, onLogoutClick }: { onNavigate?: () => void; onLogoutClick: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-baseline gap-1.5" onClick={onNavigate}>
          <span className="font-display text-lg tracking-wider">AL-</span><span className="font-display text-lg tracking-wider text-gold">LERAWY</span>
        </Link>
      </div>
      <div className="px-6 pb-4">
        <p className="text-[10px] uppercase tracking-widest text-gold">Admin console</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {ADMIN_NAV.map((n) => {
          const active = pathname === n.to || pathname.startsWith(n.to + "/");
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={`mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
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
      <div className="border-t border-border/40 p-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            onLogoutClick();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/" className="hover:text-gold">Home</Link>
      {parts.map((p, i) => {
        const href = "/" + parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {last ? (
              <span className="text-foreground capitalize">{p}</span>
            ) : (
              <span className="capitalize">{p}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function NotificationsBell() {
  const items = useNotifications();
  const unread = items.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // tick to refresh relative times
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  const recent = items.slice(0, 6);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-medium tabular-nums text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-md border border-border bg-background shadow-xl md:w-96">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="font-display text-sm">Notifications</p>
            <button
              type="button"
              onClick={() => notificationsStore.markAllRead()}
              className="text-[10px] uppercase tracking-widest text-gold hover:underline"
              disabled={unread === 0}
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-96 divide-y divide-border/40 overflow-y-auto">
            {recent.length === 0 && (
              <li className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications</li>
            )}
            {recent.map((n) => {
              const Icon = iconFor(n.type);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      notificationsStore.markRead(n.id);
                      setOpen(false);
                      navigate({ to: "/admin/notifications/$id", params: { id: n.id } });
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-secondary/50 ${
                      n.read ? "" : "bg-gold/5"
                    }`}
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-gold">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm">{n.title}</span>
                        {!n.read && <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                        {relativeTime(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border/60 px-4 py-2.5 text-center">
            <Link
              to="/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-gold hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      const { auth } = await import("@/integrations/firebase/client");
      await auth.signOut();
      toast.success("Logged out successfully");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-border/40 bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen">
          <SidebarNav onLogoutClick={() => setLogoutOpen(true)} />
        </aside>

        <div className="flex min-h-screen flex-col">
          {/* Top navbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:px-8">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary lg:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 border-border bg-sidebar p-0">
                  <SidebarNav
                    onNavigate={() => setMobileOpen(false)}
                    onLogoutClick={() => setLogoutOpen(true)}
                  />
                </SheetContent>
              </Sheet>
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 md:flex">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  placeholder="Search…"
                  className="h-9 w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <NotificationsBell />
              <span className="h-9 w-9 rounded-full gold-gradient" />
            </div>
          </header>

          <main className="flex-1 px-4 py-8 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={(v) => !loggingOut && setLogoutOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of AL-LERAWY admin?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be returned to the sign-in screen. Any unsaved changes on this page will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmLogout();
              }}
              disabled={loggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loggingOut ? "Logging out…" : "Confirm logout"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold">Admin</p>
        <h1 className="mt-1 font-display text-4xl md:text-5xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-border bg-secondary/20 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-4xl tabular-nums">{value}</p>
      {delta && <p className="mt-2 text-xs text-gold">{delta}</p>}
    </Card>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}

export function SearchInput({
  placeholder = "Search…",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3">
      <Search className="h-3.5 w-3.5 text-muted-foreground" />
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground md:w-72"
      />
    </div>
  );
}

export function Pill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "gold" | "danger" | "warn" | "muted" }) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-foreground",
    gold: "bg-gold/15 text-gold",
    danger: "bg-destructive/20 text-destructive-foreground",
    warn: "bg-accent/15 text-accent",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Pagination({
  page = 1,
  total = 1,
  onPageChange,
  loading = false,
}: {
  page?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}) {
  const safeTotal = Math.max(1, total);
  const safePage = Math.min(Math.max(1, page), safeTotal);
  const canPrev = !!onPageChange && safePage > 1 && !loading;
  const canNext = !!onPageChange && safePage < safeTotal && !loading;
  return (
    <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
      <span>Page {safePage} of {safeTotal}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onPageChange?.(safePage - 1)}
          disabled={!canPrev}
          className="rounded-md border border-border px-3 py-1.5 transition hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange?.(safePage + 1)}
          disabled={!canNext}
          className="rounded-md border border-border px-3 py-1.5 transition hover:border-gold/40 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
