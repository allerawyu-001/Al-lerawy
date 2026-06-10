import { useSyncExternalStore } from "react";

export type UserRole = "Customer" | "Producer" | "Admin";
export type UserStatus = "Active" | "Suspended" | "Pending";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  avatar: string;
  joined: string; // ISO
  lastLogin: string; // ISO
  suspendReason?: string;
  suspendedAt?: string;
  orders?: { id: string; date: string; total: number; status: string }[];
  products?: { id: string; title: string; price: number; status: string }[];
  requests?: { id: string; title: string; status: string; date: string }[];
  activity?: { date: string; event: string }[];
};

const palette = ["#c9a84c", "#1a1a1a", "#6b3a2a", "#4a6741", "#0c2340", "#574b90"];
const avatarFor = (name: string) => {
  const c = palette[name.charCodeAt(0) % palette.length].slice(1);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${c}&color=fff&bold=true`;
};

const now = Date.now();
const days = (n: number) => new Date(now - n * 86400000).toISOString();

const seed: User[] = [
  {
    id: "u_001",
    name: "Iris Laurent",
    email: "iris@studio.com",
    phone: "+33 6 12 45 78 90",
    role: "Customer",
    status: "Active",
    verified: true,
    avatar: avatarFor("Iris Laurent"),
    joined: days(420),
    lastLogin: days(1),
    orders: [
      { id: "ORD-1041", date: days(8), total: 168, status: "Delivered" },
      { id: "ORD-1112", date: days(2), total: 92, status: "Shipped" },
    ],
    activity: [
      { date: days(1), event: "Logged in from Paris" },
      { date: days(2), event: "Placed order ORD-1112" },
      { date: days(8), event: "Placed order ORD-1041" },
    ],
  },
  {
    id: "u_002",
    name: "Atelier Noir",
    email: "hi@ateliernoir.co",
    phone: "+33 6 22 11 09 87",
    role: "Producer",
    status: "Active",
    verified: true,
    avatar: avatarFor("Atelier Noir"),
    joined: days(540),
    lastLogin: days(0),
    products: [
      { id: "p_n1", title: "Onyx 6-Panel", price: 120, status: "Live" },
      { id: "p_n2", title: "Gilded Strapback", price: 145, status: "Live" },
      { id: "p_n3", title: "Velvet Dome", price: 98, status: "Draft" },
    ],
    activity: [
      { date: days(0), event: "Updated inventory" },
      { date: days(3), event: "Shipped 4 orders" },
    ],
  },
  {
    id: "u_003",
    name: "Marc Devereux",
    email: "marc@dvrx.com",
    phone: "+1 415 882 4407",
    role: "Customer",
    status: "Active",
    verified: false,
    avatar: avatarFor("Marc Devereux"),
    joined: days(210),
    lastLogin: days(5),
    orders: [{ id: "ORD-0992", date: days(14), total: 220, status: "Delivered" }],
    requests: [{ id: "REQ-018", title: "Monogram trucker", status: "In review", date: days(4) }],
  },
  {
    id: "u_004",
    name: "Maison Doré",
    email: "studio@maisondore.fr",
    phone: "+33 1 44 88 02 15",
    role: "Producer",
    status: "Pending",
    verified: false,
    avatar: avatarFor("Maison Doré"),
    joined: days(60),
    lastLogin: days(10),
    products: [],
    activity: [{ date: days(60), event: "Submitted producer application" }],
  },
  {
    id: "u_005",
    name: "Sora Kimura",
    email: "sora.k@gmail.com",
    phone: "+81 90 1234 5678",
    role: "Customer",
    status: "Suspended",
    verified: true,
    avatar: avatarFor("Sora Kimura"),
    joined: days(310),
    lastLogin: days(45),
    activity: [{ date: days(45), event: "Account suspended — chargeback dispute" }],
  },
  {
    id: "u_006",
    name: "Northfield Co.",
    email: "team@northfield.co",
    phone: "+1 312 555 0144",
    role: "Producer",
    status: "Active",
    verified: true,
    avatar: avatarFor("Northfield Co."),
    joined: days(720),
    lastLogin: days(2),
    products: [{ id: "p_nf1", title: "Heritage Wool 5-Panel", price: 88, status: "Live" }],
  },
  {
    id: "u_007",
    name: "Lena Ortiz",
    email: "lena@ortiz.io",
    phone: "+34 612 778 901",
    role: "Customer",
    status: "Active",
    verified: true,
    avatar: avatarFor("Lena Ortiz"),
    joined: days(160),
    lastLogin: days(0),
  },
  {
    id: "u_008",
    name: "AL-LERAWY Admin",
    email: "admin@al-lerawy.com",
    phone: "+1 415 000 0001",
    role: "Admin",
    status: "Active",
    verified: true,
    avatar: avatarFor("AL-LERAWY Admin"),
    joined: days(900),
    lastLogin: days(0),
  },
];

let users: User[] = [...seed];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const usersStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getAll() {
    return users;
  },
  get(id: string) {
    return users.find((u) => u.id === id);
  },
  create(input: Omit<User, "id" | "joined" | "lastLogin" | "avatar"> & { avatar?: string }) {
    const u: User = {
      ...input,
      id: `u_${Math.random().toString(36).slice(2, 8)}`,
      avatar: input.avatar || avatarFor(input.name || "User"),
      joined: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users = [u, ...users];
    emit();
    return u;
  },
  update(id: string, patch: Partial<User>) {
    users = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    emit();
  },
  remove(id: string) {
    users = users.filter((u) => u.id !== id);
    emit();
  },
  suspend(id: string, reason?: string) {
    const at = new Date().toISOString();
    const u = users.find((x) => x.id === id);
    const activity = [
      { date: at, event: `Account suspended${reason ? ` — ${reason}` : ""}` },
      ...(u?.activity ?? []),
    ];
    this.update(id, { status: "Suspended", suspendReason: reason, suspendedAt: at, activity });
  },
  activate(id: string) {
    const at = new Date().toISOString();
    const u = users.find((x) => x.id === id);
    const activity = [{ date: at, event: "Account reactivated" }, ...(u?.activity ?? [])];
    this.update(id, { status: "Active", suspendReason: undefined, suspendedAt: undefined, activity });
  },
};

export function useUsers() {
  return useSyncExternalStore(
    usersStore.subscribe,
    () => users,
    () => users,
  );
}

export function useUser(id: string) {
  useUsers();
  return usersStore.get(id);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
