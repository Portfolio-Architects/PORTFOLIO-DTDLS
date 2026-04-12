import React from 'react';
import Image from 'next/image';

export function ApartmentGallery({ images, tags, tagLabels, onImageClick }: {
  images: {url: string; caption?: string; locationTag?: string; isPremium?: boolean; capturedAt?: string}[];
  tags: string[];
  tagLabels: Record<string, string>;
  onImageClick: (url: string) => void;
}) {
  const categories = tags.filter(t => t !== '전체');
  
  const groupedImages: Record<string, typeof images> = {};
  categories.forEach(tag => {
    groupedImages[tag] = images.filter(img => (img.locationTag || '기타') === tag);
  });

  return (
    <div className="flex flex-col gap-8 mt-2">
      {categories.map(tag => {
        const categoryImages = groupedImages[tag];
        if (!categoryImages || categoryImages.length === 0) return null;
        
        const label = tagLabels[tag] || tag;
        
        return (
          <div key={tag} className="flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[15px] font-extrabold text-[#191f28] flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-[#3182f6] rounded-full inline-block"></span>
                {label}
              </h3>
              <span className="text-[12px] font-bold text-[#8b95a1] bg-[#f2f4f6] px-2 py-0.5 rounded-md">
                {categoryImages.length}장
              </span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x shrink-0 w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categoryImages.map((img, i) => (
                <div
                  key={i}
                  className="relative shrink-0 w-[240px] md:w-[280px] aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group border border-[#e5e8eb] shadow-sm snap-start"
                  onClick={() => onImageClick(img.url)}
                >
                  <Image
                    src={img.url}
                    alt={img.caption || img.locationTag || `Photo ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 240px, 280px"
                    className="object-cover bg-[#f2f4f6]"
                  />
                  {(img.caption || img.isPremium || img.capturedAt) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3.5 pt-8">
                      <div className="flex flex-col gap-1.5">
                        {img.isPremium && (
                          <span className="w-fit text-[9px] font-bold bg-[#ffc107] text-[#191f28] px-1.5 py-0.5 rounded-md">★ PRO</span>
                        )}
                        {img.caption && (
                          <p className="text-[12px] font-medium text-white line-clamp-2 leading-snug">{img.caption}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {img.capturedAt && (
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                      {img.capturedAt}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-8 text-[#8b95a1] text-[13px]">등록된 갤러리 사진이 없습니다.</div>
      )}
    </div>
  );
}
