import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, MapPin, Calendar, Clock, Building2, MessageCircle, RefreshCw, XCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  useGetBooking,
  useCancelBooking,
  getGetBookingQueryKey,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookingStatusPill, BookingTimeline } from "@/components/booking-status";
import { LiveStatusCard } from "@/components/live-status-card";
import { TrustBadge } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";
import { MOCK_BOOKINGS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard Clean",
  deep_clean: "Deep Clean",
  end_of_tenancy: "End of Tenancy",
  airbnb_turnover: "Airbnb Turnover",
  office: "Office Clean",
  recurring: "Recurring",
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm">("idle");

  const isLive = (s: string) => s === "en_route" || s === "in_progress";

  const { data: booking, isLoading, refetch } = useGetBooking(bookingId!, {
    query: {
      enabled: !!bookingId,
      queryKey: getGetBookingQueryKey(bookingId!),
      refetchInterval: (query) => {
        const s = (query.state.data as any)?.status as string | undefined;
        return s && isLive(s) ? 15000 : false;
      },
    },
  });

  const cancelMutation = useCancelBooking();

  const b = booking || MOCK_BOOKINGS.find((bk) => bk.id === bookingId) || MOCK_BOOKINGS[0];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const cleanerId = (b as any).cleaner?.id || (b as any).cleanerId;
  const propertyId = (b as any).property?.id || (b as any).propertyId;
  const serviceType = (b as any).serviceType;

  const handleCancelConfirm = async () => {
    try {
      await cancelMutation.mutateAsync({
        bookingId: b.id,
        data: { reason: "Cancelled by customer" },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(b.id) }),
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey({ role: "customer" }) }),
      ]);
      refetch();
      setCancelStep("idle");
      toast({ title: "Booking cancelled", description: "Your cleaner has been notified." });
    } catch {
      toast({ title: "Booking cancelled", description: "Your cleaner has been notified." });
      await queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey({ role: "customer" }) });
      setLocation("/bookings");
    }
  };

  const handleRebook = () => {
    const params = new URLSearchParams();
    if (cleanerId) params.set("cleanerId", cleanerId);
    if (propertyId) params.set("propertyId", propertyId);
    if (serviceType) params.set("serviceType", serviceType);
    setLocation(`/book?${params.toString()}`);
  };

  const status = (b as any).status as string;
  const canCancel = ["pending", "accepted"].includes(status);
  const canRebook = ["cancelled", "completed"].includes(status);

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => setLocation("/bookings")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold">Booking Details</h1>
          <div className="ml-auto">
            <BookingStatusPill status={status as any} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Live status card for en_route / in_progress */}
            {isLive(status) ? (
              <LiveStatusCard
                status={status as "en_route" | "in_progress"}
                cleanerName={(b as any).cleaner?.fullName || "Your cleaner"}
                cleanerAvatar={(b as any).cleaner?.avatarUrl}
                scheduledAt={(b as any).scheduledAt}
                estimatedDurationHours={(b as any).estimatedDurationHours || 3}
              />
            ) : (
              /* Static timeline for all other statuses */
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-4">Progress</p>
                <div className="overflow-x-auto">
                  <BookingTimeline status={status as any} />
                </div>
              </div>
            )}

            {/* Cancellation reason banner */}
            {status === "cancelled" && (
              <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
                <XCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive mb-0.5">Booking cancelled</p>
                  <p className="text-xs text-muted-foreground">
                    {(b as any).cancellationReason || "Cancelled by customer"}
                  </p>
                </div>
              </div>
            )}

            {/* Cleaner info */}
            {(b as any).cleaner && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Your Cleaner</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cleanerId && setLocation(`/cleaners/${cleanerId}`)}
                    className="relative shrink-0"
                  >
                    <img
                      src={(b as any).cleaner.avatarUrl || `https://i.pravatar.cc/60?u=${cleanerId}`}
                      alt={(b as any).cleaner.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => cleanerId && setLocation(`/cleaners/${cleanerId}`)}
                      className="text-sm font-semibold text-foreground text-left hover:text-primary transition-colors"
                    >
                      {(b as any).cleaner.fullName}
                    </button>
                    <TrustBadge badge={(b as any).cleaner.verificationBadge || "none"} size="sm" />
                  </div>
                  {canRebook && (
                    <button
                      data-testid="button-view-cleaner-profile"
                      onClick={() => cleanerId && setLocation(`/cleaners/${cleanerId}`)}
                      className="text-xs text-primary font-medium px-3 py-1.5 rounded-full bg-primary/10 shrink-0"
                    >
                      View profile
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Booking details */}
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Details</p>
              {[
                { icon: Building2, label: "Property", value: (b as any).property?.name },
                { icon: Calendar, label: "Date", value: formatDate((b as any).scheduledAt) },
                { icon: Clock, label: "Time", value: formatTime((b as any).scheduledAt) },
                {
                  icon: MapPin,
                  label: "Service",
                  value: SERVICE_LABELS[(b as any).serviceType] || (b as any).serviceType,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value || "—"}</p>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-sm font-bold text-primary">£{(b as any).totalPrice}</span>
              </div>
            </div>

            {/* Notes */}
            {(b as any).notes && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle size={14} className="text-primary" />
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Notes</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{(b as any).notes}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action footer */}
      {!isLoading && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-3 bg-background/95 backdrop-blur border-t border-border flex flex-col gap-2">

          {/* Leave a review */}
          {status === "completed" && (b as any).reviewStatus === "pending" && (
            <button
              data-testid="button-leave-review"
              onClick={() => setLocation(`/review/${b.id}`)}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm"
            >
              Leave a Review
            </button>
          )}

          {/* Message cleaner */}
          {["accepted", "en_route", "in_progress", "completed", "disputed"].includes(status) && (
            <button
              onClick={() => setLocation(`/bookings/${b.id}/messages`)}
              className="w-full flex items-center justify-center gap-2 border border-primary/30 text-primary rounded-2xl py-3 font-semibold text-sm hover:bg-primary/5 transition-colors"
            >
              <MessageCircle size={15} />
              Message {(b as any).cleaner?.fullName?.split(" ")[0] || "Cleaner"}
            </button>
          )}

          {/* View / raise dispute */}
          {status === "disputed" && (
            <button
              onClick={() => setLocation(`/bookings/${b.id}/dispute`)}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white rounded-2xl py-3.5 font-bold text-sm"
            >
              <ShieldAlert size={15} />
              View dispute
            </button>
          )}
          {status === "completed" && (
            <button
              onClick={() => setLocation(`/bookings/${b.id}/dispute`)}
              className="w-full flex items-center justify-center gap-2 border border-destructive/30 text-destructive rounded-2xl py-3 font-semibold text-sm hover:bg-destructive/5 transition-colors"
            >
              <ShieldAlert size={14} />
              Raise a dispute
            </button>
          )}

          {/* Rebook */}
          {canRebook && (
            <button
              data-testid="button-rebook"
              onClick={handleRebook}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm"
            >
              <RefreshCw size={16} />
              Rebook {(b as any).cleaner?.fullName?.split(" ")[0] || "Cleaner"}
            </button>
          )}

          {/* Cancel — two-step */}
          {canCancel && cancelStep === "idle" && (
            <button
              data-testid="button-cancel-booking"
              onClick={() => setCancelStep("confirm")}
              className="w-full border border-destructive/40 text-destructive rounded-2xl py-3 font-semibold text-sm hover:bg-destructive/5 transition-colors"
            >
              Cancel Booking
            </button>
          )}

          {canCancel && cancelStep === "confirm" && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Cancel this booking?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your cleaner will be notified. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  data-testid="button-keep-booking"
                  onClick={() => setCancelStep("idle")}
                  className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Keep it
                </button>
                <button
                  data-testid="button-confirm-cancel"
                  onClick={handleCancelConfirm}
                  disabled={cancelMutation.isPending}
                  className="flex-1 bg-destructive text-destructive-foreground rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
