const imgGoogle = 'http://localhost:3845/assets/3117939800a92133fdd3e90f3da8fe022a6ce253.svg';
const imgGithub = 'http://localhost:3845/assets/aa1c5c90bc7713f083cca7c844f85827c4c83eaa.svg';

export default function AuthSocialButtons() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Divider */}
      <div className="relative flex items-center justify-center py-4">
        <div className="absolute inset-x-0 top-1/2 border-t border-[rgba(194,198,214,0.3)]" />
        <span
          className="relative bg-white px-4 text-[#424754] text-[12px] tracking-[1.2px] uppercase font-semibold"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          HOẶC ĐĂNG NHẬP QUA
        </span>
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="
            flex items-center justify-center gap-3
            bg-[#f2f4f6] border border-[rgba(194,198,214,0.2)] rounded-[4px]
            py-[13px] px-4
            text-[#191c1e] text-[14px] font-normal
            hover:bg-[#e8ecf0] transition-colors
            cursor-pointer
          "
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <img src={imgGoogle} alt="Google" className="size-5" />
          Google
        </button>

        <button
          type="button"
          className="
            flex items-center justify-center gap-3
            bg-[#f2f4f6] border border-[rgba(194,198,214,0.2)] rounded-[4px]
            py-[13px] px-4
            text-[#191c1e] text-[14px] font-normal
            hover:bg-[#e8ecf0] transition-colors
            cursor-pointer
          "
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <img src={imgGithub} alt="GitHub" className="size-5" />
          GitHub
        </button>
      </div>
    </div>
  );
}
