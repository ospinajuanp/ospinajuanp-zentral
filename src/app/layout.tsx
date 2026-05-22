import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zentral — Micro-SaaS Studio",
  description: "Ecosistema modular de herramientas de gestión empresarial.",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-200">{children}</body>
    </html>
  );
}
