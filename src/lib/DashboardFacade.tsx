import { TrendingUp, Users, RefreshCw, Train, Building, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

// --- Configuration ---
export const ADMIN_EMAILS = ['ocs5672@gmail.com']; // Admin Google Email

// --- Types & Interfaces ---

export interface KPIData {
  id: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeStyle?: string;
  mainValue: string | React.ReactNode;
  subValue: string | React.ReactNode;
  description: string | React.ReactNode;
  icon: React.ElementType;
  gradientBackground: string;
  borderColor: string;
  titleColor: string;
}

export interface NewsItemData {
  id: string;
  title: string;
  meta: string; // e.g., "방금 전 · 부동산"
  author: string; // The anonymous nickname
  imageUrl?: string;
  tagClass: string;
  icon: React.ElementType;
  likes?: number;
}

export interface CommentData {
  id: string;
  text: string;
  author: string;
  createdAt: any;
}

export interface FieldReportData {
  id: string;
  apartmentName: string;
  pros: string;
  cons: string;
  rating: number;
  author: string;
  likes: number;
  commentCount: number;
  comments?: CommentData[];
  imageUrl?: string;
  createdAt: any;
}

export interface AdBannerData {
  title: string;
  description: string;
  buttonText: string;
}

// --- Strategies ---

export interface DashboardDataStrategy {
  getKPIs(): KPIData[];
  getNewsFeed(): NewsItemData[];
  getFieldReports?(): FieldReportData[];
  getAdBanner(): AdBannerData;
  subscribe?(callback: () => void): () => void;
  addPost?(title: string, category: string, authorUid: string, imageFile?: File): Promise<void>;
  addFieldReport?(apartmentName: string, pros: string, cons: string, rating: number, authorUid: string, imageFile?: File): Promise<void>;
  addFieldReportComment?(reportId: string, text: string, authorUid: string): Promise<void>;
  incrementLike?(postId: string): Promise<void>;
  incrementFieldReportLike?(reportId: string): Promise<void>;
  listenToComments?(reportId: string, callback: (comments: CommentData[]) => void): () => void;
  getUserProfile?(uid: string): Promise<{ nickname: string }>;
  getDongtanApartments?(): string[];
  isAdmin(email: string | null | undefined): boolean;
}

class FirebaseDashboardDataStrategy implements DashboardDataStrategy {
  private kpis: KPIData[];
  private newsFeed: NewsItemData[] = [];
  private fieldReports: FieldReportData[] = [];
  private dongtanApartments: string[] = []; // Cached list of apt names
  private listeners: (() => void)[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private unsubscribeFieldReports: (() => void) | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Keep the simulated KPI logic running
    this.kpis = [
      {
        id: 'kpi-1',
        title: '금주의 신고가',
        subtitle: '동탄역 롯데캐슬 84㎡',
        badgeText: 'HOT',
        badgeStyle: 'bg-[#f04452] text-white',
        mainValue: (
          <>
            16.5<span className="text-[18px] font-semibold text-[#191f28]">억</span>
          </>
        ),
        subValue: <span className="text-[13px] text-[#f04452] font-semibold tracking-normal ml-1">↑ 2.1억</span>,
        description: '이전 최고가: 14.4억 (24년 10월)',
        icon: TrendingUp,
        gradientBackground: 'from-[#ffffff] to-[#fff5f5]',
        borderColor: 'border-[#ffebec]',
        titleColor: 'text-[#f04452]',
      },
      {
        id: 'kpi-2',
        title: '신혼 추천 아파트',
        subtitle: '가성비 20평대 · 전세 3억대',
        mainValue: (
          <>
            1. 반도유보라 아이비파크 2.0<br />
            2. 금강펜테리움 센트럴파크
          </>
        ),
        subValue: '',
        description: <span className="text-[12px] text-[#3182f6] mt-2 font-medium cursor-pointer hover:underline">자세히 보기 →</span>,
        icon: Users,
        gradientBackground: 'from-[#ffffff] to-[#f4f8ff]',
        borderColor: 'border-[#e8f3ff]',
        titleColor: 'text-[#3182f6]',
      },
      {
        id: 'kpi-3',
        title: '동탄 시장 온도',
        subtitle: '주간 아파트 거래량',
        badgeText: '매수자 우위',
        badgeStyle: 'bg-[#e8f5e9] text-[#03c75a]',
        mainValue: (
          <>
            142<span className="text-[18px] font-semibold text-[#191f28]">건</span>
          </>
        ),
        subValue: <span className="text-[13px] text-[#03c75a] font-semibold tracking-normal ml-1">↑ 12%</span>,
        description: (
          <div className="w-full bg-[#f2f4f6] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-[#03c75a] h-full rounded-full" style={{ width: '65%' }}></div>
          </div>
        ),
        icon: RefreshCw,
        gradientBackground: '',
        borderColor: '',
        titleColor: 'text-[#03c75a]',
      },
    ];

    this.startKPISimulation();
    this.startFirestoreListener();
    this.startFieldReportListener();
    this.fetchDongtanApartments(); // Fetch real estate API
  }

  private startKPISimulation() {
    const fakeData = [
      { subtitle: '동탄역 예미지시그널 84㎡', price: '13.2', up: '1.5억', prev: '11.7억 (새해 첫 거래)' },
      { subtitle: '동탄호수공원 아이파크 84㎡', price: '11.8', up: '0.8억', prev: '11.0억 (작년 최고가)' },
      { subtitle: '동탄역 롯데캐슬 84㎡', price: '16.5', up: '2.1억', prev: '14.4억 (24년 10월)' }
    ];

    let index = 0;
    this.intervalId = setInterval(() => {
      index = (index + 1) % fakeData.length;
      const data = fakeData[index];
      
      this.kpis[0] = {
        ...this.kpis[0],
        subtitle: data.subtitle,
        mainValue: (
          <>
            {data.price}<span className="text-[18px] font-semibold text-[#191f28]">억</span>
          </>
        ),
        subValue: <span className="text-[13px] text-[#f04452] font-semibold tracking-normal ml-1">↑ {data.up}</span>,
        description: `이전 최고가: ${data.prev}`,
        badgeStyle: 'bg-[#f04452] text-white animate-pulse',
      };
      
      this.notifyListeners();
    }, 5000);
  }

  private startFirestoreListener() {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10));
    
    this.unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const fetchedNews: NewsItemData[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        let icon = MessageSquare;
        let tagClass = 'tag-culture';
        
        if (data.category === '교통') { icon = Train; tagClass = 'tag-traffic'; }
        else if (data.category === '부동산') { icon = Building; tagClass = 'tag-realestate'; }
        else if (data.category === '교육') { icon = BookOpen; tagClass = 'tag-edu'; }

        // Format relative time (very simple mock for now)
        const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString() : '방금 전';

        fetchedNews.push({
          id: doc.id,
          title: data.title,
          meta: `${dateStr} · ${data.category}`,
          author: data.authorName || '익명',
          imageUrl: data.imageUrl,
          tagClass,
          icon,
          likes: data.likes || 0
        });
      });
      
      this.newsFeed = fetchedNews;
      this.notifyListeners();
    });
  }

  private startFieldReportListener() {
    const q = query(collection(db, 'field_reports'), orderBy('createdAt', 'desc'), limit(10));
    
    this.unsubscribeFieldReports = onSnapshot(q, (snapshot) => {
      const fetchedReports: FieldReportData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedReports.push({
          id: doc.id,
          apartmentName: data.apartmentName,
          pros: data.pros,
          cons: data.cons,
          rating: data.rating,
          author: data.authorName,
          likes: data.likes || 0,
          commentCount: data.commentCount || 0,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString() : '방금 전'
        });
      });
      this.fieldReports = fetchedReports;
      this.notifyListeners();
    });
  }

  // --- Real Estate Open API (MOLIT) ---
  private async fetchDongtanApartments() {
    try {
      const API_KEY = '4611c02045e69b5e6c0bf50b9ecbee6de92e7ee0351eb8a7d529253340f755ff';
      const LAWD_CD = '41590'; // 화성시
      const DEAL_YMD = '202401'; // 2024년 1월 기준 (Recent snapshot)
      const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=${API_KEY}&pageNo=1&numOfRows=1000&LAWD_CD=${LAWD_CD}&DEAL_YMD=${DEAL_YMD}`;
      
      // Enforce a strict 3-second timeout so the UI never hangs indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const text = await response.text();
        
        // Since it's XML, parse it manually or via DOMParser in browser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const items = xmlDoc.getElementsByTagName("item");
      
      if (items.length === 0) {
        throw new Error("API returned no items (Auth Error or Ratelimit).");
      }
      
      const aptSet = new Set<string>();
      for (let i = 0; i < items.length; i++) {
        const aptNmNode = items[i].getElementsByTagName("aptNm")[0];
        const dongNode = items[i].getElementsByTagName("umdNm")[0]; // 법정동 (e.g., 오산동, 영천동 - Dongtan)

        if (aptNmNode && dongNode) {
          const aptNm = aptNmNode.textContent?.trim();
          const dongNm = dongNode.textContent?.trim() || '';
          
          // Filter rudimentary Hwaseong to just Dongtan specific Dongs if possible, or include them all.
          // For MVP, we'll keep it broad Hwaseong but suffix with Dong.
          if (aptNm) {
            aptSet.add(`[${dongNm}] ${aptNm}`);
          }
        }
      }

      this.dongtanApartments = Array.from(aptSet).sort();
      this.notifyListeners();
      console.log(`Fetched ${this.dongtanApartments.length} apartments from Open API.`);
      } catch (innerError) {
        clearTimeout(timeoutId);
        throw innerError; // Rethrow to hit the main catch block and trigger fallback
      }
      
    } catch (error) {
      console.warn("Failed to fetch Dongtan apartments from API, using fallback:", error);
      // Fallback curated list in case of network/key failure
      this.dongtanApartments = [
        "[오산동] 동탄역 롯데캐슬", "[청계동] 동탄역 시범더샵센트럴시티", "[청계동] 동탄역 시범한화꿈에그린프레스티지",
        "[오산동] 동탄역 반도유보라 아이비파크 5.0", "[오산동] 동탄역 반도유보라 아이비파크 6.0",
        "[오산동] 동탄역 반도유보라 아이비파크 7.0", "[오산동] 동탄역 반도유보라 아이비파크 8.0",
        "[영천동] 동탄역 센트럴푸르지오", "[송동] 동탄린스트라우스더레이크", "[산척동] 동탄호수공원 아이파크"
      ];
      this.notifyListeners();
    }
  }

  // --- Anonymous Profile Generator ---
  private generateRandomNickname(): string {
    const adjs = ["동탄사는", "행복한", "투자하는", "지혜로운", "빠른", "냉철한", "따뜻한", "친절한", "열정적인", "똑똑한"];
    const nouns = ["사자", "코끼리", "호랑이", "부린이", "분석가", "요정", "자본가", "강아지", "고양이", "독수리"];
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
  }

  public async getUserProfile(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as { nickname: string };
    } else {
      // First login! Generate a profile.
      const newProfile = {
        nickname: this.generateRandomNickname(),
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, newProfile);
      return { nickname: newProfile.nickname };
    }
  }

  public async addPost(title: string, category: string, authorUid: string, imageFile?: File) {
    try {
      console.log('Attempting to add post to Firestore...', title, category);
      
      // 1. Fetch user profile for nickname
      const profile = await this.getUserProfile(authorUid);
      
      // 2. Upload image if exists
      let imageUrl = null;
      if (imageFile) {
        const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log("Image uploaded to:", imageUrl);
      }

      // 3. Save post object
      await addDoc(collection(db, 'posts'), {
        title,
        category,
        authorName: profile.nickname,
        authorUid: authorUid,
        imageUrl: imageUrl,
        likes: 0,
        createdAt: serverTimestamp()
      });
      
      console.log('Post added successfully!');
    } catch (e: any) {
      console.error("Error adding document: ", e);
      alert("글 저장 실패! 이유: " + e.message);
    }
  }

  public async addFieldReport(apartmentName: string, pros: string, cons: string, rating: number, authorUid: string, imageFile?: File) {
    try {
      const profile = await this.getUserProfile(authorUid);

      let imageUrl = null;
      if (imageFile) {
        try {
           const storageRef = ref(storage, `field_reports/${Date.now()}_${imageFile.name}`);
           const snapshot = await uploadBytes(storageRef, imageFile);
           imageUrl = await getDownloadURL(snapshot.ref);
           console.log("Field report image uploaded to:", imageUrl);
        } catch (storageError) {
           console.error("Storage upload failed (possibly firewall). Proceeding without image.", storageError);
           // We'll proceed without image URL if storage fails, so the user isn't completely blocked
        }
      }

      await addDoc(collection(db, 'field_reports'), {
        apartmentName,
        pros,
        cons,
        rating,
        authorName: profile.nickname,
        authorUid,
        imageUrl: imageUrl,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });
    } catch (e: any) {
      console.error("Error adding field report: ", e);
      alert("임장기 저장 실패! 이유: " + e.message);
    }
  }

  public async addFieldReportComment(reportId: string, text: string, authorUid: string) {
    try {
      const profile = await this.getUserProfile(authorUid);
      const commentsRef = collection(db, `field_reports/${reportId}/comments`);
      await addDoc(commentsRef, {
        text,
        authorName: profile.nickname,
        authorUid,
        createdAt: serverTimestamp()
      });
      
      // Increment comment count
      await updateDoc(doc(db, 'field_reports', reportId), {
        commentCount: increment(1)
      });
    } catch (e: any) {
      console.error("Error adding comment: ", e);
      alert("댓글 저장 실패! 이유: " + e.message);
    }
  }

  public listenToComments(reportId: string, callback: (comments: CommentData[]) => void) {
    const q = query(collection(db, `field_reports/${reportId}/comments`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const comments: CommentData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          text: data.text,
          author: data.authorName,
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleTimeString() : '방금 전'
        });
      });
      callback(comments);
    });
  }

  public async incrementLike(postId: string) {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (e) {
      console.error("Error incrementing like: ", e);
    }
  }

  public async incrementFieldReportLike(reportId: string) {
    try {
      const reportRef = doc(db, 'field_reports', reportId);
      await updateDoc(reportRef, {
        likes: increment(1)
      });
    } catch (e) {
      console.error("Error incrementing field report like: ", e);
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
      // In a real robust app, we'd also unmount intervallic calls if there are 0 listeners
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  getKPIs(): KPIData[] {
    return this.kpis;
  }

  getNewsFeed(): NewsItemData[] {
    if (this.newsFeed.length === 0) {
       return [
        { id: 'news-1', title: '동탄트램 1,2호선 기본설계 완료, 년말 착공 목표', meta: '2시간 전 · 교통', author: '똑똑한 요정', tagClass: 'tag-traffic', icon: Train },
        { id: 'news-2', title: '동탄호수공원 주변 상권 활성화, 신규 브랜드 입점 줄이어', meta: '5시간 전 · 부동산', author: '행복한 고양이', tagClass: 'tag-realestate', icon: Building },
        { id: 'news-3', title: '동탄2신도시 과밀학급 해소 위해 임시 모듈러 교실 추가 도입', meta: '1일 전 · 교육', author: '동탄사는 사자', tagClass: 'tag-edu', icon: BookOpen },
        { id: 'news-4', title: '주말 동탄 여울공원 달빛산책 축제 개최 안내', meta: '1일 전 · 문화', author: '열정적인 부린이', tagClass: 'tag-culture', icon: Calendar },
      ];
    }
    return this.newsFeed;
  }

  getFieldReports(): FieldReportData[] {
    if (this.fieldReports.length === 0) {
      return [
        {
          id: 'mock-fr-1',
          apartmentName: '동탄역 아이파크',
          pros: '도보 10분 쾌적한 출퇴근 거리, 조경이 공원같음 🌲',
          cons: '초등학교가 횡단보도를 건너야 함, 약간의 층간소음',
          rating: 4,
          author: '지혜로운 사자',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=300&fit=crop',
          likes: 12,
          commentCount: 3,
          createdAt: '3시간 전'
        }
      ];
    }
    return this.fieldReports;
  }

  getDongtanApartments(): string[] {
    return this.dongtanApartments;
  }

  getAdBanner(): AdBannerData {
    return {
      title: '동탄센트럴파크 앞 프리미엄 치과 오픈!',
      description: '최첨단 장비와 분야별 전문의 협진. 첫 방문 고객 스케일링 이벤트 중',
      buttonText: '예약하기',
    };
  }

  isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
  }
}

// --- Facade ---

export class DashboardFacade {
  private strategy: DashboardDataStrategy;

  constructor(strategy?: DashboardDataStrategy) {
    this.strategy = strategy || new FirebaseDashboardDataStrategy();
  }

  public setStrategy(strategy: DashboardDataStrategy) {
    this.strategy = strategy;
  }

  public subscribe(callback: () => void) {
    if (this.strategy.subscribe) {
      return this.strategy.subscribe(callback);
    }
    return () => {};
  }

  public getKPIs(): KPIData[] {
    return this.strategy.getKPIs();
  }

  public getNewsFeed(): NewsItemData[] {
    return this.strategy.getNewsFeed();
  }

  public getFieldReports(): FieldReportData[] {
    if (this.strategy.getFieldReports) {
      return this.strategy.getFieldReports();
    }
    return [];
  }

  public getAdBanner(): AdBannerData {
    return this.strategy.getAdBanner();
  }

  public async addPost(title: string, category: string, authorUid: string, imageFile?: File) {
    if (this.strategy.addPost) {
      await this.strategy.addPost(title, category, authorUid, imageFile);
    }
  }

  public async addFieldReport(apartmentName: string, pros: string, cons: string, rating: number, authorUid: string, imageFile?: File) {
    if (this.strategy.addFieldReport) {
      await this.strategy.addFieldReport(apartmentName, pros, cons, rating, authorUid, imageFile);
    }
  }

  public async addFieldReportComment(reportId: string, text: string, authorUid: string) {
    if (this.strategy.addFieldReportComment) {
      await this.strategy.addFieldReportComment(reportId, text, authorUid);
    }
  }

  public listenToComments(reportId: string, callback: (comments: CommentData[]) => void) {
    if (this.strategy.listenToComments) {
      return this.strategy.listenToComments(reportId, callback);
    }
    return () => {};
  }

  public async getUserProfile(uid: string) {
    if (this.strategy.getUserProfile) {
      return await this.strategy.getUserProfile(uid);
    }
    return null;
  }

  public async incrementLike(postId: string) {
    if (this.strategy.incrementLike) {
      await this.strategy.incrementLike(postId);
    }
  }

  public async incrementFieldReportLike(reportId: string) {
    if (this.strategy.incrementFieldReportLike) {
      await this.strategy.incrementFieldReportLike(reportId);
    }
  }

  public getDongtanApartments(): string[] {
    if (this.strategy.getDongtanApartments) {
      return this.strategy.getDongtanApartments();
    }
    return [];
  }

  public isAdmin(email: string | null | undefined): boolean {
    if (this.strategy.isAdmin) {
      return this.strategy.isAdmin(email);
    }
    return false;
  }
}

// Default instance for easy import
export const dashboardFacade = new DashboardFacade();

// --- Hooks ---
export function useDashboardData() {
  const [data, setData] = useState({
    kpis: dashboardFacade.getKPIs(),
    newsFeed: dashboardFacade.getNewsFeed(),
    fieldReports: dashboardFacade.getFieldReports(),
    dongtanApartments: dashboardFacade.getDongtanApartments(),
    adBanner: dashboardFacade.getAdBanner(),
  });

  useEffect(() => {
    // Since Firebase might take a second to load the initial list, trigger a first update manually if needed
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
