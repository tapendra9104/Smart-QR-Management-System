'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { Eye, EyeOff, AlertCircle, QrCode, ArrowRight, Loader2 } from 'lucide-react';


export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new ApiClientError(payload?.message || 'Login failed', response.status);
            }
            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full">
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-brand items-center justify-center">
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-[60px] animate-orb" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-[40px] animate-orb" style={{ animationDelay: "-4s" }} />
                </div>
                <div className="relative z-10 text-white text-center px-12">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 animate-float">
                        <QrCode className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black mb-3">Welcome back!</h1>
                    <p className="text-white/80 text-lg leading-relaxed max-w-xs mx-auto">
                        Sign in to manage your QR codes and track analytics.
                    </p>
                    <div className="mt-10 space-y-3">
                        {["Dynamic QR codes", "Real-time analytics", "Bulk generation"].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-white/90 text-sm">
                                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">✓</span>
                                </div>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: form */}
            <div className="flex flex-1 items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm animate-fade-in-up">
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
                        <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
                            <QrCode className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-black gradient-brand-text">QR Manager</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-black tracking-tight mb-1">Sign in</h2>
                        <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                aria-invalid={!!error}
                                className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="login-password">Password</Label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="h-11 pr-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                                    aria-invalid={!!error}
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
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3">
                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 gradient-brand border-0 text-white rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/sign-up" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                            Sign up free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
