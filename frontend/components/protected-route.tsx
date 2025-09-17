"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { ProtectedRouteProps } from "@/lib/types/auth";
import { Card, CardContent } from "@/components/ui/card";
import { MessageLoading } from "./ui/message-loading";

// Unauthorized access component
function UnauthorizedAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page. Admin privileges
            are required.
          </p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Redirect if not authenticated
    if (!user) {
      console.log("User not authenticated, redirecting to:", redirectTo);
      router.push(redirectTo);
      return;
    }

    // // Redirect if not admin
    // if (!isAdmin()) {
    //   console.log('User not admin, redirecting to:', redirectTo);
    //   router.push(redirectTo);
    //   return;
    // }
  }, [user, loading, router, redirectTo]);

  // Show loading state
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-dvh">
          <MessageLoading />
        </div>
      )
    );
  }

  // Show unauthorized if no user
  if (!user) {
    return <UnauthorizedAccess />;
  }

  // Show unauthorized if not admin
  // if (!isAdmin()) {
  //   return <UnauthorizedAccess />;
  // }

  // Render protected content
  return <>{children}</>;
}

export default ProtectedRoute;
