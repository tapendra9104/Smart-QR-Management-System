"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    Save, Loader2, Shield, Bell, Trash2, AlertCircle,
    Lock, User, CheckCircle2, Settings,
} from "lucide-react";

const DEFAULT_NOTIFICATIONS = {
    scanAlerts: true,
    weeklyReport: true,
    securityAlerts: true,
    productUpdates: false,
};

function loadNotificationPrefs() {
    if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
    try {
        const stored = localStorage.getItem("qr_notification_prefs");
        return stored ? { ...DEFAULT_NOTIFICATIONS, ...JSON.parse(stored) } : DEFAULT_NOTIFICATIONS;
    } catch { return DEFAULT_NOTIFICATIONS; }
}

function saveNotificationPrefs(prefs) {
    if (typeof window === "undefined") return;
    localStorage.setItem("qr_notification_prefs", JSON.stringify(prefs));
}

export default function SettingsPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const loadProfile = useCallback(async () => {
        try {
            const response = await fetch("/api/proxy/auth/me", { credentials: "same-origin" });
            if (response.ok) {
                const user = await response.json();
                setFullName(user.full_name || "");
                setEmail(user.email || "");
            }
        } catch { /* silent */ } finally { setLoadingProfile(false); }
    }, []);

    useEffect(() => {
        loadProfile();
        setNotifications(loadNotificationPrefs());
    }, [loadProfile]);

    const handleSaveProfile = async () => {
        if (!fullName.trim()) { toast.error("Please enter your full name"); return; }
        setSaving(true);
        try {
            const response = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: fullName.trim() }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Failed to update profile");
            }
            toast.success("Profile updated successfully");
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update profile");
        } finally { setSaving(false); }
    };

    const handleChangePassword = async () => {
        if (!currentPassword) { toast.error("Please enter your current password"); return; }
        if (!newPassword) { toast.error("Please enter a new password"); return; }
        if (newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
        if (newPassword !== confirmPassword) { toast.error("New passwords do not match"); return; }
        setChangingPassword(true);
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) throw new Error(data?.message || "Failed to change password");
            toast.success(data?.message || "Password changed successfully");
            setTimeout(() => { router.push("/auth/login"); router.refresh(); }, 1500);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to change password");
        } finally { setChangingPassword(false); }
    };

    const toggleNotification = (key) => {
        setNotifications((prev) => {
            const updated = { ...prev, [key]: !prev[key] };
            saveNotificationPrefs(updated);
            toast.success("Preference saved");
            return updated;
        });
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) { setDeleteError("Please enter your password"); return; }
        setDeleting(true);
        setDeleteError(null);
        try {
            const response = await fetch("/api/auth/delete-account", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: deletePassword }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Failed to delete account");
            }
            toast.success("Account deleted");
            router.push("/");
            router.refresh();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "An error occurred");
        } finally { setDeleting(false); }
    };

    const notificationOptions = [
        { key: "scanAlerts", label: "Scan Alerts", description: "Get notified when your QR codes are scanned" },
        { key: "weeklyReport", label: "Weekly Reports", description: "Receive a weekly summary of your analytics" },
        { key: "securityAlerts", label: "Security Alerts", description: "Get notified about suspicious activity" },
        { key: "productUpdates", label: "Product Updates", description: "Hear about new features and improvements" },
    ];

    const userInitial = email?.charAt(0).toUpperCase() || "U";

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                    <Settings className="h-7 w-7 text-primary" />
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1">Manage your account preferences</p>
            </div>

            {/* Profile Section */}
            <Card className="border-border/60 card-premium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-violet-500" />
                        </div>
                        Profile
                    </CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Avatar preview */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                        <Avatar className="h-14 w-14 shadow-md">
                            <AvatarFallback className="gradient-brand text-white text-xl font-black">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{fullName || "Your Name"}</p>
                            <p className="text-sm text-muted-foreground">{email || "your@email.com"}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="settings-email">Email</Label>
                        <Input
                            id="settings-email"
                            type="email"
                            value={email}
                            disabled
                            className="h-11 rounded-xl bg-muted/40 text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="settings-name">Full Name</Label>
                        <Input
                            id="settings-name"
                            placeholder={loadingProfile ? "Loading..." : "Your full name"}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={loadingProfile}
                            className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                        />
                    </div>
                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving || loadingProfile || !fullName.trim()}
                        className="gradient-brand border-0 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 transition-all rounded-xl"
                    >
                        {saving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" />Save Changes</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="border-border/60 card-premium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
                            <Lock className="h-4 w-4 text-sky-500" />
                        </div>
                        Change Password
                    </CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-pwd">Current Password</Label>
                        <Input
                            id="current-pwd"
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-pwd">New Password</Label>
                        <Input
                            id="new-pwd"
                            type="password"
                            placeholder="Enter new password (min 8 characters)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                        <Input
                            id="confirm-pwd"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Passwords do not match
                            </p>
                        )}
                        {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Passwords match
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                        className="rounded-xl border-border/60"
                        variant="outline"
                    >
                        {changingPassword ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing...</>
                        ) : (
                            <><Shield className="mr-2 h-4 w-4" />Change Password</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border/60 card-premium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-emerald-500" />
                        </div>
                        Notifications
                    </CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {notificationOptions.map((option, i) => (
                        <div key={option.key}>
                            {i > 0 && <Separator className="my-2 opacity-50" />}
                            <div className="flex items-center justify-between py-2 rounded-xl">
                                <div className="space-y-0.5">
                                    <Label htmlFor={`notif-${option.key}`} className="font-semibold text-sm cursor-pointer">
                                        {option.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {option.description}
                                    </p>
                                </div>
                                <Switch
                                    id={`notif-${option.key}`}
                                    checked={notifications[option.key]}
                                    onCheckedChange={() => toggleNotification(option.key)}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30 card-premium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </div>
                        Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                        <div>
                            <p className="font-semibold text-sm">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="shrink-0 rounded-xl">
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account
                                        and remove all your data including QR codes, analytics, and settings.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2 py-2">
                                    <Label htmlFor="delete-confirm-pwd">Enter your password to confirm</Label>
                                    <Input
                                        id="delete-confirm-pwd"
                                        type="password"
                                        placeholder="Your current password"
                                        value={deletePassword}
                                        onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
                                        className="h-11 rounded-xl"
                                    />
                                    {deleteError && (
                                        <div className="flex items-center gap-2 text-sm text-destructive">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            {deleteError}
                                        </div>
                                    )}
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel
                                        onClick={() => { setDeletePassword(""); setDeleteError(null); }}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </AlertDialogCancel>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={deleting || !deletePassword}
                                        className="rounded-xl"
                                    >
                                        {deleting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
                                        ) : "Delete my account"}
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
