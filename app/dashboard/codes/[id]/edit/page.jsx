"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { clientApi, clientApiJson } from "@/lib/api/client";
import { QRPreview } from "@/components/qr/qr-preview";
import { QRStyleEditor } from "@/components/qr/qr-style-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_QR_STYLE } from "@/lib/types/qr";
export default function EditQRPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [destinationUrl, setDestinationUrl] = useState("");
    const [content, setContent] = useState("");
    const [qrPayload, setQrPayload] = useState("");
    const [isDynamic, setIsDynamic] = useState(false);
    const [style, setStyle] = useState(DEFAULT_QR_STYLE);
    const normalizeWebsiteUrl = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return trimmed;
        return /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    useEffect(() => {
        async function fetchCode() {
            try {
                const code = await clientApi(`/qr-codes/${id}`);
                setName(code.name);
                setContent(code.content);
                setQrPayload(code.qr_payload || code.content);
                setDestinationUrl(code.destination_url || "");
                setIsDynamic(code.is_dynamic);
                setStyle(code.style || DEFAULT_QR_STYLE);
                setLoading(false);
            }
            catch {
                toast.error("QR code not found");
                router.push("/dashboard/codes");
            }
        }
        fetchCode();
    }, [id, router]);
    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please enter a name for your QR code");
            return;
        }
        setSaving(true);
        try {
            await clientApiJson(`/qr-codes/${id}`, "PUT", {
                name: name.trim(),
                destination_url: isDynamic ? normalizeWebsiteUrl(destinationUrl) : null,
                style,
                is_active: true,
            });
            toast.success("QR code updated successfully!");
            router.push(`/dashboard/codes/${id}`);
            router.refresh();
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update QR code. Please try again.");
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/codes/${id}`}>
            <ArrowLeft className="h-4 w-4"/>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit QR Code</h1>
          <p className="text-muted-foreground">
            Update your QR code settings and style
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your QR code name and destination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">QR Code Name</Label>
                <Input id="name" placeholder="e.g., Website Link, Business Card" value={name} onChange={(e) => setName(e.target.value)}/>
              </div>

              {isDynamic && (<div className="space-y-2">
                  <Label htmlFor="destination">Destination URL</Label>
                  <Input id="destination" type="url" placeholder="https://example.com" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)}/>
                  <p className="text-xs text-muted-foreground">
                    Change where this QR code redirects to
                  </p>
                </div>)}

              {!isDynamic && (<div className="space-y-2">
                  <Label>Content</Label>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-mono break-all">{content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Static QR codes cannot change their content
                  </p>
                </div>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customization</CardTitle>
              <CardDescription>Update colors, style, and logo</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <QRStyleEditor style={style} onStyleChange={setStyle}/>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your QR code will look</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <QRPreview content={qrPayload || content} style={style} name={name || "qrcode"}/>
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (<>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Saving...
              </>) : (<>
                <Save className="mr-2 h-4 w-4"/>
                Save Changes
              </>)}
          </Button>
        </div>
      </div>
    </div>);
}
