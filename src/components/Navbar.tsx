import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X, LogOut, User, Heart, Sparkles, ChevronDown, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuth, homeForRoles } from "@/hooks/use-auth";

import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/custom", label: "Custom" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, roles, loading } = useAuth();
  const normalizedRole = (profile?.role ?? roles[0] ?? 'customer').toLowerCase();
  const basePath = `/${normalizedRole}`;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen]);

  const signOut = async () => {
    const { auth } = await import("@/integrations/firebase/client");
    await auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  const fullName = profile?.firstName ? `${profile.firstName} ${profile.secondName || ''}`.trim() : null;
  const initials = (fullName ?? user?.email ?? "?").slice(0, 1).toUpperCase();
  const accountHref = user ? homeForRoles(roles) : "/login";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-xl tracking-wider">AL-</span><span className="font-display text-xl tracking-wider text-gold">LERAWY</span>
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-gold" />
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm tracking-wide text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground md:inline-flex">
            <Search className="h-4 w-4" />
          </button>
          <Link
            to="/cart"
            className="relative inline-flex h-9 items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 text-sm transition hover:border-gold/40"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
          </Link>

          {loading ? null : user ? (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger
                className="hidden h-9 items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 text-xs transition hover:border-gold/40 md:inline-flex"
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-primary-foreground">
                    {initials}
                  </span>
                )}
                <span className="max-w-[10ch] truncate">{fullName ?? user.email}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                  align="end"
                  className="w-56"
                  ref={dropdownRef}
                >
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { navigate({ to: accountHref }); setDropdownOpen(false); }}>
                  <User className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { navigate({ to: "/customer/orders" }); setDropdownOpen(false); }}>
                  <ShoppingBag className="mr-2 h-4 w-4" /> Orders
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { navigate({ to: "/customer/wishlist" }); setDropdownOpen(false); }}>
                  <Heart className="mr-2 h-4 w-4" /> Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { navigate({ to: "/customer/requests" }); setDropdownOpen(false); }}>
                  <Sparkles className="mr-2 h-4 w-4" /> Open requests
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { navigate({ to: "/customer/profile" }); setDropdownOpen(false); }}>
                  <Settings className="mr-2 h-4 w-4" /> Profile settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { signOut(); setDropdownOpen(false); }} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="hidden h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-gold md:inline-flex"
            >
              Sign in
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-4">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-3 text-sm text-muted-foreground">
                {n.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={accountHref} onClick={() => setOpen(false)} className="flex items-center gap-2 py-3 text-sm">
                  <User className="h-4 w-4" /> Account
                </Link>
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border text-sm"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
