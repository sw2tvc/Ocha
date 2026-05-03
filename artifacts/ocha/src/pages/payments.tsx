import { useState } from "react";
import { CreditCard, Download, Shield, Clock, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";

/* ── Mock data ──────────────────────────────────── */
type TxnStatus = "upcoming" | "completed" | "refunded" | "failed";

const MOCK_TRANSACTIONS: {
  id: string;
  bookingId: string;
  amount: number;
  status: TxnStatus;
  scheduledAt: string;
  cleaner: { name: string; id: string };
  property: string;
  service: string;
  protected: boolean;
  invoiceRef: string;
}[] = [
  {
    id: "txn-1", bookingId: "booking-1", amount: 66, status: "upcoming",
    scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    cleaner: { name: "Amara Osei", id: "cleaner-1" },
    property: "Shoreditch Studio", service: "Airbnb Turnover",
    protected: true, invoiceRef: "INV-2024-0041",
  },
  {
    id: "txn-2", bookingId: "booking-2", amount: 80, status: "completed",
    scheduledAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    cleaner: { name: "James Adeyemi", id: "cleaner-2" },
    property: "Canary Wharf Apartment", service: "Standard Clean",
    protected: true, invoiceRef: "INV-2024-0038",
  },
  {
    id: "txn-3", bookingId: "booking-3", amount: 72, status: "completed",
    scheduledAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    cleaner: { name: "Amara Osei", id: "cleaner-1" },
    property: "Shoreditch Studio", service: "Deep Clean",
    protected: true, invoiceRef: "INV-2024-0031",
  },
  {
    id: "txn-4", bookingId: "booking-4", amount: 88, status: "refunded",
    scheduledAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    cleaner: { name: "Nadia Kowalski", id: "cleaner-3" },
    property: "Canary Wharf Apartment", service: "End of Tenancy",
    protected: true, invoiceRef: "INV-2024-0022",
  },
  {
    id: "txn-5", bookingId: "booking-5", amount: 44, status: "completed",
    scheduledAt: new Date(Date.now() - 49 * 86400000).toISOString(),
    cleaner: { name: "Marcus Thompson", id: "cleaner-4" },
    property: "Shoreditch Studio", service: "Standard Clean",
    protected: true, invoiceRef: "INV-2024-0015",
  },
];

const MOCK_CARDS = [
  { id: "card-1", type: "Visa",       last4: "4242", expiry: "09/27", isDefault: true  },
  { id: "card-2", type: "Mastercard", last4: "8821", expiry: "03/26", isDefault: false },
];

/* ── Status pill ──────────────────────────────── */
function TxnStatusPill({ status }: { status: TxnStatus }) {
  const map: Record<TxnStatus, { label: string; cls: string }> = {
    upcoming:  { label: "Scheduled", cls: "bg-blue-50 text-blue-600"         },
    completed: { label: "Paid",      cls: "bg-green-50 text-green-700"       },
    refunded:  { label: "Refunded",  cls: "bg-amber-50 text-amber-700"       },
    failed:    { label: "Failed",    cls: "bg-red-50 text-destructive"       },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

const MOBILE_TABS = ["upcoming", "history", "receipts"] as const;
type MobileTab = typeof MOBILE_TABS[number];

/* ════════════════════════════════════ PAGE ════════════════════════════════════ */
export default function Payments() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("upcoming");

  const upcoming  = MOCK_TRANSACTIONS.filter((t) => t.status === "upcoming");
  const history   = MOCK_TRANSACTIONS.filter((t) => t.status !== "upcoming");
  const completed = history.filter((t) => t.status === "completed");

  const totalSpend = completed.reduce((a, t) => a + t.amount, 0);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-8 bg-background">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-4 md:px-6 pt-14 md:pt-8 pb-0 sticky top-0 z-10">
        <div className="max-w-md mx-auto md:max-w-none">
          <h1 className="text-lg font-bold text-foreground mb-3">Billing & Payments</h1>
          {/* Mobile tabs */}
          <div className="md:hidden flex">
            {MOBILE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 capitalize transition-colors ${
                  mobileTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ MOBILE ══════════════════════════════════ */}
      <div className="md:hidden max-w-md mx-auto w-full px-4 pt-4 flex flex-col gap-3">

        {mobileTab === "upcoming" && (
          upcoming.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming charges</p>
            </div>
          ) : upcoming.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.cleaner.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.property} · {t.service}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmt(t.scheduledAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <p className="text-sm font-bold text-foreground">£{t.amount}</p>
                  <TxnStatusPill status={t.status} />
                </div>
              </div>
              {t.protected && (
                <div className="flex items-center gap-1.5 pt-2 mt-1 border-t border-border">
                  <Shield size={11} className="text-primary" />
                  <p className="text-[10px] text-primary font-medium">
                    Payment protected · released after completion
                  </p>
                </div>
              )}
            </div>
          ))
        )}

        {mobileTab === "history" && history.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t.cleaner.name}</p>
              <p className="text-xs text-muted-foreground truncate">{t.property}</p>
              <p className="text-xs text-muted-foreground">{fmt(t.scheduledAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
              <p className="text-sm font-bold text-foreground">£{t.amount}</p>
              <TxnStatusPill status={t.status} />
            </div>
          </div>
        ))}

        {mobileTab === "receipts" && (
          completed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No receipts yet</p>
          ) : completed.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{t.invoiceRef}</p>
                <p className="text-xs text-muted-foreground">{t.service} · {fmt(t.scheduledAt)}</p>
              </div>
              <button className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-full">
                <Download size={11} /> PDF
              </button>
            </div>
          ))
        )}
      </div>

      {/* ══════════ DESKTOP ═════════════════════════════════ */}
      <div className="hidden md:flex gap-6 px-6 py-6 items-start">

        {/* LEFT: summary + payment methods + receipts */}
        <aside className="w-[260px] shrink-0 sticky top-6 self-start flex flex-col gap-4">

          {/* Financial summary */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Total Spent
            </p>
            <p className="text-3xl font-black text-foreground">£{totalSpend}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completed.length} completed booking{completed.length !== 1 ? "s" : ""}
            </p>

            {upcoming.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Next Charge
                </p>
                <p className="text-xl font-bold text-foreground">£{upcoming[0].amount}</p>
                <p className="text-xs text-muted-foreground">{upcoming[0].cleaner.name}</p>
                <p className="text-xs text-muted-foreground">{fmt(upcoming[0].scheduledAt)}</p>
              </div>
            )}
          </div>

          {/* Payment protection callout */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-primary" />
              <p className="text-xs font-bold text-primary">Booking Protection Active</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Payments are held in escrow and only released after you confirm the service was
              completed to your satisfaction.
            </p>
          </div>

          {/* Payment methods */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Payment Methods
            </p>
            <div className="flex flex-col gap-2.5">
              {MOCK_CARDS.map((card) => (
                <div key={card.id} className="flex items-center gap-2.5">
                  <div className="w-9 h-6 bg-muted rounded-md flex items-center justify-center shrink-0">
                    <CreditCard size={12} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {card.type} ···· {card.last4}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                  {card.isDefault && (
                    <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              + Add card
            </button>
          </div>

          {/* Receipts list */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Receipts
            </p>
            <div className="flex flex-col gap-2">
              {completed.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.invoiceRef}</p>
                    <p className="text-[10px] text-muted-foreground">{fmt(t.scheduledAt)}</p>
                  </div>
                  <button className="flex items-center gap-0.5 text-[10px] text-primary font-semibold shrink-0 hover:underline">
                    <Download size={10} /> PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTRE + RIGHT: transaction table */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Upcoming charges */}
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">
                Upcoming Charges
              </p>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {upcoming.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-4 px-6 py-4 ${
                      i < upcoming.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Clock size={15} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t.cleaner.name}</p>
                      <p className="text-xs text-muted-foreground">{t.property} · {t.service}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground shrink-0">£{t.amount}</p>
                    <p className="text-xs text-muted-foreground shrink-0 hidden lg:block">{fmt(t.scheduledAt)}</p>
                    <TxnStatusPill status={t.status} />
                    {t.protected && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Shield size={12} className="text-primary" />
                        <span className="text-[10px] text-primary font-medium hidden xl:block">Protected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment history */}
          <div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">
              Payment History
            </p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Service</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Cleaner</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Property</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground">{t.service}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground">{t.cleaner.name}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground">{t.property}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-muted-foreground">{fmt(t.scheduledAt)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-foreground">£{t.amount}</p>
                      </td>
                      <td className="px-6 py-4">
                        <TxnStatusPill status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-right hidden xl:table-cell">
                        {t.status === "completed" && (
                          <button className="flex items-center gap-1 text-xs text-primary font-semibold ml-auto hover:underline">
                            <Download size={11} /> PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust callout */}
          <div className="bg-muted/50 border border-border rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                All payments are fully protected
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ocha holds your payment in escrow until the cleaning is complete. If the service
                is unsatisfactory, you can raise a dispute and receive a full refund within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
