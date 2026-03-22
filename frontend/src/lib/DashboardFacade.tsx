/**
 * @module DashboardFacade
 * @description Thin orchestration layer implementing the Facade pattern.
 * Architecture Layer: Facade (delegates to repositories and services)
 * 
 * Rationale: The original 702-line monolith has been decomposed into:
 * - Types: @/lib/types/*
 * - Config: @/lib/config/*
 * - Repositories: @/lib/repositories/*
 * - Services: @/lib/services/*
 * 
 * This facade preserves the same public API for backward compatibility
 * while delegating all operations to the appropriate layer.
 */
import { Train, Building, BookOpen, Calendar } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebaseConfig';
import { compressImage } from '@/lib/utils/imageCompression';

// Types (re-export for backward compatibility)
export type { KPIData, NewsItemData, AdBannerData } from '@/lib/types/dashboard.types';
export type { FieldReportData, ReportSections, CommentData } from '@/lib/types/report.types';
export type { UserReview } from '@/lib/types/review.types';

// Internal imports
import type { KPIData, NewsItemData, AdBannerData } from '@/lib/types/dashboard.types';
import type { FieldReportData, ReportSections, CommentData } from '@/lib/types/report.types';
import type { UserReview } from '@/lib/types/review.types';

import { isAdmin as checkAdmin } from '@/lib/config/admin.config';
import * as PostRepo from '@/lib/repositories/post.repository';
import * as ReportRepo from '@/lib/repositories/report.repository';
import * as CommentRepo from '@/lib/repositories/comment.repository';
import * as ReviewRepo from '@/lib/repositories/review.repository';
import * as UserRepo from '@/lib/repositories/user.repository';
import * as ApartmentRepo from '@/lib/repositories/apartment.repository';
import * as PostService from '@/lib/services/post.service';
import { createInitialKPIs, startKPISimulation } from '@/lib/services/kpi.service';
import { logger } from '@/lib/services/logger';

// --- Strategy Interface (preserved for extensibility) ---

export interface DashboardDataStrategy {
  getKPIs(): KPIData[];
  getNewsFeed(): NewsItemData[];
  getFieldReports?(): FieldReportData[];
  getFullReport?(reportId: string): Promise<FieldReportData | null>;
  getAdBanner(): AdBannerData;
  subscribe?(callback: () => void): () => void;
  addPost?(title: string, category: string, authorUid: string, imageFile?: File): Promise<void>;
  addFieldReport?(apartmentName: string, sections: ReportSections, premiumScores: any, authorUid: string, imageEntries: {file: File, category: string}[], onProgress?: (done: number, total: number) => void): Promise<void>;
  addFieldReportComment?(reportId: string, text: string, authorUid: string): Promise<void>;
  incrementLike?(postId: string): Promise<void>;
  incrementFieldReportLike?(reportId: string): Promise<void>;
  incrementReviewLike?(reviewId: string): Promise<void>;
  deleteReview?(reviewId: string): Promise<void>;
  deletePost?(postId: string): Promise<void>;
  listenToComments?(reportId: string, callback: (comments: CommentData[]) => void): () => void;
  getUserProfile?(uid: string): Promise<{ nickname: string }>;
  getUserReviews?(): UserReview[];
  addUserReview?(apartmentName: string, rating: number, content: string, authorUid: string, imageFile?: File): Promise<void>;
  getDongtanApartments?(): string[];
  isAdmin(email: string | null | undefined): boolean;
}

// --- Firebase Strategy (delegates to repositories/services) ---

class FirebaseDashboardDataStrategy implements DashboardDataStrategy {
  private kpis: KPIData[];
  private newsFeed: NewsItemData[] = [];
  private fieldReports: FieldReportData[] = [];
  private userReviews: UserReview[] = [];
  private dongtanApartments: string[] = [];
  private listeners: (() => void)[] = [];
  private cleanupFns: (() => void)[] = [];

  constructor() {
    this.kpis = createInitialKPIs();
    this.init();
  }

  private init() {
    // KPI simulation
    const stopKPI = startKPISimulation(this.kpis, () => this.notifyListeners());
    this.cleanupFns.push(stopKPI);

    // Firestore listeners (delegated to repositories)
    const stopPosts = PostRepo.listenToPosts((posts) => {
      this.newsFeed = posts;
      this.notifyListeners();
    });
    this.cleanupFns.push(stopPosts);

    const stopReports = ReportRepo.listenToReports((reports) => {
      this.fieldReports = reports;
      this.notifyListeners();
    });
    this.cleanupFns.push(stopReports);

    const stopReviews = ReviewRepo.listenToReviews((reviews) => {
      this.userReviews = reviews;
      this.notifyListeners();
    });
    this.cleanupFns.push(stopReviews);

    // External API
    ApartmentRepo.fetchApartmentNames().then((apts) => {
      this.dongtanApartments = apts;
      this.notifyListeners();
    });
  }

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  getKPIs(): KPIData[] { return this.kpis; }

  getNewsFeed(): NewsItemData[] {
    return this.newsFeed;
  }

  getFieldReports(): FieldReportData[] {
    return this.fieldReports;
  }

  getUserReviews(): UserReview[] { return this.userReviews; }

  async getFullReport(reportId: string): Promise<FieldReportData | null> {
    return ReportRepo.getFullReport(reportId);
  }

  getDongtanApartments(): string[] { return this.dongtanApartments; }

  getAdBanner(): AdBannerData {
    return {
      title: '동탄센트럴파크 앞 프리미엄 치과 오픈!',
      description: '최첨단 장비와 분야별 전문의 협진. 첫 방문 고객 스케일링 이벤트 중',
      buttonText: '예약하기',
    };
  }

  async addPost(title: string, category: string, authorUid: string, imageFile?: File) {
    try {
      await PostService.createPost(title, category, authorUid, imageFile);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('DashboardFacade.addPost', 'Post creation failed', { title }, e);
      alert("글 저장 실패! 이유: " + msg);
    }
  }

  async addFieldReport(apartmentName: string, sections: ReportSections, premiumScores: any, authorUid: string, imageEntries: {file: File, category: string}[], onProgress?: (done: number, total: number) => void) {
    try {
      const profile = await UserRepo.getOrCreateProfile(authorUid);
      const total = imageEntries.length;
      let done = 0;

      // Upload all images — batched 5 at a time to avoid overwhelming Firebase
      const BATCH_SIZE = 5;
      const uploadedImages: {url: string, category: string}[] = [];

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = imageEntries.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(async ({ file, category }) => {
          try {
            const compressed = await compressImage(file);
            const storageRef = ref(storage, `field_reports/${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, compressed);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            done++;
            onProgress?.(done, total);
            return { url: downloadUrl, category };
          } catch (storageError) {
            logger.error('DashboardFacade.addFieldReport', `Upload failed for ${file.name}`, undefined, storageError);
            done++;
            onProgress?.(done, total);
            return null;
          }
        }));
        uploadedImages.push(...results.filter(Boolean) as {url: string, category: string}[]);
      }

      // Build ImageMeta array
      const images = uploadedImages.map(img => ({
        url: img.url,
        caption: '',
        locationTag: img.category,
      }));

      // Legacy compat: also set first image per category in sections
      const mergedSections = JSON.parse(JSON.stringify(sections)) as ReportSections;
      const SECTION_MAP: Record<string, [keyof ReportSections, string]> = {
        'gateImg': ['infra', 'gateImg'], 'landscapeImg': ['infra', 'landscapeImg'],
        'parkingImg': ['infra', 'parkingImg'], 'maintenanceImg': ['infra', 'maintenanceImg'],
        'communityImg': ['ecosystem', 'communityImg'], 'schoolImg': ['ecosystem', 'schoolImg'],
        'commerceImg': ['ecosystem', 'commerceImg'],
      };
      for (const img of uploadedImages) {
        const mapping = SECTION_MAP[img.category];
        if (mapping) {
          const [section, field] = mapping;
          if (!(mergedSections[section] as any)[field]) {
            (mergedSections[section] as any)[field] = img.url;
          }
        }
      }

      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebaseConfig');
      await addDoc(collection(db, 'field_reports'), {
        apartmentName,
        sections: mergedSections,
        images,
        premiumScores: premiumScores || null,
        authorName: profile?.nickname || '익명',
        authorUid,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      logger.info('DashboardFacade.addFieldReport', 'Field report created', { apartmentName, imageCount: images.length });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('DashboardFacade.addFieldReport', 'Failed', { apartmentName }, e);
      alert('임장기 저장 실패! 이유: ' + msg);
    }
  }

  async addFieldReportComment(reportId: string, text: string, authorUid: string) {
    try {
      const profile = await UserRepo.getOrCreateProfile(authorUid);
      await CommentRepo.addComment(reportId, text, profile.nickname, authorUid);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('DashboardFacade.addFieldReportComment', 'Comment failed', { reportId }, e);
      alert("댓글 저장 실패! 이유: " + msg);
    }
  }

  listenToComments(reportId: string, callback: (comments: CommentData[]) => void) {
    return CommentRepo.listenToComments(reportId, callback);
  }

  async getUserProfile(uid: string) {
    return UserRepo.getOrCreateProfile(uid);
  }

  async incrementLike(postId: string) {
    try { await PostRepo.incrementPostLike(postId); }
    catch (e) { logger.error('DashboardFacade.incrementLike', 'Like failed', { postId }, e); }
  }

  async incrementFieldReportLike(reportId: string) {
    try { await ReportRepo.incrementReportLike(reportId); }
    catch (e) { logger.error('DashboardFacade.incrementFieldReportLike', 'Like failed', { reportId }, e); }
  }

  async addUserReview(apartmentName: string, rating: number, content: string, authorUid: string, imageFile?: File) {
    try {
      const profile = await UserRepo.getOrCreateProfile(authorUid);
      const displayName = profile.frontName && profile.nickname
        ? `${profile.frontName} ${profile.nickname}`
        : profile.nickname || '익명';
      await ReviewRepo.addReview(
        apartmentName, rating, content, displayName, authorUid,
        profile.verifiedApartment, profile.verificationLevel, imageFile
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('DashboardFacade.addUserReview', 'Review failed', { apartmentName }, e);
      alert('리뷰 저장 실패! 이유: ' + msg);
    }
  }

  async incrementReviewLike(reviewId: string) {
    try { await ReviewRepo.incrementReviewLike(reviewId); }
    catch (e) { logger.error('DashboardFacade.incrementReviewLike', 'Like failed', { reviewId }, e); }
  }

  async deleteReview(reviewId: string) {
    try { await ReviewRepo.deleteReview(reviewId); }
    catch (e) { logger.error('DashboardFacade.deleteReview', 'Delete failed', { reviewId }, e); throw e; }
  }

  async deletePost(postId: string) {
    try { await PostRepo.deletePost(postId); }
    catch (e) { logger.error('DashboardFacade.deletePost', 'Delete failed', { postId }, e); throw e; }
  }

  isAdmin(email: string | null | undefined): boolean {
    return checkAdmin(email);
  }
}

// --- Facade ---

export class DashboardFacade {
  private strategy: DashboardDataStrategy;

  constructor(strategy?: DashboardDataStrategy) {
    this.strategy = strategy || new FirebaseDashboardDataStrategy();
  }

  public setStrategy(strategy: DashboardDataStrategy) { this.strategy = strategy; }
  public subscribe(callback: () => void) { return this.strategy.subscribe ? this.strategy.subscribe(callback) : () => {}; }
  public getKPIs(): KPIData[] { return this.strategy.getKPIs(); }
  public getNewsFeed(): NewsItemData[] { return this.strategy.getNewsFeed(); }
  public getFieldReports(): FieldReportData[] { return this.strategy.getFieldReports ? this.strategy.getFieldReports() : []; }
  public async getFullReport(reportId: string): Promise<FieldReportData | null> { return this.strategy.getFullReport ? await this.strategy.getFullReport(reportId) : null; }
  public getUserReviews(): UserReview[] { return this.strategy.getUserReviews ? this.strategy.getUserReviews() : []; }
  public getAdBanner(): AdBannerData { return this.strategy.getAdBanner(); }
  public async addPost(title: string, category: string, authorUid: string, imageFile?: File) { if (this.strategy.addPost) await this.strategy.addPost(title, category, authorUid, imageFile); }
  public async addFieldReport(apartmentName: string, sections: ReportSections, premiumScores: any, authorUid: string, imageEntries: {file: File, category: string}[], onProgress?: (done: number, total: number) => void) { if (this.strategy.addFieldReport) await this.strategy.addFieldReport(apartmentName, sections, premiumScores, authorUid, imageEntries, onProgress); }
  public async addFieldReportComment(reportId: string, text: string, authorUid: string) { if (this.strategy.addFieldReportComment) await this.strategy.addFieldReportComment(reportId, text, authorUid); }
  public async addUserReview(apartmentName: string, rating: number, content: string, authorUid: string, imageFile?: File) { if (this.strategy.addUserReview) await this.strategy.addUserReview(apartmentName, rating, content, authorUid, imageFile); }
  public listenToComments(reportId: string, callback: (comments: CommentData[]) => void) { return this.strategy.listenToComments ? this.strategy.listenToComments(reportId, callback) : () => {}; }
  public async getUserProfile(uid: string) { return this.strategy.getUserProfile ? await this.strategy.getUserProfile(uid) : null; }
  public async updateNickname(uid: string, nickname: string) { await UserRepo.updateNickname(uid, nickname); }
  public async updateFrontName(uid: string, frontName: string) { await UserRepo.updateFrontName(uid, frontName); }
  public async updatePhotoURL(uid: string, photoURL: string) { await UserRepo.updatePhotoURL(uid, photoURL); }
  public async incrementLike(postId: string) { if (this.strategy.incrementLike) await this.strategy.incrementLike(postId); }
  public async incrementFieldReportLike(reportId: string) { if (this.strategy.incrementFieldReportLike) await this.strategy.incrementFieldReportLike(reportId); }
  public async incrementReviewLike(reviewId: string) { if (this.strategy.incrementReviewLike) await this.strategy.incrementReviewLike(reviewId); }
  public async deleteReview(reviewId: string) { if (this.strategy.deleteReview) await this.strategy.deleteReview(reviewId); }
  public async deletePost(postId: string) { if (this.strategy.deletePost) await this.strategy.deletePost(postId); }
  public getDongtanApartments(): string[] { return this.strategy.getDongtanApartments ? this.strategy.getDongtanApartments() : []; }
  public isAdmin(email: string | null | undefined): boolean { return this.strategy.isAdmin ? this.strategy.isAdmin(email) : false; }
}

// Default singleton instance
export const dashboardFacade = new DashboardFacade();

// --- React Hook (re-exported for backward compatibility) ---
import { useState, useEffect } from 'react';

/**
 * React hook providing reactive dashboard data.
 * Subscribes to the facade's listener pattern and re-renders on data changes.
 */
export function useDashboardData() {
  const [data, setData] = useState({
    kpis: dashboardFacade.getKPIs(),
    newsFeed: dashboardFacade.getNewsFeed(),
    fieldReports: dashboardFacade.getFieldReports(),
    userReviews: dashboardFacade.getUserReviews(),
    dongtanApartments: dashboardFacade.getDongtanApartments(),
    adBanner: dashboardFacade.getAdBanner(),
  });

  useEffect(() => {
    const unsubscribe = dashboardFacade.subscribe(() => {
      setData({
        kpis: [...dashboardFacade.getKPIs()],
        newsFeed: [...dashboardFacade.getNewsFeed()],
        fieldReports: [...dashboardFacade.getFieldReports()],
        userReviews: [...dashboardFacade.getUserReviews()],
        dongtanApartments: [...dashboardFacade.getDongtanApartments()],
        adBanner: dashboardFacade.getAdBanner(),
      });
    });
    return () => unsubscribe();
  }, []);

  return data;
}
