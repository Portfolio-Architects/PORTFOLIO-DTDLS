/**
 * 실거래가 및 전월세 요약 데이터 — 빌드 타임에 포함, API 호출 0
 * 
 * ⚠️ 이 파일은 자동 생성됩니다. 직접 수정하지 마세요!
 * 동기화: npm run sync-transactions
 * 마지막 동기화: 2026-03-26
 */

export interface RecentTx {
  date: string;
  priceEok: string;
  areaPyeong: number;
  floor: number;
  area: number;
}

export interface AptTxSummary {
  // 매매 (Sale)
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
  
  // 전월세 (Rent/Jeonse)
  rentTxCount?: number;
  latestRentDeposit?: number;
  latestRentDepositEok?: string;
  latestRentMonthly?: number;
  latestRentDate?: string;
  avg1MRentDeposit?: number;
  avg1MRentDepositEok?: string;
}

/** 아파트명 → 거래 요약 */
export const TX_SUMMARY: Record<string, AptTxSummary> = {
  "더레이크시티부영6단지": {
    "latestPrice": 53900,
    "latestPriceEok": "5억3,900",
    "latestArea": 18.1,
    "latestFloor": 10,
    "latestDate": "20260317",
    "maxPrice": 53900,
    "maxPriceEok": "5억3,900",
    "minPrice": 53900,
    "minPriceEok": "5억3,900",
    "txCount": 1,
    "avg1MPrice": 53900,
    "avg1MPriceEok": "5억3,900",
    "avg1MPerPyeong": 2978,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "5억3,900",
        "areaPyeong": 18.1,
        "floor": 10,
        "area": 59.9912
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "중흥에스클래스에듀하이": {
    "latestPrice": 66000,
    "latestPriceEok": "6억6,000",
    "latestArea": 25.2,
    "latestFloor": 18,
    "latestDate": "20260317",
    "maxPrice": 68000,
    "maxPriceEok": "6억8,000",
    "minPrice": 66000,
    "minPriceEok": "6억6,000",
    "txCount": 2,
    "avg1MPrice": 67000,
    "avg1MPriceEok": "6억7,000",
    "avg1MPerPyeong": 2664,
    "avg1MTxCount": 2,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄더샵레이크에듀타운": {
    "latestPrice": 91000,
    "latestPriceEok": "9억1,000",
    "latestArea": 25.7,
    "latestFloor": 9,
    "latestDate": "20260318",
    "maxPrice": 91000,
    "maxPriceEok": "9억1,000",
    "minPrice": 91000,
    "minPriceEok": "9억1,000",
    "txCount": 1,
    "avg1MPrice": 91000,
    "avg1MPriceEok": "9억1,000",
    "avg1MPerPyeong": 3541,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "9억1,000",
        "areaPyeong": 25.7,
        "floor": 9,
        "area": 84.9802
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "힐스테이트동탄": {
    "latestPrice": 83500,
    "latestPriceEok": "8억3,500",
    "latestArea": 25.7,
    "latestFloor": 7,
    "latestDate": "20260318",
    "maxPrice": 83500,
    "maxPriceEok": "8억3,500",
    "minPrice": 83500,
    "minPriceEok": "8억3,500",
    "txCount": 1,
    "avg1MPrice": 83500,
    "avg1MPriceEok": "8억3,500",
    "avg1MPerPyeong": 3249,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "8억3,500",
        "areaPyeong": 25.7,
        "floor": 7,
        "area": 84.8479
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "제일풍경채에듀앤파크": {
    "latestPrice": 55700,
    "latestPriceEok": "5억5,700",
    "latestArea": 23.1,
    "latestFloor": 9,
    "latestDate": "20260317",
    "maxPrice": 55700,
    "maxPriceEok": "5억5,700",
    "minPrice": 55700,
    "minPriceEok": "5억5,700",
    "txCount": 1,
    "avg1MPrice": 55700,
    "avg1MPriceEok": "5억5,700",
    "avg1MPerPyeong": 2411,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "5억5,700",
        "areaPyeong": 23.1,
        "floor": 9,
        "area": 76.3605
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "자연앤데시앙": {
    "latestPrice": 59900,
    "latestPriceEok": "5억9,900",
    "latestArea": 25.7,
    "latestFloor": 3,
    "latestDate": "20260317",
    "maxPrice": 59900,
    "maxPriceEok": "5억9,900",
    "minPrice": 54800,
    "minPriceEok": "5억4,800",
    "txCount": 2,
    "avg1MPrice": 57350,
    "avg1MPriceEok": "5억7,350",
    "avg1MPerPyeong": 2378,
    "avg1MTxCount": 2,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "롯데캐슬": {
    "latestPrice": 86000,
    "latestPriceEok": "8억6,000",
    "latestArea": 29.2,
    "latestFloor": 21,
    "latestDate": "20260319",
    "maxPrice": 86000,
    "maxPriceEok": "8억6,000",
    "minPrice": 86000,
    "minPriceEok": "8억6,000",
    "txCount": 1,
    "avg1MPrice": 86000,
    "avg1MPriceEok": "8억6,000",
    "avg1MPerPyeong": 2945,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "8억6,000",
        "areaPyeong": 29.2,
        "floor": 21,
        "area": 96.4
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "레이크힐반도유보라아이비파크10.2": {
    "latestPrice": 52400,
    "latestPriceEok": "5억2,400",
    "latestArea": 25.7,
    "latestFloor": 10,
    "latestDate": "20260319",
    "maxPrice": 52400,
    "maxPriceEok": "5억2,400",
    "minPrice": 51000,
    "minPriceEok": "5억1,000",
    "txCount": 2,
    "avg1MPrice": 51700,
    "avg1MPriceEok": "5억1,700",
    "avg1MPerPyeong": 2012,
    "avg1MTxCount": 2,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄파크한양수자인": {
    "latestPrice": 38800,
    "latestPriceEok": "3억8,800",
    "latestArea": 15.7,
    "latestFloor": 2,
    "latestDate": "20260319",
    "maxPrice": 38800,
    "maxPriceEok": "3억8,800",
    "minPrice": 38800,
    "minPriceEok": "3억8,800",
    "txCount": 1,
    "avg1MPrice": 38800,
    "avg1MPriceEok": "3억8,800",
    "avg1MPerPyeong": 2471,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "3억8,800",
        "areaPyeong": 15.7,
        "floor": 2,
        "area": 51.79
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄파크자이": {
    "latestPrice": 82000,
    "latestPriceEok": "8억2,000",
    "latestArea": 30.2,
    "latestFloor": 15,
    "latestDate": "20260319",
    "maxPrice": 82000,
    "maxPriceEok": "8억2,000",
    "minPrice": 82000,
    "minPriceEok": "8억2,000",
    "txCount": 1,
    "avg1MPrice": 82000,
    "avg1MPriceEok": "8억2,000",
    "avg1MPerPyeong": 2715,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "8억2,000",
        "areaPyeong": 30.2,
        "floor": 15,
        "area": 99.6918
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄역푸르지오": {
    "latestPrice": 90000,
    "latestPriceEok": "9억",
    "latestArea": 25.6,
    "latestFloor": 14,
    "latestDate": "20260318",
    "maxPrice": 90000,
    "maxPriceEok": "9억",
    "minPrice": 90000,
    "minPriceEok": "9억",
    "txCount": 1,
    "avg1MPrice": 90000,
    "avg1MPriceEok": "9억",
    "avg1MPerPyeong": 3516,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "9억",
        "areaPyeong": 25.6,
        "floor": 14,
        "area": 84.6681
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄역이지더원": {
    "latestPrice": 66200,
    "latestPriceEok": "6억6,200",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260319",
    "maxPrice": 66200,
    "maxPriceEok": "6억6,200",
    "minPrice": 66200,
    "minPriceEok": "6억6,200",
    "txCount": 1,
    "avg1MPrice": 66200,
    "avg1MPriceEok": "6억6,200",
    "avg1MPerPyeong": 3657,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "6억6,200",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.9792
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄역에일린의뜰": {
    "latestPrice": 69500,
    "latestPriceEok": "6억9,500",
    "latestArea": 25.7,
    "latestFloor": 14,
    "latestDate": "20260317",
    "maxPrice": 69500,
    "maxPriceEok": "6억9,500",
    "minPrice": 69500,
    "minPriceEok": "6억9,500",
    "txCount": 1,
    "avg1MPrice": 69500,
    "avg1MPriceEok": "6억9,500",
    "avg1MPerPyeong": 2704,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "6억9,500",
        "areaPyeong": 25.7,
        "floor": 14,
        "area": 84.9941
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄역더샵센트럴시티2차": {
    "latestPrice": 71500,
    "latestPriceEok": "7억1,500",
    "latestArea": 22.6,
    "latestFloor": 21,
    "latestDate": "20260318",
    "maxPrice": 71500,
    "maxPriceEok": "7억1,500",
    "minPrice": 71500,
    "minPriceEok": "7억1,500",
    "txCount": 1,
    "avg1MPrice": 71500,
    "avg1MPriceEok": "7억1,500",
    "avg1MPerPyeong": 3164,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "7억1,500",
        "areaPyeong": 22.6,
        "floor": 21,
        "area": 74.85
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄숲속마을모아미래도1단지": {
    "latestPrice": 48000,
    "latestPriceEok": "4억8,000",
    "latestArea": 18,
    "latestFloor": 4,
    "latestDate": "20260319",
    "maxPrice": 55000,
    "maxPriceEok": "5억5,000",
    "minPrice": 48000,
    "minPriceEok": "4억8,000",
    "txCount": 3,
    "avg1MPrice": 52000,
    "avg1MPriceEok": "5억2,000",
    "avg1MPerPyeong": 2889,
    "avg1MTxCount": 3,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄금강펜테리움센트럴파크Ⅳ": {
    "latestPrice": 56500,
    "latestPriceEok": "5억6,500",
    "latestArea": 22.6,
    "latestFloor": 19,
    "latestDate": "20260317",
    "maxPrice": 56500,
    "maxPriceEok": "5억6,500",
    "minPrice": 56500,
    "minPriceEok": "5억6,500",
    "txCount": 1,
    "avg1MPrice": 56500,
    "avg1MPriceEok": "5억6,500",
    "avg1MPerPyeong": 2500,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "5억6,500",
        "areaPyeong": 22.6,
        "floor": 19,
        "area": 74.8709
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄2아이파크1단지": {
    "latestPrice": 54200,
    "latestPriceEok": "5억4,200",
    "latestArea": 25.7,
    "latestFloor": 6,
    "latestDate": "20260318",
    "maxPrice": 54200,
    "maxPriceEok": "5억4,200",
    "minPrice": 54200,
    "minPriceEok": "5억4,200",
    "txCount": 1,
    "avg1MPrice": 54200,
    "avg1MPriceEok": "5억4,200",
    "avg1MPerPyeong": 2109,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억4,200",
        "areaPyeong": 25.7,
        "floor": 6,
        "area": 84.8688
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄2신도시호반베르디움22단지": {
    "latestPrice": 53000,
    "latestPriceEok": "5억3,000",
    "latestArea": 16.2,
    "latestFloor": 1,
    "latestDate": "20260318",
    "maxPrice": 53000,
    "maxPriceEok": "5억3,000",
    "minPrice": 53000,
    "minPriceEok": "5억3,000",
    "txCount": 1,
    "avg1MPrice": 53000,
    "avg1MPriceEok": "5억3,000",
    "avg1MPerPyeong": 3272,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억3,000",
        "areaPyeong": 16.2,
        "floor": 1,
        "area": 53.4754
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄2신도시베라체": {
    "latestPrice": 50000,
    "latestPriceEok": "5억",
    "latestArea": 22.7,
    "latestFloor": 10,
    "latestDate": "20260318",
    "maxPrice": 53000,
    "maxPriceEok": "5억3,000",
    "minPrice": 50000,
    "minPriceEok": "5억",
    "txCount": 2,
    "avg1MPrice": 51500,
    "avg1MPriceEok": "5억1,500",
    "avg1MPerPyeong": 2565,
    "avg1MTxCount": 2,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄2디에트르포레": {
    "latestPrice": 36400,
    "latestPriceEok": "3억6,400",
    "latestArea": 14.2,
    "latestFloor": 4,
    "latestDate": "20260319",
    "maxPrice": 36400,
    "maxPriceEok": "3억6,400",
    "minPrice": 36400,
    "minPriceEok": "3억6,400",
    "txCount": 1,
    "avg1MPrice": 36400,
    "avg1MPriceEok": "3억6,400",
    "avg1MPerPyeong": 2563,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "3억6,400",
        "areaPyeong": 14.2,
        "floor": 4,
        "area": 46.85
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "더레이크시티부영1단지": {
    "latestPrice": 72000,
    "latestPriceEok": "7억2,000",
    "latestArea": 25.6,
    "latestFloor": 14,
    "latestDate": "20260318",
    "maxPrice": 72000,
    "maxPriceEok": "7억2,000",
    "minPrice": 56000,
    "minPriceEok": "5억6,000",
    "txCount": 3,
    "avg1MPrice": 62933,
    "avg1MPriceEok": "6억2,933",
    "avg1MPerPyeong": 3077,
    "avg1MTxCount": 3,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄퍼스트파크": {
    "latestPrice": 43500,
    "latestPriceEok": "4억3,500",
    "latestArea": 22,
    "latestFloor": 8,
    "latestDate": "20260320",
    "maxPrice": 43500,
    "maxPriceEok": "4억3,500",
    "minPrice": 43500,
    "minPriceEok": "4억3,500",
    "txCount": 2,
    "avg1MPrice": 43500,
    "avg1MPriceEok": "4억3,500",
    "avg1MPerPyeong": 1977,
    "avg1MTxCount": 2,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄숲속마을자연앤경남아너스빌1124-0": {
    "latestPrice": 54800,
    "latestPriceEok": "5억4,800",
    "latestArea": 23.1,
    "latestFloor": 12,
    "latestDate": "20260319",
    "maxPrice": 54800,
    "maxPriceEok": "5억4,800",
    "minPrice": 54800,
    "minPriceEok": "5억4,800",
    "txCount": 1,
    "avg1MPrice": 54800,
    "avg1MPriceEok": "5억4,800",
    "avg1MPerPyeong": 2372,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "5억4,800",
        "areaPyeong": 23.1,
        "floor": 12,
        "area": 76.51
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄2하우스디더레이크": {
    "latestPrice": 78000,
    "latestPriceEok": "7억8,000",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260317",
    "maxPrice": 78000,
    "maxPriceEok": "7억8,000",
    "minPrice": 78000,
    "minPriceEok": "7억8,000",
    "txCount": 1,
    "avg1MPrice": 78000,
    "avg1MPriceEok": "7억8,000",
    "avg1MPerPyeong": 4309,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "7억8,000",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.99
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "그린힐반도유보라아이비파크101단지": {
    "latestPrice": 42000,
    "latestPriceEok": "4억2,000",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260320",
    "maxPrice": 42000,
    "maxPriceEok": "4억2,000",
    "minPrice": 42000,
    "minPriceEok": "4억2,000",
    "txCount": 1,
    "avg1MPrice": 42000,
    "avg1MPriceEok": "4억2,000",
    "avg1MPerPyeong": 2320,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.20",
        "priceEok": "4억2,000",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.7731
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "푸른마을모아미래도": {
    "latestPrice": 48000,
    "latestPriceEok": "4억8,000",
    "latestArea": 25.3,
    "latestFloor": 2,
    "latestDate": "20260319",
    "maxPrice": 48000,
    "maxPriceEok": "4억8,000",
    "minPrice": 48000,
    "minPriceEok": "4억8,000",
    "txCount": 1,
    "avg1MPrice": 48000,
    "avg1MPriceEok": "4억8,000",
    "avg1MPerPyeong": 1897,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "4억8,000",
        "areaPyeong": 25.3,
        "floor": 2,
        "area": 83.737
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "센트럴S타운": {
    "latestPrice": 10500,
    "latestPriceEok": "1억500",
    "latestArea": 6.3,
    "latestFloor": 8,
    "latestDate": "20260319",
    "maxPrice": 10500,
    "maxPriceEok": "1억500",
    "minPrice": 10500,
    "minPriceEok": "1억500",
    "txCount": 1,
    "avg1MPrice": 10500,
    "avg1MPriceEok": "1억500",
    "avg1MPerPyeong": 1667,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "1억500",
        "areaPyeong": 6.3,
        "floor": 8,
        "area": 20.8
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "반도유보라아이비파크3": {
    "latestPrice": 84200,
    "latestPriceEok": "8억4,200",
    "latestArea": 25.7,
    "latestFloor": 18,
    "latestDate": "20260319",
    "maxPrice": 84200,
    "maxPriceEok": "8억4,200",
    "minPrice": 84200,
    "minPriceEok": "8억4,200",
    "txCount": 1,
    "avg1MPrice": 84200,
    "avg1MPriceEok": "8억4,200",
    "avg1MPerPyeong": 3276,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "8억4,200",
        "areaPyeong": 25.7,
        "floor": 18,
        "area": 84.9477
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄푸른마을신일해피트리": {
    "latestPrice": 45800,
    "latestPriceEok": "4억5,800",
    "latestArea": 18.1,
    "latestFloor": 14,
    "latestDate": "20260319",
    "maxPrice": 45800,
    "maxPriceEok": "4억5,800",
    "minPrice": 45800,
    "minPriceEok": "4억5,800",
    "txCount": 1,
    "avg1MPrice": 45800,
    "avg1MPriceEok": "4억5,800",
    "avg1MPerPyeong": 2530,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "4억5,800",
        "areaPyeong": 18.1,
        "floor": 14,
        "area": 59.87
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "능동마을이지더원": {
    "latestPrice": 56100,
    "latestPriceEok": "5억6,100",
    "latestArea": 23.7,
    "latestFloor": 6,
    "latestDate": "20260319",
    "maxPrice": 56100,
    "maxPriceEok": "5억6,100",
    "minPrice": 56100,
    "minPriceEok": "5억6,100",
    "txCount": 1,
    "avg1MPrice": 56100,
    "avg1MPriceEok": "5억6,100",
    "avg1MPerPyeong": 2367,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.19",
        "priceEok": "5억6,100",
        "areaPyeong": 23.7,
        "floor": 6,
        "area": 78.2912
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "르파비스": {
    "latestPrice": 40400,
    "latestPriceEok": "4억400",
    "latestArea": 15.7,
    "latestFloor": 13,
    "latestDate": "20260318",
    "maxPrice": 40400,
    "maxPriceEok": "4억400",
    "minPrice": 40400,
    "minPriceEok": "4억400",
    "txCount": 1,
    "avg1MPrice": 40400,
    "avg1MPriceEok": "4억400",
    "avg1MPerPyeong": 2573,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "4억400",
        "areaPyeong": 15.7,
        "floor": 13,
        "area": 51.99
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄호수자이파밀리에": {
    "latestPrice": 57800,
    "latestPriceEok": "5억7,800",
    "latestArea": 18.1,
    "latestFloor": 3,
    "latestDate": "20260318",
    "maxPrice": 57800,
    "maxPriceEok": "5억7,800",
    "minPrice": 47000,
    "minPriceEok": "4억7,000",
    "txCount": 2,
    "avg1MPrice": 52400,
    "avg1MPriceEok": "5억2,400",
    "avg1MPerPyeong": 3113,
    "avg1MTxCount": 2,
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
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄역삼정그린코아": {
    "latestPrice": 129500,
    "latestPriceEok": "12억9,500",
    "latestArea": 27.9,
    "latestFloor": 22,
    "latestDate": "20260318",
    "maxPrice": 129500,
    "maxPriceEok": "12억9,500",
    "minPrice": 129500,
    "minPriceEok": "12억9,500",
    "txCount": 1,
    "avg1MPrice": 129500,
    "avg1MPriceEok": "12억9,500",
    "avg1MPerPyeong": 4642,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "12억9,500",
        "areaPyeong": 27.9,
        "floor": 22,
        "area": 92.3107
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄시범다은마을센트럴파크뷰": {
    "latestPrice": 55500,
    "latestPriceEok": "5억5,500",
    "latestArea": 24.9,
    "latestFloor": 13,
    "latestDate": "20260318",
    "maxPrice": 55500,
    "maxPriceEok": "5억5,500",
    "minPrice": 55500,
    "minPriceEok": "5억5,500",
    "txCount": 1,
    "avg1MPrice": 55500,
    "avg1MPriceEok": "5억5,500",
    "avg1MPerPyeong": 2229,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "5억5,500",
        "areaPyeong": 24.9,
        "floor": 13,
        "area": 82.25
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄레이크자연앤푸르지오": {
    "latestPrice": 93000,
    "latestPriceEok": "9억3,000",
    "latestArea": 25.6,
    "latestFloor": 20,
    "latestDate": "20260318",
    "maxPrice": 93000,
    "maxPriceEok": "9억3,000",
    "minPrice": 93000,
    "minPriceEok": "9억3,000",
    "txCount": 1,
    "avg1MPrice": 93000,
    "avg1MPriceEok": "9억3,000",
    "avg1MPerPyeong": 3633,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.18",
        "priceEok": "9억3,000",
        "areaPyeong": 25.6,
        "floor": 20,
        "area": 84.7984
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄역반도유보라아이비파크5.0": {
    "latestPrice": 98000,
    "latestPriceEok": "9억8,000",
    "latestArea": 18.1,
    "latestFloor": 12,
    "latestDate": "20260317",
    "maxPrice": 98000,
    "maxPriceEok": "9억8,000",
    "minPrice": 98000,
    "minPriceEok": "9억8,000",
    "txCount": 1,
    "avg1MPrice": 98000,
    "avg1MPriceEok": "9억8,000",
    "avg1MPerPyeong": 5414,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "9억8,000",
        "areaPyeong": 18.1,
        "floor": 12,
        "area": 59.9206
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "동탄시범다은마을월드메르디앙반도유보라": {
    "latestPrice": 70000,
    "latestPriceEok": "7억",
    "latestArea": 17.9,
    "latestFloor": 4,
    "latestDate": "20260317",
    "maxPrice": 70000,
    "maxPriceEok": "7억",
    "minPrice": 70000,
    "minPriceEok": "7억",
    "txCount": 1,
    "avg1MPrice": 70000,
    "avg1MPriceEok": "7억",
    "avg1MPerPyeong": 3911,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "7억",
        "areaPyeong": 17.9,
        "floor": 4,
        "area": 59.07
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  },
  "금호어울림레이크2차": {
    "latestPrice": 64000,
    "latestPriceEok": "6억4,000",
    "latestArea": 22.7,
    "latestFloor": 16,
    "latestDate": "20260317",
    "maxPrice": 64000,
    "maxPriceEok": "6억4,000",
    "minPrice": 64000,
    "minPriceEok": "6억4,000",
    "txCount": 1,
    "avg1MPrice": 64000,
    "avg1MPriceEok": "6억4,000",
    "avg1MPerPyeong": 2819,
    "avg1MTxCount": 1,
    "recent": [
      {
        "date": "03.17",
        "priceEok": "6억4,000",
        "areaPyeong": 22.7,
        "floor": 16,
        "area": 74.99
      }
    ],
    "rentTxCount": 0,
    "latestRentDeposit": 0,
    "latestRentDepositEok": "0",
    "latestRentMonthly": 0,
    "latestRentDate": "",
    "avg1MRentDeposit": 0,
    "avg1MRentDepositEok": "0만"
  }
};
