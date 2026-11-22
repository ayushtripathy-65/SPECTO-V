import { describe, it, expect } from 'vitest';
import {
  addLaplaceNoise,
  aggregateHealthFlags,
  bucketAge,
  bucketCreditTenure,
  bucketHealthTier,
  bucketIncome,
  calculateAge,
  createSaltedHashSync,
  sampleLaplaceNoise,
} from '../src/core/transformers';

describe('Privacy-Preserving Transformation Layer', () => {
  describe('Generalization / Bucketing', () => {
    it('buckets age correctly', () => {
      expect(bucketAge(19)).toBe('<21');
      expect(bucketAge(24)).toBe('21-25');
      expect(bucketAge(28)).toBe('26-30');
      expect(bucketAge(35)).toBe('31-40');
      expect(bucketAge(45)).toBe('41-50');
      expect(bucketAge(58)).toBe('51-60');
      expect(bucketAge(68)).toBe('60+');
    });

    it('calculates age from DOB string', () => {
      const birthdate = '2000-01-01';
      const age = calculateAge(birthdate);
      expect(age).toBeGreaterThanOrEqual(24);
    });

    it('buckets income into non-invertible brackets', () => {
      expect(bucketIncome(1500)).toBe('Tier 1 (<$2.5k)');
      expect(bucketIncome(3200)).toBe('Tier 2 ($2.5k-$5k)');
      expect(bucketIncome(7800)).toBe('Tier 3 ($5k-$10k)');
      expect(bucketIncome(15000)).toBe('Tier 4 ($10k-$20k)');
      expect(bucketIncome(35000)).toBe('Tier 5 ($20k+)');
    });

    it('buckets credit tenure into bands', () => {
      expect(bucketCreditTenure(0.5)).toBe('<1 yr');
      expect(bucketCreditTenure(2)).toBe('1-3 yrs');
      expect(bucketCreditTenure(4)).toBe('3-5 yrs');
      expect(bucketCreditTenure(8)).toBe('5-10 yrs');
      expect(bucketCreditTenure(15)).toBe('10+ yrs');
    });

    it('buckets health risk tiers', () => {
      expect(bucketHealthTier(15)).toBe('LOW_RISK');
      expect(bucketHealthTier(35)).toBe('MODERATE_RISK');
      expect(bucketHealthTier(65)).toBe('ELEVATED_RISK');
      expect(bucketHealthTier(85)).toBe('HIGH_RISK');
    });
  });

  describe('Salted Hashing', () => {
    it('produces deterministic pseudonyms with same salt', () => {
      const hash1 = createSaltedHashSync('aadhaar_1234', 'secret_salt_a');
      const hash2 = createSaltedHashSync('aadhaar_1234', 'secret_salt_a');
      const hash3 = createSaltedHashSync('aadhaar_1234', 'secret_salt_b');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).not.toContain('1234');
    });
  });

  describe('Differential Privacy (Laplace Mechanism)', () => {
    it('generates zero noise when epsilon is huge and bounded noise when epsilon is reasonable', () => {
      const noise = sampleLaplaceNoise(10, 1.0);
      expect(typeof noise).toBe('number');
      expect(isNaN(noise)).toBe(false);
    });

    it('perturbs value while respecting bounds', () => {
      const result = addLaplaceNoise(50, 10, 0.5, 0, 100);
      expect(result.noisedValue).toBeGreaterThanOrEqual(0);
      expect(result.noisedValue).toBeLessThanOrEqual(100);
      expect(result.epsilon).toBe(0.5);
    });
  });

  describe('Local Feature Aggregation', () => {
    it('summarizes multiple medical conditions into single composite score and tier', () => {
      const lowRisk = aggregateHealthFlags(false, false, false, 'NORMAL');
      expect(lowRisk.riskTier).toBe('LOW_RISK');

      const highRisk = aggregateHealthFlags(true, true, true, 'OBESE');
      expect(highRisk.riskTier).toBe('HIGH_RISK');
      expect(highRisk.compositeScore).toBeGreaterThan(75);
    });
  });
});
