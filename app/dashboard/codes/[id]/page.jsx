import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, BarChart3, Calendar, Link as LinkIcon, ExternalLink, } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { QRPreviewServer } from "@/components/qr/qr-preview-server";
import { CopyTextButton } from "@/components/shared/copy-text-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default async function CodeDetailPage({ params }) {
    const { id } = await params;
    let code = null;
    try {
        code = await serverApi(`/api/v1/qr-codes/${id}`);
    }
    catch {
        notFound();
    }
    if (!code) {
        notFound();
    }
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/codes">
            <ArrowLeft className="h-4 w-4"/>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{code.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{code.content_type.toUpperCase()}</Badge>
            {code.is_dynamic && <Badge variant="outline">Dynamic</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/codes/${code.id}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4"/>
              Analytics
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/codes/${code.id}/edit`}>
              <Edit className="mr-2 h-4 w-4"/>
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Download or share your QR code</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QRPreviewServer code={code}/>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                  <p className="text-2xl font-bold">{code.total_scans}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4"/>
                    {new Date(code.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Content</p>
                <div className="flex items-start gap-2">
                  <div className="flex-1 rounded-lg bg-muted p-3">
                    <p className="text-sm font-mono break-all">{code.content}</p>
                  </div>
                  <CopyTextButton value={code.content} className="shrink-0"/>
                </div>
              </div>

              {code.is_dynamic && code.destination_url && (<div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Destination URL</p>
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0"/>
                    <p className="text-sm font-mono truncate flex-1">{code.destination_url}</p>
                    <a href={code.destination_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      <ExternalLink className="h-4 w-4"/>
                    </a>
                  </div>
                </div>)}

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Short Code</p>
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <code className="text-sm font-mono">{code.short_code}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                <p>View detailed analytics for scan history and demographics</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href={`/dashboard/codes/${code.id}/analytics`}>
                    View Analytics
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
