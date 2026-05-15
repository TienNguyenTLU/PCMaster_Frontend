'use client';

import { useState, useEffect } from 'react';
import { adminAPI, DashboardStatsResponse } from '@/lib/api';
import { Loader2, TrendingUp, TrendingDown, Package, Clock, DollarSign, ShoppingBag } from 'lucide-react';

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="size-8 animate-spin text-[#0058be]" />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Revenue', 
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalRevenue || 0), 
      change: '+12.5%', 
      positive: true,
      icon: <DollarSign className="size-4 text-[#0058be]" />
    },
    { 
      title: 'Active Orders', 
      value: stats?.activeOrders || 0, 
      change: '+5.2%', 
      positive: true,
      icon: <ShoppingBag className="size-4 text-purple-600" />
    },
    { 
      title: 'Low Stock Items', 
      value: stats?.lowStockItems || 0, 
      change: stats?.lowStockItems ? 'Needs restock' : 'Healthy', 
      positive: !stats?.lowStockItems,
      icon: <Package className="size-4 text-amber-600" />
    },
    { 
      title: 'Pending POs', 
      value: stats?.pendingPurchaseOrders || 0, 
      change: 'Draft POs', 
      positive: true,
      icon: <Clock className="size-4 text-blue-600" />
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-[#64748b] text-[13px] font-bold uppercase tracking-[0.5px]">
                {stat.title}
              </h3>
              <div className="p-2 bg-[#f8fafc] rounded-[8px]">
                {stat.icon}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-[#0f172a] text-[24px] font-black tracking-[-0.5px]">
                {stat.value}
              </span>
              <div className={`flex items-center gap-1 text-[12px] font-bold ${stat.positive ? 'text-green-600' : 'text-amber-600'}`}>
                {stat.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart placeholder */}
        <div className="col-span-2 bg-white border border-[#e2e8f0] rounded-[12px] p-6 h-[400px] flex flex-col shadow-sm">
          <h3 className="text-[#0f172a] text-[16px] font-bold mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#0058be] rounded-full" />
            Revenue Overview
          </h3>
          <div className="flex-1 bg-[#f8fafc] rounded-[12px] flex items-center justify-center border border-dashed border-[#cbd5e1] relative overflow-hidden">
             {/* Mock chart grid */}
             <div className="absolute inset-0 grid grid-cols-6 p-6 gap-4">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <div key={i} className="flex flex-col justify-end">
                    <div 
                      className="bg-[#0058be] rounded-t-[4px] transition-all hover:bg-[#0047a3]" 
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
             </div>
             <span className="text-[#94a3b8] text-[14px] font-medium z-10 bg-white/80 px-4 py-2 rounded-full shadow-sm">Monthly Revenue Trend</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 bg-white border border-[#e2e8f0] rounded-[12px] p-6 flex flex-col shadow-sm">
          <h3 className="text-[#0f172a] text-[16px] font-bold mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#f59e0b] rounded-full" />
            Recent Activity
          </h3>
          <div className="flex flex-col gap-6">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`p-2 rounded-[8px] ${
                    activity.type === 'ORDER' ? 'bg-blue-50 text-blue-600' : 
                    activity.type === 'PURCHASE_ORDER' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {activity.type === 'ORDER' ? <ShoppingBag className="size-4" /> : <Clock className="size-4" />}
                  </div>
                  <div>
                    <p className="text-[#0f172a] text-[14px] font-bold leading-tight">{activity.title}</p>
                    <p className="text-[#64748b] text-[12px] mt-1">{activity.timeAgo}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#94a3b8]">
                <Clock className="size-8 opacity-20 mb-2" />
                <p className="text-[13px]">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
