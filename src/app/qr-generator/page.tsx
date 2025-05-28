
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, QrCode as QrCodeIcon, Download, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

export default function QrGeneratorPage() {
  const [userId, setUserId] = useState<string>('');
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (baseUrl && userId) {
      setQrValue(`${baseUrl}/take-attendance?userId=${encodeURIComponent(userId)}`);
    } else {
      setQrValue(null);
    }
  }, [userId, baseUrl]);

  const handleDownloadQrCode = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
        let downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `attendease-qr-user-${userId || 'general'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove(); // Use remove() for safer removal
        toast({
          title: "QR Code Downloading",
          description: "Your QR code image is being downloaded.",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not find QR code canvas to download.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // QR value is updated via useEffect when userId changes
    if (!userId) {
        toast({
            title: "User ID Required",
            description: "Please enter a User ID to generate a QR code.",
            variant: "destructive"
        });
    }
  };

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
        <p className="text-center text-muted-foreground">Generate a unique QR code for a specific User ID.</p>
      </header>

      <main className="w-full max-w-md space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> Enter User ID</CardTitle>
            <CardDescription>
              Provide a User ID to generate a personalized attendance QR code.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="e.g., 123"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  pattern="\d*"
                  title="Please enter a numeric User ID."
                />
              </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={!userId}>
                    Generate / Update QR Code
                </Button>
            </CardFooter>
          </form>
        </Card>
        
        {userId && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Scan to Attend (User ID: {userId})</CardTitle>
              <CardDescription>
                Ask attendee to scan this QR code with their mobile device.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              {qrValue ? (
                <div ref={qrCodeRef} className="p-4 bg-white rounded-lg shadow-md">
                  <QRCode value={qrValue} size={256} level="H" />
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Skeleton className="h-[256px] w-[256px] rounded-lg bg-muted" />
                  <p className="text-muted-foreground">Generating QR Code for User ID: {userId}...</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center px-4">
                Scanning this code will direct the user to confirm attendance for User ID: {userId}.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleDownloadQrCode} className="w-full" disabled={!qrValue}>
                <Download className="mr-2 h-4 w-4" /> Download QR Code
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
