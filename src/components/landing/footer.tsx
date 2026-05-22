import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Zentral
          </Link>

          <nav className="flex gap-6 text-sm text-slate-400">
            <Link href="#modulos" className="hover:text-white">
              Módulos
            </Link>
            <Link href="#precios" className="hover:text-white">
              Precios
            </Link>
            <Link href="#sobre-nosotros" className="hover:text-white">
              Sobre nosotros
            </Link>
            <Link href="#contacto" className="hover:text-white">
              Contacto
            </Link>
          </nav>

          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Zentral. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
