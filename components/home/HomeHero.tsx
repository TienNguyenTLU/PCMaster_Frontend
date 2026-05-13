import Link from 'next/link';

const imgPC = 'http://localhost:3845/assets/3fc0fbbb64b098f587482e466fbf7df039ea5484.png';

export default function HomeHero() {
  return (
    <section className="bg-[#f2f4f6] rounded-[16px] overflow-hidden relative h-[860px] w-full max-w-[1536px] mx-auto">
      {/* Background image – right half */}
      <div className="absolute right-0 top-0 h-full w-[573px]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={imgPC}
            alt="High-end custom PC workstation"
            className="absolute h-full max-w-none"
            style={{ left: '-110.83%', width: '270.08%', top: '0.01%' }}
          />
          <div className="absolute inset-0 bg-[rgba(255,255,255,0.2)] mix-blend-saturation" />
        </div>
        {/* Fade gradient left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f2f4f6] via-[rgba(242,244,246,0)] to-[rgba(242,244,246,0)]" />
      </div>

      {/* Text content – left half */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-[446px] p-20 flex flex-col gap-6">
        {/* Badge */}
        <div className="inline-flex">
          <span
            className="bg-[rgba(0,88,190,0.1)] text-[#0058be] text-[12px] tracking-[1.2px] uppercase px-3 py-1 rounded-[4px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            2024 COLLECTION
          </span>
        </div>

        {/* Headline */}
        <div>
          <p
            className="text-[#191c1e] text-[64px] tracking-[-4.8px] leading-[96px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Architect Your
          </p>
          <p
            className="text-[#0b82d2] text-[64px] tracking-[-4.8px] leading-[96px] font-bold"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Powerful PC
          </p>
        </div>

        {/* Description */}
        <div className="max-w-[512px] pt-2">
          <p
            className="text-[#424754] text-[18px] leading-[29.25px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Experience precision engineering with our custom-built workstations.
            Every component is selected for maximum synergy and thermal efficiency.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-4 pt-4">
          <Link
            href="/explore"
            className="
              relative bg-gradient-to-r from-[#0058be] to-[#2170e4]
              text-white text-[16px] leading-[24px] font-normal
              px-8 py-[17px] rounded-[8px]
              shadow-[0px_10px_15px_-3px_rgba(0,88,190,0.2),0px_4px_6px_-4px_rgba(0,88,190,0.2)]
              hover:opacity-90 transition-opacity
            "
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Build Your PC
          </Link>
          <Link
            href="/explore"
            className="
              border border-[rgba(194,198,214,0.3)] text-[#191c1e] text-[16px] leading-[24px] font-normal
              px-[33px] py-[17px] rounded-[8px]
              hover:border-[rgba(194,198,214,0.8)] transition-colors
            "
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Explore
          </Link>
        </div>
      </div>
    </section>
  );
}
