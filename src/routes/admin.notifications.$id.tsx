import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader, Card, Pill } from "@/components/AdminLayout";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useNotifications, notificationsStore, iconFor, relativeTime } from "@/lib/notifications-store";

export const Route = createFileRoute("/admin/notifications/$id")({
  component: NotificationDetail,
  head: ({ params }) => ({ meta: [{ title: `Notification ${params.id} — Admin` }] }),
  notFoundComponent: () => (
    <Card>
      <p className="font-display text-2xl">Notification not found</p>
      <p className="mt-2 text-sm text-muted-foreground">It may have been removed or already cleared.</p>
      <Link to="/admin/notifications" className="mt-4 inline-flex text-xs text-gold hover:underline">
        Back to notifications
      </Link>
    </Card>
  ),
  errorComponent: ({ error }) => (
    <Card>
      <p className="font-display text-2xl">Something went wrong</p>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </Card>
  ),
});

function NotificationDetail() {
  const { id } = Route.useParams();
  const items = useNotifications();
  const n = items.find((x) => x.id === id);

  useEffect(() => {
    if (n && !n.read) notificationsStore.markRead(n.id);
  }, [n]);

  if (!n) throw notFound();

  const Icon = iconFor(n.type);

  return (
    <>
      <Link to="/admin/notifications" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-3 w-3" /> All notifications
      </Link>
      <PageHeader title={n.title} description={n.body} />
      <Card>
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-gold">
            <Icon className="h-5 w-5" />
          </span>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="gold">{n.type}</Pill>
              <Pill tone={n.read ? "muted" : "warn"}>{n.read ? "Read" : "Unread"}</Pill>
            </div>
            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Received</dt>
                <dd className="mt-1">{relativeTime(n.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Exact timestamp</dt>
                <dd className="mt-1 tabular-nums">{new Date(n.createdAt).toLocaleString()}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Message</dt>
                <dd className="mt-1 text-muted-foreground">{n.body}</dd>
              </div>
            </dl>
            {n.link && (
              <Link to={n.link} className="inline-flex rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground">
                Open related page
              </Link>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
