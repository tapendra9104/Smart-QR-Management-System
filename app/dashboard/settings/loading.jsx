import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-56" />
            </div>

            {/* Profile skeleton */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>

            {/* Password skeleton */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-36" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                    <Skeleton className="h-10 w-40" />
                </CardContent>
            </Card>

            {/* Notifications skeleton */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-5 w-10 rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Danger zone skeleton */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-9 w-32" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
