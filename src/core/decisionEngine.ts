import {
  ExecutionTarget,
  FieldTransformationDetail,
  SensitivityLevel,
  TaskDecision,
  TaskRequirement,
  TransformationTechnique,
  UserFormData,
} from './types';
import { classifyField } from './classifier';
import {
  bucketAge,
  bucketCreditTenure,
  bucketHealthTier,
  bucketIncome,
  calculateAge,
  createSaltedHashSync,
} from './transformers';

export const REGISTERED_TASKS: TaskRequirement[] = [
  {
    taskId: 'loan_eligibility',
    taskName: 'Loan Pre-Approval & Credit Scoring',
    description: 'Calculates user creditworthiness, approval tier, and maximum borrowing capability.',
    requiredFields: ['monthlyIncome', 'existingDebt', 'creditHistoryYears', 'nationalId'],
    requiresServerResource: false,
  },
  {
    taskId: 'bmi_health_risk',
    taskName: 'Biometric BMI & Health Risk Index',
    description: 'Evaluates personal health indicators and biometric risks.',
    requiredFields: ['heightCm', 'weightKg', 'hasDiabetes', 'hasHypertension', 'isSmoker'],
    requiresServerResource: false,
  },
  {
    taskId: 'dti_ratio',
    taskName: 'Debt-To-Income (DTI) Assessment',
    description: 'Computes monthly debt obligations against gross income.',
    requiredFields: ['monthlyIncome', 'existingDebt'],
    requiresServerResource: false,
  },
  {
    taskId: 'population_benchmark',
    taskName: 'Population Cohort Benchmark Comparison',
    description: 'Compares user financial and health standing against 1,000+ synthetic peer profiles.',
    requiredFields: [
      'dob',
      'monthlyIncome',
      'creditHistoryYears',
      'hasDiabetes',
      'hasHypertension',
      'isSmoker',
      'heightCm',
      'weightKg',
    ],
    requiresServerResource: true,
    serverResourceName: 'Synthetic Population Cohort Model (1,000 records)',
  },
  {
    taskId: 'insurance_premium_band',
    taskName: 'Actuarial Premium Band Lookup',
    description: 'Queries underwriting tables to determine standard insurance premium tier.',
    requiredFields: ['dob', 'hasDiabetes', 'hasHypertension', 'isSmoker', 'heightCm', 'weightKg'],
    requiresServerResource: true,
    serverResourceName: 'Underwriting Actuarial Rate Tables',
  },
];

/**
 * Evaluates execution target and data minimization plan for a given task
 */
export function evaluateTaskDecision(
  task: TaskRequirement,
  formData: UserFormData,
  isOnline: boolean = true
): TaskDecision {
  // Classify all required fields
  const fieldClassifications = task.requiredFields.map(f => ({
    field: f,
    classification: classifyField(f, formData[f]),
    value: formData[f],
  }));

  const hasHighlySensitive = fieldClassifications.some(
    f => f.classification.level === 'HIGHLY_SENSITIVE'
  );
  const hasSensitive = fieldClassifications.some(
    f => f.classification.level === 'SENSITIVE'
  );

  let target: ExecutionTarget = 'LOCAL';
  let reason = '';
  const transformations: FieldTransformationDetail[] = [];

  // RULE 1: Tasks that don't need server-side resources ALWAYS stay local
  if (!task.requiresServerResource) {
    target = 'LOCAL';
    if (hasHighlySensitive) {
      const hsNames = fieldClassifications
        .filter(f => f.classification.level === 'HIGHLY_SENSITIVE')
        .map(f => f.field)
        .join(', ');
      reason = `Computed locally in Web Worker because it requires HIGHLY_SENSITIVE field(s): [${hsNames}]. Zero-Trust Rule: Raw highly sensitive data is never transmitted.`;
    } else if (hasSensitive) {
      reason = `Computed locally because confidential financial/health data does not require remote infrastructure.`;
    } else {
      reason = `Computed locally: task formula is self-contained and operates with zero network latency.`;
    }

    // Populate field transformations
    for (const item of fieldClassifications) {
      transformations.push({
        fieldName: item.field,
        sensitivity: item.classification.level,
        technique: 'STAYED_LOCAL',
        originalSample: String(item.value),
        transformedSample: '[KEPT_ON_CLIENT]',
        explanation: 'Kept in client memory only. Never transmitted across the network.',
      });
    }
  } else {
    // RULE 2: Task requires server resources (e.g. population benchmark or underwriting tables)
    if (!isOnline) {
      target = 'HYBRID';
      reason = `Requires remote resource (${task.serverResourceName}), but network is OFFLINE. Minimized payload will be queued on-device until connection is restored.`;
    } else {
      target = 'HYBRID';
      reason = `HYBRID Execution: Requires remote resource (${task.serverResourceName}). Data minimization pipeline runs locally first: generalizing, hashing, noising, and dropping all raw sensitive fields.`;
    }

    // Build specific transformation entries
    for (const item of fieldClassifications) {
      const field = item.field;
      const rawVal = item.value;
      const sensitivity = item.classification.level;

      if (field === 'dob') {
        const age = calculateAge(String(rawVal));
        const bucket = bucketAge(age);
        transformations.push({
          fieldName: 'dob',
          sensitivity,
          technique: 'GENERALIZED',
          originalSample: String(rawVal) || '1995-06-15',
          transformedSample: bucket,
          explanation: `Exact date of birth generalized to privacy age cohort "${bucket}".`,
        });
      } else if (field === 'monthlyIncome') {
        const bucket = bucketIncome(Number(rawVal));
        transformations.push({
          fieldName: 'monthlyIncome',
          sensitivity,
          technique: 'GENERALIZED',
          originalSample: `$${rawVal.toLocaleString()}`,
          transformedSample: bucket,
          explanation: `Exact salary generalized into categorical band "${bucket}".`,
        });
      } else if (field === 'creditHistoryYears') {
        const bucket = bucketCreditTenure(Number(rawVal));
        transformations.push({
          fieldName: 'creditHistoryYears',
          sensitivity,
          technique: 'GENERALIZED',
          originalSample: `${rawVal} years`,
          transformedSample: bucket,
          explanation: `Specific years bucketed into tenure tier "${bucket}".`,
        });
      } else if (field === 'hasDiabetes' || field === 'hasHypertension' || field === 'isSmoker') {
        transformations.push({
          fieldName: field,
          sensitivity,
          technique: 'AGGREGATED',
          originalSample: String(rawVal),
          transformedSample: '[DERIVED_RISK_TIER]',
          explanation: `Individual medical diagnosis obscured; aggregated into composite risk index.`,
        });
      } else if (field === 'heightCm' || field === 'weightKg') {
        transformations.push({
          fieldName: field,
          sensitivity,
          technique: 'DROPPED',
          originalSample: `${rawVal}`,
          transformedSample: '[DROPPED]',
          explanation: `Raw physical measurement dropped after local BMI derivation.`,
        });
      } else {
        transformations.push({
          fieldName: field,
          sensitivity,
          technique: 'DROPPED',
          originalSample: String(rawVal),
          transformedSample: '[DROPPED]',
          explanation: 'Omitted from payload to enforce data minimization.',
        });
      }
    }

    // Explicitly add dropped fields that traditional apps would transmit
    const droppedHighRisk: (keyof UserFormData)[] = ['nationalId', 'fullName', 'email', 'phone', 'additionalNotes'];
    for (const f of droppedHighRisk) {
      if (!task.requiredFields.includes(f)) {
        transformations.push({
          fieldName: f,
          sensitivity: classifyField(f, formData[f]).level,
          technique: 'DROPPED',
          originalSample: String(formData[f] || 'Confidential'),
          transformedSample: '[DROPPED_ZERO_TRUST]',
          explanation: `Completely excluded from network request. Zero-trust enforcement.`,
        });
      }
    }
  }

  return {
    taskId: task.taskId,
    taskName: task.taskName,
    target,
    reason,
    requiredFields: task.requiredFields,
    transformations,
    offlineCapable: !task.requiresServerResource,
  };
}

/**
 * Runs decisions for all registered tasks
 */
export function evaluateAllTasks(
  formData: UserFormData,
  isOnline: boolean = true
): TaskDecision[] {
  return REGISTERED_TASKS.map(task => evaluateTaskDecision(task, formData, isOnline));
}
