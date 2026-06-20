"use client";

import { useState } from "react";
import { X, Package, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { adminAPI, Product, Supplier, Brand } from "@/lib/api";
import { CldImage } from "next-cloudinary";
import toast from "react-hot-toast";
import ExcelJS from "exceljs";

const formatVND = (value: number | string) => {
  if (value === undefined || value === null || value === "") return "";
  const clean = String(value).replace(/\D/g, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

interface CartItem {
  product: Product;
  quantity: number;
  importPrice: number;
}

interface CreatePOModalProps {
  suppliers: Supplier[];
  allProducts: Product[];
  allBrands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePOModal({
  suppliers,
  allProducts,
  allBrands,
  onClose,
  onSuccess,
}: CreatePOModalProps) {
  const [step, setStep] = useState<"supplier" | "items">("supplier");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());

  const supplierProducts = selectedSupplier
    ? allProducts.filter((p) => {
        const brandId = p.brand?.id ?? p.brandId;
        return selectedSupplier.brandIds?.some(
          (bid) => String(bid) === String(brandId),
        );
      })
    : [];

  const productsByBrand = supplierProducts.reduce<
    Record<string, { brand: Brand | undefined; products: Product[] }>
  >((acc, p) => {
    const bid = String(p.brand?.id ?? p.brandId ?? "unknown");
    if (!acc[bid]) {
      const brand = allBrands.find((b) => String(b.id) === bid);
      acc[bid] = { brand, products: [] };
    }
    acc[bid].products.push(p);
    return acc;
  }, {});

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.importPrice * item.quantity,
    0,
  );

  const updateQty = (product: Product, qty: number) => {
    if (qty <= 0) {
      setCart((prev) =>
        prev.filter((c) => String(c.product.id) !== String(product.id)),
      );
      return;
    }
    setCart((prev) => {
      const existing = prev.find(
        (c) => String(c.product.id) === String(product.id),
      );
      if (existing)
        return prev.map((c) =>
          String(c.product.id) === String(product.id)
            ? { ...c, quantity: qty }
            : c,
        );
      return [...prev, { product, quantity: qty, importPrice: 0 }];
    });
  };

  const updateImportPrice = (productId: string | number, price: string) => {
    const p = parseFloat(price) || 0;
    setCart((prev) =>
      prev.map((c) =>
        String(c.product.id) === String(productId)
          ? { ...c, importPrice: p }
          : c,
      ),
    );
  };

  const toggleBrand = (bid: number) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(bid)) {
        next.delete(bid);
      } else {
        next.add(bid);
      }
      return next;
    });
  };

  const generateExcel = async () => {
    if (!selectedSupplier) return null;

    const wb = new ExcelJS.Workbook();
    wb.creator = "PCMaster System";
    wb.created = new Date();
    const ws = wb.addWorksheet("PHIẾU NHẬP HÀNG");

    
    ws.columns = [
      { width: 6 }, 
      { width: 45 }, 
      { width: 8 }, 
      { width: 10 }, 
      { width: 18 }, 
      { width: 20 }, 
    ];

    
    ws.mergeCells("A1:F1");
    const titleCell = ws.getCell("A1");
    titleCell.value = "CHUỖI CỬA HÀNG PC MASTER";
    titleCell.font = { name: "Times New Roman", size: 18, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 32;

    
    ws.mergeCells("A2:F2");
    const addrCell = ws.getCell("A2");
    addrCell.value =
      "Hệ thống build PC & Linh kiện  |  pcmaster.support@gmail.com";
    addrCell.font = { name: "Times New Roman", size: 11, italic: true };
    addrCell.alignment = { horizontal: "center" };

    

    
    ws.mergeCells("A4:F4");
    const docTitle = ws.getCell("A4");
    docTitle.value = "PHIẾU NHẬP HÀNG";
    docTitle.font = { name: "Times New Roman", size: 18, bold: true };
    docTitle.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(4).height = 32;

    
    ws.mergeCells("A5:F5");
    const dateCell = ws.getCell("A5");
    dateCell.value = `Ngày lập: ${new Date().toLocaleDateString("vi-VN")}`;
    dateCell.font = { name: "Times New Roman", size: 11 };
    dateCell.alignment = { horizontal: "center" };

    

    
    const infoStartRow = 7;
    const addInfoRow = (row: number, label: string, value: string) => {
      const r = ws.getRow(row);
      r.getCell(1).value = label;
      r.getCell(1).font = { name: "Times New Roman", size: 11, bold: true };
      ws.mergeCells(row, 2, row, 6);
      r.getCell(2).value = value;
      r.getCell(2).font = { name: "Times New Roman", size: 11 };
    };

    addInfoRow(infoStartRow, "Nhà cung cấp:", selectedSupplier.name);
    addInfoRow(infoStartRow + 1, "Địa chỉ:", selectedSupplier.address || "N/A");
    addInfoRow(
      infoStartRow + 2,
      "Điện thoại:",
      selectedSupplier.phone || "N/A",
    );

    

    
    const tableStartRow = 11;
    const headers = [
      "STT",
      "Sản phẩm",
      "ĐVT",
      "Số lượng",
      "Giá nhập (₫)",
      "Thành tiền (₫)",
    ];
    const headerRow = ws.getRow(tableStartRow);
    headerRow.height = 24;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = {
        name: "Times New Roman",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0058BE" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    const normalFont: Partial<ExcelJS.Font> = {
      name: "Times New Roman",
      size: 11,
    };

    cart.forEach((item, index) => {
      const rowNum = tableStartRow + 1 + index;
      const row = ws.getRow(rowNum);

      
      const sttCell = row.getCell(1);
      sttCell.value = index + 1;
      sttCell.font = normalFont;
      sttCell.alignment = { horizontal: "center", vertical: "middle" };
      sttCell.border = thinBorder;

      
      const nameCell = row.getCell(2);
      nameCell.value = item.product.name;
      nameCell.font = normalFont;
      nameCell.alignment = { vertical: "middle", wrapText: true };
      nameCell.border = thinBorder;

      
      const dvtCell = row.getCell(3);
      dvtCell.value = "Cái";
      dvtCell.font = normalFont;
      dvtCell.alignment = { horizontal: "center", vertical: "middle" };
      dvtCell.border = thinBorder;

      
      const qtyCell = row.getCell(4);
      qtyCell.value = item.quantity;
      qtyCell.font = normalFont;
      qtyCell.alignment = { horizontal: "center", vertical: "middle" };
      qtyCell.border = thinBorder;

      
      const priceCell = row.getCell(5);
      priceCell.value = item.importPrice;
      priceCell.font = normalFont;
      priceCell.numFmt = "#,##0";
      priceCell.alignment = { horizontal: "right", vertical: "middle" };
      priceCell.border = thinBorder;

      
      const totalCell = row.getCell(6);
      totalCell.value = item.importPrice * item.quantity;
      totalCell.font = normalFont;
      totalCell.numFmt = "#,##0";
      totalCell.alignment = { horizontal: "right", vertical: "middle" };
      totalCell.border = thinBorder;
    });

    
    const totalRowNum = tableStartRow + 1 + cart.length;
    const totalRow = ws.getRow(totalRowNum);
    ws.mergeCells(totalRowNum, 1, totalRowNum, 5);
    const totalLabelCell = totalRow.getCell(1);
    totalLabelCell.value = "TỔNG CỘNG";
    totalLabelCell.font = { name: "Times New Roman", size: 12, bold: true };
    totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };
    totalLabelCell.border = {
      top: { style: "thin" },
      bottom: { style: "double" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    
    for (let c = 2; c <= 5; c++) {
      totalRow.getCell(c).border = {
        top: { style: "thin" },
        bottom: { style: "double" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    }

    const totalValueCell = totalRow.getCell(6);
    totalValueCell.value = cartTotal;
    totalValueCell.font = { name: "Times New Roman", size: 12, bold: true };
    totalValueCell.numFmt = "#,##0";
    totalValueCell.alignment = { horizontal: "right", vertical: "middle" };
    totalValueCell.border = {
      top: { style: "thin" },
      bottom: { style: "double" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    
    const sigRow = totalRowNum + 3;
    ws.mergeCells(sigRow, 1, sigRow, 3);
    const sig1 = ws.getCell(sigRow, 1);
    sig1.value = "Nhà cung cấp";
    sig1.font = { name: "Times New Roman", size: 11, bold: true };
    sig1.alignment = { horizontal: "center" };

    ws.mergeCells(sigRow, 4, sigRow, 6);
    const sig2 = ws.getCell(sigRow, 4);
    sig2.value = "Người lập phiếu";
    sig2.font = { name: "Times New Roman", size: 11, bold: true };
    sig2.alignment = { horizontal: "center" };

    const sigSubRow = sigRow + 1;
    ws.mergeCells(sigSubRow, 1, sigSubRow, 3);
    const sub1 = ws.getCell(sigSubRow, 1);
    sub1.value = "(Ký, ghi rõ họ tên)";
    sub1.font = { name: "Times New Roman", size: 10, italic: true };
    sub1.alignment = { horizontal: "center" };

    ws.mergeCells(sigSubRow, 4, sigSubRow, 6);
    const sub2 = ws.getCell(sigSubRow, 4);
    sub2.value = "(Ký, ghi rõ họ tên)";
    sub2.font = { name: "Times New Roman", size: 10, italic: true };
    sub2.alignment = { horizontal: "center" };

    
    const footerRow = sigSubRow + 5;
    ws.mergeCells(footerRow, 1, footerRow, 6);
    const footer = ws.getCell(footerRow, 1);
    footer.value = "— Phiếu này được tạo tự động bởi hệ thống PCMaster —";
    footer.font = {
      name: "Times New Roman",
      size: 9,
      italic: true,
      color: { argb: "FF888888" },
    };
    footer.alignment = { horizontal: "center" };

    
    const buffer = await wb.xlsx.writeBuffer();
    return new File([buffer], `PO_${selectedSupplier.name}.xlsx`, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const handleSubmit = async () => {
    if (!selectedSupplier || cart.length === 0) return;
    if (cart.some((c) => c.importPrice <= 0)) {
      toast.error("Vui lòng nhập giá nhập cho tất cả sản phẩm.");
      return;
    }
    setLoading(true);
    try {
      const docFile = await generateExcel();
      await adminAPI.createPurchaseOrder(
        {
          supplierId: Number(selectedSupplier.id),
          items: cart.map((c) => ({
            productId: Number(c.product.id),
            quantity: c.quantity,
            importPrice: c.importPrice,
          })),
        },
        docFile || undefined,
      );
      toast.success("Tạo phiếu thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message ?? "Lỗi tạo phiếu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="font-semibold text-[18px] text-[#0f172a]">
              Tạo phiếu nhập hàng mới
            </h3>
            <p className="text-[#94a3b8] text-[13px]">
              {step === "supplier"
                ? "Bước 1: Chọn nhà phân phối"
                : `Bước 2: Chọn sản phẩm từ ${selectedSupplier?.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f8fafc] rounded-[8px] cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {step === "supplier" ? (
            <div className="grid grid-cols-1 gap-3">
              {suppliers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSupplier(s);
                    setStep("items");
                  }}
                  className="flex items-start gap-4 p-4 border border-[#e2e8f0] rounded-[12px] hover:border-[#0058be] hover:bg-blue-50/30 transition-all text-left group cursor-pointer"
                >
                  <div className="p-2 bg-[#e8f0fe] rounded-[8px] group-hover:bg-[#0058be] transition-colors">
                    <Package className="size-5 text-[#0058be] group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#0f172a] text-[15px]">
                      {s.name}
                    </p>
                    <p className="text-[#64748b] text-[13px] mt-0.5">
                      {s.phone}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(productsByBrand).map(
                ([bid, { brand, products }]) => (
                  <div
                    key={bid}
                    className="border border-[#e2e8f0] rounded-[12px] overflow-hidden"
                  >
                    <button
                      onClick={() => toggleBrand(Number(bid))}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#f8fafc] hover:bg-[#f1f5f9] cursor-pointer"
                    >
                      {expandedBrands.has(Number(bid)) ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                      <span className="font-semibold">
                        {brand?.name || `Brand #${bid}`}
                      </span>
                    </button>
                    {expandedBrands.has(Number(bid)) && (
                      <div className="divide-y divide-[#f1f5f9]">
                        {products.map((p) => {
                          const cartItem = cart.find(
                            (c) => String(c.product.id) === String(p.id),
                          );
                          return (
                            <div
                              key={p.id}
                              className="flex flex-col gap-3 px-4 py-4"
                            >
                              <div className="flex items-center gap-3">
                                {p.thumbnailUrl &&
                                  (p.thumbnailUrl.startsWith(
                                    "http://localhost",
                                  ) ? (
                                    <img
                                      src={p.thumbnailUrl}
                                      alt={p.name}
                                      className="h-10 w-10 object-contain"
                                    />
                                  ) : (
                                    <CldImage
                                      src={p.thumbnailUrl}
                                      alt={p.name}
                                      width={40}
                                      height={40}
                                      className="h-10 w-10 object-contain"
                                    />
                                  ))}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium truncate" title={p.name}>
                                    {p.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() =>
                                      updateQty(
                                        p,
                                        (cartItem?.quantity ?? 1) - 1,
                                      )
                                    }
                                    className="w-7 h-7 border rounded-full"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-medium">
                                    {cartItem?.quantity ?? 0}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQty(
                                        p,
                                        (cartItem?.quantity ?? 0) + 1,
                                      )
                                    }
                                    className="w-7 h-7 border rounded-full"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              {cartItem && (
                                <div className="flex items-center gap-4 pl-13">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase block mb-1">
                                      Giá nhập mong muốn
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        cartItem.importPrice
                                          ? formatVND(cartItem.importPrice)
                                          : ""
                                      }
                                      onChange={(e) => {
                                        const rawVal = e.target.value.replace(
                                          /\./g,
                                          "",
                                        );
                                        if (/^\d*$/.test(rawVal)) {
                                          updateImportPrice(p.id, rawVal);
                                        }
                                      }}
                                      className="w-full bg-[#f8fafc] border rounded-md px-3 py-1.5 text-[13px] font-medium"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {step === "items" && (
          <div className="border-t border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
            <p className="font-bold text-[#0058be] text-[16px]">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(cartTotal)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep("supplier");
                  setCart([]);
                }}
                className="px-4 py-2 border rounded-[8px] text-[14px]"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0}
                className="px-5 py-2 bg-[#0058be] text-white rounded-[8px] text-[14px] font-medium flex items-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />} Tạo
                phiếu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
