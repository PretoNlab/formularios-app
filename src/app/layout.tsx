import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://formularios.ia.br'),
    title: 'formularios.ia — Formulários Inteligentes',
    description: 'Crie formulários conversacionais incríveis em segundos. Ferramenta no-code definitiva para pesquisa e engajamento.',
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'formularios.ia — Formulários Inteligentes',
        description: 'Crie formulários conversacionais incríveis em segundos. Potencialize suas pesquisas e leads com a nossa IA.',
        type: 'website',
        siteName: 'formularios.ia',
        images: [
            {
                url: '/opengraph-image.png',
                width: 1200,
                height: 630,
                alt: 'formularios.ia',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'formularios.ia — Formulários Inteligentes',
        description: 'Crie formulários conversacionais incríveis em segundos.',
        images: ['/twitter-image.png'],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen flex flex-col`}>
                {/* Microsoft Clarity */}
                <Script 
                    id="microsoft-clarity" 
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function(c,l,a,r,i,t,y){
                                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                            })(window, document, "clarity", "script", "w9l47p9pke");
                        `
                    }}
                />
                {children}
            </body>
        </html>
    );
}
