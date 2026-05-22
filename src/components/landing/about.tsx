export function About() {
  return (
    <section id="sobre-nosotros" className="border-t border-slate-800 bg-slate-950 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Sobre Zentral
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-400">
            Zentral nace de la necesidad de tener herramientas empresariales modulares,
            accesibles y sin fricción. Creemos que un negocio no debería pagar por
            funcionalidades que no usa, ni lidiar con integraciones complejas.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">
            Cada módulo de Zentral está diseñado para resolver un problema específico,
            y todos conviven bajo un mismo ecosistema. Simple por dentro, potente por fuera.
          </p>
          <p className="mt-4 text-lg font-medium text-slate-300">
            Creado por{' '}
            <a
              href="https://github.com/ospinajuanp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2 hover:text-slate-400"
            >
              OspinaJuanP
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
