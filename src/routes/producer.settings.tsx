import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/producer/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile } = useAuth();
  return (
    <DashboardLayout role="producer" title="Settings">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Producer Settings</h2>
        <p className="text-muted-foreground">Here you can configure your account preferences.</p>
        {/* Add actual settings UI as needed */}
      </div>
    </DashboardLayout>
  );
}
