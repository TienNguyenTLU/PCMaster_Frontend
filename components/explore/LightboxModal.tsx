import React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeImageUrl: string | null;
  allImages: string[];
  selectedImgIndex: number;
  onPrevImage: () => void;
  onNextImage: () => void;
}

export default function LightboxModal({
  isOpen,
  onClose,
  activeImageUrl,
  allImages,
  selectedImgIndex,
  onPrevImage,
  onNextImage,
}: LightboxModalProps) {
  if (!isOpen || !activeImageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all cursor-pointer"
        aria-label="Close lightbox"
      >
        <X className="size-6" />
      </button>

      {}
      {allImages.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrevImage();
          }}
          className="absolute left-6 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
          aria-label="Previous image"
        >
          <ChevronLeft className="size-8" />
        </button>
      )}

      {}
      <div
        className="max-w-[85vw] max-h-[80vh] flex items-center justify-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={activeImageUrl}
          alt="Product detail expanded view"
          className="max-w-full max-h-full object-contain rounded-[12px] shadow-2xl"
        />
      </div>

      {}
      {allImages.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNextImage();
          }}
          className="absolute right-6 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer"
          aria-label="Next image"
        >
          <ChevronRight className="size-8" />
        </button>
      )}

      {}
      {allImages.length > 1 && (
        <div className="absolute bottom-8 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 text-white text-[14px] font-medium tracking-wide">
          {selectedImgIndex + 1} / {allImages.length}
        </div>
      )}
    </div>
  );
}
