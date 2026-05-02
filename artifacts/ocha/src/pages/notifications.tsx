import { useLocation } from "wouter";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Calendar,
  Star,
  ShieldCheck,
  Info,
  ChevronRight,
  Truck,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  useListNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/skeleton-loader";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

/* ── per-type config ── */
const TYPE_CONFIG: Record<
  string,
  { icon: typeof Bell; color: string; bg: string; label: string }
> = {
  booking_request: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Booking request",
  },
  booking_accepted: {
    icon: CheckCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Booking confirmed",
  },
  booking_en_route: {
    icon: Truck,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "Cleaner en route",
  },
  booking_started: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Cleaning started",
  },
  booking_completed: {
    icon: CheckCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Completed",
  },
  review_request: {
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Review requested",
  },
  review_revealed: {
    icon: Sparkles,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "Review revealed",
  },
  trust_update: {
    icon: ShieldCheck,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "Trust score",
  },
  system: { icon: Info, color: "text-muted-foreground", bg: "bg-muted", label: "System" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function groupByDate(
  notifications: any[]
): { label: string; items: any[] }[] {
  const now = Date.now();
  const groups: Record<string, any[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Earlier: [],
  };

  for (const n of notifications) {
    const diff = now - new Date(n.createdAt).getTime();
    const hrs = diff / 3600000;
    if (hrs < 24) groups["Today"].push(n);
    else if (hrs < 48) groups["Yesterday"].push(n);
    else if (hrs < 168) groups["This week"].push(n);
    else groups["Earlier"].push(n);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function getAction(
  notif: any
): { label: string; path: string } | null {
  switch (notif.type) {
    case "booking_request":
    case "booking_accepted":
    case "booking_en_route":
    case "booking_started":
    case "booking_completed":
      return notif.bookingId
        ? { label: "View booking", path: `/bookings/${notif.bookingId}` }
        : null;
    case "review_request":
      return notif.bookingId
        ? { label: "Leave review", path: `/review/${notif.bookingId}` }
        : null;
    case "review_revealed":
      return notif.bookingId
        ? { label: "See reviews", path: `/review/${notif.bookingId}` }
        : null;
    default:
      return null;
  }
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useListNotifications(
    {},
    { query: { queryKey: getListNotificationsQueryKey({}) } }
  );

  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const apiNotifications = data?.notifications ?? [];
  const notifications =
    apiNotifications.length > 0 ? apiNotifications : MOCK_NOTIFICATIONS;
  const unreadCount =
    data?.unreadCount ?? MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  const groups = groupByDate(notifications);

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync(undefined as any);
      await queryClient.invalidateQueries({
        queryKey: getListNotificationsQueryKey({}),
      });
      refetch();
    } catch {
      toast({ title: "Marked all as read" });
    }
  };

  const handleTap = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await markOne.mutateAsync({ notificationId: notif.id });
        await queryClient.invalidateQueries({
          queryKey: getListNotificationsQueryKey({}),
        });
        refetch();
      } catch {
        /* demo */
      }
    }
    const action = getAction(notif);
    if (action) setLocation(action.path);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-back"
              onClick={() => setLocation("/")}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold">Notifications</h1>
              {unreadCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">All caught up</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              data-testid="button-mark-all-read"
              onClick={handleMarkAll}
              className="text-xs text-primary font-semibold px-3 py-1.5 rounded-full bg-primary/10"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="px-4 pt-4 flex flex-col gap-2">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Bell size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Booking updates and review alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {groups.map(({ label, items }) => (
              <div key={label}>
                {/* Date group label */}
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 pt-5 pb-2">
                  {label}
                </p>

                <div className="flex flex-col gap-1 px-4">
                  {items.map((notif) => {
                    const cfg =
                      TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
                    const Icon = cfg.icon;
                    const action = getAction(notif);

                    return (
                      <button
                        key={notif.id}
                        data-testid={`notif-${notif.id}`}
                        onClick={() => handleTap(notif)}
                        className={`w-full flex items-start gap-3 rounded-2xl p-4 text-left transition-all ${
                          !notif.isRead
                            ? "bg-primary/4 border border-primary/10"
                            : "bg-card border border-border"
                        } hover:shadow-sm`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}
                        >
                          <Icon size={18} className={cfg.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <p
                              className={`text-sm leading-snug ${
                                !notif.isRead
                                  ? "font-bold text-foreground"
                                  : "font-semibold text-foreground"
                              }`}
                              data-testid={`text-notif-title-${notif.id}`}
                            >
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                              {notif.createdAt ? timeAgo(notif.createdAt as string) : ""}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {notif.message}
                          </p>
                          {action && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-[11px] text-primary font-semibold">
                                {action.label}
                              </span>
                              <ChevronRight size={11} className="text-primary" />
                            </div>
                          )}
                        </div>

                        {/* Unread dot */}
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
