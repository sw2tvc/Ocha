import { useLocation, Link } from "wouter";
import { Home, Calendar, Building2, User, Bell, LayoutDashboard, Clock, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useWorkspace } from "@/lib/workspace-context";

type NavItem = { href: string; icon: typeof Home; label: string; alertBadge?: true };

const CUSTOMER_NAV: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/bookings", icon: Calendar, label: "Bookings" },
  { href: "/properties", icon: Building2, label: "Properties" },
  { href: "/notifications", icon: Bell, label: "Alerts", alertBadge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

const CLEANER_NAV: NavItem[] = [
  { href: "/cleaner-dashboard", icon: LayoutDashboard, label: "Jobs" },
  { href: "/cleaner-dashboard/availability", icon: Clock, label: "Availability" },
  { href: "/cleaner-dashboard/earnings", icon: TrendingUp, label: "Earnings" },
  { href: "/notifications", icon: Bell, label: "Alerts", alertBadge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", icon: Shield, label: "Overview" },
  { href: "/notifications", icon: Bell, label: "Alerts", alertBadge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { workspace } = useWorkspace();

  // Always call hooks unconditionally before any early return
  const { data } = useListNotifications(
    {},
    {
      query: {
        queryKey: getListNotificationsQueryKey({}),
        staleTime: 20_000,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
      },
    }
  );

  // Hide on workspace chooser and auth pages
  if (location === "/workspace" || location === "/login" || location === "/register") return null;

  const unreadCount = data?.unreadCount ?? 0;

  const navItems =
    workspace === "cleaner" ? CLEANER_NAV :
    workspace === "admin" ? ADMIN_NAV :
    CUSTOMER_NAV;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label, alertBadge }) => {
          const isActive = href === "/" ? location === href : location.startsWith(href);

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
                  {alertBadge && unreadCount > 0 && (
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
