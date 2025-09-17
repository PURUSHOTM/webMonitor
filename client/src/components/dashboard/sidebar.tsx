import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bell,
  Globe,
  Settings,
  TrendingUp,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: TrendingUp, current: true },
  { name: "Websites", href: "/websites", icon: Globe, current: false },
  { name: "Analytics", href: "/analytics", icon: BarChart3, current: false },
  { name: "Notifications", href: "/notifications", icon: Bell, current: false },
  { name: "Settings", href: "/settings", icon: Settings, current: false },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className={cn(
      "bg-card border-r border-border h-screen sticky top-0 transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn("p-4", collapsed ? "px-2" : "px-6") }>
        <div className={cn("flex items-center mb-6", collapsed ? "justify-center" : "justify-between") }>
          <div className={cn("flex items-center space-x-2", collapsed ? "space-x-0" : "") }>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && <span className="text-xl font-bold">WebMonitor Pro</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(collapsed ? "hidden" : "flex")}
          >
            <ChevronsLeft className="h-5 w-5" />
          </Button>
        </div>
        {collapsed && (
          <div className="flex justify-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed ? "justify-center px-2" : ""
                )}
                data-testid={`link-${item.name.toLowerCase()}`}
                aria-label={item.name}
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className={cn("p-4", collapsed ? "px-2" : "px-6") }>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.href = "/login";
          }}
        >
          <Button variant="outline" className={cn("w-full", collapsed ? "px-2" : "")}>Logout</Button>
        </form>
      </div>
    </aside>
  );
}
