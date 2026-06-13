import type { Metadata } from "next";
import HomeNavBar from "@/components/home/HomeNavBar";
import HomeHero from "@/components/home/HomeHero";
import HomeCategoriesSection from "@/components/home/HomeCategoriesSection";
import HomeProductsSection from "@/components/home/HomeProductsSection";
import AuthFooter from "@/components/auth/AuthFooter";

export const metadata: Metadata = {
  title: "PCMaster – Thiết Kế Cấu Hình PC Cực Mạnh",
  description:
    "Công cụ lắp ráp PC chính xác tuyệt đối. Khám phá các bộ vi xử lý, card đồ họa, máy bộ và tự tạo cấu hình workstation tối tân.",
};

export default function HomePage() {
  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{ background: "linear-gradient(90deg, #f7f9fb 0%, #f7f9fb 100%)" }}
    >
      {/* Fixed glassmorphism nav */}
      <HomeNavBar />

      {/* Main content – push down by nav height */}
      <main className="flex flex-col items-center gap-20 pt-24 pb-12">
        {/* Hero */}
        <div className="w-full flex justify-center px-8">
          <HomeHero />
        </div>

        {/* Featured Categories */}
        <HomeCategoriesSection />

        {/* Newly Listed Products Section */}
        <HomeProductsSection
          title="Sản phẩm mới niêm yết"
          subtitle="Khám phá linh kiện công nghệ mới nhất vừa cập bến"
          type="new"
        />

        {/* Products On Sale Section */}
        <HomeProductsSection
          title="Đang giảm giá"
          subtitle="Ưu đãi giới hạn cho các linh kiện kiến tạo PC đỉnh cao"
          type="sale"
        />
      </main>

      {/* Footer – reuse auth footer (identical design) */}
      <AuthFooter />
    </div>
  );
}
