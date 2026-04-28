'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useMemo, Suspense } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';

function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

function getStrengthLabel(score) {
    if (score <= 1) return { label: 'Very Weak', color: 'bg-red-500' };
    if (score === 2) return { label: 'Weak', color: 'bg-orange-500' };
    if (score === 3) return { label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { label: 'Good', color: 'bg-blue-500' };
    if (score >= 5) return { label: 'Strong', color: 'bg-green-500' };
    return { label: '', color: '' };
}

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    const strengthInfo = useMemo(() => getStrengthLabel(passwordStrength), [passwordStrength]);

    const passwordChecks = useMemo(() => [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
        { label: 'Contains a number', met: /\d/.test(password) },
        { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
    ], [password]);

    if (!token) {
        return (
            <Card>
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-destructive/10 p-3">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Invalid link</CardTitle>
                    <CardDescription>
                        This password reset link is invalid or has expired.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" asChild>
                        <Link href="/auth/forgot-password">Request a new link</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card>
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-500/10 p-3">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Password reset!</CardTitle>
                    <CardDescription>
                        Your password has been updated successfully. You can now sign in.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" asChild>
                        <Link href="/auth/login">Sign in</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8 || password !== confirmPassword) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'Failed to reset password');
            }
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Set new password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Progress value={(passwordStrength / 6) * 100} className={`h-1.5 flex-1 [&>div]:${strengthInfo.color}`} />
                                        <span className="text-xs font-medium text-muted-foreground">{strengthInfo.label}</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {passwordChecks.map((check) => (
                                            <li key={check.label} className="flex items-center gap-1.5 text-xs">
                                                {check.met ? (
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 text-muted-foreground" />
                                                )}
                                                <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>
                                                    {check.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {confirmPassword.length > 0 && password !== confirmPassword && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Passwords do not match
                                </p>
                            )}
                        </div>
                        {error && (
                            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || password.length < 8 || password !== confirmPassword}
                        >
                            {isLoading ? 'Resetting...' : 'Reset password'}
                        </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                        <Link href="/auth/login" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline inline-flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" />
                            Back to login
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
