'use client';

import Link from 'next/link';
import { useState } from 'react';

const navLinks = [
  { label: 'Inicio', href: '#' },
  { label: 'Módulos', href: '#modulos' },
  { label: 'Precios', href: '#precios' },
  { label: 'Sobre Nosotros', href: '#sobre-nosotros' },
  { label: 'Contacto', href: '#contacto' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
          Zentral
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Iniciar Sesión
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center md:hidden"
          aria-label="Menú"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-6 pb-4 pt-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-zinc-600"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white"
          >
            Iniciar Sesión
          </Link>
        </div>
      )}
    </header>
  );
}
