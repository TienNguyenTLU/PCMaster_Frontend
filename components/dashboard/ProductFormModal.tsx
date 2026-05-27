'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, AlertCircle, Upload, ImageIcon, Check, Trash2 } from 'lucide-react';
import { adminAPI, Product, Brand, Category, ProductImage } from '@/lib/api';
import toast from 'react-hot-toast';
import { CldImage } from 'next-cloudinary';
import axiosInstance from '@/lib/axiosInstance';

// ─── Spec field definitions per category slug/name ─────────────────────────
type SpecFieldType = 'text' | 'number' | 'multiselect' | 'select' | 'boolean';
interface SpecField {
  key: string;
  label: string;
  type: SpecFieldType;
  options?: string[]; // for multiselect and select
  placeholder?: string;
}

const SPECS_BY_CATEGORY: Record<string, SpecField[]> = {
  case: [
    { key: 'size', label: 'Kích thước', type: 'select', options: ['Mini-ITX Desktop', 'Mini Tower', 'Mid Tower', 'Full Tower', 'Super Tower', 'HTPC / Desktop', 'Open Frame'] },
    { key: 'max_gpu_length_mm', label: 'Độ dài GPU tối đa (mm)', type: 'number', placeholder: '365' },
    { key: 'supported_mainboards', label: 'Bo mạch hỗ trợ', type: 'multiselect', options: ['Mini-ITX', 'Micro-ATX', 'ATX', 'E-ATX', 'SSI CEB', 'SSI EEB', 'XL-ATX'] },
    { key: 'max_cpu_cooler_height_mm', label: 'Chiều cao CPU Cooler tối đa (mm)', type: 'number', placeholder: '164' },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Bộ ốc vít, dây rút, khay đệm...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'Kính cường lực lực hút nam châm, lọc bụi từ tính...' },
  ],
  cooler: [
    { key: 'type', label: 'Loại tản nhiệt', type: 'select', options: ['Liquid Cooling', 'Air Cooling'] },
    { key: 'has_rgb', label: 'Có RGB', type: 'boolean' },
    { key: 'fan_size_mm', label: 'Kích thước quạt (mm)', type: 'select', options: ['80', '92', '120', '140', '200'] },
    { key: 'tdp_rating_w', label: 'TDP hỗ trợ (W)', type: 'number', placeholder: '300' },
    { key: 'noise_level_db', label: 'Độ ồn (dB)', type: 'number', placeholder: '30' },
    { key: 'radiator_size_mm', label: 'Radiator (mm)', type: 'select', options: ['120', '140', '240', '280', '360', '420'] },
    { key: 'supported_sockets', label: 'Socket hỗ trợ', type: 'multiselect', options: [
      'AM5', 'AM4', 'AM3+', 'AM3', 'AM2+', 'AM2', 'FM2+', 'FM2', 'FM1', 'sTRX4', 'sTR4', 'sWRX8', 'SP3',
      'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156', 'LGA2066', 'LGA2011', 'LGA1366', 'LGA775'
    ] },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Keo tản nhiệt, gông socket, cáp chia...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'Pump thế hệ mới, ống dẫn chống rò rỉ...' },
  ],
  cpu: [
    { key: 'cores', label: 'Số nhân', type: 'select', options: ['2', '4', '6', '8', '10', '12', '14', '16', '20', '24', '32', '64'] },
    { key: 'tdp_w', label: 'TDP (W)', type: 'number', placeholder: '65' },
    { key: 'series', label: 'Series', type: 'text', placeholder: 'Ryzen 5' },
    { key: 'socket', label: 'Socket', type: 'select', options: [
      'AM5', 'AM4', 'AM3+', 'AM3', 'AM2+', 'AM2', 'FM2+', 'FM2', 'FM1', 'sTRX4', 'sTR4', 'sWRX8', 'SP3',
      'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156', 'LGA2066', 'LGA2011', 'LGA1366', 'LGA775'
    ] },
    { key: 'threads', label: 'Số luồng', type: 'select', options: ['2', '4', '8', '12', '16', '20', '24', '28', '32', '48', '64', '128'] },
    { key: 'cache_mb', label: 'Bộ nhớ đệm (MB)', type: 'number', placeholder: '16' },
    { key: 'base_clock_ghz', label: 'Xung cơ bản (GHz)', type: 'number', placeholder: '3.5' },
    { key: 'integrated_gpu', label: 'GPU tích hợp', type: 'boolean' },
    { key: 'boost_clock_ghz', label: 'Xung tối đa (GHz)', type: 'number', placeholder: '5.0' },
    { key: 'performance_score', label: 'Điểm hiệu năng', type: 'number', placeholder: '21000' },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Tản nhiệt stock, sticker Ryzen/Intel...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'Intel Hyper-Threading, AMD 3D V-Cache...' },
  ],
  fan: [
    { key: 'has_rgb', label: 'Có RGB', type: 'boolean' },
    { key: 'size_mm', label: 'Kích thước (mm)', type: 'select', options: ['80', '92', '120', '140', '200'] },
    { key: 'airflow_cfm', label: 'Lưu lượng gió (CFM)', type: 'number', placeholder: '72.8' },
    { key: 'bearing_type', label: 'Loại trục', type: 'text', placeholder: 'Magnetic Dome' },
    { key: 'fan_speed_rpm', label: 'Tốc độ quay (RPM)', type: 'number', placeholder: '2100' },
    { key: 'noise_level_db', label: 'Độ ồn (dB)', type: 'number', placeholder: '36' },
    { key: 'connection_type', label: 'Chuẩn cắm', type: 'text', placeholder: '4-pin PWM' },
    { key: 'is_addressable_rgb', label: 'LED ARGB', type: 'boolean' },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Ốc gắn fan, đệm chống rung...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'Magnetic Levitation, điều tốc PWM...' },
  ],
  mainboard: [
    { key: 'socket', label: 'Socket', type: 'select', options: [
      'AM5', 'AM4', 'AM3+', 'AM3', 'AM2+', 'AM2', 'FM2+', 'FM2', 'FM1', 'sTRX4', 'sTR4', 'sWRX8', 'SP3',
      'LGA1851', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'LGA1156', 'LGA2066', 'LGA2011', 'LGA1366', 'LGA775'
    ] },
    { key: 'chipset', label: 'Chipset', type: 'select', options: [
      'Z890', 'Z790', 'Z690', 'Z590', 'Z490', 'B860', 'B760', 'B660', 'B560', 'B460', 'H610', 'H510', 'H410', 
      'X870E', 'X870', 'X670E', 'X670', 'X570', 'X470', 'B850', 'B650E', 'B650', 'B550', 'B450', 'A620', 'A520', 'A320'
    ] },
    { key: 'has_wifi', label: 'Có Wifi', type: 'boolean' },
    { key: 'm2_slots', label: 'Số khe M.2', type: 'number', placeholder: '4' },
    { key: 'ram_type', label: 'Loại RAM', type: 'select', options: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'LPDDR5X'] },
    { key: 'ram_slots', label: 'Số khe RAM', type: 'select', options: ['2', '4', '8'] },
    { key: 'max_ram_gb', label: 'RAM tối đa (GB)', type: 'select', options: ['16', '32', '64', '128', '192', '256', '512'] },
    { key: 'form_factor', label: 'Form factor', type: 'select', options: ['Mini-ITX', 'Micro-ATX', 'ATX', 'E-ATX', 'Flex-ATX', 'SSI CEB', 'SSI EEB'] },
    { key: 'mainboard_type', label: 'Phân khúc bo mạch', type: 'select', options: ['Workstation', 'Gaming', 'Phổ thông'] },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Cáp SATA, Chặn main, Sách HDSD...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'PCIe 5.0, Thunderbolt 4, WiFi 7...' },
  ],
  monitor: [
    { key: 'ports', label: 'Cổng kết nối', type: 'multiselect', options: ['HDMI 2.0', 'HDMI 2.1', 'DisplayPort 1.4', 'DisplayPort 2.1', 'Type-C', 'VGA', 'DVI'] },
    { key: 'has_hdr', label: 'Hỗ trợ HDR', type: 'boolean' },
    { key: 'size_inch', label: 'Kích thước (inch)', type: 'number', placeholder: '27' },
    { key: 'panel_type', label: 'Loại tấm nền', type: 'select', options: ['IPS', 'VA', 'TN', 'OLED', 'QD-OLED', 'Mini-LED'] },
    { key: 'resolution', label: 'Độ phân giải', type: 'select', options: ['1920x1080', '2560x1440', '3440x1440', '3840x2160', '5120x2880'] },
    { key: 'aspect_ratio', label: 'Tỉ lệ màn hình', type: 'select', options: ['16:9', '16:10', '21:9', '32:9', '4:3'] },
    { key: 'color_accuracy', label: 'Độ chuẩn màu', type: 'text', placeholder: '99% DCI-P3' },
    { key: 'brightness_cdm2', label: 'Độ sáng (cd/m2)', type: 'number', placeholder: '1000' },
    { key: 'refresh_rate_hz', label: 'Tần số quét (Hz)', type: 'number', placeholder: '240' },
    { key: 'response_time_ms', label: 'Thời gian phản hồi (ms)', type: 'number', placeholder: '1' },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Cáp DisplayPort/HDMI, Adapter nguồn, chân đế...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'NVIDIA G-Sync, AMD FreeSync Premium, chống xé hình...' },
  ],
  psu: [
    { key: 'wattage', label: 'Công suất (W)', type: 'select', options: ['450', '500', '550', '600', '650', '700', '750', '800', '850', '1000', '1200', '1300', '1500', '1600'] },
    { key: 'modularity', label: 'Dạng dây (Modularity)', type: 'select', options: ['Full Modular', 'Semi Modular', 'Non Modular'] },
    { key: 'form_factor', label: 'Form factor', type: 'select', options: ['ATX', 'SFX', 'SFX-L', 'TFX', 'Flex-ATX', 'EPS12V'] },
    { key: 'efficiency_rating', label: 'Hiệu suất', type: 'select', options: ['80 Plus', '80 Plus Bronze', '80 Plus Silver', '80 Plus Gold', '80 Plus Platinum', '80 Plus Titanium'] },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Dây nguồn AC, ốc bắt case, túi đựng cáp...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'Chuẩn ATX 3.0, PCIe 5.0, tụ điện Nhật 105°C...' },
  ],
  ram: [
    { key: 'kit', label: 'Kit RAM', type: 'select', options: ['1x8GB', '2x8GB', '1x16GB', '2x16GB', '2x32GB', '4x16GB', '2x24GB', '2x48GB', '4x32GB'] },
    { key: 'type', label: 'Loại RAM', type: 'select', options: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5', 'LPDDR5X'] },
    { key: 'has_rgb', label: 'Có RGB', type: 'boolean' },
    { key: 'latency_cl', label: 'CAS Latency (CL)', type: 'number', placeholder: '18' },
    { key: 'capacity_gb', label: 'Dung lượng tổng (GB)', type: 'select', options: ['8', '16', '24', '32', '48', '64', '96', '128', '256'] },
    { key: 'bus_speed_mhz', label: 'Tốc độ Bus (MHz)', type: 'number', placeholder: '4000' },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Sách HDSD, sticker...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'Intel XMP 3.0, AMD EXPO, On-Die ECC...' },
  ],
  ssd: [
    { key: 'type', label: 'Loại', type: 'select', options: ['SSD', 'HDD'] },
    { key: 'interface', label: 'Giao tiếp', type: 'select', options: ['NVMe PCIe Gen3', 'NVMe PCIe Gen4', 'NVMe PCIe Gen5', 'SATA III', 'SATA II', 'SAS'] },
    { key: 'capacity_gb', label: 'Dung lượng (GB)', type: 'select', options: ['120', '240', '250', '256', '480', '500', '512', '1000', '2000', '4000', '8000', '16000'] },
    { key: 'read_speed_mbps', label: 'Tốc độ đọc (MB/s)', type: 'number', placeholder: '3500' },
    { key: 'write_speed_mbps', label: 'Tốc độ ghi (MB/s)', type: 'number', placeholder: '2300' },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Ốc M.2, tản nhiệt nhôm...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'DRAM Cache, bảo vệ dữ liệu đột ngột mất điện...' },
  ],
  vga: [
    { key: 'tdp_w', label: 'TDP (W)', type: 'number', placeholder: '100' },
    { key: 'chipset', label: 'Chipset', type: 'text', placeholder: 'GTX 1650 Super' },
    { key: 'vram_gb', label: 'VRAM (GB)', type: 'select', options: ['2', '4', '6', '8', '10', '12', '16', '20', '24', '32', '48'] },
    { key: 'length_mm', label: 'Chiều dài (mm)', type: 'number', placeholder: '248' },
    { key: 'min_psu_w', label: 'Nguồn tối thiểu (W)', type: 'number', placeholder: '350' },
    { key: 'vram_type', label: 'Loại VRAM', type: 'select', options: ['DDR3', 'GDDR5', 'GDDR5X', 'GDDR6', 'GDDR6X', 'GDDR7', 'HBM', 'HBM2', 'HBM2e', 'HBM3'] },
    { key: 'base_clock_mhz', label: 'Xung cơ bản (MHz)', type: 'number', placeholder: '1530' },
    { key: 'boost_clock_mhz', label: 'Xung boost (MHz)', type: 'number', placeholder: '1755' },
    { key: 'performance_score', label: 'Điểm hiệu năng', type: 'number', placeholder: '9000' },
    { key: 'accessories', label: 'Phụ kiện đi kèm', type: 'text', placeholder: 'Giá đỡ VGA, cáp chuyển đổi nguồn 12VHPWR...' },
    { key: 'intended_use', label: 'Mục đích sử dụng', type: 'multiselect', options: ['Văn phòng', 'Chơi game', 'Đồ họa', 'Workstation / Server', 'Học tập'] },
    { key: 'technologies', label: 'Công nghệ tích hợp', type: 'text', placeholder: 'Ray Tracing, DLSS 3, AMD FSR 3...' },
  ],
};

// Match category name → component_type string
function getComponentTypeFromName(catName: string): string {
  const slug = catName.toLowerCase().replace(/\s+/g, '');
  if (slug.includes('graphic') || slug.includes('vga') || slug.includes('video')) return 'GPU';
  if (slug.includes('memory') || slug.includes('ram')) return 'RAM';
  if (slug.includes('power') || slug.includes('nguon') || slug.includes('psu')) return 'PSU';
  if (slug.includes('board') || slug.includes('mainboard') || slug.includes('mother')) return 'MAINBOARD';
  if (slug.includes('processor') || slug.includes('vi xu ly') || slug.includes('cpu')) return 'CPU';
  if (slug.includes('cool') || slug.includes('tan nhiet')) return 'COOLER';
  if (slug.includes('fan') || slug.includes('quat')) return 'FAN';
  if (slug.includes('storage') || slug.includes('ssd') || slug.includes('hdd') || slug.includes('o cung')) return 'STORAGE';
  if (slug.includes('monitor') || slug.includes('man hinh')) return 'MONITOR';
  if (slug.includes('case') || slug.includes('vo may')) return 'CASE';
  return catName.toUpperCase();
}

// Match category name → spec key
function getSpecsForCategory(catName: string): SpecField[] {
  const slug = catName.toLowerCase().replace(/\s+/g, '');
  for (const key of Object.keys(SPECS_BY_CATEGORY)) {
    if (slug.includes(key) || key.includes(slug)) return SPECS_BY_CATEGORY[key];
  }
  // Check common variants
  if (slug.includes('graphic') || slug.includes('vga') || slug.includes('video')) return SPECS_BY_CATEGORY.vga;
  if (slug.includes('memory') || slug.includes('ram')) return SPECS_BY_CATEGORY.ram;
  if (slug.includes('power') || slug.includes('nguon')) return SPECS_BY_CATEGORY.psu;
  if (slug.includes('board') || slug.includes('mainboard') || slug.includes('mother')) return SPECS_BY_CATEGORY.mainboard;
  if (slug.includes('processor') || slug.includes('vi xu ly')) return SPECS_BY_CATEGORY.cpu;
  if (slug.includes('cool') || slug.includes('tan nhiet')) return SPECS_BY_CATEGORY.cooler;
  if (slug.includes('fan') || slug.includes('quat')) return SPECS_BY_CATEGORY.fan;
  if (slug.includes('storage') || slug.includes('ssd') || slug.includes('hdd') || slug.includes('o cung')) return SPECS_BY_CATEGORY.ssd;
  if (slug.includes('monitor') || slug.includes('man hinh')) return SPECS_BY_CATEGORY.monitor;
  return [];
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface BasicForm {
  name: string;
  categoryId: string;
  brandId: string;
  price: string;
  stock: string;
  description: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: Product | null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ProductFormModal({ isOpen, onClose, onSuccess, editingProduct }: ProductFormModalProps) {
  const isEditing = !!editingProduct;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2 & Multi-image state
  const [step, setStep] = useState<number>(1);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string; status: 'uploading' | 'done' | 'error' }[]>([]);

  // Basic fields
  const [basic, setBasic] = useState<BasicForm>({ name: '', categoryId: '', brandId: '', price: '0', stock: '0', description: '' });

  // Dynamic spec fields (key → value)
  const [specs, setSpecs] = useState<Record<string, string>>({});

  // Thumbnail file
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine active spec fields from selected category
  const selectedCategoryName = categories.find(c => String(c.id) === basic.categoryId)?.name ?? '';
  const specFields = getSpecsForCategory(selectedCategoryName);

  const fetchUploadedImages = async (productId: number | string) => {
    try {
      const data = await adminAPI.getProductImages(productId);
      setUploadedImages(data);
    } catch (err) {
      console.error('Error fetching product images:', err);
    }
  };

  useEffect(() => {
    if (step === 2 && createdProduct) {
      const timer = setTimeout(() => {
        fetchUploadedImages(createdProduct.id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [step, createdProduct]);

  const handleMultipleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !createdProduct) return;

    const fileList = Array.from(files);
    
    // Add all to uploadingFiles state with unique IDs
    const newUploading = fileList.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
      status: 'uploading' as const
    }));
    
    setUploadingFiles(prev => [...prev, ...newUploading]);

    // Upload files sequentially
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const tracking = newUploading[i];
      
      try {
        await adminAPI.uploadProductImage(createdProduct.id, file);
        
        // Mark as done
        setUploadingFiles(prev =>
          prev.map(item => item.id === tracking.id ? { ...item, status: 'done' } : item)
        );
        
        // Refresh uploaded list
        fetchUploadedImages(createdProduct.id);
      } catch {
        // Mark as error
        setUploadingFiles(prev =>
          prev.map(item => item.id === tracking.id ? { ...item, status: 'error' } : item)
        );
        toast.error(`Tải lên file "${file.name}" thất bại.`);
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await adminAPI.deleteProductImage(imageId);
      toast.success('Xóa ảnh chi tiết thành công!');
      if (createdProduct) {
        fetchUploadedImages(createdProduct.id);
      }
    } catch {
      toast.error('Xóa ảnh chi tiết thất bại.');
    }
  };

  // Load refs data once
  useEffect(() => {
    adminAPI.getBrands(0, 200).then(r => setBrands(r.content || []));
    adminAPI.getCategories(0, 200).then(r => setCategories(r.content || []));
  }, []);

  // Populate when editing
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setStep(1);
      setCreatedProduct(null);
      setUploadingFiles([]);
      setUploadedImages([]);
      if (editingProduct) {
        setBasic({
          name: editingProduct.name,
          categoryId: String(editingProduct.categoryId ?? editingProduct.category?.id ?? ''),
          brandId: String(editingProduct.brandId ?? editingProduct.brand?.id ?? ''),
          price: String(editingProduct.price),
          stock: String(editingProduct.stock),
          description: editingProduct.description ?? '',
        });
        // Parse specsJson into state
        try {
          const parsed = editingProduct.specsJson ? JSON.parse(editingProduct.specsJson) : {};
          const stringified: Record<string, string> = {};
          for (const [k, v] of Object.entries(parsed)) {
            stringified[k] = Array.isArray(v) ? (v as string[]).join(', ') : String(v);
          }
          setSpecs(stringified);
        } catch { setSpecs({}); }
        setThumbnailPreview(editingProduct.thumbnailUrl ?? '');
      } else {
        setBasic({ name: '', categoryId: '', brandId: '', price: '0', stock: '0', description: '' });
        setSpecs({});
        setThumbnailPreview('');
      }
      setThumbnailFile(null);
      setSubmitError('');
      setErrors({});
    }, 0);
    return () => clearTimeout(timer);
  }, [editingProduct, isOpen]);

  // Removed reset specs on category change to prevent wiping data on edit load

  const handleBasic = (field: keyof BasicForm, value: string) => {
    setBasic(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };
  const handleSpec = (key: string, value: string) => {
    setSpecs(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEditing) {
      const toastId = toast.loading('Đang tải ảnh đại diện lên Cloudinary...');
      const uploadData = new FormData();
      uploadData.append('file', file);

      const categorySlug = categories.find(c => String(c.id) === basic.categoryId)?.slug || 'other';
      const folder = `PCMAster_Storage/Product_thumbnails/${categorySlug}`;

      try {
        const response = await axiosInstance.post<{ url: string }>(
          `/api/admin/media/upload?folder=${encodeURIComponent(folder)}`,
          uploadData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setThumbnailPreview(response.data.url);
        toast.success('Tải ảnh đại diện mới thành công!', { id: toastId });
      } catch {
        toast.error('Tải ảnh đại diện mới thất bại.', { id: toastId });
      }
    } else {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!basic.name.trim()) {
      newErrors.name = 'Tên sản phẩm không được để trống';
    }
    if (!basic.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }
    if (!basic.brandId) {
      newErrors.brandId = 'Vui lòng chọn thương hiệu';
    }

    // Validate that all spec fields are filled
    if (specFields.length > 0) {
      for (const field of specFields) {
        const val = specs[field.key];
        if (val === undefined || val === null || String(val).trim() === '') {
          newErrors[field.key] = `Vui lòng nhập thông số bắt buộc: ${field.label}`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError('Vui lòng kiểm tra lại thông tin bị thiếu hoặc sai.');
      return;
    }

    setLoading(true);
    setSubmitError('');

    // Build specsJson from spec fields
    const specsObj: Record<string, unknown> = (isEditing && editingProduct?.specsJson) 
      ? JSON.parse(editingProduct.specsJson) 
      : {};

    for (const field of specFields) {
      const val = specs[field.key];
      if (val === undefined || val === '') {
        // Remove empty fields
        delete specsObj[field.key];
        continue;
      }

      if (field.type === 'number') {
        specsObj[field.key] = Number(val);
      } else if (field.type === 'multiselect') {
        specsObj[field.key] = typeof val === 'string' ? val.split(',').map(s => s.trim()).filter(Boolean) : val;
      } else if (field.type === 'select') {
        // Try to convert to number if it's a valid number string
        const numVal = Number(val);
        specsObj[field.key] = isNaN(numVal) ? val : numVal;
      } else if (field.type === 'boolean') {
        specsObj[field.key] = val === 'true';
      } else {
        specsObj[field.key] = val;
      }
    }

    // Auto inject brand name from the selected brandId
    const selectedBrand = brands.find(b => String(b.id) === basic.brandId);
    if (selectedBrand) {
      specsObj['brand'] = selectedBrand.name;
    }

    // Auto inject component_type from selected category
    if (selectedCategoryName) {
      specsObj['component_type'] = getComponentTypeFromName(selectedCategoryName);
    }

    const slug = basic.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese tones
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '_')
      .trim();

    const dataPayload = {
      name: basic.name,
      slug: slug,
      categoryId: Number(basic.categoryId),
      brandId: Number(basic.brandId),
      price: Number(basic.price),
      stock: Number(basic.stock),
      description: basic.description,
      thumbnailUrl: thumbnailPreview || undefined,
      specsJson: JSON.stringify(specsObj),
    };

    // Debug log
    console.group('[ProductFormModal] Submit Request');
    console.log('Mode:', isEditing ? 'UPDATE' : 'CREATE');
    console.log('Endpoint:', isEditing ? `/api/admin/products/${editingProduct?.id}` : '/api/admin/products');
    console.log('data payload:', dataPayload);
    console.log('specsJson parsed:', specsObj);
    
    try {
      if (isEditing && editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, dataPayload);
        toast.success('Cập nhật sản phẩm thành công!');
        console.groupEnd();
        onSuccess();
        onClose();
      } else {
        // Build FormData
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(dataPayload)], { type: 'application/json' }));
        if (thumbnailFile) {
          formData.append('thumbnail', thumbnailFile);
          console.log('thumbnail file:', thumbnailFile);
        }
        console.log('FormData keys:', [...formData.keys()]);
        const newProduct = await adminAPI.createProduct(formData);
        toast.success('Thêm sản phẩm thành công! Vui lòng thêm ảnh chi tiết.');
        console.groupEnd();
        setCreatedProduct(newProduct);
        setStep(2);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      console.error('[ProductFormModal] Submit Error:', err);
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-[16px] z-10">
          <div>
            <h3 className="text-[#0f172a] text-[18px] font-semibold">
              {isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <p className="text-[#94a3b8] text-[13px] mt-0.5">
              {isEditing ? `Đang sửa ID: ${editingProduct?.id}` : 'Điền thông tin sản phẩm'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[#94a3b8] hover:text-[#475569] hover:bg-[#f8fafc] rounded-[8px] transition-colors cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {!isEditing && (
          <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
            <div className={`flex items-center gap-1.5 text-[13px] font-medium ${step >= 1 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`size-5 rounded-full flex items-center justify-center text-[11px] ${step > 1 ? 'bg-green-100 text-green-600 font-bold' : 'bg-[#e8f0fe] text-[#0058be] font-bold'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span>Thông tin sản phẩm</span>
            </div>
            <div className="w-12 h-px bg-[#e2e8f0]"></div>
            <div className={`flex items-center gap-1.5 text-[13px] font-medium ${step === 2 ? 'text-[#0058be] font-semibold' : 'text-[#94a3b8]'}`}>
              <div className={`size-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-[#e8f0fe] text-[#0058be] font-bold' : 'bg-[#f1f5f9] text-[#94a3b8]'}`}>
                2
              </div>
              <span>Ảnh chi tiết (Không bắt buộc)</span>
            </div>
          </div>
        )}

        {step === 2 ? (
          <div className="p-6 flex flex-col gap-6">
            <div className="bg-[#e8f0fe] border border-blue-100 rounded-[12px] p-4 flex gap-3 text-[#0058be]">
              <Check className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[14px]">Sản phẩm đã được tạo thành công!</p>
                <p className="text-[13px] opacity-90 mt-0.5">Sản phẩm <strong>{createdProduct?.name}</strong> đã được thêm vào hệ thống. Bây giờ bạn có thể tải lên các hình ảnh chi tiết để hiển thị ở trang chi tiết sản phẩm.</p>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Tải ảnh chi tiết lên</label>
              <div className="relative group">
                <input
                  type="file"
                  id="detail-images-input"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleFilesChange}
                />
                <label
                  htmlFor="detail-images-input"
                  className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-[#cbd5e1] hover:border-[#0058be] bg-[#f8fafc] hover:bg-[#0058be]/[0.02] rounded-[12px] cursor-pointer transition-all p-6 text-center group"
                >
                  <Upload className="size-8 text-[#94a3b8] mb-2 group-hover:text-[#0058be] transition-colors" />
                  <span className="text-[14px] font-medium text-[#475569]">Chọn nhiều ảnh chi tiết</span>
                  <span className="text-[11px] text-[#94a3b8] mt-1">Hỗ trợ JPG, PNG, WEBP. Chọn nhiều ảnh cùng lúc</span>
                </label>
              </div>
            </div>

            {/* Uploading Status list */}
            {uploadingFiles.length > 0 && (
              <div className="flex flex-col gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[12px] p-4 max-h-[160px] overflow-y-auto">
                <h5 className="text-[12px] font-bold text-[#475569] uppercase tracking-wider">Trạng thái tải lên</h5>
                <div className="flex flex-col gap-1.5">
                  {uploadingFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between text-[13px]">
                      <span className="truncate max-w-[80%] text-[#475569]">{file.name}</span>
                      <span className={`font-semibold shrink-0 ${
                        file.status === 'uploading' ? 'text-[#0058be] animate-pulse' :
                        file.status === 'done' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {file.status === 'uploading' ? 'Đang tải...' :
                         file.status === 'done' ? 'Hoàn tất' : 'Lỗi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Gallery Grid */}
            <div className="flex flex-col gap-2">
              <h5 className="text-[13px] font-bold text-[#475569] uppercase tracking-wider">Danh sách ảnh đã tải lên ({uploadedImages.length})</h5>
              {uploadedImages.length === 0 ? (
                <div className="border border-dashed border-[#e2e8f0] rounded-[12px] py-8 text-center text-[#94a3b8] text-[13px]">
                  Chưa có ảnh chi tiết nào được tải lên.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {uploadedImages.map(img => (
                    <div key={img.id} className="aspect-square bg-white border border-[#e2e8f0] rounded-[8px] relative group overflow-hidden flex items-center justify-center p-1">
                      <img src={img.url} alt="Detail" className="object-contain w-full h-full" />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      >
                        <Trash2 className="size-5 hover:scale-110 transition-transform text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Complete Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-6 py-2 bg-[#0058be] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#0047a3] transition-colors cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            {/* Error */}
            {submitError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-[8px] px-4 py-3 text-[14px]">
                <AlertCircle className="size-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* ── SECTION: Thông tin cơ bản ── */}
            <section className="flex flex-col gap-4">
              <h4 className="text-[13px] font-semibold text-[#0058be] uppercase tracking-wider">Thông tin cơ bản</h4>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#374151]">Tên sản phẩm <span className="text-red-500">*</span></label>
                {errors.name && (
                  <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    ⚠️ {errors.name}
                  </span>
                )}
                <input
                  type="text"
                  value={basic.name}
                  onChange={e => handleBasic('name', e.target.value)}
                  placeholder="VD: Jonsbo D32 Pro Black"
                  className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none transition-all ${
                    errors.name ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#e2e8f0] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]'
                  }`}
                />
              </div>

              {/* Category + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#374151]">Danh mục <span className="text-red-500">*</span></label>
                  {errors.categoryId && (
                    <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      ⚠️ {errors.categoryId}
                    </span>
                  )}
                  <select
                    value={basic.categoryId}
                    onChange={e => handleBasic('categoryId', e.target.value)}
                    className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none transition-all ${
                      errors.categoryId ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                    }`}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#374151]">Thương hiệu <span className="text-red-500">*</span></label>
                  {errors.brandId && (
                    <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      ⚠️ {errors.brandId}
                    </span>
                  )}
                  <select
                    value={basic.brandId}
                    onChange={e => handleBasic('brandId', e.target.value)}
                    className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none transition-all ${
                      errors.brandId ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                    }`}
                  >
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#374151]">Giá (VNĐ) <span className="text-red-500">*</span></label>
                  <input
                    type="number" min={0} step="1000"
                    value={basic.price}
                    onChange={e => handleBasic('price', e.target.value)}
                    placeholder="0"
                    readOnly
                    disabled
                    className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-[14px] text-[#64748b] cursor-not-allowed transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#374151]">Tồn kho <span className="text-red-500">*</span></label>
                  <input
                    type="number" min={0}
                    value={basic.stock}
                    onChange={e => handleBasic('stock', e.target.value)}
                    placeholder="0"
                    readOnly
                    disabled
                    className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-[14px] text-[#64748b] cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#374151]">Mô tả</label>
                <textarea
                  value={basic.description}
                  onChange={e => handleBasic('description', e.target.value)}
                  placeholder="Mô tả sản phẩm..."
                  rows={2}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] transition-all resize-none"
                />
              </div>
            </section>

            {/* ── SECTION: Ảnh sản phẩm ── */}
            <section className="flex flex-col gap-4">
              <h4 className="text-[13px] font-semibold text-[#0058be] uppercase tracking-wider">Ảnh sản phẩm</h4>
              <div
                className="relative border-2 border-dashed border-[#e2e8f0] rounded-[12px] p-4 flex flex-col items-center gap-3 hover:border-[#0058be] transition-colors cursor-pointer bg-[#f8fafc]"
                onClick={() => fileInputRef.current?.click()}
              >
                {thumbnailPreview ? (
                  <div className="flex items-center gap-4 w-full">
                    {thumbnailPreview.startsWith('blob:') ? (
                      <img src={thumbnailPreview} alt="preview" className="h-20 w-20 object-contain rounded-[8px] border border-[#e2e8f0] bg-white" />
                    ) : (
                      <CldImage src={thumbnailPreview} alt="preview" width={80} height={80} className="h-20 w-20 object-contain rounded-[8px] border border-[#e2e8f0] bg-white" />
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="text-[14px] font-medium text-[#0f172a]">{thumbnailFile?.name ?? 'Ảnh hiện tại'}</p>
                      <p className="text-[12px] text-[#94a3b8]">Nhấn để thay đổi ảnh</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-[#e8f0fe] rounded-full">
                      <ImageIcon className="size-6 text-[#0058be]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-medium text-[#374151]">Nhấn để tải ảnh lên</p>
                      <p className="text-[12px] text-[#94a3b8] mt-0.5">PNG, JPG, WEBP (key: thumbnail)</p>
                    </div>
                    <div className="flex items-center gap-2 text-[#0058be] text-[13px] font-medium">
                      <Upload className="size-4" /> Chọn file
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
            </section>

            {/* ── SECTION: Thông số kỹ thuật (dynamic) ── */}
            {specFields.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold text-[#0058be] uppercase tracking-wider">
                    Thông số kỹ thuật — {selectedCategoryName}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {specFields.map(field => (
                    <div key={field.key} className={`flex flex-col gap-1.5 ${field.type === 'multiselect' ? 'col-span-2' : ''}`}>
                      <label className="text-[13px] font-medium text-[#374151]">
                        {field.label}
                      </label>
                      {errors[field.key] && (
                        <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          ⚠️ {errors[field.key]}
                        </span>
                      )}
                      {field.type === 'select' ? (
                        <select
                          value={specs[field.key] ?? ''}
                          onChange={e => handleSpec(field.key, e.target.value)}
                          className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none transition-all ${
                            errors[field.key] ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                          }`}
                        >
                          <option value="">-- Chọn {field.label.toLowerCase()} --</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <select
                          value={specs[field.key] ?? ''}
                          onChange={e => handleSpec(field.key, e.target.value)}
                          className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none transition-all ${
                            errors[field.key] ? 'border-red-500 focus:border-red-500' : 'border-[#e2e8f0] focus:border-[#0058be]'
                          }`}
                        >
                          <option value="">-- Chọn --</option>
                          <option value="true">Có / Yes</option>
                          <option value="false">Không / No</option>
                        </select>
                      ) : field.type === 'multiselect' ? (
                        (() => {
                          const selectedValues = specs[field.key]
                            ? specs[field.key].split(',').map(s => s.trim()).filter(Boolean)
                            : [];
                          const handleCheckboxToggle = (option: string) => {
                            const isSelected = selectedValues.includes(option);
                            const updated = isSelected
                              ? selectedValues.filter(val => val !== option)
                              : [...selectedValues, option];
                            handleSpec(field.key, updated.join(', '));
                          };
                          return (
                            <div className="flex flex-wrap gap-x-4 gap-y-2.5 mt-1 p-3 bg-gray-50 border border-gray-200 rounded-[10px]">
                              {field.options?.map(opt => {
                                const isChecked = selectedValues.includes(opt);
                                return (
                                  <label key={opt} className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer select-none font-medium hover:text-[#0058be] transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleCheckboxToggle(opt)}
                                      className="size-4 rounded text-[#0058be] border-[#cbd5e1] focus:ring-[#0058be] cursor-pointer"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          );
                        })()
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={specs[field.key] ?? ''}
                          onChange={e => handleSpec(field.key, e.target.value)}
                          placeholder={field.placeholder ?? ''}
                          className={`bg-[#f8fafc] border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none transition-all ${
                            errors[field.key] ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#e2e8f0] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#e2e8f0]">
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
                {isEditing ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
