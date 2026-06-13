"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  X,
  Lock,
  Unlock,
  UserCheck,
  UserX,
} from "lucide-react";
import { adminAPI, UserResponse, CreateStaffRequest } from "@/lib/api";
import { USER_ROLE_MAP } from "@/lib/labelMapping";
import toast from "react-hot-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "ADMIN" | "STAFF" | "CUSTOMER"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "LOCKED">(
    "ALL",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminAPI.getUsers();
      setUsers(data || []);
    } catch {
      setError("Lỗi khi tải danh sách người dùng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleActive = async (user: UserResponse) => {
    if (user.role === "ADMIN") {
      toast.error("Không thể khóa tài khoản Administrator!");
      return;
    }
    const actionText = user.active ? "Khóa" : "Mở khóa";
    if (
      !confirm(
        `Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${user.username}"?`,
      )
    ) {
      return;
    }

    try {
      await adminAPI.toggleUserStatus(user.id);
      toast.success(`${actionText} tài khoản thành công!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)),
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        `Thao tác ${actionText.toLowerCase()} tài khoản thất bại.`;
      toast.error(msg);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    // 1. Search Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.phone && u.phone.includes(searchLower));

    // 2. Role Filter
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    // 3. Status Filter
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.active) ||
      (statusFilter === "LOCKED" && !u.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[#0f172a] text-[24px] font-semibold tracking-[-0.5px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Quản lý người dùng
          </h2>
          <p
            className="text-[#64748b] text-[14px] mt-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Quản lý tài khoản khách hàng, nhân viên và tạo tài khoản nhân viên
            mới.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#0058be] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#0047a3] transition-colors cursor-pointer"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <Plus className="size-4" />
          Thêm nhân viên
        </button>
      </div>

      {/* Toolbar & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-[12px] border border-[#e2e8f0]">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Tìm theo username, email, số điện thoại..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <label
            className="text-[13px] font-semibold text-[#64748b] whitespace-nowrap"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Vai trò:
          </label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setPage(0);
            }}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0058be] transition-colors font-medium text-[#334155]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="STAFF">Nhân viên (Staff)</option>
            <option value="CUSTOMER">Khách hàng (Customer)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label
            className="text-[13px] font-semibold text-[#64748b] whitespace-nowrap"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Trạng thái:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(0);
            }}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-[#0058be] transition-colors font-medium text-[#334155]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-[#e2e8f0] rounded-[12px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div
              className="flex items-center justify-center h-[300px] text-[#64748b]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Loader2 className="size-5 animate-spin mr-2" /> Đang tải dữ liệu
              người dùng...
            </div>
          ) : error ? (
            <div
              className="flex items-center justify-center h-[300px] text-red-500 font-medium"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {error}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              className="flex items-center justify-center h-[300px] text-[#64748b]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Không tìm thấy người dùng nào phù hợp.
            </div>
          ) : (
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b]">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">
                    Thông tin liên hệ
                  </th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider">
                    Ngày đăng ký
                  </th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-right">
                    Khóa / Mở
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#f8fafc] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-[#0f172a]">
                      {user.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0f172a]">
                        {user.username}
                      </div>
                      <div className="text-[12px] text-[#94a3b8]">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#475569]">
                      <div className="text-[13px]">
                        {user.phone || (
                          <span className="text-[#cbd5e1] italic">
                            Chưa cập nhật
                          </span>
                        )}
                      </div>
                      <div
                        className="text-[12px] text-[#94a3b8] truncate max-w-[200px]"
                        title={user.address || ""}
                      >
                        {user.address || (
                          <span className="text-[#cbd5e1] italic">
                            Chưa cập nhật
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full border uppercase tracking-[0.5px] ${
                          user.role === "ADMIN"
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : user.role === "STAFF"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {USER_ROLE_MAP[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.active ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[13px]">
                          <UserCheck className="size-4" />
                          Hoạt động
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-500 font-semibold text-[13px]">
                          <UserX className="size-4" />
                          Bị khóa
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#64748b] text-[13px]">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === "ADMIN" ? (
                        <span className="text-[#cbd5e1] text-[12px] italic">
                          Mặc định
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded-[6px] transition-all cursor-pointer ${
                            user.active
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100"
                          }`}
                          title={
                            user.active ? "Khóa tài khoản" : "Mở khóa tài khoản"
                          }
                        >
                          {user.active ? (
                            <Lock className="size-4" />
                          ) : (
                            <Unlock className="size-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div
            className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] text-[13px] text-[#64748b]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <span>
              Hiển thị {page * pageSize + 1} đến{" "}
              {Math.min((page + 1) * pageSize, filteredUsers.length)} trong tổng
              số {filteredUsers.length} mục
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-[#e2e8f0] bg-white rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 transition-colors cursor-pointer"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-3 py-1 border rounded-[6px] transition-colors font-medium ${
                    page === i
                      ? "bg-[#0058be] text-white border-[#0058be]"
                      : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border border-[#e2e8f0] bg-white rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-50 transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {isModalOpen && (
        <CreateStaffModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

interface CreateStaffModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateStaffModal({ onClose, onSuccess }: CreateStaffModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Tên đăng nhập không được để trống.";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Tên đăng nhập phải chứa ít nhất 3 ký tự.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Email không đúng định dạng.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải chứa ít nhất 6 ký tự.";
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+()#.\s-]{8,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = "Số điện thoại không hợp lệ.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await adminAPI.createStaff(formData);
      toast.success("Tạo tài khoản nhân viên thành công!");
      onSuccess();
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        "Có lỗi xảy ra khi tạo tài khoản nhân viên.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-lg flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h3
            className="font-bold text-[18px] text-[#0f172a]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Tạo tài khoản nhân viên mới
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"
          >
            <X className="size-5 text-[#64748b]" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#475569]">
              Tên đăng nhập (Username) *
            </label>
            {errors.username && (
              <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                ⚠️ {errors.username}
              </span>
            )}
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setErrors((prev) => ({ ...prev, username: "" }));
              }}
              placeholder="Nhập tên đăng nhập"
              className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none transition-all ${
                errors.username
                  ? "border-red-500 focus:border-red-500"
                  : "border-[#e2e8f0] focus:border-[#0058be]"
              }`}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#475569]">
              Email *
            </label>
            {errors.email && (
              <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                ⚠️ {errors.email}
              </span>
            )}
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="staff@pcmaster.tech"
              className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none transition-all ${
                errors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-[#e2e8f0] focus:border-[#0058be]"
              }`}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#475569]">
              Mật khẩu *
            </label>
            {errors.password && (
              <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                ⚠️ {errors.password}
              </span>
            )}
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Tối thiểu 6 ký tự"
              className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none transition-all ${
                errors.password
                  ? "border-red-500 focus:border-red-500"
                  : "border-[#e2e8f0] focus:border-[#0058be]"
              }`}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#475569]">
              Số điện thoại
            </label>
            {errors.phone && (
              <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                ⚠️ {errors.phone}
              </span>
            )}
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              placeholder="0987xxxxxx"
              className={`bg-[#f8fafc] border rounded-[8px] px-4 py-2 text-[14px] focus:outline-none transition-all ${
                errors.phone
                  ? "border-red-500 focus:border-red-500"
                  : "border-[#e2e8f0] focus:border-[#0058be]"
              }`}
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#475569]">
              Địa chỉ liên hệ
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Số nhà, đường, quận, thành phố..."
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-4 py-2 text-[14px] focus:outline-none focus:border-[#0058be] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-[14px] font-semibold text-white bg-[#0058be] rounded-[8px] hover:bg-[#0047a3] disabled:opacity-55 transition-colors flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang lưu…
                </>
              ) : (
                "Tạo tài khoản"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
