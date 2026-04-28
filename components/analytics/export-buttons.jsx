"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExportButtons() {
    const [loading, setLoading] = useState(false);

    const handleExport = async (type, format) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/proxy/exports/${type}?format=${format}`);
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${type}.${format === "json" ? "json" : "csv"}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`${type === "analytics" ? "Analytics" : "Audit logs"} exported`);
        } catch {
            toast.error("Failed to export data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Analytics Data</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport("analytics", "csv")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("analytics", "json")}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export as JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Audit Logs</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport("audit-logs", "csv")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("audit-logs", "json")}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export as JSON
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
