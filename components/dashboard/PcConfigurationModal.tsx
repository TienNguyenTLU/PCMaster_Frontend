'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, AlertCircle, ImageIcon, ShieldAlert, Cpu, Layers, Video, Database, Zap, HardDrive, Box, Wind, Disc, CheckCircle2 } from 'lucide-react';
import { adminAPI, Product, Brand, Category } from '@/lib/api';
import toast from 'react-hot-toast';
import ComponentCard from './ComponentCard';

interface ComponentIds {
  mainboard: number;
  cpu: number;
  vga: number;
  ram: number;
  psu: number;
  ssd: number;
  case: number;
  cooler: number;
  fan: number;
}

interface ComponentQuantities {
  mainboard: number;
  cpu: number;
  vga: number;
  ram: number;
  psu: number;
  ssd: number;
  case: number;
  cooler: number;
  fan: number;
}

interface PcConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: Product | null;
}

type ComponentCategory = keyof ComponentIds;

const CATEGORY_KEYS: ComponentCategory[] = [
  'cpu', 'mainboard', 'vga', 'ram', 'psu', 'ssd', 'case', 'cooler', 'fan'
];

const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  cpu: 'Bộ vi xử lý (CPU)',
  mainboard: 'Bo mạch chủ (Mainboard)',
  vga: 'Card màn hình (VGA)',
  ram: 'Bộ nhớ RAM (RAM)',
  psu: 'Nguồn máy tính (PSU)',
  ssd: 'Ổ cứng SSD (SSD/Storage)',
  case: 'Vỏ máy tính (Case)',
  cooler: 'Tản nhiệt (Cooler)',
  fan: 'Quạt tản nhiệt (Fan)',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CATEGORY_ICONS: Record<ComponentCategory, React.ComponentType<any>> = {
  cpu: Cpu,
  mainboard: Layers,
  vga: Video,
  ram: Database,
  psu: Zap,
  ssd: HardDrive,
  case: Box,
  cooler: Wind,
  fan: Disc,
};

export default function PcConfigurationModal({ isOpen, onClose, onSuccess, editingProduct }: PcConfigurationModalProps) {
  const isEditing = !!editingProduct;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productList, setProductList] = useState<Product[]>([]); // List of all component products

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [description, setDescription] = useState('');
  const [usageNeeds, setUsageNeeds] = useState<string[]>([]);

  // 9 Fixed Component Fields
  const [compIds, setCompIds] = useState<ComponentIds>({
    mainboard: 0,
    cpu: 0,
    vga: 0,
    ram: 0,
    psu: 0,
    ssd: 0,
    case: 0,
    cooler: 0,
    fan: 0
  });

  const [compQtys, setCompQtys] = useState<ComponentQuantities>({
    mainboard: 1,
    cpu: 1,
    vga: 1,
    ram: 1,
    psu: 1,
    ssd: 1,
    case: 1,
    cooler: 1,
    fan: 1
  });

  // Thumbnail file
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to safely parse specsJson
  const getProductSpecs = (p?: Product) => {
    if (!p || !p.specsJson) return {};
    try {
      return JSON.parse(p.specsJson);
    } catch {
      return {};
    }
  };

  // Classify products into categories
  const getComponentCategory = (p: Product): ComponentCategory | 'other' => {
    const slug = (p.category?.slug || '').toLowerCase().replace(/[-_]/g, '');
    const name = (p.category?.name || '').toLowerCase();
    
    if (slug.includes('cpu') || slug.includes('processor') || name.includes('cpu') || name.includes('vi xu ly')) return 'cpu';
    if (slug.includes('mainboard') || slug.includes('motherboard') || slug.includes('bo-mach') || name.includes('main') || name.includes('bo mach')) return 'mainboard';
    if (slug.includes('vga') || slug.includes('graphic') || slug.includes('card') || name.includes('vga') || name.includes('card do hoa') || name.includes('card man hinh')) return 'vga';
    if (slug.includes('ram') || slug.includes('memory') || name.includes('ram') || name.includes('bo nho')) return 'ram';
    if (slug.includes('psu') || slug.includes('power') || slug.includes('nguon') || name.includes('nguon') || name.includes('psu')) return 'psu';
    if (slug.includes('ssd') || slug.includes('storage') || slug.includes('hdd') || slug.includes('ocung') || name.includes('ssd') || name.includes('o cung') || name.includes('storage')) return 'ssd';
    if (slug.includes('case') || slug.includes('vomay') || name.includes('case') || name.includes('vo may')) return 'case';
    if (slug.includes('cooler') || slug.includes('tannhiet') || name.includes('tan nhiet') || name.includes('cool')) return 'cooler';
    if (slug.includes('fan') || slug.includes('quat') || name.includes('fan') || name.includes('quat')) return 'fan';
    
    return 'other';
  };

  // Fetch initial brand/category references
  useEffect(() => {
    adminAPI.getBrands(0, 200).then(r => setBrands(r.content || []));
    adminAPI.getCategories(0, 200).then(r => setCategories(r.content || []));
    
    adminAPI.getProducts(0, 1000).then(r => {
      // Filter out products that are PC Systems or Monitors
      const componentProducts = (r.content || []).filter(p => {
        const catSlug = p.category?.slug || '';
        return catSlug !== 'pc-system' && catSlug !== 'monitor' && catSlug !== 'man-hinh' && String(p.id) !== String(editingProduct?.id);
      });
      setProductList(componentProducts);
    });
  }, [editingProduct, isOpen]);

  // Map product details when editing
  useEffect(() => {
    if (!isOpen) return;
    
    if (editingProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editingProduct.name);
      setBrandId(String(editingProduct.brandId || editingProduct.brand?.id || ''));
      setPrice(String(editingProduct.price));
      setStock(String(editingProduct.stock));
      setDescription(editingProduct.description || '');
      setThumbnailPreview(editingProduct.thumbnailUrl || '');
      
      const specs = getProductSpecs(editingProduct);
      const editingUsageNeeds: string[] = specs.usage_need ? (Array.isArray(specs.usage_need) ? specs.usage_need : String(specs.usage_need).split(',').map((s: string) => s.trim())) : [];
      setUsageNeeds(editingUsageNeeds);
      
      // Map components to the 9 fixed fields
      const newCompIds: ComponentIds = { mainboard: 0, cpu: 0, vga: 0, ram: 0, psu: 0, ssd: 0, case: 0, cooler: 0, fan: 0 };
      const newCompQtys: ComponentQuantities = { mainboard: 1, cpu: 1, vga: 1, ram: 1, psu: 1, ssd: 1, case: 1, cooler: 1, fan: 1 };
      
      if (editingProduct.pcComponents && productList.length > 0) {
        const prodMap = productList.reduce((acc, p) => {
          acc[Number(p.id)] = p;
          return acc;
        }, {} as Record<number, Product>);
 
        editingProduct.pcComponents.forEach(c => {
          const prod = prodMap[Number(c.componentProductId)];
          if (prod) {
            const cat = getComponentCategory(prod);
            if (cat !== 'other') {
              newCompIds[cat] = Number(c.componentProductId);
              newCompQtys[cat] = c.quantity;
            }
          }
        });
      }
      setCompIds(newCompIds);
      setCompQtys(newCompQtys);
    } else {
      setName('');
      setBrandId('');
      setPrice('0');
      setStock('0');
      setDescription('');
      setThumbnailPreview('');
      setThumbnailFile(null);
      setUsageNeeds([]);
      setCompIds({ mainboard: 0, cpu: 0, vga: 0, ram: 0, psu: 0, ssd: 0, case: 0, cooler: 0, fan: 0 });
      setCompQtys({ mainboard: 1, cpu: 1, vga: 1, ram: 1, psu: 1, ssd: 1, case: 1, cooler: 1, fan: 1 });
    }
    setSubmitError('');
    setErrors({});
  }, [editingProduct, isOpen, productList]);

  // Get pc-system category ID
  const pcSystemCategoryId = categories.find(c => c.slug === 'pc-system')?.id || '';

  // Create products map for quick lookup
  const productsMap = productList.reduce((acc, p) => {
    acc[Number(p.id)] = p;
    return acc;
  }, {} as Record<number, Product>);

  // Compute compatibility specs
  const selectedCpu = productsMap[compIds.cpu];
  const selectedMainboard = productsMap[compIds.mainboard];
  const selectedRam = productsMap[compIds.ram];
  const selectedVga = productsMap[compIds.vga];
  const selectedCase = productsMap[compIds.case];
  const selectedSsd = productsMap[compIds.ssd];
  const selectedCooler = productsMap[compIds.cooler];

  const cpuSpecs = getProductSpecs(selectedCpu);
  const mainboardSpecs = getProductSpecs(selectedMainboard);
  const ramSpecs = getProductSpecs(selectedRam);
  const vgaSpecs = getProductSpecs(selectedVga);
  // caseSpecs, ssdSpecs, coolerSpecs are checked dynamically in other places

  const cpuSocket = cpuSpecs.socket; // e.g. AM5, LGA1700
  const mainboardSocket = mainboardSpecs.socket; // e.g. AM5, LGA1700
  const mainboardRamType = mainboardSpecs.ram_type; // e.g. DDR5, DDR4
  const ramType = ramSpecs.type; // e.g. DDR5, DDR4
  const mainboardFormFactor = mainboardSpecs.form_factor; // e.g. ATX, M-ATX

  // TDP calculations for power supply filtering
  const totalTdp = (Number(cpuSpecs.tdp_w) || 0) + (Number(vgaSpecs.tdp_w) || 0);

  // Safe Case Mainboard check
  const isCaseCompatible = (caseProd: Product, mbFormFactor: string) => {
    const specs = getProductSpecs(caseProd);
    const supported = specs.supported_mainboards;
    if (!supported) return true;
    if (Array.isArray(supported)) {
      return supported.map(s => String(s).toLowerCase()).includes(mbFormFactor.toLowerCase());
    }
    return String(supported).toLowerCase().includes(mbFormFactor.toLowerCase());
  };

  const isSsdCompatible = (ssdProd: Product, mbProd: Product) => {
    const ssdSpecs = getProductSpecs(ssdProd);
    const mbSpecs = getProductSpecs(mbProd);
    const ssdInt = String(ssdSpecs.interface || '').toLowerCase();
    const ssdType = String(ssdSpecs.type || '').toLowerCase();
    
    if (ssdInt.includes('nvme') || ssdInt.includes('m.2') || ssdInt.includes('pcie') || ssdType.includes('m2')) {
      const m2Slots = Number(mbSpecs.m2_slots) || 0;
      return m2Slots > 0;
    }
    return true;
  };

  const isCoolerCompatible = (coolerProd: Product, socket: string) => {
    const specs = getProductSpecs(coolerProd);
    const supported = specs.supported_sockets;
    if (!supported) return true;
    if (Array.isArray(supported)) {
      return supported.map(s => String(s).toLowerCase()).includes(socket.toLowerCase());
    }
    const supportedStr = String(supported).toLowerCase();
    return supportedStr.includes(socket.toLowerCase()) || socket.toLowerCase().includes(supportedStr);
  };

  // Group and FILTER products by category for compatibility checks, only displaying in-stock items
  const getFilteredOptions = (cat: ComponentCategory): Product[] => {
    const rawList = productList.filter(p => 
      getComponentCategory(p) === cat && 
      (p.stock > 0 || String(p.id) === String(compIds[cat]))
    );

    // Apply smart filters (Two-Way)
    if (cat === 'mainboard') {
      let filtered = rawList;
      if (cpuSocket) {
        filtered = filtered.filter(p => getProductSpecs(p).socket === cpuSocket);
      }
      if (ramType) {
        filtered = filtered.filter(p => getProductSpecs(p).ram_type === ramType);
      }
      if (selectedCase) {
        filtered = filtered.filter(p => {
          const mbForm = getProductSpecs(p).form_factor;
          return mbForm ? isCaseCompatible(selectedCase, mbForm) : true;
        });
      }
      if (selectedSsd) {
        filtered = filtered.filter(p => isSsdCompatible(selectedSsd, p));
      }
      if (selectedCooler) {
        filtered = filtered.filter(p => {
          const socket = getProductSpecs(p).socket;
          return socket ? isCoolerCompatible(selectedCooler, socket) : true;
        });
      }
      return filtered;
    }

    if (cat === 'cpu') {
      let filtered = rawList;
      if (mainboardSocket) {
        filtered = filtered.filter(p => getProductSpecs(p).socket === mainboardSocket);
      }
      if (selectedCooler) {
        filtered = filtered.filter(p => {
          const socket = getProductSpecs(p).socket;
          return socket ? isCoolerCompatible(selectedCooler, socket) : true;
        });
      }
      return filtered;
    }

    if (cat === 'ram') {
      if (mainboardRamType) {
        return rawList.filter(p => getProductSpecs(p).type === mainboardRamType);
      }
    }

    if (cat === 'case') {
      if (mainboardFormFactor) {
        return rawList.filter(p => isCaseCompatible(p, mainboardFormFactor));
      }
    }

    if (cat === 'ssd') {
      if (selectedMainboard) {
        return rawList.filter(p => isSsdCompatible(p, selectedMainboard));
      }
    }

    if (cat === 'cooler') {
      if (cpuSocket) {
        return rawList.filter(p => isCoolerCompatible(p, cpuSocket));
      } else if (mainboardSocket) {
        return rawList.filter(p => isCoolerCompatible(p, mainboardSocket));
      }
    }

    if (cat === 'psu') {
      if (totalTdp > 0) {
        return rawList.filter(p => {
          const wattage = Number(getProductSpecs(p).wattage) || 0;
          return wattage >= totalTdp;
        });
      }
    }

    return rawList;
  };

  // Active items selected
  const activeSelections = Object.entries(compIds)
    .filter(([, id]) => id > 0)
    .map(([category, id]) => ({
      category: category as ComponentCategory,
      id,
      quantity: compQtys[category as ComponentCategory]
    }));

  // Compute maximum buildable PCs based on selected components stock
  const componentBuildLimits = activeSelections.map(item => {
    const prod = productsMap[item.id];
    if (!prod) return { id: item.id, name: 'Chưa chọn', limit: 999999, stock: 0 };
    const limit = item.quantity > 0 ? Math.floor(prod.stock / item.quantity) : 999999;
    return { id: item.id, name: prod.name, limit, stock: prod.stock };
  });

  const maxBuildableQuantity = activeSelections.length > 0
    ? Math.min(...componentBuildLimits.map(c => c.limit))
    : 0;

  const bottleneck = componentBuildLimits.find(c => c.limit === maxBuildableQuantity);

  // Cost calculation
  const costPerPc = activeSelections.reduce((sum, item) => {
    const prod = productsMap[item.id];
    return sum + (prod ? prod.price * item.quantity : 0);
  }, 0);

  const handleComponentChange = (cat: ComponentCategory, productId: number) => {
    setCompIds(prev => ({ ...prev, [cat]: productId }));
  };

  const handleQuantityChange = (cat: ComponentCategory, qty: number) => {
    setCompQtys(prev => ({ ...prev, [cat]: Math.max(1, qty) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Tên sản phẩm PC không được để trống';
    }
    if (!brandId) {
      newErrors.brandId = 'Vui lòng chọn thương hiệu lắp ráp';
    }
    
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      newErrors.price = 'Giá bán lẻ phải lớn hơn 0';
    }

    const pcStock = Number(stock);
    if (isNaN(pcStock) || pcStock < 0) {
      newErrors.stock = 'Số lượng lắp ráp phải lớn hơn hoặc bằng 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError('Vui lòng kiểm tra lại thông tin bị thiếu hoặc sai.');
      return;
    }

    if (!pcSystemCategoryId) {
      setSubmitError('Không tìm thấy danh mục PC_SYSTEM trong hệ thống. Vui lòng liên hệ nhà phát triển.');
      return;
    }

    // Filter valid components
    const validComponents = Object.entries(compIds)
      .filter(([, id]) => id > 0)
      .map(([category, id]) => ({
        componentProductId: id,
        quantity: compQtys[category as ComponentCategory]
      }));

    if (validComponents.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất 1 linh kiện để cấu hình PC.');
      return;
    }

    if (!isEditing && pcStock > maxBuildableQuantity) {
      setSubmitError(`Số lượng lắp ráp vượt quá giới hạn linh kiện trong kho (Tối đa ${maxBuildableQuantity} sản phẩm).`);
      return;
    }

    setLoading(true);

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese tones
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-')
      .trim();

    // Custom specification for PC System
    const specsObj: Record<string, unknown> = {
      brand: brands.find(b => String(b.id) === brandId)?.name || '',
      component_type: 'PC_SYSTEM',
      cpu: productsMap[compIds.cpu]?.name || 'N/A',
      vga: productsMap[compIds.vga]?.name || 'N/A',
      ram: productsMap[compIds.ram]?.name || 'N/A',
      usage_need: usageNeeds,
    };

    const dataPayload = {
      name,
      slug,
      categoryId: Number(pcSystemCategoryId),
      brandId: Number(brandId),
      price: Number(price),
      stock: pcStock,
      description,
      thumbnailUrl: isEditing ? editingProduct?.thumbnailUrl : undefined,
      specsJson: JSON.stringify(specsObj),
      pcComponents: validComponents
    };

    try {
      if (isEditing && editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, dataPayload);
        toast.success('Cập nhật cấu hình PC thành công!');
        onSuccess();
        onClose();
      } else {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(dataPayload)], { type: 'application/json' }));
        if (thumbnailFile) {
          formData.append('thumbnail', thumbnailFile);
        }
        await adminAPI.createProduct(formData);
        toast.success('Lắp ráp & Tạo sản phẩm PC thành công!');
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Có lỗi xảy ra khi tạo cấu hình PC.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-[16px] z-10">
          <div>
            <h3 className="text-[#0f172a] text-[18px] font-semibold flex items-center gap-2">
              <Cpu className="size-5 text-[#0058be]" />
              {isEditing ? 'Cập nhật cấu hình PC lắp sẵn' : 'Lắp ráp sản phẩm PC mới'}
            </h3>
            <p className="text-[#94a3b8] text-[13px] mt-0.5">
              Chọn các linh kiện tồn kho tương thích để cấu hình và lắp ráp.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[#94a3b8] hover:text-[#475569] hover:bg-[#f8fafc] rounded-[8px] transition-colors cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {submitError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-[8px] px-4 py-3 text-[14px]">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-[12px] border border-slate-100">
            <div className="flex flex-col gap-4">
              {/* Product Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#374151]">Tên sản phẩm PC <span className="text-red-500">*</span></label>
                {errors.name && (
                  <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    ⚠️ {errors.name}
                  </span>
                )}
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="VD: PC Gaming Master Extreme v1"
                  className={`bg-white border rounded-[8px] px-3 py-2 text-[14px] focus:outline-none transition-all shadow-sm ${
                    errors.name ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                  }`}
                />
              </div>

              {/* Brand Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#374151]">Thương hiệu lắp ráp <span className="text-red-500">*</span></label>
                {errors.brandId && (
                  <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    ⚠️ {errors.brandId}
                  </span>
                )}
                <select
                  required
                  value={brandId}
                  onChange={e => {
                    setBrandId(e.target.value);
                    setErrors(prev => ({ ...prev, brandId: '' }));
                  }}
                  className={`bg-white border rounded-[8px] px-3 py-2 text-[14px] focus:outline-none transition-all shadow-sm ${
                    errors.brandId ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                  }`}
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* Pricing & Custom PC Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#374151]">Giá bán lẻ (VNĐ) <span className="text-red-500">*</span></label>
                  {errors.price && (
                    <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      ⚠️ {errors.price}
                    </span>
                  )}
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={e => {
                      setPrice(e.target.value);
                      setErrors(prev => ({ ...prev, price: '' }));
                    }}
                    className={`bg-white border rounded-[8px] px-3 py-2 text-[14px] focus:outline-none transition-all shadow-sm ${
                      errors.price ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                    }`}
                  />
                  <span className="text-[11px] text-[#64748b] bg-slate-100/80 px-2 py-0.5 rounded-[4px] self-start mt-1">
                    Vốn linh kiện: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(costPerPc)}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#374151]">Số lượng lắp ráp <span className="text-red-500">*</span></label>
                  {errors.stock && (
                    <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      ⚠️ {errors.stock}
                    </span>
                  )}
                  <input
                    type="number"
                    min={0}
                    required
                    disabled={isEditing}
                    value={stock}
                    onChange={e => {
                      setStock(e.target.value);
                      setErrors(prev => ({ ...prev, stock: '' }));
                    }}
                    className={`border rounded-[8px] px-3 py-2 text-[14px] focus:outline-none transition-all shadow-sm ${
                      isEditing ? 'bg-[#f1f5f9] text-[#64748b] cursor-not-allowed border-[#e2e8f0]' : 
                      errors.stock ? 'bg-white border-red-500 focus:border-red-500' : 'bg-white border-[#e2e8f0] focus:border-[#0058be]'
                    }`}
                  />
                  {!isEditing && (
                    <span className="text-[11px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-[4px] self-start mt-1">
                      Tối đa lắp: {maxBuildableQuantity} bộ
                    </span>
                  )}
                  {totalTdp > 0 && (
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-[4px] self-start mt-1 flex items-center gap-1 shadow-sm">
                      ⚡ Công suất ước tính: {totalTdp}W
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail Image Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#374151]">Ảnh sản phẩm</label>
              <div
                className="flex-1 min-h-[160px] border-2 border-dashed border-[#e2e8f0] rounded-[12px] p-4 flex flex-col items-center justify-center gap-3 hover:border-[#0058be] transition-colors cursor-pointer bg-white shadow-sm group"
                onClick={() => fileInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <div className="flex flex-col items-center gap-2 w-full h-full justify-center relative">
                    <img src={thumbnailPreview} alt="preview" className="h-28 object-contain rounded-[8px] border border-[#e2e8f0] bg-white p-1" />
                    <p className="text-[11px] text-[#94a3b8] truncate max-w-[200px]">{thumbnailFile?.name || 'Ảnh đã chọn'}</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-[#e8f0fe] rounded-full group-hover:bg-[#d0e1fd] transition-colors">
                      <ImageIcon className="size-6 text-[#0058be]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-[#374151]">Tải ảnh bộ PC lên</p>
                      <p className="text-[11px] text-[#94a3b8]">Hỗ trợ PNG, JPG, WEBP</p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Usage needs click selector */}
          <div className="flex flex-col gap-2 bg-slate-50/50 p-4 rounded-[12px] border border-slate-100">
            <label className="text-[13px] font-semibold text-[#374151]">Nhu cầu sử dụng (Chọn nhiều nhu cầu phù hợp)</label>
            <div className="flex flex-wrap gap-2.5 mt-1">
              {['Gaming', 'Đồ họa', 'Văn phòng', 'Lập trình'].map(need => {
                const isSelected = usageNeeds.includes(need);
                return (
                  <button
                    key={need}
                    type="button"
                    onClick={() => {
                      setUsageNeeds(prev =>
                        prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
                      );
                    }}
                    className={`px-4 py-2 rounded-[8px] border text-[12.5px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0058be] border-[#0058be] text-white shadow-sm'
                        : 'bg-white border-[#cbd5e1] text-[#475569] hover:border-[#0058be] hover:text-[#0058be]'
                    }`}
                  >
                    {need}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#374151]">Mô tả bộ PC</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập mô tả bộ PC (ví dụ: Cấu hình chiến game mượt, phù hợp làm đồ họa...)"
              rows={2}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-[14px] focus:outline-none focus:border-[#0058be] transition-all resize-none shadow-inner"
            />
          </div>

          {/* Components Selection Area */}
          <div className="flex flex-col gap-4 border-t border-[#e2e8f0] pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-[#0058be] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-green-600" />
                Linh kiện cấu thành & Kiểm tra độ tương thích
              </h4>
            </div>

            {/* Warning Limits banner */}
            {!isEditing && maxBuildableQuantity < 999999 && bottleneck && bottleneck.id > 0 && (
              <div className="flex items-center gap-2 bg-[#fff7ed] border border-[#ffedd5] text-[#c2410c] px-4 py-2.5 rounded-[8px] text-[13px] shadow-sm animate-pulse">
                <ShieldAlert className="size-4 shrink-0" />
                <span>
                  Số lượng lắp ráp tối đa bị giới hạn bởi: <strong>{bottleneck.name}</strong> (Còn <strong>{bottleneck.stock}</strong> cái trong kho, mỗi bộ cần 1)
                </span>
              </div>
            )}

            {/* Fixed 9 Grid Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORY_KEYS.map(cat => {
                const Icon = CATEGORY_ICONS[cat];
                const label = CATEGORY_LABELS[cat];
                const selectedId = compIds[cat];
                const selectedProd = productsMap[selectedId];
                const options = getFilteredOptions(cat);
                const isFiltered = (cat === 'mainboard' && (cpuSocket || ramType)) ||
                                   (cat === 'cpu' && mainboardSocket) ||
                                   (cat === 'ram' && mainboardRamType) ||
                                   (cat === 'case' && mainboardFormFactor);

                let compatTag = '';
                if (isFiltered) {
                  if (cat === 'mainboard') {
                    if (cpuSocket && ramType) compatTag = `Đã lọc: Socket ${cpuSocket} & ${ramType}`;
                    else if (cpuSocket) compatTag = `Đã lọc: Socket ${cpuSocket}`;
                    else if (ramType) compatTag = `Đã lọc: RAM ${ramType}`;
                  } else if (cat === 'cpu' && mainboardSocket) {
                    compatTag = `Đã lọc: Socket ${mainboardSocket}`;
                  } else if (cat === 'ram' && mainboardRamType) {
                    compatTag = `Đã lọc: RAM ${mainboardRamType}`;
                  } else if (cat === 'case' && mainboardFormFactor) {
                    compatTag = `Đã lọc: Kích cỡ ${mainboardFormFactor}`;
                  }
                }

                return (
                  <ComponentCard
                    key={cat}
                    label={label}
                    icon={Icon}
                    selectedId={selectedId}
                    selectedProd={selectedProd}
                    options={options}
                    qty={compQtys[cat]}
                    compatTag={compatTag}
                    onComponentChange={productId => handleComponentChange(cat, productId)}
                    onQuantityChange={qty => handleQuantityChange(cat, qty)}
                  />
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-medium text-[#475569] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-[14px] font-medium text-white bg-[#0058be] rounded-[8px] hover:bg-[#0047a3] transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isEditing ? 'Lưu cấu hình' : 'Bắt đầu lắp ráp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
