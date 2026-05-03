import { useState } from "react";
import { useSearch } from "wouter";
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, Activity,
  Shield, AlertOctagon, Clock, XCircle, Eye, Ban, RefreshCw,
} from "lucide-react";
import {
  useGetAdminMetrics, useAdminListUsers,
  getGetAdminMetricsQueryKey, getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { TrustBadge } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";

/* ── Mock operational data ────────────────────── */
const MOCK_VERIFICATIONS = [
  { id: "pv-1", name: "Sophie Chen",    email: "sophie@example.com",   appliedAt: new Date(Date.now() - 2 * 86400000).toISOString(), docs: ["ID", "Address", "DBS"], trustScore: 72, status: "pending"  },
  { id: "pv-2", name: "Leon Adebayo",   email: "leon@example.com",     appliedAt: new Date(Date.now() - 4 * 86400000).toISOString(), docs: ["ID", "Address"],        trustScore: 65, status: "pending"  },
  { id: "pv-3", name: "Priya Sharma",   email: "priya@example.com",    appliedAt: new Date(Date.now() - 6 * 86400000).toISOString(), docs: ["ID"],                   trustScore: 58, status: "incomplete"},
  { id: "pv-4", name: "Daniel Okoye",   email: "daniel@example.com",   appliedAt: new Date(Date.now() - 8 * 86400000).toISOString(), docs: ["ID", "Address", "DBS"], trustScore: 80, status: "pending"  },
];

const MOCK_DISPUTES = [
  { id: "disp-1", bookingId: "BK-0041", customer: "Sarah Mitchell", cleaner: "Amara Osei",      amount: 66, reason: "Incomplete cleaning",   status: "investigating", openedHoursAgo: 6  },
  { id: "disp-2", bookingId: "BK-0037", customer: "Tom Harrington",  cleaner: "Marcus Thompson", amount: 80, reason: "Cleaner no-show",       status: "escalated",     openedHoursAgo: 28 },
  { id: "disp-3", bookingId: "BK-0029", customer: "Mei Tanaka",      cleaner: "James Adeyemi",   amount: 44, reason: "Damaged property",      status: "resolved",      openedHoursAgo: 72 },
  { id: "disp-4", bookingId: "BK-0025", customer: "Olga Petrov",     cleaner: "Nadia Kowalski",  amount: 96, reason: "Unsatisfactory quality", status: "investigating", openedHoursAgo: 14 },
];

const MOCK_RISK = [
  { id: "risk-1", name: "John Byrne",    email: "jbyrne@anon.com",   riskType: "Multiple cancellations",  severity: "high",   flaggedAt: new Date(Date.now() - 1 * 86400000).toISOString(), detail: "6 cancellations in 14 days — potential booking abuse"    },
  { id: "risk-2", name: "Anna Reyes",    email: "anna.r@temp.io",    riskType: "Unusual payment pattern",  severity: "medium", flaggedAt: new Date(Date.now() - 3 * 86400000).toISOString(), detail: "3 different payment cards used in 48h, all declined once" },
  { id: "risk-3", name: "Karl Müller",   email: "karl@domain.de",    riskType: "Review manipulation",      severity: "high",   flaggedAt: new Date(Date.now() - 5 * 86400000).toISOString(), detail: "Self-review pattern detected across 4 bookings"           },
  { id: "risk-4", name: "User-8827",     email: "anon8827@temp.net", riskType: "Identity mismatch",        severity: "low",    flaggedAt: new Date(Date.now() - 7 * 86400000).toISOString(), detail: "Profile photo does not match ID document submitted"       },
];

type AdminTab = "overview" | "verification" | "disputes" | "risk";

const ADMIN_TABS: { id: AdminTab; label: string; icon: typeof Shield }[] = [
  { id: "overview",      label: "Overview",      icon: Activity   },
  { id: "verification",  label: "Verification",  icon: CheckCircle2 },
  { id: "disputes",      label: "Disputes",      icon: AlertTriangle },
  { id: "risk",          label: "Risk & Fraud",  icon: AlertOctagon  },
];

/* ── Dispute status pill ──────────────────────── */
function DisputeStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    investigating: "bg-amber-50 text-amber-700",
    escalated:     "bg-red-50 text-destructive",
    resolved:      "bg-green-50 text-green-700",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

/* ── Risk severity pill ───────────────────────── */
function SeverityPill({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    high:   "bg-red-50 text-destructive",
    medium: "bg-amber-50 text-amber-700",
    low:    "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${map[severity] || "bg-muted text-muted-foreground"}`}>
      {severity}
    </span>
  );
}

/* ════════════════════════════════════ PAGE ════════════════════════════════════ */
export default function Admin() {
  const searchStr = useSearch();
  const initTab = (new URLSearchParams(searchStr).get("tab") as AdminTab) || "overview";
  const [activeTab, setActiveTab] = useState<AdminTab>(initTab);

  const { data: metrics, isLoading: loadingMetrics } = useGetAdminMetrics({
    query: { queryKey: getGetAdminMetricsQueryKey() },
  });

  const { data: usersData, isLoading: loadingUsers } = useAdminListUsers(
    {},
    { query: { queryKey: getAdminListUsersQueryKey({}) } }
  );

  const m = metrics || {
    totalUsers: 1847, totalCleaners: 234, totalBookings: 5621, activeBookings: 48,
    completedBookings: 5412, disputedBookings: 7, totalRevenue: 142560,
    averageTrustScore: 82, verifiedCleaners: 198, newUsersThisWeek: 63,
  };

  const primaryMetrics = [
    { label: "Total Users",    value: (m.totalUsers     ?? 0).toLocaleString(), icon: Users,        color: "text-blue-600",   bg: "bg-blue-50",    sub: `+${m.newUsersThisWeek ?? 0} this week`   },
    { label: "Cleaners",       value: (m.totalCleaners  ?? 0).toLocaleString(), icon: CheckCircle2, color: "text-primary",    bg: "bg-primary/10", sub: `${m.verifiedCleaners ?? 0} verified`     },
    { label: "Total Bookings", value: (m.totalBookings  ?? 0).toLocaleString(), icon: TrendingUp,   color: "text-violet-600", bg: "bg-violet-50",  sub: `${m.activeBookings ?? 0} active`         },
    { label: "Revenue",        value: `£${((m.totalRevenue ?? 0) / 1000).toFixed(0)}k`, icon: Activity, color: "text-green-600", bg: "bg-green-50",  sub: "All time" },
  ];

  const secondaryMetrics = [
    { label: "Active Now",  value: (m.activeBookings    ?? 0).toLocaleString(), icon: TrendingUp,    color: "text-amber-600",   bg: "bg-amber-50"       },
    { label: "Completed",   value: (m.completedBookings ?? 0).toLocaleString(), icon: CheckCircle2,  color: "text-green-600",   bg: "bg-green-50"       },
    { label: "Disputed",    value: (m.disputedBookings  ?? 0).toLocaleString(), icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Avg Trust",   value: String(m.averageTrustScore ?? 0),            icon: ShieldCheck,   color: "text-primary",     bg: "bg-primary/10"     },
  ];

  const fmtAgo = (h: number) =>
    h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-8 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Platform</p>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">New users this week</p>
              <p className="text-xl font-bold text-foreground">{m.newUsersThisWeek ?? 0}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">{m.activeBookings ?? 0} active bookings</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const badge = tab.id === "disputes" ? MOCK_DISPUTES.filter(d => d.status !== "resolved").length
                        : tab.id === "verification" ? MOCK_VERIFICATIONS.filter(v => v.status === "pending").length
                        : tab.id === "risk" ? MOCK_RISK.filter(r => r.severity === "high").length
                        : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {badge > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pt-6 pb-8 flex flex-col gap-6">

        {/* ══ OVERVIEW ══════════════════════════════════════ */}
        {activeTab === "overview" && (
          <>
            {loadingMetrics ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {primaryMetrics.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-card border border-border rounded-2xl p-5" data-testid={`metric-${item.label}`}>
                      <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                        <Icon size={16} className={item.color} />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                      {item.sub && <p className="text-[10px] text-muted-foreground mt-1 opacity-70">{item.sub}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {!loadingMetrics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {secondaryMetrics.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3" data-testid={`metric-${item.label}`}>
                      <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={14} className={item.color} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">{item.value}</p>
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Recent Users</p>
                <span className="text-xs text-muted-foreground">
                  {(usersData?.users ?? []).length} shown
                </span>
              </div>
              {loadingUsers ? (
                <div className="p-6 flex flex-col gap-3">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">User</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Trust</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usersData?.users ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (usersData?.users ?? []).map((user) => (
                      <tr
                        key={user.id}
                        data-testid={`row-user-${user.id}`}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatarUrl || `https://i.pravatar.cc/40?u=${user.id}`}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{user.fullName || user.email}</p>
                              <p className="text-[10px] text-muted-foreground md:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium capitalize px-2 py-1 bg-muted rounded-full">{user.role}</span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <TrustBadge badge={user.verificationBadge || "none"} size="sm" showLabel />
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${user.isAvailable ? "bg-green-400" : "bg-muted"}`} />
                            <span className="text-xs text-muted-foreground">{user.isAvailable ? "Active" : "Inactive"}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ══ VERIFICATION ══════════════════════════════════ */}
        {activeTab === "verification" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Pending review",    value: MOCK_VERIFICATIONS.filter(v => v.status === "pending").length,    color: "text-amber-600",   bg: "bg-amber-50",   icon: Clock       },
                { label: "Incomplete docs",   value: MOCK_VERIFICATIONS.filter(v => v.status === "incomplete").length, color: "text-destructive", bg: "bg-red-50",     icon: AlertTriangle },
                { label: "Approved this week",value: 12,                                                                color: "text-green-600",   bg: "bg-green-50",   icon: CheckCircle2 },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                      <Icon size={16} className={s.color} />
                    </div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="text-sm font-bold text-foreground">Verification Queue</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cleaner applications awaiting identity and document review
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Applicant</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Applied</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Documents</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_VERIFICATIONS.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://i.pravatar.cc/40?u=${v.id}`}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{v.name}</p>
                            <p className="text-xs text-muted-foreground">{v.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {new Date(v.appliedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {v.docs.map((d) => (
                            <span key={d} className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          v.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-destructive"
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1.5 rounded-lg hover:bg-primary/15 transition-colors">
                            <Eye size={11} /> Review
                          </button>
                          <button className="flex items-center gap-1 text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                            <CheckCircle2 size={11} /> Approve
                          </button>
                          <button className="flex items-center gap-1 text-xs text-destructive font-semibold bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                            <XCircle size={11} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ DISPUTES ══════════════════════════════════════ */}
        {activeTab === "disputes" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Under investigation", value: MOCK_DISPUTES.filter(d => d.status === "investigating").length, color: "text-amber-600", bg: "bg-amber-50",   icon: AlertTriangle },
                { label: "Escalated",            value: MOCK_DISPUTES.filter(d => d.status === "escalated").length,    color: "text-destructive", bg: "bg-red-50",  icon: AlertOctagon  },
                { label: "Resolved this week",   value: MOCK_DISPUTES.filter(d => d.status === "resolved").length,     color: "text-green-600",   bg: "bg-green-50", icon: CheckCircle2 },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                      <Icon size={16} className={s.color} />
                    </div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="text-sm font-bold text-foreground">Active Disputes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Booking disputes requiring investigation or mediation
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Booking</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Reason</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Parties</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Opened</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DISPUTES.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-foreground font-mono">{d.bookingId}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-foreground">{d.reason}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground">{d.customer}</p>
                        <p className="text-xs text-muted-foreground">vs {d.cleaner}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-foreground">£{d.amount}</p>
                      </td>
                      <td className="px-6 py-4">
                        <DisputeStatusPill status={d.status} />
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <p className="text-xs text-muted-foreground">{fmtAgo(d.openedHoursAgo)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1.5 rounded-lg hover:bg-primary/15 transition-colors">
                            Investigate
                          </button>
                          {d.status !== "resolved" && (
                            <button className="text-xs text-green-700 font-semibold bg-green-50 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ RISK & FRAUD ══════════════════════════════════ */}
        {activeTab === "risk" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "High severity",  value: MOCK_RISK.filter(r => r.severity === "high").length,   color: "text-destructive", bg: "bg-red-50",     icon: AlertOctagon  },
                { label: "Medium severity",value: MOCK_RISK.filter(r => r.severity === "medium").length, color: "text-amber-600",   bg: "bg-amber-50",   icon: AlertTriangle },
                { label: "Low / watching", value: MOCK_RISK.filter(r => r.severity === "low").length,    color: "text-muted-foreground", bg: "bg-muted",  icon: Shield        },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                      <Icon size={16} className={s.color} />
                    </div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="text-sm font-bold text-foreground">Flagged Accounts</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Accounts with suspicious activity patterns requiring review
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Account</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Risk Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Detail</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground">Severity</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Flagged</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RISK.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-foreground">{r.riskType}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground max-w-xs">{r.detail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <SeverityPill severity={r.severity} />
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.flaggedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1.5 rounded-lg hover:bg-primary/15 transition-colors">
                            <Eye size={11} /> Review
                          </button>
                          <button className="flex items-center gap-1 text-xs text-destructive font-semibold bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors hidden md:flex">
                            <Ban size={11} /> Suspend
                          </button>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground font-semibold bg-muted px-2.5 py-1.5 rounded-lg hover:bg-muted/80 transition-colors hidden lg:flex">
                            <RefreshCw size={11} /> Clear
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
