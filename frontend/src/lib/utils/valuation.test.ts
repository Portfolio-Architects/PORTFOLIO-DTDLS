import { normalize84Price, calculatePUR } from './valuation';

describe('Valuation Utilities', () => {
  describe('normalize84Price()', () => {
    it('should return same price for 84㎡ area', () => {
      expect(normalize84Price(50000, 84)).toBe(50000);
    });

    it('should scale up for smaller areas', () => {
      // 59㎡ at 35,000만 → 84㎡ ≈ 49,831만
      const result = normalize84Price(35000, 59);
      expect(result).toBeGreaterThan(49000);
      expect(result).toBeLessThan(50500);
    });

    it('should scale down for larger areas', () => {
      // 114㎡ at 80,000만 → 84㎡ ≈ 58,947만
      const result = normalize84Price(80000, 114);
      expect(result).toBeGreaterThan(58000);
      expect(result).toBeLessThan(60000);
    });

    it('should handle zero area gracefully', () => {
      expect(normalize84Price(50000, 0)).toBe(50000);
      expect(normalize84Price(50000, -1)).toBe(50000);
    });
  });

  describe('calculatePUR()', () => {
    it('should return valid ValuationResult structure', () => {
      const result = calculatePUR(50000, 70, '힐스테이트');
      expect(result).toHaveProperty('pur');
      expect(result).toHaveProperty('purGrade');
      expect(result).toHaveProperty('estimatedYield');
      expect(result).toHaveProperty('fairValue84');
      expect(result).toHaveProperty('investmentGrade');
      expect(typeof result.pur).toBe('number');
      expect(typeof result.purGrade).toBe('string');
    });

    it('should assign better PUR grade for lower price / high score', () => {
      const cheap = calculatePUR(30000, 80); // 저렴 + 높은 점수
      const expensive = calculatePUR(90000, 30); // 비쌈 + 낮은 점수
      expect(cheap.pur).toBeLessThan(expensive.pur);
    });

    it('should apply brand multiplier (μ) for known brands', () => {
      const branded = calculatePUR(50000, 60, '힐스테이트');
      const unbranded = calculatePUR(50000, 60);
      // 힐스테이트 μ=1.09 > default μ=0.925 → branded PUR should be lower
      expect(branded.pur).toBeLessThan(unbranded.pur);
    });

    it('should handle edge case: totalScore = 0', () => {
      const result = calculatePUR(50000, 0);
      // Should use safeTotalScore = Math.max(0, 1) = 1
      expect(result.pur).toBeGreaterThan(0);
      expect(Number.isFinite(result.pur)).toBe(true);
    });

    it('should calculate estimated yield as positive percentage', () => {
      const result = calculatePUR(50000, 70);
      expect(result.estimatedYield).toBeGreaterThan(0);
      expect(result.estimatedYield).toBeLessThan(10);
    });
  });
});
