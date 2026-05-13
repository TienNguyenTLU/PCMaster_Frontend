'use client';

import { Plus, Search, Filter, MoreHorizontal, FileText, CheckCircle } from 'lucide-react';

const mockPOs = [
  { id: 'PO-2024-001', supplier: 'Intel Corporation', date: '2024-10-12', total: '$45,000.00', status: 'RECEIVED' },
  { id: 'PO-2024-002', supplier: 'NVIDIA', date: '2024-10-14', total: '$120,500.00', status: 'DRAFT' },
  { id: 'PO-2024-003', supplier: 'ASUS Tek', date: '2024-10-15', total: '$12,400.00', status: 'PENDING' },
];

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Purchase Orders</h2>
          <p className="text-[#64748b] text-[14px] mt-1">Manage incoming stock and supplier orders.</p>
        </div>
        <button className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors">
          <Plus className="size-4" />
          Create PO
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input 
              type="text" 
              placeholder="Search POs..." 
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
                <th className="px-6 py-4 font-medium">PO Number</th>
                <th className="px-6 py-4 font-medium">Supplier</th>
                <th className="px-6 py-4 font-medium">Date Created</th>
                <th className="px-6 py-4 font-medium">Total Value</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {mockPOs.map((po) => (
                <tr key={po.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#0f172a]">{po.id}</td>
                  <td className="px-6 py-4 text-[#475569]">{po.supplier}</td>
                  <td className="px-6 py-4 text-[#475569]">{po.date}</td>
                  <td className="px-6 py-4 text-[#0f172a] font-medium">{po.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${
                      po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 
                      po.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                      {po.status !== 'RECEIVED' && (
                        <button className="p-1 hover:text-green-600 transition-colors" title="Receive Items"><CheckCircle className="size-4" /></button>
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
