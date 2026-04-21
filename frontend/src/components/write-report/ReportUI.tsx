import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

const RATING_EMOJIS = ['😡', '😟', '😐', '🙂', '🤩'] as const;
const RATING_LABELS = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'] as const;
const RATING_COLORS = ['#f04452', '#ff6b35', '#ffc233', '#36b37e', '#3182f6'] as const;

export interface EmojiRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const EmojiRating: React.FC<EmojiRatingProps> = ({ label, value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-bold text-[#4e5968] mb-2">{label}</label>
      <div className="flex items-center gap-1.5">
        {RATING_EMOJIS.map((emoji, idx) => {
          const rating = idx + 1;
          const isSelected = value === rating;
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(isSelected ? 0 : rating)}
              className={`relative group flex flex-col items-center`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[22px] transition-all duration-200 ${
                isSelected 
                  ? 'scale-125 shadow-lg ring-2' 
                  : value > 0 && value !== rating 
                    ? 'opacity-30 hover:opacity-60 hover:scale-105' 
                    : 'opacity-50 hover:opacity-80 hover:scale-110'
              }`}
                style={{
                  backgroundColor: isSelected ? `${RATING_COLORS[idx]}15` : 'transparent',
                  boxShadow: isSelected ? `0 0 0 2px ${RATING_COLORS[idx]}` : 'none',
                }}
              >
                {emoji}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                style={{ color: RATING_COLORS[idx] }}
              >
                {RATING_LABELS[idx]}
              </span>
            </button>
          );
        })}
        {value > 0 && (
          <div className="ml-2 px-2.5 py-1 rounded-full text-[12px] font-extrabold text-white"
            style={{ backgroundColor: RATING_COLORS[value - 1] }}
          >
            {value}/5
          </div>
        )}
      </div>
    </div>
  );
};

export interface MultiPhotoDropzoneProps {
  label: string;
  placeholder: string;
  previews: string[];
  onFilesAdded: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const MultiPhotoDropzone: React.FC<MultiPhotoDropzoneProps> = ({ 
  label, placeholder, previews, onFilesAdded, onRemove, onDrop 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDropInternal = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onDrop(e);
  };

  return (
    <div className="mt-3">
      <label className="block text-[13px] font-bold text-[#4e5968] mb-2">{label}</label>

      {/* Grid of existing previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden border border-[#e5e8eb] shadow-sm aspect-square group">
              <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => onRemove(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-[#f04452] backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                title="사진 삭제"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <span className="text-[10px] text-white font-bold">{idx + 1}/{previews.length}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add more photos zone */}
      <div 
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer group flex flex-col items-center justify-center py-5 px-4 text-center ${
          isDragging 
            ? 'border-[#3182f6] bg-[#e8f3ff] scale-[1.02]' 
            : 'border-[#d1d6db] bg-[#f9fafb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropInternal}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          multiple 
          capture="environment"
          onChange={onFilesAdded} 
          className="hidden" 
        />
        <div className="w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
          {isDragging ? <ImagePlus size={18} className="text-[#3182f6]" /> : <Camera size={18} className="text-[#3182f6]" />}
        </div>
        <p className="text-[13px] font-bold text-[#191f28]">
          {previews.length > 0 ? '사진 더 추가하기' : placeholder}
        </p>
        <p className="text-[11px] text-[#8b95a1] mt-0.5">터치하여 촬영 / 여러 장 선택 가능</p>
      </div>
    </div>
  );
};

export interface TextInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  isTextarea?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({ label, placeholder, value, onChange, isTextarea = false }) => {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-bold text-[#191f28] mb-1.5">{label}</label>
      {isTextarea ? (
        <textarea 
          placeholder={placeholder} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          rows={2}
          className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors resize-none focus:ring-4 focus:ring-[#3182f6]/10" 
        />
      ) : (
        <input 
          type="text" 
          placeholder={placeholder} 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors focus:ring-4 focus:ring-[#3182f6]/10" 
        />
      )}
    </div>
  );
};

export interface SelectInputProps {
  label: string;
  options: {value: string, label: string}[];
  value: string;
  onChange: (value: string) => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, options, value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-bold text-[#191f28] mb-1.5">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#f9fafb] border border-[#d1d6db] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#3182f6] focus:bg-white transition-colors cursor-pointer appearance-none ${value ? 'text-[#191f28] font-medium' : 'text-[#8b95a1]'}`}
      >
        <option value="" disabled>선택해주세요</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="text-[#191f28]">{opt.label}</option>
        ))}
      </select>
    </div>
  );
};
