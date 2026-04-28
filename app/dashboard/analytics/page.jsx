import { BarChart3, TrendingUp, Globe, Smartphone, Monitor, QrCode, Activity, Award } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { DeviceBreakdown } from "@/components/analytics/device-breakdown";
import { ScanChart } from "@/components/analytics/scan-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButtons } from "@/components/analytics/export-buttons";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
    const analytics = await serverApi("/api/v1/analytics/overview");

    const stats = [
        {
            title: "Total Scans",
            value: analytics.total_scans,
            icon: BarChart3,
            description: "All time",
            color: "from-violet-500 to-purple-600",
            bg: "bg-violet-500/10",
            text: "text-violet-600 dark:text-violet-400",
        },
        {
            title: "Today",
            value: analytics.today_scans,
            icon: TrendingUp,
            description: "Scans today",
            color: "from-emerald-500 to-teal-600",
            bg: "bg-emerald-500/10",
            text: "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "This Week",
            value: analytics.week_scans,
            icon: Activity,
            description: "Last 7 days",
            color: "from-sky-500 to-blue-600",
            bg: "bg-sky-500/10",
            text: "text-sky-600 dark:text-sky-400",
        },
        {
            title: "Countries",
            value: analytics.unique_countries,
            icon: Globe,
            description: "Unique locations",
            color: "from-amber-500 to-orange-500",
            bg: "bg-amber-500/10",
            text: "text-amber-600 dark:text-amber-400",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Track performance across all your QR codes
                    </p>
                </div>
                <ExportButtons />
            </div>

            {/* Stats row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.title}
                            className={`card-premium border-border/60 animate-fade-in-up`}
                            style={{ animationDelay: `${i * 0.07}s` }}
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {stat.title}
                                </CardTitle>
                                <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <Icon className={`h-4 w-4 ${stat.text}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black stat-number">
                                    {(stat.value || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-border/60 card-premium">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Scans Over Time
                        </CardTitle>
                        <CardDescription>Daily scan activity for the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.chart_data?.length > 0 ? (
                            <ScanChart data={analytics.chart_data} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="h-14 w-14 rounded-2xl gradient-brand flex items-center justify-center mb-4 animate-float shadow-xl shadow-primary/20">
                                    <BarChart3 className="h-7 w-7 text-white" />
                                </div>
                                <p className="font-semibold mb-1">No scan data yet</p>
                                <p className="text-sm text-muted-foreground">Share your QR codes to start tracking</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60 card-premium">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Device Breakdown
                        </CardTitle>
                        <CardDescription>Scans by device type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.device_data?.length > 0 ? (
                            <DeviceBreakdown data={analytics.device_data} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="h-14 w-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-4">
                                    <Smartphone className="h-7 w-7 text-sky-500" />
                                </div>
                                <p className="font-semibold mb-1">No device data</p>
                                <p className="text-sm text-muted-foreground">Data appears after first scans</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top performing */}
                <Card className="border-border/60 card-premium">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Top Performing
                        </CardTitle>
                        <CardDescription>Your most scanned QR codes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.top_codes && analytics.top_codes.length > 0 ? (
                            <div className="space-y-3">
                                {analytics.top_codes.map((code, index) => (
                                    <div key={code.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-sm text-white ${
                                                index === 0 ? "gradient-brand" :
                                                index === 1 ? "bg-gradient-to-br from-sky-500 to-blue-500" :
                                                "bg-gradient-to-br from-emerald-500 to-teal-500"
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <span className="font-semibold text-sm">{code.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-primary">
                                            {code.total_scans?.toLocaleString()} scans
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <QrCode className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                <p className="font-semibold mb-1">No QR codes yet</p>
                                <p className="text-sm text-muted-foreground">Create QR codes to see rankings</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card className="border-border/60 card-premium">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Summary
                        </CardTitle>
                        <CardDescription>Overview of your QR ecosystem</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {[
                            {
                                icon: QrCode,
                                label: "Total QR Codes",
                                value: analytics.total_codes || 0,
                                suffix: "",
                            },
                            {
                                icon: BarChart3,
                                label: "Total Scans",
                                value: analytics.total_scans || 0,
                                suffix: "",
                            },
                            {
                                icon: TrendingUp,
                                label: "Avg. Scans per Code",
                                value: analytics.total_codes && analytics.total_scans
                                    ? Math.round(analytics.total_scans / analytics.total_codes)
                                    : 0,
                                suffix: "",
                            },
                            {
                                icon: Smartphone,
                                label: "Mobile Share",
                                value: analytics.total_scans
                                    ? Math.round((analytics.mobile_scans / analytics.total_scans) * 100)
                                    : 0,
                                suffix: "%",
                            },
                            {
                                icon: Monitor,
                                label: "Desktop Share",
                                value: analytics.total_scans
                                    ? Math.round((analytics.desktop_scans / analytics.total_scans) * 100)
                                    : 0,
                                suffix: "%",
                            },
                        ].map((row) => {
                            const Icon = row.icon;
                            return (
                                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm">{row.label}</span>
                                    </div>
                                    <span className="font-bold text-sm">
                                        {row.value.toLocaleString()}{row.suffix}
                                    </span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
