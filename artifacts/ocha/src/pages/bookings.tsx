import { useState } from "react";
import { useLocation } from "wouter";
import { Calendar, ChevronRight, RefreshCw } from "lucide-react";
import { useListBookings, getListBookingsQueryKey } from "@workspace/api-client-react";
import { BookingStatusPill } from "@/components/booking-status";
import { BookingCardSkeleton } from "@/components/skeleton-loader";
import { MOCK_BOOKINGS } from "@/lib/mock-data";

const TABS = [
  { id: "upcoming", label: "Upcoming", statuses: ["pending", "accepted", "en_route", "in_progress"] },
  { id: "past",     label: "Past",     statuses: ["completed", "cancelled", "disputed"] },
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

  const pastCount = allBookings.filter((b) =>
    ["completed", "cancelled", "disputed"].includes(b.status)
  ).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
    if (isToday) return `Today · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    if (isTomorrow) return `Tomorrow · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const handleRebook = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    const cleanerId  = booking.cleaner?.id  || booking.cleanerId;
    const propertyId = booking.property?.id || booking.propertyId;
    const serviceType = booking.serviceType;
    const params = new URLSearchParams();
    if (cleanerId)   params.set("cleanerId", cleanerId);
    if (propertyId)  params.set("propertyId", propertyId);
    if (serviceType) params.set("serviceType", serviceType);
    setLocation(`/book?${params.toString()}`);
  };

  const BookingCard = ({ booking }: { booking: any }) => {
    const status = booking.status as string;
    const canRebook = ["cancelled", "completed"].includes(status);

    return (
      <button
        key={booking.id}
        data-testid={`card-booking-${booking.id}`}
        onClick={() => setLocation(`/bookings/${booking.id}`)}
        className="w-full bg-card border border-border rounded-2xl p-4 text-left transition-shadow hover:shadow-md"
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
            <p className="text-xs text-muted-foreground mb-1 truncate">
              {(booking as any).property?.name || "Property"}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`text-booking-date-${booking.id}`}>
              {formatDate(booking.scheduledAt as string)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <BookingStatusPill status={status as any} />
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-foreground">£{booking.totalPrice}</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        {status === "completed" && booking.reviewStatus === "pending" && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-primary font-medium">⭐ Leave a review</p>
          </div>
        )}

        {canRebook && (
          <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {status === "cancelled" ? "This booking was cancelled" : "Service completed"}
            </p>
            <button
              data-testid={`button-rebook-${booking.id}`}
              onClick={(e) => handleRebook(e, booking)}
              className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              <RefreshCw size={11} />
              Rebook
            </button>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-8 bg-background">

      {/* Header */}
      <div className="bg-card border-b border-border px-4 md:px-6 pt-14 md:pt-8 pb-0 sticky top-0 z-10">
        <div className="max-w-md mx-auto md:max-w-none">
          <h1 className="text-lg font-bold text-foreground mb-3">Bookings</h1>
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none md:px-6 pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {tab.label}
                {tab.id === "past" && pastCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "past"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {pastCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto md:max-w-none w-full px-4 md:px-6 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array(3).fill(0).map((_, i) => <BookingCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Calendar size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No {activeTab} bookings</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === "upcoming"
                ? "Book a clean to get started."
                : "Completed bookings will appear here."}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
