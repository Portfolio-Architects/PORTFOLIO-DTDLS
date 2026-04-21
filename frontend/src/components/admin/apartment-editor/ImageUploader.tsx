import React from 'react';
import { ImagePlus, Trash2, ArrowUpDown } from 'lucide-react';
import { PhotoItem } from '@/lib/types/scoutingReport';

const IMAGE_CATEGORY_GROUPS: { group: string; items: string[] }[] = [
  { group: '🏢 단지 전경', items: ['단지 전경 (메인)', '단지 전경 (항공/드론)', '단지 조감도', '기타'] },
  { group: '🚪 문주·출입구', items: ['정문 (메인게이트)', '후문/측문', '차량 출입구', '보행자 출입구', '보안실', '기타'] },
  { group: '🌿 조경·외부', items: ['중앙 조경', '산책로/보행로', '수경시설 (분수/연못)', '놀이터', '운동기구/트랙', '정원/화단', '야외 카페', '경로당', '단지 내 어린이집', '분리수거장/쓰레기', '단지 내 상가', '기타'] },
  { group: '🅿 주차장', items: ['지하주차장 입구', '지하주차장 내부', '주차장 바닥/도색', '지상 주차', 'EV 충전기', '기타'] },
  { group: '🏋️ 커뮤니티', items: ['커뮤니티 외관/입구', '피트니스센터 (헬스장)', '골프연습장', '실내 수영장', '키즈카페/놀이방', '독서실/스터디룸', '사우나/찜질방', '기타 커뮤니티'] },
  { group: '🏠 동별·세대', items: ['동 외관', '엘리베이터/로비', '복도/계단', '택배함/무인택배', '기타'] },
  { group: '🪟 실내', items: ['거실/리빙', '주방', '욕실/화장실', '발코니/베란다', '현관', '조망/뷰 (창문)', '채광/향 (일조량)', '기타'] },
  { group: '🏙️ 주변 환경', items: ['역세권/교통 접근성', '통학로/학교', '주변 상권', '공원', '소음 환경 (도로)', '어린이집', '유치원', '기타'] },
];

interface ImageUploaderProps {
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  batchInputRef: React.RefObject<HTMLInputElement | null>;
  handleBatchFiles: (files: FileList | File[]) => void;
  sortByCategory: () => void;
  clearPhotos: () => void;
}

export function ImageUploader({
  photos,
  setPhotos,
  isDragging,
  setIsDragging,
  batchInputRef,
  handleBatchFiles,
  sortByCategory,
  clearPhotos,
}: ImageUploaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm p-5 md:p-8">
      <h2 className="text-[16px] font-bold text-[#191f28] mb-5 border-b border-[#f2f4f6] pb-3 flex items-center gap-2">
        ③ 현장 사진
        <span className="text-[12px] font-medium text-[#8b95a1] ml-auto">{photos.length}장</span>
        {photos.length > 0 && (
          <button type="button" onClick={() => {
            if (confirm(`사진 ${photos.length}장을 전부 삭제합니다. 계속할까요?`)) {
              clearPhotos();
            }
          }} className="px-3 py-1.5 bg-[#ffebec] text-[#f04452] rounded-lg text-[11px] font-bold hover:bg-[#f04452] hover:text-white transition-colors">
            전체 삭제
          </button>
        )}
      </h2>

      {/* Drop Zone */}
      <div
        className={`mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging ? 'border-[#3182f6] bg-[#e8f3ff] scale-[1.01]' : 'border-[#d1d6db] bg-[#f9fafb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
        }`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleBatchFiles(e.dataTransfer.files); }}
        onClick={() => batchInputRef.current?.click()}
      >
        <input ref={batchInputRef as any} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { if (e.target.files) handleBatchFiles(e.target.files); e.target.value = ''; }} />
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
          <ImagePlus size={22} className="text-[#3182f6]" />
        </div>
        <p className="text-[15px] font-bold text-[#191f28] mb-1">
          {isDragging ? '여기에 놓으세요!' : '사진을 한번에 여러 장 추가'}
        </p>
        <p className="text-[12px] text-[#8b95a1]">드래그하거나 클릭하여 사진 선택 · EXIF 촬영일 자동 감지</p>
      </div>

      {/* Sort Button */}
      {photos.length >= 2 && (
        <button type="button" onClick={sortByCategory}
          className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e5e8eb] rounded-xl text-[13px] font-bold text-[#4e5968] hover:bg-[#f9fafb] hover:border-[#3182f6] hover:text-[#3182f6] transition-all shadow-sm">
          <ArrowUpDown size={14} /> 카테고리별 자동 정렬 <span className="text-[11px] text-[#8b95a1] font-medium">({photos.length}장)</span>
        </button>
      )}

      {/* Photo Cards */}
      <div className="space-y-4">
        {photos.map((photo, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border border-[#e5e8eb] rounded-2xl bg-white shadow-sm hover:border-[#3182f6] transition-colors group relative">
            {/* Preview */}
            <div className="w-full md:w-[150px] h-[100px] bg-[#f9fafb] border-2 border-dashed border-[#d1d6db] rounded-xl overflow-hidden relative shrink-0">
              {(photo.previewUrl || photo.url) ? (
                <>
                  <img src={photo.previewUrl || photo.url} alt="Preview" className="w-full h-full object-cover" />
                  {photo.capturedAt && (
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                      {photo.capturedAt}
                    </span>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8b95a1]">
                  <ImagePlus size={24} />
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-3">
              <div className="flex gap-3">
                {/* Category Picker — 2-level popover */}
                {(() => {
                  const currentTag = photo.locationTag;
                  const currentGroup = IMAGE_CATEGORY_GROUPS.find(g => g.items.includes(currentTag));
                  return (
                    <div className="relative w-[220px]">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`cat-popover-${index}`);
                          if (el) el.classList.toggle('hidden');
                        }}
                        className="w-full px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] font-bold text-left cursor-pointer hover:border-[#3182f6] focus:ring-2 focus:ring-[#3182f6]/30 focus:border-[#3182f6] outline-none transition-colors text-[#191f28] flex items-center justify-between"
                      >
                        <span className="truncate">{currentTag || '카테고리 선택'}</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 ml-1 text-[#8b95a1]"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                      </button>
                      <div
                        id={`cat-popover-${index}`}
                        className="hidden absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-[#e5e8eb] w-[380px] md:w-[560px] max-h-[280px] overflow-hidden"
                      >
                        {/* Group tabs */}
                        <div className="flex gap-1 p-2 overflow-x-auto border-b border-[#f2f4f6] bg-[#fafbfc]">
                          {IMAGE_CATEGORY_GROUPS.map((g, gIdx) => (
                            <button
                              key={g.group}
                              type="button"
                              onClick={() => {
                                const container = document.getElementById(`cat-popover-${index}`);
                                if (!container) return;
                                container.querySelectorAll('[data-cat-group]').forEach(el => el.classList.add('hidden'));
                                container.querySelector(`[data-cat-group="${gIdx}"]`)?.classList.remove('hidden');
                                container.querySelectorAll('[data-cat-tab]').forEach(el => {
                                  el.classList.remove('bg-[#191f28]', 'text-white');
                                  el.classList.add('bg-[#f2f4f6]', 'text-[#4e5968]');
                                });
                                container.querySelector(`[data-cat-tab="${gIdx}"]`)?.classList.remove('bg-[#f2f4f6]', 'text-[#4e5968]');
                                container.querySelector(`[data-cat-tab="${gIdx}"]`)?.classList.add('bg-[#191f28]', 'text-white');
                              }}
                              data-cat-tab={gIdx}
                              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                (currentGroup === g || (!currentGroup && gIdx === 0))
                                  ? 'bg-[#191f28] text-white'
                                  : 'bg-[#f2f4f6] text-[#4e5968] hover:bg-[#e5e8eb]'
                              }`}
                            >
                              {g.group.replace(/[^\w가-힣·\s]/g, '').trim()}
                            </button>
                          ))}
                        </div>
                        {/* Items per group */}
                        <div className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[160px]">
                        {IMAGE_CATEGORY_GROUPS.map((g, gIdx) => (
                          <div
                            key={g.group}
                            data-cat-group={gIdx}
                            className={`p-2 flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto ${
                              (currentGroup === g || (!currentGroup && gIdx === 0)) ? '' : 'hidden'
                            }`}
                          >
                            {g.items.map(item => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => {
                                  const updated = [...photos];
                                  updated[index] = { ...updated[index], locationTag: item };
                                  setPhotos(updated);
                                  document.getElementById(`cat-popover-${index}`)?.classList.add('hidden');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                                  currentTag === item
                                    ? 'bg-[#e8f3ff] text-[#3182f6] border-[#3182f6] font-bold'
                                    : 'bg-white text-[#4e5968] border-[#e5e8eb] hover:bg-[#f2f4f6] hover:border-[#3182f6]'
                                }`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <input type="text" value={photo.caption}
                  onChange={e => {
                    const updated = [...photos];
                    updated[index] = { ...updated[index], caption: e.target.value };
                    setPhotos(updated);
                  }}
                  placeholder="캡션 입력 (선택)"
                  className="flex-1 px-3 py-2 bg-[#f9fafb] border border-[#e5e8eb] rounded-lg text-[13px] outline-none focus:border-[#3182f6] transition-colors" />
              </div>
            </div>

            {/* Delete */}
            <button type="button" onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-[#f2f4f6] text-[#8b95a1] hover:bg-[#f04452] hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
