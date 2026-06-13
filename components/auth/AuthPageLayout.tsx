import AuthLeftPanel from '@/components/auth/AuthLeftPanel';
import AuthFooter from '@/components/auth/AuthFooter';

/**
 * Shared layout wrapper for all auth pages (register, login).
 * Children is the right-side form card.
 */
export default function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col min-h-screen w-full isolate"
      style={{ background: 'linear-gradient(90deg, #f7f9fb 0%, #f7f9fb 100%)' }}
    >
      {/* Main content canvas */}
      <main className="relative flex flex-1 items-center justify-center px-6 py-24 overflow-hidden">
        {/* Decorative blurs */}
        <div
          className="absolute rounded-[12px] opacity-20 blur-[60px] bg-[#d3e4fe]"
          style={{ width: 512, height: 552, top: -92, left: -64, zIndex: 0 }}
        />
        <div
          className="absolute rounded-[12px] opacity-30 blur-[50px] bg-[#d8e2ff]"
          style={{ width: 448, height: 460, bottom: -92, right: -64, zIndex: 0 }}
        />

        {/* Content grid */}
        <div
          className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-[1280px] w-full items-center"
        >
          <AuthLeftPanel />
          {children}
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
