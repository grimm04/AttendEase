
"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
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
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  useEffect(() => {
    // Initialize Html5Qrcode instance
    if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(
            QR_SCANNER_ELEMENT_ID,
            {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: false
            }
        );
    }

    const requestCameraPermission = async () => {
      try {
        // Check for existing permission or if already tried
        if (hasCameraPermission !== null) return;

        setIsLoading(true);
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
      } catch (err) {
        console.error("Camera permission denied:", err);
        setError("Camera permission is required. Please enable camera access in your browser settings and refresh.");
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Enable camera permissions and refresh to use the QR scanner.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    requestCameraPermission();
    
    // Cleanup function
    return () => {
      if (html5QrCodeRef.current && isScannerActive) {
        html5QrCodeRef.current.stop()
          .then(() => {
            setIsScannerActive(false);
            // console.log("QR Scanner stopped on unmount/cleanup.");
          })
          .catch(err => {
            console.error("Error stopping QR scanner on unmount/cleanup:", err)
          });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount to initialize and request permission

  useEffect(() => {
    const scanner = html5QrCodeRef.current;
    if (scanner && hasCameraPermission === true && !isScannerActive && !scanResult) {
      setIsLoading(true);
      setError(null);
      Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
          const cameraId = cameras[0].id; // Use the first camera
          scanner.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 } 
            },
            (decodedText, decodedResult) => {
              setScanResult(decodedText);
              if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
                scanner.stop().then(() => setIsScannerActive(false)).catch(err => console.error("Error stopping after scan:", err));
              }
              setIsLoading(false);
            },
            (errorMessage) => {
              // This callback is for non-fatal scan errors (e.g. QR not found in frame)
              // console.warn(`QR scan error: ${errorMessage}`);
            }
          ).then(() => {
            setIsLoading(false);
            setIsScannerActive(true);
            // console.log("QR Scanner started successfully.");
          }).catch(err => {
            console.error("Error starting QR scanner:", err);
            let userFriendlyError = `Failed to start QR scanner.`;
            if (err.name === "NotAllowedError") {
                userFriendlyError = "Camera access was denied. Please enable it in your browser settings and refresh.";
            } else if (err.message && err.message.toLowerCase().includes("permission denied")) {
                userFriendlyError = "Camera permission denied. Please enable camera access and refresh.";
            } else if (err.message && err.message.toLowerCase().includes("camera not found")) {
                 userFriendlyError = "No camera found or it's in use by another application.";
            } else {
                 userFriendlyError = "Could not start camera. Ensure it's not in use by another app and permissions are granted.";
            }
            setError(userFriendlyError);
            setIsLoading(false);
            toast({
                variant: "destructive",
                title: "Scanner Error",
                description: userFriendlyError,
            });
          });
        } else {
          setError("No cameras found on this device.");
          setIsLoading(false);
        }
      }).catch(err => {
        console.error("Error getting cameras:", err);
        setError("Could not access camera list. Ensure permissions are granted.");
        setIsLoading(false);
      });
    }
  }, [hasCameraPermission, isScannerActive, scanResult]);


  useEffect(() => {
    if (scanResult) {
      toast({
        title: "QR Code Scanned!",
        description: "Processing attendance...",
        action: <CheckCircle className="text-green-500" />,
      });
      if (scanResult.includes('/take-attendance?userId=')) {
        router.push(scanResult);
      } else {
        setError("Invalid QR code scanned. Please scan an AttendEase attendance QR code.");
        setScanResult(null); // Reset for another scan attempt
         toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "This QR code is not for AttendEase attendance.",
        });
        // Attempt to restart scanner if needed (isScannerActive will be false)
        // The previous effect will try to restart if conditions are met
      }
    }
  }, [scanResult, router, toast]);

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
              {isLoading && hasCameraPermission !== false && "Initializing camera..."}
              {!isLoading && hasCameraPermission === true && !error && isScannerActive && "Align the QR code within the frame."}
              {!isLoading && hasCameraPermission === true && !error && !isScannerActive && !scanResult && "Ready to scan."}
              {hasCameraPermission === false && "Camera access is denied."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div id={QR_SCANNER_ELEMENT_ID} className="w-full sm:w-[300px] md:w-[400px] aspect-square border rounded-md overflow-hidden bg-muted">
              {(isLoading || (hasCameraPermission === null)) && (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Starting camera...</p>
                </div>
              )}
               {hasCameraPermission === false && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
                  <VideoOff className="h-12 w-12 mb-4" />
                  <p className="font-semibold">Camera Access Required</p>
                  <p className="text-sm">Please grant camera permissions in your browser settings and refresh the page to use the scanner.</p>
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
                  Redirecting...
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

