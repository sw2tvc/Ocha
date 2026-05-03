import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Home, Calendar, Building2, User, Bell,
  TrendingUp, LayoutDashboard, Shield, Clock, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useWorkspace, Workspace, WORKSPACE_LABELS, WORKSPACE_HOME } from "@/lib/workspace-context";

type NavItem = { href: string; icon: typeof Home; label: string; alertBadge?: true };

const CUSTOMER_MAIN: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/bookings", icon: Calendar, label: "Bookings" },
  { href: "/notifications", icon: Bell, label: "Notifications", alertBadge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

const CUSTOMER_MANAGEMENT: NavItem[] = [
  { href: "/properties", icon: Building2, label: "Properties" },
];

const CLEANER_MAIN: NavItem[] = [
  { href: "/cleaner-dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cleaner-dashboard/availability", icon: Clock, label: "Availability" },
  { href: "/cleaner-dashboard/earnings", icon: TrendingUp, label: "Earnings" },
];

const CLEANER_ACCOUNT: NavItem[] = [
  { href: "/notifications", icon: Bell, label: "Notifications", alertBadge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

const ADMIN_MAIN: NavItem[] = [
  { href: "/admin", icon: Shield, label: "Overview" },
];

const ADMIN_ACCOUNT: NavItem[] = [
  { href: "/notifications", icon: Bell, label: "Notifications", alertBadge: true },
  { href: "/profile", icon: User, label: "Profile" },
];

const SWITCHER_OPTIONS: { workspace: Workspace; label: string }[] = [
  { workspace: "customer", label: "Book / Property Manager" },
  { workspace: "cleaner", label: "Work as Cleaner" },
  { workspace: "admin", label: "Admin Dashboard" },
];

export function DesktopNav() {
  const [location, setLocation] = useLocation();
  const { workspace, availableWorkspaces, setWorkspace } = useWorkspace();
  const [switcherOpen, setSwitcherOpen] = useState(false);

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

  function NavItem({ href, icon: Icon, label, alertBadge }: NavItem) {
    const isActive = href === "/" ? location === href : location.startsWith(href);
    return (
      <Link href={href}>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
            isActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <div className="relative shrink-0">
            <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
            {alertBadge && unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-destructive rounded-full flex items-center justify-center px-0.5">
                <span className="text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </div>
            )}
          </div>
          {label}
        </button>
      </Link>
    );
  }

  function SectionLabel({ children }: { children: string }) {
    return (
      <div className="mt-4 mb-2 px-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{children}</p>
      </div>
    );
  }

  function switchTo(w: Workspace) {
    setWorkspace(w);
    setSwitcherOpen(false);
    setLocation(WORKSPACE_HOME[w]);
  }

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 h-screen bg-card border-r border-border z-50">
      <div className="px-6 py-5 border-b border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Platform</p>
        <h1 className="text-xl font-bold text-foreground">Ocha</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col">
        {workspace === "customer" && (
          <>
            {CUSTOMER_MAIN.map((item) => <NavItem key={item.href} {...item} />)}
            <SectionLabel>Management</SectionLabel>
            {CUSTOMER_MANAGEMENT.map((item) => <NavItem key={item.href} {...item} />)}
          </>
        )}

        {workspace === "cleaner" && (
          <>
            <SectionLabel>Work</SectionLabel>
            {CLEANER_MAIN.map((item) => <NavItem key={item.href} {...item} />)}
            <SectionLabel>Account</SectionLabel>
            {CLEANER_ACCOUNT.map((item) => <NavItem key={item.href} {...item} />)}
          </>
        )}

        {workspace === "admin" && (
          <>
            <SectionLabel>Platform</SectionLabel>
            {ADMIN_MAIN.map((item) => <NavItem key={item.href} {...item} />)}
            <SectionLabel>Account</SectionLabel>
            {ADMIN_ACCOUNT.map((item) => <NavItem key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* Workspace switcher */}
      {availableWorkspaces.length > 1 && (
        <div className="px-3 pb-3 border-t border-border pt-3 relative">
          <button
            onClick={() => setSwitcherOpen((o) => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] text-muted-foreground">Current workspace</p>
              <p className="text-xs font-semibold text-foreground truncate">{WORKSPACE_LABELS[workspace]}</p>
            </div>
            <ChevronDown
              size={14}
              className={cn("text-muted-foreground transition-transform", switcherOpen && "rotate-180")}
            />
          </button>

          {switcherOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Switch workspace</p>
              </div>
              {SWITCHER_OPTIONS
                .filter((o) => availableWorkspaces.includes(o.workspace) && o.workspace !== workspace)
                .map((opt) => (
                  <button
                    key={opt.workspace}
                    data-testid={`switch-workspace-${opt.workspace}`}
                    onClick={() => switchTo(opt.workspace)}
                    className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
