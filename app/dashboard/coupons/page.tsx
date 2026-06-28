"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Check,
  Ticket,
  Calendar,
  Percent,
  RefreshCw,
} from "lucide-react";
import { adminAPI, Coupon, CouponRequest } from "@/lib/api";
import toast from "react-hot-toast";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("id-desc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await adminAPI.getCoupons();
      setCoupons(response || []);
    } catch {
      setError("Lỗi khi tải danh sách mã giảm giá. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.resolve();
      fetchCoupons();
    };
    loadData();
  }, []);

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.discountType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedCoupons = [...filteredCoupons].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.code.localeCompare(b.code, "en");
    }
    if (sortBy === "name-desc") {
      return b.code.localeCompare(a.code, "en");
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

  const handleCreate = () => {
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) return;
    try {
      await adminAPI.deleteCoupon(id);
      toast.success("Xóa mã giảm giá thành công!");
      fetchCoupons();
    } catch {
      toast.error("Xóa mã giảm giá thất bại.");
    }
  };

  const formatDiscount = (c: Coupon) => {
    if (c.discountType === "PERCENTAGE") {
      return `${c.discountValue}% (Tối đa ${c.maxDiscountAmount?.toLocaleString("vi-VN")}₫)`;
    }
    return `${c.discountValue.toLocaleString("vi-VN")}₫`;
  };

  const getStatusLabel = (c: Coupon) => {
    const now = new Date();
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);

    if (!c.active)
      return (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded-full border border-gray-200">
          Đã tắt
        </span>
      );
    if (now < start)
      return (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full border border-blue-100">
          Chưa bắt đầu
        </span>
      );
    if (now > end)
      return (
        <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-full border border-red-100">
          Hết hạn
        </span>
      );
    if (c.usageLimit && c.usageCount >= c.usageLimit)
      return (
        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[11px] font-bold rounded-full border border-amber-100">
          Hết lượt
        </span>
      );
    return (
      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full border border-emerald-100">
        Đang hoạt động
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px] flex items-center gap-2">
            <Ticket className="size-6 text-[#0058be]" />
            Mã giảm giá (Coupon)
          </h2>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="size-4" />
          Thêm Coupon mới
        </button>
      </div>

      {}
      <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã coupon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all w-[300px]"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-1.5 text-[14px] focus:outline-none focus:border-[#0058be] transition-all cursor-pointer font-semibold text-[#334155]"
          >
            <option value="id-desc">Mới nhất</option>
            <option value="id-asc">Cũ nhất</option>
            <option value="name-asc">Mã: A-Z</option>
            <option value="name-desc">Mã: Z-A</option>
          </select>
        </div>
      </div>

      {}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px] text-[#64748b]">
              <Loader2 className="size-5 animate-spin mr-2 text-[#0058be]" />{" "}
              Đang tải dữ liệu...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[300px] text-red-500">
              {error}
            </div>
          ) : sortedCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-[#64748b] gap-2">
              <Ticket className="size-8 opacity-40" />
              <span>Không tìm thấy mã giảm giá nào.</span>
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-medium">
                <tr>
                  <th className="px-6 py-4 font-semibold">Mã Code</th>
                  <th className="px-6 py-4 font-semibold">Hình thức giảm</th>
                  <th className="px-6 py-4 font-semibold">Đơn tối thiểu</th>
                  <th className="px-6 py-4 font-semibold">
                    Đã dùng / Giới hạn
                  </th>
                  <th className="px-6 py-4 font-semibold">Hạn hiệu lực</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {sortedCoupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold font-mono bg-blue-50 text-[#0058be] px-3 py-1 rounded-[6px] border border-blue-100 text-[13px] uppercase">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {coupon.discountType === "PERCENTAGE" ? (
                          <Percent className="size-3.5 text-[#0058be]" />
                        ) : (
                          <Ticket className="size-3.5 text-emerald-500" />
                        )}
                        <span className="font-semibold text-[#0f172a]">
                          {formatDiscount(coupon)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#475569]">
                      {coupon.minOrderAmount.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-6 py-4 font-medium text-[#475569]">
                      {coupon.usageCount} / {coupon.usageLimit || "∞"}
                    </td>
                    <td className="px-6 py-4 text-[12px] text-[#64748b]">
                      <div className="flex flex-col">
                        <span>
                          Bắt đầu:{" "}
                          {new Date(coupon.startDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                        <span>
                          Kết thúc:{" "}
                          {new Date(coupon.endDate).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusLabel(coupon)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#94a3b8]">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-1 hover:text-[#0058be] transition-colors cursor-pointer"
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCoupons();
          }}
        />
      )}
    </div>
  );
}

function CouponFormModal({
  coupon,
  onClose,
  onSuccess,
}: {
  coupon: Coupon | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState(() => ({
    code: coupon?.code || "",
    discountType:
      coupon?.discountType || ("PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT"),
    discountValue: coupon?.discountValue || 10,
    minOrderAmount: coupon?.minOrderAmount || 0,
    maxDiscountAmount: coupon?.maxDiscountAmount || 0,
    startDate: coupon?.startDate
      ? coupon.startDate.substring(0, 10)
      : new Date().toISOString().substring(0, 10),
    endDate: coupon?.endDate
      ? coupon.endDate.substring(0, 10)
      : new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
    usageLimit: coupon?.usageLimit || 0,
    active: coupon?.active !== false,
  }));

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PCMASTER-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) newErrors.code = "Mã code không được để trống.";
    if (formData.discountValue <= 0)
      newErrors.discountValue = "Giá trị giảm giá phải lớn hơn 0.";
    if (formData.discountType === "PERCENTAGE" && formData.discountValue > 100)
      newErrors.discountValue = "Giá trị phần trăm không được vượt quá 100%.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: CouponRequest = {
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount),
        maxDiscountAmount:
          formData.discountType === "PERCENTAGE" &&
          formData.maxDiscountAmount > 0
            ? Number(formData.maxDiscountAmount)
            : null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        usageLimit:
          formData.usageLimit > 0 ? Number(formData.usageLimit) : null,
        active: formData.active,
      };

      if (coupon) {
        await adminAPI.updateCoupon(coupon.id, payload);
        toast.success("Cập nhật Coupon thành công!");
      } else {
        await adminAPI.createCoupon(payload);
        toast.success("Tạo Coupon mới thành công!");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra. Vui lòng kiểm tra lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-lg flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h3 className="font-bold text-[18px] text-[#0f172a]">
            {coupon ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"
          >
            <X className="size-5 text-[#64748b]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-semibold text-[#475569]">
              Mã code Coupon *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ví dụ: SUMMER2026"
                className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] font-mono font-bold focus:outline-none focus:border-[#0058be] uppercase flex-1 ${
                  errors.code ? "border-red-500" : "border-[#e2e8f0]"
                }`}
              />
              <button
                type="button"
                onClick={generateRandomCode}
                className="bg-[#f1f5f9] border border-[#cbd5e1] text-[#0058be] hover:bg-blue-50 px-4 py-2 rounded-[8px] text-[13px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="size-3.5" /> Tạo ngẫu nhiên
              </button>
            </div>
            {errors.code && (
              <span className="text-red-500 text-[11px] font-medium">
                ⚠️ {errors.code}
              </span>
            )}
          </div>

          {}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-semibold text-[#475569]">
              Hình thức chiết khấu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    discountType: "PERCENTAGE",
                    discountValue:
                      prev.discountValue > 100 ? 10 : prev.discountValue,
                  }))
                }
                className={`flex items-center justify-center gap-2 p-2.5 rounded-[8px] border text-[13px] font-semibold transition-all cursor-pointer ${
                  formData.discountType === "PERCENTAGE"
                    ? "border-[#0058be] bg-[#eff6ff] text-[#0058be]"
                    : "border-[#cbd5e1] text-[#475569] hover:bg-[#f8fafc]"
                }`}
              >
                <Percent className="size-4" /> Theo phần trăm (%)
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    discountType: "FIXED_AMOUNT",
                  }))
                }
                className={`flex items-center justify-center gap-2 p-2.5 rounded-[8px] border text-[13px] font-semibold transition-all cursor-pointer ${
                  formData.discountType === "FIXED_AMOUNT"
                    ? "border-[#0058be] bg-[#eff6ff] text-[#0058be]"
                    : "border-[#cbd5e1] text-[#475569] hover:bg-[#f8fafc]"
                }`}
              >
                <Ticket className="size-4" /> Số tiền cố định (₫)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {}
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">
                Giá trị giảm * (
                {formData.discountType === "PERCENTAGE" ? "%" : "₫"})
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountValue: Number(e.target.value),
                  })
                }
                className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] ${
                  errors.discountValue ? "border-red-500" : "border-[#e2e8f0]"
                }`}
              />
              {errors.discountValue && (
                <span className="text-red-500 text-[11px] font-medium">
                  ⚠️ {errors.discountValue}
                </span>
              )}
            </div>

            {}
            {formData.discountType === "PERCENTAGE" && (
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#475569]">
                  Giảm tối đa (₫) (0 = Vô hạn)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: Number(e.target.value),
                    })
                  }
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {}
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">
                Đơn tối thiểu áp dụng (₫)
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minOrderAmount: Number(e.target.value),
                  })
                }
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
              />
            </div>

            {}
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">
                Tổng giới hạn lượt dùng (0 = Vô hạn)
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: Number(e.target.value),
                  })
                }
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {}
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">
                Ngày bắt đầu hiệu lực
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
              />
            </div>

            {}
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-semibold text-[#475569]">
                Ngày hết hạn
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be]"
              />
            </div>
          </div>

          {}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="activeCheck"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="size-4 text-[#0058be] border-[#cbd5e1] rounded focus:ring-[#0058be]"
            />
            <label
              htmlFor="activeCheck"
              className="text-[13px] font-bold text-[#475569] cursor-pointer"
            >
              Kích hoạt Coupon này
            </label>
          </div>

          {}
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e2e8f0] rounded-[8px] text-[13px] text-[#475569] hover:bg-[#f8fafc]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#0058be] text-white rounded-[8px] text-[13px] font-semibold hover:bg-[#0047a3] disabled:opacity-60 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {coupon ? "Lưu thay đổi" : "Tạo Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
