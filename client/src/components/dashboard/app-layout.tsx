import { useState, PropsWithChildren } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";

export function AppLayout({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-hidden">
        <div className="p-6 overflow-y-auto h-[100vh]">
          {children}
        </div>
      </main>
    </div>
  );
}
