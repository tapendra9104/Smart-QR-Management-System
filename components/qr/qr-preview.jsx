"use client";
import { useRef, useCallback, useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Copy, Check, ChevronDown } from "lucide-react";
import { DOWNLOAD_SIZES } from "@/lib/types/qr";
import { toast } from "sonner";

export function QRPreview({ content, style, name = "qrcode" }) {
    const qrRef = useRef(null);
    const frameRef = useRef(null);
    const [copied, setCopied] = useState(false);

    const getCanvas = useCallback(() => {
        const canvasFromFrame = frameRef.current?.querySelector("canvas");
        if (canvasFromFrame) return canvasFromFrame;
        if (!qrRef.current) return null;
        // react-qrcode-logo v3 class component stores the canvas as canvasRef
        return qrRef.current.canvasRef?.current || null;
    }, []);

    const renderFrameToCanvas = useCallback((qrCanvas, targetSize) => {
        if (!qrCanvas) return null;

        const logicalW = qrCanvas.width;
        const logicalH = qrCanvas.height;

        if (style.frameStyle === "none") {
            // Resize to target download size (or logical size if none specified)
            const outSize = targetSize || style.size;
            const scale = outSize / style.size;
            const w = Math.round(logicalW * scale);
            const h = Math.round(logicalH * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(qrCanvas, 0, 0, w, h);
            return canvas;
        }

        const scale = targetSize / style.size;
        const qrW = logicalW * scale;
        const qrH = logicalH * scale;
        const padding = 16 * scale;

        const noBannerTypes = ["simple", "rounded", "ticket", "bubble", "shadow-box", "gradient-border", "minimal-dots", "fancy"];
        const hasBanner = !noBannerTypes.includes(style.frameStyle);
        const bannerH = hasBanner ? 40 * scale : 0;

        const isTop = style.frameStyle === "badge-top";
        const isLeft = style.frameStyle === "label-left";
        const sideW = isLeft ? 30 * scale : 0;
        const totalW = qrW + padding * 2 + sideW;
        const totalH = qrH + padding * 2 + bannerH;

        const canvas = document.createElement("canvas");
        canvas.width = totalW;
        canvas.height = totalH;
        const ctx = canvas.getContext("2d");

        // Frame background
        let radius = 4 * scale;
        if (style.frameStyle === "rounded" || style.frameStyle === "fancy") radius = 16 * scale;
        else if (style.frameStyle === "ticket") radius = 12 * scale;
        else if (style.frameStyle === "bubble") radius = totalW / 2;
        else if (style.frameStyle === "gradient-border" || style.frameStyle === "shadow-box") radius = 10 * scale;

        ctx.fillStyle = style.frameColor;

        if (style.frameStyle === "ticket") {
            ctx.setLineDash([6 * scale, 4 * scale]);
            ctx.strokeStyle = style.frameColor;
            ctx.lineWidth = 2 * scale;
            roundRect(ctx, 1, 1, totalW - 2, totalH - 2, radius);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = style.bgColor;
            roundRect(ctx, 3 * scale, 3 * scale, totalW - 6 * scale, totalH - 6 * scale, radius - 2);
            ctx.fill();
        } else if (style.frameStyle === "gradient-border") {
            const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
            grad.addColorStop(0, "#667eea");
            grad.addColorStop(1, "#764ba2");
            ctx.fillStyle = grad;
            roundRect(ctx, 0, 0, totalW, totalH, radius);
            ctx.fill();
            ctx.fillStyle = style.bgColor || "#ffffff";
            roundRect(ctx, 3 * scale, 3 * scale, totalW - 6 * scale, totalH - 6 * scale, radius - 2);
            ctx.fill();
        } else if (style.frameStyle === "shadow-box") {
            // Draw shadow
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            roundRect(ctx, 4 * scale, 4 * scale, totalW, totalH, radius);
            ctx.fill();
            ctx.fillStyle = style.frameColor;
            roundRect(ctx, 0, 0, totalW, totalH, radius);
            ctx.fill();
        } else if (style.frameStyle === "minimal-dots") {
            // Just dots at corners
            const dotR = 4 * scale;
            ctx.fillStyle = style.frameColor;
            [[dotR, dotR], [totalW - dotR, dotR], [dotR, totalH - dotR], [totalW - dotR, totalH - dotR]].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, dotR, 0, Math.PI * 2);
                ctx.fill();
            });
        } else {
            roundRect(ctx, 0, 0, totalW, totalH, radius);
            ctx.fill();
        }

        // QR code on canvas
        const qrX = padding + sideW;
        const qrY = isTop ? padding + bannerH : padding;
        ctx.drawImage(qrCanvas, qrX, qrY, qrW, qrH);

        // Banner / label text
        if (style.frameText) {
            ctx.fillStyle = style.frameTextColor;
            ctx.font = `bold ${14 * scale}px system-ui, -apple-system, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (bannerH > 0) {
                const textY = isTop ? padding / 2 + bannerH / 2 : qrY + qrH + padding / 2 + bannerH / 2;
                ctx.fillText(style.frameText.toUpperCase(), totalW / 2, textY);
            } else if (isLeft) {
                ctx.save();
                ctx.translate(sideW / 2, totalH / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.font = `bold ${10 * scale}px system-ui, -apple-system, sans-serif`;
                ctx.fillText(style.frameText.toUpperCase(), 0, 0);
                ctx.restore();
            } else if (style.frameStyle === "ribbon") {
                // Ribbon corner
                ctx.fillStyle = style.frameTextColor;
                ctx.save();
                ctx.translate(totalW - 8 * scale, 8 * scale);
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = style.frameColor;
                ctx.fillRect(-20 * scale, -6 * scale, 40 * scale, 12 * scale);
                ctx.fillStyle = style.frameTextColor;
                ctx.font = `bold ${7 * scale}px system-ui, -apple-system, sans-serif`;
                ctx.fillText(style.frameText.toUpperCase().slice(0, 8), 0, 0);
                ctx.restore();
            }
        }

        return canvas;
    }, [style]);

    const safeFileName = useCallback(() => {
        const cleaned = String(name || "qrcode")
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
            .replace(/\s+/g, "-");
        return cleaned || "qrcode";
    }, [name]);

    const clickDownload = useCallback((href, fileName) => {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = href;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }, []);

    const handleDownload = useCallback((format, downloadSize) => {
        const qrCanvas = getCanvas();
        if (!qrCanvas) {
            toast.error("QR code is still rendering. Please try again.");
            return;
        }

        try {
            const framedCanvas = renderFrameToCanvas(qrCanvas, downloadSize || style.size);
            if (!framedCanvas) {
                toast.error("Could not prepare QR code for download.");
                return;
            }

            let mimeType = "image/png";
            let ext = "png";
            if (format === "jpg") { mimeType = "image/jpeg"; ext = "jpg"; }

            if (format === "svg") {
                // Create SVG with embedded PNG so custom frames and logos are preserved.
                const dataUrl = framedCanvas.toDataURL("image/png");
                const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${framedCanvas.width}" height="${framedCanvas.height}" viewBox="0 0 ${framedCanvas.width} ${framedCanvas.height}">
  <image width="${framedCanvas.width}" height="${framedCanvas.height}" xlink:href="${dataUrl}"/>
</svg>`;
                const blob = new Blob([svg], { type: "image/svg+xml" });
                const url = URL.createObjectURL(blob);
                clickDownload(url, `${safeFileName()}.svg`);
                URL.revokeObjectURL(url);
                return;
            }

            framedCanvas.toBlob((blob) => {
                if (!blob) {
                    toast.error("Could not prepare QR code for download.");
                    return;
                }
                const url = URL.createObjectURL(blob);
                clickDownload(url, `${safeFileName()}${downloadSize ? `_${downloadSize}px` : ""}.${ext}`);
                URL.revokeObjectURL(url);
            }, mimeType, format === "jpg" ? 0.95 : undefined);
        } catch {
            toast.error("Download failed. Remove the logo or try a different image format.");
        }
    }, [style, getCanvas, renderFrameToCanvas, safeFileName, clickDownload]);

    const handleCopy = useCallback(async () => {
        const qrCanvas = getCanvas();
        if (!qrCanvas) return;
        const framedCanvas = renderFrameToCanvas(qrCanvas, style.size);
        if (!framedCanvas) return;

        try {
            // ClipboardItem (PNG copy) — Chrome, Edge, Safari 13.1+ on macOS
            // NOT supported on iOS Safari — we fall back gracefully
            if (
                navigator.clipboard &&
                typeof ClipboardItem !== 'undefined' &&
                navigator.clipboard.write
            ) {
                const blob = await new Promise((resolve) => {
                    framedCanvas.toBlob((b) => { if (b) resolve(b); }, 'image/png');
                });
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            } else {
                // iOS Safari / Firefox fallback: copy the data URL as text
                const dataUrl = framedCanvas.toDataURL('image/png');
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(dataUrl);
                } else {
                    // Ancient browsers: execCommand fallback
                    const textarea = document.createElement('textarea');
                    textarea.value = dataUrl;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const dataUrl = framedCanvas.toDataURL('image/png');
            await navigator.clipboard.writeText(dataUrl).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [style, getCanvas, renderFrameToCanvas]);

    // Build eye color prop
    const eyeColorProp = style.eyeColor
        ? [style.eyeColor, style.eyeColor, style.eyeColor]
        : undefined;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: style.bgColor }}>
                {/* Frame wrapper for visual preview */}
                <div ref={frameRef} className="relative">
                    {style.frameStyle !== "none" && style.frameStyle !== "ticket" && (
                        <FrameWrapper style={style}>
                            <QRCode
                                ref={qrRef}
                                value={content || "https://example.com"}
                                size={style.size}
                                bgColor={style.bgColor}
                                fgColor={style.fgColor}
                                quietZone={style.quietZone}
                                ecLevel={style.ecLevel}
                                qrStyle={style.qrStyle}
                                eyeRadius={style.eyeRadius}
                                eyeColor={eyeColorProp}
                                logoImage={style.logoImage || undefined}
                                logoWidth={style.logoWidth}
                                logoHeight={style.logoHeight}
                                logoOpacity={style.logoOpacity}
                                logoPadding={style.logoPadding}
                                logoPaddingStyle={style.logoPaddingStyle}
                                removeQrCodeBehindLogo={style.removeQrCodeBehindLogo}
                                enableCORS
                            />
                        </FrameWrapper>
                    )}
                    {(style.frameStyle === "none" || style.frameStyle === "ticket") && (
                        <div style={style.frameStyle === "ticket" ? { border: `2px dashed ${style.frameColor}`, borderRadius: 12, padding: 8 } : {}}>
                            <QRCode
                                ref={qrRef}
                                value={content || "https://example.com"}
                                size={style.size}
                                bgColor={style.bgColor}
                                fgColor={style.fgColor}
                                quietZone={style.quietZone}
                                ecLevel={style.ecLevel}
                                qrStyle={style.qrStyle}
                                eyeRadius={style.eyeRadius}
                                eyeColor={eyeColorProp}
                                logoImage={style.logoImage || undefined}
                                logoWidth={style.logoWidth}
                                logoHeight={style.logoHeight}
                                logoOpacity={style.logoOpacity}
                                logoPadding={style.logoPadding}
                                logoPaddingStyle={style.logoPaddingStyle}
                                removeQrCodeBehindLogo={style.removeQrCodeBehindLogo}
                                enableCORS
                            />
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex gap-2 p-4 border-t bg-muted/30">
                {/* Download dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="default" size="sm" className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                            <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel className="text-xs">PNG Format</DropdownMenuLabel>
                        {DOWNLOAD_SIZES.map((s) => (
                            <DropdownMenuItem key={`png-${s.value}`} onClick={() => handleDownload("png", s.value)}>
                                PNG — {s.label}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">JPG Format</DropdownMenuLabel>
                        {DOWNLOAD_SIZES.map((s) => (
                            <DropdownMenuItem key={`jpg-${s.value}`} onClick={() => handleDownload("jpg", s.value)}>
                                JPG — {s.label}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDownload("svg")}>
                            SVG — Vector
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Copy button */}
                <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                    {copied ? (
                        <><Check className="mr-2 h-4 w-4" /> Copied</>
                    ) : (
                        <><Copy className="mr-2 h-4 w-4" /> Copy</>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

/* ── Visual frame wrapper for live preview ── */
function FrameWrapper({ style, children }) {
    const isTop = style.frameStyle === "badge-top";
    const isRounded = style.frameStyle === "rounded" || style.frameStyle === "fancy";
    const hasBanner = ["badge-bottom", "badge-top", "banner", "label-left", "ribbon"].includes(style.frameStyle);
    const fs = style.frameStyle;

    let borderRadius = isRounded ? 16 : 4;
    if (fs === "bubble") borderRadius = "50%";
    else if (fs === "shadow-box" || fs === "gradient-border") borderRadius = 10;

    const wrapperStyle = {
        borderRadius,
        display: "flex",
        flexDirection: fs === "label-left" ? "row" : "column",
        alignItems: "center",
    };

    if (fs === "gradient-border") {
        wrapperStyle.background = "linear-gradient(135deg, #667eea, #764ba2)";
        wrapperStyle.padding = 3;
    } else if (fs === "shadow-box") {
        wrapperStyle.backgroundColor = style.frameColor;
        wrapperStyle.padding = 12;
        wrapperStyle.boxShadow = "4px 4px 0px rgba(0,0,0,0.15)";
    } else if (fs === "minimal-dots") {
        wrapperStyle.position = "relative";
        wrapperStyle.padding = 12;
    } else if (fs === "ribbon") {
        wrapperStyle.backgroundColor = style.frameColor;
        wrapperStyle.padding = 12;
        wrapperStyle.position = "relative";
        wrapperStyle.overflow = "hidden";
    } else {
        wrapperStyle.backgroundColor = style.frameColor;
        wrapperStyle.padding = hasBanner ? "12px 12px 0 12px" : 12;
    }

    const textStyle = {
        color: style.frameTextColor,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
    };

    if (fs === "gradient-border") {
        return (
            <div style={wrapperStyle}>
                <div style={{ backgroundColor: style.bgColor || "#fff", borderRadius: borderRadius - 2, padding: 10 }}>
                    {children}
                </div>
            </div>
        );
    }

    if (fs === "minimal-dots") {
        const dotStyle = (pos) => ({
            position: "absolute", width: 6, height: 6, borderRadius: "50%",
            backgroundColor: style.frameColor, ...pos,
        });
        return (
            <div style={wrapperStyle}>
                <div style={dotStyle({ top: 0, left: 0 })} />
                <div style={dotStyle({ top: 0, right: 0 })} />
                <div style={dotStyle({ bottom: 0, left: 0 })} />
                <div style={dotStyle({ bottom: 0, right: 0 })} />
                {children}
            </div>
        );
    }

    if (fs === "label-left") {
        return (
            <div style={wrapperStyle}>
                {style.frameText && (
                    <div style={{
                        ...textStyle, writingMode: "vertical-rl", textOrientation: "mixed",
                        padding: "8px 4px", fontSize: 10,
                    }}>
                        {style.frameText}
                    </div>
                )}
                {children}
            </div>
        );
    }

    if (fs === "ribbon") {
        return (
            <div style={wrapperStyle}>
                {children}
                {style.frameText && (
                    <div style={{
                        position: "absolute", top: 14, right: -30,
                        backgroundColor: style.frameTextColor === "#ffffff" ? "#e63946" : style.frameTextColor,
                        color: "#fff", fontSize: 8, fontWeight: 700, padding: "3px 32px",
                        transform: "rotate(45deg)", letterSpacing: 1, textTransform: "uppercase",
                    }}>
                        {style.frameText.slice(0, 8)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={wrapperStyle}>
            {isTop && hasBanner && style.frameText && (
                <div style={{ ...textStyle, padding: "6px 0 8px" }}>{style.frameText}</div>
            )}
            {children}
            {!isTop && hasBanner && style.frameText && (
                <div style={{ ...textStyle, padding: "8px 0 10px" }}>{style.frameText}</div>
            )}
        </div>
    );
}

/* ── Canvas helper: rounded rectangle ── */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
