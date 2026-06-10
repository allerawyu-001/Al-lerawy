import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Toolbar, SearchInput, Pill } from "@/components/AdminLayout";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRequests, requestsStore, type CustomRequest, type RequestStatus } from "@/lib/requests-store";
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

export const Route = createFileRoute("/admin/requests")({
  component: RequestsPage,
  head: () => ({ meta: [{ title: "Custom Requests — Admin" }] }),
});

const STATUS_TONE: Record<RequestStatus, "gold" | "warn" | "danger" | "muted" | "default"> = {
  Matched: "gold",
  Approved: "gold",
  "In review": "warn",
  Quoted: "warn",
  Rejected: "danger",
};

function RequestsPage() {
  const all = useRequests();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ req: CustomRequest; action: "approve" | "reject" } | null>(null);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((r) =>
      `${r.id} ${r.customer} ${r.brief}`.toLowerCase().includes(q)
    );
  }, [all, search]);

  const confirm = () => {
    if (!pending) return;
    const { req, action } = pending;
    if (action === "approve") {
      requestsStore.approve(req.id);
      toast.success(`Approved ${req.id} — ${req.customer}`);
    } else {
      requestsStore.reject(req.id);
      toast.success(`Rejected ${req.id} — ${req.customer}`);
    }
    setPending(null);
  };

  return (
    <>
      <PageHeader title="Custom requests" description="Bespoke commissions waiting for studio matches." />
      <Card>
        <Toolbar>
          <SearchInput placeholder="Search by ID, customer, or brief" value={search} onChange={setSearch} />
        </Toolbar>
        {list.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No requests match your search.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => {
              const isResolved = r.status === "Approved" || r.status === "Rejected";
              return (
                <li key={r.id} className="rounded-md border border-border/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gold">{r.id} · {r.customer}</p>
                      <p className="mt-1 font-display text-lg">{r.brief}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Budget {r.budget}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill>
                      <button
                        type="button"
                        onClick={() => setPending({ req: r, action: "approve" })}
                        disabled={isResolved}
                        aria-label={`Approve ${r.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending({ req: r, action: "reject" })}
                        disabled={isResolved}
                        aria-label={`Reject ${r.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/60 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AlertDialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.action === "approve" ? "Approve" : "Reject"} request {pending?.req.id}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.action === "approve"
                ? `Mark "${pending?.req.brief}" as approved. The customer and matched studio will be notified.`
                : `Reject "${pending?.req.brief}". This will close the request.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirm();
              }}
              className={
                pending?.action === "approve"
                  ? ""
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
