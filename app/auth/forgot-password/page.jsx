'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'Something went wrong');
            }
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-green-500/10 p-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">Check your email</CardTitle>
                            <CardDescription>
                                If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset link.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
                            </p>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/auth/login">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to login
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Forgot password?</CardTitle>
                        <CardDescription>
                            Enter your email and we&apos;ll send you a reset link
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
                                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                        <p className="text-sm text-destructive">{error}</p>
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send reset link'}
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
            </div>
        </div>
    );
}
