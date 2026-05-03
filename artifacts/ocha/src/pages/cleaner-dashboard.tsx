import { useState } from "react";
import { useLocation } from "wouter";
import {
  Power, ChevronRight, TrendingUp, Star, Clock,
  CalendarDays, CheckCircle2, XCircle, User, Building2,
  Loader2, Bell,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetCleanerDashboard,
  useToggleCleanerAvailability,
  getGetCleanerDashboardQueryKey,
} from "@workspace/api-client-react";
import { BookingStatusPill } from "@/components/booking-status";
import { TrustScoreRing } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SERVICE_LABELS: Record<string, string> = {
  standard:        "Standard Clean",
  deep_clean:      "Deep Clean",
  airbnb_turnover: "Airbnb Turnover",
  end_of_tenancy:  "End of Tenancy",
  office:          "Office Clean",
  recurring:       "Recurring",
};

/* ── Accept / Decline mutations ───────────────────── */
function useBookingAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dashKey = getGetCleanerDashboardQueryKey();

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`${import.meta.env.BASE_URL}api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": "user-cleaner-1" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (!res.ok) throw new Error("Failed to accept");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashKey });
      toast({ title: "Booking accepted!", description: "The customer has been notified." });
    },
    onError: () => toast({ title: "Failed to accept", variant: "destructive" }),
  });

  const declineMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`${import.meta.env.BASE_URL}api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "user-cleaner-1" },
        body: JSON.stringify({ reason: "Declined by cleaner" }),
      });
      if (!res.ok) throw new Error("Failed to decline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashKey });
      toast({ title: "Request declined", description: "The customer has been notified." });
    },
    onError: () => toast({ title: "Failed to decline", variant: "destructive" }),
  });

  return { acceptMutation, declineMutation };
}

/* ── Pending request card ─────────────────────────── */
function PendingRequestCard({
  booking,
  onAccept,
  onDecline,
  isActing,
}: {
  booking: any;
  onAccept: () => void;
  onDecline: () => void;
  isActing: boolean;
}) {
  const [, setLocation] = useLocation();
  const [showDecline, setShowDecline] = useState(false);

  const customerName = booking.customer?.fullName || "A customer";
  const customerInitial = customerName[0]?.toUpperCase() || "?";
  const propertyName = booking.property?.name || "—";
  const propertyCity = booking.property?.city || "";
  const serviceLabel = SERVICE_LABELS[booking.serviceType] || booking.serviceType;
  const dateLabel = new Date(booking.scheduledAt).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
  const timeLabel = new Date(booking.scheduledAt).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      {/* "New request" banner */}
      <div className="bg-amber-400/20 px-4 py-1.5 flex items-center gap-1.5 border-b border-amber-200">
        <Bell size={10} className="text-amber-700" />
        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">New request</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Customer + job info */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            {booking.customer?.avatarUrl ? (
              <img
                src={booking.customer.avatarUrl}
                alt={customerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary">{customerInitial}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground truncate">{customerName}</p>
              <p className="text-sm font-bold text-primary shrink-0">£{booking.totalPrice}</p>
            </div>
            <p className="text-xs font-semibold text-foreground/80 mt-0.5">{serviceLabel}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 bg-card border border-border/60 rounded-xl px-3 py-2">
            <Clock size={12} className="text-primary shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Date & time</p>
              <p className="text-xs font-semibold text-foreground">{dateLabel}</p>
              <p className="text-[10px] text-muted-foreground">{timeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-border/60 rounded-xl px-3 py-2">
            <Building2 size={12} className="text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Property</p>
              <p className="text-xs font-semibold text-foreground truncate">{propertyName}</p>
              {propertyCity && <p className="text-[10px] text-muted-foreground truncate">{propertyCity}</p>}
            </div>
          </div>
        </div>

        {/* CTA */}
        {!showDecline ? (
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              disabled={isActing}
              data-testid={`button-accept-${booking.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold disabled:opacity-60 transition-all active:scale-98"
            >
              {isActing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Accept
            </button>
            <button
              onClick={() => setShowDecline(true)}
              disabled={isActing}
              data-testid={`button-decline-${booking.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 border border-destructive/40 text-destructive rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-destructive/5 transition-colors"
            >
              <XCircle size={14} />
              Decline
            </button>
            <button
              onClick={() => setLocation(`/bookings/${booking.id}`)}
              className="w-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          /* Decline confirmation */
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-destructive">Decline this request?</p>
            <p className="text-[10px] text-muted-foreground">The customer will be notified. This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDecline(false)}
                className="flex-1 border border-border rounded-xl py-2 text-sm font-medium text-foreground"
              >
                Keep it
              </button>
              <button
                onClick={onDecline}
                disabled={isActing}
                className="flex-1 bg-destructive text-destructive-foreground rounded-xl py-2 text-sm font-bold disabled:opacity-60"
              >
                {isActing ? "Declining…" : "Yes, decline"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════ Dashboard page ════════════════════════════ */
export default function CleanerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const CLEANER_HEADERS = { headers: { "x-user-id": "user-cleaner-1" } };

  const { data, isLoading, refetch } = useGetCleanerDashboard({
    query: {
      queryKey: getGetCleanerDashboardQueryKey(),
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
    },
    request: CLEANER_HEADERS,
  });

  const toggleAvailability = useToggleCleanerAvailability({ request: CLEANER_HEADERS });
  const { acceptMutation, declineMutation } = useBookingAction();

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

  const handleAccept = async (bookingId: string) => {
    setActingId(bookingId);
    try { await acceptMutation.mutateAsync(bookingId); } finally { setActingId(null); }
  };

  const handleDecline = async (bookingId: string) => {
    setActingId(bookingId);
    try { await declineMutation.mutateAsync(bookingId); } finally { setActingId(null); }
  };

  // Extract each field defensively so a partial API response never crashes the UI
  const d = data as any;
  const pendingRequests: any[] = d?.pendingRequests ?? [];
  const todayBookings: any[]   = d?.todayBookings   ?? [];
  const pendingCount = pendingRequests.length;

  const dashboard = {
    isAvailable:        d?.isAvailable        ?? isOnline,
    thisWeekEarnings:   d?.thisWeekEarnings   ?? 0,
    thisMonthEarnings:  d?.thisMonthEarnings  ?? 0,
    completedThisMonth: d?.completedThisMonth ?? 0,
    trustScore:         d?.trustScore         ?? 0,
    averageRating:      d?.averageRating      ?? 0,
    pendingReviews:     d?.pendingReviews     ?? 0,
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

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
          {pendingCount > 0 && (
            <div className="mt-3 bg-amber-400/20 border border-amber-300/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <Bell size={13} className="text-amber-200 shrink-0" />
              <p className="text-xs text-primary-foreground/90 font-medium">
                {pendingCount} new booking {pendingCount === 1 ? "request" : "requests"} waiting
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-4 flex flex-col gap-4">
        {/* Availability toggle */}
        <div className={cn(
          "rounded-2xl border p-5 flex items-center justify-between transition-colors shadow-sm",
          isOnline ? "bg-primary/5 border-primary/30" : "bg-card border-border"
        )}>
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
            className={cn(
              "w-16 h-8 rounded-full transition-all duration-300 flex items-center relative",
              isOnline ? "bg-primary justify-end" : "bg-muted justify-start"
            )}
          >
            <div className="w-7 h-7 rounded-full bg-white shadow-sm mx-0.5 transition-all flex items-center justify-center">
              <Power size={12} className={isOnline ? "text-primary" : "text-muted-foreground"} />
            </div>
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : (
          <>
            {/* ── Pending booking requests ── */}
            {pendingCount > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    New Requests
                  </h2>
                  <span className="text-[10px] text-muted-foreground">Respond within 24h to keep your score high</span>
                </div>
                {pendingRequests.map((booking) => (
                  <PendingRequestCard
                    key={booking.id}
                    booking={booking}
                    onAccept={() => handleAccept(booking.id)}
                    onDecline={() => handleDecline(booking.id)}
                    isActing={actingId === booking.id}
                  />
                ))}
              </div>
            )}

            {/* Earnings summary */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Earnings</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "This week",  value: `£${dashboard.thisWeekEarnings}` },
                  { label: "This month", value: `£${dashboard.thisMonthEarnings}` },
                  { label: "Jobs done",  value: String(dashboard.completedThisMonth) },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-lg font-bold text-foreground" data-testid={`metric-${item.label}`}>{item.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                <Star size={13} className="text-amber-500" />
                <span className="text-xs font-semibold">{dashboard.averageRating > 0 ? `${dashboard.averageRating} avg rating` : "No ratings yet"}</span>
                {dashboard.pendingReviews > 0 && (
                  <span className="text-xs text-primary font-medium ml-auto">
                    {dashboard.pendingReviews} pending reviews
                  </span>
                )}
              </div>
            </div>

            {/* Today's jobs */}
            {todayBookings.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Today</h2>
                <div className="flex flex-col gap-2">
                  {todayBookings.map((booking) => (
                    <button
                      key={booking.id}
                      data-testid={`card-job-${booking.id}`}
                      onClick={() => setLocation(`/cleaner-jobs/${booking.id}`)}
                      className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left"
                    >
                      <Clock size={14} className="text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{SERVICE_LABELS[booking.serviceType] || booking.serviceType}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(booking.scheduledAt)}</p>
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
              <button
                data-testid="button-manage-availability"
                onClick={() => setLocation("/cleaner-dashboard/availability")}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 col-span-2"
              >
                <CalendarDays size={18} className="text-primary" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Manage Availability</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Block dates you can't work</p>
                </div>
                <ChevronRight size={15} className="text-muted-foreground ml-auto" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
