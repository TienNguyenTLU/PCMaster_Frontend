"use client";

import { useState, useEffect } from "react";
import { adminAPI, Product } from "@/lib/api";
import HomeProductCard from "./HomeProductCard";

interface HomeProductsSectionProps {
  title: string;
  subtitle: string;
  type: "new" | "sale";
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-[20px] border border-[#e8ecf2] flex flex-col overflow-hidden animate-pulse w-full">
      <div className="h-[200px] bg-[#f1f5f9]" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 bg-[#e2e8f0] rounded w-16" />
        <div className="h-4 bg-[#e2e8f0] rounded w-full" />
        <div className="h-4 bg-[#e2e8f0] rounded w-2/3" />
        <div className="flex justify-between items-center pt-3 border-t border-[#f1f5f9] mt-2">
          <div className="h-5 bg-[#e2e8f0] rounded w-24" />
          <div className="size-9 bg-[#e2e8f0] rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}

export default function HomeProductsSection({
  title,
  subtitle,
  type,
}: HomeProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getProducts(0, 100)
      .then((res) => {
        let list = res.content || [];

        
        list = list.filter((p) => p.stock > 0);

        if (type === "new") {
          
          list = [...list]
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 4);
        } else if (type === "sale") {
          
          list = list.filter(
            (p) =>
              p.discountPercent !== null &&
              p.discountPercent !== undefined &&
              p.discountPercent > 0,
          );

          
          list = [...list]
            .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
            .slice(0, 4);
        }
        setProducts(list);
      })
      .catch((err) => {
        console.error(`Failed to fetch products for section ${type}:`, err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [type]);

  if (!loading && products.length === 0) {
    return null; 
  }

  return (
    <section className="flex flex-col gap-8 max-w-[1536px] w-full px-8">
      {}
      <div className="flex flex-col gap-1.5 align-left">
        <h2
          className="text-[#191c1e] text-[28px] sm:text-[32px] tracking-[-1px] font-bold leading-tight"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {title}
        </h2>
        <p
          className="text-[#64748b] text-[14px] sm:text-[15px] font-medium leading-snug"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {subtitle}
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))
          : products.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                badgeType={type}
              />
            ))}
      </div>
    </section>
  );
}
