import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp, Briefcase, Star, Zap, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/skeleton-loader";

const BASE = import.meta.env.BASE_URL;
const CLEANER_HDR = { "x-user-id": "user-cleaner-1" };

const SERVICE_LABELS: Record<string, string> = {
  standard:        "Standard Clean",
  deep_clean:      "Deep Clean",
  airbnb_turnover: "Airbnb Turnover",
  end_of_tenancy:  "End of Tenancy",
  office:          "Office Clean",
  recurring:       "Recurring",
};

const SERVICE_COLOURS: Record<string, string> = {
  deep_clean:      "bg-primary/15 text-primary",
  standard:        "bg-sky-100 text-sky-700",
  airbnb_turnover: "bg-amber-100 text-amber-700",
  end_of_tenancy:  "bg-purple-100 text-purple-700",
  office:          "bg-slate-100 text-slate-600",
  recurring:       "bg-emerald-100 text-emerald-700",
};

/* ── Custom tooltip ─────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-bold text-primary">£{payload[0]?.value}</p>
      {payload[1] && (
        <p className="text-[10px] text-muted-foreground">{payload[1]?.value} job{payload[1]?.value !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  icon: typeof TrendingUp; accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-4 flex flex-col gap-2",
      accent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
    )}>
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", accent ? "bg-white/20" : "bg-primary/10")}>
        <Icon size={15} className={accent ? "text-white" : "text-primary"} />
      </div>
      <div>
        <p className={cn("text-xl font-bold", accent ? "text-white" : "text-foreground")}>{value}</p>
        <p className={cn("text-[10px] font-medium mt-0.5", accent ? "text-white/70" : "text-muted-foreground")}>{label}</p>
        {sub && <p className={cn("text-[10px] mt-0.5", accent ? "text-white/50" : "text-muted-foreground/70")}>{sub}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════ Page ═══════════════════════ */
export default function CleanerEarnings() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  const { data, isLoading } = useQuery({
    queryKey: ["cleaner-earnings"],
    queryFn: async () => {
      const res = await fetch(`${BASE}api/dashboard/cleaner/earnings`, { headers: CLEANER_HDR });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const chartData: { label: string; earnings: number; jobs: number }[] =
    view === "weekly"
      ? (data?.weekly  || []).map((w: any) => ({ label: w.week,  earnings: w.earnings, jobs: w.jobs }))
      : (data?.monthly || []).map((m: any) => ({ label: m.month, earnings: m.earnings, jobs: m.jobs }));

  const summary = data?.summary || {};
  const recentJobs: any[] = data?.recentJobs || [];

  /* Highlight the tallest bar */
  const maxEarnings = Math.max(0, ...chartData.map((d) => d.earnings));

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
      {/* ── Header ── */}
      <div className="bg-primary text-primary-foreground px-4 pt-14 pb-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setLocation("/cleaner-dashboard")}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Amara Osei</p>
              <h1 className="text-white text-xl font-bold">Earnings</h1>
            </div>
          </div>

          {/* Hero stat */}
          <div className="bg-white/10 rounded-2xl p-5">
            <p className="text-white/60 text-xs font-medium mb-1">This year</p>
            {isLoading ? (
              <div className="h-9 w-32 rounded-xl bg-white/20 animate-pulse" />
            ) : (
              <p className="text-4xl font-bold text-white">£{summary.thisYearEarnings ?? 0}</p>
            )}
            <p className="text-white/50 text-xs mt-1">{summary.totalJobs ?? 0} completed jobs</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-4 flex flex-col gap-5">

        {/* ── Summary stats grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Avg per job"
              value={`£${summary.avgPerJob ?? 0}`}
              icon={Briefcase}
              accent
            />
            <StatCard
              label="Best week"
              value={`£${summary.bestWeek ?? 0}`}
              icon={Zap}
            />
            <StatCard
              label="Avg weekly"
              value={`£${summary.avgWeekly ?? 0}`}
              icon={TrendingUp}
            />
            <StatCard
              label="Total jobs"
              value={String(summary.totalJobs ?? 0)}
              sub="all time"
              icon={Star}
            />
          </div>
        )}

        {/* ── Earnings chart ── */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Earnings breakdown</p>
            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
              {(["weekly", "monthly"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                    view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {v === "weekly" ? "12 weeks" : "6 months"}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="h-52 rounded-xl bg-muted animate-pulse" />
          ) : chartData.every((d) => d.earnings === 0) ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No earnings data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              {view === "weekly" ? (
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `£${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
                  <Bar
                    dataKey="earnings"
                    radius={[6, 6, 0, 0]}
                    fill="hsl(var(--primary))"
                    maxBarSize={32}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `£${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#earningsGrad)"
                    dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Jobs per service type breakdown ── */}
        {!isLoading && recentJobs.length > 0 && (() => {
          const byType: Record<string, { count: number; total: number }> = {};
          recentJobs.forEach((j) => {
            if (!byType[j.serviceType]) byType[j.serviceType] = { count: 0, total: 0 };
            byType[j.serviceType].count++;
            byType[j.serviceType].total += j.totalPrice;
          });
          const total = Object.values(byType).reduce((s, v) => s + v.total, 0);
          return (
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">By service type</p>
              <div className="flex flex-col gap-2">
                {Object.entries(byType)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([type, stats]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        SERVICE_COLOURS[type] || "bg-muted text-muted-foreground"
                      )}>
                        {SERVICE_LABELS[type] || type}
                      </span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${total > 0 ? (stats.total / total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">£{stats.total}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{stats.count}×</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })()}

        {/* ── Recent job list ── */}
        {!isLoading && recentJobs.length > 0 && (
          <div>
            <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Recent jobs</p>
            <div className="flex flex-col gap-2">
              {recentJobs.map((job) => {
                const dateLabel = new Date(job.scheduledAt).toLocaleDateString("en-GB", {
                  weekday: "short", day: "numeric", month: "short",
                });
                return (
                  <button
                    key={job.id}
                    onClick={() => setLocation(`/bookings/${job.id}`)}
                    className="w-full bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {SERVICE_LABELS[job.serviceType] || job.serviceType}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {job.propertyName} · {dateLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-bold text-primary">£{job.totalPrice}</span>
                      <ChevronRight size={13} className="text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
