import HomeCategoryCard from './HomeCategoryCard';

const imgArrowSmall = 'http://localhost:3845/assets/61dd0d1d6928fb3ddfc20fcb1cfc8aee254066a1.svg';
const imgArrowRight1 = 'http://localhost:3845/assets/64909fdf44e256a6ecbba492e70c895e556b4349.svg';
const imgArrowRight2 = 'http://localhost:3845/assets/a5518d4da6d70e9c7b446b4f2801ce5c2e79c7eb.svg';
const imgArrowRight3 = 'http://localhost:3845/assets/fb9c7feac6c1954cd16582262a580ea6513629c9.svg';

const imgProcessor = 'http://localhost:3845/assets/b2d483d522c41af6de4c494486de4dd01c8229b0.png';
const imgGraphics = 'http://localhost:3845/assets/537786f202a71dab5ec38329a625820a762f86c5.png';
const imgPrebuilt = 'http://localhost:3845/assets/5d265a4886fceda1b54443d3fa6cfc6b8016cf22.png';

const categories = [
  {
    image: imgProcessor,
    title: 'Processors',
    description: 'Next-gen CPU architectures',
    icon: imgArrowRight1,
  },
  {
    image: imgGraphics,
    title: 'Graphics Cards',
    description: 'Ultimate rendering power',
    icon: imgArrowRight2,
  },
  {
    image: imgPrebuilt,
    title: 'Pre-built Systems',
    description: 'Ready-to-deploy power',
    icon: imgArrowRight3,
  },
];

export default function HomeCategoriesSection() {
  return (
    <section className="flex flex-col gap-12 max-w-[1536px] w-full px-8">
      {/* Section header */}
      <div className="flex items-end justify-between w-full">
        <div className="flex flex-col gap-2">
          <p
            className="text-[#0058be] text-[14px] tracking-[1.4px] uppercase font-normal leading-[20px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            INVENTORY
          </p>
          <h2
            className="text-[#191c1e] text-[36px] tracking-[-1.8px] leading-[40px] font-normal"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Precision Categories
          </h2>
        </div>

        {/* Divider */}
        <div className="flex-1 mx-12">
          <div className="bg-[rgba(194,198,214,0.2)] h-px w-full" />
        </div>

        {/* View all */}
        <a
          href="/explore"
          className="flex items-center gap-2 text-[#424754] text-[14px] leading-[20px] hover:text-[#0058be] transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          View All Categories
          <img src={imgArrowSmall} alt="" className="size-[9.333px]" />
        </a>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-8">
        {categories.map((cat) => (
          <HomeCategoryCard key={cat.title} {...cat} />
        ))}
      </div>
    </section>
  );
}
