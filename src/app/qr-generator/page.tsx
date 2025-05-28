
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, QrCode as QrCodeIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function QrGeneratorPage() {
  const [qrValue, setQrValue] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrValue(window.location.origin + '/take-attendance');
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <header className="mb-8 w-full max-w-2xl">
        <div className="flex justify-start w-full">
          <Link href="/" passHref>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center mb-2">
          <QrCodeIcon className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Attendance QR Code</h1>
        </div>
        <p className="text-center text-muted-foreground">Display this QR code for users to scan and mark attendance.</p>
      </header>

      <main className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Scan to Attend</CardTitle>
            <CardDescription>
              Ask attendees to scan this QR code with their mobile device.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            {qrValue ? (
              <div className="p-4 bg-white rounded-lg shadow-md">
                <QRCode value={qrValue} size={256} level="H" />
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Skeleton className="h-[256px] w-[256px] rounded-lg bg-muted" />
                <p className="text-muted-foreground">Generating QR Code...</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center px-4">
              Scanning this code will direct users to a page to confirm their attendance.
            </p>
          </CardContent>
        </Card>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
