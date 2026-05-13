const imgTechBg = 'http://localhost:3845/assets/eb37f05013712d32e35cce134a2eb5dc8140f454.png';
const imgWarrantyIcon = 'http://localhost:3845/assets/a63f8a66b212103d8b90971ec9762dbcbe0ed40f.svg';

const specs = [
  { label: 'CLOCK SPEED', value: '5.2 GHz' },
  { label: 'MEMORY', value: '128 GB' },
  { label: 'STORAGE', value: '4 TB' },
  { label: 'CORES', value: '24-Core' },
];

export default function HomeSpecsBento() {
  return (
    <section className="grid grid-cols-12 gap-8 max-w-[1216px] w-full mx-auto">
      {/* Left dark panel – col 1-8 */}
      <div className="col-span-8 bg-[#0f172a] rounded-[16px] overflow-hidden relative min-h-[400px] flex flex-col justify-between px-12 pt-12 pb-[74px]">
        {/* Tech background texture */}
        <div className="absolute inset-y-0 left-1/2 right-0 opacity-30 mix-blend-lighten overflow-hidden pointer-events-none">
          <img src={imgTechBg} alt="" className="absolute inset-0 size-full object-cover" />
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          {/* Heading */}
          <div>
            <p
              className="text-white text-[36px] tracking-[-1.8px] leading-[45px] font-normal"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Master the
            </p>
            <p
              className="text-white text-[36px] tracking-[-1.8px] leading-[45px] font-normal"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Workstation Flow
            </p>
          </div>

          {/* Description */}
          <p
            className="text-[#94a3b8] text-[16px] leading-[24px] font-normal max-w-[448px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Deploy your creative suite on hardware that doesn&apos;t just keep up—it anticipates your next move.
          </p>

          {/* Spec cards */}
          <div className="grid grid-cols-4 gap-4 pt-2">
            {specs.map(({ label, value }) => (
              <div
                key={label}
                className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.05)] rounded-[8px] p-4 flex flex-col gap-1"
              >
                <p
                  className="text-[#0058be] text-[12px] tracking-[1.2px] uppercase leading-[16px] font-normal"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {label}
                </p>
                <p
                  className="text-white text-[24px] leading-[32px] font-normal"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right blue panel – col 9-12 */}
      <div className="col-span-4 bg-[#0058be] rounded-[16px] flex flex-col items-center justify-center px-12 py-[49px] gap-0">
        {/* Icon */}
        <div className="mb-6">
          <img src={imgWarrantyIcon} alt="" className="w-[55px] h-[52.5px]" />
        </div>

        {/* Title */}
        <p
          className="text-white text-[30px] tracking-[-0.75px] leading-[36px] text-center font-normal mb-4"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Precision Warranty
        </p>

        {/* Body */}
        <p
          className="text-[rgba(255,255,255,0.8)] text-[16px] leading-[26px] text-center font-normal mb-8"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Every PCMaster architected system comes with 3 years of on-site support and lifetime tech advice.
        </p>

        {/* Button */}
        <button
          type="button"
          className="w-full bg-white text-[#0058be] text-[16px] leading-[24px] text-center font-normal py-4 rounded-[8px] hover:bg-[#f0f6ff] transition-colors cursor-pointer"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Learn More
        </button>
      </div>
    </section>
  );
}
