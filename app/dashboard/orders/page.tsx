'use client';

import { Search, Filter, MoreHorizontal, FileText, CheckCircle } from 'lucide-react';

const mockOrders = [
  { id: 'ORD-5091', customer: 'Nikola Tesla', date: '2024-10-24 14:30', total: '$2,150.00', status: 'CONFIRMED', items: 3 },
  { id: 'ORD-5092', customer: 'Ada Lovelace', date: '2024-10-24 15:45', total: '$850.00', status: 'PENDING', items: 1 },
  { id: 'ORD-5093', customer: 'Alan Turing', date: '2024-10-23 09:12', total: '$3,400.00', status: 'CONFIRMED', items: 5 },
  { id: 'ORD-5094', customer: 'Grace Hopper', date: '2024-10-22 11:20', total: '$120.00', status: 'PENDING', items: 2 },
];

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Customer Orders</h2>
          <p className="text-[#64748b] text-[14px] mt-1">Manage and track customer purchases.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-[300px]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-[#e2e8f0] rounded-[8px] text-[#475569] text-[14px] hover:bg-[#f8fafc] transition-colors">
            <Filter className="size-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {mockOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#0f172a]">{order.id}</td>
                  <td className="px-6 py-4 text-[#475569]">{order.customer}</td>
                  <td className="px-6 py-4 text-[#475569]">{order.date}</td>
                  <td className="px-6 py-4 text-[#475569]">{order.items}</td>
                  <td className="px-6 py-4 text-[#0f172a] font-medium">{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${
                      order.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                      {order.status === 'PENDING' && (
                        <button className="p-1 hover:text-green-600 transition-colors" title="Confirm Order"><CheckCircle className="size-4" /></button>
                      )}
                      <button className="p-1 hover:text-[#0058be] transition-colors" title="View Details"><FileText className="size-4" /></button>
                      <button className="p-1 hover:text-[#0f172a] transition-colors"><MoreHorizontal className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
