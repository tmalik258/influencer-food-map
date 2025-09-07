'use client';

import { AuthProvider } from '@/lib/contexts/auth-context';
import { Sidebar } from './_components/sidebar';
import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex">
          <aside className="hidden w-64 overflow-hidden fixed m-2 rounded-lg inset-y-0 left-0 border border-border/40 bg-background/95 backdrop-blur-xl md:block shadow-xl z-50">
            <div className="h-full bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-xl">
              <Sidebar />
            </div>
          </aside>
          <main className="flex-1 overflow-hidden md:pl-64">
            <div className="h-screen overflow-y-auto p-12">
              {children}
            </div>
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}