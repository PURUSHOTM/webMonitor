import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { WebsiteStatusList } from "@/components/dashboard/website-status-list";
import { UptimeChart } from "@/components/dashboard/uptime-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AddWebsiteModal } from "@/components/dashboard/add-website-modal";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Monitor your websites in real-time</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
              </Button>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                data-testid="button-add-website"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Website
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 overflow-y-auto h-[calc(100vh-5rem)]">
          <MetricsOverview />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <WebsiteStatusList />
            </div>
            <div>
              <UptimeChart />
            </div>
          </div>

          <RecentActivity />
        </div>
      </main>

      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
