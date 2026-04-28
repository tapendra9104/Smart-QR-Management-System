"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/qr/qr-scanner";
import { Clock, Link as LinkIcon, ExternalLink, Copy, Trash2, ScanLine } from "lucide-react";
import { toast } from "sonner";

export default function ScannerPage() {
    const [history, setHistory] = useState([]);

    const handleScan = (result) => {
        let isUrl = false;
        try {
            new URL(result);
            isUrl = true;
        } catch {
            isUrl = false;
        }
        setHistory((prev) => [
            { content: result, timestamp: new Date(), isUrl, id: Date.now() },
            ...prev.slice(0, 9),
        ]);
    };

    const handleCopy = (content) => {
        navigator.clipboard.writeText(content).then(() => {
            toast.success("Copied to clipboard!");
        });
    };

    const handleClear = () => {
        setHistory([]);
        toast.info("Scan history cleared");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                        <ScanLine className="h-7 w-7 text-primary" />
                        QR Scanner
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Scan QR codes using your camera or upload an image
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Scanner */}
                <div className="animate-fade-in-up">
                    <QRScanner onScan={handleScan} />
                </div>

                {/* Scan History */}
                <Card className="border-border/60 card-premium animate-fade-in-up-delay-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Scan History
                            </CardTitle>
                            <CardDescription>
                                Your recent scans (this session only)
                            </CardDescription>
                        </div>
                        {history.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="text-muted-foreground hover:text-destructive rounded-xl text-xs"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Clear
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {history.length > 0 ? (
                            <div className="space-y-2">
                                {history.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`group flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors animate-fade-in-up`}
                                        style={{ animationDelay: `${index * 0.04}s` }}
                                    >
                                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                            item.isUrl ? "gradient-brand shadow" : "bg-muted"
                                        }`}>
                                            <LinkIcon className={`h-4 w-4 ${item.isUrl ? "text-white" : "text-muted-foreground"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-mono truncate leading-tight">
                                                {item.content}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {item.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg"
                                                onClick={() => handleCopy(item.content)}
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                            {item.isUrl && (
                                                <a
                                                    href={item.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4 animate-float shadow-xl shadow-primary/20">
                                    <ScanLine className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="font-bold mb-1">No scans yet</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Point your camera at a QR code or upload an image to get started
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
