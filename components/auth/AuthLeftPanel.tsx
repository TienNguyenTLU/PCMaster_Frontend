export default function AuthLeftPanel() {
  return (
    <div className="col-span-1 lg:col-span-7 hidden lg:flex flex-col gap-6 items-start self-center">
      {}
      <p
        className="text-[#0058be] text-[14px] tracking-[2.8px] uppercase font-semibold"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        TRUY CẬP HỆ THỐNG
      </p>

      {}
      <div
        className="flex flex-col leading-none"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <span className="text-[#191c1e] text-[96px] tracking-[-4.8px] leading-[96px] font-normal">
          Gia nhập
        </span>
        <span className="text-[#191c1e] text-[96px] tracking-[-4.8px] leading-[96px] font-black uppercase">
          PC<span className="text-[#0058be]">Master</span>
        </span>
      </div>

      {}
      <div className="max-w-[448px] pt-4">
        <p
          className="text-[#424754] text-[20px] leading-[32.5px] font-normal"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Công cụ tối ưu dành cho trải nghiệm lắp ráp PC hoàn hảo. Tiếp cận kho
          thông số kỹ thuật chi tiết cùng các hướng dẫn chuyên nghiệp.
        </p>
      </div>
    </div>
  );
}
