export type SensitivityLevel = 'PUBLIC' | 'PERSONAL' | 'SENSITIVE' | 'HIGHLY_SENSITIVE';

export type ExecutionTarget = 'LOCAL' | 'REMOTE' | 'HYBRID';

export type TransformationTechnique =
  | 'STAYED_LOCAL'
  | 'GENERALIZED'
  | 'HASHED'
  | 'AGGREGATED'
  | 'NOISED'
  | 'DROPPED';

export interface UserFormData {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  dob: string;
  monthlyIncome: number;
  existingDebt: number;
  creditHistoryYears: number;
  hasDiabetes: boolean;
  hasHypertension: boolean;
  isSmoker: boolean;
  heightCm: number;
  weightKg: number;
  additionalNotes: string;
}

export interface ExtractedPII {
  type: 'EMAIL' | 'PHONE' | 'NATIONAL_ID' | 'CREDIT_CARD' | 'FINANCIAL_AMOUNT' | 'NAME';
  value: string;
  start: number;
  end: number;
}

export interface FieldClassification {
  fieldName: keyof UserFormData | string;
  level: SensitivityLevel;
  confidence: number;
  reason: string;
  detectedPatterns: string[];
  extractedPii?: ExtractedPII[];
  redactedPreview?: string;
}

export interface TaskRequirement {
  taskId: string;
  taskName: string;
  description: string;
  requiredFields: (keyof UserFormData)[];
  requiresServerResource: boolean;
  serverResourceName?: string;
}

export interface FieldTransformationDetail {
  fieldName: string;
  sensitivity: SensitivityLevel;
  technique: TransformationTechnique;
  originalSample: string;
  transformedSample: string;
  explanation: string;
}

export interface TaskDecision {
  taskId: string;
  taskName: string;
  target: ExecutionTarget;
  reason: string;
  requiredFields: (keyof UserFormData)[];
  transformations: FieldTransformationDetail[];
  offlineCapable: boolean;
}

export interface LocalComputeResults {
  loanEligibilityScore: number; // 300 - 850
  loanApprovalTier: 'PRIME' | 'NEAR_PRIME' | 'SUBPRIME' | 'REJECT';
  debtToIncomeRatio: number; // percentage
  dtiStatus: 'HEALTHY' | 'MODERATE' | 'CRITICAL';
  bmi: number;
  bmiCategory: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
  healthRiskIndex: number; // 0 - 100
  kycHashLocalCheck: boolean;
}

export interface MinimizedBenchmarkPayload {
  clientSaltedHash: string; // Pseudonymized one-way identifier
  ageBucket: string; // e.g. "25-34"
  incomeBracket: string; // e.g. "Tier-2 ($5k-$10k)"
  creditLengthBucket: string; // e.g. "3-5 yrs"
  noisedAggregatedHealthIndex: number; // With Laplace noise added
  epsilon: number; // Privacy budget parameter used
  timestamp: string;
}

export interface MinimizedPremiumPayload {
  clientSaltedHash: string;
  ageBucket: string;
  healthTier: 'LOW_RISK' | 'MODERATE_RISK' | 'ELEVATED_RISK' | 'HIGH_RISK';
  isSmokerGeneral: boolean;
  timestamp: string;
}

export interface ServerBenchmarkResponse {
  populationPercentile: number; // e.g. 84 (higher than 84% of cohort)
  cohortAverageDti: number;
  cohortSize: number;
  cohortLoanApprovalRate: number;
  riskQuartile: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  serverVerified: boolean;
}

export interface ServerPremiumResponse {
  premiumBand: 'STANDARD' | 'TIER_1' | 'TIER_2' | 'HIGH_RISK_SURCHARGE';
  baseAnnualRateUsd: number;
  cohortDiscountPercent: number;
  serverTimestamp: string;
}

export interface ReconstructedResults {
  local: LocalComputeResults;
  benchmark?: ServerBenchmarkResponse;
  premium?: ServerPremiumResponse;
  finalScoreMerged: number; // Merged local score weighted with cohort distribution
  finalRecommendation: string;
  privacySummary: {
    rawFieldsSent: number;
    rawFieldsKeptLocal: number;
    bytesMinimizedPercent: number;
    noiseAdded: boolean;
    noiseEpsilon: number;
  };
}

export interface NetworkLogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  mode: 'DATASHADOW' | 'TRADITIONAL';
  status: 'SUCCESS' | 'REJECTED' | 'QUEUED' | 'OFFLINE_BLOCKED' | 'FAILED';
  httpStatus?: number;
  rawPayload: Record<string, any>;
  transmittedPayload: Record<string, any>;
  rawFieldCount: number;
  transmittedFieldCount: number;
  rawBytes: number;
  transmittedBytes: number;
  bytesReducedPercent: number;
  rawSensitiveFieldsCount: number;
  response?: any;
  rejectionMessage?: string;
  durationMs?: number;
}
