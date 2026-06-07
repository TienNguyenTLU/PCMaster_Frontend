'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const imgGithub = 'http://localhost:3845/assets/aa1c5c90bc7713f083cca7c844f85827c4c83eaa.svg';

export default function AuthSocialButtons() {
  const router = useRouter();
  const { loginWithGoogle } = useAuthStore();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google Client ID is missing in environment variables!");
      return;
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        await loginWithGoogle(response.credential);
        toast.success('Đăng nhập bằng Google thành công!');
        
        const { user } = useAuthStore.getState();
        if (user?.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/home');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Đăng nhập bằng Google thất bại');
      }
    };

    const initGoogle = () => {
      const g = (window as any).google;
      if (!g || !g.accounts) return;

      g.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      const btnContainer = document.getElementById('google-signin-button');
      if (btnContainer) {
        g.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 210,
        });
      }
    };

    // Check if google scripts are loaded, otherwise poll
    const g = (window as any).google;
    if (g && g.accounts) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        const currentG = (window as any).google;
        if (currentG && currentG.accounts) {
          initGoogle();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle, router]);

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
      <div className="grid grid-cols-2 gap-4 items-center">
        {/* Render standard Google Sign In Button inside grid */}
        <div 
          id="google-signin-button" 
          className="w-[210px] h-[46px] overflow-hidden rounded-[4px] border border-[rgba(194,198,214,0.2)] flex items-center justify-center bg-white cursor-pointer"
        ></div>

        <button
          type="button"
          className="
            flex items-center justify-center gap-3
            bg-[#f2f4f6] border border-[rgba(194,198,214,0.2)] rounded-[4px]
            py-[11px] px-4 h-[46px]
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

