
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, ArrowLeft, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function TakeAttendancePage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceConfirmedForUser, setAttendanceConfirmedForUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-fill User ID if already stored
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleConfirmAttendance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!userId || isNaN(parseInt(userId))) {
      toast({
        title: "Invalid User ID",
        description: "Please enter a valid numeric User ID.",
        variant: "destructive",
      });
      setError("Please enter a valid numeric User ID.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: parseInt(userId), locationVerified: true }), // Assuming location is verified by QR scan
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to clock in. Status: ${response.status}`);
      }

      localStorage.setItem('currentUserId', userId);
      setAttendanceConfirmedForUser(userId);
      toast({
        title: "Attendance Marked!",
        description: `Attendance successfully recorded for User ID: ${userId}.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (err: any) {
      console.error("Clock-in error:", err);
      setError(err.message || "An unexpected error occurred.");
      toast({
        title: "Clock-In Failed",
        description: err.message || "Could not record attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <header className="mb-8 w-full max-w-2xl text-center">
         <div className="flex justify-start w-full">
          <Link href="/" passHref>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center mb-2">
            <UserCheck className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">Confirm Attendance</h1>
        </div>
        <p className="text-muted-foreground">Enter your User ID to mark your attendance.</p>
      </header>
      
      <main className="w-full max-w-lg">
        <Card className="shadow-lg">
          {!attendanceConfirmedForUser ? (
            <>
              <CardHeader>
                <CardTitle>Identify Yourself</CardTitle>
                <CardDescription>
                  Please enter your User ID to confirm your presence.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleConfirmAttendance}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      type="text"
                      placeholder="Enter your User ID (e.g., 1)"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      disabled={isLoading}
                      pattern="\d*"
                      title="Please enter a numeric User ID."
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive flex items-center">
                      <AlertTriangle className="mr-1 h-4 w-4" /> {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</>
                    ) : (
                      "Confirm Attendance"
                    )}
                  </Button>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
                  Attendance Confirmed!
                </CardTitle>
                <CardDescription>
                  Your attendance has been successfully recorded for User ID: {attendanceConfirmedForUser}.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                 <img 
                  src="https://placehold.co/300x200.png" 
                  alt="Confirmation illustration" 
                  data-ai-hint="success checkmark"
                  className="mt-4 rounded-md shadow-sm mx-auto"
                />
                 <Link href="/history" passHref className="mt-6 block">
                  <Button variant="outline">View My Attendance History</Button>
                </Link>
                <Link href="/" passHref className="mt-2 block">
                  <Button className="w-full sm:w-auto">
                    Return to Home
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
