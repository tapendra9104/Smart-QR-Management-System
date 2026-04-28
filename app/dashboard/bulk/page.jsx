"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import JSZip from "jszip";
import { QRCode } from "react-qrcode-logo";
import { clientApiJson } from "@/lib/api/client";

function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];

        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            index += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values.map((value) => value.replace(/^"|"$/g, ""));
}

function safeZipFileName(name, index) {
    const cleaned = String(name || `QR-${index + 1}`)
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
        .replace(/\s+/g, "-");
    return cleaned || `QR-${index + 1}`;
}

export default function BulkGenerationPage() {
    const [items, setItems] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            const lines = text.split("\n").filter(line => line.trim());
            // Skip header if present
            const startIndex = lines[0].toLowerCase().includes("name") ? 1 : 0;
            const parsedItems = lines.slice(startIndex).map(line => {
                const [name, content] = parseCsvLine(line);
                return {
                    name: name || `QR-${nanoid(6)}`,
                    content: content || name,
                    status: "pending"
                };
            }).filter(item => item.content);
            setItems(parsedItems);
            setProgress(0);
        };
        reader.readAsText(file);
    };
    const processItems = async () => {
        if (items.length === 0)
            return;
        setIsProcessing(true);
        setProgress(10);
        try {
            const bulkItems = items.map((item) => ({
                name: item.name,
                content: item.content,
            }));
            const result = await clientApiJson("/qr-codes/bulk", "POST", {
                items: bulkItems,
            });
            const createdCodes = result.items || result.codes || [];
            const updatedItems = items.map((item, index) => {
                const created = createdCodes[index];
                if (created) {
                    return { ...item, status: "completed", qrId: created.id, content: created.qr_payload || created.content };
                }
                return { ...item, status: "error", error: "QR code was not returned by the server" };
            });
            setItems(updatedItems);
            setProgress(100);
        } catch (err) {
            // Fallback: if bulk fails, mark all as error
            setItems(items.map((item) => ({
                ...item,
                status: "error",
                error: err instanceof Error ? err.message : "Bulk creation failed",
            })));
        }
        setIsProcessing(false);
    };
    const downloadAll = async () => {
        const zip = new JSZip();
        const completedItems = items.filter(item => item.status === "completed");

        for (const [index, item] of completedItems.entries()) {
            // Find the canvas by the react-qrcode-logo id attribute
            const qrCanvas = document.getElementById(`bulk-download-qr-${item.qrId}`);
            if (qrCanvas && qrCanvas.tagName === "CANVAS") {
                const dataUrl = qrCanvas.toDataURL("image/png");
                const base64 = dataUrl.split(",")[1];
                zip.file(`${safeZipFileName(item.name, index)}.png`, base64, { base64: true });
            }
        }

        if (Object.keys(zip.files).length === 0) {
            // Fallback: nothing found, alert user
            alert("No QR codes available to download. Make sure they are visible on the page.");
            return;
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qr-codes.zip";
        a.click();
        URL.revokeObjectURL(url);
    };
    const downloadCSVTemplate = () => {
        const template = "name,content\nMy Website,https://example.com\nContact Page,https://example.com/contact\nProduct Link,https://example.com/product";
        const blob = new Blob([template], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qr-bulk-template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };
    const completedCount = items.filter(i => i.status === "completed").length;
    const errorCount = items.filter(i => i.status === "error").length;
    const completedItems = items.filter(item => item.status === "completed" && item.qrId);
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bulk Generation</h1>
        <p className="text-muted-foreground">
          Generate multiple QR codes at once from a CSV file
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Upload a CSV file with name and content columns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
              <div className="space-y-2">
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-primary font-medium">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </Label>
                <p className="text-sm text-muted-foreground">CSV files only</p>
              </div>
              <Input id="csv-upload" ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload}/>
            </div>

            <Button variant="outline" className="w-full" onClick={downloadCSVTemplate}>
              <FileText className="mr-2 h-4 w-4"/>
              Download CSV Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation Status</CardTitle>
            <CardDescription>
              {items.length > 0
            ? `${completedCount} of ${items.length} completed`
            : "No items loaded"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length > 0 && (<>
                <Progress value={progress} className="h-2"/>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500"/>
                      {completedCount} completed
                    </span>
                    {errorCount > 0 && (<span className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-destructive"/>
                        {errorCount} errors
                      </span>)}
                  </div>
                </div>
              </>)}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={processItems} disabled={items.length === 0 || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {isProcessing ? "Processing..." : "Generate All"}
              </Button>
              <Button variant="outline" onClick={downloadAll} disabled={completedCount === 0}>
                <Download className="mr-2 h-4 w-4"/>
                Download ZIP
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {items.length > 0 && (<Card>
          <CardHeader>
            <CardTitle>Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.slice(0, 50).map((item, index) => (<TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.content}</TableCell>
                    <TableCell>
                      {item.status === "pending" && (<span className="text-muted-foreground">Pending</span>)}
                      {item.status === "processing" && (<span className="flex items-center gap-1 text-blue-500">
                          <Loader2 className="h-3 w-3 animate-spin"/>
                          Processing
                        </span>)}
                      {item.status === "completed" && (<span className="flex items-center gap-1 text-green-500">
                          <CheckCircle2 className="h-3 w-3"/>
                          Completed
                        </span>)}
                      {item.status === "error" && (<span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-3 w-3"/>
                          Error
                        </span>)}
                    </TableCell>
                    <TableCell>
                      {item.status === "completed" && (<div className="w-12 h-12">
                          <QRCode value={item.content} size={48} id={`bulk-preview-qr-${item.qrId}`}/>
                        </div>)}
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
            {items.length > 50 && (<p className="text-sm text-muted-foreground text-center mt-4">
                Showing first 50 of {items.length} items
              </p>)}
          </CardContent>
        </Card>)}

      <div className="fixed -left-[10000px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        {completedItems.map((item) => (
          <QRCode key={item.qrId} value={item.content} size={256} id={`bulk-download-qr-${item.qrId}`}/>
        ))}
      </div>
    </div>);
}
