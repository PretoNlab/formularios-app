import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://formularios.ia.br';
    
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/builder/', '/responses/', '/settings/', '/billing/', '/onboarding/', '/design/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
