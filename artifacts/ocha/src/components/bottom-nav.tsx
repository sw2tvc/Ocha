import { useLocation, Link } from "wouter";
import { Home, Calendar, Building2, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/bookings", icon: Calendar, label: "Bookings" },
  { href: "/properties", icon: Building2, label: "Properties" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();

  const { data } = useListNotifications(
    {},
    {
      query: {
        queryKey: getListNotificationsQueryKey({}),
        staleTime: 30000,
      },
    }
  );

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? location === href : location.startsWith(href);
          const isAlerts = href === "/notifications";

          return (
            <Link key={href} href={href}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 transition-colors min-w-[48px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={cn("transition-all", isActive && "scale-105")}
                  />
                  {isAlerts && unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-destructive rounded-full flex items-center justify-center px-0.5">
                      <span className="text-[9px] font-bold text-white leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide",
                    isActive && "font-semibold"
                  )}
                >
                  {label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
