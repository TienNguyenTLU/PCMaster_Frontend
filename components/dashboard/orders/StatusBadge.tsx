"use client";

import { OrderStatus } from "@/lib/api";
import { STATUS_META } from "@/lib/labelMapping";

interface StatusBadgeProps {
  status: OrderStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  if (!meta)
    return <span className="text-[12px] text-slate-500">{status}</span>;
  const { label, color, bg, Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${bg} ${color}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}
