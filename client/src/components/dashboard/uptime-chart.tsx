import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonitoringResult } from "@shared/schema";

export function UptimeChart() {
  const { data: results = [], isLoading } = useQuery<MonitoringResult[]>({
    queryKey: ["/api/monitoring-results"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate 24h statistics
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);
  
  const recent24hResults = results.filter(
    result => new Date(result.checkedAt) > last24Hours
  );

  const upCount = recent24hResults.filter(result => result.isUp).length;
  const totalCount = recent24hResults.length;
  const uptimePercent = totalCount > 0 ? (upCount / totalCount) * 100 : 100;
  
  const uptimeMinutes = Math.round((uptimePercent / 100) * 24 * 60);
  const downtimeMinutes = (24 * 60) - uptimeMinutes;

  return (
    <Card data-testid="card-uptime-chart">
      <CardHeader>
        <CardTitle>24h Uptime Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="h-48 rounded-lg mb-4 relative flex items-end justify-center text-white text-sm font-medium"
          style={{
            background: `linear-gradient(to right, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 36%) ${uptimePercent}%, hsl(0, 85%, 60%) ${uptimePercent}%, hsl(0, 85%, 60%) 100%)`
          }}
          data-testid="chart-uptime-visual"
        >
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <span data-testid="text-uptime-percent">
              {uptimePercent.toFixed(1)}% Uptime
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>Operational</span>
            </div>
            <span className="font-medium" data-testid="text-operational-time">
              {Math.floor(uptimeMinutes / 60)}h {uptimeMinutes % 60}m
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span>Downtime</span>
            </div>
            <span className="font-medium" data-testid="text-downtime">
              {Math.floor(downtimeMinutes / 60)}h {downtimeMinutes % 60}m
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
