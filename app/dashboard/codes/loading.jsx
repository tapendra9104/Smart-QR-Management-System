import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CodesLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <Skeleton className="h-3 w-full" />
                            <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
