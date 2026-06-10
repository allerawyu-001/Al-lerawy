import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/custom")({
  component: CustomPage,
  head: () => ({
    meta: [
      { title: "Commission a custom cap — AL-LERAWY.com" },
      { name: "description", content: "Work directly with an independent maker to commission a one-of-one cap." },
    ],
  }),
});

function CustomPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Commission</p>
            <h1 className="mt-2 font-display text-5xl leading-tight md:text-6xl">
              A piece, <span className="italic text-gold-gradient">made for you.</span>
            </h1>
            <p className="mt-6 text-muted-foreground">
              Describe what you have in mind. Upload a reference. A maker will respond within 48 hours with a proof and a quote.
            </p>
            <ul className="mt-10 space-y-4 text-sm">
              {[
                "Independent makers, hand-matched",
                "Free proof — pay only after you approve",
                "Typical lead time: 2–3 weeks",
              ].map((s) => (
                <li key={s} className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-gold" /> {s}
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="rounded-md border border-border bg-secondary/30 p-8"
          >
            {submitted ? (
              <div className="py-16 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-gold" />
                <h2 className="mt-4 font-display text-3xl">Request received</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  A maker will be in touch within 48 hours.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <Field label="Project title">
                  <input className={inputCls} placeholder="A heritage wool fitted with monogram" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Style">
                    <select className={inputCls} defaultValue="Kindai">
                      <option>Kindai</option>
                      <option>Bama</option>
                      <option>Bangwal</option>
                      <option>Yerwa</option>
                    </select>
                  </Field>
                  <Field label="Budget">
                    <select className={inputCls}>
                      <option>$50 – $100</option>
                      <option>$100 – $200</option>
                      <option>$200 +</option>
                    </select>
                  </Field>
                </div>
                <Field label="Describe your idea">
                  <textarea rows={5} className={inputCls} placeholder="Material, color, embroidery, anything that matters..." />
                </Field>
                <Field label="Reference image">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background/40 px-4 py-8 text-sm text-muted-foreground hover:border-gold/50">
                    <Upload className="h-4 w-4" />
                    Upload an image (optional)
                    <input type="file" className="hidden" />
                  </label>
                </Field>
                <button className="mt-2 w-full rounded-full bg-foreground py-3 text-sm font-medium text-background hover:bg-gold">
                  Submit request
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-gold/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
