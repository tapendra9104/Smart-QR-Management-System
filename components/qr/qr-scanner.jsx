"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, ExternalLink, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
export function QRScanner({ onScan }) {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [copied, setCopied] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const scannerRef = useRef(null);
    const containerRef = useRef(null);
    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) { // SCANNING
                    await scannerRef.current.stop();
                }
            }
            catch {
                // Ignore errors when stopping
            }
        }
        setIsScanning(false);
    }, []);
    const startScanner = useCallback(async () => {
        if (!containerRef.current)
            return;
        setCameraError(null);
        setScanResult(null);
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("qr-reader", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false,
                });
            }
            const state = scannerRef.current.getState();
            if (state === 2) { // Already scanning
                await stopScanner();
            }
            setIsScanning(true);
            await scannerRef.current.start({ facingMode: "environment" }, {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1,
            }, (decodedText) => {
                setScanResult(decodedText);
                onScan?.(decodedText);
                stopScanner();
                toast.success("QR code scanned successfully!");
            }, () => {
                // Ignore QR code not found errors (expected during scanning)
            });
        }
        catch (error) {
            console.error("Camera error:", error);
            setCameraError(error instanceof Error
                ? error.message
                : "Failed to access camera. Please ensure camera permissions are granted.");
            setIsScanning(false);
        }
    }, [onScan, stopScanner]);
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, [stopScanner]);
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setScanResult(null);
        setCameraError(null);
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("qr-reader-hidden", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false,
                });
            }
            const result = await scannerRef.current.scanFile(file, true);
            setScanResult(result);
            onScan?.(result);
            toast.success("QR code scanned successfully!");
        }
        catch {
            toast.error("No QR code found in the image");
        }
        // Reset file input
        e.target.value = "";
    };
    const handleCopy = async () => {
        if (!scanResult)
            return;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(scanResult);
            } else {
                // Fallback for older browsers / non-HTTPS
                const textarea = document.createElement("textarea");
                textarea.value = scanResult;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Failed to copy to clipboard");
        }
    };
    const handleOpenUrl = () => {
        if (!scanResult)
            return;
        try {
            const url = new URL(scanResult);
            window.open(url.href, "_blank", "noopener,noreferrer");
        }
        catch {
            toast.error("Not a valid URL");
        }
    };
    const isUrl = scanResult && (() => {
        try {
            new URL(scanResult);
            return true;
        }
        catch {
            return false;
        }
    })();
    return (<div className="space-y-6">
      {/* Scanner Container */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div ref={containerRef} className="relative aspect-square w-full max-w-md mx-auto bg-muted">
            <div id="qr-reader" className="w-full h-full"/>
            <div id="qr-reader-hidden" className="hidden"/>
            
            {!isScanning && !scanResult && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="rounded-full bg-muted-foreground/10 p-6">
                  <Camera className="h-12 w-12 text-muted-foreground"/>
                </div>
                <div>
                  <h3 className="font-semibold">Scan QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Use your camera or upload an image
                  </p>
                </div>
              </div>)}

            {cameraError && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-background/80">
                <div className="rounded-full bg-destructive/10 p-4">
                  <X className="h-8 w-8 text-destructive"/>
                </div>
                <div>
                  <h3 className="font-semibold text-destructive">Camera Error</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {cameraError}
                  </p>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isScanning ? (<Button variant="destructive" className="flex-1" onClick={stopScanner}>
            <X className="mr-2 h-4 w-4"/>
            Stop Scanning
          </Button>) : (<Button className="flex-1" onClick={startScanner}>
            <Camera className="mr-2 h-4 w-4"/>
            Start Camera
          </Button>)}

        <div className="flex-1">
          <Label htmlFor="file-upload" className="sr-only">
            Upload QR code image
          </Label>
          <Input id="file-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden"/>
          <Button variant="outline" className="w-full" onClick={() => document.getElementById("file-upload")?.click()} disabled={isScanning}>
            <Upload className="mr-2 h-4 w-4"/>
            Upload Image
          </Button>
        </div>
      </div>

      {/* Result */}
      {scanResult && (<Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Scan Result</Label>
              <div className="flex items-start gap-2">
                <p className="flex-1 rounded-lg bg-muted p-3 text-sm font-mono break-all">
                  {scanResult}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (<>
                    <Check className="mr-2 h-4 w-4"/>
                    Copied
                  </>) : (<>
                    <Copy className="mr-2 h-4 w-4"/>
                    Copy
                  </>)}
              </Button>
              {isUrl && (<Button variant="outline" size="sm" onClick={handleOpenUrl}>
                  <ExternalLink className="mr-2 h-4 w-4"/>
                  Open URL
                </Button>)}
              <Button variant="outline" size="sm" onClick={() => {
                setScanResult(null);
                startScanner();
            }}>
                <RefreshCw className="mr-2 h-4 w-4"/>
                Scan Again
              </Button>
            </div>
          </CardContent>
        </Card>)}
    </div>);
}
