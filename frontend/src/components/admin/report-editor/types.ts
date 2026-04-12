export type FormValues = {
  dong: string;
  apartmentName: string;
  thumbnailUrl: string;
  scoutingDate: string;
  images: {
    file?: File;
    previewUrl?: string;
    url: string;
    caption: string;
    locationTag: string;
    isPremium: boolean;
    capturedAt?: string;
  }[];
  metrics: {
    brand: string;
    householdCount: string;
    far: string; // 용적률
    bcr: string; // 건폐율
    parkingPerHousehold: string; // 세대당 주차대수
    yearBuilt: string; // 준공연도
    distanceToElementary: string;
    distanceToMiddle: string;
    distanceToHigh: string;
    distanceToSubway: string;
    distanceToIndeokwon: string;
    distanceToTram: string;
    distanceToStarbucks: string;
    distanceToMcDonalds: string;
    distanceToOliveYoung: string;
    distanceToDaiso: string;
    distanceToSupermarket: string;
    starbucksName: string;
    starbucksAddress: string;
    starbucksCoordinates: string;
    mcdonaldsName: string;
    mcdonaldsAddress: string;
    mcdonaldsCoordinates: string;
    oliveYoungName: string;
    oliveYoungAddress: string;
    oliveYoungCoordinates: string;
    daisoName: string;
    daisoAddress: string;
    daisoCoordinates: string;
    supermarketName: string;
    supermarketAddress: string;
    supermarketCoordinates: string;
    academyDensity: string;
    restaurantDensity: string;
  };
  isPremium: boolean;
  premiumContent: string;
};

export interface ApiCategories {
  academyCategories?: Record<string, number>;
  restaurantDensity?: number;
  restaurantCategories?: Record<string, number>;
  nearestSchoolNames?: { elementary?: string; middle?: string; high?: string };
  nearestStationName?: string;
  nearestIndeokwonStationName?: string;
  nearestTramStationName?: string;
}
