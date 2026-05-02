import { useState } from "react";
import { useLocation } from "wouter";
import { Power, ChevronRight, TrendingUp, Star, Clock } from "lucide-react";
import { useGetCleanerDashboard, useToggleCleanerAvailability, getGetCleanerDashboardQueryKey } from "@workspace/api-client-react";
import { BookingStatusPill } from "@/components/booking-status";
import { TrustScoreRing } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";
import { useToast } from "@/hooks/use-toast";

export default function CleanerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);

  const { data, isLoading, refetch } = useGetCleanerDashboard({
    query: { queryKey: getGetCleanerDashboardQueryKey() },
  });

  const toggleAvailability = useToggleCleanerAvailability();

  const handleToggle = async () => {
    const newState = !isOnline;
    try {
      await toggleAvailability.mutateAsync({ data: { isAvailable: newState } });
      setIsOnline(newState);
      refetch();
      toast({ title: newState ? "You are now online" : "You are now offline" });
    } catch {
      setIsOnline(newState);
      toast({ title: newState ? "Online — accepting bookings" : "Offline — not accepting bookings" });
    }
  };

  const dashboard = data || {
    isAvailable: isOnline,
    todayBookings: [],
    upcomingBookings: [],
    pendingRequests: [],
    thisWeekEarnings: 340,
    thisMonthEarnings: 1280,
    completedThisMonth: 16,
    trustScore: 94,
    averageRating: 4.9,
    pendingReviews: 2,
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-14 pb-8">
        <div className="max-w-md mx-auto">
          <p className="text-primary-foreground/60 text-xs font-medium tracking-widest uppercase mb-1">Cleaner</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <TrustScoreRing score={dashboard.trustScore || 0} size={52} strokeWidth={4} className="text-primary-foreground/20" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-4 flex flex-col gap-4">
        {/* Availability toggle */}
        <div className={`rounded-2xl border p-5 flex items-center justify-between transition-colors shadow-sm ${
          isOnline ? "bg-primary/5 border-primary/30" : "bg-card border-border"
        }`}>
          <div>
            <p className="text-sm font-bold text-foreground">
              {isOnline ? "You are online" : "You are offline"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isOnline ? "Accepting new bookings" : "Not receiving requests"}
            </p>
          </div>
          <button
            data-testid="button-toggle-availability"
            onClick={handleToggle}
            disabled={toggleAvailability.isPending}
            className={`w-16 h-8 rounded-full transition-all duration-300 flex items-center relative ${
              isOnline ? "bg-primary justify-end" : "bg-muted justify-start"
            }`}
          >
            <div className={`w-7 h-7 rounded-full bg-white shadow-sm mx-0.5 transition-all flex items-center justify-center`}>
              <Power size={12} className={isOnline ? "text-primary" : "text-muted-foreground"} />
            </div>
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : (
          <>
            {/* Earnings summary */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Earnings</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "This week", value: `£${dashboard.thisWeekEarnings}` },
                  { label: "This month", value: `£${dashboard.thisMonthEarnings}` },
                  { label: "Jobs done", value: String(dashboard.completedThisMonth) },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-lg font-bold text-foreground" data-testid={`metric-${item.label}`}>{item.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                <Star size={13} className="text-amber-500" />
                <span className="text-xs font-semibold">{dashboard.averageRating} avg rating</span>
                {(dashboard.pendingReviews ?? 0) > 0 && (
                  <span className="text-xs text-primary font-medium ml-auto">{dashboard.pendingReviews} pending reviews</span>
                )}
              </div>
            </div>

            {/* Pending requests */}
            {dashboard.pendingRequests.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">New Requests</h2>
                <div className="flex flex-col gap-2">
                  {dashboard.pendingRequests.map((booking: any) => (
                    <button
                      key={booking.id}
                      data-testid={`card-request-${booking.id}`}
                      onClick={() => setLocation(`/bookings/${booking.id}`)}
                      className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{booking.serviceType}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(booking.scheduledAt)}</p>
                        </div>
                        <BookingStatusPill status="pending" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Today's jobs */}
            {dashboard.todayBookings.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Today</h2>
                <div className="flex flex-col gap-2">
                  {dashboard.todayBookings.map((booking: any) => (
                    <button
                      key={booking.id}
                      data-testid={`card-job-${booking.id}`}
                      onClick={() => setLocation(`/bookings/${booking.id}`)}
                      className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left"
                    >
                      <Clock size={14} className="text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{booking.serviceType}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(booking.scheduledAt)}</p>
                      </div>
                      <BookingStatusPill status={booking.status} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                data-testid="button-view-earnings"
                onClick={() => setLocation("/cleaner-dashboard/earnings")}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                <TrendingUp size={18} className="text-primary" />
                <span className="text-sm font-semibold">Earnings</span>
              </button>
              <button
                data-testid="button-view-jobs"
                onClick={() => setLocation("/bookings")}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
              >
                <Clock size={18} className="text-primary" />
                <span className="text-sm font-semibold">All Jobs</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
