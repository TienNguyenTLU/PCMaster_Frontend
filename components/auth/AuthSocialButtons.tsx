'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

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
        if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
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
          width: 280,
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
      <div className="flex justify-center w-full">
        {/* Custom gorgeous Google Button wrapper */}
        <div className="relative w-full max-w-[280px] h-[48px] overflow-hidden rounded-[8px] border border-[#cbd5e1] hover:border-[#94a3b8] hover:bg-[#f8fafc] flex items-center justify-center bg-white cursor-pointer shadow-sm transition-all duration-200">
          <div className="flex items-center gap-3 select-none pointer-events-none">
            <svg className="size-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.336 0 3.33 2.69 1.455 6.618l3.81 3.147z"
              />
              <path
                fill="#34A853"
                d="M16.04 15.345c-1.073.746-2.427 1.191-4.04 1.191a7.075 7.075 0 0 1-6.734-4.855L1.455 14.83C3.33 18.755 7.336 21.45 12 21.45c2.945 0 5.673-1.018 7.545-2.827l-3.504-3.278z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.273c0-.818-.082-1.609-.236-2.373H12v4.582h6.482A5.627 5.627 0 0 1 16.04 15.345l3.505 3.278C21.6 16.79 23.49 14.773 23.49 12.273z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 12.145A7.054 7.054 0 0 1 5 12c0-.527.09-1.036.266-1.527L1.455 7.327A11.969 11.969 0 0 0 0 12c0 1.69.355 3.3 1.455 4.673l3.811-2.528z"
              />
            </svg>
            <span className="text-[14px] font-semibold text-[#334155]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Tiếp tục với Google
            </span>
          </div>

          {/* Invisible Google official button overlay */}
          <div 
            id="google-signin-button" 
            className="absolute inset-0 opacity-0 cursor-pointer [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:cursor-pointer [&_div]:w-full [&_div]:h-full"
          ></div>
        </div>
      </div>
    </div>
  );
}

