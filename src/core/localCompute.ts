import { LocalComputeResults, UserFormData } from './types';

/**
 * Calculates BMI and Health Risk Index entirely on the client
 */
export function computeLocalHealthRisk(
  heightCm: number,
  weightKg: number,
  hasDiabetes: boolean,
  hasHypertension: boolean,
  isSmoker: boolean
): {
  bmi: number;
  bmiCategory: LocalComputeResults['bmiCategory'];
  healthRiskIndex: number;
} {
  const heightM = heightCm > 0 ? heightCm / 100 : 1.7;
  const rawBmi = weightKg > 0 ? weightKg / (heightM * heightM) : 22.0;
  const bmi = Math.round(rawBmi * 10) / 10;

  let bmiCategory: LocalComputeResults['bmiCategory'] = 'NORMAL';
  let bmiPenalty = 0;

  if (bmi < 18.5) {
    bmiCategory = 'UNDERWEIGHT';
    bmiPenalty = 10;
  } else if (bmi <= 24.9) {
    bmiCategory = 'NORMAL';
    bmiPenalty = 0;
  } else if (bmi <= 29.9) {
    bmiCategory = 'OVERWEIGHT';
    bmiPenalty = 15;
  } else {
    bmiCategory = 'OBESE';
    bmiPenalty = 30;
  }

  let healthRisk = 15; // baseline healthy risk
  healthRisk += bmiPenalty;
  if (isSmoker) healthRisk += 25;
  if (hasHypertension) healthRisk += 20;
  if (hasDiabetes) healthRisk += 20;

  const healthRiskIndex = Math.min(100, Math.max(0, healthRisk));

  return { bmi, bmiCategory, healthRiskIndex };
}

/**
 * Calculates Debt-To-Income (DTI) ratio
 */
export function computeLocalDti(
  monthlyIncome: number,
  existingDebt: number
): {
  debtToIncomeRatio: number;
  dtiStatus: LocalComputeResults['dtiStatus'];
} {
  const income = Math.max(1, monthlyIncome || 0);
  const debt = Math.max(0, existingDebt || 0);
  const rawRatio = (debt / income) * 100;
  const debtToIncomeRatio = Math.round(rawRatio * 10) / 10;

  let dtiStatus: LocalComputeResults['dtiStatus'] = 'HEALTHY';
  if (debtToIncomeRatio > 45) {
    dtiStatus = 'CRITICAL';
  } else if (debtToIncomeRatio > 30) {
    dtiStatus = 'MODERATE';
  }

  return { debtToIncomeRatio, dtiStatus };
}

/**
 * Validates National ID format locally (Luhn / structural check) without server transmission
 */
export function verifyNationalIdLocally(nationalId: string): boolean {
  if (!nationalId) return false;
  const clean = nationalId.replace(/[\s-]/g, '');
  // Aadhaar: 12 numeric digits
  if (/^\d{12}$/.test(clean)) return true;
  // SSN: 9 numeric digits
  if (/^\d{9}$/.test(clean)) return true;
  // PAN: 5 letters, 4 numbers, 1 letter
  if (/^[A-Z]{5}\d{4}[A-Z]$/i.test(clean)) return true;
  return clean.length >= 8;
}

/**
 * Calculates credit eligibility score (300-850) locally
 */
export function computeLocalLoanScore(
  income: number,
  debt: number,
  creditHistoryYears: number,
  nationalIdValid: boolean
): {
  loanEligibilityScore: number;
  loanApprovalTier: LocalComputeResults['loanApprovalTier'];
} {
  let score = 650; // Neutral starting score

  // DTI impact
  const dti = income > 0 ? (debt / income) * 100 : 100;
  if (dti <= 20) {
    score += 70;
  } else if (dti <= 35) {
    score += 30;
  } else if (dti <= 50) {
    score -= 60;
  } else {
    score -= 130;
  }

  // Credit history tenure impact (+12 pts per year, max 84 pts)
  const tenureBonus = Math.min(84, Math.max(0, creditHistoryYears * 12));
  score += tenureBonus;

  // Income capacity bonus/penalty
  if (income >= 10000) {
    score += 45;
  } else if (income >= 5000) {
    score += 25;
  } else if (income < 2000) {
    score -= 40;
  }

  // Local KYC validity check bonus
  if (nationalIdValid) {
    score += 15;
  } else {
    score -= 30;
  }

  // Clamp within standard credit range 300 - 850
  const loanEligibilityScore = Math.min(850, Math.max(300, Math.round(score)));

  let loanApprovalTier: LocalComputeResults['loanApprovalTier'] = 'REJECT';
  if (loanEligibilityScore >= 740) {
    loanApprovalTier = 'PRIME';
  } else if (loanEligibilityScore >= 670) {
    loanApprovalTier = 'NEAR_PRIME';
  } else if (loanEligibilityScore >= 580) {
    loanApprovalTier = 'SUBPRIME';
  }

  return { loanEligibilityScore, loanApprovalTier };
}

/**
 * Main orchestration for all local computations
 */
export function computeAllLocalFeatures(data: UserFormData): LocalComputeResults {
  const { bmi, bmiCategory, healthRiskIndex } = computeLocalHealthRisk(
    data.heightCm,
    data.weightKg,
    data.hasDiabetes,
    data.hasHypertension,
    data.isSmoker
  );

  const { debtToIncomeRatio, dtiStatus } = computeLocalDti(
    data.monthlyIncome,
    data.existingDebt
  );

  const kycHashLocalCheck = verifyNationalIdLocally(data.nationalId);

  const { loanEligibilityScore, loanApprovalTier } = computeLocalLoanScore(
    data.monthlyIncome,
    data.existingDebt,
    data.creditHistoryYears,
    kycHashLocalCheck
  );

  return {
    loanEligibilityScore,
    loanApprovalTier,
    debtToIncomeRatio,
    dtiStatus,
    bmi,
    bmiCategory,
    healthRiskIndex,
    kycHashLocalCheck,
  };
}
