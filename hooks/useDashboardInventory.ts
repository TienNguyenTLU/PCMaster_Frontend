"use client";

import { useState, useEffect, useCallback } from "react";
import { adminAPI, InventoryBatchResponse, IssueSlipResponse } from "@/lib/api";
import toast from "react-hot-toast";





export function useDashboardInventory() {
  
  const [activeTab, setActiveTab] = useState<
    "batches" | "purchase-orders" | "slips"
  >("batches");
  const [batches, setBatches] = useState<InventoryBatchResponse[]>([]);
  const [slips, setSlips] = useState<IssueSlipResponse[]>([]);
  const [sortBy, setSortBy] = useState("id-desc");

  
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isCreateSlipOpen, setIsCreateSlipOpen] = useState(false);
  const [poReloadTrigger, setPoReloadTrigger] = useState(0);

  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Phân trang danh sách lô hàng
  const [batchesPage, setBatchesPage] = useState(0);
  const [batchesSize] = useState(10);
  const [batchesTotalPages, setBatchesTotalPages] = useState(0);
  const [batchesTotalElements, setBatchesTotalElements] = useState(0);

  // Phân trang danh sách phiếu xuất
  const [slipsPage, setSlipsPage] = useState(0);
  const [slipsSize] = useState(10);
  const [slipsTotalPages, setSlipsTotalPages] = useState(0);
  const [slipsTotalElements, setSlipsTotalElements] = useState(0);

  // Bộ lọc ẩn lô hàng hết tồn kho
  const [hideOutOfStock, setHideOutOfStock] = useState(false);

  // Bộ lọc trạng thái phiếu xuất
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "COMPLETED"
  >("ALL");

  
  const [selectedSlip, setSelectedSlip] = useState<IssueSlipResponse | null>(
    null,
  );
  const [editingBatch, setEditingBatch] =
    useState<InventoryBatchResponse | null>(null);

  const [savingPrices, setSavingPrices] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        if (activeTab === "batches") {
          const data = await adminAPI.getInventoryBatches(
            batchesPage,
            batchesSize,
          );
          setBatches(data.content || []);
          setBatchesTotalPages(data.totalPages || 0);
          setBatchesTotalElements(data.totalElements || 0);
        } else if (activeTab === "slips") {
          const data = await adminAPI.getIssueSlips(slipsPage, slipsSize);
          setSlips(data.content || []);
          setSlipsTotalPages(data.totalPages || 0);
          setSlipsTotalElements(data.totalElements || 0);
        } else if (activeTab === "purchase-orders") {
          setPoReloadTrigger((prev) => prev + 1);
        }
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Không thể tải dữ liệu kho hàng",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, batchesPage, batchesSize, slipsPage, slipsSize],
  );

  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  
  const handleDispatch = async (slipId: number) => {
    setDispatchingId(slipId);
    try {
      const updatedSlip = await adminAPI.dispatchIssueSlip(slipId);
      toast.success(`Đã xuất kho thành công phiếu #${updatedSlip.code}!`);
      setSlips((prev) => prev.map((s) => (s.id === slipId ? updatedSlip : s)));
      if (selectedSlip && selectedSlip.id === slipId) {
        setSelectedSlip(updatedSlip);
      }
      fetchData(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xuất kho thất bại");
    } finally {
      setDispatchingId(null);
    }
  };

  
  const handleSavePrices = async (
    batchId: number,
    importPrice: number,
    sellingPrice: number,
  ) => {
    setSavingPrices(true);
    try {
      await adminAPI.updateInventoryPrices(batchId, importPrice, sellingPrice);
      toast.success("Cập nhật giá thành công!");
      setEditingBatch(null);
      fetchData(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Cập nhật giá thất bại");
    } finally {
      setSavingPrices(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    batches,
    slips,
    isCreatePOOpen,
    setIsCreatePOOpen,
    isCreateSlipOpen,
    setIsCreateSlipOpen,
    poReloadTrigger,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    batchesPage,
    setBatchesPage,
    batchesSize,
    batchesTotalPages,
    batchesTotalElements,
    slipsPage,
    setSlipsPage,
    slipsSize,
    slipsTotalPages,
    slipsTotalElements,
    hideOutOfStock,
    setHideOutOfStock,
    statusFilter,
    setStatusFilter,
    selectedSlip,
    setSelectedSlip,
    editingBatch,
    setEditingBatch,
    savingPrices,
    dispatchingId,
    fetchData,
    handleDispatch,
    handleSavePrices,
    sortBy,
    setSortBy,
  };
}
