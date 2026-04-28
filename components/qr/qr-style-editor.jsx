"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Palette, Image, Frame, Square, Circle, Sparkles, RotateCcw, Globe, Loader2, Search } from "lucide-react";
import { COLOR_PRESETS, DOT_STYLES, FRAME_STYLES, LOGO_GALLERY } from "@/lib/types/qr";

export function QRStyleEditor({ style, onStyleChange }) {
    const [logoUrl, setLogoUrl] = useState("");
    const [loadingUrl, setLoadingUrl] = useState(false);
    const [galleryFilter, setGalleryFilter] = useState("All");
    const [gallerySearch, setGallerySearch] = useState("");

    const updateStyle = (key, value) => {
        onStyleChange({ ...style, [key]: value });
    };

    const applyColorPreset = (preset) => {
        onStyleChange({
            ...style,
            fgColor: preset.fg,
            bgColor: preset.bg,
            enableLinearGradient: false,
        });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Logo must be under 2 MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                updateStyle("logoImage", reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoFromUrl = async (url) => {
        const target = url || logoUrl;
        if (!target.trim()) return;
        setLoadingUrl(true);
        try {
            const res = await fetch(target);
            if (!res.ok) throw new Error("Failed to fetch");
            const blob = await res.blob();
            if (blob.size > 5 * 1024 * 1024) {
                alert("Image too large (max 5 MB)");
                setLoadingUrl(false);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                updateStyle("logoImage", reader.result);
                setLoadingUrl(false);
            };
            reader.readAsDataURL(blob);
        } catch {
            alert("Could not load image from URL. Try a direct image link.");
            setLoadingUrl(false);
        }
    };

    const removeLogo = () => {
        updateStyle("logoImage", "");
        setLogoUrl("");
    };

    const categories = ["All", ...new Set(LOGO_GALLERY.map((l) => l.category))];
    const filteredLogos = LOGO_GALLERY.filter((l) => {
        const matchCat = galleryFilter === "All" || l.category === galleryFilter;
        const matchSearch = !gallerySearch || l.name.toLowerCase().includes(gallerySearch.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="colors" className="gap-1.5 text-xs">
                    <Palette className="h-3.5 w-3.5" />
                    Color & Shape
                </TabsTrigger>
                <TabsTrigger value="logo" className="gap-1.5 text-xs">
                    <Image className="h-3.5 w-3.5" />
                    Logo
                </TabsTrigger>
                <TabsTrigger value="frame" className="gap-1.5 text-xs">
                    <Frame className="h-3.5 w-3.5" />
                    Frame
                </TabsTrigger>
            </TabsList>

            {/* ─── COLOR & SHAPE TAB ─── */}
            <TabsContent value="colors" className="mt-4 space-y-4">
                {/* Color Presets */}
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Color Presets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => applyColorPreset(preset)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all hover:scale-105",
                                        style.fgColor === preset.fg && style.bgColor === preset.bg
                                            ? "border-primary shadow-sm"
                                            : "border-transparent"
                                    )}
                                >
                                    <div className="flex h-8 w-8 rounded-md overflow-hidden border">
                                        <div className="w-1/2" style={{ backgroundColor: preset.fg }} />
                                        <div className="w-1/2" style={{ backgroundColor: preset.bg }} />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Custom Colors */}
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Custom Colors
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">QR Code Color</Label>
                                <div className="flex gap-2">
                                    <Input type="color" value={style.fgColor} onChange={(e) => updateStyle("fgColor", e.target.value)} className="w-12 h-9 p-1 cursor-pointer" />
                                    <Input type="text" value={style.fgColor} onChange={(e) => updateStyle("fgColor", e.target.value)} className="flex-1 font-mono text-xs" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Background Color</Label>
                                <div className="flex gap-2">
                                    <Input type="color" value={style.bgColor} onChange={(e) => updateStyle("bgColor", e.target.value)} className="w-12 h-9 p-1 cursor-pointer" />
                                    <Input type="text" value={style.bgColor} onChange={(e) => updateStyle("bgColor", e.target.value)} className="flex-1 font-mono text-xs" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dot Style */}
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Square className="h-4 w-4" />
                            QR Pattern Style
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {DOT_STYLES.map((ds) => (
                                <button
                                    key={ds.value}
                                    type="button"
                                    onClick={() => updateStyle("qrStyle", ds.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
                                        style.qrStyle === ds.value
                                            ? "border-primary bg-primary/5"
                                            : "border-transparent bg-muted/50 hover:bg-muted"
                                    )}
                                >
                                    <div className="grid grid-cols-3 gap-0.5 w-8 h-8">
                                        {Array.from({ length: 9 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn("w-full h-full bg-foreground", {
                                                    "rounded-none": ds.value === "squares",
                                                    "rounded-full": ds.value === "dots",
                                                    "rounded-sm": ds.value === "fluid",
                                                })}
                                                style={{ opacity: [0, 2, 4, 6, 8].includes(i) ? 1 : 0.3 }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-medium">{ds.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Eye Corner Radius */}
                        <div className="space-y-2">
                            <Label className="text-xs">Eye Corner Radius: {style.eyeRadius}px</Label>
                            <Slider value={[style.eyeRadius]} onValueChange={([value]) => updateStyle("eyeRadius", value)} min={0} max={50} step={1} />
                        </div>

                        {/* Eye Color */}
                        <div className="space-y-2">
                            <Label className="text-xs">Eye Color (optional)</Label>
                            <div className="flex gap-2">
                                <Input type="color" value={style.eyeColor || style.fgColor} onChange={(e) => updateStyle("eyeColor", e.target.value)} className="w-12 h-9 p-1 cursor-pointer" />
                                <Input type="text" value={style.eyeColor || ""} placeholder="Same as QR color" onChange={(e) => updateStyle("eyeColor", e.target.value)} className="flex-1 font-mono text-xs" />
                                {style.eyeColor && (
                                    <Button variant="ghost" size="sm" onClick={() => updateStyle("eyeColor", "")}>
                                        <RotateCcw className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Size & Spacing */}
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Size & Quality</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Size: {style.size}px</Label>
                            <Slider value={[style.size]} onValueChange={([value]) => updateStyle("size", value)} min={128} max={512} step={8} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Quiet Zone: {style.quietZone}px</Label>
                            <Slider value={[style.quietZone]} onValueChange={([value]) => updateStyle("quietZone", value)} min={0} max={50} step={2} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Error Correction</Label>
                            <Select value={style.ecLevel} onValueChange={(value) => updateStyle("ecLevel", value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="L">Low (~7%)</SelectItem>
                                    <SelectItem value="M">Medium (~15%)</SelectItem>
                                    <SelectItem value="Q">Quartile (~25%)</SelectItem>
                                    <SelectItem value="H">High (~30%)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">Use High when adding a logo for better scan reliability</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ─── LOGO TAB ─── */}
            <TabsContent value="logo" className="mt-4 space-y-4">
                {/* Upload / URL */}
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Add Logo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="logo" className="text-xs font-medium">Upload from device</Label>
                            <Input id="logo" type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml" onChange={handleLogoUpload} className="text-xs" />
                            <p className="text-[10px] text-muted-foreground">PNG, JPG, GIF, or SVG — max 2 MB</p>
                        </div>

                        {/* URL Input */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium flex items-center gap-1.5">
                                <Globe className="h-3 w-3" />
                                Paste image URL
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    type="url"
                                    placeholder="https://example.com/logo.png"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleLogoFromUrl()}
                                    className="flex-1 text-xs"
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleLogoFromUrl()}
                                    disabled={loadingUrl || !logoUrl.trim()}
                                >
                                    {loadingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Load"}
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Direct link to an image file</p>
                        </div>

                        {/* Logo Preview */}
                        {style.logoImage && (
                            <>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                                    <img src={style.logoImage} alt="Logo preview" className="h-12 w-12 rounded object-contain border bg-white p-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium">Logo applied ✓</p>
                                        <p className="text-[10px] text-muted-foreground">{style.logoWidth}×{style.logoHeight}px</p>
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={removeLogo}>Remove</Button>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Logo Width: {style.logoWidth}px</Label>
                                    <Slider value={[style.logoWidth || 60]} onValueChange={([value]) => updateStyle("logoWidth", value)} min={20} max={120} step={5} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Logo Height: {style.logoHeight}px</Label>
                                    <Slider value={[style.logoHeight || 60]} onValueChange={([value]) => updateStyle("logoHeight", value)} min={20} max={120} step={5} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Logo Padding: {style.logoPadding}px</Label>
                                    <Slider value={[style.logoPadding || 5]} onValueChange={([value]) => updateStyle("logoPadding", value)} min={0} max={20} step={1} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Logo Opacity: {Math.round((style.logoOpacity || 1) * 100)}%</Label>
                                    <Slider value={[(style.logoOpacity || 1) * 100]} onValueChange={([value]) => updateStyle("logoOpacity", value / 100)} min={10} max={100} step={5} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Logo Background Shape</Label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => updateStyle("logoPaddingStyle", "square")} className={cn("flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-xs", style.logoPaddingStyle === "square" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50")}>
                                            <Square className="h-4 w-4" /> Square
                                        </button>
                                        <button type="button" onClick={() => updateStyle("logoPaddingStyle", "circle")} className={cn("flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-xs", style.logoPaddingStyle === "circle" ? "border-primary bg-primary/5" : "border-transparent bg-muted/50")}>
                                            <Circle className="h-4 w-4" /> Circle
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="removeBehind" className="text-xs">Remove QR behind logo</Label>
                                    <Switch id="removeBehind" checked={style.removeQrCodeBehindLogo} onCheckedChange={(checked) => updateStyle("removeQrCodeBehindLogo", checked)} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Logo Gallery */}
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Logo Gallery
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-[10px] text-muted-foreground">Pick a popular brand icon to use as your QR code logo</p>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search logos..."
                                value={gallerySearch}
                                onChange={(e) => setGallerySearch(e.target.value)}
                                className="pl-8 text-xs h-8"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-1 flex-wrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setGalleryFilter(cat)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
                                        galleryFilter === cat
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto pr-1">
                            {filteredLogos.map((logo) => (
                                <button
                                    key={logo.name}
                                    type="button"
                                    onClick={() => handleLogoFromUrl(logo.url)}
                                    disabled={loadingUrl}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 transition-all hover:scale-105 hover:shadow-sm",
                                        "border-transparent bg-muted/40 hover:bg-muted/80"
                                    )}
                                >
                                    <img src={logo.url} alt={logo.name} className="h-7 w-7 object-contain dark:invert" loading="lazy" />
                                    <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center">{logo.name}</span>
                                </button>
                            ))}
                        </div>
                        {filteredLogos.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">No logos match your search</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ─── FRAME TAB ─── */}
            <TabsContent value="frame" className="mt-4 space-y-4">
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Frame className="h-4 w-4" />
                            Frame Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                            {FRAME_STYLES.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => updateStyle("frameStyle", f.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all",
                                        style.frameStyle === f.value
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-transparent bg-muted/50 hover:bg-muted"
                                    )}
                                >
                                    <FramePreviewIcon type={f.value} />
                                    <span className="text-[9px] text-center leading-tight">{f.label}</span>
                                </button>
                            ))}
                        </div>

                        {style.frameStyle !== "none" && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs">Frame Text</Label>
                                    <Input value={style.frameText} onChange={(e) => updateStyle("frameText", e.target.value)} placeholder="SCAN ME" className="text-sm" maxLength={30} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Frame Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" value={style.frameColor} onChange={(e) => updateStyle("frameColor", e.target.value)} className="w-10 h-8 p-1 cursor-pointer" />
                                            <Input type="text" value={style.frameColor} onChange={(e) => updateStyle("frameColor", e.target.value)} className="flex-1 font-mono text-xs" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Text Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" value={style.frameTextColor} onChange={(e) => updateStyle("frameTextColor", e.target.value)} className="w-10 h-8 p-1 cursor-pointer" />
                                            <Input type="text" value={style.frameTextColor} onChange={(e) => updateStyle("frameTextColor", e.target.value)} className="flex-1 font-mono text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

/* ── Tiny frame preview icon for the selector grid ── */
function FramePreviewIcon({ type }) {
    const base = "w-10 h-10 flex items-center justify-center";
    const qr = <div className="w-5 h-5 bg-foreground/80 rounded-sm" />;

    switch (type) {
        case "none":
            return <div className={base}>{qr}</div>;
        case "simple":
            return <div className={cn(base, "border-2 border-foreground/40 rounded-sm")}>{qr}</div>;
        case "rounded":
            return <div className={cn(base, "border-2 border-foreground/40 rounded-lg")}>{qr}</div>;
        case "badge-bottom":
            return (
                <div className="flex flex-col items-center">
                    <div className={cn(base, "border-2 border-foreground/40 rounded-t-sm border-b-0")}>{qr}</div>
                    <div className="w-10 h-2.5 bg-foreground/30 rounded-b-sm text-[4px] text-center text-white leading-[10px]">SCAN</div>
                </div>
            );
        case "badge-top":
            return (
                <div className="flex flex-col items-center">
                    <div className="w-10 h-2.5 bg-foreground/30 rounded-t-sm text-[4px] text-center text-white leading-[10px]">SCAN</div>
                    <div className={cn(base, "border-2 border-foreground/40 rounded-b-sm border-t-0")}>{qr}</div>
                </div>
            );
        case "banner":
            return (
                <div className="flex flex-col items-center">
                    <div className={cn(base, "border-2 border-foreground/40 rounded-t-md border-b-0")}>{qr}</div>
                    <div className="w-10 h-3 bg-foreground/70 rounded-b-md text-[4px] text-center text-white leading-[12px]">SCAN ME</div>
                </div>
            );
        case "ticket":
            return (
                <div className={cn(base, "border-2 border-dashed border-foreground/40 rounded-lg")}>{qr}</div>
            );
        case "fancy":
            return (
                <div className={cn(base, "border-2 border-foreground/40 rounded-xl shadow-sm")}>{qr}</div>
            );
        case "bubble":
            return (
                <div className="flex flex-col items-center">
                    <div className={cn(base, "border-2 border-foreground/40 rounded-full")}>{qr}</div>
                    <div className="w-2 h-2 border-l-2 border-b-2 border-foreground/40 rotate-[-45deg] -mt-1" />
                </div>
            );
        case "shadow-box":
            return (
                <div className={cn(base, "border-2 border-foreground/40 rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]")}>{qr}</div>
            );
        case "gradient-border":
            return (
                <div className={cn(base, "rounded-lg")} style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", padding: 2 }}>
                    <div className="w-full h-full bg-background rounded-md flex items-center justify-center">{qr}</div>
                </div>
            );
        case "minimal-dots":
            return (
                <div className="relative">
                    <div className={base}>{qr}</div>
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                </div>
            );
        case "label-left":
            return (
                <div className="flex items-center gap-0.5">
                    <div className="w-2.5 h-8 bg-foreground/30 rounded-l-sm text-[3px] flex items-center justify-center text-white" style={{ writingMode: "vertical-rl" }}>SCAN</div>
                    <div className={cn("w-8 h-10 flex items-center justify-center border-2 border-foreground/40 rounded-r-sm border-l-0")}>{qr}</div>
                </div>
            );
        case "ribbon":
            return (
                <div className="relative">
                    <div className={cn(base, "border-2 border-foreground/40 rounded-sm")}>{qr}</div>
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-foreground/50 rounded-bl-md flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-white rounded" />
                    </div>
                </div>
            );
        default:
            return <div className={base}>{qr}</div>;
    }
}
