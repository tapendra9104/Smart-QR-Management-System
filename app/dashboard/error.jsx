"use client";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({ error, reset }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-6">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                {error?.message || "We encountered an unexpected error. Please try again."}
            </p>
            <Button onClick={() => reset()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
            </Button>
        </div>
    );
}
