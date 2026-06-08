/**
 * TypeScript types cho hệ thống Chatbot RAG (Ollama + PGVector)
 */

export interface RecommendedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  discountPercent: number | null;
  thumbnailUrl: string | null;
  stock: number;
  categorySlug?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: RecommendedProduct[];
  timestamp?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  recommendedProducts: RecommendedProduct[];
}
