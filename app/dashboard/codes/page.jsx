import Link from "next/link";
import {
    QrCode, Plus, ExternalLink, BarChart3, Calendar,
    Link as LinkIcon, Type, User, Wifi, Mail, Search,
    ChevronLeft, ChevronRight, Activity
} from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { QRCodeActions } from "@/components/qr/qr-code-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "My QR Codes" };

const contentTypeIcons = {
    url: LinkIcon,
    text: Type,
    vcard: User,
    wifi: Wifi,
    email: Mail,
};

const contentTypeColors = {
    url: "from-violet-500 to-purple-500",
    text: "from-sky-500 to-blue-500",
    vcard: "from-emerald-500 to-teal-500",
    wifi: "from-amber-500 to-orange-500",
    email: "from-pink-500 to-rose-500",
};

export default async function CodesPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params?.page || "0", 10);
    const search = params?.search || "";
    const size = 12;

    const queryParts = [`page=${page}`, `size=${size}`];
    if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
    const result = await serverApi(`/api/v1/qr-codes?${queryParts.join("&")}`);

    const codes = result?.content || [];
    const totalPages = result?.totalPages || 0;
    const totalElements = result?.totalElements || 0;
    const isFirst = result?.first ?? true;
    const isLast = result?.last ?? true;

    const buildUrl = (newPage, newSearch) => {
        const p = new URLSearchParams();
        if (newPage > 0) p.set("page", String(newPage));
        if (newSearch) p.set("search", newSearch);
        const qs = p.toString();
        return `/dashboard/codes${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My QR Codes</h1>
                    <p className="text-muted-foreground mt-1">
                        {totalElements} QR code{totalElements !== 1 ? "s" : ""} total
                    </p>
                </div>
                <Button asChild className="gradient-brand border-0 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 transition-all">
                    <Link href="/dashboard/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create QR Code
                    </Link>
                </Button>
            </div>

            {/* Search bar */}
            <form action="/dashboard/codes" method="GET">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        name="search"
                        placeholder="Search QR codes by name..."
                        defaultValue={search}
                        className="flex h-11 w-full rounded-xl border border-border/60 bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                    />
                </div>
            </form>

            {codes.length > 0 ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {codes.map((code, i) => {
                            const Icon = contentTypeIcons[code.content_type] || LinkIcon;
                            const gradientClass = contentTypeColors[code.content_type] || "from-violet-500 to-purple-500";
                            return (
                                <Card
                                    key={code.id}
                                    className={`group card-premium flex flex-col border-border/60 animate-fade-in-up`}
                                    style={{ animationDelay: `${i * 0.04}s` }}
                                >
                                    <div className="p-5">
                                        {/* Card top */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} shadow-md`}>
                                                    <QrCode className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate max-w-[140px]">{code.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Icon className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                                            {code.content_type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <QRCodeActions code={code} />
                                        </div>

                                        {/* Content preview */}
                                        <p className="text-xs text-muted-foreground truncate mb-3 bg-muted/40 rounded-lg px-3 py-2 font-mono">
                                            {code.content}
                                        </p>

                                        {/* Badges */}
                                        <div className="flex items-center gap-2 mb-4">
                                            {code.is_dynamic && (
                                                <Badge className="text-xs gradient-brand border-0 text-white">
                                                    Dynamic
                                                </Badge>
                                            )}
                                            {!code.is_active && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <BarChart3 className="h-3.5 w-3.5" />
                                                    <span className="font-semibold text-foreground">{code.total_scans?.toLocaleString()}</span> scans
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(code.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10">
                                                <Link href={`/dashboard/codes/${code.id}`}>
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <Button variant="outline" size="sm" asChild disabled={isFirst} className="rounded-xl">
                                <Link href={buildUrl(page - 1, search)}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Link>
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 7) { pageNum = i; }
                                    else if (page < 3) { pageNum = i; }
                                    else if (page > totalPages - 4) { pageNum = totalPages - 7 + i; }
                                    else { pageNum = page - 3 + i; }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? "default" : "outline"}
                                            size="sm"
                                            className={`w-9 h-9 p-0 rounded-xl ${pageNum === page ? "gradient-brand border-0 text-white" : ""}`}
                                            asChild={pageNum !== page}
                                        >
                                            {pageNum === page ? (
                                                <span>{pageNum + 1}</span>
                                            ) : (
                                                <Link href={buildUrl(pageNum, search)}>{pageNum + 1}</Link>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button variant="outline" size="sm" asChild disabled={isLast} className="rounded-xl">
                                <Link href={buildUrl(page + 1, search)}>
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <Card className="border-border/60">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center mb-5 animate-float shadow-xl shadow-primary/20">
                            <QrCode className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">
                            {search ? "No results found" : "No QR codes yet"}
                        </h3>
                        <p className="mb-6 text-sm text-muted-foreground max-w-sm">
                            {search
                                ? `No QR codes matching "${search}". Try a different search term.`
                                : "Create your first QR code to start tracking scans and managing your links."}
                        </p>
                        {search ? (
                            <Button variant="outline" asChild className="rounded-xl">
                                <Link href="/dashboard/codes">
                                    <Activity className="mr-2 h-4 w-4" />
                                    Clear search
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild className="gradient-brand border-0 text-white shadow-lg shadow-primary/25 rounded-xl">
                                <Link href="/dashboard/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create QR Code
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
