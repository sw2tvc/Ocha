import { useLocation } from "wouter";
import { ArrowLeft, Bell, CheckCheck, Calendar, Star, ShieldCheck, Info } from "lucide-react";
import { useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/skeleton-loader";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICONS: Record<string, typeof Bell> = {
  booking_request: Calendar,
  booking_accepted: CheckCheck,
  booking_en_route: Calendar,
  booking_started: Calendar,
  booking_completed: CheckCheck,
  review_request: Star,
  review_revealed: Star,
  trust_update: ShieldCheck,
  system: Info,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListNotifications(
    {},
    { query: { queryKey: getListNotificationsQueryKey({}) } }
  );

  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const notifications = data?.notifications || MOCK_NOTIFICATIONS;
  const unreadCount = data?.unreadCount ?? MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync(undefined as any);
      refetch();
    } catch {
      toast({ title: "Marked all as read" });
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markOne.mutateAsync({ notificationId: id });
      refetch();
    } catch {
      /* demo */
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
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
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              data-testid="button-mark-all-read"
              onClick={handleMarkAll}
              className="text-xs text-primary font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full flex flex-col">
        {isLoading ? (
          <div className="px-4 pt-4 flex flex-col gap-2">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Bell size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground mt-1">You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            return (
              <button
                key={notif.id}
                data-testid={`notif-${notif.id}`}
                onClick={() => {
                  handleMarkRead(notif.id);
                  if (notif.bookingId) setLocation(`/bookings/${notif.bookingId!}`);
                }}
                className={`w-full flex items-start gap-3 px-4 py-4 border-b border-border text-left transition-colors hover:bg-muted/30 ${
                  !notif.isRead ? "bg-primary/3" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon size={16} className={!notif.isRead ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold text-foreground ${!notif.isRead ? "" : "font-medium"}`} data-testid={`text-notif-title-${notif.id}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{notif.createdAt ? timeAgo(notif.createdAt) : ""}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
