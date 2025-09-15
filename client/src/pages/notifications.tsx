import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Notification, Website } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Mail,
  MailCheck,
  Activity,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Calendar,
  Globe,
  Trash2
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "down" | "up">("all");
  const [emailFilter, setEmailFilter] = useState<"all" | "sent" | "pending">("all");
  const [selectedWebsite, setSelectedWebsite] = useState<string>("all");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const { data: websites = [] } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
    refetchInterval: 30000,
  });

  const clearAllNotifications = useMutation({
    mutationFn: async () => {
      // Note: You'll need to implement this endpoint in your backend
      await apiRequest("DELETE", "/api/notifications");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Search filter
    const website = websites.find(w => w.id === notification.websiteId);
    const searchMatch = 
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (website?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (website?.url || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!searchMatch) return false;

    // Type filter
    if (typeFilter !== "all" && notification.type !== typeFilter) return false;

    // Email filter
    if (emailFilter === "sent" && !notification.emailSent) return false;
    if (emailFilter === "pending" && notification.emailSent) return false;

    // Website filter
    if (selectedWebsite !== "all" && notification.websiteId !== selectedWebsite) return false;

    return true;
  });

  // Calculate notification statistics
  const getNotificationStats = () => {
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    
    const last7days = new Date();
    last7days.setDate(last7days.getDate() - 7);

    const recentNotifications = notifications.filter(n => 
      new Date(n.createdAt) > last24h
    );

    const weeklyNotifications = notifications.filter(n => 
      new Date(n.createdAt) > last7days
    );

    return {
      total: notifications.length,
      last24h: recentNotifications.length,
      last7days: weeklyNotifications.length,
      downIncidents: notifications.filter(n => n.type === "down").length,
      upIncidents: notifications.filter(n => n.type === "up").length,
      emailsSent: notifications.filter(n => n.emailSent).length,
      emailsPending: notifications.filter(n => !n.emailSent).length,
    };
  };

  const stats = getNotificationStats();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "down":
        return {
          icon: AlertTriangle,
          bgColor: "bg-red-100 dark:bg-red-900/20",
          iconColor: "text-red-600 dark:text-red-400",
          badgeVariant: "destructive" as const
        };
      case "up":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-100 dark:bg-green-900/20",
          iconColor: "text-green-600 dark:text-green-400",
          badgeVariant: "default" as const
        };
      default:
        return {
          icon: Bell,
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          iconColor: "text-blue-600 dark:text-blue-400",
          badgeVariant: "secondary" as const
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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (notificationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Monitor alerts and incidents across your websites</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] })}
            variant="outline"
            data-testid="button-refresh"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {notifications.length > 0 && (
            <Button
              onClick={() => clearAllNotifications.mutate()}
              variant="destructive"
              disabled={clearAllNotifications.isPending}
              data-testid="button-clear-all"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="stat-total">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">All Time</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stats.total}</h3>
              <p className="text-muted-foreground text-sm">Total Notifications</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-recent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">24h</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stats.last24h}</h3>
              <p className="text-muted-foreground text-sm">Recent Alerts</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-incidents">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">7d</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stats.downIncidents}</h3>
              <p className="text-muted-foreground text-sm">Down Incidents</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-emails">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <MailCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className={`text-sm font-medium ${
                stats.emailsPending > 0 ? "text-yellow-600" : "text-green-600"
              }`}>
                {stats.emailsPending > 0 ? `${stats.emailsPending} pending` : "All sent"}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stats.emailsSent}</h3>
              <p className="text-muted-foreground text-sm">Emails Sent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Type</Label>
                  <Select value={typeFilter} onValueChange={(value: "all" | "down" | "up") => setTypeFilter(value)}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="down">Down Alerts</SelectItem>
                      <SelectItem value="up">Up Alerts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Email Status</Label>
                  <Select value={emailFilter} onValueChange={(value: "all" | "sent" | "pending") => setEmailFilter(value)}>
                    <SelectTrigger data-testid="select-email">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Email Sent</SelectItem>
                      <SelectItem value="pending">Email Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Website</Label>
                  <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
                    <SelectTrigger data-testid="select-website">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Websites</SelectItem>
                      {websites.map((website) => (
                        <SelectItem key={website.id} value={website.id}>
                          {website.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card data-testid="card-notifications">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications ({filteredNotifications.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground" data-testid="text-no-notifications">
                  {searchTerm || typeFilter !== "all" || emailFilter !== "all" || selectedWebsite !== "all" ? (
                    <>
                      <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">No notifications match your filters</h3>
                      <p>Try adjusting your search terms or filters</p>
                    </>
                  ) : (
                    <>
                      <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                      <p>Notifications will appear here when your websites go up or down</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => {
                    const website = websites.find(w => w.id === notification.websiteId);
                    const notificationStyle = getNotificationIcon(notification.type);
                    
                    return (
                      <div
                        key={notification.id}
                        className="p-6 hover:bg-muted/50 transition-colors"
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg ${notificationStyle.bgColor} mt-1`}>
                            <notificationStyle.icon className={`h-4 w-4 ${notificationStyle.iconColor}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-foreground" data-testid={`notification-title-${notification.id}`}>
                                  {notification.message}
                                </h3>
                                <Badge variant={notificationStyle.badgeVariant}>
                                  {notification.type === "down" ? "Down" : notification.type === "up" ? "Up" : "Alert"}
                                </Badge>
                                {notification.emailSent ? (
                                  <Badge variant="outline" className="text-green-600">
                                    <MailCheck className="mr-1 h-3 w-3" />
                                    Email Sent
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-yellow-600">
                                    <Mail className="mr-1 h-3 w-3" />
                                    Email Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground" data-testid={`notification-time-${notification.id}`}>
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Globe className="mr-1 h-3 w-3" />
                                <span data-testid={`notification-website-${notification.id}`}>
                                  {website ? `${website.name} (${website.url})` : "Unknown website"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                <span>{formatDateTime(notification.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card data-testid="card-incidents">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
                Down Incidents ({notifications.filter(n => n.type === "down").length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.filter(n => n.type === "down").length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">No incidents detected</h3>
                  <p>All your websites are running smoothly</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications
                    .filter(n => n.type === "down")
                    .map((notification) => {
                      const website = websites.find(w => w.id === notification.websiteId);
                      
                      return (
                        <div
                          key={notification.id}
                          className="p-6 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 mt-1">
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-foreground">
                                  {notification.message}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>
                                  {website ? `${website.name} (${website.url})` : "Unknown website"}
                                </span>
                                <span>{formatDateTime(notification.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery">
          <Card data-testid="card-recovery">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                Recovery Alerts ({notifications.filter(n => n.type === "up").length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.filter(n => n.type === "up").length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No recovery notifications</h3>
                  <p>Recovery alerts will appear when websites come back online</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications
                    .filter(n => n.type === "up")
                    .map((notification) => {
                      const website = websites.find(w => w.id === notification.websiteId);
                      
                      return (
                        <div
                          key={notification.id}
                          className="p-6 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 mt-1">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-foreground">
                                  {notification.message}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>
                                  {website ? `${website.name} (${website.url})` : "Unknown website"}
                                </span>
                                <span>{formatDateTime(notification.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
