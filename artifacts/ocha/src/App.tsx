import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ComponentType, ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setDefaultHeaders } from "@workspace/api-client-react";
import { WorkspaceProvider, useWorkspace, Workspace, WORKSPACE_HOME } from "@/lib/workspace-context";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";
import Home from "@/pages/home";
import Cleaners from "@/pages/cleaners";
import CleanerProfile from "@/pages/cleaner-profile";
import Book from "@/pages/book";
import Bookings from "@/pages/bookings";
import BookingDetail from "@/pages/booking-detail";
import Review from "@/pages/review";
import Properties from "@/pages/properties";
import AddProperty from "@/pages/add-property";
import Profile from "@/pages/profile";
import ProfileSettings from "@/pages/profile-settings";
import Notifications from "@/pages/notifications";
import Login from "@/pages/login";
import Register from "@/pages/register";
import BecomeCleaner from "@/pages/become-cleaner";
import CleanerAvailability from "@/pages/cleaner-availability";
import DisputePage from "@/pages/dispute";
import MessagesPage from "@/pages/messages";
import CleanerDashboard from "@/pages/cleaner-dashboard";
import CleanerJobTracker from "@/pages/cleaner-job-tracker";
import CleanerEarnings from "@/pages/cleaner-earnings";
import Admin from "@/pages/admin";
import WorkspaceChooser from "@/pages/workspace-chooser";
import NotFound from "@/pages/not-found";

setDefaultHeaders({ "x-user-id": "user-demo-1" });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Redirects to the user's workspace home if they land on a restricted route.
function WorkspaceGuard({ allowed, children }: { allowed: Workspace[]; children: ReactNode }) {
  const { workspace } = useWorkspace();
  const [, navigate] = useLocation();
  const isAllowed = allowed.includes(workspace);

  useEffect(() => {
    if (!isAllowed) navigate(WORKSPACE_HOME[workspace]);
  }, [isAllowed, workspace]);

  if (!isAllowed) return null;
  return <>{children}</>;
}

function guard(allowed: Workspace[], Component: ComponentType<any>) {
  return function Guarded(props: any) {
    return (
      <WorkspaceGuard allowed={allowed}>
        <Component {...props} />
      </WorkspaceGuard>
    );
  };
}

const CUSTOMER: Workspace[] = ["customer"];
const CLEANER: Workspace[] = ["cleaner"];
const ADMIN: Workspace[] = ["admin"];

function Router() {
  return (
    <>
      <DesktopNav />
      <div className="md:ml-64">
        <Switch>
          {/* ── Customer / Property Manager ─────────────────────── */}
          <Route path="/"                            component={guard(CUSTOMER, Home)} />
          <Route path="/cleaners"                   component={guard(CUSTOMER, Cleaners)} />
          <Route path="/cleaners/:cleanerId"        component={guard(CUSTOMER, CleanerProfile)} />
          <Route path="/book"                       component={guard(CUSTOMER, Book)} />
          <Route path="/bookings"                   component={guard(CUSTOMER, Bookings)} />
          <Route path="/bookings/:bookingId"        component={guard(CUSTOMER, BookingDetail)} />
          <Route path="/review/:bookingId"          component={guard(CUSTOMER, Review)} />
          <Route path="/properties"                 component={guard(CUSTOMER, Properties)} />
          <Route path="/properties/new"             component={guard(CUSTOMER, AddProperty)} />
          <Route path="/bookings/:bookingId/dispute"  component={guard(CUSTOMER, DisputePage)} />
          <Route path="/bookings/:bookingId/messages" component={guard(CUSTOMER, MessagesPage)} />
          <Route path="/become-a-cleaner"           component={guard(CUSTOMER, BecomeCleaner)} />

          {/* ── Cleaner ─────────────────────────────────────────── */}
          <Route path="/cleaner-dashboard"              component={guard(CLEANER, CleanerDashboard)} />
          <Route path="/cleaner-dashboard/availability" component={guard(CLEANER, CleanerAvailability)} />
          <Route path="/cleaner-dashboard/earnings"     component={guard(CLEANER, CleanerEarnings)} />
          <Route path="/cleaner-jobs/:bookingId"        component={guard(CLEANER, CleanerJobTracker)} />

          {/* ── Admin ───────────────────────────────────────────── */}
          <Route path="/admin" component={guard(ADMIN, Admin)} />

          {/* ── Shared (any workspace) ──────────────────────────── */}
          <Route path="/profile"          component={Profile} />
          <Route path="/profile/settings" component={ProfileSettings} />
          <Route path="/notifications"    component={Notifications} />
          <Route path="/login"            component={Login} />
          <Route path="/register"         component={Register} />
          <Route path="/workspace"        component={WorkspaceChooser} />

          <Route component={NotFound} />
        </Switch>
        <BottomNav />
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <WorkspaceProvider>
            <div className="min-h-screen relative">
              <Router />
            </div>
          </WorkspaceProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
