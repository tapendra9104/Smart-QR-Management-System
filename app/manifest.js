export default function manifest() {
    return {
        name: 'QR Manager',
        short_name: 'QR Manager',
        description: 'Create, manage, and track QR codes in one place',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6d28d9',
        orientation: 'any',
        prefer_related_applications: false,
        icons: [
            {
                src: '/icon-light-32x32.png',
                sizes: '32x32',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Create QR Code',
                short_name: 'Create',
                url: '/dashboard/create',
                icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
                name: 'Scan QR Code',
                short_name: 'Scan',
                url: '/dashboard/scanner',
                icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
        ],
        screenshots: [],
        categories: ['productivity', 'utilities', 'business'],
    };
}
