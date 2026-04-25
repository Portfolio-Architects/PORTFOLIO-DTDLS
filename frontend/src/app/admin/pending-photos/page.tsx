'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Camera, Check, X, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface PendingPhoto {
  id: string;
  apartmentId: string;
  apartmentName: string;
  url: string;
  locationTag: string;
  locationTagId: string;
  caption: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  uploaderName?: string;
}

export default function PendingPhotosPage() {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingPhotos = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'pending_photos'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const fetched: PendingPhoto[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as PendingPhoto);
      });
      // Sort by createdAt descending (client-side to avoid composite index requirement for MVP)
      fetched.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPhotos(fetched);
    } catch (error) {
      console.error("Error fetching pending photos:", error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPhotos();
  }, []);

  const handleApprove = async (photo: PendingPhoto) => {
    if (!window.confirm('이 사진을 승인하시겠습니까? (즉시 서비스에 노출됩니다)')) return;
    setProcessingId(photo.id);

    try {
      // 1. Get the target apartment report
      const reportRef = doc(db, 'scoutingReports', photo.apartmentId);
      const reportSnap = await getDoc(reportRef);
      
      if (!reportSnap.exists()) {
        alert('연결된 아파트 정보를 찾을 수 없습니다.');
        setProcessingId(null);
        return;
      }

      const reportData = reportSnap.data();
      const currentImages = reportData.images || [];

      // 2. Add new image
      const newImage = {
        url: photo.url,
        caption: photo.caption,
        locationTag: photo.locationTagId, // Need ID for mappings
        isPremium: false,
        uploaderName: photo.uploaderName || '익명'
      };

      await updateDoc(reportRef, {
        images: [...currentImages, newImage]
      });

      // 3. Update pending status
      await updateDoc(doc(db, 'pending_photos', photo.id), {
        status: 'approved',
        processedAt: new Date()
      });

      // 4. Remove from list
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      
    } catch (error) {
      console.error("Approval failed:", error);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (photo: PendingPhoto) => {
    if (!window.confirm('이 사진을 거절하시겠습니까? (영구 삭제됩니다)')) return;
    setProcessingId(photo.id);

    try {
      // 1. Update status
      await updateDoc(doc(db, 'pending_photos', photo.id), {
        status: 'rejected',
        processedAt: new Date()
      });

      // 2. Try to delete from storage to save space (optional, but good practice)
      try {
        const imageRef = ref(storage, photo.url);
        await deleteObject(imageRef);
      } catch (e) {
        console.warn('Could not delete image from storage:', e);
      }

      // 3. Remove from list
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (error) {
      console.error("Rejection failed:", error);
      alert('거절 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-[#191f28] flex items-center gap-2">
            <Camera className="text-[#3182f6]" /> 사진 등록 관리 (대기열)
          </h1>
          <p className="text-[15px] text-[#4e5968] mt-1">
            입주민이 등록한 단지 사진을 검토하고 승인/거절합니다.
          </p>
        </div>
        <div className="bg-[#f2f4f6] px-4 py-2 rounded-xl text-[14px] font-bold text-[#4e5968]">
          대기 중: <span className="text-[#3182f6]">{photos.length}</span>건
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#8b95a1]">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p>업로드 내역을 불러오는 중...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white border border-[#e5e8eb] rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-[#f2f4f6] rounded-full flex items-center justify-center mb-4">
            <Check size={32} className="text-[#8b95a1]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#191f28] mb-1">대기 중인 사진이 없습니다</h3>
          <p className="text-[14px] text-[#8b95a1]">모든 등록 사진 처리가 완료되었습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map(photo => (
            <div key={photo.id} className="bg-white border border-[#e5e8eb] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="relative aspect-[4/3] w-full bg-[#f2f4f6]">
                <Image 
                  src={photo.url} 
                  alt="등록 사진" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-[#e8f3ff] text-[#3182f6] text-[12px] font-bold px-2 py-1 rounded-md">
                    {photo.locationTag}
                  </span>
                  <span className="text-[12px] text-[#8b95a1]">
                    {photo.createdAt?.toDate ? new Date(photo.createdAt.toDate()).toLocaleDateString() : '최근'}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-[#191f28] mb-1">{photo.apartmentName}</h3>
                <p className="text-[14px] text-[#4e5968] mb-5 line-clamp-2 min-h-[42px]">
                  {photo.caption || <span className="text-[#8b95a1] italic">설명 없음</span>}
                </p>
                
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-[#e5e8eb]">
                  <button 
                    onClick={() => handleReject(photo)}
                    disabled={processingId === photo.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[14px] font-bold text-[#f04452] bg-[#feeceb] hover:bg-[#fddada] transition-colors disabled:opacity-50"
                  >
                    {processingId === photo.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    거절
                  </button>
                  <button 
                    onClick={() => handleApprove(photo)}
                    disabled={processingId === photo.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[14px] font-bold text-white bg-[#3182f6] hover:bg-[#1b64da] transition-colors disabled:opacity-50"
                  >
                    {processingId === photo.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    승인 (노출)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
