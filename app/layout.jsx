import { Geist, Geist_Mono } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geist = Geist({
    subsets: ['latin'],
    variable: '--font-geist-sans',
});
const geistMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-geist-mono',
});

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    ],
};

export const metadata = {
    title: {
        template: '%s | QR Manager',
        default: 'QR Manager — Create, Manage & Track QR Codes',
    },
    description:
        'Generate dynamic QR codes with full customization, track scans in real-time, and manage your QR campaigns all in one place.',
    metadataBase: new URL(process.env.APP_FRONTEND_URL || 'http://localhost:3000'),
    formatDetection: {
        telephone: false,
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'QR Manager',
    },
    other: {
        'color-scheme': 'light dark',
        'mobile-web-app-capable': 'yes',
    },
    openGraph: {
        title: 'QR Manager — Create, Manage & Track QR Codes',
        description:
            'Generate dynamic QR codes with full customization, track scans in real-time, and manage your QR campaigns all in one place.',
        siteName: 'QR Manager',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'QR Manager — Create, Manage & Track QR Codes',
        description:
            'Generate dynamic QR codes with full customization, track scans in real-time, and manage your QR campaigns all in one place.',
    },
    icons: {
        icon: [
            {
                url: '/icon-light-32x32.png',
                media: '(prefers-color-scheme: light)',
            },
            {
                url: '/icon-dark-32x32.png',
                media: '(prefers-color-scheme: dark)',
            },
            {
                url: '/icon.svg',
                type: 'image/svg+xml',
            },
        ],
        apple: '/apple-icon.png',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster richColors closeButton />
                </ThemeProvider>

            </body>
        </html>
    );
}
