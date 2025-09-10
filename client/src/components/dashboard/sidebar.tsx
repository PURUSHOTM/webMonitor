import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  Globe,
  Settings,
  TrendingUp
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: TrendingUp, current: true },
  { name: "Websites", href: "/websites", icon: Globe, current: false },
  { name: "Analytics", href: "/analytics", icon: BarChart3, current: false },
  { name: "Notifications", href: "/notifications", icon: Bell, current: false },
  { name: "Settings", href: "/settings", icon: Settings, current: false },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">WebMonitor Pro</span>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                data-testid={`link-${item.name.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
