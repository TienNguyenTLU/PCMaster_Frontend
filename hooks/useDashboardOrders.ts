"use client";

import { useState, useEffect, useCallback } from "react";
import { orderAPI, OrderResponse, OrderStatus, PaymentStatus } from "@/lib/api";
import toast from "react-hot-toast";

// ==========================================
// HOOK QUẢN LÝ ĐƠN HÀNG BÁN Ở DASHBOARD
// ==========================================

export function useDashboardOrders() {
  // Trạng thái danh sách đơn hàng từ API
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Trạng thái tìm kiếm và bộ lọc đơn hàng
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(
    null,
  );
  const [sortBy, setSortBy] = useState("id-desc");

  // Tải toàn bộ danh sách đơn hàng
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderAPI.adminListAll();
      setOrders(data || []);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  // Tự động tải đơn hàng lần đầu khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // Lọc danh sách đơn hàng ở client dựa theo từ khóa, trạng thái đơn, trạng thái thanh toán
  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    const matchPayment = filterPayment === "ALL" || o.paymentStatus === filterPayment;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      String(o.id).includes(q) ||
      (o.username ?? "").toLowerCase().includes(q) ||
      (o.email ?? "").toLowerCase().includes(q);
    return matchStatus && matchPayment && matchSearch;
  });

  // Sắp xếp đơn hàng ở client
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name-asc") {
      const uA = a.username ?? `User #${a.userId}`;
      const uB = b.username ?? `User #${b.userId}`;
      return uA.localeCompare(uB, "vi");
    }
    if (sortBy === "name-desc") {
      const uA = a.username ?? `User #${a.userId}`;
      const uB = b.username ?? `User #${b.userId}`;
      return uB.localeCompare(uA, "vi");
    }
    if (sortBy === "id-asc") {
      const valA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id);
      const valB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id);
      return valA - valB;
    }
    // default: id-desc (mới nhất)
    const valA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id);
    const valB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id);
    return valB - valA;
  });

  // Tính toán nhanh số liệu thống kê đơn hàng phục vụ hiển thị
  const totalOrdersCount = orders.length;
  const draftCount = orders.filter((o) => o.status === "DRAFT").length;
  const confirmedCount = orders.filter((o) => o.status === "CONFIRMED").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  return {
    orders,
    loading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterPayment,
    setFilterPayment,
    selectedOrder,
    setSelectedOrder,
    fetchOrders,
    filtered: sorted,
    totalOrdersCount,
    draftCount,
    confirmedCount,
    shippedCount,
    deliveredCount,
    sortBy,
    setSortBy,
  };
}
