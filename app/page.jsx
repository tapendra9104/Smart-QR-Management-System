import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  QrCode, Scan, BarChart3, Zap, Shield, Globe,
  ArrowRight, CheckCircle2, Sparkles, TrendingUp,
  Users, Star, ChevronRight
} from "lucide-react";

export const metadata = {
  title: "QR Manager — Create, Manage & Track QR Codes",
  description: "Generate dynamic QR codes with full customization, track scans in real-time, and manage your QR campaigns all in one place.",
};

const stats = [
  { value: "2M+", label: "QR Codes Created" },
  { value: "50M+", label: "Scans Tracked" },
  { value: "150K+", label: "Happy Users" },
  { value: "99.9%", label: "Uptime SLA" },
];

const features = [
  {
    icon: QrCode,
    title: "Custom QR Codes",
    description: "Create stunning QR codes with custom colors, logos, patterns, and styles that match your brand perfectly.",
    items: ["Custom colors & gradients", "Logo embedding", "Multiple QR styles"],
    color: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-500/20",
  },
  {
    icon: Zap,
    title: "Dynamic QR Codes",
    description: "Change the destination URL anytime without reprinting. Track every scan in real time.",
    items: ["Update URLs anytime", "Short redirect links", "Never reprint codes"],
    color: "from-amber-500 to-orange-500",
    glow: "group-hover:shadow-amber-500/20",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Deep insights into every scan — location, device, time, and trends across all your campaigns.",
    items: ["Real-time tracking", "Device breakdown", "Geographic insights"],
    color: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    icon: Scan,
    title: "Built-in Scanner",
    description: "Scan any QR code directly in your browser using camera or file upload — no app required.",
    items: ["Camera scanning", "Image file upload", "Scan history"],
    color: "from-sky-500 to-blue-500",
    glow: "group-hover:shadow-sky-500/20",
  },
  {
    icon: Globe,
    title: "Bulk Generation",
    description: "Generate hundreds of QR codes at once from CSV files. Download all in one ZIP with one click.",
    items: ["CSV import", "Batch ZIP download", "Progress tracking"],
    color: "from-pink-500 to-rose-500",
    glow: "group-hover:shadow-pink-500/20",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with JWT auth, account lockout, signed redirects, and HMAC validation.",
    items: ["JWT + HMAC security", "Account lockout", "GDPR compliant"],
    color: "from-indigo-500 to-violet-500",
    glow: "group-hover:shadow-indigo-500/20",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Marketing Director",
    content: "QR Manager transformed how we run campaigns. The analytics alone are worth 10x the price.",
    stars: 5,
  },
  {
    name: "James Liu",
    role: "Product Manager",
    content: "Dynamic QR codes are a game changer. We updated our landing page destination 3 times in one day without reprinting anything.",
    stars: 5,
  },
  {
    name: "Fatima Al-Hassan",
    role: "Event Coordinator",
    content: "Bulk generation saved us hours of manual work. Generated 500 QR codes for our conference in under 2 minutes.",
    stars: 5,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Header ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-brand-text">QR Manager</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="gradient-brand border-0 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-90 transition-all duration-300">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background mesh gradient orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-orb" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/15 blur-[100px] animate-orb" style={{ animationDelay: "-4s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[80px] animate-orb" style={{ animationDelay: "-8s" }} />
        </div>

        <div className="container px-4 mx-auto relative">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-in-up mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Enterprise-Grade QR Management Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up-delay-1 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6 leading-[1.1]">
              Create, Manage &amp;{" "}
              <span className="gradient-brand-text">Track Your</span>
              {" "}QR Codes
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-in-up-delay-2 text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Generate dynamic QR codes with full customization, track every scan in real-time,
              and manage your entire QR campaign from one powerful dashboard.
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gradient-brand border-0 text-white text-base px-8 h-12 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:opacity-90 transition-all duration-300 animate-pulse-glow">
                  Start For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard/scanner">
                <Button size="lg" variant="outline" className="text-base px-8 h-12 hover:bg-muted/50 transition-all duration-300">
                  <Scan className="mr-2 h-5 w-5" />
                  Try Scanner Free
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="animate-fade-in-up-delay-4 flex items-center gap-6 mt-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                GDPR compliant
              </span>
            </div>
          </div>

          {/* Hero visual — floating QR mockup */}
          <div className="animate-fade-in-up-delay-5 mt-16 flex justify-center">
            <div className="relative">
              {/* Main card */}
              <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/10 overflow-hidden w-80 sm:w-96">
                <div className="h-12 border-b border-border/60 bg-muted/30 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400/70" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
                    <div className="h-3 w-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 mx-4 h-5 rounded-md bg-muted/50 text-xs text-muted-foreground flex items-center px-2">
                    qrmanager.app/dashboard
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Preview</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">Active</span>
                  </div>
                  {/* Simulated QR pattern */}
                  <div className="mx-auto w-40 h-40 rounded-xl bg-gradient-to-br from-primary/5 to-violet-500/5 border border-border/60 flex items-center justify-center animate-float">
                    <div className="grid grid-cols-7 gap-0.5 p-3">
                      {Array.from({ length: 49 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-4 w-4 rounded-sm transition-all ${
                            [0,1,2,3,4,5,6,7,14,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,42,43,44,45,46,47,48,8,9,11,12,13,15,16,17,19,20].includes(i)
                              ? 'bg-primary'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Scans</span>
                      <span className="font-bold text-primary">1,247</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-3/4 gradient-brand rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat pills */}
              <div className="absolute -left-12 top-1/4 glass-card rounded-xl px-4 py-2.5 shadow-lg animate-float-reverse hidden sm:block">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">This week</p>
                    <p className="text-sm font-bold">+342 scans</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-12 bottom-1/4 glass-card rounded-xl px-4 py-2.5 shadow-lg animate-float hidden sm:block" style={{ animationDelay: "-3s" }}>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Countries</p>
                    <p className="text-sm font-bold">28 reached</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section id="stats" className="border-y border-border/50 bg-muted/30 py-12">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className={`text-center animate-fade-in-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl sm:text-4xl font-black gradient-brand-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Everything You Need
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Powerful features for{" "}
              <span className="gradient-brand-text">every use case</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From simple static QR codes to dynamic enterprise campaigns with real-time analytics.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group card-premium rounded-2xl border border-border/60 bg-card p-6 animate-fade-in-up`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Icon */}
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg ${feature.glow} group-hover:shadow-lg transition-shadow duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{feature.description}</p>

                  <ul className="space-y-2">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-muted/20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Loved by <span className="gradient-brand-text">thousands</span>
            </h2>
            <p className="text-muted-foreground text-lg">See what our users have to say</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`rounded-2xl border border-border/60 bg-card p-6 card-premium animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/15 blur-[100px]" />
        </div>
        <div className="container px-4 mx-auto text-center relative">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Create your first QR code in seconds. Free forever, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gradient-brand border-0 text-white text-base px-10 h-12 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:opacity-90 transition-all duration-300">
                  Create Your First QR Code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-base px-10 h-12">
                  Sign In
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-10">
        <div className="container px-4 mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center shadow">
              <QrCode className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold gradient-brand-text">QR Manager</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link>
            <Link href="/dashboard/scanner" className="hover:text-foreground transition-colors">Scanner</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} QR Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
