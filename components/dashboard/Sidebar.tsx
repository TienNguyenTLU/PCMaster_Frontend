'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Tag,
  Factory, 
  ShoppingCart, 
  FileBox, 
  Settings 
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/dashboard/products', icon: Package },
  { label: 'Brands', href: '/dashboard/brands', icon: Tag },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: Factory },
  { label: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: FileBox },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0f172a] flex flex-col z-40 transition-transform">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[rgba(255,255,255,0.1)]">
        <Link
          href="/dashboard"
          className="text-white text-[24px] tracking-[-1px] font-semibold"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          PCMaster <span className="text-[#0b82d2] text-[14px] uppercase tracking-[1px] ml-1 font-normal">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-colors
                ${isActive 
                  ? 'bg-[#0058be] text-white' 
                  : 'text-[#94a3b8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'}
              `}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <item.icon className="size-5" />
              <span className="text-[14px] font-medium leading-none mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Settings */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[#94a3b8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Settings className="size-5" />
          <span className="text-[14px] font-medium leading-none mt-0.5">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
