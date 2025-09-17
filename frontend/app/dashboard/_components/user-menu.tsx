import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Avatar component not available, using User icon instead
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/auth-context';
import { signout } from '@/lib/actions/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  isCollapsed: boolean;
  isMobile: boolean;
}

export const UserMenu = React.memo(function UserMenu({
  isCollapsed,
  isMobile,
}: UserMenuProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await signout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  const handleSettingsClick = useCallback(() => {
    router.push('/dashboard/settings');
  }, [router]);

  const buttonClassName = useMemo(() => cn(
    'w-full transition-all duration-300 ease-out transform hover:scale-105',
    'will-change-transform',
    !isMobile && isCollapsed ? 'justify-center' : 'justify-start'
  ), [isMobile, isCollapsed]);

  const iconClassName = useMemo(() => cn(
    'h-5 w-5',
    isMobile && 'h-4 w-4'
  ), [isMobile]);

  const textClassName = useMemo(() => cn(
    'transition-all duration-300 ease-out whitespace-nowrap overflow-hidden',
    'will-change-opacity will-change-transform',
    (!isCollapsed || isMobile)
      ? 'opacity-100 translate-x-0 max-w-none'
      : 'opacity-0 translate-x-2 max-w-0'
  ), [isCollapsed, isMobile]);

  const chevronClassName = useMemo(() => cn(
    'h-4 w-4 transition-all duration-200 ease-out flex-shrink-0 ml-auto',
    (!isCollapsed || isMobile) ? 'opacity-100' : 'opacity-0'
  ), [isCollapsed, isMobile]);

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={buttonClassName}
            aria-label="User menu"
            disabled={isLoggingOut}
          >
            <User className={iconClassName} />
            <span className={textClassName}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </span>
            <ChevronDown className={chevronClassName} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Fallback for when user is not available
  return (
    <Button
      variant="ghost"
      onClick={() => router.push('/login')}
      className={buttonClassName}
      aria-label="Sign in"
    >
      <User className={cn(
        'h-4 w-4 transition-all duration-200 ease-out flex-shrink-0',
        (!isCollapsed || isMobile) && 'mr-2'
      )} />
      <span className={textClassName}>
        Sign in
      </span>
    </Button>
  );
});