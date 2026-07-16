import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://formularios.ia.br'),
    title: 'formularios.ia — Formulários profissionais, do jeito brasileiro',
    description: 'Crie formulários com a sua marca, valide CPF, CNPJ e WhatsApp de verdade e descubra insights com IA. Em português, com dados no Brasil — e grátis pra começar.',
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'formularios.ia — Formulários profissionais, do jeito brasileiro',
        description: 'Formulários com a sua marca, campos brasileiros e IA. Grátis pra começar, dados no Brasil.',
        type: 'website',
        siteName: 'formularios.ia',
        images: [
            {
                url: '/opengraph-image.png',
                width: 1200,
                height: 630,
                alt: 'formularios.ia — Formulários profissionais, do jeito brasileiro',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'formularios.ia — Formulários profissionais, do jeito brasileiro',
        description: 'Formulários com a sua marca, WhatsApp e IA. Grátis pra começar.',
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
