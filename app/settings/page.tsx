"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { profileAPI, UserProfile } from "@/lib/api";
import HomeNavBar from "@/components/home/HomeNavBar";
import AuthFooter from "@/components/auth/AuthFooter";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Save,
  Settings,
  Shield,
  Bell,
  Lock,
  Key,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  
  const [activeSubTab, setActiveSubTab] = useState<
    "profile" | "security" | "notifications"
  >("profile");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  
  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      toast.error("Vui lòng đăng nhập để truy cập cài đặt!");
      router.push("/auth/login");
      return;
    }

    
    profileAPI
      .getProfile()
      .then((data: UserProfile) => {
        setUsername(data.username || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        toast.error("Không thể tải thông tin tài khoản!");
        setLoading(false);
      });
  }, [isHydrated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Tên tài khoản không được để trống!");
      return;
    }

    setSaving(true);
    try {
      const updated = await profileAPI.updateProfile({
        username: username.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });

      
      useAuthStore.setState({
        user: {
          ...user!,
          username: updated.username,
        },
      });

      toast.success("Cập nhật tài khoản thành công!");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      const msg =
        err.response?.data?.message || "Có lỗi xảy ra khi lưu cài đặt!";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setChangingPassword(true);
    try {
      await profileAPI.changePassword({ oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Failed to change password:", err);
      const msg = err.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu!";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <HomeNavBar />
        <main className="flex-1 flex items-center justify-center bg-[#f8fafc] pt-[72px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-10 animate-spin text-[#0058be]" />
            <p className="text-sm font-semibold text-slate-500">
              Đang tải thông tin cài đặt...
            </p>
          </div>
        </main>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <HomeNavBar />

      <main className="flex-1 pt-[100px] pb-16 px-4 md:px-8 max-w-[1400px] w-full mx-auto">
        <div className="flex flex-col gap-6">
          {}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
              Cài đặt hệ thống
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Quản lý thông tin cá nhân và thiết lập tài khoản PCMaster của bạn.
            </p>
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
            {}
            <aside className="bg-white border border-[#e2e8f0] rounded-[20px] p-4 flex flex-col gap-1.5 shadow-sm">
              <button
                onClick={() => setActiveSubTab("profile")}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-[13.5px] font-bold transition-all text-left cursor-pointer ${
                  activeSubTab === "profile"
                    ? "bg-[#0058be]/10 text-[#0058be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Settings className="size-4.5" />
                Thông tin cá nhân
              </button>
              <button
                onClick={() => {
                  setActiveSubTab("security");
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-[13.5px] font-bold transition-all text-left cursor-pointer ${
                  activeSubTab === "security"
                    ? "bg-[#0058be]/10 text-[#0058be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Shield className="size-4.5" />
                Mật khẩu & Bảo mật
              </button>
              <button
                onClick={() => {
                  setActiveSubTab("notifications");
                  toast.success(
                    "Chức năng cấu hình thông báo sẽ sớm được hỗ trợ!",
                  );
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] text-[13.5px] font-bold transition-all text-left cursor-pointer ${
                  activeSubTab === "notifications"
                    ? "bg-[#0058be]/10 text-[#0058be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Bell className="size-4.5" />
                Thông báo ứng dụng
              </button>
            </aside>

            {}
            <div className="bg-white border border-[#e2e8f0] rounded-[24px] shadow-sm p-6 md:p-8 flex flex-col gap-6">
              <div className="border-b border-[#f1f5f9] pb-4">
                <h2 className="text-[18px] font-bold text-[#0f172a]">
                  Hồ sơ cá nhân
                </h2>
                <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">
                  Cập nhật tên tài khoản, thông tin liên hệ và địa chỉ thanh
                  toán hóa đơn.
                </p>
              </div>

              {activeSubTab === "profile" ? (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5 max-w-[640px]"
                >
                  {}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="size-4 text-[#0058be]" />
                      Tên tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên tài khoản"
                      className="px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#0058be] focus:bg-white focus:ring-4 focus:ring-[#0058be]/10 transition-all font-medium text-slate-800"
                    />
                  </div>

                  {}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="size-4 text-[#0058be]" />
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      title="Không thể chỉnh sửa Email tài khoản"
                      className="px-4 py-3 bg-[#f1f5f9] border border-slate-200 rounded-[12px] text-[13.5px] font-medium text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>

                  {}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="size-4 text-[#0058be]" />
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0987654321"
                      className="px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#0058be] focus:bg-white focus:ring-4 focus:ring-[#0058be]/10 transition-all font-medium text-slate-800"
                    />
                  </div>

                  {}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="size-4 text-[#0058be]" />
                      Địa chỉ thanh toán
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Nhập địa chỉ nhận hàng và thanh toán chi tiết"
                      rows={3}
                      className="px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#0058be] focus:bg-white focus:ring-4 focus:ring-[#0058be]/10 transition-all font-medium text-slate-800 resize-none leading-relaxed"
                    />
                  </div>

                  {}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#0058be] to-[#2563eb] hover:from-[#0047a3] hover:to-[#1d4ed8] text-white text-[13.5px] font-bold rounded-[12px] shadow-lg shadow-blue-100/50 hover:shadow-xl transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="size-4" />
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : activeSubTab === "security" ? (
                <div className="flex flex-col gap-6">
                  <form
                    onSubmit={handlePasswordChange}
                    className="flex flex-col gap-5 max-w-[640px]"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="size-4 text-[#0058be]" />
                        Mật khẩu cũ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#0058be] focus:bg-white focus:ring-4 focus:ring-[#0058be]/10 transition-all font-medium text-slate-800"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="size-4 text-[#0058be]" />
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#0058be] focus:bg-white focus:ring-4 focus:ring-[#0058be]/10 transition-all font-medium text-slate-800"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Shield className="size-4 text-[#0058be]" />
                        Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-[12px] text-[13.5px] focus:outline-none focus:border-[#0058be] focus:bg-white focus:ring-4 focus:ring-[#0058be]/10 transition-all font-medium text-slate-800"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#0058be] to-[#2563eb] hover:from-[#0047a3] hover:to-[#1d4ed8] text-white text-[13.5px] font-bold rounded-[12px] shadow-lg shadow-blue-100/50 hover:shadow-xl transition-all cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                      >
                        {changingPassword ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <Save className="size-4" />
                            Đổi mật khẩu
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Shield className="size-12 animate-pulse text-[#0058be]/20" />
                  <p className="text-sm font-semibold">
                    Chức năng đang được phát triển
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
