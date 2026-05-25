import { Suspense } from 'react';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { ModulesGrid } from '@/components/landing/modules-grid';
import { Pricing } from '@/components/landing/pricing';
import { About } from '@/components/landing/about';
import { Cta } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { RefreshOnMount } from '@/components/landing/refresh-on-mount';
import { Spinner } from '@/components/icons';

function SectionFallback() {
  return (
    <section className="border-t border-slate-800 bg-slate-950 px-6 py-24">
      <div className="flex justify-center">
        <Spinner />
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <RefreshOnMount />
      <Header />
      <Hero />
      <Features />
      <Suspense fallback={<SectionFallback />}>
        <ModulesGrid />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Pricing />
      </Suspense>
      <About />
      <Cta />
      <Footer />
    </>
  );
}
