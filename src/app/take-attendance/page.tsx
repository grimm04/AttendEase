
"use client";

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, UserCheck, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

function TakeAttendanceContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationStatus, setConfirmationStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const userIdFromQuery = searchParams.get('userId');
    if (userIdFromQuery && /^\d+$/.test(userIdFromQuery)) {
      setUserId(userIdFromQuery);
    } else {
      setErrorMessage("Invalid or missing User ID in QR code.");
      setConfirmationStatus('error');
      setIsLoading(false);
      toast({
        title: "Invalid QR Code",
        description: "The scanned QR code does not contain a valid User ID.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (userId && confirmationStatus === 'idle') {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const confirmAttendance = async () => {
        try {
          const response = await fetch('/api/attendance/clock-in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: parseInt(userId), locationVerified: true }), // Assuming location is verified by QR scan
          });

          if (response.ok) {
            const data = await response.json();
            if (typeof window !== 'undefined') {
              localStorage.setItem('currentUserId', userId);
            }
            setConfirmationStatus('success');
            setSuccessMessage(data.message || `Attendance successfully recorded for User ID: ${userId}.`);
            toast({
              title: "Attendance Marked!",
              description: data.message || `Attendance successfully recorded for User ID: ${userId}.`,
              action: <CheckCircle className="text-green-500" />,
            });
          } else {
            // response.ok is false (e.g., 4xx, 5xx errors)
            let apiErrorMessage = `Failed to clock in. Status: ${response.status} ${response.statusText}`;
            try {
              const errorJson = await response.json(); 
              if (errorJson && errorJson.error) {
                apiErrorMessage = errorJson.error;
              }
            } catch (e) {
              // Failed to parse error response as JSON
              const errorText = await response.text();
              console.error(`API error response was not JSON (Status: ${response.status}). Body:`, errorText.substring(0, 500));
              if (errorText.toLowerCase().includes("<!doctype html>")) {
                apiErrorMessage = "The server returned an HTML error page. This usually indicates a server-side problem or an incorrect API URL.";
              } else if (errorText) {
                apiErrorMessage = `Server error (status ${response.status}): An unexpected response was received. Please check server logs.`;
              }
            }
            throw new Error(apiErrorMessage);
          }
        } catch (err: any) {
          console.error("Clock-in error caught in take-attendance page:", err);
          setErrorMessage(err.message || "An unexpected error occurred while marking attendance.");
          setConfirmationStatus('error');
          toast({
            title: "Clock-In Failed",
            description: err.message || "Could not record attendance. Please try again or check server logs.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      confirmAttendance();
    }
  }, [userId, toast, confirmationStatus]);

  const cardIcon = isLoading 
    ? <Loader2 className="h-10 w-10 text-primary mr-3 animate-spin" />
    : confirmationStatus === 'success' 
    ? <UserCheck className="h-10 w-10 text-green-500 mr-3" />
    : <XCircle className="h-10 w-10 text-destructive mr-3" />;

  const cardTitleText = isLoading
    ? "Processing Attendance..."
    : confirmationStatus === 'success'
    ? `Attendance Confirmed for User ID: ${userId}`
    : "Attendance Confirmation Failed";
  
  const cardDescriptionText = isLoading
    ? "Please wait while we record your attendance."
    : confirmationStatus === 'success'
    ? successMessage || "Your attendance has been successfully recorded."
    : errorMessage || "There was an issue processing your attendance.";

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
            {cardIcon}
            <h1 className="text-3xl sm:text-4xl font-bold">
              {isLoading ? "Confirming..." : confirmationStatus === 'success' ? "Attendance Marked" : "Error"}
            </h1>
        </div>
      </header>
      
      <main className="w-full max-w-lg">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-center justify-center">
              {cardTitleText}
            </CardTitle>
            <CardDescription className="text-center">
              {cardDescriptionText}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
             {isLoading && (
                <div className="flex justify-center my-6">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
             )}
             {confirmationStatus === 'success' && (
                 <img 
                  src="https://placehold.co/300x200.png" 
                  alt="Confirmation illustration" 
                  data-ai-hint="success checkmark"
                  className="mt-4 rounded-md shadow-sm mx-auto"
                />
             )}
            {confirmationStatus === 'error' && (
                 <img 
                  src="https://placehold.co/300x200.png" 
                  alt="Error illustration" 
                  data-ai-hint="error cross"
                  className="mt-4 rounded-md shadow-sm mx-auto"
                />
             )}

            {(confirmationStatus === 'success' || confirmationStatus === 'error') && !isLoading && (
              <>
                {confirmationStatus === 'success' && userId && (
                    <Link href={`/history?userId=${userId}`} passHref className="mt-6 block">
                        <Button variant="outline">View My Attendance History</Button>
                    </Link>
                )}
                <Link href="/" passHref className="mt-2 block">
                <Button className="w-full sm:w-auto">
                    Return to Home
                </Button>
                </Link>
              </>
            )}
             
          </CardContent>
        </Card>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}


export default function TakeAttendancePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> Loading...</div>}>
      <TakeAttendanceContent />
    </Suspense>
  );
}
