import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUISettings } from "@/lib/ui-settings";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Mail, 
  Bell, 
  Clock, 
  Globe, 
  Shield,
  Database,
  Palette,
  Moon,
  Sun,
  Monitor,
  Save,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Key,
  Loader2,
  Phone
} from "lucide-react";
import type { Website } from "@shared/schema";

interface EmailSettings {
  fromEmail: string;
  toEmail: string;
  enabled: boolean;
}

interface SMSSettings {
  phoneNumber: string;
  enabled: boolean;
  enableCriticalOnly: boolean;
}

interface MonitoringSettings {
  defaultCheckInterval: number;
  maxResponseTime: number;
  enableGlobalNotifications: boolean;
  retryAttempts: number;
}

interface UISettings {
  theme: "light" | "dark" | "system";
  compactMode: boolean;
  showAdvancedMetrics: boolean;
}

export default function Settings() {
  const { theme, compactMode, showAdvancedMetrics, setTheme, toggleCompact, toggleAdvanced } = useUISettings();
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testSMSLoading, setTestSMSLoading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: websites = [] } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
  });

  // Load persisted settings
  const { data: savedSettings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  // Form for email settings
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    setValue: setEmailValue,
    watch: watchEmail,
    formState: { errors: emailErrors },
    reset: resetEmailForm,
  } = useForm<EmailSettings>({
    defaultValues: {
      fromEmail: "notifications@webmonitor.com",
      toEmail: "",
      enabled: true,
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      resetEmailForm({
        fromEmail: savedSettings["email.fromEmail"] || "notifications@webmonitor.com",
        toEmail: savedSettings["email.notificationEmail"] || "",
        enabled: savedSettings["email.enableNotifications"] !== "false",
      });
    }
  }, [savedSettings, resetEmailForm]);

  // Form for monitoring settings
  const {
    register: registerMonitoring,
    handleSubmit: handleMonitoringSubmit,
    setValue: setMonitoringValue,
    watch: watchMonitoring,
    formState: { errors: monitoringErrors },
    reset: resetMonitoringForm,
  } = useForm<MonitoringSettings>({
    defaultValues: {
      defaultCheckInterval: 5,
      maxResponseTime: 30000,
      enableGlobalNotifications: true,
      retryAttempts: 3,
    },
  });

  // Update monitoring form values when settings are loaded
  useEffect(() => {
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      resetMonitoringForm({
        defaultCheckInterval: parseInt(savedSettings["monitoring.defaultCheckInterval"] || "5"),
        maxResponseTime: parseInt(savedSettings["monitoring.slowResponseThreshold"] || "30000"),
        enableGlobalNotifications: savedSettings["monitoring.enableSlowResponseAlerts"] !== "false",
        retryAttempts: parseInt(savedSettings["monitoring.retryAttempts"] || "3"),
      });
    }
  }, [savedSettings, resetMonitoringForm]);

  // Form for SMS settings
  const {
    register: registerSMS,
    handleSubmit: handleSMSSubmit,
    setValue: setSMSValue,
    watch: watchSMS,
    formState: { errors: smsErrors },
    reset: resetSMSForm,
  } = useForm<SMSSettings>({
    defaultValues: {
      phoneNumber: "",
      enabled: false,
      enableCriticalOnly: false,
    },
  });

  // Update SMS form values when settings are loaded
  useEffect(() => {
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      resetSMSForm({
        phoneNumber: savedSettings["sms.phoneNumber"] || "",
        enabled: savedSettings["sms.enableNotifications"] === "true",
        enableCriticalOnly: savedSettings["sms.enableCriticalOnly"] === "true",
      });
    }
  }, [savedSettings, resetSMSForm]);

  const saveEmailSettings = useMutation({
    mutationFn: async (data: EmailSettings) => {
      await apiRequest("PUT", "/api/settings/email", {
        enableNotifications: data.enabled,
        fromEmail: data.fromEmail,
        notificationEmail: data.toEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success", 
        description: "Email settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive",
      });
    },
  });

  const saveMonitoringSettings = useMutation({
    mutationFn: async (data: MonitoringSettings) => {
      await apiRequest("PUT", "/api/settings/monitoring", {
        defaultCheckInterval: data.defaultCheckInterval,
        enableSlowResponseAlerts: data.enableGlobalNotifications,
        slowResponseThreshold: data.maxResponseTime,
        retryAttempts: data.retryAttempts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Monitoring settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save monitoring settings",
        variant: "destructive",
      });
    },
  });

  const saveSMSSettings = useMutation({
    mutationFn: async (data: SMSSettings) => {
      await apiRequest("PUT", "/api/settings/sms", {
        enableNotifications: data.enabled,
        phoneNumber: data.phoneNumber,
        enableCriticalOnly: data.enableCriticalOnly,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "SMS settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save SMS settings",
        variant: "destructive",
      });
    },
  });

  const testEmailNotification = async () => {
    setTestEmailLoading(true);
    try {
      await apiRequest("POST", "/api/settings/test-email");
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const testSMSNotification = async () => {
    setTestSMSLoading(true);
    try {
      const response = await apiRequest("POST", "/api/settings/test-sms");
      toast({
        title: "Success",
        description: response.message || "Test SMS sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send test SMS",
        variant: "destructive",
      });
    } finally {
      setTestSMSLoading(false);
    }
  };

  const onEmailSubmit = (data: EmailSettings) => {
    saveEmailSettings.mutate(data);
  };

  const onMonitoringSubmit = (data: MonitoringSettings) => {
    saveMonitoringSettings.mutate(data);
  };

  const toggleTheme = (newTheme: "light" | "dark" | "system") => {
    // Delegate to UISettings provider
    setTheme(newTheme);
    toast({ title: "Success", description: "Theme updated successfully" });
  };

  // Calculate system statistics
  const getSystemStats = () => {
    const totalWebsites = websites.length;
    const notificationsEnabled = websites.filter(w => w.enableNotifications).length;
    const avgCheckInterval = websites.length > 0 
      ? Math.round(websites.reduce((sum, w) => sum + w.checkInterval, 0) / websites.length)
      : 0;

    return {
      totalWebsites,
      notificationsEnabled,
      avgCheckInterval,
    };
  };

  const stats = getSystemStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your monitoring preferences and system settings</p>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="stat-websites">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stats.totalWebsites}</h3>
              <p className="text-muted-foreground text-sm">Monitored Websites</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-notifications">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <Badge variant={stats.notificationsEnabled === stats.totalWebsites ? "default" : "secondary"}>
                {stats.notificationsEnabled}/{stats.totalWebsites}
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stats.notificationsEnabled}</h3>
              <p className="text-muted-foreground text-sm">Notifications Enabled</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-intervals">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <Badge variant="outline">{stats.avgCheckInterval}min</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{stats.avgCheckInterval}</h3>
              <p className="text-muted-foreground text-sm">Avg Check Interval</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <Card data-testid="card-email-settings">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email alerts when websites go up or down
                      </p>
                    </div>
                    <Switch
                      checked={watchEmail("enabled")}
                      onCheckedChange={(checked) => setEmailValue("enabled", checked)}
                      data-testid="switch-email-enabled"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email Address</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        placeholder="notifications@yourdomain.com"
                        {...registerEmail("fromEmail", {
                          required: "From email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        data-testid="input-from-email"
                      />
                      {emailErrors.fromEmail && (
                        <p className="text-sm text-destructive">
                          {emailErrors.fromEmail.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="toEmail">Notification Email Address</Label>
                      <Input
                        id="toEmail"
                        type="email"
                        placeholder="admin@yourdomain.com"
                        {...registerEmail("toEmail", {
                          required: "Notification email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        data-testid="input-to-email"
                      />
                      {emailErrors.toEmail && (
                        <p className="text-sm text-destructive">
                          {emailErrors.toEmail.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium">SendGrid API Key</h4>
                      <p className="text-sm text-muted-foreground">
                        Your SendGrid API key is configured and ready to send emails
                      </p>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testEmailNotification}
                    disabled={testEmailLoading || !watchEmail("enabled")}
                    data-testid="button-test-email"
                  >
                    {testEmailLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="mr-2 h-4 w-4" />
                    )}
                    Send Test Email
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveEmailSettings.isPending}
                    data-testid="button-save-email"
                  >
                    {saveEmailSettings.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Email Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <Card data-testid="card-sms-settings">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="mr-2 h-5 w-5" />
                SMS Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSMSSubmit((data) => saveSMSSettings.mutate(data))} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive SMS alerts when websites go down or come back up
                      </p>
                    </div>
                    <Switch
                      checked={watchSMS("enabled")}
                      onCheckedChange={(checked) => setSMSValue("enabled", checked)}
                      data-testid="switch-sms-enabled"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1234567890"
                        {...registerSMS("phoneNumber", {
                          required: "Phone number is required",
                          pattern: {
                            value: /^\+?[\d\s\-\(\)]+$/,
                            message: "Enter a valid phone number"
                          }
                        })}
                        data-testid="input-phone-number"
                      />
                      {smsErrors.phoneNumber && (
                        <p className="text-sm text-destructive">
                          {smsErrors.phoneNumber.message}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Include country code (e.g., +1 for US)
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Critical Alerts Only</Label>
                        <p className="text-sm text-muted-foreground">
                          Send SMS only for website down events (not recovery)
                        </p>
                      </div>
                      <Switch
                        checked={watchSMS("enableCriticalOnly")}
                        onCheckedChange={(checked) => setSMSValue("enableCriticalOnly", checked)}
                        data-testid="switch-sms-critical-only"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium">Twilio SMS Service</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure Twilio credentials in environment variables
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Setup Required
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testSMSNotification}
                    disabled={testSMSLoading || !watchSMS("enabled") || !watchSMS("phoneNumber")}
                    data-testid="button-test-sms"
                  >
                    {testSMSLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="mr-2 h-4 w-4" />
                    )}
                    Send Test SMS
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveSMSSettings.isPending}
                    data-testid="button-save-sms"
                  >
                    {saveSMSSettings.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save SMS Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card data-testid="card-monitoring-settings">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Monitoring Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMonitoringSubmit(onMonitoringSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultCheckInterval">Default Check Interval (minutes)</Label>
                      <Select
                        value={watchMonitoring("defaultCheckInterval")?.toString()}
                        onValueChange={(value) => setMonitoringValue("defaultCheckInterval", parseInt(value))}
                      >
                        <SelectTrigger data-testid="select-default-interval">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Every 1 minute</SelectItem>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="10">Every 10 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every 1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxResponseTime">Max Response Time (ms)</Label>
                      <Input
                        id="maxResponseTime"
                        type="number"
                        min="1000"
                        max="60000"
                        step="1000"
                        {...registerMonitoring("maxResponseTime", {
                          required: "Max response time is required",
                          min: { value: 1000, message: "Minimum 1000ms" },
                          max: { value: 60000, message: "Maximum 60000ms" }
                        })}
                        data-testid="input-max-response-time"
                      />
                      {monitoringErrors.maxResponseTime && (
                        <p className="text-sm text-destructive">
                          {monitoringErrors.maxResponseTime.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Select
                      value={watchMonitoring("retryAttempts")?.toString()}
                      onValueChange={(value) => setMonitoringValue("retryAttempts", parseInt(value))}
                    >
                      <SelectTrigger data-testid="select-retry-attempts">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 attempt</SelectItem>
                        <SelectItem value="2">2 attempts</SelectItem>
                        <SelectItem value="3">3 attempts</SelectItem>
                        <SelectItem value="5">5 attempts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Global Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable notifications for all websites by default
                      </p>
                    </div>
                    <Switch
                      checked={watchMonitoring("enableGlobalNotifications")}
                      onCheckedChange={(checked) => setMonitoringValue("enableGlobalNotifications", checked)}
                      data-testid="switch-global-notifications"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={saveMonitoringSettings.isPending}
                    data-testid="button-save-monitoring"
                  >
                    {saveMonitoringSettings.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Monitoring Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card data-testid="card-appearance-settings">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Appearance & UI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose how the interface looks
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => toggleTheme("light")}
                      className="h-20 flex-col"
                      data-testid="button-theme-light"
                    >
                      <Sun className="h-6 w-6 mb-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => toggleTheme("dark")}
                      className="h-20 flex-col"
                      data-testid="button-theme-dark"
                    >
                      <Moon className="h-6 w-6 mb-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => toggleTheme("system")}
                      className="h-20 flex-col"
                      data-testid="button-theme-system"
                    >
                      <Monitor className="h-6 w-6 mb-2" />
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use smaller spacing and condensed layouts
                      </p>
                    </div>
                    <Switch data-testid="switch-compact-mode" checked={compactMode} onCheckedChange={(checked) => toggleCompact(Boolean(checked))} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Advanced Metrics</Label>
                      <p className="text-sm text-muted-foreground">
                        Display detailed performance metrics on dashboard
                      </p>
                    </div>
                    <Switch data-testid="switch-advanced-metrics" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card data-testid="card-advanced-settings">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-medium text-destructive">Danger Zone</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        These actions cannot be undone. Please proceed with caution.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Clear All Monitoring Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Remove all monitoring results and history
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" data-testid="button-clear-data">
                      Clear Data
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Reset All Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Restore all settings to their default values
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" data-testid="button-reset-settings">
                      Reset Settings
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Export Configuration</h4>
                      <p className="text-sm text-muted-foreground">
                        Download your current settings and website list
                      </p>
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-export-config">
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-system-info">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build:</span>
                  <span>2024.09.10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage:</span>
                  <span>In-Memory</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Service:</span>
                  <span>SendGrid</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
