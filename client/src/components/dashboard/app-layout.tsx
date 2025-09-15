import React, { useState, PropsWithChildren } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function AppLayout({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Mobile toggle */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Button size="icon" variant="ghost" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="p-6 overflow-y-auto h-[100vh]">
          {children}
        </div>
      </main>
    </div>
  );
}
