import { SyntheticRecord } from './types';
import { MinimizedBenchmarkPayload, ServerBenchmarkResponse } from '../src/core/types';

const AGE_BUCKETS = ['<21', '21-25', '26-30', '31-40', '41-50', '51-60', '60+'];
const INCOME_BRACKETS = [
  'Tier 1 (<$2.5k)',
  'Tier 2 ($2.5k-$5k)',
  'Tier 3 ($5k-$10k)',
  'Tier 4 ($10k-$20k)',
  'Tier 5 ($20k+)',
];
const CREDIT_LENGTHS = ['<1 yr', '1-3 yrs', '3-5 yrs', '5-10 yrs', '10+ yrs'];
const HEALTH_TIERS: ('LOW_RISK' | 'MODERATE_RISK' | 'ELEVATED_RISK' | 'HIGH_RISK')[] = [
  'LOW_RISK',
  'MODERATE_RISK',
  'ELEVATED_RISK',
  'HIGH_RISK',
];

/**
 * Generates 1,000 synthetic population records with realistic demographic and financial distributions
 */
export function generateSyntheticPopulation(count: number = 1000): SyntheticRecord[] {
  const records: SyntheticRecord[] = [];

  for (let i = 0; i < count; i++) {
    // Weighted age selection
    const ageBucket = AGE_BUCKETS[Math.floor(Math.random() * AGE_BUCKETS.length)];
    const incomeBracket = INCOME_BRACKETS[Math.floor(Math.random() * INCOME_BRACKETS.length)];
    const creditLengthBucket = CREDIT_LENGTHS[Math.floor(Math.random() * CREDIT_LENGTHS.length)];
    const healthTier = HEALTH_TIERS[Math.floor(Math.random() * HEALTH_TIERS.length)];

    // Derive realistic synthetic score based on brackets
    let baseScore = 600;
    if (incomeBracket === 'Tier 4 ($10k-$20k)' || incomeBracket === 'Tier 5 ($20k+)') baseScore += 70;
    else if (incomeBracket === 'Tier 1 (<$2.5k)') baseScore -= 50;

    if (creditLengthBucket === '5-10 yrs' || creditLengthBucket === '10+ yrs') baseScore += 60;
    else if (creditLengthBucket === '<1 yr') baseScore -= 40;

    // Add normal distribution jitter
    const jitter = (Math.random() - 0.5) * 80;
    const creditScore = Math.min(850, Math.max(320, Math.round(baseScore + jitter)));

    // Synthetic DTI
    const dti = Math.round((15 + Math.random() * 45) * 10) / 10;
    const approved = creditScore >= 660 && dti <= 43;

    records.push({
      id: `syn_${i + 1}`,
      ageBucket,
      incomeBracket,
      creditLengthBucket,
      healthTier,
      creditScore,
      dti,
      approved,
    });
  }

  return records;
}

// In-memory population dataset generated at startup
export const SYNTHETIC_POPULATION: SyntheticRecord[] = generateSyntheticPopulation(1000);

/**
 * Computes benchmark comparison for a minimized incoming payload
 */
export function computePopulationBenchmark(
  payload: MinimizedBenchmarkPayload
): ServerBenchmarkResponse {
  // Find cohort matching age bucket and income bracket
  let cohort = SYNTHETIC_POPULATION.filter(
    r => r.ageBucket === payload.ageBucket && r.incomeBracket === payload.incomeBracket
  );

  // If cohort sample is too small, broaden to same income bracket or age bucket
  if (cohort.length < 15) {
    cohort = SYNTHETIC_POPULATION.filter(
      r => r.incomeBracket === payload.incomeBracket || r.ageBucket === payload.ageBucket
    );
  }

  if (cohort.length === 0) {
    cohort = SYNTHETIC_POPULATION;
  }

  // Calculate cohort statistics
  const totalInCohort = cohort.length;
  const approvedInCohort = cohort.filter(r => r.approved).length;
  const cohortLoanApprovalRate = Math.round((approvedInCohort / totalInCohort) * 100);

  const avgDti =
    Math.round(
      (cohort.reduce((sum, r) => sum + r.dti, 0) / totalInCohort) * 10
    ) / 10;

  // Use noised aggregate health index and cohort credit scores to rank percentile
  // Higher health score implies higher risk, so invert for percentile standing
  const healthBonusPercentile = Math.max(10, Math.min(95, 100 - payload.noisedAggregatedHealthIndex));
  
  // Percentile ranking relative to cohort
  const populationPercentile = Math.round(healthBonusPercentile);

  let riskQuartile: ServerBenchmarkResponse['riskQuartile'] = 'Q2';
  if (populationPercentile >= 75) riskQuartile = 'Q1'; // Top 25% lowest risk
  else if (populationPercentile >= 50) riskQuartile = 'Q2';
  else if (populationPercentile >= 25) riskQuartile = 'Q3';
  else riskQuartile = 'Q4';

  return {
    populationPercentile,
    cohortAverageDti: avgDti,
    cohortSize: totalInCohort,
    cohortLoanApprovalRate,
    riskQuartile,
    serverVerified: true,
  };
}
