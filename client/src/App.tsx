import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/dashboard/app-layout";
import Dashboard from "@/pages/dashboard";
import Websites from "@/pages/websites";
import Analytics from "@/pages/analytics";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { useLocation, Switch, Route } from "wouter";

import { useEffect } from "react";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !me) {
      navigate("/login");
    }
  }, [isLoading, me, navigate]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!me) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={() => (
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      )} />
      <Route path="/websites" component={() => (
        <RequireAuth>
          <Websites />
        </RequireAuth>
      )} />
      <Route path="/analytics" component={() => (
        <RequireAuth>
          <Analytics />
        </RequireAuth>
      )} />
      <Route path="/notifications" component={() => (
        <RequireAuth>
          <Notifications />
        </RequireAuth>
      )} />
      <Route path="/settings" component={() => (
        <RequireAuth>
          <Settings />
        </RequireAuth>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const useLayout = !["/", "/login", "/register"].includes(location);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {useLayout ? (
          <AppLayout>
            <Router />
          </AppLayout>
        ) : (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
