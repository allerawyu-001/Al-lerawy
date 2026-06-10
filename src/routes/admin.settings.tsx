import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputCls = "h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-gold/60";

function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Brand, payments, email and notification preferences."
        action={
          <button className="rounded-full bg-gold px-5 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground">
            Save changes
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Brand</h2>
          <div className="mt-5 space-y-4">
            <Field label="Site name"><input className={inputCls} defaultValue="AL-LERAWY.com" /></Field>
            <Field label="Tagline"><input className={inputCls} defaultValue="A multi-vendor cap marketplace." /></Field>
            <Field label="Logo">
              <div className="flex items-center gap-3">
                <span className="h-12 w-12 rounded-md gold-gradient" />
                <button className="rounded-md border border-border px-3 py-2 text-xs">Upload</button>
              </div>
            </Field>
            <Field label="Theme accent">
              <div className="flex gap-2">
                {["#E8C26F", "#F5D17A", "#C99E3F", "#FFFFFF"].map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full border border-border" style={{ background: c }} />
                ))}
              </div>
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl">Payments</h2>
          <div className="mt-5 space-y-4">
            <Field label="Provider">
              <select className={inputCls}>
                <option>Stripe</option><option>PayPal</option><option>Adyen</option>
              </select>
            </Field>
            <Field label="Commission %"><input className={inputCls} defaultValue="13.4" /></Field>
            <Field label="Payout cadence">
              <select className={inputCls}>
                <option>Weekly</option><option>Bi-weekly</option><option>Monthly</option>
              </select>
            </Field>
            <Field label="Currency">
              <select className={inputCls}>
                <option>USD</option><option>EUR</option><option>GBP</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl">Email</h2>
          <div className="mt-5 space-y-4">
            <Field label="From name"><input className={inputCls} defaultValue="AL-LERAWY.com" /></Field>
            <Field label="From address"><input className={inputCls} defaultValue="hello@al-lerawy.com" /></Field>
            <Field label="SMTP host"><input className={inputCls} defaultValue="smtp.resend.com" /></Field>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl">Notifications</h2>
          <div className="mt-5 space-y-3">
            {[
              "New orders",
              "Producer applications",
              "Refund requests",
              "Flagged reviews",
              "Weekly digest",
            ].map((n) => (
              <label key={n} className="flex items-center justify-between rounded-md border border-border/60 px-4 py-3">
                <span className="text-sm">{n}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--gold)]" />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
