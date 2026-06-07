'use client';

import { useState, useEffect } from 'react';
import {
  X, Search, Download, Loader2, AlertCircle, Check,
  Eye, PackagePlus, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { adminAPI, Category, GearvnPreviewResponse } from '@/lib/api';
import toast from 'react-hot-toast';

interface GearvnImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GEARVN_URL_REGEX = /^https?:\/\/(www\.)?gearvn\.com\/products\/[a-zA-Z0-9\-_%()+,:]+.*$/;

const SPEC_LABEL_MAP: Record<string, string> = {
  brand: 'Thương hiệu',
  warranty: 'Bảo hành',
  accessories: 'Phụ kiện đi kèm',
  series: 'Dòng sản phẩm',
  generation: 'Thế hệ CPU',
  architecture: 'Kiến trúc',
  socket: 'Socket',
  platform: 'Nền tảng',
  l1_cache: 'Bộ nhớ đệm L1',
  l2_cache: 'Bộ nhớ đệm L2',
  l3_cache: 'Bộ nhớ đệm L3',
  cores: 'Số nhân',
  threads: 'Số luồng',
  p_cores: 'Số nhân P-core',
  e_cores: 'Số nhân E-core',
  base_clock_ghz: 'Xung cơ bản (GHz)',
  boost_clock_ghz: 'Xung tối đa (GHz)',
  e_core_base_clock_ghz: 'Xung cơ bản E-core (GHz)',
  e_core_boost_clock_ghz: 'Xung tối đa E-core (GHz)',
  integrated_gpu: 'Đồ họa tích hợp',
  gpu_integrated_name: 'Tên GPU tích hợp',
  pcie_support: 'Hỗ trợ PCIe',
  memory_support: 'Hỗ trợ loại RAM',
  material: 'Chất liệu vỏ',
  memory_channels: 'Số kênh RAM',
  tdp_w: 'Điện năng tiêu thụ (TDP)',
  memory_speed: 'Tốc độ RAM',
  condition: 'Tình trạng',
  component_type: 'Loại linh kiện',

  // Case specifications
  case_size: 'Kích thước vỏ máy',
  k_ch_th_c_case: 'Kích thước vỏ máy',
  h_tr_main: 'Bo mạch hỗ trợ',
  supported_mainboards: 'Bo mạch hỗ trợ',
  chi_u_cao_t_n_nhi_t_cpu_t_i_a: 'Chiều cao tản nhiệt CPU tối đa',
  max_cpu_cooler_height_mm: 'Chiều cao tản nhiệt CPU tối đa',
  s_l_ng_qu_t_i_k_m: 'Số lượng quạt đi kèm',
  fan_count_included: 'Số lượng quạt đi kèm',
  'Màu sắc': 'Màu sắc',
  color: 'Màu sắc',
  d_i_vga_t_i_a: 'Độ dài GPU tối đa',
  max_gpu_length_mm: 'Độ dài GPU tối đa',
  ch_t_li_u: 'Chất liệu',
  c_ng_usb_3_0: 'Cổng USB 3.0',
  usb_3_0_ports: 'Cổng USB 3.0',
  c_ng_usb_2_0: 'Cổng USB 2.0',
  usb_2_0_ports: 'Cổng USB 2.0',
  'Cổng USB Type-C': 'Cổng USB Type-C',
  usb_type_c_ports: 'Cổng USB Type-C',
  c_ng_audio: 'Cổng kết nối Audio',
  audio_ports: 'Cổng kết nối Audio',
  h_tr_ngu_n_psu: 'Hỗ trợ nguồn (PSU)',
  supported_psu: 'Hỗ trợ nguồn (PSU)',
  h_tr_t_n_nhi_t_n_c_radiator: 'Hỗ trợ tản nhiệt nước (Radiator)',
  supported_radiators: 'Hỗ trợ tản nhiệt nước (Radiator)',
  khe_c_m_m_r_ng_pci: 'Khe cắm mở rộng PCI',
  pci_slots: 'Khe cắm mở rộng PCI',
  khoang_a_quang_odd: 'Khoang ổ đĩa quang (ODD)',
  odd_bays: 'Khoang ổ đĩa quang (ODD)',
  led_rgb: 'Đèn LED RGB',
  m_t_k_nh_c_ng_l_c: 'Mặt kính cường lực',
  tempered_glass_side: 'Mặt kính cường lực',
  qu_t_t_n_nhi_t_m_t_d_i: 'Hỗ trợ quạt mặt dưới',
  bottom_fan_support: 'Hỗ trợ quạt mặt dưới',
  khay_g_n_c_ng: 'Khay gắn ổ cứng (SSD/HDD)',
  drive_bays: 'Khay gắn ổ cứng (SSD/HDD)',
  qu_t_t_n_nhi_t_m_t_sau: 'Hỗ trợ quạt mặt sau',
  rear_fan_support: 'Hỗ trợ quạt mặt sau',
  qu_t_t_n_nhi_t_m_t_tr_n: 'Hỗ trợ quạt mặt trên',
  top_fan_support: 'Hỗ trợ quạt mặt trên',
  qu_t_t_n_nhi_t_m_t_tr_c: 'Hỗ trợ quạt mặt trước',
  front_fan_support: 'Hỗ trợ quạt mặt trước',
  v_tr_t_ngu_n: 'Vị trí đặt nguồn',
  psu_position: 'Vị trí đặt nguồn',

  // Motherboard specifications
  ram_type: 'Loại RAM',
  form_factor: 'Form factor',
  m2_slots: 'Số khe M.2',
  ram_slots: 'Số khe RAM',
  max_ram_gb: 'RAM tối đa (GB)',
  has_wifi: 'Có Wifi',
  mainboard_type: 'Phân khúc bo mạch',
  vrm_pha: 'Pha nguồn VRM',
  k_t_n_i_m_ng_lan: 'Tốc độ mạng LAN',
  rgb_led: 'Đèn LED RGB',
  s_c_ng_sata: 'Số cổng SATA',
  pcie_gen: 'Thế hệ PCIe',
  bluetooth: 'Kết nối Bluetooth',
  cpu_h_tr: 'CPU hỗ trợ',
  c_ng_usb: 'Số cổng USB',
  c_ng_usb_type_c: 'Cổng USB Type-C',
  c_ng_xu_t_h_nh: 'Cổng xuất hình',
  ch_t_li_u_v_m_t_tr_n: 'Chất liệu vỏ / mặt trước',
  max_memory_capacity: 'Dung lượng bộ nhớ tối đa',

  // VGA specifications
  vga_series: 'Dòng sản phẩm VGA',
  vram: 'Dung lượng VRAM',
  base_clock: 'Xung cơ bản (MHz)',
  boost_clock: 'Xung boost (MHz)',
  memory_bus: 'Bus bộ nhớ',
  memory_type: 'Kiểu bộ nhớ',
  fan_count: 'Số quạt tản nhiệt',
  directx: 'DirectX hỗ trợ',
  dlss: 'Hỗ trợ DLSS',
  ray_tracing: 'Hỗ trợ Ray Tracing',
  opengl: 'OpenGL hỗ trợ',
  graphics_processor: 'Nhân đồ họa',
  multi_monitor: 'Hỗ trợ đa màn hình',
  max_resolution: 'Độ phân giải tối đa',
  power_connectors: 'Đầu cấp nguồn',
  recommended_psu: 'Nguồn đề xuất',
  tdp: 'Điện năng tiêu thụ (TDP)',
  dimensions: 'Kích thước card',
  weight: 'Trọng lượng',
  interface: 'giao diện kết nối',
  cuda_cores: 'số nhân Cuda',

  // RAM specifications
  b_ng_th_ng: 'Băng thông',
  cas_latency: 'Độ trễ CAS (CL)',
  product_series: 'Dòng sản phẩm',
  ecc: 'Công nghệ sửa lỗi ECC',
  lo_i_m_y: 'Thiết bị tương thích (Loại máy)',
  s_k_nh: 'Số kênh RAM',
  s_l_ng_thanh: 'Số lượng thanh',
  t_n_nhi_t: 'Tản nhiệt RAM',
  i_n_p: 'Điện áp',
  intel_xmp: 'Hỗ trợ Intel XMP',
  amd_expo: 'Hỗ trợ AMD EXPO',
  capacity: 'Dung lượng',
  lo_i_ram: 'Loại Ram',

  // PSU specifications
  chu_n_ch_ng_nh_n: 'Chuẩn hiệu suất (80 Plus)',
  chu_n_ngu_n: 'Chuẩn nguồn',
  ch_qu_t: 'Chế độ quạt',
  s_c_ng_c_m: 'Số cổng kết nối',
  c_ng_su_t_t_i_a: 'Công suất tối đa',
  c_ng_su_t: 'Công suất',
  hi_u_su_t: 'Hiệu suất',
  ki_u_rail: 'Kiểu thiết kế Rail',
  ki_u_d_y_ngu_n: 'Kiểu dây nguồn',
  k_ch_th_c_qu_t: 'Kích thước quạt',
  lo_i_modular: 'Dạng modular',
  m_u_s_c: 'Màu sắc',
  phi_n_b_n_chu_n: 'Phiên bản chuẩn nguồn',
  t_nh_n_ng_b_o_v: 'Tính năng bảo vệ',
  i_n_p_u_v_o: 'Điện áp đầu vào',
  t_c_quay_c_a_fan: 'Tốc độ quay của quạt',
  t_nh_n_ng_c_bi_t: 'Tính năng đặc biệt',

  // Cooler specifications
  cooler_type: 'Loại tản nhiệt',
  lo_i_s_n_ph_m: 'Loại tản nhiệt',
  fan_count: 'Số quạt',
  s_qu_t: 'Số quạt',
  cpu_socket_support: 'Socket CPU hỗ trợ',
  t_ng_th_ch_cpu: 'Socket CPU hỗ trợ',
  pump_noise_db: 'Độ ồn Pump (dB)',
  ti_ng_n_pump: 'Độ ồn Pump (dB)',
  fan_size_mm: 'Kích thước quạt (mm)',
  k_ch_th_c_qu_t_t_n: 'Kích thước quạt (mm)',
  fan_speed_rpm: 'Tốc độ quạt (RPM)',
  t_c_qu_t: 'Tốc độ quạt (RPM)',
  static_pressure_mmh2o: 'Áp suất tĩnh (mmH₂O)',
  p_su_t_t_nh: 'Áp suất tĩnh (mmH₂O)',
  airflow_cfm: 'Lưu lượng gió (CFM)',
  lu_ng_kh: 'Lưu lượng gió (CFM)',
  pump_dimensions: 'Kích thước Pump',
  k_ch_th_c_pump: 'Kích thước Pump',
  fan_lifespan: 'Tuổi thọ quạt',
  tu_i_th_qu_t: 'Tuổi thọ quạt',
  bearing_type: 'Loại vòng bi',
  lo_i_v_ng_bi: 'Loại vòng bi',
  heatsink_material: 'Vật liệu Heat Sink',
  v_t_li_u_heat_sink: 'Vật liệu Heat Sink',
  radiator_dimensions: 'Kích thước Radiator',
  tube_length: 'Chiều dài ống dẫn',
  chi_u_d_i_ng: 'Chiều dài ống dẫn',
  led_type: 'Đèn LED',
  special_features: 'Tính năng đặc biệt',

  // Fan specifications
  is_addressable_rgb: 'LED ARGB',
  size_mm: 'Kích thước (mm)',
  airflow_cfm: 'Lưu lượng gió (CFM)',
  bearing_type: 'Loại trục quay (Bearing)',
  fan_speed_rpm: 'Tốc độ quay (RPM)',
  connection_type: 'Chuẩn cắm',
  voltage: 'Điện áp',
  'Điện áp': 'Điện áp',
  i_n_p: 'Điện áp',
  fan_lifespan: 'Tuổi thọ quạt',
  'Tuổi thọ quạt': 'Tuổi thọ quạt',
  tu_i_th_qu_t: 'Tuổi thọ quạt',
  static_pressure_mmh2o: 'Áp suất tĩnh (mmH₂O)',
  'Áp suất tĩnh (mmH₂O)': 'Áp suất tĩnh (mmH₂O)',
  p_su_t_t_nh: 'Áp suất tĩnh (mmH₂O)',
  fan_type: 'Loại quạt',
  lo_i_qu_t: 'Loại quạt',
  lo_i_n_led: 'Loại đèn LED',
  lo_i_tr_c: 'Loại trục quay (Bearing)',
  lo_i_k_t_n_i: 'Chuẩn cắm',
  t_c_quay: 'Tốc độ quay (RPM)',
  noise_level_db: 'Độ ồn (dB)',
  n: 'Độ ồn (dB)',
  'Kích thước quạt (mm)': 'Kích thước quạt (mm)',
  m_u_s_c: 'Màu sắc',

  // Laptop
  cpu: 'Bộ vi xử lý (CPU)',
  ram: 'Bộ nhớ RAM',
  ram_slots: 'Số khe cắm RAM',
  s_khe_ram: 'Số khe cắm RAM',
  ssd: 'Ổ cứng SSD',
  ssd_slots: 'Số khe cắm SSD',
  s_khe_ssd: 'Số khe cắm SSD',
  ssd_type: 'Chuẩn SSD',
  chu_n_ssd: 'Chuẩn SSD',
  screen_size: 'Kích thước màn hình (inch)',
  k_ch_th_c_m_n_h_nh: 'Kích thước màn hình (inch)',
  refresh_rate: 'Tần số quét (Hz)',
  t_n_s_qu_t: 'Tần số quét (Hz)',
  screen_tech: 'Công nghệ màn hình',
  c_ng_ngh_m_n_h_nh: 'Công nghệ màn hình',
  connectivity: 'Kết nối không dây',
  chu_n_wifi_bluetooth: 'Kết nối không dây',
  os: 'Hệ điều hành',
  h_i_u_h_nh: 'Hệ điều hành',
  webcam: 'Webcam',
  battery: 'Pin & Bộ sạc',
  k_ch_th_c_m_y: 'Kích thước máy',
  ch_t_li_u_v_m_n_h_nh: 'Chất liệu vỏ',
  brightness_cdm2: 'Độ sáng (cd/m²)',
  s_ng_m_n_h_nh: 'Độ sáng (cd/m²)',
  audio_tech: 'Công nghệ âm thanh',
  c_ng_ngh_m_thanh: 'Công nghệ âm thanh',
  touchscreen: 'Màn hình cảm ứng',
  m_n_h_nh_c_m_ng: 'Màn hình cảm ứng',
  has_numpad: 'Bàn phím số (Numpad)',
  b_n_ph_m_c_n: 'Bàn phím số (Numpad)',
  is_two_in_one: 'Laptop 2-in-1 (Xoay gập)',
  laptop_2_trong_1: 'Laptop 2-in-1 (Xoay gập)',
  screen_finish: 'Bề mặt màn hình',
  t_nh_ch_t_b_m_t: 'Bề mặt màn hình',
  ph_n_gi_i: 'Độ phân giải',
  chu_n_m_u: 'Độ chuẩn màu',
  card_h_a: 'Card đồ họa (VGA)',
  nhu_c_u_s_d_ng_laptop: 'Nhu cầu sử dụng',
};

export default function GearvnImportModal({ isOpen, onClose, onSuccess }: GearvnImportModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // Validation state
  const [urlError, setUrlError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Crawl state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<GearvnPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [expandedPreview, setExpandedPreview] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    adminAPI.getCategories(0, 200).then(r => setCategories(r.content || []));
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setCategoryId('');
      setUrlError('');
      setCategoryError('');
      setPreviewData(null);
      setPreviewLoading(false);
      setPreviewError('');
      setExpandedPreview(false);
      setImporting(false);
    }
  }, [isOpen]);

  function validate(): boolean {
    let isValid = true;
    
    if (!url.trim()) {
      setUrlError('URL không được để trống');
      isValid = false;
    } else if (!GEARVN_URL_REGEX.test(url.trim())) {
      setUrlError('Đường dẫn không hợp lệ. Vui lòng nhập link sản phẩm chính xác từ website gearvn.com');
      isValid = false;
    } else {
      setUrlError('');
    }

    if (!categoryId) {
      setCategoryError('Vui lòng chọn danh mục cho sản phẩm');
      isValid = false;
    } else {
      setCategoryError('');
    }

    return isValid;
  }

  // Handle Preview Action
  async function handlePreview() {
    if (!validate()) return;

    setPreviewLoading(true);
    setPreviewError('');
    setPreviewData(null);

    try {
      const data = await adminAPI.previewGearvnProduct(url.trim(), Number(categoryId));
      setPreviewData(data);
      setExpandedPreview(true);
      toast.success(`Tìm thấy sản phẩm: ${data.title}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Không thể crawl dữ liệu từ URL này';
      setPreviewError(msg);
      toast.error(msg);
    } finally {
      setPreviewLoading(false);
    }
  }

  // Handle Import Action
  async function handleImport() {
    if (!validate()) return;

    setImporting(true);

    try {
      await adminAPI.importFromGearvn(url.trim(), Number(categoryId));
      toast.success('Import sản phẩm từ GearVN thành công!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm';
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-[16px] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#0058be]/10 to-[#00a8e8]/10 rounded-[10px]">
              <Download className="size-5 text-[#0058be]" />
            </div>
            <div>
              <h3 className="text-[#0f172a] text-[18px] font-semibold">Import sản phẩm từ GearVN</h3>
              <p className="text-[#94a3b8] text-[13px] mt-0.5">
                Nhập link sản phẩm từ website GearVN để crawl và lưu dữ liệu tự động
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#94a3b8] hover:text-[#475569] hover:bg-[#f8fafc] rounded-[8px] transition-colors cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Info Banner */}
          <div className="flex items-start gap-2.5 bg-[#e8f0fe] border border-blue-100 rounded-[10px] px-4 py-3">
            <Info className="size-4 text-[#0058be] shrink-0 mt-0.5" />
            <div className="text-[13px] text-[#1e3a5f]">
              <p className="font-semibold">Hướng dẫn sử dụng</p>
              <p className="mt-1 opacity-90">
                Sao chép địa chỉ URL của sản phẩm trên website gearvn.com và dán vào ô bên dưới, chọn danh mục phù hợp, sau đó nhấn <strong>Xem trước</strong> để kiểm tra dữ liệu trước khi import.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-4 border border-[#e2e8f0] rounded-[12px] p-5 bg-slate-50/50">
            {/* URL Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#334155] uppercase tracking-wider">URL sản phẩm GearVN</label>
              <input
                type="text"
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  setUrlError('');
                }}
                placeholder="Ví dụ: https://gearvn.com/products/card-man-hinh-msi-geforce-rtx-5090-lightning-z-32gb"
                className={`bg-white border rounded-[8px] px-3.5 py-2.5 text-[14px] focus:outline-none transition-all ${
                  urlError
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#e2e8f0] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be]'
                }`}
              />
              {urlError && (
                <span className="text-red-500 text-[12px] font-medium flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> {urlError}
                </span>
              )}
            </div>

            {/* Category Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#334155] uppercase tracking-wider">Danh mục lưu trữ</label>
              <select
                value={categoryId}
                onChange={e => {
                  setCategoryId(e.target.value);
                  setCategoryError('');
                }}
                className={`bg-white border rounded-[8px] px-3.5 py-2.5 text-[14px] focus:outline-none transition-all ${
                  categoryError
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#e2e8f0] focus:border-[#0058be]'
                }`}
              >
                <option value="">-- Chọn danh mục sản phẩm --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {categoryError && (
                <span className="text-red-500 text-[12px] font-medium flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> {categoryError}
                </span>
              )}
            </div>

            {/* Action Preview */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading || !url || !categoryId}
                className="flex items-center gap-2 px-4.5 py-2 text-[14px] font-semibold text-[#0058be] border border-[#0058be]/20 bg-[#0058be]/[0.03] hover:bg-[#0058be]/[0.08] disabled:opacity-50 rounded-[8px] transition-colors cursor-pointer"
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang quét dữ liệu...
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    Xem trước dữ liệu
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Error */}
          {previewError && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-[10px] px-4 py-3 text-[13px]">
              <AlertCircle className="size-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {/* Crawled Details Preview */}
          {previewData && (
            <div className="border border-green-200 rounded-[12px] bg-green-50/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedPreview(!expandedPreview)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-[14px] font-semibold text-green-800 hover:bg-green-50/30 transition-colors cursor-pointer border-b border-green-100"
              >
                <span className="flex items-center gap-2">
                  <Check className="size-4.5 text-green-600" />
                  Quét dữ liệu thành công: <span className="font-bold text-slate-800">{previewData.brand} - {previewData.sku}</span>
                </span>
                {expandedPreview ? <ChevronUp className="size-4.5" /> : <ChevronDown className="size-4.5" />}
              </button>

              {expandedPreview && (
                <div className="p-5 flex flex-col gap-5 border-t border-slate-100 bg-white">
                  {/* Basic product card preview */}
                  <div className="flex gap-4">
                    {previewData.thumbnailUrl && (
                      <div className="w-24 h-24 bg-white border border-[#e2e8f0] rounded-[8px] overflow-hidden flex items-center justify-center shrink-0 p-1">
                        <img
                          src={previewData.thumbnailUrl}
                          alt={previewData.title}
                          className="object-contain w-full h-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <h4 className="text-[15px] font-bold text-slate-800 leading-tight">{previewData.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-500 font-medium">
                        <span>Thương hiệu: <strong className="text-slate-700">{previewData.brand}</strong></span>
                        {previewData.sku && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">SKU: {previewData.sku}</span>
                        )}
                      </div>
                      <div className="text-[15px] font-bold text-[#0058be] mt-0.5">
                        Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(previewData.price)}
                      </div>
                    </div>
                  </div>

                  {/* Specs Map */}
                  {Object.keys(previewData.specs).length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h5 className="text-[12px] font-bold text-[#334155] uppercase tracking-wider">Thông số kỹ thuật được nhận diện ({Object.keys(previewData.specs).length})</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3.5 max-h-[220px] overflow-y-auto">
                        {Object.entries(previewData.specs).map(([key, val]) => {
                          const displayKey = SPEC_LABEL_MAP[key] || key;
                          const displayVal = val === 'true' ? 'Có' : val === 'false' ? 'Không' : val;
                          return (
                            <div key={key} className="flex justify-between text-[13px] py-1 border-b border-[#f1f5f9] last:border-0">
                              <span className="text-slate-500 text-[12px] truncate mr-2 font-semibold">{displayKey}</span>
                              <span className="text-slate-800 text-right truncate font-semibold">{displayVal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Note about description / price editing */}
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3 text-[13px] text-amber-800">
                    <Info className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Ghi chú nhập kho:</strong> Dữ liệu giá và tất cả hình ảnh (bao gồm cả ảnh chi tiết trong mô tả) sẽ được lấy trực tiếp từ trang GearVN (mô tả dạng văn bản sẽ được bỏ qua). Sau khi import, sản phẩm sẽ được tạo với <strong>tồn kho = 0</strong>. Bạn có thể cập nhật số lượng nhập kho qua tính năng nhập hàng của Dashboard.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between sticky bottom-0 bg-white rounded-b-[16px]">
          <div className="text-[13px] text-[#64748b]">
            {previewData ? (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <Check className="size-4" /> Dữ liệu đã sẵn sàng
              </span>
            ) : (
              <span>Vui lòng chọn link sản phẩm GearVN</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-semibold text-[#475569] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !previewData}
              className="px-5 py-2 text-[14px] font-semibold text-white bg-gradient-to-r from-[#0058be] to-[#0071e3] rounded-[8px] hover:from-[#0047a3] hover:to-[#0058be] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {importing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang import...
                </>
              ) : (
                <>
                  <PackagePlus className="size-4" />
                  Import sản phẩm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
