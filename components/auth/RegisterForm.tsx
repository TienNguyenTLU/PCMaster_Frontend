"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthFormField from "./AuthFormField";
import AuthSocialButtons from "./AuthSocialButtons";
import { useAuthStore } from "@/lib/store";

const imgArrow =
  "http://localhost:3845/assets/fadd198d26aadd8b0ee816378d8a8139f72021b1.svg";

export default function RegisterForm() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      clearError();
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.username.trim()) {
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    } else if (form.username.trim().length < 3) {
      newErrors.username = "Tên đăng nhập phải chứa ít nhất 3 ký tự";
    }

    if (!form.email.trim()) {
      newErrors.email = "Vui lòng nhập địa chỉ email";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = "Địa chỉ email không đúng định dạng";
      }
    }

    if (!form.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (form.password.length < 6) {
      newErrors.password = "Mật khẩu phải chứa ít nhất 6 ký tự";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signup(form.username, form.email, form.password);
      
      const { user } = useAuthStore.getState();
      router.push(
        user?.role === "ADMIN" || user?.role === "STAFF"
          ? "/dashboard"
          : "/home",
      );
    } catch {
      
    }
  };

  return (
    <div
      className="
        bg-white border border-[rgba(194,198,214,0.15)] rounded-[8px]
        shadow-[0px_40px_40px_rgba(0,0,0,0.04)]
        col-span-1 lg:col-span-5 lg:col-start-8
        flex flex-col gap-[31.5px] items-start
        p-6 sm:p-[41px] self-center justify-self-center lg:justify-self-end
        w-full max-w-[518px]
      "
    >
      {}
      <div className="flex flex-col gap-2 w-full">
        <h1
          className="text-[#191c1e] text-[24px] tracking-[-0.6px] leading-[32px] font-normal"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Đăng Ký Tài Khoản
        </h1>
        <p
          className="text-[#424754] text-[14px] leading-[20px] font-normal"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Nâng tầm trải nghiệm lắp ráp PC của bạn ngay hôm nay.
        </p>
      </div>

      {}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-6 w-full pt-[8.5px]"
      >
        <AuthFormField
          label="TÊN ĐĂNG NHẬP"
          type="text"
          placeholder="nikola_tesla"
          value={form.username}
          onChange={handleChange("username")}
          error={errors.username}
          autoComplete="username"
          id="register-username"
        />

        <AuthFormField
          label="ĐỊA CHỈ EMAIL"
          type="email"
          placeholder="builder@pcmaster.tech"
          value={form.email}
          onChange={handleChange("email")}
          error={errors.email}
          autoComplete="email"
          id="register-email"
        />

        <AuthFormField
          label="MẬT KHẨU"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange("password")}
          error={errors.password}
          autoComplete="new-password"
          id="register-password"
        />

        <AuthFormField
          label="XÁC NHẬN MẬT KHẨU"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
          id="register-confirm-password"
        />

        {}
        {error && (
          <p
            className="text-red-500 text-[13px] font-normal -mt-2"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {error}
          </p>
        )}

        {}
        <button
          type="submit"
          disabled={isLoading}
          id="register-submit"
          className="
            relative w-full bg-[#0058be] text-white text-[16px] leading-[24px] font-normal
            flex items-center justify-center gap-2
            py-[16px] rounded-[4px]
            shadow-[0px_10px_15px_-3px_rgba(0,88,190,0.2),0px_4px_6px_-4px_rgba(0,88,190,0.2)]
            hover:bg-[#0047a3] transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed
            cursor-pointer
          "
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {isLoading ? "Đang đăng ký…" : "Đăng ký"}
          {!isLoading && (
            <img src={imgArrow} alt="" className="size-[9.333px]" aria-hidden />
          )}
        </button>

        {}
        <AuthSocialButtons />

        {}
        <p
          className="text-[14px] text-center w-full"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <span className="text-[#424754]">Đã có tài khoản? </span>
          <Link
            href="/auth/login"
            className="text-[#0058be] hover:underline"
            id="signin-link"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </div>
  );
}
