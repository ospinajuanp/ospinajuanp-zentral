'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';

interface PlanCardData {
  _id: string;
  name: string;
  price: string;
  description: string;
  cta: string;
  highlighted: boolean;
  isEnterprise: boolean;
  maxUsers: number;
  ctaLink: string;
  extraFeatures: string[];
  support: string;
  onboarding: string;
  includedModules?: Array<{
    module: { name: string; key: string; defaultQuota: number };
    quotaOverride: number | null;
  }>;
}

export function PricingCards({ plans }: { plans: PlanCardData[] }) {
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

  /* prevent link clicks during drag */
  const draggedRef = useRef(false);
  /* prevent reInit from cancelling scroll animation */
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onPointerDown = () => { draggedRef.current = false; };
    const onScroll = () => {
      draggedRef.current = true;
      isScrollingRef.current = true;
    };
    const onSettle = () => {
      isScrollingRef.current = false;
    };
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    /* sync initial boundary state — select event may have already fired */
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    emblaApi.on('pointerDown', onPointerDown);
    emblaApi.on('scroll', onScroll);
    emblaApi.on('settle', onSettle);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('pointerDown', onPointerDown);
      emblaApi.off('scroll', onScroll);
      emblaApi.off('settle', onSettle);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  /* reInit carousel when slide heights change (e.g., feature expand/collapse)
     - skip while scroll animation is in progress to avoid cancelling it */
  useEffect(() => {
    if (!emblaApi) return;
    const container = emblaApi.containerNode();
    const observer = new ResizeObserver(() => {
      if (isScrollingRef.current) return;
      emblaApi.reInit();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [emblaApi]);

  const visiblePlans = showAllMobile ? plans : plans.slice(0, 3);

  return (
    <div className="mt-16">
      {/* Desktop: Embla carousel */}
        <div className="hidden sm:block overflow-hidden -mx-4 px-4" ref={emblaRef}>
          <div className="flex items-stretch gap-8">
            {plans.map((p) => (
              <div key={p._id} className="min-w-0 shrink-0 grow-0 basis-[22rem] flex flex-col">
                <PlanCard plan={p} draggedRef={draggedRef} />
              </div>
            ))}
          </div>
        </div>

      {/* Desktop carousel controls below cards */}
        <div className="mt-10 hidden justify-center gap-3 sm:flex">
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

      {/* Mobile: first 3 + expand button */}
      <div className="grid gap-8 sm:hidden">
        {visiblePlans.map((p) => (
          <PlanCard key={p._id} plan={p} />
        ))}
        {!showAllMobile && plans.length > 3 && (
          <button onClick={() => setShowAllMobile(true)}
            className="w-full rounded-md border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
          >
            Ver {plans.length - 3} plan{(plans.length - 3) !== 1 ? 'es' : ''} más
          </button>
        )}
        {showAllMobile && plans.length > 3 && (
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

function PlanCard({ plan, draggedRef }: { plan: PlanCardData; draggedRef?: React.RefObject<boolean | null> }) {
  const p = plan;
  const [expanded, setExpanded] = useState(false);

  const includedModules = (p.includedModules ?? []) as Array<{
    module: { name: string; key: string; defaultQuota: number };
    quotaOverride: number | null;
  }>;

  const moduleNames = includedModules.map((im) => im.module?.name).filter(Boolean).join(', ');
  const totalQuota = includedModules.reduce(
    (s, im) => s + (im.quotaOverride ?? im.module?.defaultQuota ?? 0), 0
  );
  const features: string[] = [
    `Módulos: ${moduleNames}`,
    `${p.maxUsers} usuario${p.maxUsers !== 1 ? 's' : ''}`,
    p.maxUsers === 0 ? 'Usuarios ilimitados' : '',
    ...(totalQuota > 0
      ? [`Hasta ${totalQuota} consultas / mes en total`]
      : ['Consultas ilimitadas']),
    ...p.extraFeatures,
  ].filter(Boolean);

  const supportLabel = p.support && p.support !== 'ninguno' ? `Soporte: ${p.support}` : '';
  const onboardingLabel = p.onboarding && p.onboarding !== 'ninguno' ? `Onboarding: ${p.onboarding}` : '';

  const allFeatures = [...features, supportLabel, onboardingLabel].filter(Boolean);

  const MAX_VISIBLE = 5;
  const showToggle = allFeatures.length > MAX_VISIBLE;
  const visibleFeatures = expanded ? allFeatures : allFeatures.slice(0, MAX_VISIBLE);

  const isEnterprise = p.isEnterprise || !p.price || p.price === 'A medida' || p.price === 'Personalizado';

  const isExternal = p.ctaLink?.startsWith('http');

  const ctaClassName = `mt-6 block w-full rounded-md py-3 text-center text-sm font-medium transition-all ${
    p.highlighted
      ? 'bg-white text-zinc-900 hover:bg-zinc-100'
      : 'border border-slate-700 text-slate-200 hover:bg-slate-800'
  }`;

  return (
    <div
      className={`relative flex h-full flex-col rounded-md border p-8 ${
        isEnterprise
          ? 'border-dashed border-amber-700/50 bg-slate-900'
          : p.highlighted
            ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl'
            : 'border-slate-800 bg-slate-900'
      }`}
    >
      {p.highlighted && (
        <span className="-mt-6 mb-4 mx-auto w-fit rounded-full bg-zinc-800 px-4 py-1 text-xs font-medium text-zinc-300">
          Más popular
        </span>
      )}

      {/* pinned top content */}
      <h3 className="text-lg font-semibold text-white">{p.name}</h3>
      <p className={`mt-1 text-sm ${p.highlighted ? 'text-zinc-400' : 'text-slate-400'}`}>
        {p.description}
      </p>

      {p.price && (
        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-4xl font-bold">{p.price}</span>
          {!isEnterprise && (
            <span className={`text-sm ${p.highlighted ? 'text-zinc-400' : 'text-slate-500'}`}>
              /mes
            </span>
          )}
        </div>
      )}

      {/* flexible features area */}
      <ul className="mt-8 flex-1 space-y-3">
        {visibleFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <svg
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                p.highlighted ? 'text-emerald-400' : 'text-emerald-500'
              }`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {showToggle && (
        <button onClick={() => setExpanded(!expanded)}
          className={`mt-2 text-xs underline underline-offset-2 ${
            p.highlighted ? 'text-zinc-400 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          {expanded ? 'Ver menos' : `Ver ${allFeatures.length - MAX_VISIBLE} característica${allFeatures.length - MAX_VISIBLE !== 1 ? 's' : ''} más`}
        </button>
      )}

      {isExternal ? (
        <a
          href={p.ctaLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (draggedRef?.current) e.preventDefault();
          }}
          className={ctaClassName}
        >
          {p.cta}
        </a>
      ) : (
        <Link
          href={p.ctaLink || '#'}
          onClick={(e) => {
            if (draggedRef?.current) e.preventDefault();
          }}
          className={ctaClassName}
        >
          {p.cta}
        </Link>
      )}
    </div>
  );
}
