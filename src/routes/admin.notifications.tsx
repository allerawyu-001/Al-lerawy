import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { useNotifications, notificationsStore, iconFor, relativeTime } from "@/lib/notifications-store";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — Admin" }] }),
});

function NotificationsPage() {
  const items = useNotifications();
  const unread = items.filter((n) => !n.read).length;

  // tick to refresh relative times every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything happening on the platform, in real time."
        action={
          <button
            type="button"
            onClick={() => notificationsStore.markAllRead()}
            disabled={unread === 0}
            className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark all read{unread > 0 ? ` (${unread})` : ""}
          </button>
        }
      />
      <Card>
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {items.map((n) => {
              const Icon = iconFor(n.type);
              return (
                <li key={n.id}>
                  <Link
                    to="/admin/notifications/$id"
                    params={{ id: n.id }}
                    onClick={() => notificationsStore.markRead(n.id)}
                    className={`flex items-start gap-4 py-4 transition first:pt-0 last:pb-0 hover:opacity-80 ${
                      n.read ? "" : ""
                    }`}
                  >
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-gold">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="flex items-center gap-2 font-display text-lg">
                        {n.title}
                        {!n.read && <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {relativeTime(n.createdAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
