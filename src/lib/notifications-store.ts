import { useSyncExternalStore } from "react";
import { ShoppingBag, UserPlus, AlertTriangle, Bell, CreditCard, Sparkles, type LucideIcon } from "lucide-react";

export type NotificationType = "order" | "producer" | "customer" | "payment" | "request" | "system";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: number; // ms epoch
  read: boolean;
  link?: string; // related entity link
};

const ICONS: Record<NotificationType, LucideIcon> = {
  order: ShoppingBag,
  producer: UserPlus,
  customer: UserPlus,
  payment: CreditCard,
  request: Sparkles,
  system: AlertTriangle,
};

export const iconFor = (t: NotificationType) => ICONS[t] ?? Bell;

const now = Date.now();
const mins = (n: number) => now - n * 60_000;

let items: Notification[] = [
  { id: "n_1", type: "order", title: "New order #A-2418", body: "Iris Laurent placed an order for $184.", createdAt: mins(2), read: false, link: "/admin/orders" },
  { id: "n_2", type: "producer", title: "Maison Doré requested onboarding", body: "Producer application pending review.", createdAt: mins(58), read: false, link: "/admin/producers" },
  { id: "n_3", type: "payment", title: "Refund flagged for review", body: "Order #A-2416 — $248 refund needs approval.", createdAt: mins(185), read: false, link: "/admin/payments" },
  { id: "n_4", type: "request", title: "New custom request", body: "Hand-painted gold serpent on black snapback — $220.", createdAt: mins(420), read: true, link: "/admin/requests" },
  { id: "n_5", type: "system", title: "Weekly digest ready", body: "12 new producers, 84 new customers this week.", createdAt: mins(60 * 26), read: true },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const notificationsStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getAll() {
    return items;
  },
  get(id: string) {
    return items.find((n) => n.id === id);
  },
  unreadCount() {
    return items.filter((n) => !n.read).length;
  },
  markRead(id: string) {
    items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    emit();
  },
  markAllRead() {
    items = items.map((n) => ({ ...n, read: true }));
    emit();
  },
};

export function useNotifications() {
  return useSyncExternalStore(notificationsStore.subscribe, () => items, () => items);
}

export function relativeTime(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 30) return "Just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
