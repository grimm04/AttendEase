
"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, QrCodeScanned } from 'lucide-react'; // QrCodeScanned might not exist, let's use a generic icon
import { useToast } from "@/hooks/use-toast";

export default function TakeAttendancePage() {
  const { toast } = useToast();

  useEffect(() => {
    // Simulate marking attendance and show a toast
    // In a real app, you would make an API call here to record attendance
    toast({
      title: "Attendance Marked!",
      description: "Your attendance has been successfully recorded via QR scan.",
      action: <CheckCircle className="text-green-500" />,
    });
  }, [toast]);

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
            <CheckCircle className="h-10 w-10 text-primary mr-3" /> {/* Using CheckCircle as a placeholder for QR scan success */}
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">Attendance Confirmation</h1>
        </div>
        <p className="text-muted-foreground">Your attendance has been processed.</p>
      </header>
      
      <main className="w-full max-w-lg">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
              Successfully Scanned!
            </CardTitle>
            <CardDescription>
              Your attendance has been noted. Thank you!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              This page confirms that the QR code was successfully scanned. 
              In a full application, this would trigger the clock-in process.
            </p>
            <img 
              src="https://placehold.co/300x200.png" 
              alt="Confirmation illustration" 
              data-ai-hint="success checkmark"
              className="mt-4 rounded-md shadow-sm mx-auto"
            />
             <Link href="/" passHref className="mt-6 block">
              <Button className="w-full sm:w-auto">
                Return to Home
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
