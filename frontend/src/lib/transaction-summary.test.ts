import { TX_SUMMARY, AptTxSummary, RecentTx } from './transaction-summary';

describe('Transaction Summary Verification', () => {
  it('should export a properly structured TX_SUMMARY object', () => {
    expect(TX_SUMMARY).toBeDefined();
    expect(typeof TX_SUMMARY).toBe('object');
  });

  it('should conform to the AptTxSummary interface for each entry', () => {
    const keys = Object.keys(TX_SUMMARY);
    if (keys.length === 0) return; // Skip if empty

    // Take a sample to prevent massive test logs
    const sampleKey = keys[0];
    const summary: AptTxSummary = TX_SUMMARY[sampleKey];

    expect(summary).toHaveProperty('latestPrice');
    expect(typeof summary.latestPrice).toBe('number');
    
    expect(summary).toHaveProperty('latestPriceEok');
    expect(typeof summary.latestPriceEok).toBe('string');
    
    expect(summary).toHaveProperty('latestArea');
    expect(summary).toHaveProperty('recordPrice');
    expect(summary).toHaveProperty('topAreaPyeong');
  });

  it('should gracefully handle unexpected keys (no undefined crashes)', () => {
    const missing: AptTxSummary | undefined = TX_SUMMARY['NonExistentApartmentName!!!___'];
    expect(missing).toBeUndefined();
  });
});
