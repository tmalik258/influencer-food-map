'use client';

import { useState } from 'react';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { DashboardRealtimeProvider } from '@/lib/contexts/dashboard-realtime-context';
import { Sidebar } from './_components/sidebar';
import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardRealtimeProvider>
          <div className="min-h-screen bg-background flex">
            <Sidebar 
              isMobileOpen={isMobileSidebarOpen}
              onMobileToggle={toggleMobileSidebar}
              className="fixed m-2 rounded-lg inset-y-0 left-0 shadow-xl z-50"
            />
            <main className="flex-1 overflow-hidden md:ml-20">
              <div className="min-h-screen overflow-y-auto p-4 md:pt-4 md:p-12">
                {children}
              </div>
            </main>
          </div>
        </DashboardRealtimeProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}