import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setDefaultHeaders } from "@workspace/api-client-react";
import { BottomNav } from "@/components/bottom-nav";
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
import DisputePage from "@/pages/dispute";
import CleanerDashboard from "@/pages/cleaner-dashboard";
import Admin from "@/pages/admin";
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

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/cleaners" component={Cleaners} />
        <Route path="/cleaners/:cleanerId" component={CleanerProfile} />
        <Route path="/book" component={Book} />
        <Route path="/bookings" component={Bookings} />
        <Route path="/bookings/:bookingId" component={BookingDetail} />
        <Route path="/review/:bookingId" component={Review} />
        <Route path="/properties" component={Properties} />
        <Route path="/properties/new" component={AddProperty} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/settings" component={ProfileSettings} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/become-a-cleaner" component={BecomeCleaner} />
        <Route path="/bookings/:bookingId/dispute" component={DisputePage} />
        <Route path="/cleaner-dashboard" component={CleanerDashboard} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="max-w-md mx-auto min-h-screen relative">
            <Router />
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
