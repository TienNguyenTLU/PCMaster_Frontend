'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  ShoppingCart, 
  Package, 
  Loader2, 
  Cpu, 
  Gamepad2, 
  Monitor, 
  HardDrive,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import axiosInstance from '@/lib/axiosInstance';
import { ChatMessage, RecommendedProduct } from '@/lib/types/chatbot';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  
  // Trạng thái lưu lịch sử trò chuyện
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: 'Xin chào! Tôi là **Trợ lý ảo PCMaster**. 🤖\n\nTôi có thể giúp gì cho bạn hôm nay? Hãy thử yêu cầu tôi:\n- *Tư vấn PC chơi game, đồ họa trong tầm giá cụ thể*\n- *Tìm kiếm linh kiện (VGA, CPU, RAM...) theo ngân sách*\n- *Hỏi đáp về độ tương thích linh kiện*',
      timestamp: new Date().toISOString()
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Các câu gợi ý nhanh
  const quickPrompts = [
    { text: 'PC Gaming tầm 15tr', icon: <Gamepad2 className="size-3 text-blue-500" /> },
    { text: 'Tư vấn VGA dưới 8 triệu', icon: <Cpu className="size-3 text-violet-500" /> },
    { text: 'Tìm Màn hình 144Hz', icon: <Monitor className="size-3 text-emerald-500" /> },
    { text: 'SSD 1TB tốc độ cao', icon: <HardDrive className="size-3 text-orange-500" /> }
  ];

  // Gửi tin nhắn lên Backend
  async function handleSendMessage(textToSend: string) {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử chat ở định dạng Gemini mong đợi: [{role: 'user'|'model', content: '...'}]
      // Bỏ qua tin nhắn chào mừng tĩnh đầu tiên (index 0, role: model) để hội thoại luôn bắt đầu bằng user (yêu cầu bắt buộc của Gemini)
      const historyPayload = messages
        .slice(1)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await axiosInstance.post('/api/chat', {
        message: textToSend,
        history: historyPayload
      });

      const aiMsg: ChatMessage = {
        role: 'model',
        content: response.data.message,
        products: response.data.recommendedProducts || [],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: 'Xin lỗi bạn, máy chủ đang bận xử lý dữ liệu. Bạn vui lòng gửi lại câu hỏi nhé! 🛠️',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Thêm sản phẩm trực tiếp vào giỏ hàng từ bong bóng chat
  async function handleAddToCart(e: React.MouseEvent, product: RecommendedProduct) {
    e.preventDefault();
    if (product.stock === 0 || addingId !== null) return;
    
    setAddingId(product.id);
    try {
      await addItem(product.id, 1);
      toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
    } catch {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
    } finally {
      setAddingId(null);
    }
  }

  // Chuyển đổi ký tự Markdown đơn giản (đậm, nghiêng, xuống dòng) sang HTML để hiển thị đẹp mắt
  function renderMarkdown(text: string) {
    let html = text;
    // Thay đổi xuống dòng kép thành thẻ p, đơn thành br
    html = html.replace(/\n\n/g, '</p><p class="mt-2">');
    html = html.replace(/\n/g, '<br />');
    
    // In đậm: **text** hoặc __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>');

    // In nghiêng: *text* hoặc _text_
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-600">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic text-gray-600">$1</em>');

    // Gạch đầu dòng: - text hoặc * text
    html = html.replace(/(?:^|<br \/>)\s*-\s+(.*?)(?=<br \/>|$)/g, '<li class="ml-4 list-disc text-gray-700 mt-1">$1</li>');

    return <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
  }

  /**
   * Lọc sản phẩm được đề cập trong phần trả lời AI.
   * Nếu AI đề cập cụ thể tên sản phẩm, hiển thị chính xác sản phẩm đó.
   * Nếu không tìm thấy sản phẩm nào khớp tên, hiển thị toàn bộ danh sách đề xuất tương tự.
   */
  function filterRelevantProducts(
    aiContent: string, 
    allProducts: RecommendedProduct[]
  ): { matched: RecommendedProduct[]; isExact: boolean } {
    if (!allProducts || allProducts.length === 0) {
      return { matched: [], isExact: false };
    }

    // Tìm sản phẩm mà tên xuất hiện trong phần trả lời AI
    const contentLower = aiContent.toLowerCase();
    const exactMatches = allProducts.filter(p => {
      // Kiểm tra tên sản phẩm hoặc một phần tên đủ dài (>= 8 ký tự) có xuất hiện trong phần trả lời
      const nameLower = p.name.toLowerCase();
      if (contentLower.includes(nameLower)) return true;
      
      // Kiểm tra từng phần của tên sản phẩm (tách bởi dấu phẩy, dấu ngoặc)
      const nameTokens = nameLower
        .split(/[,\-()\/]+/)
        .map(t => t.trim())
        .filter(t => t.length >= 6);
      return nameTokens.some(token => contentLower.includes(token));
    });

    if (exactMatches.length > 0) {
      return { matched: exactMatches, isExact: true };
    }

    // Nếu không có sản phẩm nào khớp chính xác → hiển thị toàn bộ danh sách đề xuất tương tự
    return { matched: allProducts, isExact: false };
  }

  return (
    <>
      {/* ─── Nút tròn Floating Bong Bóng Nổi ────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30 cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 group"
        aria-label="Trợ lý ảo PCMaster"
      >
        <div className="relative">
          {isOpen ? (
            <X className="size-6 transition-transform duration-300 rotate-90" />
          ) : (
            <div className="relative">
              <MessageSquare className="size-6 group-hover:rotate-6 transition-transform" />
              {/* Chấm nhấp nháy báo hiệu chatbot online */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </div>
      </button>

      {/* ─── Hộp thoại Panel trò chuyện (Light Theme) ──────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[560px] z-50 flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-dropdown">
          
          {/* Header - Gradient xanh thanh lịch */}
          <div className="px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="size-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 leading-none">
                  Trợ Lý Ảo PCMaster
                  <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-blue-100 mt-1">Tư vấn cấu hình & linh kiện 24/7</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Chat Messages Area - Nền sáng */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/80">
            {messages.map((msg, index) => {
              // Lọc sản phẩm phù hợp cho mỗi tin nhắn AI
              const productData = msg.role === 'model' && msg.products && msg.products.length > 0
                ? filterRelevantProducts(msg.content, msg.products)
                : null;

              return (
                <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bong bóng chat chính */}
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed transition-all duration-200 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-blue-500/20' 
                        : 'bg-white text-gray-700 border border-gray-200 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {renderMarkdown(msg.content)}
                  </div>

                  {/* Slider Đề Xuất Sản Phẩm Thực Tế (Chỉ hiển thị cho câu trả lời từ AI) */}
                  {productData && productData.matched.length > 0 && (
                    <ProductSlider
                      products={productData.matched}
                      isExact={productData.isExact}
                      addingId={addingId}
                      onAddToCart={handleAddToCart}
                    />
                  )}
                </div>
              );
            })}

            {/* Bouncing Dots Loading Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <div className="size-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                  <div className="size-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                  <div className="size-2 rounded-full bg-blue-400 animate-bounce" />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Suggestions (Hiện khi rảnh, ko loading) */}
          {!isLoading && messages.length <= 2 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-white flex flex-wrap gap-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 text-[10px] text-gray-600 hover:text-blue-700 transition-all flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5"
                >
                  {prompt.icon}
                  {prompt.text}
                </button>
              ))}
            </div>
          )}

          {/* Input Chat Message Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-4 bg-white border-t border-gray-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Hỏi tư vấn cấu hình, linh kiện..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <Send className="size-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}

interface ProductSliderProps {
  products: RecommendedProduct[];
  isExact: boolean;
  addingId: number | null;
  onAddToCart: (e: React.MouseEvent, product: RecommendedProduct) => void;
}

function ProductSlider({ products, isExact, addingId, onAddToCart }: ProductSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      // Theo dõi khi các hình ảnh tải xong để tính toán lại scroll
      const imgElements = el.querySelectorAll('img');
      imgElements.forEach(img => {
        img.addEventListener('load', checkScroll);
      });

      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);

      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        imgElements.forEach(img => {
          img.removeEventListener('load', checkScroll);
        });
        observer.disconnect();
      };
    }
  }, [products]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      // 188px tương ứng chính xác kích thước 1 card (w-44 = 176px + gap-3 = 12px) giúp cuộn và snap mượt mà
      const scrollAmount = direction === 'left' ? -188 : 188;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mt-3 overflow-hidden">
      {/* Nhãn trạng thái: Chính xác hoặc Đề xuất tương tự */}
      <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <ShoppingCart className={`size-3 ${isExact ? 'text-blue-500' : 'text-amber-500'}`} />
        <span className={isExact ? 'text-blue-600' : 'text-amber-600'}>
          {isExact ? 'Sản phẩm phù hợp yêu cầu:' : 'Đề xuất sản phẩm tương tự:'}
        </span>
      </p>

      {/* Wrapper relative để định vị các nút điều khiển scroll tuyệt đối */}
      <div className="relative group/slider">
        {/* Nút cuộn sang trái (Chỉ hiện khi có thể cuộn trái) */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 size-7 flex items-center justify-center rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Cuộn trái"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}

        {/* Nút cuộn sang phải (Chỉ hiện khi có thể cuộn phải) */}
        {showRightArrow && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 size-7 flex items-center justify-center rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Cuộn phải"
          >
            <ChevronRight className="size-4" />
          </button>
        )}

        {/* Hộp cuộn Flex ngang chứa danh sách sản phẩm */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x snap-mandatory"
        >
          {products.map(product => {
            const isSale = product.discountPrice !== null && product.discountPercent !== null;
            const imgSrc = product.thumbnailUrl?.startsWith('http')
              ? product.thumbnailUrl
              : product.thumbnailUrl
                ? `http://localhost:8080${product.thumbnailUrl}`
                : null;

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-44 snap-start bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 flex flex-col"
              >
                {/* Khung ảnh sản phẩm */}
                <Link href={`/explore/${product.id}`} className="block h-24 bg-gray-50 relative overflow-hidden group">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Package className="size-6" />
                      <span className="text-[9px] mt-1">Không có ảnh</span>
                    </div>
                  )}

                  {/* Nhãn giảm giá */}
                  {isSale && (
                    <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      -{product.discountPercent}%
                    </span>
                  )}
                </Link>

                {/* Khung thông tin chi tiết */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                  <Link
                    href={`/explore/${product.id}`}
                    className="text-[11px] font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2 leading-snug min-h-[32px]"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-end justify-between pt-1 border-t border-gray-100">
                    <div className="flex flex-col">
                      {isSale && product.discountPrice && (
                        <span className="text-[9px] text-gray-400 line-through">
                          {product.price.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-blue-600">
                        {(product.discountPrice || product.price).toLocaleString('vi-VN')}₫
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={product.stock === 0 || addingId === product.id}
                      onClick={(e) => onAddToCart(e, product)}
                      className="p-1.5 rounded-md bg-gray-100 hover:bg-blue-500 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Thêm vào giỏ"
                    >
                      {addingId === product.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ShoppingCart className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
