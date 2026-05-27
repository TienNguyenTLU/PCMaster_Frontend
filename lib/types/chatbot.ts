export interface RecommendedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  discountPercent: number | null;
  thumbnailUrl: string | null;
  stock: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  products?: RecommendedProduct[];
  timestamp?: string; // Định dạng ISO string
}

export interface ChatResponse {
  message: string;
  recommendedProducts: RecommendedProduct[];
}
