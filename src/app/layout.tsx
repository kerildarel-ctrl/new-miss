import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoteMoi — Votre vote, votre choix, votre champion',
  description: 'Plateforme web professionnelle de vote pour compétitions, concours de beauté, événements campus et élections. Tarif unique : 100 FCFA.',
  keywords: ['VoteMoi', 'Vote', 'Compétition', 'COPA AHN', 'COPA MSP LSI', 'Élection', 'Concours', '100 FCFA'],
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
  openGraph: {
    title: 'VoteMoi — Plateforme de Vote',
    description: 'Votre vote, votre choix, votre champion. 100 FCFA le vote.',
    type: 'website',
  },
};

import { ClientProviders } from '@/components/ClientProviders';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-poppins selection:bg-[var(--p)] selection:text-white" suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

