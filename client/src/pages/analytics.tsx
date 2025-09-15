import { useState } from "react";
import { useUISettings } from "@/lib/ui-settings";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Website, MonitoringResult } from "@shared/schema";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Zap,
  Timer,
  Target
} from "lucide-react";

interface DashboardStats {
  websitesOnline: number;
  totalWebsites: number;
  avgResponseTime: number;
  uptimePercentage: number;
  incidentCount: number;
}

export default function Analytics() {
  const [selectedWebsite, setSelectedWebsite] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");
  const { showAdvancedMetrics } = useUISettings();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  const { data: websites = [], isLoading: websitesLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
    refetchInterval: 30000,
  });

  const { data: allResults = [], isLoading: resultsLoading } = useQuery<MonitoringResult[]>({
    queryKey: ["/api/monitoring-results"],
    refetchInterval: 30000,
  });

  const { data: latestResults = [] } = useQuery<MonitoringResult[]>({
    queryKey: ["/api/monitoring-results/latest"],
    refetchInterval: 10000,
  });

  // Filter results based on selected website and time range
  const filteredResults = allResults.filter((result) => {
    if (selectedWebsite !== "all" && result.websiteId !== selectedWebsite) {
      return false;
    }

    const resultDate = new Date(result.checkedAt);
    const now = new Date();
    
    switch (timeRange) {
      case "1h":
        return now.getTime() - resultDate.getTime() <= 60 * 60 * 1000;
      case "24h":
        return now.getTime() - resultDate.getTime() <= 24 * 60 * 60 * 1000;
      case "7d":
        return now.getTime() - resultDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      case "30d":
        return now.getTime() - resultDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  });

  // Calculate analytics metrics
  const calculateMetrics = () => {
    if (filteredResults.length === 0) {
      return {
        uptimePercent: 100,
        avgResponseTime: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        responseTimeData: [],
        uptimeData: [],
      };
    }

    const successfulChecks = filteredResults.filter(r => r.isUp).length;
    const failedChecks = filteredResults.length - successfulChecks;
    const uptimePercent = (successfulChecks / filteredResults.length) * 100;
    
    const validResponseTimes = filteredResults
      .filter(r => r.responseTime && r.isUp)
      .map(r => r.responseTime!);
    
    const avgResponseTime = validResponseTimes.length > 0
      ? Math.round(validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length)
      : 0;

    // Generate hourly response time data for the last 24 hours
    const responseTimeData: { time: string; responseTime: number; count: number }[] = [];
    const uptimeData: { time: string; uptime: number; total: number }[] = [];
    
    if (timeRange === "24h" || timeRange === "1h") {
      const hours = timeRange === "1h" ? 1 : 24;
      const intervalMinutes = timeRange === "1h" ? 10 : 60;
      
      for (let i = hours * (60 / intervalMinutes) - 1; i >= 0; i--) {
        const endTime = new Date();
        endTime.setMinutes(endTime.getMinutes() - (i * intervalMinutes));
        const startTime = new Date(endTime.getTime() - (intervalMinutes * 60 * 1000));
        
        const periodResults = filteredResults.filter(r => {
          const resultTime = new Date(r.checkedAt);
          return resultTime >= startTime && resultTime < endTime;
        });

        const timeLabel = endTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        if (periodResults.length > 0) {
          const validTimes = periodResults
            .filter(r => r.responseTime && r.isUp)
            .map(r => r.responseTime!);
          
          const avgTime = validTimes.length > 0
            ? Math.round(validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length)
            : 0;

          responseTimeData.push({
            time: timeLabel,
            responseTime: avgTime,
            count: validTimes.length,
          });

          const upCount = periodResults.filter(r => r.isUp).length;
          uptimeData.push({
            time: timeLabel,
            uptime: (upCount / periodResults.length) * 100,
            total: periodResults.length,
          });
        } else {
          responseTimeData.push({
            time: timeLabel,
            responseTime: 0,
            count: 0,
          });
          uptimeData.push({
            time: timeLabel,
            uptime: 100,
            total: 0,
          });
        }
      }
    }

    return {
      uptimePercent,
      avgResponseTime,
      totalChecks: filteredResults.length,
      successfulChecks,
      failedChecks,
      responseTimeData,
      uptimeData,
    };
  };

  const metrics = calculateMetrics();

  // Calculate performance distribution
  const getPerformanceDistribution = () => {
    const responseTimes = filteredResults
      .filter(r => r.responseTime && r.isUp)
      .map(r => r.responseTime!);

    if (responseTimes.length === 0) {
      return { fast: 0, average: 0, slow: 0 };
    }

    const fast = responseTimes.filter(t => t <= 500).length;
    const average = responseTimes.filter(t => t > 500 && t <= 1000).length;
    const slow = responseTimes.filter(t => t > 1000).length;

    const total = responseTimes.length;
    
    return {
      fast: Math.round((fast / total) * 100),
      average: Math.round((average / total) * 100),
      slow: Math.round((slow / total) * 100),
    };
  };

  const performanceDistribution = getPerformanceDistribution();

  // Get website status overview
  const getWebsiteOverview = () => {
    return websites.map(website => {
      const latest = latestResults.find(r => r.websiteId === website.id);
      const websiteResults = filteredResults.filter(r => r.websiteId === website.id);
      
      let uptime = 100;
      if (websiteResults.length > 0) {
        const upCount = websiteResults.filter(r => r.isUp).length;
        uptime = (upCount / websiteResults.length) * 100;
      }

      const avgResponseTime = websiteResults
        .filter(r => r.responseTime && r.isUp)
        .reduce((sum, r, _, arr) => sum + (r.responseTime! / arr.length), 0);

      return {
        ...website,
        latestResult: latest,
        uptime,
        avgResponseTime: Math.round(avgResponseTime) || 0,
        totalChecks: websiteResults.length,
      };
    });
  };

  const websiteOverview = getWebsiteOverview();

  if (statsLoading || websitesLoading || resultsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
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
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Detailed performance insights and metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
            <SelectTrigger className="w-48" data-testid="select-website">
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
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
              <SelectItem value="30d">Last 30d</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="metric-uptime">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className={`text-sm font-medium flex items-center ${
                metrics.uptimePercent >= 99 ? "text-green-600" : 
                metrics.uptimePercent >= 95 ? "text-yellow-600" : "text-red-600"
              }`}>
                {metrics.uptimePercent >= 99 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {metrics.uptimePercent >= 99 ? "Excellent" : metrics.uptimePercent >= 95 ? "Good" : "Poor"}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold" data-testid="value-uptime">
                {metrics.uptimePercent.toFixed(1)}%
              </h3>
              <p className="text-muted-foreground text-sm">Uptime</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-response-time">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className={`text-sm font-medium ${
                metrics.avgResponseTime <= 500 ? "text-green-600" : 
                metrics.avgResponseTime <= 1000 ? "text-yellow-600" : "text-red-600"
              }`}>
                {metrics.avgResponseTime <= 500 ? "Fast" : 
                 metrics.avgResponseTime <= 1000 ? "Average" : "Slow"}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold" data-testid="value-response-time">
                {metrics.avgResponseTime}ms
              </h3>
              <p className="text-muted-foreground text-sm">Avg Response</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-total-checks">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {timeRange}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold" data-testid="value-total-checks">
                {metrics.totalChecks.toLocaleString()}
              </h3>
              <p className="text-muted-foreground text-sm">Total Checks</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="metric-incidents">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className={`text-sm font-medium ${
                metrics.failedChecks === 0 ? "text-green-600" : "text-red-600"
              }`}>
                {metrics.failedChecks === 0 ? "None" : "Detected"}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold" data-testid="value-incidents">
                {metrics.failedChecks}
              </h3>
              <p className="text-muted-foreground text-sm">Failed Checks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAdvancedMetrics && (
        <Card data-testid="card-advanced-metrics">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-2">Advanced Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-xl font-bold">{metrics.totalChecks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Successful Checks</p>
                <p className="text-xl font-bold">{metrics.successfulChecks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed Checks</p>
                <p className="text-xl font-bold">{metrics.failedChecks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Response Time Chart */}
          <Card data-testid="card-response-chart">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Response Time Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.responseTimeData.length > 0 ? (
                <div className="h-64 flex items-end space-x-1">
                  {metrics.responseTimeData.map((point, index) => {
                    const maxTime = Math.max(...metrics.responseTimeData.map(p => p.responseTime));
                    const height = maxTime > 0 ? (point.responseTime / maxTime) * 100 : 0;
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center"
                        data-testid={`chart-bar-${index}`}
                      >
                        <div
                          className={`w-full rounded-t ${
                            point.responseTime <= 500 ? "bg-green-500" :
                            point.responseTime <= 1000 ? "bg-yellow-500" : "bg-red-500"
                          } transition-all duration-300`}
                          style={{ height: `${height}%` }}
                          title={`${point.time}: ${point.responseTime}ms`}
                        />
                        <span className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
                          {point.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No data available for the selected time range</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uptime Chart */}
          <Card data-testid="card-uptime-chart">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Uptime Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.uptimeData.length > 0 ? (
                <div className="h-32 flex items-end space-x-1">
                  {metrics.uptimeData.map((point, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                      data-testid={`uptime-bar-${index}`}
                    >
                      <div
                        className={`w-full rounded-t ${
                          point.uptime >= 99 ? "bg-green-500" :
                          point.uptime >= 95 ? "bg-yellow-500" : "bg-red-500"
                        } transition-all duration-300`}
                        style={{ height: `${point.uptime}%` }}
                        title={`${point.time}: ${point.uptime.toFixed(1)}% uptime`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <p>No uptime data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Distribution */}
          <Card data-testid="card-performance-distribution">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Response Time Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Fast (≤500ms)</span>
                  </div>
                  <span className="font-medium">{performanceDistribution.fast}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Average (500-1000ms)</span>
                  </div>
                  <span className="font-medium">{performanceDistribution.average}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Slow (&gt;1000ms)</span>
                  </div>
                  <span className="font-medium">{performanceDistribution.slow}%</span>
                </div>
                
                {/* Visual Distribution Bar */}
                <div className="w-full h-4 bg-muted rounded-lg overflow-hidden flex">
                  {performanceDistribution.fast > 0 && (
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${performanceDistribution.fast}%` }}
                    />
                  )}
                  {performanceDistribution.average > 0 && (
                    <div 
                      className="bg-yellow-500" 
                      style={{ width: `${performanceDistribution.average}%` }}
                    />
                  )}
                  {performanceDistribution.slow > 0 && (
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${performanceDistribution.slow}%` }}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websites" className="space-y-6">
          {/* Website Performance Overview */}
          <Card data-testid="card-website-performance">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Website Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {websiteOverview.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No websites to analyze. Add some websites to see performance data.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {websiteOverview.map((website) => (
                    <div
                      key={website.id}
                      className="p-6 hover:bg-muted/50 transition-colors"
                      data-testid={`website-perf-${website.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              website.latestResult?.isUp
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div>
                            <h3 className="font-medium">{website.name}</h3>
                            <p className="text-sm text-muted-foreground">{website.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <p className="text-sm font-medium">
                              {website.uptime.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Uptime</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">
                              {website.avgResponseTime || 0}ms
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Response</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">
                              {website.totalChecks}
                            </p>
                            <p className="text-xs text-muted-foreground">Checks</p>
                          </div>
                          <Badge
                            variant={
                              website.uptime >= 99
                                ? "default"
                                : website.uptime >= 95
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {website.uptime >= 99
                              ? "Excellent"
                              : website.uptime >= 95
                              ? "Good"
                              : "Poor"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
