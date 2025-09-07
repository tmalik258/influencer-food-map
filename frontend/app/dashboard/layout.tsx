'use client';

import { DashboardNavbar } from './_components/dashboard-navbar';
import { Sidebar } from './_components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <aside className="hidden w-64 border-r border-border/40 bg-background/60 backdrop-blur-xl md:block shadow-lg">
          <div className="h-full bg-gradient-to-b from-background/80 to-background/60 backdrop-blur-xl">
            <Sidebar className="h-full" />
          </div>
        </aside>
        <main className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}