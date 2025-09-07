'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { EllipsisVertical, Menu, Moon, Sun } from 'lucide-react';
import { Sidebar } from './sidebar';
import { createClient } from '@/lib/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { signout } from '@/lib/actions/auth';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashedSpinner } from '@/components/dashed-spinner';
import { useRouter } from 'next/navigation';

export function DashboardNavbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUser(data.user);
    })();
  }, [supabase.auth]);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

   const handleRedirect = (path: string) => {
    router.push(path);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignout = async () => {
    setIsLoggingOut(true);
    const result = await signout();
    if (result?.error) {
      toast.error(result.error);
    }
    setIsLoggingOut(false);
  };

  return (
    <header className="sticky top-2 z-50 ml-2 w-[calc(100vw-1rem)] border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-lg rounded-md">
      <div className="container mx-auto flex h-16 items-center">
        <div className="hidden md:flex">
          <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <span className="hidden font-bold sm:inline-block text-foreground">
              FoodTuber Dashboard
            </span>
          </Link>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-background/95 backdrop-blur-xl border-border/40">
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search can be added here later */}
          </div>
          <nav className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 px-0 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-primary" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </nav>
          {user ? (
            // Admin Dropdown
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none cursor-pointer">
                <span className="text-gray-700 hidden md:block">
                  <EllipsisVertical className="h-4 w-4" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!all-[initial]">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem> */}
                {/* <DropdownMenuSeparator /> */}
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={handleSignout}
                >
                  {isLoggingOut && <DashedSpinner className="mr-2" />}
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Login buttons
            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                onClick={() => handleRedirect("/login")}
                className="text-gray-700 md:hover:text-aqua-mist max-md:px-4 max-md:py-2 max-md:rounded-md max-md:bg-aqua-mist max-md:hover:bg-aqua-depth max-md:text-white transition-colors cursor-pointer text-sm md:text-base px-2 md:px-0"
              >
                Log in
              </button>
              <Button
                onClick={() => handleRedirect("/signup")}
                className="bg-aqua-mist hover:bg-aqua-depth cursor-pointer text-sm md:text-base px-3 md:px-4 py-2 max-md:hidden"
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}