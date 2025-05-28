
"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Camera, AlertTriangle, CheckCircle, Loader2, VideoOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const QR_SCANNER_ELEMENT_ID = "qr-reader";

export default function ScanQrPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const qrCodeScanner = new Html5Qrcode(
      QR_SCANNER_ELEMENT_ID,
      { 
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false // Set to true for debugging
      }
    );
    setHtml5QrCode(qrCodeScanner);

    const requestCameraPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Camera permission denied:", err);
        setError("Camera permission is required to scan QR codes. Please enable camera access in your browser settings.");
        setHasCameraPermission(false);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Enable camera permissions to use the QR scanner.",
        });
      }
    };
    requestCameraPermission();
    
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Error stopping QR scanner:", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    if (html5QrCode && hasCameraPermission === true && !html5QrCode.isScanning) {
      setIsLoading(true);
      setError(null);
      Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
          const cameraId = cameras[0].id; // Use the first camera
          html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 } 
            },
            (decodedText, decodedResult) => {
              // console.log("Scan successful:", decodedText, decodedResult);
              setScanResult(decodedText);
              html5QrCode.stop().catch(err => console.error("Error stopping after scan:", err));
              setIsLoading(false);
            },
            (errorMessage) => {
              // console.warn(`QR error: ${errorMessage}`);
              // Errors during scanning (e.g. QR not found) are logged here.
              // We don't usually show these to the user unless it's persistent.
            }
          ).then(() => {
            setIsLoading(false);
          }).catch(err => {
            console.error("Error starting QR scanner:", err);
            setError(`Failed to start QR scanner: ${err.message}. Try refreshing the page or checking camera permissions.`);
            setIsLoading(false);
            toast({
                variant: "destructive",
                title: "Scanner Error",
                description: "Could not start QR scanner. Ensure your camera is not in use by another app.",
            });
          });
        } else {
          setError("No cameras found on this device.");
          setIsLoading(false);
        }
      }).catch(err => {
        console.error("Error getting cameras:", err);
        setError("Could not access camera list.");
        setIsLoading(false);
      });
    }
  }, [html5QrCode, hasCameraPermission, toast]);


  useEffect(() => {
    if (scanResult) {
      toast({
        title: "QR Code Scanned!",
        description: "Processing attendance...",
        action: <CheckCircle className="text-green-500" />,
      });
      // Basic validation: check if it looks like our attendance URL
      if (scanResult.includes('/take-attendance?userId=')) {
        router.push(scanResult); // Redirect to the URL from QR code
      } else {
        setError("Invalid QR code scanned. Please scan an AttendEase attendance QR code.");
        setScanResult(null); // Reset for another scan attempt
         toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "This QR code is not for AttendEase attendance.",
        });
        // Optionally restart scanner here if needed, or provide a button to rescan
        if (html5QrCode && hasCameraPermission && !html5QrCode.isScanning) {
           // Restart logic could be added here if desired
        }
      }
    }
  }, [scanResult, router, toast, html5QrCode, hasCameraPermission]);

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
          <Camera className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Scan Attendance QR</h1>
        </div>
        <p className="text-center text-muted-foreground">Point your camera at the QR code to mark attendance.</p>
      </header>

      <main className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>QR Code Scanner</CardTitle>
            <CardDescription>
              {isLoading && hasCameraPermission !== false && "Initializing camera and scanner..."}
              {!isLoading && hasCameraPermission === true && !error && "Align the QR code within the frame."}
              {hasCameraPermission === false && "Camera access is denied."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div id={QR_SCANNER_ELEMENT_ID} className="w-full sm:w-[300px] md:w-[400px] aspect-square border rounded-md overflow-hidden bg-muted">
              {/* The html5-qrcode library will inject the video stream here */}
              {isLoading && hasCameraPermission !== false && (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Starting camera...</p>
                </div>
              )}
               {hasCameraPermission === false && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
                  <VideoOff className="h-12 w-12 mb-4" />
                  <p className="font-semibold">Camera Not Available</p>
                  <p className="text-sm text-center">Please grant camera permissions in your browser settings and refresh the page.</p>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {scanResult && (
              <Alert variant="default" className="w-full bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
                 <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-700 dark:text-green-300">Scan Successful!</AlertTitle>
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Redirecting to confirm attendance for: {scanResult}
                </AlertDescription>
              </Alert>
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
