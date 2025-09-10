import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWebsiteSchema } from "@shared/schema";
import type { Website, MonitoringResult } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Globe, 
  Activity, 
  Clock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2
} from "lucide-react";
import { z } from "zod";

const formSchema = insertWebsiteSchema.extend({
  url: z.string().url("Please enter a valid URL"),
  name: z.string().min(1, "Website name is required"),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteWithStatus extends Website {
  latestResult?: MonitoringResult;
  uptime?: number;
}

export default function Websites() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "up" | "down">("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: websites = [], isLoading: websitesLoading } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
    refetchInterval: 30000,
  });

  const { data: latestResults = [] } = useQuery<MonitoringResult[]>({
    queryKey: ["/api/monitoring-results/latest"],
    refetchInterval: 10000,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      checkInterval: 5,
      enableNotifications: true,
    },
  });

  const createWebsiteMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/websites", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Success",
        description: "Website added successfully",
      });
      reset();
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add website",
        variant: "destructive",
      });
    },
  });

  const updateWebsiteMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!editingWebsite) throw new Error("No website selected for editing");
      const response = await apiRequest("PUT", `/api/websites/${editingWebsite.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Success",
        description: "Website updated successfully",
      });
      reset();
      setIsEditModalOpen(false);
      setEditingWebsite(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update website",
        variant: "destructive",
      });
    },
  });

  const deleteWebsiteMutation = useMutation({
    mutationFn: async (websiteId: string) => {
      await apiRequest("DELETE", `/api/websites/${websiteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      toast({
        title: "Success",
        description: "Website deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete website",
        variant: "destructive",
      });
    },
  });

  const refreshAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/monitoring/check");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitoring-results/latest"] });
      toast({
        title: "Success",
        description: "All websites checked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to refresh website status",
        variant: "destructive",
      });
    },
  });

  // Combine websites with their latest monitoring results
  const websitesWithStatus: WebsiteWithStatus[] = websites.map((website) => {
    const latestResult = latestResults.find(result => result.websiteId === website.id);
    return {
      ...website,
      latestResult,
    };
  });

  // Filter websites based on search and status
  const filteredWebsites = websitesWithStatus.filter((website) => {
    const matchesSearch = website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         website.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === "all") return true;
    if (statusFilter === "up") return website.latestResult?.isUp === true;
    if (statusFilter === "down") return website.latestResult?.isUp === false;
    
    return true;
  });

  const getStatusInfo = (result?: MonitoringResult) => {
    if (!result) return { 
      status: "unknown" as const, 
      color: "bg-gray-500", 
      textColor: "text-gray-600", 
      icon: AlertTriangle 
    };
    
    if (result.isUp) {
      const isSlowish = result.responseTime && result.responseTime > 1000;
      return {
        status: isSlowish ? "slow" as const : "up" as const,
        color: isSlowish ? "bg-yellow-500" : "bg-green-500",
        textColor: isSlowish ? "text-yellow-600" : "text-green-600",
        icon: CheckCircle
      };
    }
    
    return { 
      status: "down" as const, 
      color: "bg-red-500", 
      textColor: "text-red-600", 
      icon: AlertTriangle 
    };
  };

  const handleEdit = (website: Website) => {
    setEditingWebsite(website);
    setValue("name", website.name);
    setValue("url", website.url);
    setValue("checkInterval", website.checkInterval);
    setValue("enableNotifications", website.enableNotifications);
    setIsEditModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editingWebsite) {
      updateWebsiteMutation.mutate(data);
    } else {
      createWebsiteMutation.mutate(data);
    }
  };

  const handleModalClose = () => {
    reset();
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingWebsite(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Websites</h1>
          <p className="text-muted-foreground">Manage your monitored websites</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => refreshAllMutation.mutate()}
            disabled={refreshAllMutation.isPending}
            variant="outline"
            data-testid="button-refresh-all"
          >
            {refreshAllMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh All
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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search websites</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label>Status filter</Label>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "up" | "down") => setStatusFilter(value)}
              >
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="up">Online</SelectItem>
                  <SelectItem value="down">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website List */}
      <Card data-testid="card-websites-list">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Monitored Websites ({filteredWebsites.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {websitesLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWebsites.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground" data-testid="text-no-websites">
              {searchTerm || statusFilter !== "all" ? (
                <>
                  <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No websites match your filters</h3>
                  <p>Try adjusting your search terms or filters</p>
                </>
              ) : (
                <>
                  <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No websites added yet</h3>
                  <p>Click "Add Website" to start monitoring your first website</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredWebsites.map((website) => {
                const statusInfo = getStatusInfo(website.latestResult);
                return (
                  <div
                    key={website.id}
                    className="p-6 hover:bg-muted/50 transition-colors"
                    data-testid={`website-row-${website.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-3 h-3 rounded-full ${statusInfo.color}`}
                            data-testid={`status-dot-${website.id}`}
                          />
                          <statusInfo.icon className={`h-4 w-4 ${statusInfo.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-foreground" data-testid={`text-name-${website.id}`}>
                              {website.name}
                            </h3>
                            <Badge variant={website.enableNotifications ? "default" : "secondary"}>
                              {website.enableNotifications ? "Notifications On" : "Notifications Off"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <a
                              href={website.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center"
                              data-testid={`link-url-${website.id}`}
                            >
                              {website.url}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              Checks every {website.checkInterval} min
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {/* Response Time */}
                        <div className="text-center">
                          <p 
                            className={`text-sm font-medium ${
                              website.latestResult?.responseTime && website.latestResult.responseTime > 1000 
                                ? "text-yellow-600" 
                                : "text-foreground"
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

                        {/* Status Code */}
                        <div className="text-center">
                          <p className="text-sm font-medium" data-testid={`text-status-code-${website.id}`}>
                            {website.latestResult?.statusCode || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">Status</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(website)}
                            data-testid={`button-edit-${website.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWebsiteMutation.mutate(website.id)}
                            disabled={deleteWebsiteMutation.isPending}
                            data-testid={`button-delete-${website.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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

      {/* Add/Edit Website Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md" data-testid="modal-website-form">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {editingWebsite ? "Edit Website" : "Add New Website"}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleModalClose}
                data-testid="button-close-modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Website Name</Label>
              <Input
                id="name"
                placeholder="My Website"
                {...register("name")}
                data-testid="input-website-name"
              />
              {errors.name && (
                <p className="text-sm text-destructive" data-testid="error-website-name">
                  {errors.name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                {...register("url")}
                data-testid="input-website-url"
              />
              {errors.url && (
                <p className="text-sm text-destructive" data-testid="error-website-url">
                  {errors.url.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Check Interval</Label>
              <Select
                value={watch("checkInterval")?.toString()}
                onValueChange={(value) => setValue("checkInterval", parseInt(value))}
              >
                <SelectTrigger data-testid="select-check-interval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 minute</SelectItem>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="10">Every 10 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every 1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableNotifications"
                checked={watch("enableNotifications")}
                onCheckedChange={(checked) => setValue("enableNotifications", checked as boolean)}
                data-testid="checkbox-enable-notifications"
              />
              <Label htmlFor="enableNotifications" className="text-sm">
                Enable email notifications
              </Label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleModalClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWebsiteMutation.isPending || updateWebsiteMutation.isPending}
                data-testid="button-submit"
              >
                {(createWebsiteMutation.isPending || updateWebsiteMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingWebsite ? "Update Website" : "Add Website"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}