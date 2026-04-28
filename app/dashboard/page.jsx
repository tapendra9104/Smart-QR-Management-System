import Link from "next/link";
import { QrCode, ScanLine, BarChart3, Plus, ArrowRight, TrendingUp, Zap, Activity } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
    title: "Dashboard",
};

export default async function DashboardPage() {
    const dashboard = await serverApi("/api/v1/dashboard/summary");

    const stats = [
        {
            title: "Total QR Codes",
            value: dashboard.total_codes || 0,
            icon: QrCode,
            description: "Active QR codes",
            color: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-500/20",
            bg: "bg-violet-500/10",
            text: "text-violet-600 dark:text-violet-400",
            change: "+12% this month",
            trend: "up",
        },
        {
            title: "Total Scans",
            value: dashboard.total_scans || 0,
            icon: ScanLine,
            description: "All-time scans",
            color: "from-emerald-500 to-teal-600",
            shadow: "shadow-emerald-500/20",
            bg: "bg-emerald-500/10",
            text: "text-emerald-600 dark:text-emerald-400",
            change: "+8% this week",
            trend: "up",
        },
        {
            title: "Avg. Scans/Code",
            value: dashboard.average_scans_per_code || 0,
            icon: BarChart3,
            description: "Average performance",
            color: "from-sky-500 to-blue-600",
            shadow: "shadow-sky-500/20",
            bg: "bg-sky-500/10",
            text: "text-sky-600 dark:text-sky-400",
            change: "All time average",
            trend: "neutral",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back! Here&apos;s an overview of your QR codes.
                    </p>
                </div>
                <Button asChild className="gradient-brand border-0 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 transition-all">
                    <Link href="/dashboard/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create QR Code
                    </Link>
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid gap-5 md:grid-cols-3">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.title}
                            className={`card-premium border-border/60 animate-fade-in-up overflow-hidden`}
                            style={{ animationDelay: `${i * 0.08}s` }}
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${stat.text}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black mb-1 stat-number">
                                    {typeof stat.value === "number"
                                        ? stat.value.toLocaleString()
                                        : stat.value}
                                </div>
                                <div className="flex items-center gap-2">
                                    {stat.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                                    {stat.trend === "neutral" && <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
                                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Create QR Code", href: "/dashboard/create", icon: Zap, desc: "New custom code", color: "text-violet-500" },
                    { label: "View Analytics", href: "/dashboard/analytics", icon: BarChart3, desc: "Track performance", color: "text-emerald-500" },
                    { label: "Bulk Generate", href: "/dashboard/bulk", icon: Activity, desc: "CSV import", color: "text-sky-500" },
                ].map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link key={action.href} href={action.href}>
                            <div className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 card-premium cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                    <Icon className={`h-5 w-5 ${action.color}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{action.label}</p>
                                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Recent QR Codes */}
            <Card className="border-border/60 card-premium">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent QR Codes</CardTitle>
                        <CardDescription>Your most recently created QR codes</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/codes">
                            View all
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {dashboard.recent_codes && dashboard.recent_codes.length > 0 ? (
                        <div className="space-y-3">
                            {dashboard.recent_codes.map((code) => (
                                <div
                                    key={code.id}
                                    className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-4 hover:bg-muted/40 transition-colors duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow">
                                            <QrCode className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{code.name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {code.content}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {code.is_dynamic && (
                                            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                                                Dynamic
                                            </Badge>
                                        )}
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{code.total_scans?.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">scans</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center mb-4 animate-float shadow-xl shadow-primary/20">
                                <QrCode className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">No QR codes yet</h3>
                            <p className="mb-6 text-sm text-muted-foreground max-w-xs">
                                Create your first QR code to get started. It only takes seconds!
                            </p>
                            <Button asChild className="gradient-brand border-0 text-white shadow-lg shadow-primary/25">
                                <Link href="/dashboard/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create QR Code
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
