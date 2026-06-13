'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Search, Filter, Plus } from 'lucide-react';
import { adminAPI, InventoryBatchResponse, IssueSlipResponse } from '@/lib/api';
import toast from 'react-hot-toast';

// Subcomponents
import BatchList from '@/components/dashboard/inventory/BatchList';
import PurchaseOrderList from '@/components/dashboard/inventory/PurchaseOrderList';
import IssueSlipList from '@/components/dashboard/inventory/IssueSlipList';
import CreateIssueSlipModal from '@/components/dashboard/inventory/CreateIssueSlipModal';
import IssueSlipDetailModal from '@/components/dashboard/inventory/IssueSlipDetailModal';
import EditPricesModal from '@/components/dashboard/inventory/EditPricesModal';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'batches' | 'purchase-orders' | 'slips'>('batches');
  const [batches, setBatches] = useState<InventoryBatchResponse[]>([]);
  const [slips, setSlips] = useState<IssueSlipResponse[]>([]);
  
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isCreateSlipOpen, setIsCreateSlipOpen] = useState(false);
  const [poReloadTrigger, setPoReloadTrigger] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Batches pagination
  const [batchesPage, setBatchesPage] = useState(0);
  const [batchesSize] = useState(10);
  const [batchesTotalPages, setBatchesTotalPages] = useState(0);
  const [batchesTotalElements, setBatchesTotalElements] = useState(0);
  
  // Slips pagination
  const [slipsPage, setSlipsPage] = useState(0);
  const [slipsSize] = useState(10);
  const [slipsTotalPages, setSlipsTotalPages] = useState(0);
  const [slipsTotalElements, setSlipsTotalElements] = useState(0);
  
  // Batches filter
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  
  // Slips filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  
  // Modals state
  const [selectedSlip, setSelectedSlip] = useState<IssueSlipResponse | null>(null);
  const [editingBatch, setEditingBatch] = useState<InventoryBatchResponse | null>(null);
  
  const [savingPrices, setSavingPrices] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  // Fetch data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (activeTab === 'batches') {
        const data = await adminAPI.getInventoryBatches(batchesPage, batchesSize);
        setBatches(data.content || []);
        setBatchesTotalPages(data.totalPages || 0);
        setBatchesTotalElements(data.totalElements || 0);
      } else if (activeTab === 'slips') {
        const data = await adminAPI.getIssueSlips(slipsPage, slipsSize);
        setSlips(data.content || []);
        setSlipsTotalPages(data.totalPages || 0);
        setSlipsTotalElements(data.totalElements || 0);
      } else if (activeTab === 'purchase-orders') {
        setPoReloadTrigger(prev => prev + 1);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Không thể tải dữ liệu kho hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, batchesPage, batchesSize, slipsPage, slipsSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);



  // Handle Dispatch Slip
  const handleDispatch = async (slipId: number) => {
    setDispatchingId(slipId);
    try {
      const updatedSlip = await adminAPI.dispatchIssueSlip(slipId);
      toast.success(`Đã xuất kho thành công phiếu #${updatedSlip.code}!`);
      
      // Update local state
      setSlips(prev => prev.map(s => s.id === slipId ? updatedSlip : s));
      
      // Update modal state if open
      if (selectedSlip && selectedSlip.id === slipId) {
        setSelectedSlip(updatedSlip);
      }
      
      fetchData(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Xuất kho thất bại');
    } finally {
      setDispatchingId(null);
    }
  };

  // Handle Price Editing Save
  const handleSavePrices = async (batchId: number, importPrice: number, sellingPrice: number) => {
    setSavingPrices(true);
    try {
      await adminAPI.updateInventoryPrices(batchId, importPrice, sellingPrice);
      toast.success('Cập nhật giá thành công!');
      setEditingBatch(null);
      fetchData(true); // reload inventory batches
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Cập nhật giá thất bại');
    } finally {
      setSavingPrices(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]">Quản lý kho hàng</h2>
          <p className="text-[#64748b] text-[14px] mt-1">
            Theo dõi tồn kho theo lô nhập (FIFO), chỉnh sửa giá bán và phê duyệt các phiếu xuất kho bán lẻ.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-[#cbd5e1] hover:border-[#94a3b8] rounded-[8px] text-[14px] font-medium text-[#475569] bg-white transition-colors cursor-pointer shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin text-[#0058be]' : 'text-[#64748b]'}`} />
          Tải lại
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#e2e8f0] gap-8">
        <button
          onClick={() => {
            setActiveTab('batches');
            setSearchQuery('');
          }}
          className={`pb-3 text-[15px] font-semibold transition-all relative cursor-pointer ${
            activeTab === 'batches' ? 'text-[#0058be]' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Tồn kho theo lô hàng
          {activeTab === 'batches' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0058be] rounded-full" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('purchase-orders');
            setSearchQuery('');
          }}
          className={`pb-3 text-[15px] font-semibold transition-all relative cursor-pointer ${
            activeTab === 'purchase-orders' ? 'text-[#0058be]' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Phiếu nhập hàng
          {activeTab === 'purchase-orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0058be] rounded-full" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('slips');
            setSearchQuery('');
          }}
          className={`pb-3 text-[15px] font-semibold transition-all relative cursor-pointer ${
            activeTab === 'slips' ? 'text-[#0058be]' : 'text-[#64748b] hover:text-[#0f172a]'
          }`}
        >
          Phiếu xuất kho
          {activeTab === 'slips' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0058be] rounded-full" />
          )}
        </button>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0] gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder={
              activeTab === 'batches'
                ? "Tìm theo tên, mã lô hoặc mã SP..."
                : activeTab === 'purchase-orders'
                ? "Tìm mã phiếu nhập, nhà cung cấp..."
                : "Tìm mã phiếu, người nhận, SĐT..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all"
          />
        </div>

        {/* Tab Specific Filters */}
        {activeTab === 'batches' ? (
          <label className="flex items-center gap-2 text-[14px] text-[#475569] font-medium select-none cursor-pointer">
            <input
              type="checkbox"
              checked={hideOutOfStock}
              onChange={(e) => setHideOutOfStock(e.target.checked)}
              className="size-4 rounded text-[#0058be] border-[#cbd5e1] focus:ring-[#0058be]/20 cursor-pointer"
            />
            Ẩn lô đã hết hàng
          </label>
        ) : activeTab === 'purchase-orders' ? (
          <button
            onClick={() => setIsCreatePOOpen(true)}
            className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer"
          >
            <Plus className="size-4" /> Tạo phiếu nhập
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-4 text-[14px]">
            <div className="flex items-center gap-2">
              <span className="text-[#64748b] flex items-center gap-1">
                <Filter className="size-3.5" /> Trạng thái:
              </span>
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#eff6ff] text-[#0058be] border border-[#0058be]/10 font-semibold'
                      : 'bg-white text-[#475569] hover:bg-[#f8fafc] border border-[#e2e8f0]'
                  }`}
                >
                  {status === 'ALL' ? 'Tất cả' : status === 'PENDING' ? 'Chờ xuất kho' : 'Đã xuất kho'}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setIsCreateSlipOpen(true)}
              className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer shrink-0"
            >
              <Plus className="size-4" /> Tạo phiếu xuất
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading && activeTab !== 'purchase-orders' ? (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] py-24 flex flex-col items-center justify-center gap-2 shadow-sm">
          <Loader2 className="size-6 text-[#0058be] animate-spin" />
          <p className="text-[#64748b] text-[14px]">Đang tải dữ liệu kho hàng...</p>
        </div>
      ) : activeTab === 'batches' ? (
        <BatchList
          batches={batches}
          page={batchesPage}
          size={batchesSize}
          totalPages={batchesTotalPages}
          totalElements={batchesTotalElements}
          onPageChange={setBatchesPage}
          onEditClick={setEditingBatch}
          searchQuery={searchQuery}
          hideOutOfStock={hideOutOfStock}
        />
      ) : activeTab === 'purchase-orders' ? (
        <PurchaseOrderList
          searchQuery={searchQuery}
          isCreateOpen={isCreatePOOpen}
          setIsCreateOpen={setIsCreatePOOpen}
          reloadTrigger={poReloadTrigger}
        />
      ) : (
        <IssueSlipList
          slips={slips}
          page={slipsPage}
          size={slipsSize}
          totalPages={slipsTotalPages}
          totalElements={slipsTotalElements}
          onPageChange={setSlipsPage}
          onViewClick={setSelectedSlip}
          onDispatchClick={handleDispatch}
          dispatchingId={dispatchingId}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      )}

      {/* Modals */}
      {selectedSlip && (
        <IssueSlipDetailModal
          slip={selectedSlip}
          onClose={() => setSelectedSlip(null)}
          onDispatch={handleDispatch}
          dispatching={dispatchingId === selectedSlip.id}
        />
      )}

      {isCreateSlipOpen && (
        <CreateIssueSlipModal
          onClose={() => setIsCreateSlipOpen(false)}
          onSuccess={() => fetchData(true)}
        />
      )}

      {editingBatch && (
        <EditPricesModal
          batch={editingBatch}
          onClose={() => setEditingBatch(null)}
          onSave={handleSavePrices}
          saving={savingPrices}
        />
      )}

    </div>
  );
}
