import { BuildState, SLOTS } from "@/hooks/usePcBuildState";
import { formatPrice } from "@/utils/format";

// Function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Function to fetch and convert font to Base64
async function loadFontAsBase64(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load font from path: ${path}`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

interface ExportPdfParams {
  buildName?: string;
  build: BuildState;
  totalPrice: number;
  aiPsuWattage: number | null;
  aiPsuExplanation: string | null;
  aiBuildNote: string | null;
  bottleneckResult?: any;
}

export async function exportBuildToPdf({
  buildName,
  build,
  totalPrice,
  aiPsuWattage,
  aiPsuExplanation,
  aiBuildNote,
  bottleneckResult
}: ExportPdfParams) {
  // 1. Dynamic import of jsPDF and jsPDF-autotable to prevent SSR issues
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  // 2. Initialize jsPDF instance
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // 3. Load Vietnamese fonts
  try {
    const regularFontBase64 = await loadFontAsBase64("/fonts/Roboto-Regular.ttf");
    const boldFontBase64 = await loadFontAsBase64("/fonts/Roboto-Bold.ttf");

    // Add font files to jsPDF Virtual File System (VFS)
    doc.addFileToVFS("Roboto-Regular.ttf", regularFontBase64);
    doc.addFileToVFS("Roboto-Bold.ttf", boldFontBase64);

    // Register font family and styles
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    doc.setFont("Roboto", "normal");
  } catch (error) {
    console.error(
      "Failed to load custom fonts, falling back to default Helvetica. Vietnamese text might be garbled.",
      error
    );
  }

  // Define layout variables
  let currentY = 15;
  const pageWidth = doc.internal.pageSize.getWidth(); // A4: 210mm
  const marginX = 15;

  // Header Background Accent Bar
  doc.setFillColor(0, 88, 190); // Brand primary color (#0058be)
  doc.rect(0, 0, pageWidth, 5, "F");

  // PCMaster Header Title
  doc.setFont("Roboto", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 88, 190);
  doc.text("CỬA HÀNG PC MASTER", marginX, currentY);
  currentY += 6;

  // Subtitle / Contact Info
  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(
    "Showroom: 123 Đường Láng, Đống Đa, Hà Nội  |  Hotline: 1800 1234  |  Website: pcmaster.vn",
    marginX,
    currentY
  );
  currentY += 8;

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  // Main Title: BẢNG BÁO GIÁ CẤU HÌNH PC
  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("BẢNG BÁO GIÁ CẤU HÌNH PC", pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // Info Block (Build Name & Date)
  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate-600

  const nameText = buildName ? `Cấu hình: ${buildName}` : "Cấu hình tự thiết kế";
  doc.text(nameText, marginX, currentY);

  const nowText = `Ngày xuất: ${new Date().toLocaleString("vi-VN")}`;
  doc.text(nowText, pageWidth - marginX, currentY, { align: "right" });
  currentY += 8;

  // 4. Construct Table Data
  const items = [];
  let index = 1;

  for (const slotKey in build) {
    const product = build[slotKey];
    if (product) {
      // Find slot definition to get label
      const slotDef = SLOTS.find((s) => s.key === slotKey);
      let label = slotDef ? slotDef.label : "Lưu trữ mở rộng";
      if (slotKey.startsWith("storage_")) {
        label = "Ổ lưu trữ mở rộng";
      }

      items.push({
        stt: index++,
        category: label,
        name: product.name,
        qty: 1,
        price: formatPrice(product.price),
        total: formatPrice(product.price)
      });
    }
  }

  // 5. Draw Table
  autoTable(doc, {
    startY: currentY,
    theme: "striped",
    styles: {
      font: "Roboto",
      fontSize: 9,
      cellPadding: 3,
      valign: "middle"
    },
    headStyles: {
      fillColor: [0, 88, 190],
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, // STT
      1: { cellWidth: 40 }, // Linh kiện
      2: { cellWidth: 70 }, // Tên linh kiện
      3: { cellWidth: 12, halign: "center" }, // Số lượng
      4: { cellWidth: 24, halign: "right" }, // Đơn giá
      5: { cellWidth: 24, halign: "right" }  // Thành tiền
    },
    head: [["STT", "Linh kiện", "Tên sản phẩm", "SL", "Đơn giá", "Thành tiền"]],
    body: items.map((item) => [
      item.stt,
      item.category,
      item.name,
      item.qty,
      item.price,
      item.total
    ]),
    didDrawPage: (data) => {
      // Draw footer on every page
      const totalPages = doc.getNumberOfPages();
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(
        `Trang ${data.pageNumber} / ${totalPages}  |  PCMaster Builder - Kiến tạo bộ máy tối tân`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
  });

  // Get position where the table ends
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 8;

  // Check if we need a new page for Summary & Recommendations
  const pageHeight = doc.internal.pageSize.getHeight();
  if (finalY > pageHeight - 50) {
    doc.addPage();
    finalY = 15;
  }

  // Total Summary Panel in PDF
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(marginX, finalY, pageWidth - 2 * marginX, 18, 3, 3, "FD");

  // Sum Label
  doc.setFont("Roboto", "bold");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text("TỔNG GIÁ TRỊ CẤU HÌNH:", marginX + 5, finalY + 11);

  // Sum Value
  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 88, 190); // Deep Blue
  doc.text(formatPrice(totalPrice), pageWidth - marginX - 5, finalY + 12, {
    align: "right"
  });

  finalY += 26;

  // Add recommendations and AI feedback if available
  if (aiPsuWattage || aiBuildNote || bottleneckResult) {
    if (finalY > pageHeight - 60) {
      doc.addPage();
      finalY = 15;
    }

    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text("💡 PHÂN TÍCH & KHUYẾN NGHỊ HỆ THỐNG", marginX, finalY);
    finalY += 6;

    // PSU Recommendation
    if (aiPsuWattage) {
      doc.setFillColor(254, 251, 236); // Amber-50
      doc.setDrawColor(254, 243, 199); // Amber-200
      doc.roundedRect(marginX, finalY, pageWidth - 2 * marginX, 16, 2, 2, "FD");

      doc.setFont("Roboto", "bold");
      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text(`⚡ NGUỒN KHUYÊN DÙNG (AI): ${aiPsuWattage}W`, marginX + 4, finalY + 6);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // Slate-600
      if (aiPsuExplanation) {
        const splitExplanation = doc.splitTextToSize(
          aiPsuExplanation,
          pageWidth - 2 * marginX - 8
        );
        doc.text(splitExplanation, marginX + 4, finalY + 11);
      }
      finalY += 22;
    }

    // Bottleneck Analysis
    if (bottleneckResult && bottleneckResult.hasBottleneck !== undefined) {
      if (finalY > pageHeight - 35) {
        doc.addPage();
        finalY = 15;
      }

      const isBottleneck = bottleneckResult.hasBottleneck;
      if (isBottleneck) {
        doc.setFillColor(254, 242, 242); // Red-50
        doc.setDrawColor(254, 202, 202); // Red-200
        doc.setTextColor(185, 28, 28);   // Red-700
      } else {
        doc.setFillColor(240, 253, 244); // Green-50
        doc.setDrawColor(187, 247, 208); // Green-200
        doc.setTextColor(21, 128, 61);   // Green-700
      }
      doc.roundedRect(marginX, finalY, pageWidth - 2 * marginX, 14, 2, 2, "FD");

      doc.setFont("Roboto", "bold");
      doc.setFontSize(9);
      doc.text(
        isBottleneck
          ? `⚠️ PHÂN TÍCH NGHẼN CỔ CHAI: Có phát hiện nghẽn cổ chai (${bottleneckResult.bottleneckPercentage}%)`
          : "✅ PHÂN TÍCH NGHẼN CỔ CHAI: Cấu hình cân bằng tối ưu! Không phát hiện nghẽn.",
        marginX + 4,
        finalY + 6
      );

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // Slate-600
      if (bottleneckResult.description) {
        const splitDesc = doc.splitTextToSize(
          bottleneckResult.description,
          pageWidth - 2 * marginX - 8
        );
        doc.text(splitDesc, marginX + 4, finalY + 10);
      }
      finalY += 20;
    }

    // AI Review
    if (aiBuildNote) {
      if (finalY > pageHeight - 45) {
        doc.addPage();
        finalY = 15;
      }

      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.setTextColor(109, 40, 217); // Violet-700
      doc.text("✨ Nhận xét chuyên gia từ Trợ lý AI:", marginX, finalY);
      finalY += 5;

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // Slate-700

      const cleanAiNote = aiBuildNote.replace(/\*\*|__/g, "");
      const splitNote = doc.splitTextToSize(cleanAiNote, pageWidth - 2 * marginX);
      doc.text(splitNote, marginX, finalY);

      finalY += splitNote.length * 4 + 8;
    }
  }

  // Footer note
  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = 15;
  }

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(
    "— Bản báo giá có hiệu lực trong vòng 7 ngày kể từ ngày xuất phiếu —",
    pageWidth / 2,
    finalY + 10,
    { align: "center" }
  );

  // 6. Download the generated file
  const formattedDate = new Date().toISOString().slice(0, 10);
  const fileName = `PCMaster_Build_${formattedDate}.pdf`;
  doc.save(fileName);
}
