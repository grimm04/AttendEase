
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from 'lucide-react';

const CurrentDateTime: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client-side
    setCurrentDateTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Empty dependency array ensures this runs once on mount and then sets up interval

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Current Date & Time</CardTitle>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {currentDateTime ? (
          <>
            <div className="text-2xl font-bold">{formatTime(currentDateTime)}</div>
            <p className="text-xs text-muted-foreground">{formatDate(currentDateTime)}</p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">Loading...</div>
            <p className="text-xs text-muted-foreground">Fetching date...</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentDateTime;
