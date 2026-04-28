import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex justify-center">
                    <div className="relative">
                        <QrCode className="h-24 w-24 text-muted-foreground/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-foreground">404</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
                    <p className="text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go back
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
