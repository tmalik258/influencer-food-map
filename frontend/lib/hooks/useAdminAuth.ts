"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8020";

interface AdminUser {
  id: number;
  email: string;
  is_admin: boolean;
}

interface UseAdminAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;
      
      // Check if user is admin
      if (userData.is_admin) {
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        // Clear non-admin token
        localStorage.removeItem("token");
        localStorage.removeItem("admin_token");
      }
    } catch (error: any) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUser(null);
      
      // Clear invalid token
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_token");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect to login if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return {
    isAuthenticated,
    isLoading,
    user,
    logout,
    checkAuth,
  };
}