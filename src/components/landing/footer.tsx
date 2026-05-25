import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400" aria-label="Enlaces del sitio">
            <Link href="/#modulos" className="hover:text-white">
              Modulos
            </Link>
            <Link href="/#precios" className="hover:text-white">
              Precios
            </Link>
            <Link href="/#sobre-nosotros" className="hover:text-white">
              Sobre nosotros
            </Link>
            <Link href="/#contacto" className="hover:text-white">
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
