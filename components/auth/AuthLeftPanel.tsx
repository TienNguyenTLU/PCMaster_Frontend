// Static avatar images from Figma assets
const imgUser1 = 'http://localhost:3845/assets/373e222d3ee0669a93b4ecb3b8e12749ae5ceca6.png';
const imgUser2 = 'http://localhost:3845/assets/e63753c7b081ef97d5bd42a633742261e18569c4.png';
const imgUser3 = 'http://localhost:3845/assets/668aea21a2a3104fae1aa96c496e9d80d4e617e3.png';

export default function AuthLeftPanel() {
  return (
    <div className="col-span-7 flex flex-col gap-6 items-start self-center">
      {/* Label */}
      <p
        className="text-[#0058be] text-[14px] tracking-[2.8px] uppercase font-normal"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        LABORATORY ACCESS
      </p>

      {/* Heading */}
      <div
        className="flex flex-col leading-none"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <span className="text-[#191c1e] text-[96px] tracking-[-4.8px] leading-[96px] font-normal">
          Join the
        </span>
        <span className="text-[#191c1e] text-[96px] tracking-[-4.8px] leading-[96px] font-extrabold">
          PCMaster
        </span>
      </div>

      {/* Description */}
      <div className="max-w-[448px] pt-4">
        <p
          className="text-[#424754] text-[20px] leading-[32.5px] font-normal"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Precision-engineered tools for the ultimate PC building experience.
          Access high-fidelity specifications and laboratory-grade guides.
        </p>
      </div>

      {/* Social proof */}
      <div className="flex items-center gap-4 pt-8">
        {/* Avatar stack */}
        <div className="flex items-center">
          {[imgUser1, imgUser2, imgUser3].map((src, i) => (
            <div
              key={i}
              className="size-[40px] rounded-[12px] border-2 border-[#f7f9fb] bg-[#e2e8f0] overflow-hidden p-[2px]"
              style={{ marginRight: i < 2 ? '-12px' : '0', zIndex: 3 - i, position: 'relative' }}
            >
              <img
                src={src}
                alt={`User ${i + 1}`}
                className="size-[36px] rounded-[10px] object-cover"
              />
            </div>
          ))}
        </div>
        <p
          className="text-[#424754] text-[14px] font-normal"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Used by 50k+ builders worldwide.
        </p>
      </div>
    </div>
  );
}
