import { describe, it, expect } from 'vitest';
import { evaluateAllTasks, evaluateTaskDecision, REGISTERED_TASKS } from '../src/core/decisionEngine';
import { UserFormData } from '../src/core/types';

const sampleUser: UserFormData = {
  fullName: 'Morgan Doe',
  email: 'morgan.doe@example.com',
  phone: '555-019-4820',
  nationalId: '9876 5432 1098',
  dob: '1990-05-20',
  monthlyIncome: 7500,
  existingDebt: 1500,
  creditHistoryYears: 6,
  hasDiabetes: false,
  hasHypertension: true,
  isSmoker: false,
  heightCm: 178,
  weightKg: 74,
  additionalNotes: 'No previous bankruptcy filings.',
};

describe('Computation Classifier & Execution Decision Engine', () => {
  it('assigns loan_eligibility to LOCAL execution because it uses nationalId and financial data without server requirement', () => {
    const loanTask = REGISTERED_TASKS.find(t => t.taskId === 'loan_eligibility')!;
    const decision = evaluateTaskDecision(loanTask, sampleUser, true);

    expect(decision.target).toBe('LOCAL');
    expect(decision.reason).toContain('HIGHLY_SENSITIVE');
    expect(decision.offlineCapable).toBe(true);

    const nationalIdTransform = decision.transformations.find(t => t.fieldName === 'nationalId');
    expect(nationalIdTransform).toBeDefined();
    expect(nationalIdTransform?.technique).toBe('STAYED_LOCAL');
  });

  it('assigns bmi_health_risk to LOCAL execution', () => {
    const bmiTask = REGISTERED_TASKS.find(t => t.taskId === 'bmi_health_risk')!;
    const decision = evaluateTaskDecision(bmiTask, sampleUser, true);

    expect(decision.target).toBe('LOCAL');
    expect(decision.reason).toContain('Computed locally');
    expect(decision.offlineCapable).toBe(true);
  });

  it('assigns population_benchmark to HYBRID execution when online', () => {
    const benchTask = REGISTERED_TASKS.find(t => t.taskId === 'population_benchmark')!;
    const decision = evaluateTaskDecision(benchTask, sampleUser, true);

    expect(decision.target).toBe('HYBRID');
    expect(decision.reason).toContain('HYBRID');

    // Sensitive identifiers must be dropped
    const droppedFields = decision.transformations.filter(t => t.technique === 'DROPPED');
    expect(droppedFields.some(t => t.fieldName === 'nationalId')).toBe(true);
    expect(droppedFields.some(t => t.fieldName === 'fullName')).toBe(true);
    expect(droppedFields.some(t => t.fieldName === 'email')).toBe(true);

    // Age and income must be generalized
    const generalizedAge = decision.transformations.find(t => t.fieldName === 'dob');
    expect(generalizedAge?.technique).toBe('GENERALIZED');
  });

  it('handles offline condition cleanly by indicating queuing for remote/hybrid tasks', () => {
    const benchTask = REGISTERED_TASKS.find(t => t.taskId === 'population_benchmark')!;
    const offlineDecision = evaluateTaskDecision(benchTask, sampleUser, false);

    expect(offlineDecision.target).toBe('HYBRID');
    expect(offlineDecision.reason).toContain('OFFLINE');
    expect(offlineDecision.reason).toContain('queued');
  });

  it('evaluates all registered tasks successfully', () => {
    const allDecisions = evaluateAllTasks(sampleUser, true);
    expect(allDecisions.length).toBe(REGISTERED_TASKS.length);
    expect(allDecisions.every(d => d.reason.length > 10)).toBe(true);
  });
});
