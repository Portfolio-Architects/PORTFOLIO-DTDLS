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

// Types (re-export for backward compatibility)
export type { KPIData, NewsItemData, AdBannerData } from '@/lib/types/dashboard.types';
export type { FieldReportData, ReportSections, CommentData } from '@/lib/types/report.types';

// Internal imports
import type { KPIData, NewsItemData, AdBannerData } from '@/lib/types/dashboard.types';
import type { FieldReportData, ReportSections, CommentData } from '@/lib/types/report.types';
import { isAdmin as checkAdmin } from '@/lib/config/admin.config';
import * as PostRepo from '@/lib/repositories/post.repository';
import * as ReportRepo from '@/lib/repositories/report.repository';
import * as CommentRepo from '@/lib/repositories/comment.repository';
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
  getAdBanner(): AdBannerData;
  subscribe?(callback: () => void): () => void;
  addPost?(title: string, category: string, authorUid: string, imageFile?: File): Promise<void>;
  addFieldReport?(apartmentName: string, sections: ReportSections, premiumScores: any, authorUid: string, imageFiles: Record<string, File>): Promise<void>;
  addFieldReportComment?(reportId: string, text: string, authorUid: string): Promise<void>;
  incrementLike?(postId: string): Promise<void>;
  incrementFieldReportLike?(reportId: string): Promise<void>;
  listenToComments?(reportId: string, callback: (comments: CommentData[]) => void): () => void;
  getUserProfile?(uid: string): Promise<{ nickname: string }>;
  getDongtanApartments?(): string[];
  isAdmin(email: string | null | undefined): boolean;
}

// --- Firebase Strategy (delegates to repositories/services) ---

class FirebaseDashboardDataStrategy implements DashboardDataStrategy {
  private kpis: KPIData[];
  private newsFeed: NewsItemData[] = [];
  private fieldReports: FieldReportData[] = [];
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

  async addFieldReport(apartmentName: string, sections: ReportSections, premiumScores: any, authorUid: string, imageFiles: Record<string, File>) {
    try {
      const profile = await UserRepo.getOrCreateProfile(authorUid);

      // Upload images in parallel
      const uploadPromises = Object.entries(imageFiles).map(async ([key, file]) => {
        try {
          const storageRef = ref(storage, `field_reports/${Date.now()}_${key}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          return { key, url: downloadUrl };
        } catch (storageError) {
          logger.error('DashboardFacade.addFieldReport', `Upload failed for ${key}`, undefined, storageError);
          return null;
        }
      });

      const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean) as {key: string, url: string}[];
      const mergedSections = JSON.parse(JSON.stringify(sections)) as ReportSections;
      uploadedImages.forEach(({key, url}) => {
        if (key === 'gateImg') mergedSections.infra.gateImg = url;
        if (key === 'landscapeImg') mergedSections.infra.landscapeImg = url;
        if (key === 'parkingImg') mergedSections.infra.parkingImg = url;
        if (key === 'maintenanceImg') mergedSections.infra.maintenanceImg = url;
        if (key === 'communityImg') mergedSections.ecosystem.communityImg = url;
        if (key === 'schoolImg') mergedSections.ecosystem.schoolImg = url;
        if (key === 'commerceImg') mergedSections.ecosystem.commerceImg = url;
      });

      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebaseConfig');
      await addDoc(collection(db, 'field_reports'), {
        apartmentName,
        sections: mergedSections,
        premiumScores: premiumScores || null,
        authorName: profile?.nickname || '익명',
        authorUid,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      logger.info('DashboardFacade.addFieldReport', 'Field report created', { apartmentName });
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
  public getAdBanner(): AdBannerData { return this.strategy.getAdBanner(); }
  public async addPost(title: string, category: string, authorUid: string, imageFile?: File) { if (this.strategy.addPost) await this.strategy.addPost(title, category, authorUid, imageFile); }
  public async addFieldReport(apartmentName: string, sections: ReportSections, premiumScores: any, authorUid: string, imageFiles: Record<string, File>) { if (this.strategy.addFieldReport) await this.strategy.addFieldReport(apartmentName, sections, premiumScores, authorUid, imageFiles); }
  public async addFieldReportComment(reportId: string, text: string, authorUid: string) { if (this.strategy.addFieldReportComment) await this.strategy.addFieldReportComment(reportId, text, authorUid); }
  public listenToComments(reportId: string, callback: (comments: CommentData[]) => void) { return this.strategy.listenToComments ? this.strategy.listenToComments(reportId, callback) : () => {}; }
  public async getUserProfile(uid: string) { return this.strategy.getUserProfile ? await this.strategy.getUserProfile(uid) : null; }
  public async updateNickname(uid: string, nickname: string) { await UserRepo.updateNickname(uid, nickname); }
  public async updateFrontName(uid: string, frontName: string) { await UserRepo.updateFrontName(uid, frontName); }
  public async updatePhotoURL(uid: string, photoURL: string) { await UserRepo.updatePhotoURL(uid, photoURL); }
  public async incrementLike(postId: string) { if (this.strategy.incrementLike) await this.strategy.incrementLike(postId); }
  public async incrementFieldReportLike(reportId: string) { if (this.strategy.incrementFieldReportLike) await this.strategy.incrementFieldReportLike(reportId); }
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
    dongtanApartments: dashboardFacade.getDongtanApartments(),
    adBanner: dashboardFacade.getAdBanner(),
  });

  useEffect(() => {
    const unsubscribe = dashboardFacade.subscribe(() => {
      setData({
        kpis: [...dashboardFacade.getKPIs()],
        newsFeed: [...dashboardFacade.getNewsFeed()],
        fieldReports: [...dashboardFacade.getFieldReports()],
        dongtanApartments: [...dashboardFacade.getDongtanApartments()],
        adBanner: dashboardFacade.getAdBanner(),
      });
    });
    return () => unsubscribe();
  }, []);

  return data;
}
