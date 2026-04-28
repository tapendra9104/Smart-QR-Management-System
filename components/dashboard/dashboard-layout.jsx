"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    QrCode,
    LayoutDashboard,
    Plus,
    List,
    ScanLine,
    BarChart3,
    Upload,
    Menu,
    LogOut,
    Settings,
    Sun,
    Moon,
    Monitor,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Create QR", href: "/dashboard/create", icon: Plus },
    { name: "My QR Codes", href: "/dashboard/codes", icon: List },
    { name: "Scanner", href: "/dashboard/scanner", icon: ScanLine },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Bulk Generate", href: "/dashboard/bulk", icon: Upload },
];

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 mx-2">
            <button
                onClick={() => setTheme("light")}
                className={cn(
                    "rounded-lg p-1.5 transition-all duration-200",
                    mounted && theme === "light"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Light mode"
            >
                <Sun className="h-3.5 w-3.5" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={cn(
                    "rounded-lg p-1.5 transition-all duration-200",
                    mounted && theme === "system"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="System theme"
            >
                <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={cn(
                    "rounded-lg p-1.5 transition-all duration-200",
                    mounted && theme === "dark"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Dark mode"
            >
                <Moon className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export function DashboardLayout({ children, user }) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleSignOut = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
    };

    const NavLinks = ({ onClick }) => (
        <nav className="flex flex-col gap-1 px-3">
            {navigation.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClick}
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive
                                ? "gradient-brand text-white shadow-md shadow-primary/25"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "")} />
                        {item.name}
                        {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );

    const UserMenuItems = () => (
        <>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
            </DropdownMenuItem>
        </>
    );

    const userInitial = user?.email?.charAt(0).toUpperCase() || "U";
    const userName = user?.full_name || user?.fullName || "User";

    return (
        <div className="flex min-h-screen bg-background">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-border/60 lg:bg-sidebar z-40">
                {/* Brand */}
                <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5">
                    <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
                        <QrCode className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <span className="text-base font-bold gradient-brand-text">QR Manager</span>
                        <div className="flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 text-primary" />
                            <span className="text-[10px] text-muted-foreground font-medium">Pro</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-5">
                    <div className="mb-2 px-5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            Menu
                        </p>
                    </div>
                    <NavLinks />
                </ScrollArea>

                {/* Theme toggle */}
                <div className="border-t border-border/60 py-3">
                    <ThemeToggle />
                </div>

                {/* User section */}
                <div className="border-t border-border/60 p-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-auto py-2.5 px-3 rounded-xl hover:bg-muted/60"
                            >
                                <Avatar className="h-8 w-8 shadow-sm">
                                    <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                                        {userInitial}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 truncate text-left">
                                    <div className="text-sm font-semibold">{userName}</div>
                                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <UserMenuItems />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* ── Main content area ── */}
            <div className="flex flex-1 flex-col lg:pl-64">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 lg:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
                            <div className="flex h-16 items-center gap-3 border-b border-border/60 px-5">
                                <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
                                    <QrCode className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-base font-bold gradient-brand-text">QR Manager</span>
                            </div>
                            <div className="py-5">
                                <NavLinks onClick={() => setOpen(false)} />
                            </div>
                            <div className="border-t border-border/60 py-3">
                                <ThemeToggle />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center shadow">
                            <QrCode className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-bold gradient-brand-text">QR Manager</span>
                    </div>

                    <div className="ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="gradient-brand text-white text-xs font-bold">
                                            {userInitial}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                    <div className="font-semibold">{userName}</div>
                                    <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="container mx-auto p-5 md:p-7 lg:p-8 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
