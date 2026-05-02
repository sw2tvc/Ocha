import { useState } from "react";
import { useLocation } from "wouter";
import { Calendar, ChevronRight } from "lucide-react";
import { useListBookings, getListBookingsQueryKey } from "@workspace/api-client-react";
import { BookingStatusPill } from "@/components/booking-status";
import { BookingCardSkeleton } from "@/components/skeleton-loader";
import { MOCK_BOOKINGS } from "@/lib/mock-data";

const TABS = [
  { id: "upcoming", label: "Upcoming", statuses: ["pending", "accepted", "en_route", "in_progress"] },
  { id: "past", label: "Past", statuses: ["completed", "cancelled", "disputed"] },
];

export default function Bookings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");

  const { data, isLoading } = useListBookings(
    { role: "customer" },
    { query: { queryKey: getListBookingsQueryKey({ role: "customer" }) } }
  );

  const apiBookings = data?.bookings ?? [];
  const allBookings = apiBookings.length > 0 ? apiBookings : MOCK_BOOKINGS;
  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const filtered = allBookings.filter((b) => currentTab.statuses.includes(b.status));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
    if (isToday) return `Today · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    if (isTomorrow) return `Tomorrow · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      <div className="bg-card border-b border-border px-4 pt-14 pb-0 sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <h1 className="text-lg font-bold text-foreground mb-3">Bookings</h1>
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 flex flex-col gap-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <BookingCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Calendar size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No {activeTab} bookings</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === "upcoming" ? "Book a clean to get started." : "Completed bookings will appear here."}
            </p>
            {activeTab === "upcoming" && (
              <button
                data-testid="button-find-cleaner"
                onClick={() => setLocation("/cleaners")}
                className="mt-4 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                Find a cleaner
              </button>
            )}
          </div>
        ) : (
          filtered.map((booking) => (
            <button
              key={booking.id}
              data-testid={`card-booking-${booking.id}`}
              onClick={() => setLocation(`/bookings/${booking.id}`)}
              className="w-full bg-card border border-border rounded-2xl p-4 text-left hover-elevate active-elevate transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {(booking as any).cleaner?.avatarUrl && (
                      <img
                        src={(booking as any).cleaner.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <p className="text-sm font-semibold text-foreground truncate">
                      {(booking as any).cleaner?.fullName || "Cleaner"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {(booking as any).property?.name || "Property"}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-booking-date-${booking.id}`}>
                    {formatDate(booking.scheduledAt as string)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <BookingStatusPill status={booking.status as any} />
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-foreground">£{booking.totalPrice}</span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </div>
              </div>

              {booking.status === "completed" && booking.reviewStatus === "pending" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-primary font-medium">Leave a review</p>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
