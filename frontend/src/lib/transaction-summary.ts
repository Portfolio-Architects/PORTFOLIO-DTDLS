/**
 * 실거래가 요약 데이터 — 빌드 타임에 포함, API 호출 0
 * 
 * ⚠️ 이 파일은 자동 생성됩니다. 직접 수정하지 마세요!
 * 동기화: npm run sync-transactions
 * 마지막 동기화: 2026-03-16
 */

export interface RecentTx {
  date: string;
  priceEok: string;
  areaPyeong: number;
  floor: number;
  area: number;
}

export interface AptTxSummary {
  latestPrice: number;
  latestPriceEok: string;
  latestArea: number;
  latestFloor: number;
  latestDate: string;
  maxPrice: number;
  maxPriceEok: string;
  minPrice: number;
  minPriceEok: string;
  txCount: number;
  recent: RecentTx[];
}

/** 아파트명 → 거래 요약 */
export const TX_SUMMARY: Record<string, AptTxSummary> = {
  "동탄2디에트르포레": {
    "latestPrice": 40300,
    "latestPriceEok": "4억300",
    "latestArea": 16.9,
    "latestFloor": 5,
    "latestDate": "20260313",
    "maxPrice": 46500,
    "maxPriceEok": "4억6,500",
    "minPrice": 34000,
    "minPriceEok": "3억4,000",
    "txCount": 62,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "4억300",
        "areaPyeong": 16.9,
        "floor": 5,
        "area": 55.97
      },
      {
        "date": "03.11",
        "priceEok": "4억3,000",
        "areaPyeong": 16.9,
        "floor": 3,
        "area": 55.99
      },
      {
        "date": "03.10",
        "priceEok": "4억3,500",
        "areaPyeong": 16.9,
        "floor": 2,
        "area": 55.99
      },
      {
        "date": "03.07",
        "priceEok": "4억3,800",
        "areaPyeong": 16.9,
        "floor": 17,
        "area": 55.97
      }
    ]
  },
  "힐스테이트동탄역": {
    "latestPrice": 50000,
    "latestPriceEok": "5억",
    "latestArea": 16.6,
    "latestFloor": 17,
    "latestDate": "20260312",
    "maxPrice": 61000,
    "maxPriceEok": "6억1,000",
    "minPrice": 30000,
    "minPriceEok": "3억",
    "txCount": 143,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "5억",
        "areaPyeong": 16.6,
        "floor": 17,
        "area": 54.9749
      },
      {
        "date": "03.09",
        "priceEok": "5억5,000",
        "areaPyeong": 16.5,
        "floor": 28,
        "area": 54.5533
      },
      {
        "date": "03.06",
        "priceEok": "5억2,500",
        "areaPyeong": 16.5,
        "floor": 35,
        "area": 54.4202
      },
      {
        "date": "03.06",
        "priceEok": "5억1,800",
        "areaPyeong": 16.5,
        "floor": 10,
        "area": 54.4202
      }
    ]
  },
  "푸른마을모아미래도": {
    "latestPrice": 46000,
    "latestPriceEok": "4억6,000",
    "latestArea": 25.3,
    "latestFloor": 4,
    "latestDate": "20260312",
    "maxPrice": 61000,
    "maxPriceEok": "6억1,000",
    "minPrice": 16570,
    "minPriceEok": "1억6,570",
    "txCount": 1427,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "4억6,000",
        "areaPyeong": 25.3,
        "floor": 4,
        "area": 83.737
      },
      {
        "date": "03.06",
        "priceEok": "4억6,300",
        "areaPyeong": 17.9,
        "floor": 24,
        "area": 59.039
      },
      {
        "date": "03.05",
        "priceEok": "4억5,900",
        "areaPyeong": 17.9,
        "floor": 14,
        "area": 59.039
      },
      {
        "date": "02.26",
        "priceEok": "5억3,000",
        "areaPyeong": 25.3,
        "floor": 7,
        "area": 83.737
      }
    ]
  },
  "푸르지오": {
    "latestPrice": 57500,
    "latestPriceEok": "5억7,500",
    "latestArea": 17.5,
    "latestFloor": 25,
    "latestDate": "20260312",
    "maxPrice": 78000,
    "maxPriceEok": "7억8,000",
    "minPrice": 16200,
    "minPriceEok": "1억6,200",
    "txCount": 1373,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "5억7,500",
        "areaPyeong": 17.5,
        "floor": 25,
        "area": 57.8
      },
      {
        "date": "03.07",
        "priceEok": "6억9,000",
        "areaPyeong": 25.4,
        "floor": 21,
        "area": 84.065
      },
      {
        "date": "03.07",
        "priceEok": "5억5,000",
        "areaPyeong": 18,
        "floor": 6,
        "area": 59.556
      },
      {
        "date": "03.07",
        "priceEok": "6억1,500",
        "areaPyeong": 17.5,
        "floor": 8,
        "area": 57.8
      }
    ]
  },
  "제일풍경채에듀앤파크": {
    "latestPrice": 47700,
    "latestPriceEok": "4억7,700",
    "latestArea": 18,
    "latestFloor": 17,
    "latestDate": "20260312",
    "maxPrice": 72200,
    "maxPriceEok": "7억2,200",
    "minPrice": 27300,
    "minPriceEok": "2억7,300",
    "txCount": 195,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "4억7,700",
        "areaPyeong": 18,
        "floor": 17,
        "area": 59.5765
      },
      {
        "date": "03.08",
        "priceEok": "5억6,700",
        "areaPyeong": 23.1,
        "floor": 16,
        "area": 76.3605
      },
      {
        "date": "02.23",
        "priceEok": "4억6,900",
        "areaPyeong": 18,
        "floor": 18,
        "area": 59.5765
      },
      {
        "date": "02.14",
        "priceEok": "4억4,300",
        "areaPyeong": 18,
        "floor": 6,
        "area": 59.5765
      }
    ]
  },
  "레이크힐 반도유보라 아이비파크 10.2": {
    "latestPrice": 50000,
    "latestPriceEok": "5억",
    "latestArea": 29.3,
    "latestFloor": 6,
    "latestDate": "20260312",
    "maxPrice": 87800,
    "maxPriceEok": "8억7,800",
    "minPrice": 33279,
    "minPriceEok": "3억3,279",
    "txCount": 478,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "5억",
        "areaPyeong": 29.3,
        "floor": 6,
        "area": 96.6996
      },
      {
        "date": "03.12",
        "priceEok": "5억3,500",
        "areaPyeong": 25.7,
        "floor": 9,
        "area": 84.9991
      },
      {
        "date": "03.10",
        "priceEok": "5억500",
        "areaPyeong": 29.3,
        "floor": 1,
        "area": 96.7859
      },
      {
        "date": "03.09",
        "priceEok": "5억3,500",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.9991
      }
    ]
  },
  "동탄역시범호반써밋": {
    "latestPrice": 111500,
    "latestPriceEok": "11억1,500",
    "latestArea": 25.7,
    "latestFloor": 6,
    "latestDate": "20260312",
    "maxPrice": 125000,
    "maxPriceEok": "12억5,000",
    "minPrice": 45000,
    "minPriceEok": "4억5,000",
    "txCount": 666,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "11억1,500",
        "areaPyeong": 25.7,
        "floor": 6,
        "area": 84.9537
      },
      {
        "date": "03.07",
        "priceEok": "11억2,900",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.9537
      },
      {
        "date": "02.27",
        "priceEok": "11억",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.9698
      },
      {
        "date": "02.26",
        "priceEok": "11억6,000",
        "areaPyeong": 25.7,
        "floor": 9,
        "area": 84.9537
      }
    ]
  },
  "동탄역 신미주": {
    "latestPrice": 56000,
    "latestPriceEok": "5억6,000",
    "latestArea": 25.7,
    "latestFloor": 7,
    "latestDate": "20260312",
    "maxPrice": 76000,
    "maxPriceEok": "7억6,000",
    "minPrice": 19500,
    "minPriceEok": "1억9,500",
    "txCount": 357,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "5억6,000",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.896
      },
      {
        "date": "03.07",
        "priceEok": "5억7,700",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.896
      },
      {
        "date": "03.05",
        "priceEok": "5억2,000",
        "areaPyeong": 25.7,
        "floor": 1,
        "area": 84.896
      },
      {
        "date": "02.25",
        "priceEok": "5억8,700",
        "areaPyeong": 25.7,
        "floor": 6,
        "area": 84.896
      }
    ]
  },
  "동탄숲속마을자연앤경남아너스빌(1124-0)": {
    "latestPrice": 54400,
    "latestPriceEok": "5억4,400",
    "latestArea": 23.1,
    "latestFloor": 19,
    "latestDate": "20260312",
    "maxPrice": 69000,
    "maxPriceEok": "6억9,000",
    "minPrice": 17320,
    "minPriceEok": "1억7,320",
    "txCount": 489,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "5억4,400",
        "areaPyeong": 23.1,
        "floor": 19,
        "area": 76.51
      },
      {
        "date": "03.02",
        "priceEok": "5억7,000",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.55
      },
      {
        "date": "02.26",
        "priceEok": "5억5,000",
        "areaPyeong": 23.1,
        "floor": 19,
        "area": 76.51
      },
      {
        "date": "02.21",
        "priceEok": "5억2,900",
        "areaPyeong": 23.1,
        "floor": 3,
        "area": 76.51
      }
    ]
  },
  "동탄2신도시호반베르디움22단지": {
    "latestPrice": 53500,
    "latestPriceEok": "5억3,500",
    "latestArea": 16.2,
    "latestFloor": 1,
    "latestDate": "20260312",
    "maxPrice": 64900,
    "maxPriceEok": "6억4,900",
    "minPrice": 27468,
    "minPriceEok": "2억7,468",
    "txCount": 507,
    "recent": [
      {
        "date": "03.12",
        "priceEok": "5억3,500",
        "areaPyeong": 16.2,
        "floor": 1,
        "area": 53.4754
      },
      {
        "date": "03.07",
        "priceEok": "5억6,500",
        "areaPyeong": 16.2,
        "floor": 19,
        "area": 53.4754
      },
      {
        "date": "03.07",
        "priceEok": "5억6,500",
        "areaPyeong": 16.2,
        "floor": 12,
        "area": 53.4754
      },
      {
        "date": "03.07",
        "priceEok": "5억4,000",
        "areaPyeong": 16.2,
        "floor": 18,
        "area": 53.4754
      }
    ]
  },
  "한신더휴": {
    "latestPrice": 65000,
    "latestPriceEok": "6억5,000",
    "latestArea": 25.2,
    "latestFloor": 2,
    "latestDate": "20260311",
    "maxPrice": 80900,
    "maxPriceEok": "8억900",
    "minPrice": 37465,
    "minPriceEok": "3억7,465",
    "txCount": 309,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "6억5,000",
        "areaPyeong": 25.2,
        "floor": 2,
        "area": 83.4162
      },
      {
        "date": "03.02",
        "priceEok": "6억9,850",
        "areaPyeong": 25.2,
        "floor": 22,
        "area": 83.4162
      },
      {
        "date": "03.02",
        "priceEok": "6억9,500",
        "areaPyeong": 25.2,
        "floor": 21,
        "area": 83.4162
      },
      {
        "date": "02.26",
        "priceEok": "6억8,300",
        "areaPyeong": 23.1,
        "floor": 12,
        "area": 76.4713
      }
    ]
  },
  "자연앤데시앙": {
    "latestPrice": 55700,
    "latestPriceEok": "5억5,700",
    "latestArea": 25.7,
    "latestFloor": 28,
    "latestDate": "20260311",
    "maxPrice": 67000,
    "maxPriceEok": "6억7,000",
    "minPrice": 15900,
    "minPriceEok": "1억5,900",
    "txCount": 2064,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "5억5,700",
        "areaPyeong": 25.7,
        "floor": 28,
        "area": 84.94
      },
      {
        "date": "03.11",
        "priceEok": "4억8,200",
        "areaPyeong": 18,
        "floor": 11,
        "area": 59.52
      },
      {
        "date": "03.10",
        "priceEok": "4억8,800",
        "areaPyeong": 22.6,
        "floor": 27,
        "area": 74.6
      },
      {
        "date": "03.06",
        "priceEok": "5억2,000",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.94
      }
    ]
  },
  "엔에이치에프경남아너스빌": {
    "latestPrice": 47000,
    "latestPriceEok": "4억7,000",
    "latestArea": 18.1,
    "latestFloor": 17,
    "latestDate": "20260311",
    "maxPrice": 47000,
    "maxPriceEok": "4억7,000",
    "minPrice": 47000,
    "minPriceEok": "4억7,000",
    "txCount": 1,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "4억7,000",
        "areaPyeong": 18.1,
        "floor": 17,
        "area": 59.76
      }
    ]
  },
  "서희스타힐스엔에이치에프": {
    "latestPrice": 61300,
    "latestPriceEok": "6억1,300",
    "latestArea": 25.7,
    "latestFloor": 18,
    "latestDate": "20260311",
    "maxPrice": 64800,
    "maxPriceEok": "6억4,800",
    "minPrice": 55000,
    "minPriceEok": "5억5,000",
    "txCount": 27,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "6억1,300",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.97
      },
      {
        "date": "03.07",
        "priceEok": "5억8,800",
        "areaPyeong": 22.7,
        "floor": 15,
        "area": 74.94
      },
      {
        "date": "02.27",
        "priceEok": "5억5,000",
        "areaPyeong": 22.7,
        "floor": 11,
        "area": 74.94
      },
      {
        "date": "02.03",
        "priceEok": "5억6,200",
        "areaPyeong": 22.7,
        "floor": 10,
        "area": 74.94
      }
    ]
  },
  "동탄호수자이파밀리에": {
    "latestPrice": 56500,
    "latestPriceEok": "5억6,500",
    "latestArea": 18.1,
    "latestFloor": 2,
    "latestDate": "20260311",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 27300,
    "minPriceEok": "2억7,300",
    "txCount": 515,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "5억6,500",
        "areaPyeong": 18.1,
        "floor": 2,
        "area": 59.96
      },
      {
        "date": "03.08",
        "priceEok": "4억6,000",
        "areaPyeong": 15.7,
        "floor": 9,
        "area": 51.75
      },
      {
        "date": "03.06",
        "priceEok": "5억8,500",
        "areaPyeong": 18.1,
        "floor": 7,
        "area": 59.96
      },
      {
        "date": "03.02",
        "priceEok": "6억1,500",
        "areaPyeong": 18,
        "floor": 13,
        "area": 59.64
      }
    ]
  },
  "동탄푸른마을신일해피트리": {
    "latestPrice": 40800,
    "latestPriceEok": "4억800",
    "latestArea": 17.9,
    "latestFloor": 13,
    "latestDate": "20260311",
    "maxPrice": 68000,
    "maxPriceEok": "6억8,000",
    "minPrice": 14012,
    "minPriceEok": "1억4,012",
    "txCount": 1795,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "4억800",
        "areaPyeong": 17.9,
        "floor": 13,
        "area": 59.05
      },
      {
        "date": "03.02",
        "priceEok": "4억4,500",
        "areaPyeong": 17.9,
        "floor": 17,
        "area": 59.05
      },
      {
        "date": "02.27",
        "priceEok": "5억1,500",
        "areaPyeong": 25.2,
        "floor": 17,
        "area": 83.21
      },
      {
        "date": "02.13",
        "priceEok": "5억1,500",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.88
      }
    ]
  },
  "동탄퍼스트파크": {
    "latestPrice": 40000,
    "latestPriceEok": "4억",
    "latestArea": 22,
    "latestFloor": 3,
    "latestDate": "20260311",
    "maxPrice": 55800,
    "maxPriceEok": "5억5,800",
    "minPrice": 10300,
    "minPriceEok": "1억300",
    "txCount": 838,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "4억",
        "areaPyeong": 22,
        "floor": 3,
        "area": 72.5957
      },
      {
        "date": "03.10",
        "priceEok": "4억1,500",
        "areaPyeong": 22,
        "floor": 9,
        "area": 72.5957
      },
      {
        "date": "03.07",
        "priceEok": "4억2,000",
        "areaPyeong": 22,
        "floor": 10,
        "area": 72.5957
      },
      {
        "date": "02.27",
        "priceEok": "4억4,900",
        "areaPyeong": 22,
        "floor": 7,
        "area": 72.5957
      }
    ]
  },
  "동탄파크한양수자인": {
    "latestPrice": 51000,
    "latestPriceEok": "5억1,000",
    "latestArea": 25.6,
    "latestFloor": 7,
    "latestDate": "20260311",
    "maxPrice": 71800,
    "maxPriceEok": "7억1,800",
    "minPrice": 23171,
    "minPriceEok": "2억3,171",
    "txCount": 289,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "5억1,000",
        "areaPyeong": 25.6,
        "floor": 7,
        "area": 84.65
      },
      {
        "date": "03.06",
        "priceEok": "4억5,000",
        "areaPyeong": 18.1,
        "floor": 11,
        "area": 59.73
      },
      {
        "date": "03.02",
        "priceEok": "4억5,000",
        "areaPyeong": 22.7,
        "floor": 1,
        "area": 74.92
      },
      {
        "date": "03.02",
        "priceEok": "4억500",
        "areaPyeong": 15.7,
        "floor": 13,
        "area": 51.79
      }
    ]
  },
  "동탄역센트럴상록아파트": {
    "latestPrice": 92000,
    "latestPriceEok": "9억2,000",
    "latestArea": 18.1,
    "latestFloor": 8,
    "latestDate": "20260311",
    "maxPrice": 115000,
    "maxPriceEok": "11억5,000",
    "minPrice": 44800,
    "minPriceEok": "4억4,800",
    "txCount": 621,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "9억2,000",
        "areaPyeong": 18.1,
        "floor": 8,
        "area": 59.98
      },
      {
        "date": "03.07",
        "priceEok": "9억2,000",
        "areaPyeong": 18.1,
        "floor": 20,
        "area": 59.96
      },
      {
        "date": "03.02",
        "priceEok": "9억8,500",
        "areaPyeong": 21.9,
        "floor": 15,
        "area": 72.35
      },
      {
        "date": "02.14",
        "priceEok": "6억8,000",
        "areaPyeong": 21.9,
        "floor": 6,
        "area": 72.35
      }
    ]
  },
  "동탄역동원로얄듀크1차": {
    "latestPrice": 73250,
    "latestPriceEok": "7억3,250",
    "latestArea": 22.1,
    "latestFloor": 16,
    "latestDate": "20260311",
    "maxPrice": 100000,
    "maxPriceEok": "10억",
    "minPrice": 39000,
    "minPriceEok": "3억9,000",
    "txCount": 151,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "7억3,250",
        "areaPyeong": 22.1,
        "floor": 16,
        "area": 73.1098
      },
      {
        "date": "03.09",
        "priceEok": "7억8,500",
        "areaPyeong": 25.7,
        "floor": 3,
        "area": 84.9889
      },
      {
        "date": "03.03",
        "priceEok": "8억9,000",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.9889
      },
      {
        "date": "03.03",
        "priceEok": "7억3,000",
        "areaPyeong": 22.1,
        "floor": 9,
        "area": 73.1098
      }
    ]
  },
  "동탄2하우스디더레이크": {
    "latestPrice": 72500,
    "latestPriceEok": "7억2,500",
    "latestArea": 18.1,
    "latestFloor": 6,
    "latestDate": "20260311",
    "maxPrice": 104000,
    "maxPriceEok": "10억4,000",
    "minPrice": 29800,
    "minPriceEok": "2억9,800",
    "txCount": 1082,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "7억2,500",
        "areaPyeong": 18.1,
        "floor": 6,
        "area": 59.99
      },
      {
        "date": "03.07",
        "priceEok": "7억3,000",
        "areaPyeong": 18.1,
        "floor": 10,
        "area": 59.99
      },
      {
        "date": "03.06",
        "priceEok": "7억5,500",
        "areaPyeong": 18.1,
        "floor": 15,
        "area": 59.99
      },
      {
        "date": "03.04",
        "priceEok": "7억4,700",
        "areaPyeong": 18.1,
        "floor": 12,
        "area": 59.99
      }
    ]
  },
  "동탄2아이파크1단지": {
    "latestPrice": 55000,
    "latestPriceEok": "5억5,000",
    "latestArea": 25.7,
    "latestFloor": 18,
    "latestDate": "20260311",
    "maxPrice": 85000,
    "maxPriceEok": "8억5,000",
    "minPrice": 38000,
    "minPriceEok": "3억8,000",
    "txCount": 107,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "5억5,000",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.8688
      },
      {
        "date": "02.11",
        "priceEok": "5억1,000",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.8688
      },
      {
        "date": "02.05",
        "priceEok": "6억5,000",
        "areaPyeong": 29.3,
        "floor": 15,
        "area": 96.9237
      },
      {
        "date": "01.27",
        "priceEok": "6억500",
        "areaPyeong": 29.3,
        "floor": 11,
        "area": 96.9237
      }
    ]
  },
  "동탄2신도시금강펜테리움센트럴파크Ⅰ": {
    "latestPrice": 60000,
    "latestPriceEok": "6억",
    "latestArea": 25.7,
    "latestFloor": 13,
    "latestDate": "20260311",
    "maxPrice": 80000,
    "maxPriceEok": "8억",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 463,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "6억",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.9949
      },
      {
        "date": "03.06",
        "priceEok": "5억9,900",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.9949
      },
      {
        "date": "02.27",
        "priceEok": "6억1,700",
        "areaPyeong": 25.7,
        "floor": 10,
        "area": 84.9949
      },
      {
        "date": "02.27",
        "priceEok": "6억500",
        "areaPyeong": 25.7,
        "floor": 10,
        "area": 84.9949
      }
    ]
  },
  "그린힐 반도유보라 아이비파크 10(1단지)": {
    "latestPrice": 41600,
    "latestPriceEok": "4억1,600",
    "latestArea": 18.1,
    "latestFloor": 6,
    "latestDate": "20260311",
    "maxPrice": 69500,
    "maxPriceEok": "6억9,500",
    "minPrice": 26000,
    "minPriceEok": "2억6,000",
    "txCount": 617,
    "recent": [
      {
        "date": "03.11",
        "priceEok": "4억1,600",
        "areaPyeong": 18.1,
        "floor": 6,
        "area": 59.7731
      },
      {
        "date": "03.10",
        "priceEok": "4억3,000",
        "areaPyeong": 18.1,
        "floor": 19,
        "area": 59.7731
      },
      {
        "date": "03.07",
        "priceEok": "4억3,000",
        "areaPyeong": 18.1,
        "floor": 15,
        "area": 59.7731
      },
      {
        "date": "03.07",
        "priceEok": "4억600",
        "areaPyeong": 18.1,
        "floor": 3,
        "area": 59.7731
      }
    ]
  },
  "이편한세상동탄": {
    "latestPrice": 54000,
    "latestPriceEok": "5억4,000",
    "latestArea": 18.3,
    "latestFloor": 3,
    "latestDate": "20260310",
    "maxPrice": 94000,
    "maxPriceEok": "9억4,000",
    "minPrice": 34500,
    "minPriceEok": "3억4,500",
    "txCount": 546,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "5억4,000",
        "areaPyeong": 18.3,
        "floor": 3,
        "area": 60.49
      },
      {
        "date": "03.07",
        "priceEok": "5억9,000",
        "areaPyeong": 25.5,
        "floor": 4,
        "area": 84.42
      },
      {
        "date": "02.27",
        "priceEok": "5억5,000",
        "areaPyeong": 25.5,
        "floor": 17,
        "area": 84.2
      },
      {
        "date": "02.26",
        "priceEok": "6억4,000",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.87
      }
    ]
  },
  "산척동,동탄호수공원금강펜테리움센트럴파크Ⅱ": {
    "latestPrice": 56700,
    "latestPriceEok": "5억6,700",
    "latestArea": 25.7,
    "latestFloor": 21,
    "latestDate": "20260310",
    "maxPrice": 61000,
    "maxPriceEok": "6억1,000",
    "minPrice": 19700,
    "minPriceEok": "1억9,700",
    "txCount": 212,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "5억6,700",
        "areaPyeong": 25.7,
        "floor": 21,
        "area": 84.9996
      },
      {
        "date": "03.07",
        "priceEok": "5억6,000",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.9996
      },
      {
        "date": "03.07",
        "priceEok": "5억",
        "areaPyeong": 21.2,
        "floor": 13,
        "area": 69.9918
      },
      {
        "date": "03.07",
        "priceEok": "4억9,900",
        "areaPyeong": 21.2,
        "floor": 25,
        "area": 69.9918
      }
    ]
  },
  "반도유보라아이비파크3": {
    "latestPrice": 62500,
    "latestPriceEok": "6억2,500",
    "latestArea": 18.1,
    "latestFloor": 19,
    "latestDate": "20260310",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 27903,
    "minPriceEok": "2억7,903",
    "txCount": 649,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "6억2,500",
        "areaPyeong": 18.1,
        "floor": 19,
        "area": 59.9942
      },
      {
        "date": "02.26",
        "priceEok": "6억2,000",
        "areaPyeong": 18.1,
        "floor": 13,
        "area": 59.987
      },
      {
        "date": "02.21",
        "priceEok": "5억2,000",
        "areaPyeong": 18.1,
        "floor": 1,
        "area": 59.987
      },
      {
        "date": "02.12",
        "priceEok": "6억4,500",
        "areaPyeong": 18.1,
        "floor": 20,
        "area": 59.987
      }
    ]
  },
  "롯데캐슬 알바트로스": {
    "latestPrice": 95500,
    "latestPriceEok": "9억5,500",
    "latestArea": 30.9,
    "latestFloor": 13,
    "latestDate": "20260310",
    "maxPrice": 175000,
    "maxPriceEok": "17억5,000",
    "minPrice": 40820,
    "minPriceEok": "4억820",
    "txCount": 622,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "9억5,500",
        "areaPyeong": 30.9,
        "floor": 13,
        "area": 101.9959
      },
      {
        "date": "02.19",
        "priceEok": "9억8,000",
        "areaPyeong": 30.8,
        "floor": 11,
        "area": 101.8848
      },
      {
        "date": "02.14",
        "priceEok": "9억7,000",
        "areaPyeong": 30.8,
        "floor": 10,
        "area": 101.8848
      },
      {
        "date": "02.14",
        "priceEok": "9억3,500",
        "areaPyeong": 30.8,
        "floor": 8,
        "area": 101.8848
      }
    ]
  },
  "동탄역포레너스": {
    "latestPrice": 67500,
    "latestPriceEok": "6억7,500",
    "latestArea": 25.6,
    "latestFloor": 10,
    "latestDate": "20260310",
    "maxPrice": 79500,
    "maxPriceEok": "7억9,500",
    "minPrice": 27500,
    "minPriceEok": "2억7,500",
    "txCount": 929,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "6억7,500",
        "areaPyeong": 25.6,
        "floor": 10,
        "area": 84.5202
      },
      {
        "date": "03.05",
        "priceEok": "6억4,500",
        "areaPyeong": 25.6,
        "floor": 12,
        "area": 84.5442
      },
      {
        "date": "03.02",
        "priceEok": "6억4,500",
        "areaPyeong": 25.6,
        "floor": 15,
        "area": 84.5202
      },
      {
        "date": "03.02",
        "priceEok": "5억8,000",
        "areaPyeong": 18.3,
        "floor": 12,
        "area": 60.3768
      }
    ]
  },
  "동탄역유림노르웨이숲": {
    "latestPrice": 157000,
    "latestPriceEok": "15억7,000",
    "latestArea": 29.2,
    "latestFloor": 49,
    "latestDate": "20260310",
    "maxPrice": 160000,
    "maxPriceEok": "16억",
    "minPrice": 66450,
    "minPriceEok": "6억6,450",
    "txCount": 44,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "15억7,000",
        "areaPyeong": 29.2,
        "floor": 49,
        "area": 96.5843
      },
      {
        "date": "03.07",
        "priceEok": "11억4,000",
        "areaPyeong": 21.7,
        "floor": 19,
        "area": 71.6544
      },
      {
        "date": "02.14",
        "priceEok": "12억",
        "areaPyeong": 25.6,
        "floor": 5,
        "area": 84.6065
      },
      {
        "date": "02.12",
        "priceEok": "11억500",
        "areaPyeong": 25.6,
        "floor": 19,
        "area": 84.4985
      }
    ]
  },
  "동탄역센트럴예미지": {
    "latestPrice": 98500,
    "latestPriceEok": "9억8,500",
    "latestArea": 29.3,
    "latestFloor": 2,
    "latestDate": "20260310",
    "maxPrice": 124000,
    "maxPriceEok": "12억4,000",
    "minPrice": 53600,
    "minPriceEok": "5억3,600",
    "txCount": 141,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "9억8,500",
        "areaPyeong": 29.3,
        "floor": 2,
        "area": 96.8763
      },
      {
        "date": "03.10",
        "priceEok": "6억8,000",
        "areaPyeong": 25.7,
        "floor": 21,
        "area": 84.989
      },
      {
        "date": "02.27",
        "priceEok": "6억6,000",
        "areaPyeong": 29.3,
        "floor": 21,
        "area": 96.8763
      },
      {
        "date": "02.13",
        "priceEok": "9억5,000",
        "areaPyeong": 25.7,
        "floor": 23,
        "area": 84.989
      }
    ]
  },
  "동탄역대방디엠시티더센텀": {
    "latestPrice": 73000,
    "latestPriceEok": "7억3,000",
    "latestArea": 18,
    "latestFloor": 5,
    "latestDate": "20260310",
    "maxPrice": 86000,
    "maxPriceEok": "8억6,000",
    "minPrice": 50000,
    "minPriceEok": "5억",
    "txCount": 126,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "7억3,000",
        "areaPyeong": 18,
        "floor": 5,
        "area": 59.4656
      },
      {
        "date": "03.07",
        "priceEok": "7억5,000",
        "areaPyeong": 18,
        "floor": 37,
        "area": 59.4656
      },
      {
        "date": "03.07",
        "priceEok": "7억5,000",
        "areaPyeong": 18,
        "floor": 33,
        "area": 59.4656
      },
      {
        "date": "03.07",
        "priceEok": "6억8,000",
        "areaPyeong": 17,
        "floor": 7,
        "area": 56.361
      }
    ]
  },
  "동탄역 시범한화 꿈에그린 프레스티지": {
    "latestPrice": 158500,
    "latestPriceEok": "15억8,500",
    "latestArea": 30.7,
    "latestFloor": 27,
    "latestDate": "20260310",
    "maxPrice": 198000,
    "maxPriceEok": "19억8,000",
    "minPrice": 46000,
    "minPriceEok": "4억6,000",
    "txCount": 770,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "15억8,500",
        "areaPyeong": 30.7,
        "floor": 27,
        "area": 101.4
      },
      {
        "date": "03.08",
        "priceEok": "14억8,000",
        "areaPyeong": 25.7,
        "floor": 30,
        "area": 84.89
      },
      {
        "date": "03.01",
        "priceEok": "14억2,000",
        "areaPyeong": 34.4,
        "floor": 3,
        "area": 113.72
      },
      {
        "date": "02.26",
        "priceEok": "12억9,000",
        "areaPyeong": 25.6,
        "floor": 11,
        "area": 84.51
      }
    ]
  },
  "동탄시범다은마을센트럴파크뷰": {
    "latestPrice": 51700,
    "latestPriceEok": "5억1,700",
    "latestArea": 24.2,
    "latestFloor": 10,
    "latestDate": "20260310",
    "maxPrice": 69000,
    "maxPriceEok": "6억9,000",
    "minPrice": 26500,
    "minPriceEok": "2억6,500",
    "txCount": 469,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "5억1,700",
        "areaPyeong": 24.2,
        "floor": 10,
        "area": 79.84
      },
      {
        "date": "01.28",
        "priceEok": "5억3,000",
        "areaPyeong": 24.7,
        "floor": 18,
        "area": 81.512
      },
      {
        "date": "01.27",
        "priceEok": "4억9,500",
        "areaPyeong": 24.2,
        "floor": 17,
        "area": 79.84
      },
      {
        "date": "01.19",
        "priceEok": "4억7,800",
        "areaPyeong": 24.9,
        "floor": 1,
        "area": 82.25
      }
    ]
  },
  "더샵센트럴시티": {
    "latestPrice": 139000,
    "latestPriceEok": "13억9,000",
    "latestArea": 25.5,
    "latestFloor": 2,
    "latestDate": "20260310",
    "maxPrice": 180000,
    "maxPriceEok": "18억",
    "minPrice": 48106,
    "minPriceEok": "4억8,106",
    "txCount": 379,
    "recent": [
      {
        "date": "03.10",
        "priceEok": "13억9,000",
        "areaPyeong": 25.5,
        "floor": 2,
        "area": 84.392
      },
      {
        "date": "02.28",
        "priceEok": "16억9,000",
        "areaPyeong": 29.3,
        "floor": 21,
        "area": 97.01
      },
      {
        "date": "02.26",
        "priceEok": "17억3,500",
        "areaPyeong": 32.2,
        "floor": 29,
        "area": 106.537
      },
      {
        "date": "02.13",
        "priceEok": "16억6,000",
        "areaPyeong": 29.3,
        "floor": 7,
        "area": 97.01
      }
    ]
  },
  "힐스테이트동탄": {
    "latestPrice": 82500,
    "latestPriceEok": "8억2,500",
    "latestArea": 25.7,
    "latestFloor": 17,
    "latestDate": "20260309",
    "maxPrice": 96500,
    "maxPriceEok": "9억6,500",
    "minPrice": 25000,
    "minPriceEok": "2억5,000",
    "txCount": 447,
    "recent": [
      {
        "date": "03.09",
        "priceEok": "8억2,500",
        "areaPyeong": 25.7,
        "floor": 17,
        "area": 84.8479
      },
      {
        "date": "03.07",
        "priceEok": "7억9,500",
        "areaPyeong": 25.7,
        "floor": 15,
        "area": 84.8479
      },
      {
        "date": "03.06",
        "priceEok": "8억4,500",
        "areaPyeong": 25.7,
        "floor": 20,
        "area": 84.8479
      },
      {
        "date": "03.04",
        "priceEok": "6억8,500",
        "areaPyeong": 18.7,
        "floor": 13,
        "area": 61.9248
      }
    ]
  },
  "롯데캐슬": {
    "latestPrice": 79000,
    "latestPriceEok": "7억9,000",
    "latestArea": 30,
    "latestFloor": 15,
    "latestDate": "20260309",
    "maxPrice": 125000,
    "maxPriceEok": "12억5,000",
    "minPrice": 29500,
    "minPriceEok": "2억9,500",
    "txCount": 1130,
    "recent": [
      {
        "date": "03.09",
        "priceEok": "7억9,000",
        "areaPyeong": 30,
        "floor": 15,
        "area": 99.21
      },
      {
        "date": "03.09",
        "priceEok": "8억6,000",
        "areaPyeong": 33.1,
        "floor": 27,
        "area": 109.32
      },
      {
        "date": "03.07",
        "priceEok": "7억8,000",
        "areaPyeong": 26.5,
        "floor": 7,
        "area": 87.64
      },
      {
        "date": "02.20",
        "priceEok": "8억3,500",
        "areaPyeong": 29.2,
        "floor": 24,
        "area": 96.4
      }
    ]
  },
  "동탄역푸르지오": {
    "latestPrice": 95000,
    "latestPriceEok": "9억5,000",
    "latestArea": 25.7,
    "latestFloor": 19,
    "latestDate": "20260309",
    "maxPrice": 112000,
    "maxPriceEok": "11억2,000",
    "minPrice": 39994,
    "minPriceEok": "3억9,994",
    "txCount": 304,
    "recent": [
      {
        "date": "03.09",
        "priceEok": "9억5,000",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.9349
      },
      {
        "date": "02.21",
        "priceEok": "9억",
        "areaPyeong": 25.6,
        "floor": 22,
        "area": 84.643
      },
      {
        "date": "02.21",
        "priceEok": "7억9,000",
        "areaPyeong": 22.7,
        "floor": 4,
        "area": 74.8832
      },
      {
        "date": "02.11",
        "priceEok": "9억2,800",
        "areaPyeong": 25.7,
        "floor": 22,
        "area": 84.9349
      }
    ]
  },
  "동탄역롯데캐슬": {
    "latestPrice": 220000,
    "latestPriceEok": "22억",
    "latestArea": 31.1,
    "latestFloor": 32,
    "latestDate": "20260309",
    "maxPrice": 223000,
    "maxPriceEok": "22억3,000",
    "minPrice": 104000,
    "minPriceEok": "10억4,000",
    "txCount": 166,
    "recent": [
      {
        "date": "03.09",
        "priceEok": "22억",
        "areaPyeong": 31.1,
        "floor": 32,
        "area": 102.7092
      },
      {
        "date": "02.21",
        "priceEok": "16억",
        "areaPyeong": 20,
        "floor": 11,
        "area": 65.9695
      },
      {
        "date": "02.20",
        "priceEok": "19억",
        "areaPyeong": 25.7,
        "floor": 37,
        "area": 84.8222
      },
      {
        "date": "02.13",
        "priceEok": "15억7,000",
        "areaPyeong": 20,
        "floor": 10,
        "area": 65.9695
      }
    ]
  },
  "동탄숲속마을모아미래도2단지": {
    "latestPrice": 58000,
    "latestPriceEok": "5억8,000",
    "latestArea": 30.5,
    "latestFloor": 22,
    "latestDate": "20260309",
    "maxPrice": 72000,
    "maxPriceEok": "7억2,000",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 390,
    "recent": [
      {
        "date": "03.09",
        "priceEok": "5억8,000",
        "areaPyeong": 30.5,
        "floor": 22,
        "area": 100.92
      },
      {
        "date": "02.14",
        "priceEok": "5억9,800",
        "areaPyeong": 30.5,
        "floor": 2,
        "area": 100.92
      },
      {
        "date": "12.21",
        "priceEok": "5억4,000",
        "areaPyeong": 30.6,
        "floor": 3,
        "area": 101.23
      },
      {
        "date": "11.29",
        "priceEok": "5억7,000",
        "areaPyeong": 30.5,
        "floor": 14,
        "area": 100.92
      }
    ]
  },
  "동탄2신도시호반베르디움33단지": {
    "latestPrice": 45600,
    "latestPriceEok": "4억5,600",
    "latestArea": 23.1,
    "latestFloor": 9,
    "latestDate": "20260309",
    "maxPrice": 71800,
    "maxPriceEok": "7억1,800",
    "minPrice": 33400,
    "minPriceEok": "3억3,400",
    "txCount": 154,
    "recent": [
      {
        "date": "03.09",
        "priceEok": "4억5,600",
        "areaPyeong": 23.1,
        "floor": 9,
        "area": 76.4781
      },
      {
        "date": "01.31",
        "priceEok": "5억500",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.9025
      },
      {
        "date": "01.23",
        "priceEok": "4억7,000",
        "areaPyeong": 23.1,
        "floor": 7,
        "area": 76.4781
      },
      {
        "date": "01.21",
        "priceEok": "5억3,500",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.9025
      }
    ]
  },
  "금호어울림레이크": {
    "latestPrice": 68000,
    "latestPriceEok": "6억8,000",
    "latestArea": 18.1,
    "latestFloor": 13,
    "latestDate": "20260309",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 29000,
    "minPriceEok": "2억9,000",
    "txCount": 384,
    "recent": [
      {
        "date": "03.09",
        "priceEok": "6억8,000",
        "areaPyeong": 18.1,
        "floor": 13,
        "area": 59.93
      },
      {
        "date": "03.06",
        "priceEok": "7억9,000",
        "areaPyeong": 22.7,
        "floor": 13,
        "area": 74.97
      },
      {
        "date": "03.06",
        "priceEok": "7억1,000",
        "areaPyeong": 18.1,
        "floor": 23,
        "area": 59.93
      },
      {
        "date": "03.05",
        "priceEok": "6억4,800",
        "areaPyeong": 18.1,
        "floor": 10,
        "area": 59.93
      }
    ]
  },
  "동탄역예미지시그너스": {
    "latestPrice": 133000,
    "latestPriceEok": "13억3,000",
    "latestArea": 25.6,
    "latestFloor": 18,
    "latestDate": "20260308",
    "maxPrice": 150000,
    "maxPriceEok": "15억",
    "minPrice": 104000,
    "minPriceEok": "10억4,000",
    "txCount": 54,
    "recent": [
      {
        "date": "03.08",
        "priceEok": "13억3,000",
        "areaPyeong": 25.6,
        "floor": 18,
        "area": 84.6397
      },
      {
        "date": "02.28",
        "priceEok": "15억",
        "areaPyeong": 30.8,
        "floor": 24,
        "area": 101.8228
      },
      {
        "date": "02.28",
        "priceEok": "14억8,000",
        "areaPyeong": 30.8,
        "floor": 35,
        "area": 101.8228
      },
      {
        "date": "02.11",
        "priceEok": "14억",
        "areaPyeong": 30.8,
        "floor": 11,
        "area": 101.8228
      }
    ]
  },
  "동탄역센트럴푸르지오": {
    "latestPrice": 81900,
    "latestPriceEok": "8억1,900",
    "latestArea": 18,
    "latestFloor": 12,
    "latestDate": "20260308",
    "maxPrice": 94500,
    "maxPriceEok": "9억4,500",
    "minPrice": 31000,
    "minPriceEok": "3억1,000",
    "txCount": 1168,
    "recent": [
      {
        "date": "03.08",
        "priceEok": "8억1,900",
        "areaPyeong": 18,
        "floor": 12,
        "area": 59.4313
      },
      {
        "date": "03.07",
        "priceEok": "9억3,500",
        "areaPyeong": 25.7,
        "floor": 23,
        "area": 84.9834
      },
      {
        "date": "03.07",
        "priceEok": "7억9,500",
        "areaPyeong": 18,
        "floor": 23,
        "area": 59.4313
      },
      {
        "date": "03.02",
        "priceEok": "7억9,000",
        "areaPyeong": 18,
        "floor": 18,
        "area": 59.4313
      }
    ]
  },
  "동탄역 시범우남퍼스트빌아파트": {
    "latestPrice": 123000,
    "latestPriceEok": "12억3,000",
    "latestArea": 18.1,
    "latestFloor": 23,
    "latestDate": "20260308",
    "maxPrice": 148000,
    "maxPriceEok": "14억8,000",
    "minPrice": 32938,
    "minPriceEok": "3억2,938",
    "txCount": 1024,
    "recent": [
      {
        "date": "03.08",
        "priceEok": "12억3,000",
        "areaPyeong": 18.1,
        "floor": 23,
        "area": 59.99
      },
      {
        "date": "03.07",
        "priceEok": "14억2,800",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.94
      },
      {
        "date": "03.02",
        "priceEok": "12억",
        "areaPyeong": 21.2,
        "floor": 22,
        "area": 69.98
      },
      {
        "date": "03.02",
        "priceEok": "11억9,700",
        "areaPyeong": 18.1,
        "floor": 4,
        "area": 59.95
      }
    ]
  },
  "동탄센트럴포레스트": {
    "latestPrice": 46000,
    "latestPriceEok": "4억6,000",
    "latestArea": 22.6,
    "latestFloor": 2,
    "latestDate": "20260308",
    "maxPrice": 63400,
    "maxPriceEok": "6억3,400",
    "minPrice": 19950,
    "minPriceEok": "1억9,950",
    "txCount": 290,
    "recent": [
      {
        "date": "03.08",
        "priceEok": "4억6,000",
        "areaPyeong": 22.6,
        "floor": 2,
        "area": 74.66
      },
      {
        "date": "03.02",
        "priceEok": "5억5,000",
        "areaPyeong": 22.6,
        "floor": 20,
        "area": 74.73
      },
      {
        "date": "02.28",
        "priceEok": "5억",
        "areaPyeong": 22.6,
        "floor": 13,
        "area": 74.66
      },
      {
        "date": "02.23",
        "priceEok": "5억3,500",
        "areaPyeong": 25.7,
        "floor": 3,
        "area": 84.87
      }
    ]
  },
  "호수공원역 센트럴시티": {
    "latestPrice": 88000,
    "latestPriceEok": "8억8,000",
    "latestArea": 25.6,
    "latestFloor": 27,
    "latestDate": "20260307",
    "maxPrice": 119000,
    "maxPriceEok": "11억9,000",
    "minPrice": 36000,
    "minPriceEok": "3억6,000",
    "txCount": 258,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "8억8,000",
        "areaPyeong": 25.6,
        "floor": 27,
        "area": 84.5413
      },
      {
        "date": "03.07",
        "priceEok": "9억3,000",
        "areaPyeong": 25.6,
        "floor": 17,
        "area": 84.52
      },
      {
        "date": "03.07",
        "priceEok": "9억1,500",
        "areaPyeong": 25.6,
        "floor": 10,
        "area": 84.52
      },
      {
        "date": "03.05",
        "priceEok": "9억1,800",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.52
      }
    ]
  },
  "포스코더샵2차": {
    "latestPrice": 58300,
    "latestPriceEok": "5억8,300",
    "latestArea": 25.6,
    "latestFloor": 12,
    "latestDate": "20260307",
    "maxPrice": 88000,
    "maxPriceEok": "8억8,000",
    "minPrice": 15625,
    "minPriceEok": "1억5,625",
    "txCount": 1416,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "5억8,300",
        "areaPyeong": 25.6,
        "floor": 12,
        "area": 84.6199
      },
      {
        "date": "03.07",
        "priceEok": "5억7,000",
        "areaPyeong": 23,
        "floor": 9,
        "area": 76.1565
      },
      {
        "date": "03.04",
        "priceEok": "5억2,500",
        "areaPyeong": 23.2,
        "floor": 4,
        "area": 76.5336
      },
      {
        "date": "02.26",
        "priceEok": "5억4,000",
        "areaPyeong": 23.2,
        "floor": 11,
        "area": 76.5336
      }
    ]
  },
  "시범한빛마을동탄아이파크": {
    "latestPrice": 94500,
    "latestPriceEok": "9억4,500",
    "latestArea": 25.7,
    "latestFloor": 18,
    "latestDate": "20260307",
    "maxPrice": 98000,
    "maxPriceEok": "9억8,000",
    "minPrice": 21500,
    "minPriceEok": "2억1,500",
    "txCount": 866,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "9억4,500",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.96
      },
      {
        "date": "03.07",
        "priceEok": "9억500",
        "areaPyeong": 25.7,
        "floor": 11,
        "area": 84.96
      },
      {
        "date": "03.07",
        "priceEok": "8억9,500",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.96
      },
      {
        "date": "02.27",
        "priceEok": "7억6,000",
        "areaPyeong": 25.7,
        "floor": 9,
        "area": 84.96
      }
    ]
  },
  "센트럴S타운": {
    "latestPrice": 3250,
    "latestPriceEok": "3,250만",
    "latestArea": 3.8,
    "latestFloor": 9,
    "latestDate": "20260307",
    "maxPrice": 12000,
    "maxPriceEok": "1억2,000",
    "minPrice": 2800,
    "minPriceEok": "2,800만",
    "txCount": 207,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "3,250만",
        "areaPyeong": 3.8,
        "floor": 9,
        "area": 12.71
      },
      {
        "date": "12.03",
        "priceEok": "5,000만",
        "areaPyeong": 4.3,
        "floor": 10,
        "area": 14.18
      },
      {
        "date": "11.26",
        "priceEok": "3,000만",
        "areaPyeong": 3.8,
        "floor": 9,
        "area": 12.71
      },
      {
        "date": "11.17",
        "priceEok": "9,000만",
        "areaPyeong": 7.9,
        "floor": 9,
        "area": 26.05
      }
    ]
  },
  "동탄파크푸르지오": {
    "latestPrice": 57500,
    "latestPriceEok": "5억7,500",
    "latestArea": 25.7,
    "latestFloor": 13,
    "latestDate": "20260307",
    "maxPrice": 78000,
    "maxPriceEok": "7억8,000",
    "minPrice": 34200,
    "minPriceEok": "3억4,200",
    "txCount": 351,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "5억7,500",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.94
      },
      {
        "date": "03.07",
        "priceEok": "5억4,800",
        "areaPyeong": 22.6,
        "floor": 11,
        "area": 74.75
      },
      {
        "date": "03.07",
        "priceEok": "5억3,500",
        "areaPyeong": 22.6,
        "floor": 5,
        "area": 74.75
      },
      {
        "date": "02.27",
        "priceEok": "5억3,000",
        "areaPyeong": 22.6,
        "floor": 12,
        "area": 74.76
      }
    ]
  },
  "동탄역헤리엇": {
    "latestPrice": 95000,
    "latestPriceEok": "9억5,000",
    "latestArea": 29.4,
    "latestFloor": 11,
    "latestDate": "20260307",
    "maxPrice": 106000,
    "maxPriceEok": "10억6,000",
    "minPrice": 92000,
    "minPriceEok": "9억2,000",
    "txCount": 15,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "9억5,000",
        "areaPyeong": 29.4,
        "floor": 11,
        "area": 97.3043
      },
      {
        "date": "02.21",
        "priceEok": "9억6,000",
        "areaPyeong": 29.6,
        "floor": 12,
        "area": 97.8915
      },
      {
        "date": "02.05",
        "priceEok": "9억5,000",
        "areaPyeong": 29.4,
        "floor": 11,
        "area": 97.3043
      },
      {
        "date": "01.31",
        "priceEok": "10억4,000",
        "areaPyeong": 29.6,
        "floor": 15,
        "area": 97.8915
      }
    ]
  },
  "동탄역중흥에스클래스": {
    "latestPrice": 63000,
    "latestPriceEok": "6억3,000",
    "latestArea": 25.1,
    "latestFloor": 10,
    "latestDate": "20260307",
    "maxPrice": 76500,
    "maxPriceEok": "7억6,500",
    "minPrice": 37000,
    "minPriceEok": "3억7,000",
    "txCount": 149,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "6억3,000",
        "areaPyeong": 25.1,
        "floor": 10,
        "area": 83.0109
      },
      {
        "date": "03.07",
        "priceEok": "5억9,500",
        "areaPyeong": 25.1,
        "floor": 2,
        "area": 83.0109
      },
      {
        "date": "02.28",
        "priceEok": "6억4,000",
        "areaPyeong": 25.1,
        "floor": 10,
        "area": 83.0109
      },
      {
        "date": "02.28",
        "priceEok": "6억1,000",
        "areaPyeong": 25.1,
        "floor": 6,
        "area": 83.0109
      }
    ]
  },
  "동탄역이지더원": {
    "latestPrice": 68000,
    "latestPriceEok": "6억8,000",
    "latestArea": 25.7,
    "latestFloor": 11,
    "latestDate": "20260307",
    "maxPrice": 80800,
    "maxPriceEok": "8억800",
    "minPrice": 24980,
    "minPriceEok": "2억4,980",
    "txCount": 604,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "6억8,000",
        "areaPyeong": 25.7,
        "floor": 11,
        "area": 84.9731
      },
      {
        "date": "03.07",
        "priceEok": "6억3,700",
        "areaPyeong": 18.1,
        "floor": 7,
        "area": 59.9792
      },
      {
        "date": "02.26",
        "priceEok": "5억7,500",
        "areaPyeong": 18.1,
        "floor": 1,
        "area": 59.9792
      },
      {
        "date": "02.25",
        "priceEok": "7억",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.9731
      }
    ]
  },
  "동탄역에일린의뜰": {
    "latestPrice": 59000,
    "latestPriceEok": "5억9,000",
    "latestArea": 22.7,
    "latestFloor": 9,
    "latestDate": "20260307",
    "maxPrice": 86000,
    "maxPriceEok": "8억6,000",
    "minPrice": 33720,
    "minPriceEok": "3억3,720",
    "txCount": 232,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "5억9,000",
        "areaPyeong": 22.7,
        "floor": 9,
        "area": 74.9737
      },
      {
        "date": "02.25",
        "priceEok": "6억5,000",
        "areaPyeong": 25.7,
        "floor": 11,
        "area": 84.9941
      },
      {
        "date": "02.14",
        "priceEok": "6억5,800",
        "areaPyeong": 25.7,
        "floor": 15,
        "area": 84.994
      },
      {
        "date": "02.14",
        "priceEok": "5억7,000",
        "areaPyeong": 22.7,
        "floor": 1,
        "area": 74.9737
      }
    ]
  },
  "동탄역반도유보라아이비파크7.0": {
    "latestPrice": 117000,
    "latestPriceEok": "11억7,000",
    "latestArea": 22.2,
    "latestFloor": 15,
    "latestDate": "20260307",
    "maxPrice": 149000,
    "maxPriceEok": "14억9,000",
    "minPrice": 67000,
    "minPriceEok": "6억7,000",
    "txCount": 159,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "11억7,000",
        "areaPyeong": 22.2,
        "floor": 15,
        "area": 73.4311
      },
      {
        "date": "03.06",
        "priceEok": "10억5,000",
        "areaPyeong": 22.3,
        "floor": 3,
        "area": 73.6524
      },
      {
        "date": "03.06",
        "priceEok": "11억9,500",
        "areaPyeong": 22.2,
        "floor": 23,
        "area": 73.4311
      },
      {
        "date": "02.23",
        "priceEok": "11억9,500",
        "areaPyeong": 22.2,
        "floor": 30,
        "area": 73.4311
      }
    ]
  },
  "동탄역모아미래도": {
    "latestPrice": 81000,
    "latestPriceEok": "8억1,000",
    "latestArea": 25.7,
    "latestFloor": 16,
    "latestDate": "20260307",
    "maxPrice": 88000,
    "maxPriceEok": "8억8,000",
    "minPrice": 34000,
    "minPriceEok": "3억4,000",
    "txCount": 319,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "8억1,000",
        "areaPyeong": 25.7,
        "floor": 16,
        "area": 84.9558
      },
      {
        "date": "02.25",
        "priceEok": "8억3,000",
        "areaPyeong": 25.7,
        "floor": 11,
        "area": 84.9982
      },
      {
        "date": "02.21",
        "priceEok": "7억7,500",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.9982
      },
      {
        "date": "02.14",
        "priceEok": "8억1,500",
        "areaPyeong": 25.7,
        "floor": 23,
        "area": 84.9982
      }
    ]
  },
  "동탄역더샵센트럴시티2차": {
    "latestPrice": 79000,
    "latestPriceEok": "7억9,000",
    "latestArea": 25.7,
    "latestFloor": 19,
    "latestDate": "20260307",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 53000,
    "minPriceEok": "5억3,000",
    "txCount": 196,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "7억9,000",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.98
      },
      {
        "date": "03.07",
        "priceEok": "7억7,000",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.98
      },
      {
        "date": "02.28",
        "priceEok": "7억5,000",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.98
      },
      {
        "date": "02.24",
        "priceEok": "6억9,000",
        "areaPyeong": 22.6,
        "floor": 11,
        "area": 74.85
      }
    ]
  },
  "동탄역 반도유보라 아이비파크5.0": {
    "latestPrice": 96700,
    "latestPriceEok": "9억6,700",
    "latestArea": 18.1,
    "latestFloor": 16,
    "latestDate": "20260307",
    "maxPrice": 144000,
    "maxPriceEok": "14억4,000",
    "minPrice": 54700,
    "minPriceEok": "5억4,700",
    "txCount": 176,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "9억6,700",
        "areaPyeong": 18.1,
        "floor": 16,
        "area": 59.9206
      },
      {
        "date": "02.14",
        "priceEok": "9억9,000",
        "areaPyeong": 22.5,
        "floor": 25,
        "area": 74.3629
      },
      {
        "date": "02.07",
        "priceEok": "9억5,000",
        "areaPyeong": 18.1,
        "floor": 20,
        "area": 59.9206
      },
      {
        "date": "02.03",
        "priceEok": "11억",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.9739
      }
    ]
  },
  "동탄역 더 힐": {
    "latestPrice": 62000,
    "latestPriceEok": "6억2,000",
    "latestArea": 25.6,
    "latestFloor": 8,
    "latestDate": "20260307",
    "maxPrice": 94500,
    "maxPriceEok": "9억4,500",
    "minPrice": 34800,
    "minPriceEok": "3억4,800",
    "txCount": 443,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "6억2,000",
        "areaPyeong": 25.6,
        "floor": 8,
        "area": 84.5413
      },
      {
        "date": "03.03",
        "priceEok": "6억6,500",
        "areaPyeong": 25.6,
        "floor": 7,
        "area": 84.5202
      },
      {
        "date": "03.03",
        "priceEok": "5억6,000",
        "areaPyeong": 25.6,
        "floor": 11,
        "area": 84.5202
      },
      {
        "date": "03.02",
        "priceEok": "6억6,700",
        "areaPyeong": 25.6,
        "floor": 8,
        "area": 84.5202
      }
    ]
  },
  "동탄숲속마을 모아미래도1단지": {
    "latestPrice": 65000,
    "latestPriceEok": "6억5,000",
    "latestArea": 25.7,
    "latestFloor": 22,
    "latestDate": "20260307",
    "maxPrice": 72500,
    "maxPriceEok": "7억2,500",
    "minPrice": 15860,
    "minPriceEok": "1억5,860",
    "txCount": 1258,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "6억5,000",
        "areaPyeong": 25.7,
        "floor": 22,
        "area": 84.96
      },
      {
        "date": "03.04",
        "priceEok": "6억2,000",
        "areaPyeong": 25.4,
        "floor": 11,
        "area": 84.13
      },
      {
        "date": "02.26",
        "priceEok": "5억2,000",
        "areaPyeong": 18.3,
        "floor": 14,
        "area": 60.49
      },
      {
        "date": "02.14",
        "priceEok": "6억2,000",
        "areaPyeong": 25.4,
        "floor": 15,
        "area": 84.13
      }
    ]
  },
  "동탄레이크자연앤푸르지오": {
    "latestPrice": 93000,
    "latestPriceEok": "9억3,000",
    "latestArea": 25.7,
    "latestFloor": 20,
    "latestDate": "20260307",
    "maxPrice": 118000,
    "maxPriceEok": "11억8,000",
    "minPrice": 40500,
    "minPriceEok": "4억500",
    "txCount": 138,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "9억3,000",
        "areaPyeong": 25.7,
        "floor": 20,
        "area": 84.9338
      },
      {
        "date": "02.27",
        "priceEok": "9억2,000",
        "areaPyeong": 25.7,
        "floor": 15,
        "area": 84.7984
      },
      {
        "date": "02.19",
        "priceEok": "8억8,000",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.9548
      },
      {
        "date": "02.10",
        "priceEok": "8억7,500",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.7984
      }
    ]
  },
  "동탄2신도시4차동원로얄듀크포레": {
    "latestPrice": 50000,
    "latestPriceEok": "5억",
    "latestArea": 17.9,
    "latestFloor": 32,
    "latestDate": "20260307",
    "maxPrice": 61000,
    "maxPriceEok": "6억1,000",
    "minPrice": 40000,
    "minPriceEok": "4억",
    "txCount": 54,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "5억",
        "areaPyeong": 17.9,
        "floor": 32,
        "area": 59.0157
      },
      {
        "date": "03.07",
        "priceEok": "4억9,500",
        "areaPyeong": 17.9,
        "floor": 22,
        "area": 59.0157
      },
      {
        "date": "01.03",
        "priceEok": "4억8,000",
        "areaPyeong": 17.9,
        "floor": 2,
        "area": 59.0157
      },
      {
        "date": "12.20",
        "priceEok": "4억7,000",
        "areaPyeong": 17.9,
        "floor": 7,
        "area": 59.0157
      }
    ]
  },
  "동탄2신도시 베라체": {
    "latestPrice": 51000,
    "latestPriceEok": "5억1,000",
    "latestArea": 18.1,
    "latestFloor": 12,
    "latestDate": "20260307",
    "maxPrice": 72000,
    "maxPriceEok": "7억2,000",
    "minPrice": 29000,
    "minPriceEok": "2억9,000",
    "txCount": 353,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "5억1,000",
        "areaPyeong": 18.1,
        "floor": 12,
        "area": 59.99
      },
      {
        "date": "03.03",
        "priceEok": "5억1,500",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.99
      },
      {
        "date": "03.02",
        "priceEok": "5억400",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.99
      },
      {
        "date": "03.01",
        "priceEok": "4억7,300",
        "areaPyeong": 22.7,
        "floor": 2,
        "area": 74.98
      }
    ]
  },
  "동탄 더샵 레이크에듀타운": {
    "latestPrice": 97000,
    "latestPriceEok": "9억7,000",
    "latestArea": 25.7,
    "latestFloor": 21,
    "latestDate": "20260307",
    "maxPrice": 121700,
    "maxPriceEok": "12억1,700",
    "minPrice": 51000,
    "minPriceEok": "5억1,000",
    "txCount": 389,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "9억7,000",
        "areaPyeong": 25.7,
        "floor": 21,
        "area": 84.9753
      },
      {
        "date": "03.04",
        "priceEok": "9억7,000",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.9753
      },
      {
        "date": "02.10",
        "priceEok": "9억3,700",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.9802
      },
      {
        "date": "02.07",
        "priceEok": "9억1,000",
        "areaPyeong": 25.7,
        "floor": 10,
        "area": 84.9802
      }
    ]
  },
  "동탄 더 레이크 팰리스": {
    "latestPrice": 103800,
    "latestPriceEok": "10억3,800",
    "latestArea": 25.6,
    "latestFloor": 23,
    "latestDate": "20260307",
    "maxPrice": 143000,
    "maxPriceEok": "14억3,000",
    "minPrice": 62500,
    "minPriceEok": "6억2,500",
    "txCount": 168,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "10억3,800",
        "areaPyeong": 25.6,
        "floor": 23,
        "area": 84.52
      },
      {
        "date": "02.28",
        "priceEok": "9억5,000",
        "areaPyeong": 25.6,
        "floor": 24,
        "area": 84.5442
      },
      {
        "date": "02.21",
        "priceEok": "9억5,000",
        "areaPyeong": 26.8,
        "floor": 5,
        "area": 88.4828
      },
      {
        "date": "02.20",
        "priceEok": "11억",
        "areaPyeong": 25.6,
        "floor": 15,
        "area": 84.52
      }
    ]
  },
  "더레이크시티부영6단지": {
    "latestPrice": 49000,
    "latestPriceEok": "4억9,000",
    "latestArea": 18.1,
    "latestFloor": 1,
    "latestDate": "20260307",
    "maxPrice": 83500,
    "maxPriceEok": "8억3,500",
    "minPrice": 30100,
    "minPriceEok": "3억100",
    "txCount": 355,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "4억9,000",
        "areaPyeong": 18.1,
        "floor": 1,
        "area": 59.9912
      },
      {
        "date": "03.06",
        "priceEok": "5억3,000",
        "areaPyeong": 18.1,
        "floor": 7,
        "area": 59.9912
      },
      {
        "date": "03.06",
        "priceEok": "5억2,500",
        "areaPyeong": 18.1,
        "floor": 22,
        "area": 59.9912
      },
      {
        "date": "03.06",
        "priceEok": "5억2,000",
        "areaPyeong": 18.1,
        "floor": 19,
        "area": 59.9912
      }
    ]
  },
  "KCC스위첸아파트": {
    "latestPrice": 72000,
    "latestPriceEok": "7억2,000",
    "latestArea": 25.4,
    "latestFloor": 28,
    "latestDate": "20260307",
    "maxPrice": 83000,
    "maxPriceEok": "8억3,000",
    "minPrice": 30000,
    "minPriceEok": "3억",
    "txCount": 424,
    "recent": [
      {
        "date": "03.07",
        "priceEok": "7억2,000",
        "areaPyeong": 25.4,
        "floor": 28,
        "area": 84.11
      },
      {
        "date": "03.04",
        "priceEok": "7억4,700",
        "areaPyeong": 25.4,
        "floor": 26,
        "area": 84.06
      },
      {
        "date": "02.27",
        "priceEok": "6억8,700",
        "areaPyeong": 25.4,
        "floor": 2,
        "area": 84.01
      },
      {
        "date": "02.21",
        "priceEok": "7억5,750",
        "areaPyeong": 25.4,
        "floor": 23,
        "area": 84.06
      }
    ]
  },
  "동탄파크자이": {
    "latestPrice": 87500,
    "latestPriceEok": "8억7,500",
    "latestArea": 31.3,
    "latestFloor": 10,
    "latestDate": "20260306",
    "maxPrice": 115000,
    "maxPriceEok": "11억5,000",
    "minPrice": 54600,
    "minPriceEok": "5억4,600",
    "txCount": 211,
    "recent": [
      {
        "date": "03.06",
        "priceEok": "8억7,500",
        "areaPyeong": 31.3,
        "floor": 10,
        "area": 103.4182
      },
      {
        "date": "03.03",
        "priceEok": "7억3,700",
        "areaPyeong": 30.2,
        "floor": 4,
        "area": 99.6918
      },
      {
        "date": "02.28",
        "priceEok": "7억7,000",
        "areaPyeong": 30.2,
        "floor": 10,
        "area": 99.6918
      },
      {
        "date": "02.25",
        "priceEok": "7억2,000",
        "areaPyeong": 28.3,
        "floor": 2,
        "area": 93.4136
      }
    ]
  },
  "동탄역파라곤": {
    "latestPrice": 109800,
    "latestPriceEok": "10억9,800",
    "latestArea": 24.2,
    "latestFloor": 30,
    "latestDate": "20260306",
    "maxPrice": 173000,
    "maxPriceEok": "17억3,000",
    "minPrice": 79000,
    "minPriceEok": "7억9,000",
    "txCount": 44,
    "recent": [
      {
        "date": "03.06",
        "priceEok": "10억9,800",
        "areaPyeong": 24.2,
        "floor": 30,
        "area": 79.8807
      },
      {
        "date": "02.23",
        "priceEok": "10억7,000",
        "areaPyeong": 23.6,
        "floor": 18,
        "area": 78.059
      },
      {
        "date": "02.14",
        "priceEok": "10억2,000",
        "areaPyeong": 23.6,
        "floor": 7,
        "area": 78.059
      },
      {
        "date": "02.12",
        "priceEok": "10억6,500",
        "areaPyeong": 23.6,
        "floor": 34,
        "area": 78.059
      }
    ]
  },
  "동탄역 반도유보라 아이비파크6.0": {
    "latestPrice": 114000,
    "latestPriceEok": "11억4,000",
    "latestArea": 25.7,
    "latestFloor": 18,
    "latestDate": "20260306",
    "maxPrice": 143500,
    "maxPriceEok": "14억3,500",
    "minPrice": 38000,
    "minPriceEok": "3억8,000",
    "txCount": 181,
    "recent": [
      {
        "date": "03.06",
        "priceEok": "11억4,000",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.9885
      },
      {
        "date": "03.02",
        "priceEok": "10억6,000",
        "areaPyeong": 22.5,
        "floor": 28,
        "area": 74.3629
      },
      {
        "date": "02.25",
        "priceEok": "10억9,500",
        "areaPyeong": 22.5,
        "floor": 19,
        "area": 74.3629
      },
      {
        "date": "02.07",
        "priceEok": "10억3,000",
        "areaPyeong": 22.5,
        "floor": 2,
        "area": 74.3629
      }
    ]
  },
  "더레이크시티부영5단지": {
    "latestPrice": 58000,
    "latestPriceEok": "5억8,000",
    "latestArea": 18.3,
    "latestFloor": 5,
    "latestDate": "20260306",
    "maxPrice": 101000,
    "maxPriceEok": "10억1,000",
    "minPrice": 38500,
    "minPriceEok": "3억8,500",
    "txCount": 261,
    "recent": [
      {
        "date": "03.06",
        "priceEok": "5억8,000",
        "areaPyeong": 18.3,
        "floor": 5,
        "area": 60.3768
      },
      {
        "date": "03.03",
        "priceEok": "8억2,700",
        "areaPyeong": 25.6,
        "floor": 16,
        "area": 84.52
      },
      {
        "date": "03.02",
        "priceEok": "7억6,700",
        "areaPyeong": 25.6,
        "floor": 11,
        "area": 84.52
      },
      {
        "date": "02.27",
        "priceEok": "6억3,800",
        "areaPyeong": 18.3,
        "floor": 19,
        "area": 60.3768
      }
    ]
  },
  "푸른마을두산위브": {
    "latestPrice": 53300,
    "latestPriceEok": "5억3,300",
    "latestArea": 22.2,
    "latestFloor": 28,
    "latestDate": "20260305",
    "maxPrice": 87000,
    "maxPriceEok": "8억7,000",
    "minPrice": 12000,
    "minPriceEok": "1억2,000",
    "txCount": 1006,
    "recent": [
      {
        "date": "03.05",
        "priceEok": "5억3,300",
        "areaPyeong": 22.2,
        "floor": 28,
        "area": 73.33
      },
      {
        "date": "02.28",
        "priceEok": "5억1,400",
        "areaPyeong": 24.7,
        "floor": 1,
        "area": 81.49
      },
      {
        "date": "02.28",
        "priceEok": "6억6,000",
        "areaPyeong": 30.8,
        "floor": 5,
        "area": 101.71
      },
      {
        "date": "02.26",
        "priceEok": "4억9,600",
        "areaPyeong": 22.2,
        "floor": 31,
        "area": 73.33
      }
    ]
  },
  "서해더블루(90-2)": {
    "latestPrice": 57500,
    "latestPriceEok": "5억7,500",
    "latestArea": 32.7,
    "latestFloor": 21,
    "latestDate": "20260305",
    "maxPrice": 86410,
    "maxPriceEok": "8억6,410",
    "minPrice": 35800,
    "minPriceEok": "3억5,800",
    "txCount": 102,
    "recent": [
      {
        "date": "03.05",
        "priceEok": "5억7,500",
        "areaPyeong": 32.7,
        "floor": 21,
        "area": 108.1715
      },
      {
        "date": "09.29",
        "priceEok": "5억9,500",
        "areaPyeong": 33.4,
        "floor": 30,
        "area": 110.5016
      },
      {
        "date": "09.22",
        "priceEok": "5억",
        "areaPyeong": 32.7,
        "floor": 10,
        "area": 108.1715
      },
      {
        "date": "08.06",
        "priceEok": "5억6,500",
        "areaPyeong": 32.7,
        "floor": 20,
        "area": 108.1715
      }
    ]
  },
  "르파비스": {
    "latestPrice": 50000,
    "latestPriceEok": "5억",
    "latestArea": 25.7,
    "latestFloor": 2,
    "latestDate": "20260305",
    "maxPrice": 63500,
    "maxPriceEok": "6억3,500",
    "minPrice": 33000,
    "minPriceEok": "3억3,000",
    "txCount": 69,
    "recent": [
      {
        "date": "03.05",
        "priceEok": "5억",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.96
      },
      {
        "date": "02.27",
        "priceEok": "6억2,000",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.96
      },
      {
        "date": "02.27",
        "priceEok": "4억3,500",
        "areaPyeong": 15.7,
        "floor": 19,
        "area": 51.99
      },
      {
        "date": "02.14",
        "priceEok": "3억9,000",
        "areaPyeong": 15.7,
        "floor": 2,
        "area": 51.99
      }
    ]
  },
  "동탄역신안인스빌리베라2차": {
    "latestPrice": 69000,
    "latestPriceEok": "6억9,000",
    "latestArea": 18.1,
    "latestFloor": 10,
    "latestDate": "20260305",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 30416,
    "minPriceEok": "3억416",
    "txCount": 489,
    "recent": [
      {
        "date": "03.05",
        "priceEok": "6억9,000",
        "areaPyeong": 18.1,
        "floor": 10,
        "area": 59.968
      },
      {
        "date": "03.02",
        "priceEok": "8억500",
        "areaPyeong": 22.1,
        "floor": 17,
        "area": 72.9996
      },
      {
        "date": "02.19",
        "priceEok": "7억3,700",
        "areaPyeong": 18.1,
        "floor": 21,
        "area": 59.968
      },
      {
        "date": "02.14",
        "priceEok": "7억5,000",
        "areaPyeong": 22.1,
        "floor": 20,
        "area": 72.9996
      }
    ]
  },
  "동탄역린스트라우스": {
    "latestPrice": 142300,
    "latestPriceEok": "14억2,300",
    "latestArea": 28.4,
    "latestFloor": 32,
    "latestDate": "20260305",
    "maxPrice": 162000,
    "maxPriceEok": "16억2,000",
    "minPrice": 76000,
    "minPriceEok": "7억6,000",
    "txCount": 138,
    "recent": [
      {
        "date": "03.05",
        "priceEok": "14억2,300",
        "areaPyeong": 28.4,
        "floor": 32,
        "area": 93.8026
      },
      {
        "date": "03.03",
        "priceEok": "14억1,000",
        "areaPyeong": 28.4,
        "floor": 30,
        "area": 93.8026
      },
      {
        "date": "02.22",
        "priceEok": "13억7,800",
        "areaPyeong": 27.9,
        "floor": 26,
        "area": 92.2542
      },
      {
        "date": "02.09",
        "priceEok": "12억4,500",
        "areaPyeong": 22.7,
        "floor": 18,
        "area": 75.0217
      }
    ]
  },
  "동탄나루마을동탄역U.BORA여울숲1.0": {
    "latestPrice": 66000,
    "latestPriceEok": "6억6,000",
    "latestArea": 25.6,
    "latestFloor": 4,
    "latestDate": "20260305",
    "maxPrice": 70800,
    "maxPriceEok": "7억800",
    "minPrice": 25000,
    "minPriceEok": "2억5,000",
    "txCount": 622,
    "recent": [
      {
        "date": "03.05",
        "priceEok": "6억6,000",
        "areaPyeong": 25.6,
        "floor": 4,
        "area": 84.6841
      },
      {
        "date": "02.13",
        "priceEok": "5억7,500",
        "areaPyeong": 23.2,
        "floor": 2,
        "area": 76.7822
      },
      {
        "date": "02.07",
        "priceEok": "6억8,800",
        "areaPyeong": 25.6,
        "floor": 13,
        "area": 84.6595
      },
      {
        "date": "01.29",
        "priceEok": "6억9,400",
        "areaPyeong": 25.6,
        "floor": 10,
        "area": 84.6841
      }
    ]
  },
  "능동마을이지더원": {
    "latestPrice": 58000,
    "latestPriceEok": "5억8,000",
    "latestArea": 25.3,
    "latestFloor": 16,
    "latestDate": "20260305",
    "maxPrice": 69000,
    "maxPriceEok": "6억9,000",
    "minPrice": 23000,
    "minPriceEok": "2억3,000",
    "txCount": 640,
    "recent": [
      {
        "date": "03.05",
        "priceEok": "5억8,000",
        "areaPyeong": 25.3,
        "floor": 16,
        "area": 83.5573
      },
      {
        "date": "03.02",
        "priceEok": "5억1,000",
        "areaPyeong": 23.7,
        "floor": 15,
        "area": 78.2912
      },
      {
        "date": "02.20",
        "priceEok": "5억1,000",
        "areaPyeong": 23.7,
        "floor": 1,
        "area": 78.2912
      },
      {
        "date": "02.14",
        "priceEok": "5억6,200",
        "areaPyeong": 23.7,
        "floor": 11,
        "area": 78.2912
      }
    ]
  },
  "호반베르디움센트럴포레": {
    "latestPrice": 57000,
    "latestPriceEok": "5억7,000",
    "latestArea": 25.7,
    "latestFloor": 2,
    "latestDate": "20260304",
    "maxPrice": 85000,
    "maxPriceEok": "8억5,000",
    "minPrice": 35000,
    "minPriceEok": "3억5,000",
    "txCount": 633,
    "recent": [
      {
        "date": "03.04",
        "priceEok": "5억7,000",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.8388
      },
      {
        "date": "02.21",
        "priceEok": "6억1,700",
        "areaPyeong": 25.7,
        "floor": 3,
        "area": 84.8388
      },
      {
        "date": "02.14",
        "priceEok": "6억2,000",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.8388
      },
      {
        "date": "02.11",
        "priceEok": "6억4,000",
        "areaPyeong": 29.7,
        "floor": 3,
        "area": 98.1497
      }
    ]
  },
  "시범한빛마을케이씨씨스위첸": {
    "latestPrice": 69500,
    "latestPriceEok": "6억9,500",
    "latestArea": 25.6,
    "latestFloor": 24,
    "latestDate": "20260304",
    "maxPrice": 75000,
    "maxPriceEok": "7억5,000",
    "minPrice": 26000,
    "minPriceEok": "2억6,000",
    "txCount": 593,
    "recent": [
      {
        "date": "03.04",
        "priceEok": "6억9,500",
        "areaPyeong": 25.6,
        "floor": 24,
        "area": 84.7328
      },
      {
        "date": "03.01",
        "priceEok": "6억",
        "areaPyeong": 25.6,
        "floor": 3,
        "area": 84.6517
      },
      {
        "date": "02.28",
        "priceEok": "7억2,000",
        "areaPyeong": 25.6,
        "floor": 8,
        "area": 84.7862
      },
      {
        "date": "02.28",
        "priceEok": "6억5,000",
        "areaPyeong": 25.6,
        "floor": 12,
        "area": 84.6517
      }
    ]
  },
  "동탄파라곤II": {
    "latestPrice": 73000,
    "latestPriceEok": "7억3,000",
    "latestArea": 35,
    "latestFloor": 25,
    "latestDate": "20260304",
    "maxPrice": 122000,
    "maxPriceEok": "12억2,000",
    "minPrice": 37000,
    "minPriceEok": "3억7,000",
    "txCount": 65,
    "recent": [
      {
        "date": "03.04",
        "priceEok": "7억3,000",
        "areaPyeong": 35,
        "floor": 25,
        "area": 115.63
      },
      {
        "date": "01.31",
        "priceEok": "6억5,000",
        "areaPyeong": 34.9,
        "floor": 13,
        "area": 115.21
      },
      {
        "date": "01.10",
        "priceEok": "5억",
        "areaPyeong": 35,
        "floor": 16,
        "area": 115.63
      },
      {
        "date": "12.05",
        "priceEok": "6억7,000",
        "areaPyeong": 34.9,
        "floor": 24,
        "area": 115.21
      }
    ]
  },
  "동탄역시범반도유보라아이비파크1.0": {
    "latestPrice": 104500,
    "latestPriceEok": "10억4,500",
    "latestArea": 25.7,
    "latestFloor": 4,
    "latestDate": "20260304",
    "maxPrice": 130000,
    "maxPriceEok": "13억",
    "minPrice": 43501,
    "minPriceEok": "4억3,501",
    "txCount": 495,
    "recent": [
      {
        "date": "03.04",
        "priceEok": "10억4,500",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.9885
      },
      {
        "date": "03.02",
        "priceEok": "11억4,500",
        "areaPyeong": 30,
        "floor": 9,
        "area": 99.0153
      },
      {
        "date": "03.02",
        "priceEok": "10억7,700",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.9885
      },
      {
        "date": "02.27",
        "priceEok": "9억9,700",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.9885
      }
    ]
  },
  "동탄숲속마을자연앤경남아너스빌(1115-0)": {
    "latestPrice": 62000,
    "latestPriceEok": "6억2,000",
    "latestArea": 25.6,
    "latestFloor": 14,
    "latestDate": "20260304",
    "maxPrice": 72300,
    "maxPriceEok": "7억2,300",
    "minPrice": 16440,
    "minPriceEok": "1억6,440",
    "txCount": 753,
    "recent": [
      {
        "date": "03.04",
        "priceEok": "6억2,000",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.55
      },
      {
        "date": "02.27",
        "priceEok": "5억8,000",
        "areaPyeong": 23.1,
        "floor": 17,
        "area": 76.51
      },
      {
        "date": "02.12",
        "priceEok": "6억",
        "areaPyeong": 23.1,
        "floor": 7,
        "area": 76.51
      },
      {
        "date": "02.08",
        "priceEok": "5억6,500",
        "areaPyeong": 23.1,
        "floor": 17,
        "area": 76.51
      }
    ]
  },
  "동탄동원로얄듀크2차": {
    "latestPrice": 58500,
    "latestPriceEok": "5억8,500",
    "latestArea": 25.7,
    "latestFloor": 1,
    "latestDate": "20260304",
    "maxPrice": 77800,
    "maxPriceEok": "7억7,800",
    "minPrice": 34766,
    "minPriceEok": "3억4,766",
    "txCount": 223,
    "recent": [
      {
        "date": "03.04",
        "priceEok": "5억8,500",
        "areaPyeong": 25.7,
        "floor": 1,
        "area": 84.9889
      },
      {
        "date": "02.25",
        "priceEok": "5억9,300",
        "areaPyeong": 22.5,
        "floor": 5,
        "area": 74.5395
      },
      {
        "date": "02.24",
        "priceEok": "6억4,000",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.9889
      },
      {
        "date": "02.21",
        "priceEok": "6억5,000",
        "areaPyeong": 25.7,
        "floor": 8,
        "area": 84.9889
      }
    ]
  },
  "나루마을한화꿈에그린우림필유": {
    "latestPrice": 73000,
    "latestPriceEok": "7억3,000",
    "latestArea": 25.7,
    "latestFloor": 14,
    "latestDate": "20260304",
    "maxPrice": 76500,
    "maxPriceEok": "7억6,500",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 806,
    "recent": [
      {
        "date": "03.04",
        "priceEok": "7억3,000",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.96
      },
      {
        "date": "01.29",
        "priceEok": "7억3,000",
        "areaPyeong": 25.7,
        "floor": 23,
        "area": 84.94
      },
      {
        "date": "01.27",
        "priceEok": "6억9,500",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.96
      },
      {
        "date": "01.23",
        "priceEok": "7억3,500",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.96
      }
    ]
  },
  "솔빛마을신도브래뉴": {
    "latestPrice": 50000,
    "latestPriceEok": "5억",
    "latestArea": 24.1,
    "latestFloor": 8,
    "latestDate": "20260303",
    "maxPrice": 78800,
    "maxPriceEok": "7억8,800",
    "minPrice": 27500,
    "minPriceEok": "2억7,500",
    "txCount": 692,
    "recent": [
      {
        "date": "03.03",
        "priceEok": "5억",
        "areaPyeong": 24.1,
        "floor": 8,
        "area": 79.6171
      },
      {
        "date": "02.20",
        "priceEok": "7억8,800",
        "areaPyeong": 25.6,
        "floor": 21,
        "area": 84.753
      },
      {
        "date": "02.07",
        "priceEok": "7억7,000",
        "areaPyeong": 25.6,
        "floor": 29,
        "area": 84.753
      },
      {
        "date": "01.24",
        "priceEok": "6억8,000",
        "areaPyeong": 24.1,
        "floor": 14,
        "area": 79.6171
      }
    ]
  },
  "레이크반도유보라아이비파크9.0": {
    "latestPrice": 66000,
    "latestPriceEok": "6억6,000",
    "latestArea": 31.6,
    "latestFloor": 5,
    "latestDate": "20260303",
    "maxPrice": 103000,
    "maxPriceEok": "10억3,000",
    "minPrice": 35000,
    "minPriceEok": "3억5,000",
    "txCount": 261,
    "recent": [
      {
        "date": "03.03",
        "priceEok": "6억6,000",
        "areaPyeong": 31.6,
        "floor": 5,
        "area": 104.3613
      },
      {
        "date": "03.02",
        "priceEok": "6억5,500",
        "areaPyeong": 30.9,
        "floor": 12,
        "area": 101.998
      },
      {
        "date": "02.20",
        "priceEok": "6억",
        "areaPyeong": 30.9,
        "floor": 6,
        "area": 101.998
      },
      {
        "date": "02.11",
        "priceEok": "6억",
        "areaPyeong": 30.9,
        "floor": 14,
        "area": 101.998
      }
    ]
  },
  "동탄역시범금강펜테리움센트럴파크3": {
    "latestPrice": 128000,
    "latestPriceEok": "12억8,000",
    "latestArea": 25.7,
    "latestFloor": 13,
    "latestDate": "20260303",
    "maxPrice": 158000,
    "maxPriceEok": "15억8,000",
    "minPrice": 46800,
    "minPriceEok": "4억6,800",
    "txCount": 81,
    "recent": [
      {
        "date": "03.03",
        "priceEok": "12억8,000",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.9855
      },
      {
        "date": "02.05",
        "priceEok": "12억5,500",
        "areaPyeong": 30.2,
        "floor": 2,
        "area": 99.9262
      },
      {
        "date": "02.02",
        "priceEok": "13억",
        "areaPyeong": 25.7,
        "floor": 9,
        "area": 84.9748
      },
      {
        "date": "01.31",
        "priceEok": "15억",
        "areaPyeong": 30.2,
        "floor": 6,
        "area": 99.9736
      }
    ]
  },
  "동탄금강펜테리움센트럴파크Ⅳ": {
    "latestPrice": 55500,
    "latestPriceEok": "5억5,500",
    "latestArea": 22.6,
    "latestFloor": 17,
    "latestDate": "20260303",
    "maxPrice": 77000,
    "maxPriceEok": "7억7,000",
    "minPrice": 32050,
    "minPriceEok": "3억2,050",
    "txCount": 465,
    "recent": [
      {
        "date": "03.03",
        "priceEok": "5억5,500",
        "areaPyeong": 22.6,
        "floor": 17,
        "area": 74.8709
      },
      {
        "date": "03.02",
        "priceEok": "5억7,500",
        "areaPyeong": 22.6,
        "floor": 17,
        "area": 74.8709
      },
      {
        "date": "02.26",
        "priceEok": "5억6,000",
        "areaPyeong": 22.6,
        "floor": 19,
        "area": 74.8709
      },
      {
        "date": "02.24",
        "priceEok": "6억1,800",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.9723
      }
    ]
  },
  "한화 포레나 동탄호수": {
    "latestPrice": 80000,
    "latestPriceEok": "8억",
    "latestArea": 25.4,
    "latestFloor": 21,
    "latestDate": "20260302",
    "maxPrice": 85000,
    "maxPriceEok": "8억5,000",
    "minPrice": 40000,
    "minPriceEok": "4억",
    "txCount": 134,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "8억",
        "areaPyeong": 25.4,
        "floor": 21,
        "area": 84.05
      },
      {
        "date": "03.02",
        "priceEok": "7억1,000",
        "areaPyeong": 22.4,
        "floor": 18,
        "area": 74.21
      },
      {
        "date": "02.28",
        "priceEok": "7억2,000",
        "areaPyeong": 22.4,
        "floor": 15,
        "area": 74.21
      },
      {
        "date": "02.25",
        "priceEok": "7억3,000",
        "areaPyeong": 22.4,
        "floor": 21,
        "area": 74.21
      }
    ]
  },
  "시범한빛마을한화꿈에그린": {
    "latestPrice": 80200,
    "latestPriceEok": "8억200",
    "latestArea": 25.7,
    "latestFloor": 13,
    "latestDate": "20260302",
    "maxPrice": 92000,
    "maxPriceEok": "9억2,000",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 598,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "8억200",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.8
      },
      {
        "date": "02.05",
        "priceEok": "7억860",
        "areaPyeong": 25.6,
        "floor": 2,
        "area": 84.79
      },
      {
        "date": "01.23",
        "priceEok": "7억8,000",
        "areaPyeong": 25.6,
        "floor": 7,
        "area": 84.73
      },
      {
        "date": "01.22",
        "priceEok": "7억3,500",
        "areaPyeong": 25.6,
        "floor": 8,
        "area": 84.79
      }
    ]
  },
  "시범반도유보라아이비파크4.0": {
    "latestPrice": 132500,
    "latestPriceEok": "13억2,500",
    "latestArea": 29.3,
    "latestFloor": 23,
    "latestDate": "20260302",
    "maxPrice": 142000,
    "maxPriceEok": "14억2,000",
    "minPrice": 61000,
    "minPriceEok": "6억1,000",
    "txCount": 306,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "13억2,500",
        "areaPyeong": 29.3,
        "floor": 23,
        "area": 96.7283
      },
      {
        "date": "02.21",
        "priceEok": "12억1,000",
        "areaPyeong": 29.3,
        "floor": 15,
        "area": 96.7283
      },
      {
        "date": "02.18",
        "priceEok": "11억5,500",
        "areaPyeong": 25.7,
        "floor": 22,
        "area": 84.9705
      },
      {
        "date": "02.13",
        "priceEok": "11억3,500",
        "areaPyeong": 25.7,
        "floor": 6,
        "area": 84.9705
      }
    ]
  },
  "시범다은마을우남퍼스트빌": {
    "latestPrice": 59800,
    "latestPriceEok": "5억9,800",
    "latestArea": 20.3,
    "latestFloor": 5,
    "latestDate": "20260302",
    "maxPrice": 77000,
    "maxPriceEok": "7억7,000",
    "minPrice": 20000,
    "minPriceEok": "2억",
    "txCount": 742,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "5억9,800",
        "areaPyeong": 20.3,
        "floor": 5,
        "area": 67.0661
      },
      {
        "date": "02.19",
        "priceEok": "6억8,500",
        "areaPyeong": 20.3,
        "floor": 20,
        "area": 67.0661
      },
      {
        "date": "02.09",
        "priceEok": "6억8,000",
        "areaPyeong": 25.7,
        "floor": 26,
        "area": 84.9743
      },
      {
        "date": "02.09",
        "priceEok": "6억6,500",
        "areaPyeong": 20.3,
        "floor": 11,
        "area": 67.0661
      }
    ]
  },
  "동탄역시범대원칸타빌아파트": {
    "latestPrice": 120300,
    "latestPriceEok": "12억300",
    "latestArea": 25.6,
    "latestFloor": 7,
    "latestDate": "20260302",
    "maxPrice": 150000,
    "maxPriceEok": "15억",
    "minPrice": 47000,
    "minPriceEok": "4억7,000",
    "txCount": 208,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "12억300",
        "areaPyeong": 25.6,
        "floor": 7,
        "area": 84.705
      },
      {
        "date": "02.21",
        "priceEok": "12억5,000",
        "areaPyeong": 25.6,
        "floor": 15,
        "area": 84.786
      },
      {
        "date": "02.04",
        "priceEok": "12억",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.705
      },
      {
        "date": "02.03",
        "priceEok": "12억",
        "areaPyeong": 25.6,
        "floor": 17,
        "area": 84.786
      }
    ]
  },
  "동탄역대원칸타빌포레지움": {
    "latestPrice": 72000,
    "latestPriceEok": "7억2,000",
    "latestArea": 25.6,
    "latestFloor": 22,
    "latestDate": "20260302",
    "maxPrice": 149000,
    "maxPriceEok": "14억9,000",
    "minPrice": 38000,
    "minPriceEok": "3억8,000",
    "txCount": 358,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "7억2,000",
        "areaPyeong": 25.6,
        "floor": 22,
        "area": 84.786
      },
      {
        "date": "02.28",
        "priceEok": "7억400",
        "areaPyeong": 25.5,
        "floor": 21,
        "area": 84.208
      },
      {
        "date": "02.14",
        "priceEok": "7억",
        "areaPyeong": 25.6,
        "floor": 6,
        "area": 84.786
      },
      {
        "date": "02.07",
        "priceEok": "6억7,800",
        "areaPyeong": 25.5,
        "floor": 9,
        "area": 84.208
      }
    ]
  },
  "동탄역 반도유보라 아이비파크 8.0": {
    "latestPrice": 127500,
    "latestPriceEok": "12억7,500",
    "latestArea": 26.1,
    "latestFloor": 25,
    "latestDate": "20260302",
    "maxPrice": 144700,
    "maxPriceEok": "14억4,700",
    "minPrice": 60000,
    "minPriceEok": "6억",
    "txCount": 159,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "12억7,500",
        "areaPyeong": 26.1,
        "floor": 25,
        "area": 86.2318
      },
      {
        "date": "02.28",
        "priceEok": "11억9,500",
        "areaPyeong": 22.3,
        "floor": 26,
        "area": 73.6524
      },
      {
        "date": "02.21",
        "priceEok": "13억3,000",
        "areaPyeong": 26.1,
        "floor": 18,
        "area": 86.2318
      },
      {
        "date": "02.20",
        "priceEok": "11억7,000",
        "areaPyeong": 22.3,
        "floor": 20,
        "area": 73.6524
      }
    ]
  },
  "동탄시범다은마을 메타역 롯데캐슬": {
    "latestPrice": 73000,
    "latestPriceEok": "7억3,000",
    "latestArea": 25.5,
    "latestFloor": 9,
    "latestDate": "20260302",
    "maxPrice": 93000,
    "maxPriceEok": "9억3,000",
    "minPrice": 26000,
    "minPriceEok": "2억6,000",
    "txCount": 409,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "7억3,000",
        "areaPyeong": 25.5,
        "floor": 9,
        "area": 84.157
      },
      {
        "date": "02.23",
        "priceEok": "8억1,500",
        "areaPyeong": 31.2,
        "floor": 7,
        "area": 103.295
      },
      {
        "date": "02.21",
        "priceEok": "7억500",
        "areaPyeong": 25.5,
        "floor": 3,
        "area": 84.157
      },
      {
        "date": "01.30",
        "priceEok": "7억",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.814
      }
    ]
  },
  "동탄숲속마을 광명메이루즈": {
    "latestPrice": 61000,
    "latestPriceEok": "6억1,000",
    "latestArea": 25.5,
    "latestFloor": 11,
    "latestDate": "20260302",
    "maxPrice": 70000,
    "maxPriceEok": "7억",
    "minPrice": 21352,
    "minPriceEok": "2억1,352",
    "txCount": 407,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "6억1,000",
        "areaPyeong": 25.5,
        "floor": 11,
        "area": 84.23
      },
      {
        "date": "01.26",
        "priceEok": "6억1,000",
        "areaPyeong": 25.6,
        "floor": 15,
        "area": 84.496
      },
      {
        "date": "11.22",
        "priceEok": "6억3,850",
        "areaPyeong": 25.5,
        "floor": 3,
        "area": 84.23
      },
      {
        "date": "11.08",
        "priceEok": "6억",
        "areaPyeong": 25.5,
        "floor": 12,
        "area": 84.23
      }
    ]
  },
  "동탄2엘에이치26단지아파트(에이65블록)": {
    "latestPrice": 65300,
    "latestPriceEok": "6억5,300",
    "latestArea": 22.6,
    "latestFloor": 21,
    "latestDate": "20260302",
    "maxPrice": 68000,
    "maxPriceEok": "6억8,000",
    "minPrice": 57000,
    "minPriceEok": "5억7,000",
    "txCount": 27,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "6억5,300",
        "areaPyeong": 22.6,
        "floor": 21,
        "area": 74.7
      },
      {
        "date": "02.23",
        "priceEok": "5억7,000",
        "areaPyeong": 22.7,
        "floor": 5,
        "area": 74.89
      },
      {
        "date": "02.16",
        "priceEok": "6억3,000",
        "areaPyeong": 22.6,
        "floor": 4,
        "area": 74.75
      },
      {
        "date": "02.12",
        "priceEok": "6억4,750",
        "areaPyeong": 22.6,
        "floor": 22,
        "area": 74.7
      }
    ]
  },
  "동탄2아이파크2단지": {
    "latestPrice": 51500,
    "latestPriceEok": "5억1,500",
    "latestArea": 25.7,
    "latestFloor": 15,
    "latestDate": "20260302",
    "maxPrice": 83800,
    "maxPriceEok": "8억3,800",
    "minPrice": 35700,
    "minPriceEok": "3억5,700",
    "txCount": 135,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "5억1,500",
        "areaPyeong": 25.7,
        "floor": 15,
        "area": 84.8688
      },
      {
        "date": "02.26",
        "priceEok": "5억3,000",
        "areaPyeong": 25.7,
        "floor": 1,
        "area": 84.8688
      },
      {
        "date": "02.13",
        "priceEok": "5억500",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.8688
      },
      {
        "date": "02.13",
        "priceEok": "5억",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.8688
      }
    ]
  },
  "더레이크시티부영2단지": {
    "latestPrice": 76000,
    "latestPriceEok": "7억6,000",
    "latestArea": 25.6,
    "latestFloor": 15,
    "latestDate": "20260302",
    "maxPrice": 138000,
    "maxPriceEok": "13억8,000",
    "minPrice": 46500,
    "minPriceEok": "4억6,500",
    "txCount": 94,
    "recent": [
      {
        "date": "03.02",
        "priceEok": "7억6,000",
        "areaPyeong": 25.6,
        "floor": 15,
        "area": 84.5413
      },
      {
        "date": "02.04",
        "priceEok": "7억2,000",
        "areaPyeong": 25.6,
        "floor": 5,
        "area": 84.5413
      },
      {
        "date": "01.31",
        "priceEok": "8억3,000",
        "areaPyeong": 25.6,
        "floor": 24,
        "area": 84.52
      },
      {
        "date": "01.28",
        "priceEok": "9억5,000",
        "areaPyeong": 40.8,
        "floor": 4,
        "area": 134.8169
      }
    ]
  },
  "동탄역시범예미지아파트": {
    "latestPrice": 100000,
    "latestPriceEok": "10억",
    "latestArea": 25.7,
    "latestFloor": 4,
    "latestDate": "20260301",
    "maxPrice": 113000,
    "maxPriceEok": "11억3,000",
    "minPrice": 38375,
    "minPriceEok": "3억8,375",
    "txCount": 329,
    "recent": [
      {
        "date": "03.01",
        "priceEok": "10억",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.8
      },
      {
        "date": "02.27",
        "priceEok": "9억9,700",
        "areaPyeong": 25.7,
        "floor": 1,
        "area": 84.9351
      },
      {
        "date": "02.14",
        "priceEok": "10억4,500",
        "areaPyeong": 25.7,
        "floor": 8,
        "area": 84.8
      },
      {
        "date": "02.06",
        "priceEok": "9억4,000",
        "areaPyeong": 25.7,
        "floor": 3,
        "area": 84.9962
      }
    ]
  },
  "시범한빛마을삼부르네상스": {
    "latestPrice": 70000,
    "latestPriceEok": "7억",
    "latestArea": 25.6,
    "latestFloor": 18,
    "latestDate": "20260228",
    "maxPrice": 89000,
    "maxPriceEok": "8억9,000",
    "minPrice": 23500,
    "minPriceEok": "2억3,500",
    "txCount": 788,
    "recent": [
      {
        "date": "02.28",
        "priceEok": "7억",
        "areaPyeong": 25.6,
        "floor": 18,
        "area": 84.691
      },
      {
        "date": "02.20",
        "priceEok": "8억2,000",
        "areaPyeong": 25.6,
        "floor": 16,
        "area": 84.712
      },
      {
        "date": "02.12",
        "priceEok": "7억9,000",
        "areaPyeong": 25.6,
        "floor": 8,
        "area": 84.768
      },
      {
        "date": "02.08",
        "priceEok": "6억7,000",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.691
      }
    ]
  },
  "동탄플래티넘": {
    "latestPrice": 65000,
    "latestPriceEok": "6억5,000",
    "latestArea": 36.4,
    "latestFloor": 34,
    "latestDate": "20260228",
    "maxPrice": 71000,
    "maxPriceEok": "7억1,000",
    "minPrice": 35617,
    "minPriceEok": "3억5,617",
    "txCount": 95,
    "recent": [
      {
        "date": "02.28",
        "priceEok": "6억5,000",
        "areaPyeong": 36.4,
        "floor": 34,
        "area": 120.47
      },
      {
        "date": "01.23",
        "priceEok": "5억9,950",
        "areaPyeong": 36.4,
        "floor": 17,
        "area": 120.47
      },
      {
        "date": "12.25",
        "priceEok": "6억3,000",
        "areaPyeong": 36.4,
        "floor": 31,
        "area": 120.47
      },
      {
        "date": "07.03",
        "priceEok": "6억4,000",
        "areaPyeong": 36.4,
        "floor": 25,
        "area": 120.47
      }
    ]
  },
  "동탄역신안인스빌리베라1차": {
    "latestPrice": 83800,
    "latestPriceEok": "8억3,800",
    "latestArea": 30.9,
    "latestFloor": 15,
    "latestDate": "20260228",
    "maxPrice": 97000,
    "maxPriceEok": "9억7,000",
    "minPrice": 36500,
    "minPriceEok": "3억6,500",
    "txCount": 427,
    "recent": [
      {
        "date": "02.28",
        "priceEok": "8억3,800",
        "areaPyeong": 30.9,
        "floor": 15,
        "area": 101.9997
      },
      {
        "date": "02.14",
        "priceEok": "7억3,000",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.9814
      },
      {
        "date": "02.09",
        "priceEok": "7억5,000",
        "areaPyeong": 30.9,
        "floor": 1,
        "area": 101.989
      },
      {
        "date": "02.07",
        "priceEok": "7억1,500",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.9814
      }
    ]
  },
  "동탄역센트럴자이(A-10)": {
    "latestPrice": 105000,
    "latestPriceEok": "10억5,000",
    "latestArea": 25.7,
    "latestFloor": 11,
    "latestDate": "20260228",
    "maxPrice": 119000,
    "maxPriceEok": "11억9,000",
    "minPrice": 34500,
    "minPriceEok": "3억4,500",
    "txCount": 347,
    "recent": [
      {
        "date": "02.28",
        "priceEok": "10억5,000",
        "areaPyeong": 25.7,
        "floor": 11,
        "area": 84.8131
      },
      {
        "date": "02.21",
        "priceEok": "9억7,500",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.8131
      },
      {
        "date": "02.20",
        "priceEok": "10억3,500",
        "areaPyeong": 25.7,
        "floor": 20,
        "area": 84.9103
      },
      {
        "date": "02.20",
        "priceEok": "9억9,000",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.8131
      }
    ]
  },
  "동탄역반도유보라아이비파크2.0": {
    "latestPrice": 67500,
    "latestPriceEok": "6억7,500",
    "latestArea": 25.7,
    "latestFloor": 19,
    "latestDate": "20260228",
    "maxPrice": 78500,
    "maxPriceEok": "7억8,500",
    "minPrice": 34000,
    "minPriceEok": "3억4,000",
    "txCount": 664,
    "recent": [
      {
        "date": "02.28",
        "priceEok": "6억7,500",
        "areaPyeong": 25.7,
        "floor": 19,
        "area": 84.9921
      },
      {
        "date": "02.13",
        "priceEok": "6억",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.96
      },
      {
        "date": "02.11",
        "priceEok": "6억6,000",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.9921
      },
      {
        "date": "02.11",
        "priceEok": "6억4,000",
        "areaPyeong": 25.7,
        "floor": 16,
        "area": 84.9921
      }
    ]
  },
  "동탄숲속마을 능동역 리체 더 포레스트": {
    "latestPrice": 53500,
    "latestPriceEok": "5억3,500",
    "latestArea": 27.2,
    "latestFloor": 7,
    "latestDate": "20260228",
    "maxPrice": 90000,
    "maxPriceEok": "9억",
    "minPrice": 21660,
    "minPriceEok": "2억1,660",
    "txCount": 517,
    "recent": [
      {
        "date": "02.28",
        "priceEok": "5억3,500",
        "areaPyeong": 27.2,
        "floor": 7,
        "area": 90.0519
      },
      {
        "date": "02.20",
        "priceEok": "5억2,500",
        "areaPyeong": 27.2,
        "floor": 13,
        "area": 90.0519
      },
      {
        "date": "02.20",
        "priceEok": "6억2,000",
        "areaPyeong": 33.3,
        "floor": 21,
        "area": 110.1671
      },
      {
        "date": "02.03",
        "priceEok": "9억",
        "areaPyeong": 46,
        "floor": 25,
        "area": 152.0301
      }
    ]
  },
  "더레이크시티부영1단지": {
    "latestPrice": 59900,
    "latestPriceEok": "5억9,900",
    "latestArea": 18.1,
    "latestFloor": 19,
    "latestDate": "20260228",
    "maxPrice": 94800,
    "maxPriceEok": "9억4,800",
    "minPrice": 30200,
    "minPriceEok": "3억200",
    "txCount": 257,
    "recent": [
      {
        "date": "02.28",
        "priceEok": "5억9,900",
        "areaPyeong": 18.1,
        "floor": 19,
        "area": 59.9912
      },
      {
        "date": "02.21",
        "priceEok": "7억6,400",
        "areaPyeong": 25.6,
        "floor": 18,
        "area": 84.52
      },
      {
        "date": "02.08",
        "priceEok": "5억9,800",
        "areaPyeong": 18.3,
        "floor": 11,
        "area": 60.3768
      },
      {
        "date": "02.07",
        "priceEok": "5억8,250",
        "areaPyeong": 18.1,
        "floor": 5,
        "area": 59.9912
      }
    ]
  },
  "중흥에스클래스에듀하이": {
    "latestPrice": 66500,
    "latestPriceEok": "6억6,500",
    "latestArea": 25.1,
    "latestFloor": 22,
    "latestDate": "20260227",
    "maxPrice": 74500,
    "maxPriceEok": "7억4,500",
    "minPrice": 54766,
    "minPriceEok": "5억4,766",
    "txCount": 58,
    "recent": [
      {
        "date": "02.27",
        "priceEok": "6억6,500",
        "areaPyeong": 25.1,
        "floor": 22,
        "area": 83.0109
      },
      {
        "date": "02.26",
        "priceEok": "6억5,000",
        "areaPyeong": 25.1,
        "floor": 10,
        "area": 83.0109
      },
      {
        "date": "01.27",
        "priceEok": "6억5,000",
        "areaPyeong": 25.1,
        "floor": 23,
        "area": 83.0109
      },
      {
        "date": "01.03",
        "priceEok": "7억3,900",
        "areaPyeong": 25.1,
        "floor": 22,
        "area": 83.0109
      }
    ]
  },
  "동탄역시범리슈빌아파트": {
    "latestPrice": 121000,
    "latestPriceEok": "12억1,000",
    "latestArea": 25.7,
    "latestFloor": 11,
    "latestDate": "20260227",
    "maxPrice": 149000,
    "maxPriceEok": "14억9,000",
    "minPrice": 45000,
    "minPriceEok": "4억5,000",
    "txCount": 331,
    "recent": [
      {
        "date": "02.27",
        "priceEok": "12억1,000",
        "areaPyeong": 25.7,
        "floor": 11,
        "area": 84.87
      },
      {
        "date": "02.20",
        "priceEok": "12억7,000",
        "areaPyeong": 30.8,
        "floor": 6,
        "area": 101.74
      },
      {
        "date": "02.11",
        "priceEok": "12억8,000",
        "areaPyeong": 30.7,
        "floor": 7,
        "area": 101.57
      },
      {
        "date": "02.10",
        "priceEok": "11억3,500",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.87
      }
    ]
  },
  "동탄역삼정그린코아": {
    "latestPrice": 112000,
    "latestPriceEok": "11억2,000",
    "latestArea": 24.6,
    "latestFloor": 19,
    "latestDate": "20260227",
    "maxPrice": 128000,
    "maxPriceEok": "12억8,000",
    "minPrice": 50000,
    "minPriceEok": "5억",
    "txCount": 29,
    "recent": [
      {
        "date": "02.27",
        "priceEok": "11억2,000",
        "areaPyeong": 24.6,
        "floor": 19,
        "area": 81.3533
      },
      {
        "date": "02.21",
        "priceEok": "11억2,500",
        "areaPyeong": 24.6,
        "floor": 37,
        "area": 81.3533
      },
      {
        "date": "01.31",
        "priceEok": "11억3,700",
        "areaPyeong": 24.6,
        "floor": 32,
        "area": 81.3533
      },
      {
        "date": "01.22",
        "priceEok": "11억3,000",
        "areaPyeong": 24.6,
        "floor": 17,
        "area": 81.2159
      }
    ]
  },
  "동탄역 호반 써밋": {
    "latestPrice": 76300,
    "latestPriceEok": "7억6,300",
    "latestArea": 18.1,
    "latestFloor": 13,
    "latestDate": "20260227",
    "maxPrice": 90000,
    "maxPriceEok": "9억",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 733,
    "recent": [
      {
        "date": "02.27",
        "priceEok": "7억6,300",
        "areaPyeong": 18.1,
        "floor": 13,
        "area": 59.8365
      },
      {
        "date": "02.21",
        "priceEok": "8억3,500",
        "areaPyeong": 25.7,
        "floor": 3,
        "area": 84.957
      },
      {
        "date": "02.21",
        "priceEok": "7억6,000",
        "areaPyeong": 17.9,
        "floor": 7,
        "area": 59.1612
      },
      {
        "date": "02.07",
        "priceEok": "8억9,900",
        "areaPyeong": 25.7,
        "floor": 16,
        "area": 84.957
      }
    ]
  },
  "나루마을월드메르디앙반도유보라": {
    "latestPrice": 96500,
    "latestPriceEok": "9억6,500",
    "latestArea": 42.2,
    "latestFloor": 13,
    "latestDate": "20260227",
    "maxPrice": 109500,
    "maxPriceEok": "10억9,500",
    "minPrice": 34700,
    "minPriceEok": "3억4,700",
    "txCount": 523,
    "recent": [
      {
        "date": "02.27",
        "priceEok": "9억6,500",
        "areaPyeong": 42.2,
        "floor": 13,
        "area": 139.4524
      },
      {
        "date": "01.21",
        "priceEok": "8억5,000",
        "areaPyeong": 35.1,
        "floor": 17,
        "area": 116.0155
      },
      {
        "date": "01.09",
        "priceEok": "7억6,000",
        "areaPyeong": 33.5,
        "floor": 8,
        "area": 110.7323
      },
      {
        "date": "12.27",
        "priceEok": "7억4,500",
        "areaPyeong": 33.5,
        "floor": 3,
        "area": 110.7323
      }
    ]
  },
  "시범다은마을삼성래미안": {
    "latestPrice": 75000,
    "latestPriceEok": "7억5,000",
    "latestArea": 25.6,
    "latestFloor": 15,
    "latestDate": "20260226",
    "maxPrice": 103500,
    "maxPriceEok": "10억3,500",
    "minPrice": 23000,
    "minPriceEok": "2억3,000",
    "txCount": 537,
    "recent": [
      {
        "date": "02.26",
        "priceEok": "7억5,000",
        "areaPyeong": 25.6,
        "floor": 15,
        "area": 84.6098
      },
      {
        "date": "02.09",
        "priceEok": "8억500",
        "areaPyeong": 29.3,
        "floor": 24,
        "area": 96.974
      },
      {
        "date": "02.07",
        "priceEok": "8억6,000",
        "areaPyeong": 34.4,
        "floor": 7,
        "area": 113.6529
      },
      {
        "date": "01.31",
        "priceEok": "7억6,900",
        "areaPyeong": 25.6,
        "floor": 4,
        "area": 84.6098
      }
    ]
  },
  "동탄시범다은마을 월드메르디앙 반도유보라": {
    "latestPrice": 93000,
    "latestPriceEok": "9억3,000",
    "latestArea": 25.6,
    "latestFloor": 13,
    "latestDate": "20260226",
    "maxPrice": 98000,
    "maxPriceEok": "9억8,000",
    "minPrice": 17500,
    "minPriceEok": "1억7,500",
    "txCount": 2375,
    "recent": [
      {
        "date": "02.26",
        "priceEok": "9억3,000",
        "areaPyeong": 25.6,
        "floor": 13,
        "area": 84.65
      },
      {
        "date": "02.26",
        "priceEok": "6억8,500",
        "areaPyeong": 17.9,
        "floor": 6,
        "area": 59.07
      },
      {
        "date": "02.25",
        "priceEok": "6억",
        "areaPyeong": 17.9,
        "floor": 1,
        "area": 59.07
      },
      {
        "date": "02.24",
        "priceEok": "7억800",
        "areaPyeong": 23.2,
        "floor": 1,
        "area": 76.78
      }
    ]
  },
  "나루마을한화꿈에그린": {
    "latestPrice": 75000,
    "latestPriceEok": "7억5,000",
    "latestArea": 29.3,
    "latestFloor": 6,
    "latestDate": "20260226",
    "maxPrice": 92000,
    "maxPriceEok": "9억2,000",
    "minPrice": 22400,
    "minPriceEok": "2억2,400",
    "txCount": 682,
    "recent": [
      {
        "date": "02.26",
        "priceEok": "7억5,000",
        "areaPyeong": 29.3,
        "floor": 6,
        "area": 96.84
      },
      {
        "date": "02.25",
        "priceEok": "7억6,000",
        "areaPyeong": 29.5,
        "floor": 5,
        "area": 97.6
      },
      {
        "date": "02.21",
        "priceEok": "8억2,500",
        "areaPyeong": 34.4,
        "floor": 6,
        "area": 113.61
      },
      {
        "date": "02.10",
        "priceEok": "7억6,500",
        "areaPyeong": 29.5,
        "floor": 5,
        "area": 97.6
      }
    ]
  },
  "나루마을신도브래뉴": {
    "latestPrice": 85500,
    "latestPriceEok": "8억5,500",
    "latestArea": 31.4,
    "latestFloor": 16,
    "latestDate": "20260225",
    "maxPrice": 100000,
    "maxPriceEok": "10억",
    "minPrice": 32100,
    "minPriceEok": "3억2,100",
    "txCount": 784,
    "recent": [
      {
        "date": "02.25",
        "priceEok": "8억5,500",
        "areaPyeong": 31.4,
        "floor": 16,
        "area": 103.9466
      },
      {
        "date": "02.21",
        "priceEok": "8억8,500",
        "areaPyeong": 31.4,
        "floor": 26,
        "area": 103.9466
      },
      {
        "date": "01.31",
        "priceEok": "8억2,000",
        "areaPyeong": 29.2,
        "floor": 4,
        "area": 96.4338
      },
      {
        "date": "01.20",
        "priceEok": "9억4,900",
        "areaPyeong": 38.7,
        "floor": 5,
        "area": 128.0152
      }
    ]
  },
  "신일유토빌": {
    "latestPrice": 86000,
    "latestPriceEok": "8억6,000",
    "latestArea": 38.8,
    "latestFloor": 24,
    "latestDate": "20260223",
    "maxPrice": 114000,
    "maxPriceEok": "11억4,000",
    "minPrice": 34000,
    "minPriceEok": "3억4,000",
    "txCount": 550,
    "recent": [
      {
        "date": "02.23",
        "priceEok": "8억6,000",
        "areaPyeong": 38.8,
        "floor": 24,
        "area": 128.379
      },
      {
        "date": "02.20",
        "priceEok": "6억9,500",
        "areaPyeong": 30.8,
        "floor": 3,
        "area": 101.857
      },
      {
        "date": "01.19",
        "priceEok": "7억2,900",
        "areaPyeong": 30.8,
        "floor": 2,
        "area": 101.857
      },
      {
        "date": "01.16",
        "priceEok": "7억",
        "areaPyeong": 30.8,
        "floor": 3,
        "area": 101.857
      }
    ]
  },
  "시범다은마을포스코더샵": {
    "latestPrice": 80000,
    "latestPriceEok": "8억",
    "latestArea": 25.6,
    "latestFloor": 16,
    "latestDate": "20260223",
    "maxPrice": 110500,
    "maxPriceEok": "11억500",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 537,
    "recent": [
      {
        "date": "02.23",
        "priceEok": "8억",
        "areaPyeong": 25.6,
        "floor": 16,
        "area": 84.5111
      },
      {
        "date": "02.23",
        "priceEok": "7억900",
        "areaPyeong": 25.6,
        "floor": 16,
        "area": 84.5111
      },
      {
        "date": "02.13",
        "priceEok": "7억4,000",
        "areaPyeong": 25.6,
        "floor": 8,
        "area": 84.5111
      },
      {
        "date": "02.10",
        "priceEok": "7억",
        "areaPyeong": 25.6,
        "floor": 17,
        "area": 84.5111
      }
    ]
  },
  "솔빛마을서해그랑블": {
    "latestPrice": 88500,
    "latestPriceEok": "8억8,500",
    "latestArea": 30.5,
    "latestFloor": 7,
    "latestDate": "20260221",
    "maxPrice": 110000,
    "maxPriceEok": "11억",
    "minPrice": 35000,
    "minPriceEok": "3억5,000",
    "txCount": 704,
    "recent": [
      {
        "date": "02.21",
        "priceEok": "8억8,500",
        "areaPyeong": 30.5,
        "floor": 7,
        "area": 100.705
      },
      {
        "date": "01.27",
        "priceEok": "8억6,500",
        "areaPyeong": 30.5,
        "floor": 9,
        "area": 100.705
      },
      {
        "date": "01.25",
        "priceEok": "8억",
        "areaPyeong": 30.5,
        "floor": 1,
        "area": 100.705
      },
      {
        "date": "01.09",
        "priceEok": "9억4,000",
        "areaPyeong": 37.6,
        "floor": 22,
        "area": 124.332
      }
    ]
  },
  "동탄역경남아너스빌": {
    "latestPrice": 76300,
    "latestPriceEok": "7억6,300",
    "latestArea": 25.4,
    "latestFloor": 27,
    "latestDate": "20260221",
    "maxPrice": 90000,
    "maxPriceEok": "9억",
    "minPrice": 45100,
    "minPriceEok": "4억5,100",
    "txCount": 199,
    "recent": [
      {
        "date": "02.21",
        "priceEok": "7억6,300",
        "areaPyeong": 25.4,
        "floor": 27,
        "area": 84.0254
      },
      {
        "date": "02.14",
        "priceEok": "7억8,000",
        "areaPyeong": 25.4,
        "floor": 17,
        "area": 84.0086
      },
      {
        "date": "01.31",
        "priceEok": "7억7,000",
        "areaPyeong": 25.4,
        "floor": 32,
        "area": 84.0086
      },
      {
        "date": "01.13",
        "priceEok": "7억7,500",
        "areaPyeong": 25.4,
        "floor": 21,
        "area": 84.0086
      }
    ]
  },
  "시범한빛마을금호어울림": {
    "latestPrice": 84000,
    "latestPriceEok": "8억4,000",
    "latestArea": 25.6,
    "latestFloor": 31,
    "latestDate": "20260220",
    "maxPrice": 88000,
    "maxPriceEok": "8억8,000",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 596,
    "recent": [
      {
        "date": "02.20",
        "priceEok": "8억4,000",
        "areaPyeong": 25.6,
        "floor": 31,
        "area": 84.465
      },
      {
        "date": "02.14",
        "priceEok": "8억8,000",
        "areaPyeong": 25.6,
        "floor": 13,
        "area": 84.613
      },
      {
        "date": "02.07",
        "priceEok": "7억1,000",
        "areaPyeong": 25.6,
        "floor": 1,
        "area": 84.54
      },
      {
        "date": "02.04",
        "priceEok": "8억3,000",
        "areaPyeong": 25.6,
        "floor": 9,
        "area": 84.465
      }
    ]
  },
  "솔빛마을경남아너스빌": {
    "latestPrice": 85500,
    "latestPriceEok": "8억5,500",
    "latestArea": 31.3,
    "latestFloor": 24,
    "latestDate": "20260219",
    "maxPrice": 108000,
    "maxPriceEok": "10억8,000",
    "minPrice": 32000,
    "minPriceEok": "3억2,000",
    "txCount": 616,
    "recent": [
      {
        "date": "02.19",
        "priceEok": "8억5,500",
        "areaPyeong": 31.3,
        "floor": 24,
        "area": 103.3947
      },
      {
        "date": "02.14",
        "priceEok": "8억1,000",
        "areaPyeong": 31.3,
        "floor": 24,
        "area": 103.3947
      },
      {
        "date": "02.06",
        "priceEok": "9억3,000",
        "areaPyeong": 38.8,
        "floor": 6,
        "area": 128.4145
      },
      {
        "date": "02.06",
        "priceEok": "8억3,000",
        "areaPyeong": 31.3,
        "floor": 14,
        "area": 103.3947
      }
    ]
  },
  "동탄역동원로얄듀크비스타3차": {
    "latestPrice": 103000,
    "latestPriceEok": "10억3,000",
    "latestArea": 25.7,
    "latestFloor": 21,
    "latestDate": "20260214",
    "maxPrice": 118000,
    "maxPriceEok": "11억8,000",
    "minPrice": 51250,
    "minPriceEok": "5억1,250",
    "txCount": 72,
    "recent": [
      {
        "date": "02.14",
        "priceEok": "10억3,000",
        "areaPyeong": 25.7,
        "floor": 21,
        "area": 84.9963
      },
      {
        "date": "02.08",
        "priceEok": "10억1,000",
        "areaPyeong": 25.7,
        "floor": 17,
        "area": 84.9989
      },
      {
        "date": "01.17",
        "priceEok": "9억1,000",
        "areaPyeong": 25.7,
        "floor": 11,
        "area": 84.9989
      },
      {
        "date": "01.17",
        "priceEok": "10억",
        "areaPyeong": 25.7,
        "floor": 22,
        "area": 84.9963
      }
    ]
  },
  "동탄린스트라우스더레이크": {
    "latestPrice": 131000,
    "latestPriceEok": "13억1,000",
    "latestArea": 29.9,
    "latestFloor": 24,
    "latestDate": "20260214",
    "maxPrice": 205000,
    "maxPriceEok": "20억5,000",
    "minPrice": 90000,
    "minPriceEok": "9억",
    "txCount": 128,
    "recent": [
      {
        "date": "02.14",
        "priceEok": "13억1,000",
        "areaPyeong": 29.9,
        "floor": 24,
        "area": 98.9373
      },
      {
        "date": "02.13",
        "priceEok": "13억5,000",
        "areaPyeong": 29.9,
        "floor": 30,
        "area": 98.9612
      },
      {
        "date": "02.11",
        "priceEok": "12억3,500",
        "areaPyeong": 29.9,
        "floor": 11,
        "area": 98.9373
      },
      {
        "date": "02.11",
        "priceEok": "12억2,000",
        "areaPyeong": 32.4,
        "floor": 7,
        "area": 106.9474
      }
    ]
  },
  "화성동탄2센트럴힐즈동탄아파트": {
    "latestPrice": 57000,
    "latestPriceEok": "5억7,000",
    "latestArea": 25.7,
    "latestFloor": 17,
    "latestDate": "20260213",
    "maxPrice": 57200,
    "maxPriceEok": "5억7,200",
    "minPrice": 46500,
    "minPriceEok": "4억6,500",
    "txCount": 13,
    "recent": [
      {
        "date": "02.13",
        "priceEok": "5억7,000",
        "areaPyeong": 25.7,
        "floor": 17,
        "area": 84.96
      },
      {
        "date": "02.12",
        "priceEok": "5억2,000",
        "areaPyeong": 22.7,
        "floor": 14,
        "area": 74.99
      },
      {
        "date": "11.20",
        "priceEok": "5억500",
        "areaPyeong": 22.7,
        "floor": 9,
        "area": 74.99
      },
      {
        "date": "11.19",
        "priceEok": "5억500",
        "areaPyeong": 22.7,
        "floor": 8,
        "area": 74.99
      }
    ]
  },
  "우미린제일풍경채": {
    "latestPrice": 64700,
    "latestPriceEok": "6억4,700",
    "latestArea": 22.4,
    "latestFloor": 22,
    "latestDate": "20260213",
    "maxPrice": 89000,
    "maxPriceEok": "8억9,000",
    "minPrice": 22850,
    "minPriceEok": "2억2,850",
    "txCount": 1428,
    "recent": [
      {
        "date": "02.13",
        "priceEok": "6억4,700",
        "areaPyeong": 22.4,
        "floor": 22,
        "area": 74.092
      },
      {
        "date": "02.12",
        "priceEok": "6억3,000",
        "areaPyeong": 23,
        "floor": 4,
        "area": 75.8689
      },
      {
        "date": "02.09",
        "priceEok": "6억7,600",
        "areaPyeong": 23,
        "floor": 14,
        "area": 75.87
      },
      {
        "date": "02.08",
        "priceEok": "6억5,000",
        "areaPyeong": 24.3,
        "floor": 21,
        "area": 80.3931
      }
    ]
  },
  "동탄파크릭스A55BL아파트": {
    "latestPrice": 77830,
    "latestPriceEok": "7억7,830",
    "latestArea": 33.5,
    "latestFloor": 1,
    "latestDate": "20260210",
    "maxPrice": 77830,
    "maxPriceEok": "7억7,830",
    "minPrice": 77830,
    "minPriceEok": "7억7,830",
    "txCount": 1,
    "recent": [
      {
        "date": "02.10",
        "priceEok": "7억7,830",
        "areaPyeong": 33.5,
        "floor": 1,
        "area": 110.7034
      }
    ]
  },
  "METAPOLIS": {
    "latestPrice": 172000,
    "latestPriceEok": "17억2,000",
    "latestArea": 56.6,
    "latestFloor": 59,
    "latestDate": "20260208",
    "maxPrice": 232500,
    "maxPriceEok": "23억2,500",
    "minPrice": 41000,
    "minPriceEok": "4억1,000",
    "txCount": 887,
    "recent": [
      {
        "date": "02.08",
        "priceEok": "17억2,000",
        "areaPyeong": 56.6,
        "floor": 59,
        "area": 187.117
      },
      {
        "date": "02.07",
        "priceEok": "11억5,000",
        "areaPyeong": 32.6,
        "floor": 48,
        "area": 107.778
      },
      {
        "date": "01.31",
        "priceEok": "10억3,000",
        "areaPyeong": 29.1,
        "floor": 47,
        "area": 96.22
      },
      {
        "date": "01.29",
        "priceEok": "9억8,000",
        "areaPyeong": 29.1,
        "floor": 37,
        "area": 96.22
      }
    ]
  },
  "금호어울림레이크2차": {
    "latestPrice": 70000,
    "latestPriceEok": "7억",
    "latestArea": 25.7,
    "latestFloor": 18,
    "latestDate": "20260207",
    "maxPrice": 89800,
    "maxPriceEok": "8억9,800",
    "minPrice": 32500,
    "minPriceEok": "3억2,500",
    "txCount": 248,
    "recent": [
      {
        "date": "02.07",
        "priceEok": "7억",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.97
      },
      {
        "date": "02.07",
        "priceEok": "6억8,900",
        "areaPyeong": 25.7,
        "floor": 17,
        "area": 84.97
      },
      {
        "date": "02.02",
        "priceEok": "6억7,900",
        "areaPyeong": 25.7,
        "floor": 6,
        "area": 84.97
      },
      {
        "date": "01.18",
        "priceEok": "6억3,000",
        "areaPyeong": 22.7,
        "floor": 14,
        "area": 74.99
      }
    ]
  },
  "솔빛마을쌍용예가": {
    "latestPrice": 78800,
    "latestPriceEok": "7억8,800",
    "latestArea": 25.7,
    "latestFloor": 5,
    "latestDate": "20260204",
    "maxPrice": 78800,
    "maxPriceEok": "7억8,800",
    "minPrice": 24000,
    "minPriceEok": "2억4,000",
    "txCount": 943,
    "recent": [
      {
        "date": "02.04",
        "priceEok": "7억8,800",
        "areaPyeong": 25.7,
        "floor": 5,
        "area": 84.9784
      },
      {
        "date": "01.31",
        "priceEok": "7억4,000",
        "areaPyeong": 25.7,
        "floor": 15,
        "area": 84.9784
      },
      {
        "date": "01.27",
        "priceEok": "6억3,800",
        "areaPyeong": 23.8,
        "floor": 1,
        "area": 78.7193
      },
      {
        "date": "01.20",
        "priceEok": "7억6,700",
        "areaPyeong": 25.7,
        "floor": 20,
        "area": 84.9794
      }
    ]
  },
  "동탄호수하우스디": {
    "latestPrice": 58000,
    "latestPriceEok": "5억8,000",
    "latestArea": 22.7,
    "latestFloor": 3,
    "latestDate": "20260202",
    "maxPrice": 69000,
    "maxPriceEok": "6억9,000",
    "minPrice": 50000,
    "minPriceEok": "5억",
    "txCount": 56,
    "recent": [
      {
        "date": "02.02",
        "priceEok": "5억8,000",
        "areaPyeong": 22.7,
        "floor": 3,
        "area": 74.94
      },
      {
        "date": "01.31",
        "priceEok": "6억7,000",
        "areaPyeong": 25.7,
        "floor": 13,
        "area": 84.97
      },
      {
        "date": "01.24",
        "priceEok": "6억500",
        "areaPyeong": 22.7,
        "floor": 9,
        "area": 74.96
      },
      {
        "date": "01.21",
        "priceEok": "6억8,500",
        "areaPyeong": 25.7,
        "floor": 16,
        "area": 84.97
      }
    ]
  },
  "동탄위버폴리스": {
    "latestPrice": 65000,
    "latestPriceEok": "6억5,000",
    "latestArea": 36.8,
    "latestFloor": 13,
    "latestDate": "20260114",
    "maxPrice": 81500,
    "maxPriceEok": "8억1,500",
    "minPrice": 32100,
    "minPriceEok": "3억2,100",
    "txCount": 104,
    "recent": [
      {
        "date": "01.14",
        "priceEok": "6억5,000",
        "areaPyeong": 36.8,
        "floor": 13,
        "area": 121.5352
      },
      {
        "date": "05.03",
        "priceEok": "6억6,000",
        "areaPyeong": 36.8,
        "floor": 10,
        "area": 121.5352
      },
      {
        "date": "10.11",
        "priceEok": "7억2,000",
        "areaPyeong": 36.8,
        "floor": 40,
        "area": 121.5781
      },
      {
        "date": "10.11",
        "priceEok": "6억1,500",
        "areaPyeong": 36.8,
        "floor": 11,
        "area": 121.5352
      }
    ]
  },
  "동탄파라곤": {
    "latestPrice": 88000,
    "latestPriceEok": "8억8,000",
    "latestArea": 48.2,
    "latestFloor": 21,
    "latestDate": "20260106",
    "maxPrice": 166500,
    "maxPriceEok": "16억6,500",
    "minPrice": 53000,
    "minPriceEok": "5억3,000",
    "txCount": 117,
    "recent": [
      {
        "date": "01.06",
        "priceEok": "8억8,000",
        "areaPyeong": 48.2,
        "floor": 21,
        "area": 159.35
      },
      {
        "date": "10.25",
        "priceEok": "8억3,000",
        "areaPyeong": 51.7,
        "floor": 8,
        "area": 170.97
      },
      {
        "date": "10.02",
        "priceEok": "7억4,500",
        "areaPyeong": 48.2,
        "floor": 6,
        "area": 159.35
      },
      {
        "date": "07.01",
        "priceEok": "8억5,000",
        "areaPyeong": 48.2,
        "floor": 12,
        "area": 159.35
      }
    ]
  },
  "동탄하이페리온": {
    "latestPrice": 61500,
    "latestPriceEok": "6억1,500",
    "latestArea": 32.4,
    "latestFloor": 10,
    "latestDate": "20260103",
    "maxPrice": 114500,
    "maxPriceEok": "11억4,500",
    "minPrice": 35000,
    "minPriceEok": "3억5,000",
    "txCount": 98,
    "recent": [
      {
        "date": "01.03",
        "priceEok": "6억1,500",
        "areaPyeong": 32.4,
        "floor": 10,
        "area": 107.13
      },
      {
        "date": "11.18",
        "priceEok": "5억6,900",
        "areaPyeong": 32.4,
        "floor": 11,
        "area": 107.13
      },
      {
        "date": "09.19",
        "priceEok": "6억9,300",
        "areaPyeong": 40.1,
        "floor": 18,
        "area": 132.66
      },
      {
        "date": "04.26",
        "priceEok": "6억5,250",
        "areaPyeong": 32.4,
        "floor": 36,
        "area": 107.13
      }
    ]
  },
  "서해더블루(93-8)": {
    "latestPrice": 59000,
    "latestPriceEok": "5억9,000",
    "latestArea": 40.6,
    "latestFloor": 12,
    "latestDate": "20251213",
    "maxPrice": 85550,
    "maxPriceEok": "8억5,550",
    "minPrice": 35200,
    "minPriceEok": "3억5,200",
    "txCount": 65,
    "recent": [
      {
        "date": "12.13",
        "priceEok": "5억9,000",
        "areaPyeong": 40.6,
        "floor": 12,
        "area": 134.2316
      },
      {
        "date": "01.06",
        "priceEok": "5억4,000",
        "areaPyeong": 42.8,
        "floor": 15,
        "area": 141.5374
      },
      {
        "date": "12.07",
        "priceEok": "4억",
        "areaPyeong": 30.9,
        "floor": 10,
        "area": 102.0359
      },
      {
        "date": "11.12",
        "priceEok": "5억7,000",
        "areaPyeong": 42.8,
        "floor": 8,
        "area": 141.5374
      }
    ]
  },
  "동탄에스원센트로빌": {
    "latestPrice": 3000,
    "latestPriceEok": "3,000만",
    "latestArea": 3.8,
    "latestFloor": 6,
    "latestDate": "20251205",
    "maxPrice": 13000,
    "maxPriceEok": "1억3,000",
    "minPrice": 2600,
    "minPriceEok": "2,600만",
    "txCount": 71,
    "recent": [
      {
        "date": "12.05",
        "priceEok": "3,000만",
        "areaPyeong": 3.8,
        "floor": 6,
        "area": 12.66
      },
      {
        "date": "09.08",
        "priceEok": "2,750만",
        "areaPyeong": 3.8,
        "floor": 6,
        "area": 12.53
      },
      {
        "date": "11.05",
        "priceEok": "4,200만",
        "areaPyeong": 4.5,
        "floor": 5,
        "area": 14.8
      },
      {
        "date": "10.17",
        "priceEok": "3,550만",
        "areaPyeong": 4.1,
        "floor": 9,
        "area": 13.43
      }
    ]
  },
  "에스원스마트빌": {
    "latestPrice": 4800,
    "latestPriceEok": "4,800만",
    "latestArea": 4.3,
    "latestFloor": 8,
    "latestDate": "20251114",
    "maxPrice": 7000,
    "maxPriceEok": "7,000만",
    "minPrice": 4200,
    "minPriceEok": "4,200만",
    "txCount": 42,
    "recent": [
      {
        "date": "11.14",
        "priceEok": "4,800만",
        "areaPyeong": 4.3,
        "floor": 8,
        "area": 14.201
      },
      {
        "date": "09.04",
        "priceEok": "5,450만",
        "areaPyeong": 4.2,
        "floor": 8,
        "area": 13.993
      },
      {
        "date": "09.04",
        "priceEok": "5,450만",
        "areaPyeong": 4.2,
        "floor": 10,
        "area": 13.993
      },
      {
        "date": "05.20",
        "priceEok": "5,500만",
        "areaPyeong": 4.3,
        "floor": 12,
        "area": 14.201
      }
    ]
  },
  "서해더블루(106-7)": {
    "latestPrice": 63000,
    "latestPriceEok": "6억3,000",
    "latestArea": 32.7,
    "latestFloor": 33,
    "latestDate": "20251021",
    "maxPrice": 65000,
    "maxPriceEok": "6억5,000",
    "minPrice": 36500,
    "minPriceEok": "3억6,500",
    "txCount": 78,
    "recent": [
      {
        "date": "10.21",
        "priceEok": "6억3,000",
        "areaPyeong": 32.7,
        "floor": 33,
        "area": 108.1715
      },
      {
        "date": "07.24",
        "priceEok": "6억",
        "areaPyeong": 33.4,
        "floor": 14,
        "area": 110.5016
      },
      {
        "date": "06.27",
        "priceEok": "6억2,000",
        "areaPyeong": 33.4,
        "floor": 25,
        "area": 110.4445
      },
      {
        "date": "06.27",
        "priceEok": "6억800",
        "areaPyeong": 33.4,
        "floor": 30,
        "area": 110.4445
      }
    ]
  },
  "동탄스카이뷰빌딩": {
    "latestPrice": 5600,
    "latestPriceEok": "5,600만",
    "latestArea": 6.5,
    "latestFloor": 11,
    "latestDate": "20250829",
    "maxPrice": 8800,
    "maxPriceEok": "8,800만",
    "minPrice": 3000,
    "minPriceEok": "3,000만",
    "txCount": 159,
    "recent": [
      {
        "date": "08.29",
        "priceEok": "5,600만",
        "areaPyeong": 6.5,
        "floor": 11,
        "area": 21.52
      },
      {
        "date": "05.30",
        "priceEok": "4,430만",
        "areaPyeong": 6,
        "floor": 9,
        "area": 19.69
      },
      {
        "date": "03.20",
        "priceEok": "4,000만",
        "areaPyeong": 5.9,
        "floor": 11,
        "area": 19.4
      },
      {
        "date": "12.31",
        "priceEok": "5,100만",
        "areaPyeong": 6.2,
        "floor": 10,
        "area": 20.59
      }
    ]
  },
  "e편한세상동탄파크아너스": {
    "latestPrice": 71000,
    "latestPriceEok": "7억1,000",
    "latestArea": 30.2,
    "latestFloor": 4,
    "latestDate": "20250628",
    "maxPrice": 71000,
    "maxPriceEok": "7억1,000",
    "minPrice": 71000,
    "minPriceEok": "7억1,000",
    "txCount": 1,
    "recent": [
      {
        "date": "06.28",
        "priceEok": "7억1,000",
        "areaPyeong": 30.2,
        "floor": 4,
        "area": 99.9666
      }
    ]
  },
  "엔터프라임빌딩": {
    "latestPrice": 7560,
    "latestPriceEok": "7,560만",
    "latestArea": 7.5,
    "latestFloor": 8,
    "latestDate": "20150818",
    "maxPrice": 7560,
    "maxPriceEok": "7,560만",
    "minPrice": 5930,
    "minPriceEok": "5,930만",
    "txCount": 7,
    "recent": [
      {
        "date": "08.18",
        "priceEok": "7,560만",
        "areaPyeong": 7.5,
        "floor": 8,
        "area": 24.66
      },
      {
        "date": "08.18",
        "priceEok": "7,160만",
        "areaPyeong": 5.7,
        "floor": 8,
        "area": 18.98
      },
      {
        "date": "08.18",
        "priceEok": "6,762만",
        "areaPyeong": 4.5,
        "floor": 8,
        "area": 14.81
      },
      {
        "date": "08.18",
        "priceEok": "6,762만",
        "areaPyeong": 4.4,
        "floor": 8,
        "area": 14.41
      }
    ]
  },
  "기안마을풍성신미주": {
    "latestPrice": 24000,
    "latestPriceEok": "2억4,000",
    "latestArea": 25.7,
    "latestFloor": 9,
    "latestDate": "20080721",
    "maxPrice": 24000,
    "maxPriceEok": "2억4,000",
    "minPrice": 24000,
    "minPriceEok": "2억4,000",
    "txCount": 1,
    "recent": [
      {
        "date": "07.21",
        "priceEok": "2억4,000",
        "areaPyeong": 25.7,
        "floor": 9,
        "area": 84.8008
      }
    ]
  },
  "리버힐": {
    "latestPrice": 13000,
    "latestPriceEok": "1억3,000",
    "latestArea": 25.4,
    "latestFloor": 6,
    "latestDate": "20070403",
    "maxPrice": 17300,
    "maxPriceEok": "1억7,300",
    "minPrice": 13000,
    "minPriceEok": "1억3,000",
    "txCount": 3,
    "recent": [
      {
        "date": "04.03",
        "priceEok": "1억3,000",
        "areaPyeong": 25.4,
        "floor": 6,
        "area": 83.88
      },
      {
        "date": "03.31",
        "priceEok": "1억7,300",
        "areaPyeong": 25.4,
        "floor": 4,
        "area": 83.88
      },
      {
        "date": "04.07",
        "priceEok": "1억3,000",
        "areaPyeong": 25.4,
        "floor": 4,
        "area": 83.88
      }
    ]
  }
};
