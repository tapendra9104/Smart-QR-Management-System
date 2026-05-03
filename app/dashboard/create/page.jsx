"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, RotateCcw, Wand2, Zap } from "lucide-react";
import { toast } from "sonner";
import { clientApiJson } from "@/lib/api/client";
import { QRContentEditor } from "@/components/qr/qr-content-editor";
import { QRPreview } from "@/components/qr/qr-preview";
import { QRStyleEditor } from "@/components/qr/qr-style-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_QR_STYLE } from "@/lib/types/qr";

export default function CreateQRPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [contentType, setContentType] = useState("url");
    const [isDynamic, setIsDynamic] = useState(false);
    const [destinationUrl, setDestinationUrl] = useState("");
    const [style, setStyle] = useState(DEFAULT_QR_STYLE);
    const [saving, setSaving] = useState(false);

    const normalizeWebsiteUrl = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return trimmed;
        return /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    const handleSave = async () => {
        if (!name.trim()) { toast.error("Please enter a name for your QR code"); return; }
        if (!content.trim()) { toast.error("Please enter content for your QR code"); return; }
        setSaving(true);
        try {
            const normalizedContent = contentType === "url" ? normalizeWebsiteUrl(content) : content.trim();
            const normalizedDestination = destinationUrl.trim() ? normalizeWebsiteUrl(destinationUrl) : "";
            await clientApiJson("/qr-codes", "POST", {
                name: name.trim(),
                content: normalizedContent,
                content_type: contentType,
                destination_url: isDynamic && contentType !== "url" ? normalizedDestination : null,
                is_dynamic: isDynamic,
                style,
            });
            toast.success("QR code created successfully!");
            router.push("/dashboard/codes");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save QR code. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleResetStyle = () => {
        setStyle(DEFAULT_QR_STYLE);
        toast.info("Design reset to defaults");
    };

    const previewContent = isDynamic
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/XXXXXXXX`
        : content;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-xl">
                        <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Wand2 className="h-6 w-6 text-primary" />
                            Create QR Code
                        </h1>
                        <p className="text-muted-foreground text-sm">Design and customize your QR code</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetStyle} className="hidden sm:flex rounded-xl">
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Reset Design
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
                {/* Left: Controls */}
                <div className="space-y-5">
                    {/* Basic Info */}
                    <Card className="border-border/60 card-premium">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Basic Information</CardTitle>
                            <CardDescription>Give your QR code a name and choose its type</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="qr-name">QR Code Name</Label>
                                <Input
                                    id="qr-name"
                                    placeholder="e.g., Website Link, Business Card"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                                />
                            </div>
                            {/* Dynamic QR toggle — premium card */}
                            <div
                                className={`relative flex items-center justify-between rounded-xl border p-4 transition-all duration-300 cursor-pointer group ${
                                    isDynamic
                                        ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
                                        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                                }`}
                                onClick={() => setIsDynamic(!isDynamic)}
                                role="button"
                                aria-pressed={isDynamic}
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setIsDynamic(!isDynamic)}
                            >
                                {/* Animated gradient top-border when active */}
                                {isDynamic && (
                                    <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl gradient-brand" />
                                )}

                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Icon */}
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                                        isDynamic
                                            ? "gradient-brand shadow-md shadow-primary/30"
                                            : "bg-muted"
                                    }`}>
                                        <Zap className={`h-5 w-5 transition-colors duration-300 ${isDynamic ? "text-white" : "text-muted-foreground"}`} />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Label
                                                htmlFor="qr-dynamic"
                                                className={`font-semibold cursor-pointer transition-colors duration-200 ${isDynamic ? "text-primary" : ""}`}
                                            >
                                                Dynamic QR Code
                                            </Label>
                                            {isDynamic ? (
                                                <Badge variant="success" className="text-xs font-semibold">
                                                    ● Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                                    Off
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Change destination URL anytime — no reprinting needed
                                        </p>
                                    </div>
                                </div>

                                {/* Switch — stop propagation so it doesn't double-toggle */}
                                <div onClick={(e) => e.stopPropagation()} className="ml-4 shrink-0">
                                    <Switch
                                        id="qr-dynamic"
                                        checked={isDynamic}
                                        onCheckedChange={setIsDynamic}
                                    />
                                </div>
                            </div>
                            {isDynamic && contentType !== "url" && (
                                <div className="space-y-2">
                                    <Label htmlFor="qr-destination">Redirect URL</Label>
                                    <Input
                                        id="qr-destination"
                                        type="url"
                                        placeholder="https://example.com/redirect"
                                        value={destinationUrl}
                                        onChange={(e) => setDestinationUrl(e.target.value)}
                                        className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The URL users will be redirected to when scanning
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card className="border-border/60 card-premium">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Content</CardTitle>
                            <CardDescription>Choose what your QR code links to</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QRContentEditor
                                contentType={contentType}
                                onContentTypeChange={setContentType}
                                content={content}
                                onContentChange={setContent}
                            />
                        </CardContent>
                    </Card>

                    {/* Design Studio */}
                    <Card className="border-border/60 card-premium">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Wand2 className="h-4 w-4 text-primary" />
                                Design Studio
                            </CardTitle>
                            <CardDescription>Customize colors, patterns, logo, and frame</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QRStyleEditor style={style} onStyleChange={setStyle} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Sticky Preview */}
                <div className="lg:sticky lg:top-6 space-y-4 self-start">
                    <Card className="border-border/60 card-premium">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Preview</CardTitle>
                            <CardDescription>Live preview of your QR code</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-6">
                            <QRPreview content={previewContent} style={style} name={name || "qrcode"} />
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full h-12 gradient-brand border-0 text-white text-base shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:opacity-90 transition-all duration-300 rounded-xl"
                        onClick={handleSave}
                        disabled={saving || !name.trim() || !content.trim()}
                    >
                        {saving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Save QR Code</>
                        )}
                    </Button>

                    {!name.trim() && (
                        <p className="text-xs text-center text-muted-foreground">
                            Enter a name to enable saving
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
