export default function robots() {
    const baseUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3000';
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/dashboard/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
