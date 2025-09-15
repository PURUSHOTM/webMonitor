import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronRight, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Website, MonitoringResult } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface WebsiteWithStatus extends Website {
  latestResult?: MonitoringResult;
  uptime?: number;
}

export function WebsiteStatusList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [targetToDelete, setTargetToDelete] = React.useState<string | null>(null);

  const { data: websites = [], isLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
    refetchInterval: 30000,
  });

  const { data: latestResults = [] } = useQuery<MonitoringResult[]>({
    queryKey: ["/api/monitoring-results/latest"],
    refetchInterval: 10000, // More frequent refresh for status
  });

  const refreshAll = async () => {
    try {
      await apiRequest("POST", "/api/monitoring/check");
      await queryClient.invalidateQueries({ queryKey: ["/api/monitoring-results/latest"] });
      toast({
        title: "Success",
        description: "All websites checked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh website status",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (websiteId: string) => {
    setTargetToDelete(websiteId);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!targetToDelete) return;
    try {
      await apiRequest("DELETE", `/api/websites/${targetToDelete}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Success",
        description: "Website deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete website",
        variant: "destructive",
      });
    } finally {
      setConfirmOpen(false);
      setTargetToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Combine websites with their latest monitoring results
  const websitesWithStatus: WebsiteWithStatus[] = websites.map((website) => {
    const latestResult = latestResults.find(result => result.websiteId === website.id);
    return {
      ...website,
      latestResult,
    };
  });

  const getStatusDot = (result?: MonitoringResult) => {
    if (!result) return "bg-gray-400";
    if (result.isUp) {
      return result.responseTime && result.responseTime > 1000 ? "bg-yellow-500" : "bg-green-500";
    }
    return "bg-red-500";
  };

  const getStatusText = (result?: MonitoringResult): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    if (!result) return { text: "Unknown", variant: "secondary" as const };
    if (result.isUp) {
      const isSlowish = result.responseTime && result.responseTime > 1000;
      return {
        text: result.statusCode?.toString() || "200",
        variant: isSlowish ? "secondary" as const : "default" as const
      };
    }
    return {
      text: result.statusCode?.toString() || "Error",
      variant: "destructive" as const
    };
  };

  return (
    <Card data-testid="card-website-status">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>Website Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            data-testid="button-refresh-all"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {websitesWithStatus.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground" data-testid="text-no-websites">
            No websites added yet. Click "Add Website" to get started.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {websitesWithStatus.map((website) => (
              <div
                key={website.id}
                className="p-6 hover:bg-muted/50 transition-colors"
                data-testid={`website-item-${website.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusDot(website.latestResult)}`}
                      data-testid={`status-dot-${website.id}`}
                    />
                    <div>
                      <h3 className="font-medium" data-testid={`text-name-${website.id}`}>
                        {website.name}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`text-url-${website.id}`}>
                        {website.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p 
                        className={`text-sm font-medium ${
                          website.latestResult?.responseTime && website.latestResult.responseTime > 1000 
                            ? "text-yellow-600" 
                            : ""
                        }`}
                        data-testid={`text-response-time-${website.id}`}
                      >
                        {website.latestResult?.responseTime 
                          ? `${website.latestResult.responseTime}ms`
                          : "-"
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">Response</p>
                    </div>
                    <div className="text-center">
                      <Badge 
                        variant={getStatusText(website.latestResult).variant}
                        data-testid={`badge-status-${website.id}`}
                      >
                        {getStatusText(website.latestResult).text}
                      </Badge>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium" data-testid={`text-uptime-${website.id}`}>
                        -
                      </p>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWebsite(website.id)}
                        data-testid={`button-delete-${website.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-details-${website.id}`}
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
