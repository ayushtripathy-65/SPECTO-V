// Zero-Trust Data Transformation and Minimization Layer

/**
 * Computes age in full years from date of birth string (YYYY-MM-DD or similar)
 */
export function calculateAge(dobString: string): number {
  if (!dobString) return 30; // fallback default
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return 30;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Generalization: Buckets age into standard privacy cohorts
 */
export function bucketAge(age: number): string {
  if (age < 21) return '<21';
  if (age <= 25) return '21-25';
  if (age <= 30) return '26-30';
  if (age <= 40) return '31-40';
  if (age <= 50) return '41-50';
  if (age <= 60) return '51-60';
  return '60+';
}

/**
 * Generalization: Buckets monthly income into discrete financial bands
 */
export function bucketIncome(income: number): string {
  if (income < 2500) return 'Tier 1 (<$2.5k)';
  if (income < 5000) return 'Tier 2 ($2.5k-$5k)';
  if (income < 10000) return 'Tier 3 ($5k-$10k)';
  if (income < 20000) return 'Tier 4 ($10k-$20k)';
  return 'Tier 5 ($20k+)';
}

/**
 * Generalization: Buckets credit history tenure
 */
export function bucketCreditTenure(years: number): string {
  if (years < 1) return '<1 yr';
  if (years <= 3) return '1-3 yrs';
  if (years <= 5) return '3-5 yrs';
  if (years <= 10) return '5-10 yrs';
  return '10+ yrs';
}

/**
 * Generalization: Buckets health risk score into risk tiers
 */
export function bucketHealthTier(riskScore: number): 'LOW_RISK' | 'MODERATE_RISK' | 'ELEVATED_RISK' | 'HIGH_RISK' {
  if (riskScore <= 25) return 'LOW_RISK';
  if (riskScore <= 50) return 'MODERATE_RISK';
  if (riskScore <= 75) return 'ELEVATED_RISK';
  return 'HIGH_RISK';
}

/**
 * Cryptographic Salted Hash for Pseudonymization (Browser & Node friendly)
 */
export async function createSaltedHash(value: string, salt: string = 'datashadow_device_salt_2026'): Promise<string> {
  const combined = `${salt}:${value}`;
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } else {
    // Pure JS fallback hash for test environments where crypto.subtle may be simulated
    let hash = 0x811c9dc5;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return `ds_${hash.toString(16).padStart(8, '0')}`;
  }
}

/**
 * Synchronous salted hash for fast test execution
 */
export function createSaltedHashSync(value: string, salt: string = 'datashadow_salt'): string {
  const combined = `${salt}:${value}`;
  let hash1 = 0x811c9dc5;
  let hash2 = 0x5a17b3c9;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    hash1 ^= code;
    hash1 = (hash1 * 0x01000193) >>> 0;
    hash2 ^= (code << 3);
    hash2 = (hash2 * 0x01000193) >>> 0;
  }
  return `ds_${hash1.toString(16).padStart(8, '0')}${hash2.toString(16).padStart(8, '0')}`;
}

/**
 * Laplace Differential Privacy Mechanism
 * Adds calibrated Laplace noise to a numeric query result.
 * scale b = sensitivity / epsilon
 */
export function sampleLaplaceNoise(sensitivity: number, epsilon: number): number {
  if (epsilon <= 0) return 0;
  const b = sensitivity / epsilon;
  // Uniform random in (-0.5, 0.5)
  const u = Math.random() - 0.5;
  // Inverse CDF of Laplace distribution
  const sign = u < 0 ? -1 : 1;
  const noise = -b * sign * Math.log(1 - 2 * Math.abs(u));
  return Math.round(noise * 10) / 10;
}

/**
 * Applies Differential Privacy to a numeric metric
 */
export function addLaplaceNoise(
  value: number,
  sensitivity: number = 10,
  epsilon: number = 1.0,
  minBound: number = 0,
  maxBound: number = 100
): {
  originalValue: number;
  noisedValue: number;
  noiseAmount: number;
  epsilon: number;
} {
  const noiseAmount = sampleLaplaceNoise(sensitivity, epsilon);
  let noised = value + noiseAmount;
  // Clamp to valid domain
  noised = Math.max(minBound, Math.min(maxBound, Math.round(noised * 10) / 10));
  return {
    originalValue: value,
    noisedValue: noised,
    noiseAmount: Math.round((noised - value) * 10) / 10,
    epsilon,
  };
}

/**
 * Local Feature Aggregation
 * Derives aggregate health score without revealing individual conditions
 */
export function aggregateHealthFlags(
  hasDiabetes: boolean,
  hasHypertension: boolean,
  isSmoker: boolean,
  bmiCategory: string
): {
  compositeScore: number;
  riskTier: 'LOW_RISK' | 'MODERATE_RISK' | 'ELEVATED_RISK' | 'HIGH_RISK';
} {
  let score = 20;
  if (hasDiabetes) score += 25;
  if (hasHypertension) score += 25;
  if (isSmoker) score += 30;
  if (bmiCategory === 'OBESE') score += 20;
  else if (bmiCategory === 'OVERWEIGHT') score += 10;

  const compositeScore = Math.min(100, score);
  return {
    compositeScore,
    riskTier: bucketHealthTier(compositeScore),
  };
}
