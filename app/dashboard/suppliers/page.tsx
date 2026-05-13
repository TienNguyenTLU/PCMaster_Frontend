'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { adminAPI, Supplier } from '@/lib/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchSuppliers(page);
  }, [page]);

  const fetchSuppliers = async (pageToFetch: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getSuppliers(pageToFetch, 10);
      setSuppliers(response.content || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      setError('Lỗi khi tải danh sách nhà cung cấp. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Suppliers</h2>
          <p className="text-[#64748b] text-[14px] mt-1">Manage vendor relationships and contact info.</p>
        </div>
        <button className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer">
          <Plus className="size-4" />
          Add Supplier
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-[300px]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-[#e2e8f0] rounded-[8px] text-[#475569] text-[14px] hover:bg-[#f8fafc] transition-colors cursor-pointer">
            <Filter className="size-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-red-500">
              {error}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              Không có dữ liệu nhà cung cấp.
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-medium">Supplier ID</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium">Contact Person</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-6 py-4 font-medium text-[#0f172a]">{supplier.id}</td>
                    <td className="px-6 py-4 text-[#475569]">{supplier.name}</td>
                    <td className="px-6 py-4 text-[#475569]">{supplier.email || '-'}</td>
                    <td className="px-6 py-4 text-[#475569]">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4 text-[#475569]">{supplier.address || '-'}</td>
                    <td className="px-6 py-4 text-[#475569]">{supplier.contactPerson || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                        <button className="p-1 hover:text-[#0058be] transition-colors cursor-pointer"><Edit className="size-4" /></button>
                        <button className="p-1 hover:text-red-600 transition-colors cursor-pointer"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && !error && suppliers.length > 0 && (
          <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between text-[13px] text-[#64748b]">
            <span>Showing page {page + 1} of {totalPages} (Total: {totalElements})</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-[#e2e8f0] rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button className="px-3 py-1 bg-[#0058be] text-white border border-[#0058be] rounded-[6px]">
                {page + 1}
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-[#e2e8f0] rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
