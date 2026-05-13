export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: '$45,231.89', change: '+20.1%', positive: true },
          { title: 'Active Orders', value: '356', change: '+15.2%', positive: true },
          { title: 'Low Stock Items', value: '23', change: '-4.1%', positive: false },
          { title: 'Pending POs', value: '4', change: '0%', positive: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 flex flex-col gap-2">
            <h3 className="text-[#64748b] text-[14px] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              {stat.title}
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-[#0f172a] text-[28px] font-bold tracking-[-0.5px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {stat.value}
              </span>
              <span className={`text-[13px] font-medium mb-1 ${stat.positive ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart placeholder */}
        <div className="col-span-2 bg-white border border-[#e2e8f0] rounded-[12px] p-6 h-[400px] flex flex-col">
          <h3 className="text-[#0f172a] text-[16px] font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Revenue Overview
          </h3>
          <div className="flex-1 bg-[#f8fafc] rounded-[8px] flex items-center justify-center border border-dashed border-[#cbd5e1]">
            <span className="text-[#94a3b8] text-[14px]">Chart Placeholder (Recharts)</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 bg-white border border-[#e2e8f0] rounded-[12px] p-6 flex flex-col">
          <h3 className="text-[#0f172a] text-[16px] font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Recent Activity
          </h3>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="size-2 rounded-full bg-[#0058be] mt-2"></div>
                <div>
                  <p className="text-[#0f172a] text-[14px] font-medium">New order #10{item}2</p>
                  <p className="text-[#64748b] text-[12px]">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
