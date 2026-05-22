import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
            Zentral
          </Link>

          <nav className="flex gap-6 text-sm text-zinc-600">
            <Link href="#modulos" className="hover:text-zinc-900">
              Módulos
            </Link>
            <Link href="#precios" className="hover:text-zinc-900">
              Precios
            </Link>
            <Link href="#sobre-nosotros" className="hover:text-zinc-900">
              Sobre nosotros
            </Link>
            <Link href="#contacto" className="hover:text-zinc-900">
              Contacto
            </Link>
          </nav>

          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Zentral. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
