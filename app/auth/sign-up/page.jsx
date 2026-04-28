'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ApiClientError } from '@/lib/api/client';
import { Eye, EyeOff, CheckCircle2, XCircle, QrCode, ArrowRight, Loader2, Sparkles } from 'lucide-react';

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
    if (score <= 1) return { label: 'Very Weak', color: 'text-red-500', bar: 'bg-red-500' };
    if (score === 2) return { label: 'Weak', color: 'text-orange-500', bar: 'bg-orange-500' };
    if (score === 3) return { label: 'Fair', color: 'text-yellow-500', bar: 'bg-yellow-500' };
    if (score === 4) return { label: 'Good', color: 'text-blue-500', bar: 'bg-blue-500' };
    return { label: 'Strong', color: 'text-emerald-500', bar: 'bg-emerald-500' };
}

export default function SignUpPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    const strengthInfo = useMemo(() => getStrengthLabel(passwordStrength), [passwordStrength]);

    const passwordChecks = useMemo(() => [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Lowercase letter', met: /[a-z]/.test(password) },
        { label: 'A number', met: /\d/.test(password) },
        { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
    ], [password]);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setIsLoading(false);
            return;
        }
        if (password !== repeatPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName.trim() || null,
                }),
            });
            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new ApiClientError(payload?.message || 'Registration failed', response.status);
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
            <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden gradient-brand items-center justify-center">
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-1/3 left-1/3 w-56 h-56 rounded-full bg-white/10 blur-[50px] animate-orb" />
                    <div className="absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full bg-white/10 blur-[40px] animate-orb" style={{ animationDelay: "-5s" }} />
                </div>
                <div className="relative z-10 text-white text-center px-10">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 animate-float">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black mb-3">Join QR Manager</h1>
                    <p className="text-white/80 text-base leading-relaxed max-w-xs mx-auto">
                        Create unlimited QR codes and track every scan with powerful analytics.
                    </p>
                    <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
                        {["Free to start", "No credit card", "GDPR ready", "99.9% uptime"].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-white/90">
                                <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: form */}
            <div className="flex flex-1 items-center justify-center p-6 md:p-10 overflow-y-auto">
                <div className="w-full max-w-sm animate-fade-in-up">
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
                        <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
                            <QrCode className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-black gradient-brand-text">QR Manager</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-black tracking-tight mb-1">Create an account</h2>
                        <p className="text-muted-foreground text-sm">Join thousands of teams using QR Manager</p>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-name">Full Name</Label>
                            <Input
                                id="signup-name"
                                type="text"
                                placeholder="Jane Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 pr-11 rounded-xl border-border/60 focus:border-primary transition-colors"
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
                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${strengthInfo.bar}`}
                                                style={{ width: `${(passwordStrength / 6) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-semibold ${strengthInfo.color}`}>{strengthInfo.label}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {passwordChecks.map((check) => (
                                            <div key={check.label} className="flex items-center gap-1.5 text-xs">
                                                {check.met
                                                    ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                                    : <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                                                }
                                                <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-confirm">Confirm Password</Label>
                            <Input
                                id="signup-confirm"
                                type="password"
                                required
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                                className="h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                            />
                            {repeatPassword.length > 0 && password !== repeatPassword && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Passwords do not match
                                </p>
                            )}
                            {repeatPassword.length > 0 && password === repeatPassword && password.length >= 8 && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Passwords match
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 gradient-brand border-0 text-white rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 transition-all duration-300"
                            disabled={isLoading || password.length < 8 || password !== repeatPassword}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create an account
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
