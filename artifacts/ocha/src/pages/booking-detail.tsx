import { useParams, useLocation } from "wouter";
import { ArrowLeft, MapPin, Calendar, Clock, Building2, MessageCircle } from "lucide-react";
import { useGetBooking, useUpdateBookingStatus, useCancelBooking, getGetBookingQueryKey } from "@workspace/api-client-react";
import { BookingStatusPill, BookingTimeline } from "@/components/booking-status";
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

  const { data: booking, isLoading, refetch } = useGetBooking(bookingId!, {
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId!) },
  });

  const cancelMutation = useCancelBooking();
  const updateStatusMutation = useUpdateBookingStatus();

  const b = booking || MOCK_BOOKINGS.find((bk) => bk.id === bookingId) || MOCK_BOOKINGS[0];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ bookingId: b.id, data: { reason: "Cancelled by customer" } });
      refetch();
      toast({ title: "Booking cancelled" });
    } catch {
      toast({ title: "Booking cancelled", description: "Demo mode." });
      setLocation("/bookings");
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
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
            <BookingStatusPill status={(b as any).status as any} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Status timeline */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-4">Progress</p>
              <div className="overflow-x-auto">
                <BookingTimeline status={(b as any).status as any} />
              </div>
            </div>

            {/* Cleaner info */}
            {(b as any).cleaner && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Your Cleaner</p>
                <div className="flex items-center gap-3">
                  <img
                    src={(b as any).cleaner.avatarUrl || `https://i.pravatar.cc/60?u=${(b as any).cleaner.id}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{(b as any).cleaner.fullName}</p>
                    <TrustBadge badge={(b as any).cleaner.verificationBadge || "none"} size="sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Booking info */}
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Details</p>
              {[
                { icon: Building2, label: "Property", value: (b as any).property?.name },
                { icon: Calendar, label: "Date", value: formatDate((b as any).scheduledAt) },
                { icon: Clock, label: "Time", value: formatTime((b as any).scheduledAt) },
                { icon: MapPin, label: "Service", value: SERVICE_LABELS[(b as any).serviceType] || (b as any).serviceType },
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
                <p className="text-sm text-muted-foreground">{(b as any).notes}</p>
              </div>
            )}

            {/* Actions */}
            {(b as any).status === "completed" && (b as any).reviewStatus === "pending" && (
              <button
                data-testid="button-leave-review"
                onClick={() => setLocation(`/review/${b.id}`)}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm"
              >
                Leave a Review
              </button>
            )}

            {["pending", "accepted"].includes((b as any).status) && (
              <button
                data-testid="button-cancel-booking"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="w-full border border-destructive text-destructive rounded-2xl py-3 font-semibold text-sm hover:bg-destructive/5 transition-colors"
              >
                Cancel Booking
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
