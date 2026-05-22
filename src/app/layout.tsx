import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zentral — Micro-SaaS Studio",
    template: "%s | Zentral",
  },
  description:
    "Plataforma modular de herramientas de gestión empresarial. Activa solo los módulos que necesitas, paga solo por lo que usas.",
  openGraph: {
    title: "Zentral — Micro-SaaS Studio",
    description:
      "Plataforma modular de herramientas de gestión empresarial. Activa solo los módulos que necesitas, paga solo por lo que usas.",
    siteName: "Zentral",
    locale: "es_CO",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-200 antialiased">{children}</body>
    </html>
  );
}
