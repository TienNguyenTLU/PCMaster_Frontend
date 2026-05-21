'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthFormField from './AuthFormField';
import AuthSocialButtons from './AuthSocialButtons';
import { useAuthStore } from '@/lib/store';

import toast from 'react-hot-toast';

const imgArrow = 'http://localhost:3845/assets/fadd198d26aadd8b0ee816378d8a8139f72021b1.svg';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      clearError();
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(form.usernameOrEmail, form.password);
      toast.success('Đăng nhập thành công!');
      // Role-based redirect
      const { user } = useAuthStore.getState();
      router.push(user?.role === 'ADMIN' ? '/dashboard' : '/home');
    } catch {
      // error shown from store
    }
  };

  return (
    <div
      className="
        bg-white border border-[rgba(194,198,214,0.15)] rounded-[8px]
        shadow-[0px_40px_40px_rgba(0,0,0,0.04)]
        col-span-5 col-start-8
        flex flex-col gap-[31.5px] items-start
        p-[41px] self-center justify-self-end
        w-[518px]
      "
    >
      {/* Card header */}
      <div className="flex flex-col gap-2 w-full">
        <h1
          className="text-[#191c1e] text-[24px] tracking-[-0.6px] leading-[32px] font-normal"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Đăng Nhập
        </h1>
        <p
          className="text-[#424754] text-[14px] leading-[20px] font-normal"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Chào mừng bạn quay lại với hệ thống PCMaster.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full pt-[8.5px]">
        <AuthFormField
          label="TÊN ĐĂNG NHẬP HOẶC EMAIL"
          type="text"
          placeholder="builder@pcmaster.tech"
          value={form.usernameOrEmail}
          onChange={handleChange('usernameOrEmail')}
          required
          autoComplete="username"
          id="login-email"
        />

        <AuthFormField
          label="MẬT KHẨU"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange('password')}
          required
          autoComplete="current-password"
          id="login-password"
        />

        {/* Error message */}
        {error && (
          <p
            className="text-red-500 text-[13px] font-normal -mt-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          id="login-submit"
          className="
            relative w-full bg-[#0058be] text-white text-[16px] leading-[24px] font-normal
            flex items-center justify-center gap-2
            py-[16px] rounded-[4px]
            shadow-[0px_10px_15px_-3px_rgba(0,88,190,0.2),0px_4px_6px_-4px_rgba(0,88,190,0.2)]
            hover:bg-[#0047a3] transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed
            cursor-pointer
          "
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {isLoading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          {!isLoading && (
            <img src={imgArrow} alt="" className="size-[9.333px]" aria-hidden />
          )}
        </button>

        {/* Social login */}
        <AuthSocialButtons />

        {/* Register link */}
        <p className="text-[14px] text-center w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="text-[#424754]">Chưa có tài khoản? </span>
          <Link href="/auth/register" className="text-[#0058be] hover:underline" id="register-link">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
