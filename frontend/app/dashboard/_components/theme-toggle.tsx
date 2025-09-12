'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  isCollapsed: boolean;
  isMobile: boolean;
}

export const ThemeToggle = React.memo(function ThemeToggle({
  isCollapsed,
  isMobile,
}: ThemeToggleProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = theme === 'dark' || (!theme && systemPrefersDark);
    
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newTheme);
  }, [isDarkMode]);

  const buttonClassName = useMemo(() => cn(
    'w-full transition-all duration-300 ease-out transform hover:scale-105',
    'will-change-transform',
    !isMobile && isCollapsed ? 'justify-center' : 'justify-start'
  ), [isMobile, isCollapsed]);

  const iconClassName = useMemo(() => cn(
    'h-4 w-4 transition-all duration-200 ease-out flex-shrink-0',
    (!isCollapsed || isMobile) && 'mr-2'
  ), [isCollapsed, isMobile]);

  const textClassName = useMemo(() => cn(
    'transition-all duration-300 ease-out whitespace-nowrap overflow-hidden',
    'will-change-opacity will-change-transform',
    (!isCollapsed || isMobile)
      ? 'opacity-100 translate-x-0 max-w-none'
      : 'opacity-0 translate-x-2 max-w-0'
  ), [isCollapsed, isMobile]);

  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      className={buttonClassName}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className={iconClassName} />
      ) : (
        <Moon className={iconClassName} />
      )}
      <span className={textClassName}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </span>
    </Button>
  );
});