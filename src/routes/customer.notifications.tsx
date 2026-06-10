import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications, notificationsStore } from "@/lib/notifications-store";
import { toast } from "sonner";

export const Route = createFileRoute("/customer/notifications")({
  component: NotificationsPage,

});

function NotificationsPage() {
  const { profile } = useAuth();
  const items = useNotifications();

  return (
    <DashboardLayout role="customer" title="Notifications">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Notifications</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground">No notifications.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id} className="border p-2 rounded">
                <p>{n.title}</p>
                <button
                  onClick={() => {
                    if (!n.read) notificationsStore.markRead(n.id);
                    toast.success("Marked as read");
                  }}
                  className="text-sm text-primary underline"
                >
                  Mark as read
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
