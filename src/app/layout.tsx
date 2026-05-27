import type { Metadata } from 'next';
import { AppProviders } from '@/components/app-providers';
import { MaintenanceGuard } from '@/components/maintenance-guard';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Zentral — Micro-SaaS Studio',
    template: '%s | Zentral',
  },
  description:
    'Plataforma modular de herramientas de gestion empresarial. Activa solo los modulos que necesitas, paga solo por lo que usas.',
  keywords: ['micro saas', 'herramientas empresariales', 'gestion', 'transfercheck', 'facturacion', 'antecedentes', 'cartera'],
  authors: [{ name: 'Zentral' }],
  creator: 'Zentral',
  openGraph: {
    title: 'Zentral — Micro-SaaS Studio',
    description:
      'Plataforma modular de herramientas de gestion empresarial. Activa solo los modulos que necesitas, paga solo por lo que usas.',
    siteName: 'Zentral',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zentral — Micro-SaaS Studio',
    description:
      'Plataforma modular de herramientas de gestion empresarial. Activa solo los modulos que necesitas, paga solo por lo que usas.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-200 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Saltar al contenido
        </a>
        <MaintenanceGuard>
          <AppProviders>{children}</AppProviders>
        </MaintenanceGuard>
      </body>
    </html>
  );
}
