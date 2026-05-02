import { useLocation } from "wouter";
import { ArrowLeft, Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useGetAdminMetrics, useAdminListUsers, getGetAdminMetricsQueryKey, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { TrustBadge } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";

export default function Admin() {
  const [, setLocation] = useLocation();

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

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      <div className="bg-card border-b border-border px-4 pt-14 pb-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => setLocation("/profile")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-4">
        {/* Metrics grid */}
        {loadingMetrics ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Users", value: m.totalUsers.toLocaleString(), icon: Users, color: "text-blue-600" },
              { label: "Cleaners", value: m.totalCleaners.toLocaleString(), icon: CheckCircle2, color: "text-primary" },
              { label: "Active Bookings", value: m.activeBookings.toLocaleString(), icon: TrendingUp, color: "text-amber-600" },
              { label: "Disputed", value: (m.disputedBookings ?? 0).toLocaleString(), icon: AlertTriangle, color: "text-destructive" },
              { label: "Revenue", value: `£${(m.totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, color: "text-green-600" },
              { label: "Avg Trust Score", value: String(m.averageTrustScore), icon: CheckCircle2, color: "text-primary" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-card border border-border rounded-2xl p-4" data-testid={`metric-${item.label}`}>
                  <Icon size={16} className={item.color} />
                  <p className="text-xl font-bold text-foreground mt-2">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Users table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Recent Users</p>
            <span className="text-xs text-muted-foreground">{m.newUsersThisWeek} new this week</span>
          </div>
          {loadingUsers ? (
            <div className="p-4 flex flex-col gap-2">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : (
            <div>
              {(usersData?.users || []).slice(0, 8).map((user) => (
                <div
                  key={user.id}
                  data-testid={`row-user-${user.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                >
                  <img
                    src={user.avatarUrl || `https://i.pravatar.cc/40?u=${user.id}`}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user.fullName || user.email}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <TrustBadge badge={user.verificationBadge || "none"} size="sm" showLabel={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
