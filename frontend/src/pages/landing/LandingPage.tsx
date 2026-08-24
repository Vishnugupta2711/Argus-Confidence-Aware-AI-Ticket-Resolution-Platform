import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { PipelineVisual } from '@/components/landing/PipelineVisual';
import { Features } from '@/components/landing/Features';
import { DualPortal } from '@/components/landing/DualPortal';
import { Architecture } from '@/components/landing/Architecture';
import { TechStackMarquee } from '@/components/landing/TechStackMarquee';
import { Footer } from '@/components/landing/CTAFooter';
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <TechStackMarquee />
      <Architecture />
      <Features />
      <PipelineVisual />
      <DualPortal />
      <Footer />
    </div>
  );
};

