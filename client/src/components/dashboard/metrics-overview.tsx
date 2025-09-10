import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Clock, 
  Percent, 
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  websitesOnline: number;
  totalWebsites: number;
  avgResponseTime: number;
  uptimePercentage: number;
  incidentCount: number;
}

export function MetricsOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Websites Online",
      value: `${stats?.websitesOnline || 0}`,
      subtitle: `of ${stats?.totalWebsites || 0} total`,
      icon: CheckCircle,
      iconBg: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      trend: { value: "2.3%", direction: "up" as const },
      testId: "metric-websites-online"
    },
    {
      title: "Avg Response Time",
      value: `${stats?.avgResponseTime || 0}ms`,
      subtitle: "Average response",
      icon: Clock,
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      trend: { value: "0.2%", direction: "down" as const },
      testId: "metric-response-time"
    },
    {
      title: "Uptime",
      value: `${stats?.uptimePercentage || 0}%`,
      subtitle: "Last 30 days",
      icon: Percent,
      iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      trend: { value: "0.1%", direction: "up" as const },
      testId: "metric-uptime"
    },
    {
      title: "Incidents",
      value: `${stats?.incidentCount || 0}`,
      subtitle: "Last 7 days",
      icon: AlertTriangle,
      iconBg: "bg-red-100 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      trend: { value: "50%", direction: "down" as const },
      testId: "metric-incidents"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric) => (
        <Card key={metric.title} data-testid={metric.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${metric.iconBg}`}>
                <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
              </div>
              <span 
                className={`text-sm font-medium flex items-center ${
                  metric.trend.direction === "up" ? "text-green-600" : "text-red-600"
                }`}
                data-testid={`trend-${metric.testId}`}
              >
                {metric.trend.direction === "up" ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {metric.trend.value}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold" data-testid={`value-${metric.testId}`}>
                {metric.value}
              </h3>
              <p className="text-muted-foreground text-sm">
                {metric.subtitle}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
