/**
 * 실거래가 요약 데이터 — 빌드 타임에 포함, API 호출 0
 * 
 * ⚠️ 이 파일은 자동 생성됩니다. 직접 수정하지 마세요!
 * 동기화: npm run sync-transactions
 * 마지막 동기화: 2026-03-23
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
  avg1MPrice: number;
  avg1MPriceEok: string;
  avg1MPerPyeong: number;
  avg1MTxCount: number;
  recent: RecentTx[];
}

/** 아파트명 → 거래 요약 */
export const TX_SUMMARY: Record<string, AptTxSummary> = {
  "동탄퍼스트파크": {
    "latestPrice": 43500,
    "latestPriceEok": "4억3,500",
    "latestArea": 22,
    "latestFloor": 8,
    "latestDate": "20260320",
    "maxPrice": 55800,
    "maxPriceEok": "5억5,800",
    "minPrice": 10300,
    "minPriceEok": "1억300",
    "txCount": 840,
    "avg1MPrice": 42567,
    "avg1MPriceEok": "4억2,567",
    "avg1MPerPyeong": 1935,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.20",
        "priceEok": "4억3,500",
        "areaPyeong": 22,
        "floor": 8,
        "area": 72.5957
      },
      {
        "date": "03.19",
        "priceEok": "4억3,500",
        "areaPyeong": 22,
        "floor": 6,
        "area": 72.5957
      },
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
      }
    ]
  },
  "그린힐반도유보라아이비파크101단지": {
    "latestPrice": 42000,
    "latestPriceEok": "4억2,000",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260320",
    "maxPrice": 69500,
    "maxPriceEok": "6억9,500",
    "minPrice": 26000,
    "minPriceEok": "2억6,000",
    "txCount": 619,
    "avg1MPrice": 43790,
    "avg1MPriceEok": "4억3,790",
    "avg1MPerPyeong": 2176,
    "avg1MTxCount": 10,
    "recent": [
      {
        "date": "03.20",
        "priceEok": "4억2,000",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.7731
      },
      {
        "date": "03.14",
        "priceEok": "5억200",
        "areaPyeong": 25.7,
        "floor": 16,
        "area": 84.9991
      },
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
      }
    ]
  },
  "푸른마을모아미래도": {
    "latestPrice": 48000,
    "latestPriceEok": "4억8,000",
    "latestArea": 25.3,
    "latestFloor": 2,
    "latestDate": "20260319",
    "maxPrice": 61000,
    "maxPriceEok": "6억1,000",
    "minPrice": 16570,
    "minPriceEok": "1억6,570",
    "txCount": 1428,
    "avg1MPrice": 47033,
    "avg1MPriceEok": "4억7,033",
    "avg1MPerPyeong": 2227,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "4억8,000",
        "areaPyeong": 25.3,
        "floor": 2,
        "area": 83.737
      },
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
      }
    ]
  },
  "센트럴S타운": {
    "latestPrice": 10500,
    "latestPriceEok": "1억500",
    "latestArea": 6.3,
    "latestFloor": 8,
    "latestDate": "20260319",
    "maxPrice": 12000,
    "maxPriceEok": "1억2,000",
    "minPrice": 2800,
    "minPriceEok": "2,800만",
    "txCount": 208,
    "avg1MPrice": 6875,
    "avg1MPriceEok": "6,875만",
    "avg1MPerPyeong": 1261,
    "avg1MTxCount": 2,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "1억500",
        "areaPyeong": 6.3,
        "floor": 8,
        "area": 20.8
      },
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
      }
    ]
  },
  "반도유보라아이비파크3": {
    "latestPrice": 84200,
    "latestPriceEok": "8억4,200",
    "latestArea": 25.7,
    "latestFloor": 18,
    "latestDate": "20260319",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 27903,
    "minPriceEok": "2억7,903",
    "txCount": 652,
    "avg1MPrice": 68680,
    "avg1MPriceEok": "6억8,680",
    "avg1MPerPyeong": 3352,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "8억4,200",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.9477
      },
      {
        "date": "03.14",
        "priceEok": "7억4,800",
        "areaPyeong": 22.7,
        "floor": 16,
        "area": 74.9535
      },
      {
        "date": "03.13",
        "priceEok": "5억9,900",
        "areaPyeong": 18.1,
        "floor": 8,
        "area": 59.9942
      },
      {
        "date": "03.10",
        "priceEok": "6억2,500",
        "areaPyeong": 18.1,
        "floor": 19,
        "area": 59.9942
      }
    ]
  },
  "롯데캐슬": {
    "latestPrice": 86000,
    "latestPriceEok": "8억6,000",
    "latestArea": 29.2,
    "latestFloor": 21,
    "latestDate": "20260319",
    "maxPrice": 125000,
    "maxPriceEok": "12억5,000",
    "minPrice": 29500,
    "minPriceEok": "2억9,500",
    "txCount": 1133,
    "avg1MPrice": 83167,
    "avg1MPriceEok": "8억3,167",
    "avg1MPerPyeong": 2744,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "8억6,000",
        "areaPyeong": 29.2,
        "floor": 21,
        "area": 96.4
      },
      {
        "date": "03.14",
        "priceEok": "9억",
        "areaPyeong": 33.6,
        "floor": 19,
        "area": 111.04
      },
      {
        "date": "03.13",
        "priceEok": "8억",
        "areaPyeong": 30,
        "floor": 28,
        "area": 99.21
      },
      {
        "date": "03.09",
        "priceEok": "7억9,000",
        "areaPyeong": 30,
        "floor": 15,
        "area": 99.21
      }
    ]
  },
  "레이크힐반도유보라아이비파크10.2": {
    "latestPrice": 52400,
    "latestPriceEok": "5억2,400",
    "latestArea": 25.7,
    "latestFloor": 10,
    "latestDate": "20260319",
    "maxPrice": 87800,
    "maxPriceEok": "8억7,800",
    "minPrice": 33279,
    "minPriceEok": "3억3,279",
    "txCount": 482,
    "avg1MPrice": 53130,
    "avg1MPriceEok": "5억3,130",
    "avg1MPerPyeong": 1964,
    "avg1MTxCount": 10,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "5억2,400",
        "areaPyeong": 25.7,
        "floor": 10,
        "area": 84.9991
      },
      {
        "date": "03.17",
        "priceEok": "5억1,000",
        "areaPyeong": 25.7,
        "floor": 6,
        "area": 84.9991
      },
      {
        "date": "03.14",
        "priceEok": "5억1,400",
        "areaPyeong": 25.7,
        "floor": 8,
        "area": 84.9991
      },
      {
        "date": "03.14",
        "priceEok": "5억8,000",
        "areaPyeong": 29.3,
        "floor": 15,
        "area": 96.6996
      }
    ]
  },
  "동탄푸른마을신일해피트리": {
    "latestPrice": 45800,
    "latestPriceEok": "4억5,800",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260319",
    "maxPrice": 68000,
    "maxPriceEok": "6억8,000",
    "minPrice": 14012,
    "minPriceEok": "1억4,012",
    "txCount": 1796,
    "avg1MPrice": 45650,
    "avg1MPriceEok": "4억5,650",
    "avg1MPerPyeong": 2335,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "4억5,800",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.87
      },
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
      }
    ]
  },
  "동탄파크한양수자인": {
    "latestPrice": 38800,
    "latestPriceEok": "3억8,800",
    "latestArea": 15.7,
    "latestFloor": 2,
    "latestDate": "20260319",
    "maxPrice": 71800,
    "maxPriceEok": "7억1,800",
    "minPrice": 23171,
    "minPriceEok": "2억3,171",
    "txCount": 290,
    "avg1MPrice": 44114,
    "avg1MPriceEok": "4억4,114",
    "avg1MPerPyeong": 2314,
    "avg1MTxCount": 7,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "3억8,800",
        "areaPyeong": 15.7,
        "floor": 2,
        "area": 51.79
      },
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
      }
    ]
  },
  "동탄파크자이": {
    "latestPrice": 82000,
    "latestPriceEok": "8억2,000",
    "latestArea": 30.2,
    "latestFloor": 15,
    "latestDate": "20260319",
    "maxPrice": 115000,
    "maxPriceEok": "11억5,000",
    "minPrice": 54600,
    "minPriceEok": "5억4,600",
    "txCount": 212,
    "avg1MPrice": 78440,
    "avg1MPriceEok": "7억8,440",
    "avg1MPerPyeong": 2609,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "8억2,000",
        "areaPyeong": 30.2,
        "floor": 15,
        "area": 99.6918
      },
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
      }
    ]
  },
  "동탄역이지더원": {
    "latestPrice": 66200,
    "latestPriceEok": "6억6,200",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260319",
    "maxPrice": 80800,
    "maxPriceEok": "8억800",
    "minPrice": 24980,
    "minPriceEok": "2억4,980",
    "txCount": 605,
    "avg1MPrice": 64486,
    "avg1MPriceEok": "6억4,486",
    "avg1MPerPyeong": 3241,
    "avg1MTxCount": 7,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "6억6,200",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.9792
      },
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
      }
    ]
  },
  "동탄숲속마을자연앤경남아너스빌1124-0": {
    "latestPrice": 54800,
    "latestPriceEok": "5억4,800",
    "latestArea": 23.1,
    "latestFloor": 12,
    "latestDate": "20260319",
    "maxPrice": 69000,
    "maxPriceEok": "6억9,000",
    "minPrice": 17320,
    "minPriceEok": "1억7,320",
    "txCount": 490,
    "avg1MPrice": 55300,
    "avg1MPriceEok": "5억5,300",
    "avg1MPerPyeong": 2334,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "5억4,800",
        "areaPyeong": 23.1,
        "floor": 12,
        "area": 76.51
      },
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
      }
    ]
  },
  "동탄숲속마을모아미래도1단지": {
    "latestPrice": 48000,
    "latestPriceEok": "4억8,000",
    "latestArea": 18,
    "latestFloor": 4,
    "latestDate": "20260319",
    "maxPrice": 72500,
    "maxPriceEok": "7억2,500",
    "minPrice": 15860,
    "minPriceEok": "1억5,860",
    "txCount": 1262,
    "avg1MPrice": 55357,
    "avg1MPriceEok": "5억5,357",
    "avg1MPerPyeong": 2771,
    "avg1MTxCount": 7,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "4억8,000",
        "areaPyeong": 18,
        "floor": 4,
        "area": 59.37
      },
      {
        "date": "03.18",
        "priceEok": "5억5,000",
        "areaPyeong": 18,
        "floor": 7,
        "area": 59.37
      },
      {
        "date": "03.17",
        "priceEok": "5억3,000",
        "areaPyeong": 18,
        "floor": 9,
        "area": 59.37
      },
      {
        "date": "03.13",
        "priceEok": "5억2,500",
        "areaPyeong": 18,
        "floor": 11,
        "area": 59.37
      }
    ]
  },
  "동탄2디에트르포레": {
    "latestPrice": 36400,
    "latestPriceEok": "3억6,400",
    "latestArea": 14.2,
    "latestFloor": 4,
    "latestDate": "20260319",
    "maxPrice": 46500,
    "maxPriceEok": "4억6,500",
    "minPrice": 34000,
    "minPriceEok": "3억4,000",
    "txCount": 66,
    "avg1MPrice": 42069,
    "avg1MPriceEok": "4억2,069",
    "avg1MPerPyeong": 2521,
    "avg1MTxCount": 13,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "3억6,400",
        "areaPyeong": 14.2,
        "floor": 4,
        "area": 46.85
      },
      {
        "date": "03.14",
        "priceEok": "4억2,500",
        "areaPyeong": 16.9,
        "floor": 6,
        "area": 55.97
      },
      {
        "date": "03.14",
        "priceEok": "4억3,500",
        "areaPyeong": 16.9,
        "floor": 8,
        "area": 55.97
      },
      {
        "date": "03.14",
        "priceEok": "4억2,500",
        "areaPyeong": 16.9,
        "floor": 13,
        "area": 55.97
      }
    ]
  },
  "능동마을이지더원": {
    "latestPrice": 56100,
    "latestPriceEok": "5억6,100",
    "latestArea": 23.7,
    "latestFloor": 6,
    "latestDate": "20260319",
    "maxPrice": 69000,
    "maxPriceEok": "6억9,000",
    "minPrice": 23000,
    "minPriceEok": "2억3,000",
    "txCount": 641,
    "avg1MPrice": 55033,
    "avg1MPriceEok": "5억5,033",
    "avg1MPerPyeong": 2270,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "5억6,100",
        "areaPyeong": 23.7,
        "floor": 6,
        "area": 78.2912
      },
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
      }
    ]
  },
  "힐스테이트동탄": {
    "latestPrice": 83500,
    "latestPriceEok": "8억3,500",
    "latestArea": 25.7,
    "latestFloor": 7,
    "latestDate": "20260318",
    "maxPrice": 96500,
    "maxPriceEok": "9억6,500",
    "minPrice": 25000,
    "minPriceEok": "2억5,000",
    "txCount": 449,
    "avg1MPrice": 77444,
    "avg1MPriceEok": "7억7,444",
    "avg1MPerPyeong": 3265,
    "avg1MTxCount": 9,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "8억3,500",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.8479
      },
      {
        "date": "03.15",
        "priceEok": "6억500",
        "areaPyeong": 18.7,
        "floor": 1,
        "area": 61.9248
      },
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
      }
    ]
  },
  "르파비스": {
    "latestPrice": 40400,
    "latestPriceEok": "4억400",
    "latestArea": 15.7,
    "latestFloor": 13,
    "latestDate": "20260318",
    "maxPrice": 63500,
    "maxPriceEok": "6억3,500",
    "minPrice": 33000,
    "minPriceEok": "3억3,000",
    "txCount": 70,
    "avg1MPrice": 48975,
    "avg1MPriceEok": "4억8,975",
    "avg1MPerPyeong": 2425,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "4억400",
        "areaPyeong": 15.7,
        "floor": 13,
        "area": 51.99
      },
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
      }
    ]
  },
  "동탄호수자이파밀리에": {
    "latestPrice": 57800,
    "latestPriceEok": "5억7,800",
    "latestArea": 18.1,
    "latestFloor": 3,
    "latestDate": "20260318",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 27300,
    "minPriceEok": "2억7,300",
    "txCount": 520,
    "avg1MPrice": 55836,
    "avg1MPriceEok": "5억5,836",
    "avg1MPerPyeong": 3055,
    "avg1MTxCount": 11,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억7,800",
        "areaPyeong": 18.1,
        "floor": 3,
        "area": 59.96
      },
      {
        "date": "03.18",
        "priceEok": "4억7,000",
        "areaPyeong": 15.5,
        "floor": 13,
        "area": 51.14
      },
      {
        "date": "03.16",
        "priceEok": "4억7,500",
        "areaPyeong": 15.7,
        "floor": 15,
        "area": 51.75
      },
      {
        "date": "03.14",
        "priceEok": "4억7,500",
        "areaPyeong": 15.7,
        "floor": 19,
        "area": 51.75
      }
    ]
  },
  "동탄역푸르지오": {
    "latestPrice": 90000,
    "latestPriceEok": "9억",
    "latestArea": 25.6,
    "latestFloor": 14,
    "latestDate": "20260318",
    "maxPrice": 112000,
    "maxPriceEok": "11억2,000",
    "minPrice": 39994,
    "minPriceEok": "3억9,994",
    "txCount": 305,
    "avg1MPrice": 92500,
    "avg1MPriceEok": "9억2,500",
    "avg1MPerPyeong": 3606,
    "avg1MTxCount": 2,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "9억",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.6681
      },
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
      }
    ]
  },
  "동탄역삼정그린코아": {
    "latestPrice": 129500,
    "latestPriceEok": "12억9,500",
    "latestArea": 27.9,
    "latestFloor": 22,
    "latestDate": "20260318",
    "maxPrice": 129500,
    "maxPriceEok": "12억9,500",
    "minPrice": 50000,
    "minPriceEok": "5억",
    "txCount": 30,
    "avg1MPrice": 120750,
    "avg1MPriceEok": "12억750",
    "avg1MPerPyeong": 4597,
    "avg1MTxCount": 2,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "12억9,500",
        "areaPyeong": 27.9,
        "floor": 22,
        "area": 92.3107
      },
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
      }
    ]
  },
  "동탄역더샵센트럴시티2차": {
    "latestPrice": 71500,
    "latestPriceEok": "7억1,500",
    "latestArea": 22.6,
    "latestFloor": 21,
    "latestDate": "20260318",
    "maxPrice": 95000,
    "maxPriceEok": "9억5,000",
    "minPrice": 53000,
    "minPriceEok": "5억3,000",
    "txCount": 198,
    "avg1MPrice": 74833,
    "avg1MPriceEok": "7억4,833",
    "avg1MPerPyeong": 3037,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "7억1,500",
        "areaPyeong": 22.6,
        "floor": 21,
        "area": 74.85
      },
      {
        "date": "03.14",
        "priceEok": "7억7,500",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.98
      },
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
      }
    ]
  },
  "동탄시범다은마을센트럴파크뷰": {
    "latestPrice": 55500,
    "latestPriceEok": "5억5,500",
    "latestArea": 24.9,
    "latestFloor": 13,
    "latestDate": "20260318",
    "maxPrice": 69000,
    "maxPriceEok": "6억9,000",
    "minPrice": 26500,
    "minPriceEok": "2억6,500",
    "txCount": 471,
    "avg1MPrice": 52567,
    "avg1MPriceEok": "5억2,567",
    "avg1MPerPyeong": 2139,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억5,500",
        "areaPyeong": 24.9,
        "floor": 13,
        "area": 82.25
      },
      {
        "date": "03.14",
        "priceEok": "5억500",
        "areaPyeong": 24.6,
        "floor": 10,
        "area": 81.292
      },
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
      }
    ]
  },
  "동탄레이크자연앤푸르지오": {
    "latestPrice": 93000,
    "latestPriceEok": "9억3,000",
    "latestArea": 25.6,
    "latestFloor": 20,
    "latestDate": "20260318",
    "maxPrice": 118000,
    "maxPriceEok": "11억8,000",
    "minPrice": 40500,
    "minPriceEok": "4억500",
    "txCount": 141,
    "avg1MPrice": 91100,
    "avg1MPriceEok": "9억1,100",
    "avg1MPerPyeong": 3548,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "9억3,000",
        "areaPyeong": 25.6,
        "floor": 20,
        "area": 84.7984
      },
      {
        "date": "03.16",
        "priceEok": "9억",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.7984
      },
      {
        "date": "03.14",
        "priceEok": "8억7,500",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.7984
      },
      {
        "date": "03.07",
        "priceEok": "9억3,000",
        "areaPyeong": 25.7,
        "floor": 20,
        "area": 84.9338
      }
    ]
  },
  "동탄더샵레이크에듀타운": {
    "latestPrice": 91000,
    "latestPriceEok": "9억1,000",
    "latestArea": 25.7,
    "latestFloor": 9,
    "latestDate": "20260318",
    "maxPrice": 121700,
    "maxPriceEok": "12억1,700",
    "minPrice": 51000,
    "minPriceEok": "5억1,000",
    "txCount": 390,
    "avg1MPrice": 95000,
    "avg1MPriceEok": "9억5,000",
    "avg1MPerPyeong": 3696,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "9억1,000",
        "areaPyeong": 25.7,
        "floor": 9,
        "area": 84.9802
      },
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
      }
    ]
  },
  "동탄2아이파크1단지": {
    "latestPrice": 54200,
    "latestPriceEok": "5억4,200",
    "latestArea": 25.7,
    "latestFloor": 6,
    "latestDate": "20260318",
    "maxPrice": 85000,
    "maxPriceEok": "8억5,000",
    "minPrice": 38000,
    "minPriceEok": "3억8,000",
    "txCount": 110,
    "avg1MPrice": 54850,
    "avg1MPriceEok": "5억4,850",
    "avg1MPerPyeong": 2134,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억4,200",
        "areaPyeong": 25.7,
        "floor": 6,
        "area": 84.8688
      },
      {
        "date": "03.14",
        "priceEok": "5억5,200",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.8688
      },
      {
        "date": "03.14",
        "priceEok": "5억5,000",
        "areaPyeong": 25.7,
        "floor": 8,
        "area": 84.8688
      },
      {
        "date": "03.11",
        "priceEok": "5억5,000",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.8688
      }
    ]
  },
  "동탄2신도시호반베르디움22단지": {
    "latestPrice": 53000,
    "latestPriceEok": "5억3,000",
    "latestArea": 16.2,
    "latestFloor": 1,
    "latestDate": "20260318",
    "maxPrice": 64900,
    "maxPriceEok": "6억4,900",
    "minPrice": 27468,
    "minPriceEok": "2억7,468",
    "txCount": 512,
    "avg1MPrice": 55385,
    "avg1MPriceEok": "5억5,385",
    "avg1MPerPyeong": 3419,
    "avg1MTxCount": 13,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억3,000",
        "areaPyeong": 16.2,
        "floor": 1,
        "area": 53.4754
      },
      {
        "date": "03.14",
        "priceEok": "5억7,000",
        "areaPyeong": 16.2,
        "floor": 10,
        "area": 53.4754
      },
      {
        "date": "03.14",
        "priceEok": "5억7,000",
        "areaPyeong": 16.2,
        "floor": 12,
        "area": 53.4754
      },
      {
        "date": "03.14",
        "priceEok": "5억5,000",
        "areaPyeong": 16.2,
        "floor": 5,
        "area": 53.4754
      }
    ]
  },
  "동탄2신도시베라체": {
    "latestPrice": 50000,
    "latestPriceEok": "5억",
    "latestArea": 22.7,
    "latestFloor": 10,
    "latestDate": "20260318",
    "maxPrice": 72000,
    "maxPriceEok": "7억2,000",
    "minPrice": 29000,
    "minPriceEok": "2억9,000",
    "txCount": 355,
    "avg1MPrice": 52380,
    "avg1MPriceEok": "5억2,380",
    "avg1MPerPyeong": 2590,
    "avg1MTxCount": 10,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억",
        "areaPyeong": 22.7,
        "floor": 10,
        "area": 74.97
      },
      {
        "date": "03.18",
        "priceEok": "5억3,000",
        "areaPyeong": 18.1,
        "floor": 12,
        "area": 59.99
      },
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
      }
    ]
  },
  "더레이크시티부영1단지": {
    "latestPrice": 72000,
    "latestPriceEok": "7억2,000",
    "latestArea": 25.6,
    "latestFloor": 14,
    "latestDate": "20260318",
    "maxPrice": 94800,
    "maxPriceEok": "9억4,800",
    "minPrice": 30200,
    "minPriceEok": "3억200",
    "txCount": 260,
    "avg1MPrice": 62175,
    "avg1MPriceEok": "6억2,175",
    "avg1MPerPyeong": 3135,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "7억2,000",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.5413
      },
      {
        "date": "03.18",
        "priceEok": "5억6,000",
        "areaPyeong": 18.3,
        "floor": 2,
        "area": 60.3768
      },
      {
        "date": "03.18",
        "priceEok": "6억800",
        "areaPyeong": 18.1,
        "floor": 27,
        "area": 59.9912
      },
      {
        "date": "02.28",
        "priceEok": "5억9,900",
        "areaPyeong": 18.1,
        "floor": 19,
        "area": 59.9912
      }
    ]
  },
  "중흥에스클래스에듀하이": {
    "latestPrice": 66000,
    "latestPriceEok": "6억6,000",
    "latestArea": 25.2,
    "latestFloor": 18,
    "latestDate": "20260317",
    "maxPrice": 74500,
    "maxPriceEok": "7억4,500",
    "minPrice": 54766,
    "minPriceEok": "5억4,766",
    "txCount": 61,
    "avg1MPrice": 66300,
    "avg1MPriceEok": "6억6,300",
    "avg1MPerPyeong": 2637,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "6억6,000",
        "areaPyeong": 25.2,
        "floor": 18,
        "area": 83.1694
      },
      {
        "date": "03.17",
        "priceEok": "6억8,000",
        "areaPyeong": 25.1,
        "floor": 6,
        "area": 83.0109
      },
      {
        "date": "03.17",
        "priceEok": "6억6,000",
        "areaPyeong": 25.2,
        "floor": 18,
        "area": 83.1694
      },
      {
        "date": "02.27",
        "priceEok": "6억6,500",
        "areaPyeong": 25.1,
        "floor": 22,
        "area": 83.0109
      }
    ]
  },
  "제일풍경채에듀앤파크": {
    "latestPrice": 55700,
    "latestPriceEok": "5억5,700",
    "latestArea": 23.1,
    "latestFloor": 9,
    "latestDate": "20260317",
    "maxPrice": 72200,
    "maxPriceEok": "7억2,200",
    "minPrice": 27300,
    "minPriceEok": "2억7,300",
    "txCount": 198,
    "avg1MPrice": 51683,
    "avg1MPriceEok": "5억1,683",
    "avg1MPerPyeong": 2528,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "5억5,700",
        "areaPyeong": 23.1,
        "floor": 9,
        "area": 76.3605
      },
      {
        "date": "03.17",
        "priceEok": "5억5,700",
        "areaPyeong": 23.1,
        "floor": 9,
        "area": 76.3605
      },
      {
        "date": "03.13",
        "priceEok": "4억7,400",
        "areaPyeong": 18,
        "floor": 15,
        "area": 59.5765
      },
      {
        "date": "03.12",
        "priceEok": "4억7,700",
        "areaPyeong": 18,
        "floor": 17,
        "area": 59.5765
      }
    ]
  },
  "자연앤데시앙": {
    "latestPrice": 59900,
    "latestPriceEok": "5억9,900",
    "latestArea": 25.7,
    "latestFloor": 3,
    "latestDate": "20260317",
    "maxPrice": 67000,
    "maxPriceEok": "6억7,000",
    "minPrice": 15900,
    "minPriceEok": "1억5,900",
    "txCount": 2068,
    "avg1MPrice": 51746,
    "avg1MPriceEok": "5억1,746",
    "avg1MPerPyeong": 2339,
    "avg1MTxCount": 12,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "5억9,900",
        "areaPyeong": 25.7,
        "floor": 3,
        "area": 84.94
      },
      {
        "date": "03.17",
        "priceEok": "5억4,800",
        "areaPyeong": 22.6,
        "floor": 13,
        "area": 74.6
      },
      {
        "date": "03.17",
        "priceEok": "5억4,800",
        "areaPyeong": 22.6,
        "floor": 13,
        "area": 74.6
      },
      {
        "date": "03.13",
        "priceEok": "4억7,000",
        "areaPyeong": 18,
        "floor": 4,
        "area": 59.52
      }
    ]
  },
  "동탄역에일린의뜰": {
    "latestPrice": 69500,
    "latestPriceEok": "6억9,500",
    "latestArea": 25.7,
    "latestFloor": 14,
    "latestDate": "20260317",
    "maxPrice": 86000,
    "maxPriceEok": "8억6,000",
    "minPrice": 33720,
    "minPriceEok": "3억3,720",
    "txCount": 233,
    "avg1MPrice": 64500,
    "avg1MPriceEok": "6억4,500",
    "avg1MPerPyeong": 2611,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "6억9,500",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.9941
      },
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
      }
    ]
  },
  "동탄역반도유보라아이비파크5.0": {
    "latestPrice": 98000,
    "latestPriceEok": "9억8,000",
    "latestArea": 18.1,
    "latestFloor": 12,
    "latestDate": "20260317",
    "maxPrice": 144000,
    "maxPriceEok": "14억4,000",
    "minPrice": 54700,
    "minPriceEok": "5억4,700",
    "txCount": 178,
    "avg1MPrice": 103233,
    "avg1MPriceEok": "10억3,233",
    "avg1MPerPyeong": 4894,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "9억8,000",
        "areaPyeong": 18.1,
        "floor": 12,
        "area": 59.9206
      },
      {
        "date": "03.15",
        "priceEok": "11억5,000",
        "areaPyeong": 29.3,
        "floor": 5,
        "area": 96.8094
      },
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
      }
    ]
  },
  "동탄시범다은마을월드메르디앙반도유보라": {
    "latestPrice": 70000,
    "latestPriceEok": "7억",
    "latestArea": 17.9,
    "latestFloor": 4,
    "latestDate": "20260317",
    "maxPrice": 98000,
    "maxPriceEok": "9억8,000",
    "minPrice": 17500,
    "minPriceEok": "1억7,500",
    "txCount": 2376,
    "avg1MPrice": 72460,
    "avg1MPriceEok": "7억2,460",
    "avg1MPerPyeong": 3555,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "7억",
        "areaPyeong": 17.9,
        "floor": 4,
        "area": 59.07
      },
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
      }
    ]
  },
  "동탄금강펜테리움센트럴파크Ⅳ": {
    "latestPrice": 56500,
    "latestPriceEok": "5억6,500",
    "latestArea": 22.6,
    "latestFloor": 19,
    "latestDate": "20260317",
    "maxPrice": 77000,
    "maxPriceEok": "7억7,000",
    "minPrice": 32050,
    "minPriceEok": "3억2,050",
    "txCount": 468,
    "avg1MPrice": 57671,
    "avg1MPriceEok": "5억7,671",
    "avg1MPerPyeong": 2459,
    "avg1MTxCount": 7,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "5억6,500",
        "areaPyeong": 22.6,
        "floor": 19,
        "area": 74.8709
      },
      {
        "date": "03.17",
        "priceEok": "5억6,500",
        "areaPyeong": 22.6,
        "floor": 19,
        "area": 74.8709
      },
      {
        "date": "03.14",
        "priceEok": "5억9,900",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.9441
      },
      {
        "date": "03.03",
        "priceEok": "5억5,500",
        "areaPyeong": 22.6,
        "floor": 17,
        "area": 74.8709
      }
    ]
  },
  "동탄2하우스디더레이크": {
    "latestPrice": 78000,
    "latestPriceEok": "7억8,000",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260317",
    "maxPrice": 104000,
    "maxPriceEok": "10억4,000",
    "minPrice": 29800,
    "minPriceEok": "2억9,800",
    "txCount": 1088,
    "avg1MPrice": 73038,
    "avg1MPriceEok": "7억3,038",
    "avg1MPerPyeong": 3967,
    "avg1MTxCount": 12,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "7억8,000",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.99
      },
      {
        "date": "03.16",
        "priceEok": "6억4,000",
        "areaPyeong": 18.1,
        "floor": 2,
        "area": 59.99
      },
      {
        "date": "03.15",
        "priceEok": "7억2,000",
        "areaPyeong": 18.1,
        "floor": 6,
        "area": 59.99
      },
      {
        "date": "03.14",
        "priceEok": "7억6,800",
        "areaPyeong": 18.1,
        "floor": 15,
        "area": 59.99
      }
    ]
  },
  "더레이크시티부영6단지": {
    "latestPrice": 53900,
    "latestPriceEok": "5억3,900",
    "latestArea": 18.1,
    "latestFloor": 10,
    "latestDate": "20260317",
    "maxPrice": 83500,
    "maxPriceEok": "8억3,500",
    "minPrice": 30100,
    "minPriceEok": "3억100",
    "txCount": 357,
    "avg1MPrice": 53530,
    "avg1MPriceEok": "5억3,530",
    "avg1MPerPyeong": 2850,
    "avg1MTxCount": 10,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "5억3,900",
        "areaPyeong": 18.1,
        "floor": 10,
        "area": 59.9912
      },
      {
        "date": "03.14",
        "priceEok": "5억3,500",
        "areaPyeong": 18.1,
        "floor": 15,
        "area": 59.9912
      },
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
      }
    ]
  },
  "금호어울림레이크2차": {
    "latestPrice": 64000,
    "latestPriceEok": "6억4,000",
    "latestArea": 22.7,
    "latestFloor": 16,
    "latestDate": "20260317",
    "maxPrice": 89800,
    "maxPriceEok": "8억9,800",
    "minPrice": 32500,
    "minPriceEok": "3억2,500",
    "txCount": 250,
    "avg1MPrice": 67000,
    "avg1MPriceEok": "6억7,000",
    "avg1MPerPyeong": 2772,
    "avg1MTxCount": 2,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "6억4,000",
        "areaPyeong": 22.7,
        "floor": 16,
        "area": 74.99
      },
      {
        "date": "03.14",
        "priceEok": "7억",
        "areaPyeong": 25.7,
        "floor": 15,
        "area": 84.97
      },
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
      }
    ]
  },
  "동탄역신미주": {
    "latestPrice": 57700,
    "latestPriceEok": "5억7,700",
    "latestArea": 25.7,
    "latestFloor": 4,
    "latestDate": "20260316",
    "maxPrice": 76000,
    "maxPriceEok": "7억6,000",
    "minPrice": 19500,
    "minPriceEok": "1억9,500",
    "txCount": 358,
    "avg1MPrice": 56420,
    "avg1MPriceEok": "5억6,420",
    "avg1MPerPyeong": 2195,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.16",
        "priceEok": "5억7,700",
        "areaPyeong": 25.7,
        "floor": 4,
        "area": 84.896
      },
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
      }
    ]
  },
  "호반베르디움센트럴포레": {
    "latestPrice": 60000,
    "latestPriceEok": "6억",
    "latestArea": 25.7,
    "latestFloor": 2,
    "latestDate": "20260316",
    "maxPrice": 85000,
    "maxPriceEok": "8억5,000",
    "minPrice": 35000,
    "minPriceEok": "3억5,000",
    "txCount": 637,
    "avg1MPrice": 60710,
    "avg1MPriceEok": "6억710",
    "avg1MPerPyeong": 2362,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.16",
        "priceEok": "6억",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.8388
      },
      {
        "date": "03.14",
        "priceEok": "6억800",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.8388
      },
      {
        "date": "03.14",
        "priceEok": "6억3,000",
        "areaPyeong": 25.7,
        "floor": 17,
        "area": 84.8388
      },
      {
        "date": "03.14",
        "priceEok": "6억2,750",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.8388
      }
    ]
  },
  "동탄숲속마을광명메이루즈": {
    "latestPrice": 58900,
    "latestPriceEok": "5억8,900",
    "latestArea": 25.6,
    "latestFloor": 9,
    "latestDate": "20260316",
    "maxPrice": 70000,
    "maxPriceEok": "7억",
    "minPrice": 21352,
    "minPriceEok": "2억1,352",
    "txCount": 409,
    "avg1MPrice": 59133,
    "avg1MPriceEok": "5억9,133",
    "avg1MPerPyeong": 2316,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.16",
        "priceEok": "5억8,900",
        "areaPyeong": 25.6,
        "floor": 9,
        "area": 84.496
      },
      {
        "date": "03.15",
        "priceEok": "5억7,500",
        "areaPyeong": 25.5,
        "floor": 5,
        "area": 84.23
      },
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
      }
    ]
  },
  "동탄2신도시호반베르디움33단지": {
    "latestPrice": 48500,
    "latestPriceEok": "4억8,500",
    "latestArea": 23.2,
    "latestFloor": 14,
    "latestDate": "20260315",
    "maxPrice": 71800,
    "maxPriceEok": "7억1,800",
    "minPrice": 33400,
    "minPriceEok": "3억3,400",
    "txCount": 156,
    "avg1MPrice": 45667,
    "avg1MPriceEok": "4억5,667",
    "avg1MPerPyeong": 1974,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.15",
        "priceEok": "4억8,500",
        "areaPyeong": 23.2,
        "floor": 14,
        "area": 76.7676
      },
      {
        "date": "03.13",
        "priceEok": "4억2,900",
        "areaPyeong": 23.1,
        "floor": 1,
        "area": 76.4781
      },
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
      }
    ]
  },
  "동탄2아이파크2단지": {
    "latestPrice": 59500,
    "latestPriceEok": "5억9,500",
    "latestArea": 29.3,
    "latestFloor": 4,
    "latestDate": "20260315",
    "maxPrice": 83800,
    "maxPriceEok": "8억3,800",
    "minPrice": 35700,
    "minPriceEok": "3억5,700",
    "txCount": 137,
    "avg1MPrice": 54000,
    "avg1MPriceEok": "5억4,000",
    "avg1MPerPyeong": 2030,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.15",
        "priceEok": "5억9,500",
        "areaPyeong": 29.3,
        "floor": 4,
        "area": 96.9237
      },
      {
        "date": "03.14",
        "priceEok": "5억2,000",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.8688
      },
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
      }
    ]
  },
  "동탄더레이크팰리스": {
    "latestPrice": 96500,
    "latestPriceEok": "9억6,500",
    "latestArea": 25.6,
    "latestFloor": 19,
    "latestDate": "20260314",
    "maxPrice": 143000,
    "maxPriceEok": "14억3,000",
    "minPrice": 62500,
    "minPriceEok": "6억2,500",
    "txCount": 169,
    "avg1MPrice": 98433,
    "avg1MPriceEok": "9억8,433",
    "avg1MPerPyeong": 3845,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "9억6,500",
        "areaPyeong": 25.6,
        "floor": 19,
        "area": 84.52
      },
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
      }
    ]
  },
  "동탄역경남아너스빌": {
    "latestPrice": 78500,
    "latestPriceEok": "7억8,500",
    "latestArea": 25.4,
    "latestFloor": 29,
    "latestDate": "20260314",
    "maxPrice": 90000,
    "maxPriceEok": "9억",
    "minPrice": 45100,
    "minPriceEok": "4억5,100",
    "txCount": 201,
    "avg1MPrice": 79250,
    "avg1MPriceEok": "7억9,250",
    "avg1MPerPyeong": 3120,
    "avg1MTxCount": 2,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "7억8,500",
        "areaPyeong": 25.4,
        "floor": 29,
        "area": 84.0086
      },
      {
        "date": "03.14",
        "priceEok": "8억",
        "areaPyeong": 25.4,
        "floor": 12,
        "area": 84.0254
      },
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
      }
    ]
  },
  "동탄숲속마을자연앤경남아너스빌1115-0": {
    "latestPrice": 58700,
    "latestPriceEok": "5억8,700",
    "latestArea": 23.1,
    "latestFloor": 14,
    "latestDate": "20260314",
    "maxPrice": 72300,
    "maxPriceEok": "7억2,300",
    "minPrice": 16440,
    "minPriceEok": "1억6,440",
    "txCount": 754,
    "avg1MPrice": 59567,
    "avg1MPriceEok": "5억9,567",
    "avg1MPerPyeong": 2491,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "5억8,700",
        "areaPyeong": 23.1,
        "floor": 14,
        "area": 76.51
      },
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
      }
    ]
  },
  "동탄역포레너스": {
    "latestPrice": 62000,
    "latestPriceEok": "6억2,000",
    "latestArea": 25.6,
    "latestFloor": 3,
    "latestDate": "20260314",
    "maxPrice": 79500,
    "maxPriceEok": "7억9,500",
    "minPrice": 27500,
    "minPriceEok": "2억7,500",
    "txCount": 930,
    "avg1MPrice": 63143,
    "avg1MPriceEok": "6억3,143",
    "avg1MPerPyeong": 2596,
    "avg1MTxCount": 7,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "6억2,000",
        "areaPyeong": 25.6,
        "floor": 3,
        "area": 84.5413
      },
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
      }
    ]
  },
  "힐스테이트동탄역": {
    "latestPrice": 55500,
    "latestPriceEok": "5억5,500",
    "latestArea": 16.5,
    "latestFloor": 27,
    "latestDate": "20260314",
    "maxPrice": 61000,
    "maxPriceEok": "6억1,000",
    "minPrice": 30000,
    "minPriceEok": "3억",
    "txCount": 144,
    "avg1MPrice": 52960,
    "avg1MPriceEok": "5억2,960",
    "avg1MPerPyeong": 3206,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "5억5,500",
        "areaPyeong": 16.5,
        "floor": 27,
        "area": 54.5533
      },
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
      }
    ]
  },
  "호수공원역센트럴시티": {
    "latestPrice": 85500,
    "latestPriceEok": "8억5,500",
    "latestArea": 25.6,
    "latestFloor": 3,
    "latestDate": "20260314",
    "maxPrice": 119000,
    "maxPriceEok": "11억9,000",
    "minPrice": 36000,
    "minPriceEok": "3억6,000",
    "txCount": 259,
    "avg1MPrice": 89600,
    "avg1MPriceEok": "8억9,600",
    "avg1MPerPyeong": 3500,
    "avg1MTxCount": 11,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "8억5,500",
        "areaPyeong": 25.6,
        "floor": 3,
        "area": 84.5413
      },
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
      }
    ]
  },
  "동탄파크푸르지오": {
    "latestPrice": 54000,
    "latestPriceEok": "5억4,000",
    "latestArea": 22.6,
    "latestFloor": 8,
    "latestDate": "20260314",
    "maxPrice": 78000,
    "maxPriceEok": "7억8,000",
    "minPrice": 34200,
    "minPriceEok": "3억4,200",
    "txCount": 352,
    "avg1MPrice": 54867,
    "avg1MPriceEok": "5억4,867",
    "avg1MPerPyeong": 2326,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "5억4,000",
        "areaPyeong": 22.6,
        "floor": 8,
        "area": 74.75
      },
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
      }
    ]
  },
  "동탄2신도시금강펜테리움센트럴파크Ⅰ": {
    "latestPrice": 67000,
    "latestPriceEok": "6억7,000",
    "latestArea": 25.7,
    "latestFloor": 12,
    "latestDate": "20260314",
    "maxPrice": 80000,
    "maxPriceEok": "8억",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 464,
    "avg1MPrice": 61820,
    "avg1MPriceEok": "6억1,820",
    "avg1MPerPyeong": 2405,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "6억7,000",
        "areaPyeong": 25.7,
        "floor": 12,
        "area": 84.9949
      },
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
      }
    ]
  },
  "시범반도유보라아이비파크4.0": {
    "latestPrice": 114700,
    "latestPriceEok": "11억4,700",
    "latestArea": 25.6,
    "latestFloor": 30,
    "latestDate": "20260314",
    "maxPrice": 142000,
    "maxPriceEok": "14억2,000",
    "minPrice": 61000,
    "minPriceEok": "6억1,000",
    "txCount": 307,
    "avg1MPrice": 123600,
    "avg1MPriceEok": "12억3,600",
    "avg1MPerPyeong": 4501,
    "avg1MTxCount": 2,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "11억4,700",
        "areaPyeong": 25.6,
        "floor": 30,
        "area": 84.569
      },
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
      }
    ]
  },
  "동탄역센트럴푸르지오": {
    "latestPrice": 78500,
    "latestPriceEok": "7억8,500",
    "latestArea": 18,
    "latestFloor": 17,
    "latestDate": "20260314",
    "maxPrice": 94500,
    "maxPriceEok": "9억4,500",
    "minPrice": 31000,
    "minPriceEok": "3억1,000",
    "txCount": 1169,
    "avg1MPrice": 80600,
    "avg1MPriceEok": "8억600",
    "avg1MPerPyeong": 4255,
    "avg1MTxCount": 7,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "7억8,500",
        "areaPyeong": 18,
        "floor": 17,
        "area": 59.4313
      },
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
      }
    ]
  },
  "동탄동원로얄듀크2차": {
    "latestPrice": 59800,
    "latestPriceEok": "5억9,800",
    "latestArea": 22.5,
    "latestFloor": 3,
    "latestDate": "20260314",
    "maxPrice": 77800,
    "maxPriceEok": "7억7,800",
    "minPrice": 34766,
    "minPriceEok": "3억4,766",
    "txCount": 224,
    "avg1MPrice": 60400,
    "avg1MPriceEok": "6억400",
    "avg1MPerPyeong": 2515,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "5억9,800",
        "areaPyeong": 22.5,
        "floor": 3,
        "area": 74.5395
      },
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
      }
    ]
  },
  "시범한빛마을금호어울림": {
    "latestPrice": 89400,
    "latestPriceEok": "8억9,400",
    "latestArea": 25.6,
    "latestFloor": 16,
    "latestDate": "20260314",
    "maxPrice": 89400,
    "maxPriceEok": "8억9,400",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 597,
    "avg1MPrice": 89400,
    "avg1MPriceEok": "8억9,400",
    "avg1MPerPyeong": 3492,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "8억9,400",
        "areaPyeong": 25.6,
        "floor": 16,
        "area": 84.613
      },
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
      }
    ]
  },
  "동탄역시범호반써밋": {
    "latestPrice": 109800,
    "latestPriceEok": "10억9,800",
    "latestArea": 25.7,
    "latestFloor": 2,
    "latestDate": "20260314",
    "maxPrice": 125000,
    "maxPriceEok": "12억5,000",
    "minPrice": 45000,
    "minPriceEok": "4억5,000",
    "txCount": 667,
    "avg1MPrice": 112040,
    "avg1MPriceEok": "11억2,040",
    "avg1MPerPyeong": 4360,
    "avg1MTxCount": 5,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "10억9,800",
        "areaPyeong": 25.7,
        "floor": 2,
        "area": 84.9537
      },
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
      }
    ]
  },
  "동탄역센트럴상록아파트": {
    "latestPrice": 99000,
    "latestPriceEok": "9억9,000",
    "latestArea": 21.9,
    "latestFloor": 16,
    "latestDate": "20260314",
    "maxPrice": 115000,
    "maxPriceEok": "11억5,000",
    "minPrice": 44800,
    "minPriceEok": "4억4,800",
    "txCount": 622,
    "avg1MPrice": 95375,
    "avg1MPriceEok": "9억5,375",
    "avg1MPerPyeong": 4796,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "9억9,000",
        "areaPyeong": 21.9,
        "floor": 16,
        "area": 72.35
      },
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
      }
    ]
  },
  "동탄역중흥에스클래스": {
    "latestPrice": 64700,
    "latestPriceEok": "6억4,700",
    "latestArea": 25.1,
    "latestFloor": 12,
    "latestDate": "20260314",
    "maxPrice": 76500,
    "maxPriceEok": "7억6,500",
    "minPrice": 37000,
    "minPriceEok": "3억7,000",
    "txCount": 150,
    "avg1MPrice": 62617,
    "avg1MPriceEok": "6억2,617",
    "avg1MPerPyeong": 2493,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.14",
        "priceEok": "6억4,700",
        "areaPyeong": 25.1,
        "floor": 12,
        "area": 83.0109
      },
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
      }
    ]
  },
  "동탄린스트라우스더레이크": {
    "latestPrice": 133000,
    "latestPriceEok": "13억3,000",
    "latestArea": 29.9,
    "latestFloor": 30,
    "latestDate": "20260313",
    "maxPrice": 205000,
    "maxPriceEok": "20억5,000",
    "minPrice": 90000,
    "minPriceEok": "9억",
    "txCount": 129,
    "avg1MPrice": 133000,
    "avg1MPriceEok": "13억3,000",
    "avg1MPerPyeong": 4448,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "13억3,000",
        "areaPyeong": 29.9,
        "floor": 30,
        "area": 98.9612
      },
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
      }
    ]
  },
  "KCC스위첸아파트": {
    "latestPrice": 79800,
    "latestPriceEok": "7억9,800",
    "latestArea": 25.4,
    "latestFloor": 2,
    "latestDate": "20260313",
    "maxPrice": 83000,
    "maxPriceEok": "8억3,000",
    "minPrice": 30000,
    "minPriceEok": "3억",
    "txCount": 425,
    "avg1MPrice": 73800,
    "avg1MPriceEok": "7억3,800",
    "avg1MPerPyeong": 2906,
    "avg1MTxCount": 4,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "7억9,800",
        "areaPyeong": 25.4,
        "floor": 2,
        "area": 84.06
      },
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
      }
    ]
  },
  "포스코더샵2차": {
    "latestPrice": 56200,
    "latestPriceEok": "5억6,200",
    "latestArea": 23.2,
    "latestFloor": 17,
    "latestDate": "20260313",
    "maxPrice": 88000,
    "maxPriceEok": "8억8,000",
    "minPrice": 15625,
    "minPriceEok": "1억5,625",
    "txCount": 1417,
    "avg1MPrice": 56250,
    "avg1MPriceEok": "5억6,250",
    "avg1MPerPyeong": 2349,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "5억6,200",
        "areaPyeong": 23.2,
        "floor": 17,
        "area": 76.5336
      },
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
      }
    ]
  },
  "동탄역호반써밋": {
    "latestPrice": 67500,
    "latestPriceEok": "6억7,500",
    "latestArea": 18.1,
    "latestFloor": 2,
    "latestDate": "20260313",
    "maxPrice": 90000,
    "maxPriceEok": "9억",
    "minPrice": 28000,
    "minPriceEok": "2억8,000",
    "txCount": 734,
    "avg1MPrice": 71900,
    "avg1MPriceEok": "7억1,900",
    "avg1MPerPyeong": 3972,
    "avg1MTxCount": 2,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "6억7,500",
        "areaPyeong": 18.1,
        "floor": 2,
        "area": 59.8365
      },
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
      }
    ]
  },
  "동탄역유림노르웨이숲": {
    "latestPrice": 129900,
    "latestPriceEok": "12억9,900",
    "latestArea": 25.6,
    "latestFloor": 43,
    "latestDate": "20260313",
    "maxPrice": 160000,
    "maxPriceEok": "16억",
    "minPrice": 66450,
    "minPriceEok": "6억6,450",
    "txCount": 45,
    "avg1MPrice": 133633,
    "avg1MPriceEok": "13억3,633",
    "avg1MPerPyeong": 5235,
    "avg1MTxCount": 3,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "12억9,900",
        "areaPyeong": 25.6,
        "floor": 43,
        "area": 84.4985
      },
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
      }
    ]
  },
  "시범한빛마을케이씨씨스위첸": {
    "latestPrice": 67700,
    "latestPriceEok": "6억7,700",
    "latestArea": 25.6,
    "latestFloor": 15,
    "latestDate": "20260313",
    "maxPrice": 75000,
    "maxPriceEok": "7억5,000",
    "minPrice": 26000,
    "minPriceEok": "2억6,000",
    "txCount": 594,
    "avg1MPrice": 67333,
    "avg1MPriceEok": "6억7,333",
    "avg1MPerPyeong": 2630,
    "avg1MTxCount": 6,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "6억7,700",
        "areaPyeong": 25.6,
        "floor": 15,
        "area": 84.6517
      },
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
      }
    ]
  },
  "우미린제일풍경채": {
    "latestPrice": 67500,
    "latestPriceEok": "6억7,500",
    "latestArea": 24.3,
    "latestFloor": 18,
    "latestDate": "20260313",
    "maxPrice": 89000,
    "maxPriceEok": "8억9,000",
    "minPrice": 22850,
    "minPriceEok": "2억2,850",
    "txCount": 1429,
    "avg1MPrice": 67500,
    "avg1MPriceEok": "6억7,500",
    "avg1MPerPyeong": 2778,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.13",
        "priceEok": "6억7,500",
        "areaPyeong": 24.3,
        "floor": 18,
        "area": 80.3931
      },
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
    "avg1MPrice": 60250,
    "avg1MPriceEok": "6억250",
    "avg1MPerPyeong": 3151,
    "avg1MTxCount": 8,
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
    "avg1MPrice": 68163,
    "avg1MPriceEok": "6억8,163",
    "avg1MPerPyeong": 2766,
    "avg1MTxCount": 4,
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
    "avg1MPrice": 47000,
    "avg1MPriceEok": "4억7,000",
    "avg1MPerPyeong": 2597,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 58367,
    "avg1MPriceEok": "5억8,367",
    "avg1MPerPyeong": 2466,
    "avg1MTxCount": 3,
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
    "avg1MPrice": 76719,
    "avg1MPriceEok": "7억6,719",
    "avg1MPerPyeong": 3290,
    "avg1MTxCount": 8,
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
    "avg1MPrice": 60686,
    "avg1MPriceEok": "6억686",
    "avg1MPerPyeong": 2476,
    "avg1MTxCount": 7,
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
    "avg1MPrice": 55275,
    "avg1MPriceEok": "5억5,275",
    "avg1MPerPyeong": 2254,
    "avg1MTxCount": 8,
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
  "롯데캐슬알바트로스": {
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
    "avg1MPrice": 95500,
    "avg1MPriceEok": "9억5,500",
    "avg1MPerPyeong": 3091,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 77500,
    "avg1MPriceEok": "7억7,500",
    "avg1MPerPyeong": 2753,
    "avg1MTxCount": 3,
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
    "avg1MPrice": 71278,
    "avg1MPriceEok": "7억1,278",
    "avg1MPerPyeong": 4060,
    "avg1MTxCount": 9,
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
  "동탄역시범한화꿈에그린프레스티지": {
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
    "avg1MPrice": 149167,
    "avg1MPriceEok": "14억9,167",
    "avg1MPerPyeong": 4980,
    "avg1MTxCount": 6,
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
    "avg1MPrice": 160500,
    "avg1MPriceEok": "16억500",
    "avg1MPerPyeong": 5536,
    "avg1MTxCount": 3,
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
    "avg1MPrice": 220000,
    "avg1MPriceEok": "22억",
    "avg1MPerPyeong": 7074,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 58000,
    "avg1MPriceEok": "5억8,000",
    "avg1MPerPyeong": 1902,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 69956,
    "avg1MPriceEok": "6억9,956",
    "avg1MPerPyeong": 3669,
    "avg1MTxCount": 9,
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
    "avg1MPrice": 143667,
    "avg1MPriceEok": "14억3,667",
    "avg1MPerPyeong": 4957,
    "avg1MTxCount": 3,
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
  "동탄역시범우남퍼스트빌아파트": {
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
    "avg1MPrice": 125033,
    "avg1MPriceEok": "12억5,033",
    "avg1MPerPyeong": 6145,
    "avg1MTxCount": 6,
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
    "avg1MPrice": 51125,
    "avg1MPriceEok": "5억1,125",
    "avg1MPerPyeong": 2191,
    "avg1MTxCount": 4,
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
    "avg1MPrice": 88614,
    "avg1MPriceEok": "8억8,614",
    "avg1MPerPyeong": 3448,
    "avg1MTxCount": 7,
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
    "avg1MPrice": 95000,
    "avg1MPriceEok": "9억5,000",
    "avg1MPerPyeong": 3231,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 115250,
    "avg1MPriceEok": "11억5,250",
    "avg1MPerPyeong": 5186,
    "avg1MTxCount": 4,
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
    "avg1MPrice": 82000,
    "avg1MPriceEok": "8억2,000",
    "avg1MPerPyeong": 3191,
    "avg1MTxCount": 2,
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
  "동탄역더힐": {
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
    "avg1MPrice": 62780,
    "avg1MPriceEok": "6억2,780",
    "avg1MPerPyeong": 2449,
    "avg1MTxCount": 5,
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
    "avg1MPrice": 49750,
    "avg1MPriceEok": "4억9,750",
    "avg1MPerPyeong": 2779,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 108400,
    "avg1MPriceEok": "10억8,400",
    "avg1MPerPyeong": 4536,
    "avg1MTxCount": 2,
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
  "동탄역반도유보라아이비파크6.0": {
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
    "avg1MPrice": 109833,
    "avg1MPriceEok": "10억9,833",
    "avg1MPerPyeong": 4671,
    "avg1MTxCount": 3,
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
    "avg1MPrice": 70300,
    "avg1MPriceEok": "7억300",
    "avg1MPerPyeong": 3221,
    "avg1MTxCount": 4,
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
    "avg1MPrice": 54560,
    "avg1MPriceEok": "5억4,560",
    "avg1MPerPyeong": 2200,
    "avg1MTxCount": 5,
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
  "서해더블루90-2": {
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
    "avg1MPrice": 57500,
    "avg1MPriceEok": "5억7,500",
    "avg1MPerPyeong": 1758,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 74750,
    "avg1MPriceEok": "7억4,750",
    "avg1MPerPyeong": 3727,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 141650,
    "avg1MPriceEok": "14억1,650",
    "avg1MPerPyeong": 4988,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 66000,
    "avg1MPriceEok": "6억6,000",
    "avg1MPerPyeong": 2578,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 73000,
    "avg1MPriceEok": "7억3,000",
    "avg1MPerPyeong": 2086,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 106817,
    "avg1MPriceEok": "10억6,817",
    "avg1MPerPyeong": 4050,
    "avg1MTxCount": 6,
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
    "avg1MPrice": 73000,
    "avg1MPriceEok": "7억3,000",
    "avg1MPerPyeong": 2840,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 50000,
    "avg1MPriceEok": "5억",
    "avg1MPerPyeong": 2075,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 65750,
    "avg1MPriceEok": "6억5,750",
    "avg1MPerPyeong": 2104,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 128000,
    "avg1MPriceEok": "12억8,000",
    "avg1MPerPyeong": 4981,
    "avg1MTxCount": 1,
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
  "한화포레나동탄호수": {
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
    "avg1MPrice": 74000,
    "avg1MPriceEok": "7억4,000",
    "avg1MPerPyeong": 3198,
    "avg1MTxCount": 4,
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
    "avg1MPrice": 80200,
    "avg1MPriceEok": "8억200",
    "avg1MPerPyeong": 3121,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 59800,
    "avg1MPriceEok": "5억9,800",
    "avg1MPerPyeong": 2946,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 120300,
    "avg1MPriceEok": "12억300",
    "avg1MPerPyeong": 4699,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 71200,
    "avg1MPriceEok": "7억1,200",
    "avg1MPerPyeong": 2787,
    "avg1MTxCount": 2,
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
  "동탄역반도유보라아이비파크8.0": {
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
    "avg1MPrice": 123500,
    "avg1MPriceEok": "12억3,500",
    "avg1MPerPyeong": 5122,
    "avg1MTxCount": 2,
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
  "동탄시범다은마을메타역롯데캐슬": {
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
    "avg1MPrice": 77250,
    "avg1MPriceEok": "7억7,250",
    "avg1MPerPyeong": 2737,
    "avg1MTxCount": 2,
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
  "동탄2엘에이치26단지아파트에이65블록": {
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
    "avg1MPrice": 61150,
    "avg1MPriceEok": "6억1,150",
    "avg1MPerPyeong": 2700,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 76000,
    "avg1MPriceEok": "7억6,000",
    "avg1MPerPyeong": 2969,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 99850,
    "avg1MPriceEok": "9억9,850",
    "avg1MPerPyeong": 3885,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 70000,
    "avg1MPriceEok": "7억",
    "avg1MPerPyeong": 2734,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 65000,
    "avg1MPriceEok": "6억5,000",
    "avg1MPerPyeong": 1786,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 83800,
    "avg1MPriceEok": "8억3,800",
    "avg1MPerPyeong": 2712,
    "avg1MTxCount": 1,
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
  "동탄역센트럴자이A-10": {
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
    "avg1MPrice": 105000,
    "avg1MPriceEok": "10억5,000",
    "avg1MPerPyeong": 4086,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 67500,
    "avg1MPriceEok": "6억7,500",
    "avg1MPerPyeong": 2626,
    "avg1MTxCount": 1,
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
  "동탄숲속마을능동역리체더포레스트": {
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
    "avg1MPrice": 53500,
    "avg1MPriceEok": "5억3,500",
    "avg1MPerPyeong": 1967,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 121000,
    "avg1MPriceEok": "12억1,000",
    "avg1MPerPyeong": 4708,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 96500,
    "avg1MPriceEok": "9억6,500",
    "avg1MPerPyeong": 2287,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 75000,
    "avg1MPriceEok": "7억5,000",
    "avg1MPerPyeong": 2930,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 75500,
    "avg1MPriceEok": "7억5,500",
    "avg1MPerPyeong": 2568,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 85500,
    "avg1MPriceEok": "8억5,500",
    "avg1MPerPyeong": 2723,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 86000,
    "avg1MPriceEok": "8억6,000",
    "avg1MPerPyeong": 2216,
    "avg1MTxCount": 1,
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
    "avg1MPrice": 75450,
    "avg1MPriceEok": "7억5,450",
    "avg1MPerPyeong": 2947,
    "avg1MTxCount": 2,
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
    "avg1MPrice": 88500,
    "avg1MPriceEok": "8억8,500",
    "avg1MPerPyeong": 2902,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 85500,
    "avg1MPriceEok": "8억5,500",
    "avg1MPerPyeong": 2732,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 103000,
    "avg1MPriceEok": "10억3,000",
    "avg1MPerPyeong": 4008,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 57000,
    "avg1MPriceEok": "5억7,000",
    "avg1MPerPyeong": 2218,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 77830,
    "avg1MPriceEok": "7억7,830",
    "avg1MPerPyeong": 2323,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 172000,
    "avg1MPriceEok": "17억2,000",
    "avg1MPerPyeong": 3039,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 78800,
    "avg1MPriceEok": "7억8,800",
    "avg1MPerPyeong": 3066,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 58000,
    "avg1MPriceEok": "5억8,000",
    "avg1MPerPyeong": 2555,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 65000,
    "avg1MPriceEok": "6억5,000",
    "avg1MPerPyeong": 1766,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 88000,
    "avg1MPriceEok": "8억8,000",
    "avg1MPerPyeong": 1826,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 61500,
    "avg1MPriceEok": "6억1,500",
    "avg1MPerPyeong": 1898,
    "avg1MTxCount": 0,
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
  "서해더블루93-8": {
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
    "avg1MPrice": 59000,
    "avg1MPriceEok": "5억9,000",
    "avg1MPerPyeong": 1453,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 3000,
    "avg1MPriceEok": "3,000만",
    "avg1MPerPyeong": 789,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 4800,
    "avg1MPriceEok": "4,800만",
    "avg1MPerPyeong": 1116,
    "avg1MTxCount": 0,
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
  "서해더블루106-7": {
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
    "avg1MPrice": 63000,
    "avg1MPriceEok": "6억3,000",
    "avg1MPerPyeong": 1927,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 5600,
    "avg1MPriceEok": "5,600만",
    "avg1MPerPyeong": 862,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 71000,
    "avg1MPriceEok": "7억1,000",
    "avg1MPerPyeong": 2351,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 7560,
    "avg1MPriceEok": "7,560만",
    "avg1MPerPyeong": 1008,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 24000,
    "avg1MPriceEok": "2억4,000",
    "avg1MPerPyeong": 934,
    "avg1MTxCount": 0,
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
    "avg1MPrice": 13000,
    "avg1MPriceEok": "1억3,000",
    "avg1MPerPyeong": 512,
    "avg1MTxCount": 0,
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
