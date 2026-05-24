import { MapPin, Phone, Mail, ChevronRight, Cpu } from 'lucide-react';
import Link from 'next/link';

// Robust, type-safe custom inline SVG components for brands
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
  </svg>
);

export default function AuthFooter() {
  return (
    <footer className="bg-[#f8fafc] text-[#475569] border-t border-[#e2e8f0] w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Upper Main Footer Grid */}
      <div className="max-w-[1400px] mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand & Address Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-[#0058be] to-[#2563eb] rounded-[10px] text-white">
              <Cpu className="size-6" />
            </div>
            <span className="text-[#0f172a] text-[22px] font-black tracking-tight uppercase">
              PC<span className="text-[#0058be]">Master</span>
            </span>
          </div>
          
          <p className="text-[13.5px] leading-relaxed text-[#64748b]">
            Kiến tạo các cấu hình PC hiệu năng đỉnh cao, được tinh chỉnh chuyên biệt dành cho Nhà sáng tạo nội dung, Game thủ chuyên nghiệp và Doanh nghiệp.
          </p>

          <div className="flex flex-col gap-3.5 mt-2">
            <div className="flex items-start gap-3 text-[13px]">
              <MapPin className="size-4.5 text-[#0058be] shrink-0 mt-0.5" />
              <span className="text-[#475569]">12 Chùa Bộc, Quang Trung, Đống Đa, Hà Nội</span>
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              <Phone className="size-4.5 text-[#0058be] shrink-0" />
              <span className="text-[#475569] font-semibold">Hotline: 1900 8888 (8:00 - 21:00)</span>
            </div>
            <div className="flex items-center gap-3 text-[13px]">
              <Mail className="size-4.5 text-[#0058be] shrink-0" />
              <span className="text-[#475569]">support@pcmaster.tech</span>
            </div>
          </div>
        </div>

        {/* Column 2: Products */}
        <div className="flex flex-col gap-6">
          <h4 className="text-[#0f172a] text-[12px] font-black uppercase tracking-[1.5px] border-l-2 border-[#0058be] pl-3">
            Linh Kiện Cao Cấp
          </h4>
          <ul className="flex flex-col gap-3">
            {[
              { label: 'Xây dựng cấu hình PC', href: '/build' },
              { label: 'Bộ vi xử lý (CPU)', href: '/explore?category=cpu' },
              { label: 'Card đồ họa (VGA)', href: '/explore?category=vga' },
              { label: 'Bo mạch chủ (Mainboard)', href: '/explore?category=mainboard' },
              { label: 'Bộ nhớ RAM', href: '/explore?category=ram' },
              { label: 'Ổ cứng SSD / Storage', href: '/explore?category=ssd' }
            ].map((link, idx) => (
              <li key={idx}>
                <Link
                  href={link.href}
                  className="group flex items-center gap-1.5 text-[13px] text-[#475569] hover:text-[#0058be] transition-all hover:translate-x-1.5"
                >
                  <ChevronRight className="size-3.5 text-[#cbd5e1] group-hover:text-[#0058be] transition-colors" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Customer Service */}
        <div className="flex flex-col gap-6">
          <h4 className="text-[#0f172a] text-[12px] font-black uppercase tracking-[1.5px] border-l-2 border-[#0058be] pl-3">
            Dịch vụ & Hỗ trợ
          </h4>
          <ul className="flex flex-col gap-3">
            {[
              'Dịch vụ khách hàng',
              'Chính sách bảo hành vàng',
              'Phương thức thanh toán',
              'Chính sách vận chuyển',
              'Bảo mật thông tin khách hàng',
              'Điều khoản sử dụng dịch vụ'
            ].map((label, idx) => (
              <li key={idx}>
                <a
                  href="#"
                  className="group flex items-center gap-1.5 text-[13px] text-[#475569] hover:text-[#0058be] transition-all hover:translate-x-1.5"
                >
                  <ChevronRight className="size-3.5 text-[#cbd5e1] group-hover:text-[#0058be] transition-colors" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Newsletter & Trust badges */}
        <div className="flex flex-col gap-6">
          <h4 className="text-[#0f172a] text-[12px] font-black uppercase tracking-[1.5px] border-l-2 border-[#0058be] pl-3">
            Đăng Ký Nhận Tin
          </h4>
          
          <p className="text-[13px] text-[#64748b] leading-relaxed">
            Đăng ký để cập nhật các cấu hình mới nhất, ưu đãi độc quyền và xu hướng công nghệ hàng tuần.
          </p>

          <div className="flex gap-2 bg-white border border-[#cbd5e1] rounded-[8px] p-1.5 focus-within:border-[#0058be] focus-within:ring-1 focus-within:ring-[#0058be] transition-all">
            <input
              type="email"
              placeholder="Địa chỉ email của bạn"
              className="flex-1 bg-transparent text-[#0f172a] placeholder-[#cbd5e1] text-[13px] px-3 py-1.5 focus:outline-none"
            />
            <button
              type="button"
              className="bg-[#0058be] hover:bg-[#0047a3] text-white text-[12.5px] font-bold px-4 py-1.5 rounded-[6px] transition-colors cursor-pointer shrink-0"
            >
              Đăng ký
            </button>
          </div>

          {/* Trust Payment Badge icons */}
          <div className="flex flex-col gap-3 mt-2">
            <span className="text-[11.5px] font-bold uppercase tracking-[1px] text-[#475569]">Phương thức thanh toán</span>
            <div className="flex flex-wrap gap-2 text-[10px] font-black text-[#475569]">
              {['VISA', 'MASTERCARD', 'JCB', 'QR-PAY', 'APPLE PAY'].map((pay, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-white border border-[#cbd5e1] text-[#475569] rounded-[4px] font-mono tracking-wider text-[10.5px] hover:border-[#0058be] hover:text-[#0058be] transition-colors cursor-default"
                >
                  {pay}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid Divider Line */}
      <div className="max-w-[1400px] mx-auto border-t border-[#e2e8f0] px-8"></div>

      {/* Bottom Footer Row */}
      <div className="max-w-[1400px] mx-auto px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Copyright */}
        <p className="text-[12px] text-[#64748b] text-center md:text-left">
          © {new Date().getFullYear()} <span className="text-[#334155] font-semibold">PCMaster Precision Architect</span>. Bảo lưu mọi quyền.
        </p>

        {/* Social Icons row */}
        <div className="flex items-center gap-3">
          {[
            { Icon: FacebookIcon, href: '#', label: 'Facebook' },
            { Icon: YoutubeIcon, href: '#', label: 'Youtube' },
            { Icon: GithubIcon, href: 'https://github.com', label: 'Github' },
            { Icon: DiscordIcon, href: '#', label: 'Discord' }
          ].map((soc, idx) => (
            <a
              key={idx}
              href={soc.href}
              aria-label={soc.label}
              className="p-2.5 bg-white hover:bg-[#0058be] hover:text-white border border-[#cbd5e1] hover:border-[#0058be] rounded-full text-[#64748b] transition-all hover:-translate-y-1 shadow-sm shrink-0 cursor-pointer"
            >
              <soc.Icon className="size-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
