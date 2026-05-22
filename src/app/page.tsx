import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { ModulesGrid } from '@/components/landing/modules-grid';
import { Pricing } from '@/components/landing/pricing';
import { About } from '@/components/landing/about';
import { Cta } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <ModulesGrid />
      <Pricing />
      <About />
      <Cta />
      <Footer />
    </>
  );
}
