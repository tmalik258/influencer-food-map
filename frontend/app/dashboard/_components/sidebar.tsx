'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  FileText,
  Home,
  Settings,
  Users,
  Video,
  Tag,
  MapPin,
  RefreshCw,
} from 'lucide-react';

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
    icon: MapPin,
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
    icon: Settings,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={`pb-12 ${className}`}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
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
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md' 
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
    </div>
  );
}