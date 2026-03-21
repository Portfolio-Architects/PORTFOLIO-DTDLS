export interface ImageMeta {
  url: string;
  caption: string;
  locationTag?: string;
  isPremium?: boolean; // Can blur this image for non-premium
}

export interface ObjectiveMetrics {
  brand: string; // 아파트 브랜드 (e.g., "래미안", "자이", "롯데캐슬")
  householdCount: number; // 세대수 - e.g., 1200
  far: number; // 용적률
  bcr: number; // 건폐율
  parkingPerHousehold: number; // 세대당 주차대수
  yearBuilt: number; // 준공연도
  distanceToElementary: number; // 초등학교까지의 거리 (미터)
  distanceToMiddle: number; // 중학교까지의 거리 (미터)
  distanceToHigh: number; // 고등학교까지의 거리 (미터)
  distanceToSubway: number; // GTX-A/SRT역까지의 거리 (미터)
  academyDensity: number; // 반경 500m 내 학원 개수
  academyCategories?: Record<string, number>; // 카테고리별 학원 수
  restaurantDensity?: number; // 반경 500m 내 음식점/카페 수
  restaurantCategories?: Record<string, number>; // 카테고리별 (한식, 카페 등)
  distanceToIndeokwon?: number; // 동탄인덕원선 거리 (m)
  distanceToTram?: number; // 동탄트램 거리 (m)
  nearestSchoolNames?: {
    elementary?: string;
    middle?: string;
    high?: string;
  };
  nearestStationName?: string;
}

export interface AdSlot {
  bannerUrl: string;
  targetLink: string;
  isActive: boolean;
}

export interface ScoutingReport {
  id?: string;
  dong: string; // 행정동/법정동 (e.g., "오산동")
  apartmentName: string; // e.g., "동탄역 롯데캐슬"
  thumbnailUrl: string;
  images: ImageMeta[];
  metrics: ObjectiveMetrics;
  premiumContent?: string;
  premiumScores?: import('../utils/scoring').PremiumScores; // Calculated via Server Action before save
  isPremium: boolean;
  adSlot?: AdSlot;
  authorUid: string;
  createdAt: number;
  updatedAt: number;
}
