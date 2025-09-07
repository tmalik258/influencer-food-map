'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

export function DashboardStatusBar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>{currentTime.toLocaleDateString()}</span>
        <Clock className="h-4 w-4 ml-4" />
        <span>{currentTime.toLocaleTimeString()}</span>
      </div>
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        System Online
      </Badge>
    </div>
  );
}