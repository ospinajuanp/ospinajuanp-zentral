'use client';

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

interface ModuleCard {
  key: string;
  name: string;
  description: string;
  tier: 'free' | 'premium';
  status: 'active' | 'inactive' | 'coming_soon';
}

export function ModulesGridCards({ modules }: { modules: ModuleCard[] }) {
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: false, loop: false });

  const scrollPrev = useCallback(() => {
    if (emblaApi?.canScrollPrev()) emblaApi.scrollPrev();
  }, [emblaApi]);
  const scrollNext = useCallback(() => {
    if (emblaApi?.canScrollNext()) emblaApi.scrollNext();
  }, [emblaApi]);

  /* sync scroll boundary state with embla events */
  useEffect(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  const visibleModules = showAllMobile ? modules : modules.slice(0, 4);

  return (
    <div className="mt-16">
      {/* Desktop: Embla carousel */}
        <div className="hidden sm:block overflow-hidden -mx-4 px-4" ref={emblaRef}>
          <div className="flex items-stretch gap-6">
            {modules.map((mod) => (
              <div key={mod.key} className="min-w-0 shrink-0 grow-0 basis-[18rem] flex flex-col">
                <ModuleBox module={mod} />
              </div>
            ))}
          </div>
        </div>

      {/* Desktop carousel controls below */}
        <div className="mt-8 hidden justify-center gap-3 sm:flex">
          <button onClick={scrollPrev}
            className={`rounded-full border border-slate-700 p-2.5 transition-colors ${!canScrollPrev ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            aria-label="Anterior"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={scrollNext}
            className={`rounded-full border border-slate-700 p-2.5 transition-colors ${!canScrollNext ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            aria-label="Siguiente"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

      {/* Mobile: first 4 + expand button */}
      <div className="grid gap-6 sm:hidden">
        {visibleModules.map((mod) => (
          <ModuleBox key={mod.key} module={mod} />
        ))}
        {!showAllMobile && modules.length > 4 && (
          <button onClick={() => setShowAllMobile(true)}
            className="w-full rounded-md border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
          >
            Ver {modules.length - 4} módulo{modules.length - 4 !== 1 ? 's' : ''} más
          </button>
        )}
        {showAllMobile && modules.length > 4 && (
          <button onClick={() => setShowAllMobile(false)}
            className="w-full rounded-md border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
          >
            Mostrar menos
          </button>
        )}
      </div>
    </div>
  );
}

function ModuleBox({ module }: { module: ModuleCard }) {
  const mod = module;

  const statusLabel =
    mod.status === 'active' ? 'Activo' :
    mod.status === 'coming_soon' ? 'Próximamente' :
    'Inactivo';

  return (
    <div className="flex h-full flex-col rounded-md border border-slate-800 bg-slate-900 p-6 transition-shadow hover:shadow-indigo-500/10">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            mod.tier === 'free'
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-indigo-500/10 text-indigo-400'
          }`}
        >
          {mod.tier === 'free' ? 'Gratis' : 'Premium'}
        </span>
        <span
          className={`text-xs font-medium ${
            mod.status === 'active' ? 'text-emerald-500' :
            mod.status === 'coming_soon' ? 'text-amber-400' :
            'text-slate-500'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-white">{mod.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
        {mod.description}
      </p>
    </div>
  );
}
