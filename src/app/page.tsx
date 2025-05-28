
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut, MapPin, History, LayoutDashboard, CheckCircle, AlertCircle, Users, QrCode } from 'lucide-react';
import CurrentDateTime from '@/components/CurrentDateTime';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [lastActionTime, setLastActionTime] = useState<Date | null>(null);
  const [statusMessage, setStatusMessage] = useState("You are currently clocked out.");
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Persist clock-in state (optional, using localStorage for demo)
    const storedClockInStatus = localStorage.getItem('isClockedIn');
    if (storedClockInStatus === 'true') {
      setIsClockedIn(true);
      const storedActionTime = localStorage.getItem('lastActionTime');
      if (storedActionTime) {
        setLastActionTime(new Date(storedActionTime));
        setStatusMessage(`Clocked in since ${new Date(storedActionTime).toLocaleTimeString()}`);
      }
    }
    const storedLocationVerified = localStorage.getItem('isLocationVerified');
    if (storedLocationVerified === 'true') {
      setIsLocationVerified(true);
    }
  }, []);

  const handleClockIn = () => {
    if (!isLocationVerified) {
      toast({
        title: "Location Not Verified",
        description: "Please verify your location before clocking in.",
        variant: "destructive",
      });
      return;
    }
    const now = new Date();
    setIsClockedIn(true);
    setLastActionTime(now);
    setStatusMessage(`Clocked in at ${now.toLocaleTimeString()}`);
    localStorage.setItem('isClockedIn', 'true');
    localStorage.setItem('lastActionTime', now.toISOString());
    toast({
      title: "Clocked In",
      description: `Successfully clocked in at ${now.toLocaleTimeString()}`,
      action: <CheckCircle className="text-green-500" />,
    });
  };

  const handleClockOut = () => {
    const now = new Date();
    setIsClockedIn(false);
    setLastActionTime(now);
    setStatusMessage(`Clocked out at ${now.toLocaleTimeString()}.`);
    localStorage.setItem('isClockedIn', 'false');
    localStorage.setItem('lastActionTime', now.toISOString());
    localStorage.removeItem('isLocationVerified'); // Reset location verification on clock out
    setIsLocationVerified(false);
    toast({
      title: "Clocked Out",
      description: `Successfully clocked out at ${now.toLocaleTimeString()}`,
      action: <LogOut className="text-red-500" />,
    });
  };

  const handleVerifyLocation = () => {
    // Simulate location verification
    setIsLocationVerified(true);
    localStorage.setItem('isLocationVerified', 'true');
    toast({
      title: "Location Verified",
      description: "Your location has been successfully verified (simulated).",
      action: <MapPin className="text-blue-500" />,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
           <Users className="h-12 w-12 text-primary mr-3" />
           <h1 className="text-4xl sm:text-5xl font-bold text-primary">AttendEase</h1>
        </div>
        <p className="text-muted-foreground text-lg">Your simple and reliable attendance solution.</p>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        <CurrentDateTime />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              {isClockedIn ? <CheckCircle className="mr-2 h-6 w-6 text-green-500" /> : <AlertCircle className="mr-2 h-6 w-6 text-yellow-500" />}
              Attendance Status
            </CardTitle>
            <CardDescription>{statusMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            {!isClockedIn ? (
              <Button onClick={handleClockIn} className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" disabled={!isLocationVerified}>
                <LogIn className="mr-2 h-5 w-5" /> Clock In
              </Button>
            ) : (
              <Button onClick={handleClockOut} className="w-full sm:w-auto flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" size="lg">
                <LogOut className="mr-2 h-5 w-5" /> Clock Out
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <MapPin className="mr-2 h-6 w-6 text-primary" />
              Location Verification
            </CardTitle>
            <CardDescription>
              {isLocationVerified ? "Location verified." : "Please verify your location to clock in."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleVerifyLocation} 
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground" 
              size="lg"
              disabled={isLocationVerified || isClockedIn}
            >
              {isLocationVerified ? <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> : <MapPin className="mr-2 h-5 w-5" /> }
              {isLocationVerified ? "Location Verified" : "Verify Location (Simulated)"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Navigation</CardTitle>
            <CardDescription>Access other features of AttendEase.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/history" passHref>
              <Button variant="outline" className="w-full" size="lg">
                <History className="mr-2 h-5 w-5" /> View Attendance History
              </Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button variant="outline" className="w-full" size="lg">
                <LayoutDashboard className="mr-2 h-5 w-5" /> Reporting Dashboard
              </Button>
            </Link>
            <Link href="/qr-generator" passHref>
              <Button variant="outline" className="w-full col-span-1 sm:col-span-2" size="lg">
                <QrCode className="mr-2 h-5 w-5" /> Generate Attendance QR Code
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
