import type { Metadata } from 'next';
import HomeNavBar from '@/components/home/HomeNavBar';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomeSpecsBento from '@/components/home/HomeSpecsBento';
import AuthFooter from '@/components/auth/AuthFooter';

export const metadata: Metadata = {
  title: 'PCMaster – Architect Your Powerful PC',
  description:
    'Precision-engineered PC building tools. Browse processors, graphics cards, pre-built systems and build the ultimate workstation.',
};

export default function HomePage() {
  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{ background: 'linear-gradient(90deg, #f7f9fb 0%, #f7f9fb 100%)' }}
    >
      {/* Fixed glassmorphism nav */}
      <HomeNavBar />

      {/* Main content – push down by nav height */}
      <main className="flex flex-col items-center gap-20 pt-24 pb-2">
        {/* Hero */}
        <div className="w-full flex justify-center px-8">
          <HomeHero />
        </div>

        {/* Featured Categories */}
        <HomeCategoriesSection />

        {/* Specs Bento */}
        <HomeSpecsBento />
      </main>

      {/* Footer – reuse auth footer (identical design) */}
      <AuthFooter />
    </div>
  );
}
