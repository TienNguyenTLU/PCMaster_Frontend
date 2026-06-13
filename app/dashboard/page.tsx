'use client';

import { useState, useEffect } from 'react';
import { adminAPI, DashboardStatsResponse, PeriodRevenueResponse } from '@/lib/api';
import { 
  Loader2, 
  TrendingUp, 
  Package, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  Coins,
  Factory,
  BarChart3,
  PieChart,
  CalendarDays,
  Percent
} from 'lucide-react';

const COLORS = [
  '#0058be', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#64748b', // Slate
];

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab control for Period Chart
  const [periodTab, setPeriodTab] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="size-8 animate-spin text-[#0058be]" />
      </div>
    );
  }

  // Formatting helpers
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // 1. STAT CARDS (Top row)
  const statCards = [
    { 
      title: 'Doanh thu (30 ngày)', 
      value: formatVND(stats?.revenue30Days || 0), 
      subtitle: `Vốn gốc: ${formatVND(stats?.cost30Days || 0)}`,
      positive: true,
      icon: <DollarSign className="size-4 text-[#0058be]" />
    },
    { 
      title: 'Lợi nhuận (30 ngày)', 
      value: formatVND((stats?.revenue30Days || 0) - (stats?.cost30Days || 0)), 
      subtitle: stats?.revenue30Days 
        ? `Tỷ suất: ${(((stats.revenue30Days - stats.cost30Days) / stats.revenue30Days) * 100).toFixed(1)}%` 
        : 'Tỷ suất: 0%',
      positive: true,
      icon: <Coins className="size-4 text-emerald-600" />
    },
    { 
      title: 'Đơn hàng (30 ngày)', 
      value: `${stats?.ordersCount30Days || 0} đơn`, 
      subtitle: 'Đã hoàn thành/xác nhận',
      positive: true,
      icon: <ShoppingBag className="size-4 text-purple-600" />
    },
    { 
      title: 'Đơn đang xử lý', 
      value: `${stats?.processingOrdersCount || 0} đơn`, 
      subtitle: 'Nháp / Chờ xác nhận / Giao',
      positive: true,
      icon: <Clock className="size-4 text-blue-600" />
    },
    { 
      title: 'Sản phẩm sắp hết hàng', 
      value: `${stats?.lowStockItems || 0} sản phẩm`, 
      subtitle: 'Tồn kho dưới 10 cái',
      positive: !(stats?.lowStockItems),
      icon: <Package className="size-4 text-amber-600" />
    },
  ];

  // 2. PERIOD CHART DATA
  let chartData: PeriodRevenueResponse[] = [];
  if (periodTab === 'MONTH') {
    chartData = stats?.monthlyRevenue || [];
  } else if (periodTab === 'QUARTER') {
    chartData = stats?.quarterlyRevenue || [];
  } else {
    chartData = stats?.yearlyRevenue || [];
  }

  // Find max value in chart data to scale the height of bars
  const maxVal = chartData.reduce((max, item) => {
    const val = Math.max(item.revenue, item.cost);
    return val > max ? val : max;
  }, 1);

  // 3. CATEGORY DONUT CHART DATA
  const categoryData = stats?.revenueByCategory || [];
  const totalCatRevenue = categoryData.reduce((sum, item) => sum + item.revenue, 0) || 1;
  
  // Accumulated offset helper for drawing SVG slices
  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white border border-[#e2e8f0] rounded-[12px] p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-[#64748b] text-[12px] font-bold uppercase tracking-[0.5px] truncate">
                {stat.title}
              </h3>
              <div className="p-2 bg-[#f8fafc] rounded-[8px]">
                {stat.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[#0f172a] text-[20px] font-black tracking-[-0.5px] truncate">
                {stat.value}
              </span>
              <span className="text-[#94a3b8] text-[12px] mt-0.5 font-medium truncate">
                {stat.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Charts & Stats Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Doanh thu theo chu kỳ (Bar Chart) */}
        <div className="xl:col-span-2 bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-sm flex flex-col min-h-[440px]">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h3 className="text-[#0f172a] text-[16px] font-bold flex items-center gap-2">
              <BarChart3 className="size-5 text-[#0058be]" />
              Doanh thu & Chi phí theo chu kỳ
            </h3>
            
            {/* Period switcher */}
            <div className="flex bg-[#f1f5f9] p-1 rounded-[8px] border border-[#e2e8f0]">
              <button
                onClick={() => setPeriodTab('MONTH')}
                className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  periodTab === 'MONTH' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                Tháng
              </button>
              <button
                onClick={() => setPeriodTab('QUARTER')}
                className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  periodTab === 'QUARTER' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                Quá trình (Quý)
              </button>
              <button
                onClick={() => setPeriodTab('YEAR')}
                className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  periodTab === 'YEAR' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                Năm
              </button>
            </div>
          </div>

          {/* Bar Chart drawing using SVG/HTML */}
          <div className="flex-1 flex flex-col justify-end min-h-[300px]">
            {chartData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#94a3b8]">
                <CalendarDays className="size-8 opacity-35 mb-2" />
                <span className="text-[13px]">Chưa có dữ liệu thống kê cho chu kỳ này</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                {/* Visual Chart Bars */}
                <div className="flex-1 flex items-end justify-between px-2 gap-4 h-[240px] pt-4">
                  {chartData.map((item, i) => {
                    const revHeight = `${Math.max(5, (item.revenue / maxVal) * 90)}%`;
                    const costHeight = `${Math.max(5, (item.cost / maxVal) * 90)}%`;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group max-w-[80px]">
                        {/* Two side-by-side bars */}
                        <div className="w-full flex items-end justify-center gap-1 h-[200px] relative">
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 bg-[#0f172a] text-white text-[11px] p-2 rounded-[6px] shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 w-[160px] flex flex-col gap-0.5">
                            <span className="font-bold border-b border-white/20 pb-1 mb-1">{item.label}</span>
                            <span className="text-blue-300">Doanh thu: {formatVND(item.revenue)}</span>
                            <span className="text-amber-400">Vốn gốc: {formatVND(item.cost)}</span>
                            <span className="text-emerald-300 font-bold">Lợi nhuận: {formatVND(item.revenue - item.cost)}</span>
                          </div>

                          {/* Revenue bar (Blue) */}
                          <div 
                            className="w-[12px] bg-[#0058be] rounded-t-[4px] transition-all duration-300 group-hover:bg-[#0047a3] cursor-pointer"
                            style={{ height: revHeight }}
                          />
                          {/* Cost bar (Orange/Amber) */}
                          <div 
                            className="w-[12px] bg-[#f59e0b] rounded-t-[4px] transition-all duration-300 group-hover:bg-[#d97706] cursor-pointer"
                            style={{ height: costHeight }}
                          />
                        </div>
                        
                        {/* Label */}
                        <span className="text-[11px] font-semibold text-[#64748b] text-center truncate w-full" title={item.label}>
                          {item.label.replace('Tháng ', '').replace('Quý ', 'Q').replace('Năm ', '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Chart Legends */}
                <div className="border-t border-[#e2e8f0] pt-4 mt-4 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="size-3 bg-[#0058be] rounded-[3px]" />
                    <span className="text-[12px] font-semibold text-[#475569]">Doanh thu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 bg-[#f59e0b] rounded-[3px]" />
                    <span className="text-[12px] font-semibold text-[#475569]">Vốn gốc (Giá mua)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Biểu đồ tròn: Doanh thu theo loại linh kiện */}
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-sm flex flex-col min-h-[440px]">
          <h3 className="text-[#0f172a] text-[16px] font-bold mb-6 flex items-center gap-2">
            <PieChart className="size-5 text-[#10b981]" />
            Doanh thu theo loại linh kiện
          </h3>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#94a3b8]">
              <PieChart className="size-8 opacity-35 mb-2" />
              <span className="text-[13px]">Chưa có dữ liệu bán hàng</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-around gap-4">
              {/* Donut SVG Drawing */}
              <div className="flex justify-center relative">
                <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                  <circle cx="80" cy="80" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                  {categoryData.map((item, idx) => {
                    const percent = (item.revenue / totalCatRevenue) * 100;
                    const strokeLength = (percent / 100) * 314.159;
                    const offset = accumulatedOffset;
                    accumulatedOffset += strokeLength;
                    const color = COLORS[idx % COLORS.length];

                    return (
                      <circle
                        key={idx}
                        cx="80"
                        cy="80"
                        r="50"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="20"
                        strokeDasharray={`${strokeLength} ${314.159 - strokeLength}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-300 hover:stroke-[24px]"
                      />
                    );
                  })}
                </svg>

                {/* Donut inner text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.5px]">Doanh số</span>
                  <span className="text-[14px] font-black text-[#0f172a]">{formatVND(totalCatRevenue)}</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {categoryData.map((item, idx) => {
                  const percent = ((item.revenue / totalCatRevenue) * 100).toFixed(1);
                  const color = COLORS[idx % COLORS.length];
                  
                  return (
                    <div key={idx} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2 truncate max-w-[70%]">
                        <div className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-[#475569] truncate" title={item.categoryName}>
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-[#0f172a]">
                        <span>{percent}%</span>
                        <span className="text-[#94a3b8] text-[11px] font-normal">({formatVND(item.revenue)})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Table Rows */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top 5 sản phẩm bán chạy (30 ngày) */}
        <div className="xl:col-span-2 bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-sm flex flex-col">
          <h3 className="text-[#0f172a] text-[16px] font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-[#8b5cf6]" />
            Top 5 Sản phẩm Bán chạy (30 ngày gần nhất)
          </h3>
          <div className="overflow-x-auto">
            {(!stats?.topProducts || stats.topProducts.length === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#94a3b8]">
                <Package className="size-8 opacity-35 mb-2" />
                <span className="text-[13px]">Không có dữ liệu sản phẩm bán chạy</span>
              </div>
            ) : (
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-[#f8fafc] text-[#64748b] font-bold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="px-4 py-3">Mã SP</th>
                    <th className="px-4 py-3">Tên sản phẩm</th>
                    <th className="px-4 py-3 text-center">Số lượng bán</th>
                    <th className="px-4 py-3 text-right">Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-[#475569]">
                  {stats.topProducts.map((p, idx) => (
                    <tr key={p.productId} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-[#0f172a]">#{p.productId}</td>
                      <td className="px-4 py-3.5 font-bold text-[#0f172a] max-w-[280px] truncate" title={p.productName}>
                        {p.productName}
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-[#0058be]">{p.quantitySold} cái</td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-600">{formatVND(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 shadow-sm flex flex-col">
          <h3 className="text-[#0f172a] text-[16px] font-bold mb-4 flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            Hoạt động gần đây
          </h3>
          <div className="flex flex-col gap-4 flex-1">
            {(!stats?.recentActivities || stats.recentActivities.length === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#94a3b8] flex-1">
                <Clock className="size-8 opacity-35 mb-2" />
                <span className="text-[13px]">Không có hoạt động gần đây</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-[#f1f5f9] pb-3 last:border-0 last:pb-0">
                    <div className="p-2 rounded-[8px] bg-blue-50 text-blue-600 shrink-0">
                      <ShoppingBag className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#0f172a] text-[13px] font-bold leading-snug truncate">
                        {activity.title}
                      </p>
                      <span className="text-[#94a3b8] text-[11px] font-semibold mt-1 block">
                        {activity.timeAgo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
