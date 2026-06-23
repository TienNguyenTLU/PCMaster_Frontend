"use client";

import { useState, useEffect } from "react";
import { Product, buildAPI, adminAPI, PcBuildResponse } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { formatDateOnly } from "@/utils/format";
import { SLOTS, BuildState } from "@/hooks/usePcBuildState";
import toast from "react-hot-toast";

interface UsePcBuildsCRUDProps {
  build: BuildState;
  setBuild: React.Dispatch<React.SetStateAction<BuildState>>;
  selectedCount: number;
}

// ==========================================
// HOOK QUẢN LÝ LƯU TRỮ VÀ KHỞI TẠO CẤU HÌNH (CRUD)
// ==========================================

export function usePcBuildsCRUD({ build, setBuild, selectedCount }: UsePcBuildsCRUDProps) {
  const { user } = useAuthStore();

  // Các state quản lý danh sách cấu hình và tab hiển thị
  const [activeTab, setActiveTab] = useState<"builder" | "my-builds">("builder");
  const [myBuilds, setMyBuilds] = useState<PcBuildResponse[]>([]);
  const [loadingMyBuilds, setLoadingMyBuilds] = useState(false);

  // Các state quản lý modal Lưu cấu hình
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [savingBuild, setSavingBuild] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Các state quản lý modal Xóa cấu hình
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [pendingDeleteBuildId, setPendingDeleteBuildId] = useState<number | null>(null);

  // Tải danh sách cấu hình đã lưu của khách hàng
  const fetchMyBuilds = async () => {
    if (!user) return;
    setLoadingMyBuilds(true);
    try {
      const data = await buildAPI.list();
      setMyBuilds(data);
    } catch {
      console.error("Error fetching custom builds.");
    } finally {
      setLoadingMyBuilds(false);
    }
  };

  // Tự động tải danh sách cấu hình khi chuyển sang tab "Cấu hình đã lưu"
  useEffect(() => {
    if (activeTab === "my-builds" && user) {
      fetchMyBuilds();
    }
  }, [activeTab, user]);

  // Click nút mở modal Lưu cấu hình
  const handleSaveClick = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập trước khi lưu cấu hình!");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Vui lòng chọn ít nhất 1 linh kiện trước khi lưu!");
      return;
    }
    setBuildName(`Cấu hình máy ngày ${formatDateOnly(new Date().toISOString())}`);
    setErrors({});
    setShowSaveModal(true);
  };

  // Gửi thông tin lưu cấu hình PC
  const handleSaveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildName.trim()) {
      setErrors({ buildName: "Vui lòng nhập tên cấu hình!" });
      return;
    }
    setSavingBuild(true);
    try {
      const savedBuild = await buildAPI.create(buildName);
      const slotToTypeMap: Record<string, string> = {
        cpu: "CPU",
        mainboard: "MAINBOARD",
        ram: "RAM",
        storage: "STORAGE",
        vga: "GPU",
        psu: "PSU",
        case: "CASE",
        cooler: "COOLER",
      };
      const selectedItems = Object.entries(build)
        .filter(([, prod]) => !!prod)
        .map(([slotKey, prod]) => {
          const componentType = slotKey.startsWith("storage_extra_")
            ? "STORAGE"
            : slotToTypeMap[slotKey];
          return {
            productId: Number(prod!.id),
            componentType,
          };
        })
        .filter((item) => !!item.componentType);

      for (const item of selectedItems) {
        await buildAPI.addItem(
          savedBuild.id,
          item.productId,
          item.componentType,
        );
      }
      toast.success("Lưu cấu hình PC thành công!");
      setShowSaveModal(false);
      fetchMyBuilds();
    } catch (err) {
      console.error(err);
      toast.error("Lưu cấu hình thất bại. Vui lòng thử lại.");
    } finally {
      setSavingBuild(false);
    }
  };

  // Nạp lại cấu hình cũ đã lưu vào giỏ lắp ráp hiện tại
  const loadSavedBuild = async (savedBuild: PcBuildResponse) => {
    setLoadingMyBuilds(true);
    const toastId = toast.loading("Đang tải chi tiết cấu hình...");
    try {
      const newBuildState: Record<string, Product | null> = Object.fromEntries(
        SLOTS.map((s) => [s.key, null]),
      );
      const typeToSlotMap: Record<string, string> = {
        CPU: "cpu",
        MAINBOARD: "mainboard",
        RAM: "ram",
        STORAGE: "storage",
        GPU: "vga",
        PSU: "psu",
        CASE: "case",
        COOLER: "cooler",
      };
      let storageCount = 0;

      for (const item of savedBuild.items) {
        if (item.productId) {
          let slotKey = typeToSlotMap[item.componentType];
          if (item.componentType === "STORAGE") {
            if (storageCount > 0) {
              slotKey = `storage_extra_${storageCount}`;
            }
            storageCount++;
          }
          if (slotKey) {
            try {
              const product = await adminAPI.getProductById(item.productId);
              newBuildState[slotKey] = product;
            } catch (err) {
              console.error("Error loading product: ", item.productId, err);
            }
          }
        }
      }
      setBuild(newBuildState);
      setActiveTab("builder");
      toast.success(`Đã tải cấu hình: ${savedBuild.name}`, { id: toastId });
    } catch {
      toast.error("Lỗi khi tải chi tiết cấu hình.", { id: toastId });
    } finally {
      setLoadingMyBuilds(false);
    }
  };

  // Click nút yêu cầu xóa cấu hình
  const handleDeleteBuildClick = (buildId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteBuildId(buildId);
    setShowDeleteConfirmModal(true);
  };

  // Xác nhận xóa cấu hình
  const confirmDeleteBuild = async () => {
    if (pendingDeleteBuildId === null) return;
    const toastId = toast.loading("Đang xóa cấu hình...");
    try {
      await buildAPI.delete(pendingDeleteBuildId);
      toast.success("Đã xóa cấu hình PC thành công!", { id: toastId });
      fetchMyBuilds();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa cấu hình. Vui lòng thử lại.", { id: toastId });
    } finally {
      setShowDeleteConfirmModal(false);
      setPendingDeleteBuildId(null);
    }
  };

  const cancelDeleteBuild = () => {
    setShowDeleteConfirmModal(false);
    setPendingDeleteBuildId(null);
  };

  return {
    activeTab,
    setActiveTab,
    myBuilds,
    loadingMyBuilds,
    showSaveModal,
    setShowSaveModal,
    buildName,
    setBuildName,
    savingBuild,
    errors,
    setErrors,
    showDeleteConfirmModal,
    setShowDeleteConfirmModal,
    pendingDeleteBuildId,
    handleSaveClick,
    handleSaveConfirm,
    loadSavedBuild,
    handleDeleteBuildClick,
    confirmDeleteBuild,
    cancelDeleteBuild,
    fetchMyBuilds,
  };
}
