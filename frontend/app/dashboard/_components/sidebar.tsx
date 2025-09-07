'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  FileText,
  Home,
  Bolt,
  Users,
  Video,
  Tag,
  Utensils,
  RefreshCw,
  Moon,
  Sun,
  EllipsisVertical,
  LogOut,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/contexts/auth-context';
import { signout } from '@/lib/actions/auth';
import { toast } from 'sonner';
import { DashedSpinner } from '@/components/dashed-spinner';

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Data Sync',
    href: '/dashboard/data-sync',
    icon: RefreshCw,
  },
  {
    title: 'Restaurants',
    href: '/dashboard/restaurants',
    icon: Utensils,
  },
  {
    title: 'Videos',
    href: '/dashboard/videos',
    icon: Video,
  },
  {
    title: 'Tags',
    href: '/dashboard/tags',
    icon: Tag,
  },
  {
    title: 'Listings',
    href: '/dashboard/listings',
    icon: FileText,
  },
  {
    title: 'Influencers',
    href: '/dashboard/influencers',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Bolt,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuth();

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
    try {
      await signout();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRedirect = (path: string) => {
    router.push(path);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Top Section - Branding */}
      <div className="p-4 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span className="font-bold text-orange-500 text-lg">
            FoodTuber Dashboard
          </span>
        </Link>
      </div>

      {/* Middle Section - Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start transition-all duration-200 ${
                    isActive 
                      ? 'bg-orange-500 text-primary-foreground hover:bg-orange-400 shadow-md' 
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section - Theme Toggle and User Menu */}
      <div className="p-4 border-t border-border/40 space-y-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start hover:bg-accent hover:text-accent-foreground transition-all duration-200"
        >
          {isDarkMode ? (
            <Sun className="mr-2 h-4 w-4 text-primary" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>

        {/* User Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              >
                <EllipsisVertical className="mr-2 h-4 w-4" />
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={handleSignout}
              >
                {isLoggingOut ? (
                  <DashedSpinner className="mr-2 h-4 w-4" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRedirect('/login')}
              className="w-full justify-start hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onClick={() => handleRedirect('/signup')}
              className="w-full bg-aqua-mist hover:bg-aqua-depth"
            >
              Register
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}