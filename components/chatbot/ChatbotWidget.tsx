"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  ChevronRight,
  Bot,
  RefreshCw,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { chatbotAPI } from "@/lib/api";
import { ChatMessage, RecommendedProduct } from "@/lib/types/chatbot";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";


const WELCOME_CONSULT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Xin chào! Tôi là **Trợ lý AI PCMaster** 🤖\n\nTôi có thể giúp bạn:\n- *Tìm kiếm và so sánh linh kiện phù hợp*\n- *Tư vấn nâng cấp phần cứng*\n- *Giải đáp thông số kỹ thuật sản phẩm*\n\nHãy đặt câu hỏi bất kỳ!",
  timestamp: new Date().toISOString(),
};

const QUICK_PROMPTS = [
  {
    text: "PC gaming tầm 20 triệu",
    icon: <Gamepad2 className="size-3 text-violet-500" />,
  },
  {
    text: "Tư vấn VGA dưới 8 triệu",
    icon: <Cpu className="size-3 text-blue-500" />,
  },
  {
    text: "Màn hình 144Hz tốt nhất",
    icon: <Monitor className="size-3 text-emerald-500" />,
  },
  {
    text: "SSD tốc độ cao giá tốt",
    icon: <HardDrive className="size-3 text-orange-500" />,
  },
];


export default function ChatbotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  
  const [messages, setMessages] = useState<ChatMessage[]>([
    WELCOME_CONSULT_MESSAGE,
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCartStore();

  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  
  const handleSendMessage = useCallback(
    async (textToSend: string) => {
      if (!textToSend.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: textToSend.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      
      const historyPayload = messages
        .slice(1)
        .map((msg) => ({ role: msg.role, content: msg.content }));

      try {
        const response = await chatbotAPI.chat(
          textToSend.trim(),
          historyPayload,
          "consult",
        );

        const aiMsg: ChatMessage = {
          role: "assistant",
          content: response.message,
          products: response.recommendedProducts || [],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Xin lỗi bạn, trợ lý AI đang gặp sự cố kết nối 🛠️\n\nVui lòng đảm bảo **Ollama** đang chạy và thử lại sau nhé!",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, setMessages],
  );

  
  const handleAddToCart = useCallback(
    async (e: React.MouseEvent, product: RecommendedProduct) => {
      e.preventDefault();
      if (product.stock === 0 || addingId !== null) return;

      setAddingId(product.id);
      try {
        await addItem(product.id, 1);
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
      } catch {
        toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      } finally {
        setAddingId(null);
      }
    },
    [addingId, addItem],
  );

  
  const handleReset = useCallback(() => {
    setMessages([WELCOME_CONSULT_MESSAGE]);
    setInput("");
  }, []);

  return (
    <>
      {}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Trợ lý AI PCMaster"
      >
        <div className="relative p-4 rounded-2xl bg-white border border-gray-200 shadow-lg shadow-gray-200/60 hover:shadow-xl hover:shadow-blue-100 hover:border-blue-300 hover:scale-105 active:scale-95 transition-all duration-300">
          {}
          <div className="absolute inset-0 rounded-2xl bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {isOpen ? (
            <X className="size-6 text-gray-500 relative z-10 transition-transform duration-300 rotate-90" />
          ) : (
            <div className="relative">
              <Bot className="size-6 text-[#0058be] relative z-10 group-hover:text-blue-600 transition-colors" />
              {}
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
              </span>
            </div>
          )}
        </div>
      </button>

      {}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[580px] z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/50 border border-gray-200 animate-chat-in bg-white">
          {}
          <div className="px-5 py-4 bg-gradient-to-r from-[#0058be] to-[#0070e0] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-xl bg-white/20 border border-white/25">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Trợ Lý AI PCMaster
                  <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Bắt đầu cuộc trò chuyện mới"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                message={msg}
                addingId={addingId}
                onAddToCart={handleAddToCart}
              />
            ))}

            {}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 flex-shrink-0">
                  <Bot className="size-3.5 text-[#0058be]" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <div className="size-2 rounded-full bg-[#0058be] animate-bounce [animation-delay:-0.3s]" />
                  <div className="size-2 rounded-full bg-[#0058be] animate-bounce [animation-delay:-0.15s]" />
                  <div className="size-2 rounded-full bg-[#0058be] animate-bounce" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {}
          {!isLoading && messages.length <= 2 && (
            <div className="px-4 py-3 bg-white border-t border-gray-100 flex flex-wrap gap-2 flex-shrink-0">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 text-[10px] text-gray-500 hover:text-[#0058be] transition-all flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5"
                >
                  {prompt.icon}
                  {prompt.text}
                </button>
              ))}
            </div>
          )}

          {}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Hỏi tư vấn cấu hình, linh kiện..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#0058be] hover:bg-[#0047a3] text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-blue-200"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {}
      <style>
        {`
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .animate-chat-in { animation: chat-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}
      </style>
    </>
  );
}


interface MessageBubbleProps {
  message: ChatMessage;
  addingId: number | null;
  onAddToCart: (e: React.MouseEvent, product: RecommendedProduct) => void;
}

function MessageBubble({ message, addingId, onAddToCart }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-2`}
    >
      {}
      <div
        className={`flex items-start gap-2 max-w-[88%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {}
        {!isUser && (
          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 flex-shrink-0 mt-0.5">
            <Bot className="size-3.5 text-[#0058be]" />
          </div>
        )}

        {}
        <div
          className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
            isUser
              ? "bg-[#0058be] text-white rounded-tr-sm shadow-md shadow-blue-200/40"
              : "bg-white text-gray-700 border border-gray-200 rounded-tl-sm shadow-sm"
          }`}
        >
          <MarkdownText text={message.content} isUser={isUser} />
        </div>
      </div>

      {}
      {!isUser && message.products && message.products.length > 0 && (
        <ProductSlider
          products={message.products}
          addingId={addingId}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
}


function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  const html = text
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br />")
    .replace(
      /\*\*(.*?)\*\*/g,
      `<strong class="font-semibold ${isUser ? "text-blue-100" : "text-gray-900"}">${"$1"}</strong>`,
    )
    .replace(
      /\*(.*?)\*/g,
      `<em class="italic ${isUser ? "text-blue-200" : "text-gray-500"}">${"$1"}</em>`,
    )
    .replace(
      /(?:^|<br \/>)\s*[-•]\s+(.*?)(?=<br \/>|$)/g,
      `<li class="ml-4 list-disc ${isUser ? "text-blue-50" : "text-gray-600"} mt-1">${"$1"}</li>`,
    );

  return <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}


interface ProductSliderProps {
  products: RecommendedProduct[];
  addingId: number | null;
  onAddToCart: (e: React.MouseEvent, product: RecommendedProduct) => void;
}

function ProductSlider({
  products,
  addingId,
  onAddToCart,
}: ProductSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 5);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      observer.disconnect();
    };
  }, [products, checkScroll]);

  const scroll = (dir: "left" | "right") => {
    containerRef.current?.scrollBy({
      left: dir === "left" ? -192 : 192,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full ml-8">
      <div className="flex flex-col gap-1.5 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <ShoppingCart className="size-3 text-[#0058be]" />
          <span className="text-[#0058be]">Sản phẩm đề xuất:</span>
        </p>
      </div>

      <div className="relative group/slider">
        {}
        {showLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-[#0058be] hover:border-[#0058be] hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-md"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}

        {}
        {showRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-7 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-[#0058be] hover:border-[#0058be] hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-md"
          >
            <ChevronRight className="size-4" />
          </button>
        )}

        {}
        <div
          ref={containerRef}
          className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x snap-mandatory"
        >
          {products.map((product) => {
            const isSale =
              product.discountPrice !== null &&
              product.discountPercent !== null;
            const imgSrc = product.thumbnailUrl?.startsWith("http")
              ? product.thumbnailUrl
              : product.thumbnailUrl
                ? `http://localhost:8080${product.thumbnailUrl}`
                : null;
            const displayPrice = product.discountPrice ?? product.price;

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-44 snap-start bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all duration-300 flex flex-col"
              >
                {}
                <Link
                  href={`/explore/${product.id}`}
                  className="block h-24 bg-gray-50 relative overflow-hidden group"
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                      <Package className="size-6" />
                      <span className="text-[9px] mt-1">Chưa có ảnh</span>
                    </div>
                  )}
                  {}
                  {isSale && (
                    <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      -{product.discountPercent}%
                    </span>
                  )}
                </Link>

                {}
                <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                  <Link
                    href={`/explore/${product.id}`}
                    className="text-[11px] font-semibold text-gray-700 hover:text-[#0058be] transition-colors line-clamp-2 leading-snug min-h-[32px]"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-end justify-between pt-1 border-t border-gray-100">
                    <div className="flex flex-col">
                      {isSale && (
                        <span className="text-[9px] text-gray-400 line-through">
                          {product.price.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-[#0058be]">
                        {displayPrice.toLocaleString("vi-VN")}₫
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={product.stock === 0 || addingId === product.id}
                      onClick={(e) => onAddToCart(e, product)}
                      className="p-1.5 rounded-md bg-gray-100 hover:bg-[#0058be] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
