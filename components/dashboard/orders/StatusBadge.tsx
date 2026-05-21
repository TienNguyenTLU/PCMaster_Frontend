'use client';

import { CheckCircle2, ClipboardList, Package2, Truck, XCircle } from 'lucide-react';
import { OrderStatus } from '@/lib/api';

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  DRAFT:     { label: 'Chờ duyệt',   color: 'text-amber-700',  bg: 'bg-amber-50/70 border border-amber-200',  Icon: ClipboardList },
  CONFIRMED: { label: 'Đã duyệt',    color: 'text-blue-700',   bg: 'bg-blue-50/70 border border-blue-200',   Icon: CheckCircle2 },
  SHIPPED:   { label: 'Đang giao',   color: 'text-violet-700', bg: 'bg-violet-50/70 border border-violet-200', Icon: Truck },
  DELIVERED: { label: 'Đã giao',     color: 'text-emerald-700',bg: 'bg-emerald-50/70 border border-emerald-200',Icon: Package2 },
  CANCELLED: { label: 'Đã hủy',      color: 'text-red-600',    bg: 'bg-red-50/70 border border-red-200',    Icon: XCircle },
};

interface StatusBadgeProps {
  status: OrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  if (!meta) return <span className="text-[12px] text-slate-500">{status}</span>;
  const { label, color, bg, Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${bg} ${color}`}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}
