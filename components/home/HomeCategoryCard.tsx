interface CategoryCardProps {
  image: string;
  title: string;
  description: string;
  icon: string;
}

export default function HomeCategoryCard({ image, title, description, icon }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-[8px] shadow-[0px_20px_20px_rgba(0,26,66,0.06)] p-8 flex flex-col gap-8">
      {/* Image area */}
      <div className="bg-[#f2f4f6] rounded-[8px] overflow-hidden">
        <div className="h-[320px] relative">
          <div className="absolute inset-0 overflow-hidden">
            <img src={image} alt={title} className="absolute h-full max-w-none object-cover" style={{ left: 0, width: '100%', top: 0 }} />
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h3
            className="text-[#191c1e] text-[24px] tracking-[-0.6px] leading-[32px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {title}
          </h3>
          <p
            className="text-[#424754] text-[14px] leading-[20px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {description}
          </p>
        </div>

        {/* Arrow icon button */}
        <div className="border border-[rgba(194,198,214,0.2)] rounded-full size-[40px] flex items-center justify-center shrink-0 cursor-pointer hover:border-[#0058be] transition-colors">
          <img src={icon} alt="" className="size-[18px]" />
        </div>
      </div>
    </div>
  );
}
