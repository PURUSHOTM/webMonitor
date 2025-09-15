import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/dashboard/app-layout";
import { UISettingsProvider } from "@/lib/ui-settings";
import Dashboard from "@/pages/dashboard";
import Websites from "@/pages/websites";
import Analytics from "@/pages/analytics";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/websites" component={Websites} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <UISettingsProvider>
          <AppLayout>
            <Router />
          </AppLayout>
        </UISettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
