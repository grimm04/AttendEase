
"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Camera, AlertTriangle, CheckCircle, Loader2, VideoOff, FileImage } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const QR_SCANNER_ELEMENT_ID = "qr-reader";

export default function ScanQrPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For camera initialization
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false); // For camera scanner

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  useEffect(() => {
    if (!html5QrCodeRef.current) {
      console.log("Initializing Html5Qrcode instance...");
      try {
        html5QrCodeRef.current = new Html5Qrcode(
            QR_SCANNER_ELEMENT_ID,
            { 
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
              verbose: true 
            }
        );
      } catch (e) {
        console.error("Failed to initialize Html5Qrcode:", e);
        setError("Failed to initialize QR scanner component.");
        setIsLoading(false);
        return;
      }
    }

    const requestCameraPermission = async () => {
      if (hasCameraPermission !== null) return; 

      console.log("Requesting camera permission...");
      setIsLoading(true);
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera permission granted.");
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
    
    return () => {
      console.log("ScanQrPage unmounting. Attempting to stop scanner if active.");
      if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrCodeRef.current.stop()
          .then(() => {
            console.log("QR Scanner stopped on unmount/cleanup.");
            setIsScannerActive(false);
          })
          .catch(err => {
            console.error("Error stopping QR scanner on unmount/cleanup:", err);
          });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const scanner = html5QrCodeRef.current;
    if (scanner && hasCameraPermission === true && !isScannerActive && !scanResult && !isScanningFile) {
      console.log("Attempting to start QR camera scanner...");
      setIsLoading(true); // Indicate camera starting
      setError(null);

      const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        console.log("QR Camera Scan Success!", { decodedText, decodedResult });
        setScanResult(decodedText);
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          scanner.stop()
            .then(() => {
              console.log("Camera scanner stopped after successful scan.");
              setIsScannerActive(false);
            })
            .catch(err => console.error("Error stopping camera scanner after success:", err));
        }
      };

      const qrCodeErrorCallback = (errorMessage: string) => {
        // console.warn(`QR camera scan error (non-fatal): ${errorMessage}`);
      };

      Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
          const cameraId = cameras[0].id; 
          console.log(`Using camera: ${cameras[0].label} (ID: ${cameraId})`);
          scanner.start(
            cameraId,
            {
              fps: 10,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const edgePercentage = 0.7; 
                const qrboxSize = Math.min(viewfinderWidth, viewfinderHeight) * edgePercentage;
                return { width: qrboxSize, height: qrboxSize };
              },
              aspectRatio: 1.0 
            },
            qrCodeSuccessCallback,
            qrCodeErrorCallback 
          ).then(() => {
            console.log("QR Camera Scanner started successfully.");
            setIsLoading(false);
            setIsScannerActive(true);
          }).catch(err => {
            console.error("Error starting QR camera scanner:", err);
            let userFriendlyError = `Failed to start QR camera scanner.`;
            if (err.name === "NotAllowedError" || (err.message && err.message.toLowerCase().includes("permission denied"))) {
                userFriendlyError = "Camera access was denied. Please enable it in your browser settings and refresh.";
            } else if (err.message && err.message.toLowerCase().includes("camera not found")) {
                 userFriendlyError = "No camera found or it's in use by another application.";
            } else {
                 userFriendlyError = "Could not start camera. Ensure it's not in use by another app and permissions are granted.";
            }
            setError(userFriendlyError);
            setIsLoading(false);
            toast({
                variant: "destructive",
                title: "Camera Scanner Error",
                description: userFriendlyError,
            });
          });
        } else {
          console.error("No cameras found on this device.");
          setError("No cameras found on this device.");
          setIsLoading(false);
        }
      }).catch(err => {
        console.error("Error getting cameras:", err);
        setError("Could not access camera list. Ensure permissions are granted.");
        setIsLoading(false);
      });
    }
  }, [hasCameraPermission, isScannerActive, scanResult, toast, isScanningFile]);


  useEffect(() => {
    if (scanResult) {
      console.log(`Processing scanned result: ${scanResult}`);
      toast({
        title: "QR Code Scanned!",
        description: "Processing attendance...",
        action: <CheckCircle className="text-green-500" />,
      });
      if (scanResult.includes('/take-attendance?userId=')) {
        router.push(scanResult);
      } else {
        setError("Invalid QR code scanned. Please scan an AttendEase attendance QR code.");
        setScanResult(null); 
        setIsScannerActive(false); // Allow camera scanner to restart if needed
         toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "This QR code is not for AttendEase attendance.",
        });
      }
    }
  }, [scanResult, router, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null); 
      setScanResult(null); 
    } else {
      setSelectedFile(null);
    }
  };

  const handleScanUploadedFile = async () => {
    if (!selectedFile || !html5QrCodeRef.current) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a QR code image to scan.",
      });
      return;
    }

    setIsScanningFile(true);
    setError(null);
    setScanResult(null);

    if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScannerActive(false);
        console.log("Camera scanner stopped for file scan.");
      } catch (stopErr) {
        console.error("Could not stop camera scanner for file scan:", stopErr);
      }
    }

    try {
      console.log(`Scanning file: ${selectedFile.name}`);
      const decodedText = await html5QrCodeRef.current.scanFile(selectedFile, false);
      console.log("File Scan Success!", { decodedText });
      setScanResult(decodedText);
    } catch (err: any) {
      console.error("Error scanning file:", err);
      let userFriendlyError = "Failed to scan QR code from image.";
       if (err.name === "NotFoundError" || (err.message && err.message.toLowerCase().includes("no qr code found"))) {
            userFriendlyError = "QR code not found in the image or image is unclear.";
        }
      setError(userFriendlyError);
      toast({
        variant: "destructive",
        title: "File Scan Error",
        description: userFriendlyError,
      });
    } finally {
      setIsScanningFile(false);
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
          <Camera className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Scan Attendance QR</h1>
        </div>
        <p className="text-center text-muted-foreground">Point your camera at the QR code or upload an image to mark attendance.</p>
      </header>

      <main className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Camera Scanner</CardTitle>
            <CardDescription>
              {isLoading && hasCameraPermission !== false && "Initializing camera..."}
              {!isLoading && hasCameraPermission === true && !error && isScannerActive && "Align the QR code within the frame."}
              {!isLoading && hasCameraPermission === true && !error && !isScannerActive && !scanResult && "Ready to scan with camera."}
              {hasCameraPermission === false && "Camera access is denied."}
              {!isLoading && error && !isScanningFile && "Scanner error occurred."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div id={QR_SCANNER_ELEMENT_ID} className="w-full sm:w-[300px] md:w-[400px] aspect-square border rounded-md overflow-hidden bg-muted">
              {(isLoading || (hasCameraPermission === null && !error)) && (
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
          </CardContent>
        </Card>

        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileImage className="mr-2 h-5 w-5 text-primary" />
              Or Upload QR Code Image
            </CardTitle>
            <CardDescription>Select an image file containing a QR code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isScanningFile || isLoading || isScannerActive}
              id="qrFile"
            />
            <Button
              onClick={handleScanUploadedFile}
              className="w-full"
              disabled={!selectedFile || isScanningFile || isLoading || isScannerActive}
            >
              {isScanningFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileImage className="mr-2 h-4 w-4" /> }
              Scan Uploaded Image
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="w-full mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {scanResult && !error && ( 
          <Alert variant="default" className="w-full mt-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-300">Scan Successful!</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-400">
              Redirecting...
            </AlertDescription>
          </Alert>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
