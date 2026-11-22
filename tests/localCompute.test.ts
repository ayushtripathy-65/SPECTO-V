import { describe, it, expect } from 'vitest';
import {
  computeAllLocalFeatures,
  computeLocalDti,
  computeLocalHealthRisk,
  computeLocalLoanScore,
  verifyNationalIdLocally,
} from '../src/core/localCompute';
import { reconstructResults } from '../src/core/reconstructor';
import { UserFormData } from '../src/core/types';

describe('Local Computation Engine (Web Worker Core)', () => {
  it('correctly calculates BMI and categorized health risk index', () => {
    // Normal BMI, non-smoker, no diabetes/hypertension
    const healthy = computeLocalHealthRisk(180, 72, false, false, false);
    expect(healthy.bmi).toBe(22.2);
    expect(healthy.bmiCategory).toBe('NORMAL');
    expect(healthy.healthRiskIndex).toBe(15); // baseline

    // Obese BMI, smoker, hypertension, diabetes
    const highRisk = computeLocalHealthRisk(170, 95, true, true, true);
    expect(healthy.bmi).toBeLessThan(highRisk.bmi);
    expect(highRisk.bmiCategory).toBe('OBESE');
    expect(highRisk.healthRiskIndex).toBeGreaterThan(70);
  });

  it('calculates debt-to-income ratio correctly', () => {
    const lowDti = computeLocalDti(10000, 1500);
    expect(lowDti.debtToIncomeRatio).toBe(15.0);
    expect(lowDti.dtiStatus).toBe('HEALTHY');

    const highDti = computeLocalDti(5000, 2600);
    expect(highDti.debtToIncomeRatio).toBe(52.0);
    expect(highDti.dtiStatus).toBe('CRITICAL');
  });

  it('validates national ID format locally without sending to remote server', () => {
    expect(verifyNationalIdLocally('5421 8902 3341')).toBe(true); // 12 digits Aadhaar
    expect(verifyNationalIdLocally('492-18-9021')).toBe(true); // 9 digits SSN
    expect(verifyNationalIdLocally('ABCDE1234F')).toBe(true); // PAN
    expect(verifyNationalIdLocally('123')).toBe(false); // Too short
    expect(verifyNationalIdLocally('')).toBe(false);
  });

  it('calculates credit eligibility score based on local financial features', () => {
    const primeScore = computeLocalLoanScore(12000, 1000, 8, true);
    expect(primeScore.loanEligibilityScore).toBeGreaterThanOrEqual(740);
    expect(primeScore.loanApprovalTier).toBe('PRIME');

    const subprimeScore = computeLocalLoanScore(2200, 1800, 1, false);
    expect(subprimeScore.loanEligibilityScore).toBeLessThan(650);
  });

  it('orchestrates all local features together', () => {
    const sampleData: UserFormData = {
      fullName: 'Alice Test',
      email: 'alice@test.com',
      phone: '555-019-1122',
      nationalId: '1234 5678 9012',
      dob: '1994-06-12',
      monthlyIncome: 8000,
      existingDebt: 1600,
      creditHistoryYears: 5,
      hasDiabetes: false,
      hasHypertension: false,
      isSmoker: false,
      heightCm: 172,
      weightKg: 68,
      additionalNotes: 'Test application notes',
    };

    const results = computeAllLocalFeatures(sampleData);
    expect(results.loanEligibilityScore).toBeGreaterThanOrEqual(300);
    expect(results.loanEligibilityScore).toBeLessThanOrEqual(850);
    expect(results.kycHashLocalCheck).toBe(true);
    expect(results.dtiStatus).toBe('HEALTHY');
  });
});

describe('Client-Side Result Reconstruction', () => {
  it('merges local credit score with population cohort percentile to produce calibrated final score', () => {
    const sampleLocal = computeAllLocalFeatures({
      fullName: 'Bob Test',
      email: 'bob@test.com',
      phone: '555-019-3344',
      nationalId: '9876 5432 1098',
      dob: '1988-02-14',
      monthlyIncome: 9500,
      existingDebt: 1200,
      creditHistoryYears: 6,
      hasDiabetes: false,
      hasHypertension: false,
      isSmoker: false,
      heightCm: 178,
      weightKg: 75,
      additionalNotes: '',
    });

    const reconstructed = reconstructResults(
      sampleLocal,
      {
        populationPercentile: 88,
        cohortAverageDti: 32.1,
        cohortSize: 180,
        cohortLoanApprovalRate: 85,
        riskQuartile: 'Q1',
        serverVerified: true,
      },
      {
        premiumBand: 'STANDARD',
        baseAnnualRateUsd: 1100,
        cohortDiscountPercent: 15,
        serverTimestamp: new Date().toISOString(),
      },
      1.0
    );

    expect(reconstructed.finalScoreMerged).toBeGreaterThan(700);
    expect(reconstructed.finalRecommendation).toContain('Pre-Approved');
    expect(reconstructed.finalRecommendation).toContain('88%');
    expect(reconstructed.privacySummary.rawFieldsSent).toBe(0);
    expect(reconstructed.privacySummary.noiseAdded).toBe(true);
  });
});
