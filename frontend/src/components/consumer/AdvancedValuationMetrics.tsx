'use client';

import { Calculator, AlertTriangle, TrendingDown, Layers } from 'lucide-react';

interface Props {
  price84Man: number; // in 만원 (e.g. 92,500)
}

function calculateTaxes(price: number): number {
  // 1. 취득세 (Acquisition Tax) 연환산 (10년 보유 상각 가정)
  let acqTaxRate = 0;
  if (price <= 600000000) acqTaxRate = 0.01;
  else if (price < 900000000) acqTaxRate = 0.01 + ((price - 600000000) / 300000000) * 0.02;
  else acqTaxRate = 0.03;
  
  const annualAcqTax = (price * acqTaxRate) / 10;

  // 2. 보유세 (재산세 + 종부세 대략적 계단식 추정)
  let holdingTax = 0;
  if (price <= 900000000) {
    holdingTax = price * 0.0015; // 0.15%
  } else if (price <= 1500000000) {
    holdingTax = price * 0.003; // 0.3%
  } else {
    holdingTax = price * 0.005; // 0.5%
  }

  return annualAcqTax + holdingTax;
}

export default function AdvancedValuationMetrics({ price84Man }: Props) {
  const price = price84Man * 10000;
  
  // 가설 상수
  const depositRatio = 0.20; // 반전세 수준 보증금 20%
  const monthlyRentYield = 0.045; // 순수 월세 거치분의 수익률 4.5%
  const targetRate = 0.035; // 기준 금리 (간주임대료 산정용 주담대/예금 가중평균)
  const maintenanceRate = 0.005; // 고정 유지관리비 0.5%
  
  const jeonseRatio = 0.60;
  const liquidityPremium = 0.12; 
  
  const ltv = 0.60;
  const debtCostRate = 0.045; // 4.5% 조달 금리

  // 1. EGI (Effective Gross Income: 유효총소득 = 월세수익 + 간주임대료)
  const deposit = price * depositRatio;
  const rentBase = price - deposit;
  const annualRent = rentBase * monthlyRentYield;
  const deemedRent = deposit * targetRate;
  const egi = annualRent + deemedRent;

  // 2. 단계별 세금 및 유지관리비
  const annualTaxes = calculateTaxes(price);
  const maintenance = price * maintenanceRate;
  const totalExpenses = annualTaxes + maintenance;

  // 3. 다중 시나리오 매트릭스 (PRR Band)
  // NOI = EGI * (1 - 공실률) - 비용
  const calcPrr = (vacancyRisk: number) => {
    const noi = (egi * (1 - vacancyRisk)) - totalExpenses;
    return noi > 0 ? price / noi : 0;
  };

  const prrBest = calcPrr(0.0); // 0% 공실
  const prrBase = calcPrr(0.05); // 5% 공실
  const prrWorst = calcPrr(0.10); // 10% 공실

  // 4. 정규화 PBR (Normalized PBR)
  const jeonsePrice = price * jeonseRatio;
  const normalizedUseValue = jeonsePrice * (1 - liquidityPremium);
  const nPbr = normalizedUseValue > 0 ? price / normalizedUseValue : 0;

  // 5. Dual ROE (기본 NOI 기준)
  const baseNoi = (egi * (1 - 0.05)) - totalExpenses;
  const unleveredCapRate = price > 0 ? (baseNoi / price) * 100 : 0;
  const loanAmount = price * ltv;
  const equity = price - loanAmount;
  const debtCost = loanAmount * debtCostRate;
  const leveragedRoe = equity > 0 ? ((baseNoi - debtCost) / equity) * 100 : 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-5 border-b border-[#e5e8eb] pb-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#191f28] flex items-center gap-2">
            <Calculator size={20} className="text-[#3182f6]"/>
            밸류에이션 리포트
          </h2>
          <p className="text-[13px] text-[#8b95a1] mt-1 tracking-[0.5px] font-medium">유효총소득(EGI)·누진세·스트레스 테스트를 반영한 심층 내재가치</p>
        </div>
        <span className="text-[11px] font-bold text-[#3182f6] bg-[#e8f3ff] px-2 py-1 rounded-md shrink-0">
          PRO Model
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* NOI PRR Sensitivity Matrix */}
        <div className="bg-[#f9fafb] p-5 flex flex-col justify-between rounded-2xl ring-1 ring-black/5 hover:ring-[#3182f6]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-[#3182f6]" />
                <h4 className="text-[13px] font-bold text-[#4e5968]">실효 PRR 밴드</h4>
              </div>
              <span className="text-[10px] text-[#8b95a1] bg-[#e5e8eb] px-1.5 py-0.5 rounded">간주임대료+누진세 반응형</span>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-bold text-[#4e5968] mb-1">
                <span>Best (공실 0%)</span>
                <span>Base (5%)</span>
                <span>Stress (10%)</span>
              </div>
              <div className="relative w-full h-8 bg-[#e5e8eb] rounded-lg overflow-hidden flex items-center">
                {/* 밴드 시각화 바 (gradient) */}
                <div className="absolute left-0 h-full bg-gradient-to-r from-[#03c75a] via-[#3182f6] to-[#EF4444] opacity-20 w-full" />
                <div className="z-10 w-full flex justify-between px-3">
                  <span className="text-[12px] font-extrabold text-[#03c75a]">{prrBest.toFixed(1)}x</span>
                  <span className="text-[14px] font-extrabold text-[#191f28]">{prrBase.toFixed(1)}x</span>
                  <span className="text-[12px] font-extrabold text-[#EF4444]">{prrWorst.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#8b95a1] leading-relaxed mt-4">
            초기 수익(EGI)에서 구간별 세금, 공실 시나리오를 가정한 자본 회수 기간 신뢰구간
          </p>
        </div>

        {/* N-PBR */}
        <div className="bg-[#f9fafb] p-5 flex flex-col justify-between rounded-2xl ring-1 ring-black/5 hover:ring-[#3182f6]/30 transition-all">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingDown size={14} className="text-[#8b95a1]" />
              <h4 className="text-[13px] font-bold text-[#4e5968]">정규화 PBR <span className="text-[10px] font-normal text-[#8b95a1]">(N-PBR)</span></h4>
            </div>
            <div className="text-[28px] font-extrabold text-[#191f28] mb-1 leading-none">
              {nPbr.toFixed(2)}<span className="text-[14px] text-[#8b95a1] ml-0.5 font-bold">x</span>
            </div>
          </div>
          <p className="text-[11px] text-[#8b95a1] leading-relaxed mt-3">
            시중 금리발 유동성 프리미엄(12%) 거품을 배제한 본질 사용가치(전세) 대비 시세 프리미엄 배수
          </p>
        </div>

        {/* Dual ROE */}
        <div className="bg-[#f9fafb] p-5 flex flex-col justify-between rounded-2xl ring-1 ring-black/5 relative overflow-hidden hover:ring-[#3182f6]/30 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[13px] font-bold text-[#4e5968]">듀얼 ROE 트래킹</h4>
              {leveragedRoe < unleveredCapRate && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#EF4444] bg-[#FEE2E2] px-1.5 py-0.5 rounded">
                  <AlertTriangle size={10} /> 스프레드 역마진
                </span>
              )}
            </div>
            <div className="flex justify-between items-center bg-white rounded-xl p-2.5 ring-1 ring-black/5 mt-1">
              <div className="text-center w-full">
                <div className="text-[10px] text-[#8b95a1] font-bold mb-0.5">Unlevered (부채 無)</div>
                <div className="text-[15px] font-extrabold text-[#191f28]">{unleveredCapRate.toFixed(2)}%</div>
              </div>
              <div className="w-[1px] h-6 bg-[#e5e8eb] shrink-0"></div>
              <div className="text-center w-full">
                <div className="text-[10px] text-[#3182f6] font-bold mb-0.5">Leveraged (LTV 60%)</div>
                <div className={`text-[15px] font-extrabold ${leveragedRoe < unleveredCapRate ? 'text-[#EF4444]' : 'text-[#3182f6]'}`}>
                  {leveragedRoe.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#8b95a1] leading-relaxed mt-3">
            순자본환원율(Cap)과 타인자본 조달비용(4.5%) 간의 한계수익률 스프레드
          </p>
        </div>
      </div>
    </div>
  );
}
