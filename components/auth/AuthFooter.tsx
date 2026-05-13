const imgIcon = 'http://localhost:3845/assets/e682d21e024fdb517726210135b8df79d83143d5.svg';
const imgIcon1 = 'http://localhost:3845/assets/95dc308ea45a1260dcbee6a4172eb02f4b04d95a.svg';

const footerLinks = {
  HARDWARE: ['BUILDS', 'PROCESSORS', 'GRAPHICS'],
  RESOURCES: ['SUPPORT', 'WARRANTY', 'SHIPPING'],
  LEGAL: ['PRIVACY POLICY', 'TERMS OF SERVICE'],
};

export default function AuthFooter() {
  return (
    <footer className="bg-[#f1f5f9] w-full">
      <div className="max-w-[1536px] mx-auto px-12 py-16 grid grid-cols-4 gap-8">
        {/* Brand column */}
        <div className="flex flex-col gap-[22.8px]">
          <p
            className="text-[#0f172a] text-[18px] leading-[28px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            PCMaster
          </p>
          <p
            className="text-[#64748b] text-[14px] leading-[22.75px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Architecting high-performance digital environments for creators,
            gamers, and visionaries.
          </p>
          <div className="flex gap-4">
            <img src={imgIcon} alt="Social" className="w-[18px] h-[20px]" />
            <img src={imgIcon1} alt="Social" className="size-[20px]" />
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([category, items]) => (
          <div key={category} className="flex flex-col gap-6">
            <p
              className="text-[#0f172a] text-[12px] tracking-[1.2px] uppercase font-normal"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {category}
            </p>
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#64748b] text-[12px] tracking-[1.2px] uppercase underline hover:text-[#0058be] transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Newsletter + copyright row */}
      <div className="max-w-[1536px] mx-auto px-12 pb-16">
        <div className="flex flex-col gap-4 max-w-[260px]">
          <p
            className="text-[#0f172a] text-[16px] leading-[24px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Newsletter
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 bg-white rounded-[8px] p-3 text-[#6b7280] text-[12px] focus:outline-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <button
              type="button"
              className="bg-[#0058be] text-white text-[12px] px-4 py-[11.5px] rounded-[8px] hover:bg-[#0047a3] transition-colors cursor-pointer"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Join
            </button>
          </div>
          <p
            className="text-[#94a3b8] text-[10px] leading-[16.25px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            © 2024 PCMaster Precision Architect. All rights reserved.
          </p>
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-t border-[#e2e8f0] px-12 py-8">
        <p
          className="text-[#64748b] text-[12px] tracking-[1.2px] uppercase text-center"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          © 2024 PCMASTER PRECISION ARCHITECT. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
