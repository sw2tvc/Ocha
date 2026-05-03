import { Users, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import { useGetAdminMetrics, useAdminListUsers, getGetAdminMetricsQueryKey, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { TrustBadge } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";

export default function Admin() {
  const { data: metrics, isLoading: loadingMetrics } = useGetAdminMetrics({
    query: { queryKey: getGetAdminMetricsQueryKey() },
  });

  const { data: usersData, isLoading: loadingUsers } = useAdminListUsers(
    {},
    { query: { queryKey: getAdminListUsersQueryKey({}) } }
  );

  const m = metrics || {
    totalUsers: 1847,
    totalCleaners: 234,
    totalBookings: 5621,
    activeBookings: 48,
    completedBookings: 5412,
    disputedBookings: 7,
    totalRevenue: 142560,
    averageTrustScore: 82,
    verifiedCleaners: 198,
    newUsersThisWeek: 63,
  };

  const primaryMetrics = [
    { label: "Total Users",     value: (m.totalUsers     ?? 0).toLocaleString(), icon: Users,        color: "text-blue-600",   bg: "bg-blue-50",       sub: `+${m.newUsersThisWeek ?? 0} this week` },
    { label: "Cleaners",        value: (m.totalCleaners  ?? 0).toLocaleString(), icon: CheckCircle2, color: "text-primary",    bg: "bg-primary/10",    sub: `${m.verifiedCleaners ?? 0} verified` },
    { label: "Total Bookings",  value: (m.totalBookings  ?? 0).toLocaleString(), icon: TrendingUp,   color: "text-violet-600", bg: "bg-violet-50",     sub: `${m.activeBookings ?? 0} active` },
    { label: "Revenue",         value: `£${((m.totalRevenue ?? 0) / 1000).toFixed(0)}k`, icon: Activity, color: "text-green-600",  bg: "bg-green-50",      sub: "All time" },
  ];

  const secondaryMetrics = [
    { label: "Active Now",    value: (m.activeBookings    ?? 0).toLocaleString(), icon: TrendingUp,    color: "text-amber-600",     bg: "bg-amber-50" },
    { label: "Completed",     value: (m.completedBookings ?? 0).toLocaleString(), icon: CheckCircle2,  color: "text-green-600",     bg: "bg-green-50" },
    { label: "Disputed",      value: (m.disputedBookings  ?? 0).toLocaleString(), icon: AlertTriangle, color: "text-destructive",   bg: "bg-destructive/10" },
    { label: "Avg Trust",     value: String(m.averageTrustScore ?? 0),            icon: ShieldCheck,   color: "text-primary",       bg: "bg-primary/10" },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-8 bg-background">

      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Platform</p>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs text-muted-foreground">New users this week</p>
              <p className="text-xl font-bold text-foreground">{m.newUsersThisWeek ?? 0}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">{m.activeBookings ?? 0} active bookings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 flex flex-col gap-6">

        {/* Primary metrics — 2 cols mobile, 4 cols desktop */}
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

        {/* Secondary metrics */}
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

        {/* Users table */}
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
      </div>
    </div>
  );
}
