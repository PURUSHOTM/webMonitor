import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Clock
} from "lucide-react";
import type { Notification, Website } from "@shared/schema";

export function RecentActivity() {
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const { data: websites = [] } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  if (notificationsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-64 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "down":
        return {
          icon: AlertTriangle,
          bgColor: "bg-red-100 dark:bg-red-900/20",
          iconColor: "text-red-600 dark:text-red-400"
        };
      case "up":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-100 dark:bg-green-900/20",
          iconColor: "text-green-600 dark:text-green-400"
        };
      default:
        return {
          icon: Plus,
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          iconColor: "text-blue-600 dark:text-blue-400"
        };
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <Card data-testid="card-recent-activity">
      <CardHeader className="border-b border-border">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground" data-testid="text-no-activity">
            No recent activity to display.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.slice(0, 10).map((notification) => {
              const website = websites.find(w => w.id === notification.websiteId);
              const activity = getActivityIcon(notification.type);
              
              return (
                <div 
                  key={notification.id}
                  className="p-6 flex items-start space-x-4"
                  data-testid={`activity-item-${notification.id}`}
                >
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="font-medium text-foreground" 
                      data-testid={`activity-title-${notification.id}`}
                    >
                      {notification.message}
                    </h3>
                    <p 
                      className="text-sm text-muted-foreground"
                      data-testid={`activity-description-${notification.id}`}
                    >
                      {website ? `${website.name} (${website.url})` : "Unknown website"}
                    </p>
                    <p 
                      className="text-xs text-muted-foreground mt-1 flex items-center"
                      data-testid={`activity-time-${notification.id}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
