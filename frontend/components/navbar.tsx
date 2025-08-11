'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Users } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="bg-white/60 backdrop-blur-lg shadow-xl rounded-xl fixed top-4 left-4 right-4 z-[10000] p-4">
      <div className="max-w-6xl mx-auto px-4 py-0">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-slate-900 tracking-tight hover:text-slate-700 transition-colors">
            <MapPin className="w-8 h-8 text-purple-500" />
            FoodTuber
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link href="/restaurants">
                <MapPin className="w-4 h-4" />
                Restaurants
              </Link>
            </Button>
            <Button asChild variant="ghost" className="flex items-center gap-2">
              <Link href="/influencers">
                <Users className="w-4 h-4" />
                Influencers
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}