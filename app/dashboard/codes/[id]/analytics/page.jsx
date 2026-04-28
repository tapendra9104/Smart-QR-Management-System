import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Globe, Smartphone, Monitor, Clock } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { DeviceBreakdown } from "@/components/analytics/device-breakdown";
import { ScanChart } from "@/components/analytics/scan-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
export default async function AnalyticsPage({ params }) {
    const { id } = await params;
    let code = null;
    let analytics = null;
    try {
        ;
        [code, analytics] = await Promise.all([
            serverApi(`/api/v1/qr-codes/${id}`),
            serverApi(`/api/v1/analytics/qr-codes/${id}`),
        ]);
    }
    catch {
        notFound();
    }
    if (!code || !analytics) {
        notFound();
    }
    const stats = [
        { title: "Total Scans", value: analytics.total_scans, icon: BarChart3 },
        { title: "Countries", value: analytics.unique_countries, icon: Globe },
        { title: "Mobile", value: analytics.mobile_scans, icon: Smartphone },
        { title: "Desktop", value: analytics.desktop_scans, icon: Monitor },
    ];
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/codes/${code.id}`}>
            <ArrowLeft className="h-4 w-4"/>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">{code.name}</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (<Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scans Over Time</CardTitle>
            <CardDescription>Daily scan activity for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.chart_data.length > 0 ? (<ScanChart data={analytics.chart_data}/>) : (<div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4"/>
                <p className="text-muted-foreground">No scan data yet</p>
              </div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Scans by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.device_data.length > 0 ? (<DeviceBreakdown data={analytics.device_data}/>) : (<div className="flex flex-col items-center justify-center py-12 text-center">
                <Smartphone className="h-12 w-12 text-muted-foreground/50 mb-4"/>
                <p className="text-muted-foreground">No device data</p>
              </div>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Latest scan activity</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recent_scans && analytics.recent_scans.length > 0 ? (<div className="space-y-4">
              {analytics.recent_scans.slice(0, 10).map((scan) => (<div key={scan.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {scan.device_type === "mobile" ? (<Smartphone className="h-5 w-5 text-muted-foreground"/>) : (<Monitor className="h-5 w-5 text-muted-foreground"/>)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {scan.city || "Unknown"}, {scan.country || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {scan.browser || "Unknown browser"} on {scan.os || "Unknown OS"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4"/>
                    {new Date(scan.scanned_at).toLocaleString()}
                  </div>
                </div>))}
            </div>) : (<div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4"/>
              <p className="text-muted-foreground">No scans recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share your QR code to start tracking scans
              </p>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
