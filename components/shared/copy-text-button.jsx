'use client';

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyTextButton({ value, className }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        if (!value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success("Copied to clipboard");
            window.setTimeout(() => setCopied(false), 2000);
        }
        catch {
            toast.error("Failed to copy");
        }
    }

    return (<Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("shrink-0", className)}
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        title={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
    </Button>);
}
