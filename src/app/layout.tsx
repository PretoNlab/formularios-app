import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://formularios.ia'),
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
    },
    twitter: {
        card: 'summary_large_image',
        title: 'formularios.ia — Formulários Inteligentes',
        description: 'Crie formulários conversacionais incríveis em segundos.',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
                {children}
            </body>
        </html>
    );
}
