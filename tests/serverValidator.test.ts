import { describe, it, expect } from 'vitest';
import { validateMinimizedPayload } from '../server/validator';
import { computePopulationBenchmark, SYNTHETIC_POPULATION } from '../server/syntheticData';
import { MinimizedBenchmarkPayload, MinimizedPremiumPayload } from '../src/core/types';

describe('Server Zero-Trust Defense Layer', () => {
  describe('validateMinimizedPayload', () => {
    it('strictly rejects payload containing raw nationalId, email, or phone fields', () => {
      const dirtyPayload = {
        clientSaltedHash: 'ds_811c9dc5',
        ageBucket: '26-30',
        incomeBracket: 'Tier 3 ($5k-$10k)',
        nationalId: '1234 5678 9012',
        email: 'victim@identity-leak.org',
      };

      const result = validateMinimizedPayload(dirtyPayload);
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
      expect(result.violations.some(v => v.field === 'nationalId')).toBe(true);
      expect(result.violations.some(v => v.field === 'email')).toBe(true);
    });

    it('rejects payload with embedded government ID patterns in custom string fields', () => {
      const sneakyPayload = {
        clientSaltedHash: 'ds_811c9dc5',
        customTrackingString: 'User national id is 4123 4567 8901',
      };

      const result = validateMinimizedPayload(sneakyPayload);
      expect(result.isValid).toBe(false);
      expect(
        result.violations.some(v => v.rule === 'EMBEDDED_NATIONAL_ID_PATTERN')
      ).toBe(true);
    });

    it('rejects raw exact financial figures in income-like fields', () => {
      const rawFinancialPayload = {
        clientSaltedHash: 'ds_811c9dc5',
        monthlyIncome: 12500,
      };

      const result = validateMinimizedPayload(rawFinancialPayload);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.field === 'monthlyIncome')).toBe(true);
    });

    it('rejects raw medical flags or free-text notes if mistakenly forwarded', () => {
      const rawMedicalPayload = {
        clientSaltedHash: 'ds_811c9dc5',
        hasDiabetes: true,
        additionalNotes: 'Patient has high blood pressure and cardiac history.',
      };

      const result = validateMinimizedPayload(rawMedicalPayload);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.field === 'hasDiabetes')).toBe(true);
      expect(result.violations.some(v => v.field === 'additionalNotes')).toBe(true);
    });

    it('accepts compliant minimized benchmark payloads', () => {
      const cleanPayload: MinimizedBenchmarkPayload = {
        clientSaltedHash: 'ds_811c9dc54a8b9c0d',
        ageBucket: '26-30',
        incomeBracket: 'Tier 3 ($5k-$10k)',
        creditLengthBucket: '3-5 yrs',
        noisedAggregatedHealthIndex: 32.4,
        epsilon: 1.0,
        timestamp: new Date().toISOString(),
      };

      const result = validateMinimizedPayload(cleanPayload);
      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('accepts compliant minimized premium payloads', () => {
      const cleanPayload: MinimizedPremiumPayload = {
        clientSaltedHash: 'ds_811c9dc54a8b9c0d',
        ageBucket: '31-40',
        healthTier: 'LOW_RISK',
        isSmokerGeneral: false,
        timestamp: new Date().toISOString(),
      };

      const result = validateMinimizedPayload(cleanPayload);
      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
    });
  });

  describe('Synthetic Population Dataset & Benchmark Engine', () => {
    it('initializes 1000 synthetic records with realistic variance', () => {
      expect(SYNTHETIC_POPULATION.length).toBe(1000);
      const primeRecords = SYNTHETIC_POPULATION.filter(r => r.creditScore >= 740);
      expect(primeRecords.length).toBeGreaterThan(50);
    });

    it('computes realistic benchmark percentiles without receiving raw personal data', () => {
      const cleanPayload: MinimizedBenchmarkPayload = {
        clientSaltedHash: 'ds_811c9dc54a8b9c0d',
        ageBucket: '31-40',
        incomeBracket: 'Tier 4 ($10k-$20k)',
        creditLengthBucket: '5-10 yrs',
        noisedAggregatedHealthIndex: 22.0,
        epsilon: 1.5,
        timestamp: new Date().toISOString(),
      };

      const benchmark = computePopulationBenchmark(cleanPayload);
      expect(benchmark.serverVerified).toBe(true);
      expect(benchmark.cohortSize).toBeGreaterThan(0);
      expect(benchmark.populationPercentile).toBeGreaterThanOrEqual(10);
      expect(benchmark.populationPercentile).toBeLessThanOrEqual(95);
      expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(benchmark.riskQuartile);
      expect(benchmark.cohortAverageDti).toBeGreaterThan(10);
      expect(benchmark.cohortLoanApprovalRate).toBeGreaterThan(0);
    });
  });
});
